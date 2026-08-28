---
title: "两台家用机撑起 UE5 的四平台 CI"
date: 2021-10-13
category: tech
description: "3900X 跑 Windows / Android / LinuxDS，DeskMini 跑 iOS。部署过程中顺手改了几个 UE5 出包的坑，也确认了 Android 的 Vulkan SM5 这条路现在还走不通。"
tags: ["UE5", "CI", "GitHub Actions", "Android", "iOS"]
---
这几天在给 think-procedural 部署构建机。

目标很朴素：四个平台的包，我自己按一下就能出来，不用记步骤。Windows、Android、LinuxDS 交给 3900X，iOS 交给 DeskMini。

两台机器基本上就够应付现有的 CI 和 release 需求了。

部署过程中改了几个 UE5 出包的问题，这里记一下 —— 这类问题的特点是，撞上之前你根本不知道它存在。

## Android 出 SM5 包，Lumen 的 global shader 编不过

Android 打 SM5 包的时候，Lumen 的一个 indirect lighting global shader 编译报错。

处理方式和引擎对待 Metal 的做法一样：让这个平台直接跳过这个 shader 的编译。global shader 本来就有按平台裁剪的口子，在 `ShouldCompilePermutation` 里把这个平台挡掉就行。

之后就是一些无关痛痒的常规问题了。

## `-iterate` 和 `-fastcook` 是全局开关

这个坑更值得写。

我一开始把 `-iterate` 和 `-fastcook` 当成本地加速选项留着，觉得反正只是省时间。

它们影响的是所有平台，不只是"只改了代码"的那种情况。留着它们，出来的包就不可信 —— 你不知道手里这个包里的资源到底是这次 cook 的还是上一次留下的。

现在的做法是：默认全部 `-noiterate -nofastcook`，只有 general CI 执行的时候，再把它打开。

CI 的价值建立在"每次都是干净的一次"上。为了省十分钟破坏这个前提，不划算。

## Android 的 Vulkan SM5：试了，退回去了

顺手试了一下在 Android 上开 Vulkan SM5 renderer。撞了三堵墙：

1. 先是 fallback 回 ES3.1。这个可以通过 `r.Android.DisableVulkanSM5Support=0` 绕开。
2. 绕开之后，会遇到一个 depth stencil readonly 和 write 冲突的 ensure。
3. 进游戏之后，还会遇到 uniform buffer 设置时不能设置 uniform storage tex buffer 的问题。

到第三条我就停了。这几个问题不像是我的用法不对，更像是这条路径本身还没准备好。

所以最终的平台策略是：

- **Android 用 ES3.1**，保最大兼容性；
- **iOS 打开 desktop forward renderer**，换更好的效果。

同一个引擎，两个平台走了相反的选择 —— 一边求稳，一边求好。这不矛盾，因为 iOS 的硬件下限和驱动一致性本来就比 Android 高得多。

## iOS 现在的状态

desktop forward renderer 在 iPad Pro 上跑起来了。两个已知问题：

- 生成线程只开了两个。这个数字是写死的，感觉应该直接按核心数来。
- 某些角度只有 40fps。初步 profile 是 GPU bound，还没往下查。

## 打包体积

shipping 这边修了一些问题，并且在打包时把 Windows 的纹理也缩减到 512，使得发布版大概 300MB 左右。

后续做一些资源打包控制，可能还可以更低。对一个过程生成项目来说，包体里本来就不该有太多成品资源。

## 顺带把 workflow 重新维护起来

之前写的几个 GitHub Actions 的 yml 也修整了一遍，包括 tag 到 release 那条链路。

改这些的时候有一个感受：流水线好不好用，和投入的人数不是一回事。决定它质量的，是有没有人真的每天在用它出包 —— 一条没人用的流水线，写得再规整也会在第一次真实需求面前散架。

## 还没解决的

- iOS 的 GPU bound 没查完；
- 生成线程数写死，要改成按核心数；
- 增量 cook 我现在完全不敢开，但每次全量 cook 的时间迟早会成为问题。这件事只是被推迟了，没有被解决。
