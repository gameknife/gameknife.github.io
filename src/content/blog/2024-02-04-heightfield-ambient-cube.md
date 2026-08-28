---
title: "把 GI 计算搬进纹理空间：我选了 Ambient Cube，不是 SH"
date: 2024-02-04
category: tech
description: "去年那套高度图光照只是一个 SceneCapture 加一个 LightFunction。这次把计算整体挪到纹理空间，用 RenderMaterialToTexture 当 compute 用，辐照数据则选了 HL2 那套 Ambient Cube。"
tags: ["UE5", "全局光照", "Ambient Cube", "移动渲染", "高度图"]
draft: true
---
[年初那套基于高度图的动态光照](/blog/2023-01-15-heightfield-fake-gi/)，最初的契机其实很窄：想做移动端的远距离阴影。

当时移动平台还打不开距离场渲染，基本只剩这一条路。那一版的实现也简单 —— 一个 SceneCapture，一个 LightFunction，去干涉主光的照射范围，得到了一个还不错的结果。

本来准备做个 showcase 推广一下，后来换了工作，时间太紧，就搁置了。

最近导入一批开放世界地形资产的时候，注意到它的远景植被处理是一种更鲁棒的 imposter。跟着实现的过程中配了一个优化过的地形，然后发现：这个地形没有阴影，实在不太好看。

于是想起了年初那套东西，快速接了一版进去。

接上之后，它开始自己往前走了。

## 从 LightFunction 里挪出来

数据已经落到模型上了，自然就会想到纹理处理。

顺着想下去：之前在 LightFunction 里做的那些事，完全可以拆出来放到**纹理空间**里做。而且既然手上有一张高度场，能做的东西一下子多了很多。

比如 sky visibility。之前的考虑是只能在某一个固定高度上算。现在则可以基于高度场，在其上方的指定高度去算 —— 对这类开放世界地形来说，只要在角色所在的高度做一层 sky visibility 和 light bounce，看起来就完全够了。

这个思路有点像我以前在微信小游戏《一刀大师》里做的那版超简化 GI：去掉全部复杂的限制条件，只在思路和最终效果上逼近 GI。看起来是条正道。

## 用 RenderMaterialToTexture 当 compute 用

这次实现的核心，是把大量计算转换到纹理空间，利用 UE 的 `RenderMaterialToTexture` 来做"compute"处理。

目前 PrebakeShadow、PrebakeAO、GI Gen 这三条流程，用一个蓝图就串起来了。

这个用法是我之前完全没想到过的，非常好用。而且因为所有计算都在 GPU 内部完成，数据精度的伸缩性和运行时的可执行性都有了保证 —— 同一套东西，离线能跑，运行时也能跑。

整套流程大致是：

**生成阶段**

1. Cache / Rebuild Scene Terrain（HeightField & IllumSource）
2. Cache / Rebuild Scene Object（HeightField & IllumSource）
3. Rebuild Prebake Shadow & SkyVisibility（含地形与物件）
4. Rebuild Ambient Cube Texture（X±/Y±/Z−，其中 Z+ 来自天光）

**渲染阶段**

1. SkyVisibility 设置到 AmbientOcclusion 上，用来调谐天光
2. AmbientCube 采样 X±/Y±/Z−，设置到 EmissiveColor 上，作为辐照光照

## 为什么是 Ambient Cube 不是 SH

这部分我绕了一圈。

一开始看了一大堆 SH 的文章 —— 毕竟主流做法就是用探针生成 SH 数据，再拿去做辐照。

后来翻到一篇文章，介绍 SH 之余顺带提了一下 Ambient Cube，并且特地强调了它的一个优点：

> 非常易于美术理解，可以让美术自定义辐照环境。

这一句点醒了我。

这套方案本来要的就是简易。而且按我当时算的那笔账：SH 那一份是 27 个 float，Ambient Cube 六个方向加起来是 18 个 float，**并且它们全都是颜色** —— 可以压得更狠。

HL2 时代的技术，看看能不能在这个年代的移动平台上继续发扬光大。

## 工程上怎么存

- **地形**的高程和光照基础数据可以离线生成。颜色走 DXT 压缩，高程压进 16 bit 通道。
- **物件**的辐照走[调色盘编码](/tech/2015/09/07/hw-pallate-tex/)：把 id 和亮度写进一张数据纹理，实时写入，shader 里读出。
  - 因为 GI 实现的特殊性，这里不需要写高程，默认就是地形上方 1–2 米的数据；
  - 自发光物体整体写入颜色 ID；
  - 常规物体根据主光方向，在受光面写一个像素的受光颜色，在背光面写一个像素的天光作用颜色，用来模拟漫反射反弹。
- **Prebake Shadow 和 SkyVisibility** 需要在光源变化或物件移动后更新，所以由 GPU 生成。
- **AmbientCube** 的数据可以考虑由一个 ComputeShader 输出到一套 texture array 上，实时阶段处理。

## 局限

这一条要写在明面上：**所有 tracing 都发生在高度场上，所以 GI 的准确效果只存在于地形高度场上方 1–2 米的位置。**

后续可以在更高的位置再做一层低精度数据来混合。但考虑到大部分物件本来就在这个高度带里，目前先保持单层实现。

## 进度

- [x] 建一个更简易的地形 + 物件场景
- [x] 跑通无 bake 的全流程
- [x] 跑通带 bake 的混合流程
- [ ] 落地到完整的大场景
- [ ] 还原目标场景的效果
- [ ] 增加动态 GI

前三项已经验证过了，后三项还是计划。所以这篇的结论只到"方法成立"为止，还没到"在生产场景里成立"。
