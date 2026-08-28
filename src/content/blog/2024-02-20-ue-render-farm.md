---
title: "UE 的 Render (Remote) 只是新开一个进程，渲染农场还得自己搭"
date: 2024-02-20
category: tech
description: "看到 Remote 这个名字，我以为网络那一层 Epic 已经做好了。点开才发现它只是在本机拉起一个新进程。于是用 KOA + WebSocket 自己接了一套。"
tags: ["UE5", "MovieRenderQueue", "渲染农场", "WebSocket", "工具链"]
draft: true
---
UE 新版的 Render (Remote) 功能走的是一种 New Process Executor：

把 RenderQueue 导出成 `QueueManifest.utxt`，配上一组命令行，就能从一个新进程拉起一次 MovieRender。

看到 Remote 这个名字，我本来以为网络这块 Epic 已经搭好了。

结果它只是本机的独立进程启动。

那 render farm 这一块，只能自己来了。

## 先找巨人

这类事情我习惯先看别人怎么做。

**AWS Thinkbox Deadline** 看起来是一个相当能打的渲染农场管理平台，Epic 社区里也有一篇基于 python 的 executor 实现，接的就是它。

但整体量级太重，而且依赖外网。对我要解决的规模来说不合适 —— 不过其中的一些思路可以借鉴。

## 牛刀小试

渲染任务的发起需要一个中心服务器。我手上正好有一个 KOA 服务器，准备拿它改造一下，顺便练手 WebSocket。

（这台 KOA 现在承载的东西太多了，其实按 controller 拆出去是可行的，最近正好一起动一下，也能吃上原生的多核优势。）

整体结构：

- KOA 服务器开一个新的 renderfarm controller，启动一个 WebSocket；
- 新写一个基于 TypeScript 的 WebSocket 客户端，跑在 agent 机器上执行渲染任务；
- Web 前端提供 agent 状态查看和 render output 的查看。

一个渲染任务分三步：

1. 通过 `ugs cmd` 拉取最新的二进制版本（这一版先忽略 content，只拉二进制）；
2. 用传入的 cmdline 和 queuemanifest 启动 UnrealEditor 执行渲染任务；
3. 把本地的渲染结果上传到归档仓库。

序列帧那一头还在研究 cmdline encoder，打算用 ffmpeg 把它压成视频。exr 的支持要再单独研究。

## 几个技术细节

**agent 打包成单 exe。** 用 nodejs 21 官方提供的 single executable 功能，把 agent 控制程序打成一个 exe，部署起来省事得多。

**MRQ 实例启动要轻。** 把 MRQ instance 的启动逻辑做了轻量化，能快速拉起。

**归档走 minio。** agent 里直接用 minio 库完成渲染结果的归档和 list。

**WebSocket 要留 30 秒心跳。** 这一条是踩出来的：nginx 有自动断连机制。心跳同时也能防住一些不可预知的断链 —— 服务端可以及时清掉失效客户端，而不是留一堆假的在线 agent。

**agent 放在 workspace 根目录**，自己通过 ugs cmd 取最新 binary。

所以现在部署一台新 agent 只有三步：

1. 手动拉一个 ugs workspace；
2. 把 `renderfarmagent.exe` 拷到 workspace 根目录；
3. 执行它。

## 还差什么

这版能跑，但离"能托管"还有距离：

- Job 排队机制 —— 现在没有 agent 可用时不会排队等；
- 服务器上的进度展示；
- 发起端的进度通知；
- 归档管理 —— 目前是展平的目录，靠手工清理；
- agent 的守护进程 —— agent 意外退出后不会自动重新拉起。

最后一条最要命。一个需要人去登录机器重启的农场，本质上还是手工渲染，只是手工的位置换了一个地方。
