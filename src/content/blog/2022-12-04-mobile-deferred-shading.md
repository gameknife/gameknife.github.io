---
title: "移动端延迟渲染是伪命题？七年后我推翻了自己的结论"
date: 2022-12-04
category: tech
description: "2015 年我在 gkENGINE 上试过一版移动端延迟渲染，结论是伪命题。这次跟着 UE5.1 的 mobile deferred 重新测了一遍：真正的分水岭不在算法，在 g-buffer 有没有离开过 tile memory。"
tags: ["UE5", "移动渲染", "TBDR", "延迟渲染", "带宽"]
draft: true
---
先说结论的来源：这个成见是我自己种下的。

大概 2015 年，iPhone 5s 的时代，我在 gkENGINE 上实现过一版实验性的移动端 deferred lighting。那会儿还没有 MRT，整个流程是按 IMR 的思路搭的：

1. basepass，把法线写进"g-buffer"，深度是一张可读的 rendertexture；
2. lighting pass，读 g-buffer，处理点光源、间接光（阴影、遮蔽）和天光；
3. shading pass，把 lighting 的产出和主光合成，得到最终结果。

在 iPhone 5s 上跑得算顺，计算量其实没比 forward 多太多。但发热和功耗完全控制不住。

问题出在流程中间那几次 framebuffer 的重新绑定 —— 用今天 Metal 的话说就是 buffer 的 load/store，每一次都是直接和主存打交道。帧率还看得过去，机器烫得拿不住。

于是我给移动端延迟渲染打了个标签：伪命题。这个标签一挂就是七年。

## 是什么让我重新去看

UE5 的 mobile deferred 最近更新得比较频繁，从 5.0.3 跟到 5.1，Light Function、IES Light、Particle Lighting 都支持得不错，Epic 官方也把它标成了 production。

我重新跟了一遍 Epic 的流程，顺带把 Metal 2 / Metal 3 的文档和 Apple Silicon 的 GPU 实现翻了一次。确实很久没看这么底层的东西了 —— 上一次认真读还是 iPhone 5s 那会儿，用 OpenGL 的 `framebuffer_fetch` 扩展做零开销的 color grading 和 height fog。时过境迁，Apple 现在已经完全抛弃 OpenGL 了。

而 Metal 下面躺着一整排为 TBDR 准备的设施：memoryless texture、lossless compression、lossy compression，目标基本都是同一个 —— 在功耗和性能之间找平衡。

其中 memoryless texture 是关键的那一个。

## 我当年走的是哪条弯路

传统 IMR 上的延迟渲染流程，搬到 TBDR 设备上大致是这样：

1. basepass 往 MRT framebuffer 写 g-buffer，pass 结束时 store 进 system memory；
2. lighting 和 composition 从 system memory 把刚写好的 g-buffer 采样回来，算出最终画面，再 store 回去。

在 TBDR 架构下，g-buffer 本来就是先在 tile memory 上生成的。上面这个流程等于让它先出去一趟，下一个 pass 再读回来。这一进一出，就是移动端最贵的那笔开销。

Epic 官方 demo 在这条路径上实测的带宽，g-buffer 的 store/load 大概是 34 MB / 21 MB。

真正适合 TBDR 的写法是 single pass deferred：basepass 和 lighting pass 合在一个 pass 里，g-buffer 写进 tile memory 就地被读走，system memory 上没有任何读写。同一个 demo 换到这条路径，上面那 34 / 21 MB 直接消失了。

延迟渲染在移动端最大的痛点，是被这样绕过去的，不是被优化掉的。

多写一句：移动端是统一内存架构，带宽被占掉的后果不止是拖帧率，它还会影响 CPU 对内存的读写，甚至影响到逻辑帧率。所以省带宽在移动 GPU 上是重中之重 —— 而一个没有带宽顾虑的延迟渲染结构，才让它在移动端重新成为一个可选项。

## 真机上到底差多少

理论说得通，还是要自己测。

- 测试场景：Meadow
- 测试机型：iPad Pro 11" 2018，2388 × 1666
- 垂直同步：60 fps，众生平等
- 三档分辨率：Low 50%、Medium 66%、High 100% ScreenPercentage

结果比我预期的温和：

主存带宽 deferred 确实低一些，但原因有点朴素 —— forward 多写了一张 depthaux，而 deferred 那份直接处理在 memoryless 纹理里了。

性能上，deferred 把原本单一的 shading 拆成了 basepass 和 shading pass。shading pass 是一个全屏处理，单像素复杂度更高，但**没有 overdraw**。所以在分辨率不算太高的时候它是赚的；分辨率一高，全屏 shader 的复杂度就开始吃掉这份收益，效率反而略有下降。

功耗这项我得诚实交代：充电到 90%，拔线跑 10 分钟对比耗电，deferred 6%，forward 6%，没有明显区别。可能需要更长的测试时间才分得出伯仲 —— 目前这组数据不支持"deferred 更省电"这个说法。

## 顺手修的两个东西

测特性的过程中撞到两个小问题，都在 5.1 原版上：

- **粒子光照**：用 Niagara 做了个类似萤火虫的粒子，打开粒子光照之后画面质感提升非常明显。但原版会判断 mobile 就不把 simple light 送进渲染器，得先把这条判断拿掉。
- **Light Function**：这是我认为动态光照最出彩的用法 —— 模拟太阳被云层偶尔遮住，静态画面也会产生很有趣的变化。原版的问题是它把天光反射这类间接光照也一并遮掉了。

另外 IES Light 可以很方便地做出神秘海域那种手电筒效果，DeferredDecal 也终于是真正可用的贴花了，能混合修改任意 PBR 参数 —— 用好了应该能省掉不少特殊资产和材质混合。

## 边界

这次的结论是：mobile deferred 可以投入实际生产。但它绑着几个很具体的前提。

它成立的前提是 TBDR 加 memoryless texture。在没有这套设施的硬件上，我 2015 年那版失败的原因一个都不会消失。

它也不是无条件更快。分辨率越高，全屏 shading pass 越不划算，这个拐点在哪，得在自己的目标机型上量。

功耗上我没有测出优势，别拿"deferred 更省电"去说服美术或者立项。

至于我七年前那个判断 —— 它在当时的硬件上是对的。错的是我把它当成了结论，而不是当时那批硬件的一个属性。
