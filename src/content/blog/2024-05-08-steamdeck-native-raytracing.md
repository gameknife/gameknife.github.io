---
title: "在 SteamDeck 上编出原生光追：8 个 RT Core，33 倍差距，但它跑起来了"
date: 2024-05-08
category: tech
description: "五一在 M3 Max 上做完 Metal 的硬件光追，又在 PC 上跑通了 Vulkan 那版，于是冒出一个念头：能不能在 SteamDeck 上编出原生的 Linux 程序，把光追跑起来？"
tags: ["光线追踪", "Vulkan", "SteamDeck", "vcpkg", "Linux"]
draft: true
---
2024 年的五一假期，我在 WWDC 提供的 Metal 例子上实现了一个硬件光追的 hybrid rendering。

在 M3 Max 上跑出来的效果不错：1080p（fake）能到 120 fps，整体场景的光线反弹和镜面反射都有模有样。

接下来自然是想在 PC 上再实现一遍。很快找到了一个哥们儿写的 demo：**RaytracingInVulkan** —— 用 Vulkan 的硬件光追特性，把 *Ray Tracing in One Weekend* 完整实现了一遍。

在我的 PC 上跑起来了。基本是 ground truth 的光追算法，RTX 4070 上 1080p、1 spp 能有 1000 fps。

跑通之后，一个念头冒出来：**有没有可能在 SteamDeck 上，编译出原生的 Linux 程序，来跑这个光追？**

## vcpkg 这一层意外地稳

这个 demo 用 vcpkg 做依赖管理，所以跨平台这件事在纸面上是顺的。

vcpkg 是微软维护的 C++ 包管理器，类似 pip、npm、nuget。虽然带个 v，但它实际上是为跨平台而生的 —— 上面那上千个库基本都支持跨平台，质量颇高。

C++ 的包管理生态数量上很小，但质量应该是秒杀 npm / nuget 之流的。

也顺带研究了一下 vcpkg 本身，确实做得叼。cmake 那边看得出和微软做了深度融合，工程配置变得异常简单。

在 Windows 上，vcpkg 顺利地拉到并编译出了所有依赖，然后 build，运行。行云流水。

## 到了 SteamDeck 上，四处碰壁

**第一关：没有 gcc。**

SteamOS 上连编译器都没有。`sudo pacman -S base-devel` 装上。

**第二关：库找不到。**

cmake 本地编译出来了，然后开始报各种库找不到。诡异的地方在于，这些库 pacman 显示已经装了 —— 它们是 SteamOS 自带的。

查了一圈才明白：这些库虽然装了，但**开发者文件被剔除了**。系统只保留了可执行的 so，include 和 lib 都没有。SteamOS 毕竟是个游戏主机系统，不是开发机。

解法是用 pacman 把这些库缺失的开发者文件补回来。补完就能编译了。

**第三关：Vulkan SDK。**

下载，设置好 environment，跑 `build_linux.sh`。成了。

## 8 个 RT Core 能跑成什么样

SteamDeck 用的是 RDNA2 的 vangogh，上面**有且只有 8 个 RT core**。

拿改造过的 livingroom 场景对比：桌面 3080 上是 1000 fps（1 ms），vangogh 上是 30 fps（33 ms）。差距大约 33 倍。

差距是很大。但两件事值得说：

**它确实可跑。** 30 fps 不是幻灯片，是一个能交互的实时光追画面 —— 在一台掌机上。

**渲染结果是一致的。** 同一套 shader、同一套算法，掌机上出来的画面和桌面那份一样。这说明硬件光追这条路在移动级功耗的硬件上不是"能不能"的问题，只是"多少"的问题。

## 顺带一提：SteamDeck 上的开发体验

我本来以为要靠远程编辑折腾。结果直接用 VSCode 打开项目文件夹就行了 —— 它会被识别为 cmake 项目，C++ 高亮、智能提示、跳转都相对全面。

在一台掌机上直接改代码、编译、运行，体验可以说非常不错。

## 边界

这套东西的用途目前只是"验证可跑"，不是一个可以出货的路径。

30 fps 是 1 spp 的 ground truth 路径追踪在一个简单场景上的成绩。真要放进游戏，降噪、时域累积、更复杂的场景，每一项都会再吃掉一大截。

另外这里的所有数字都来自我这台机器、这个场景、这个时间点的实测，换硬件或换场景都不能直接搬。
