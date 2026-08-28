---
title: "在家搭一套 Jenkins：service 模式的 agent 看不见 GPU"
date: 2023-06-03
category: tech
description: "Jenkins 新版本已经能平替 GitLab CI 和 GitHub Actions，还原生支持 Perforce。踩了几个坑之后跑起来了 —— 真正的收益不是构建更快，是点完包我可以立刻做下一件事。"
tags: ["Jenkins", "CI", "研发效率", "InfluxDB", "UE"]
draft: true
---
前段时间在研究 CI 流程的演进，索性在家里也搭了一套。

Jenkins 的新版本感觉做得越来越现代了。整体用下来，它基本可以平替 GitLab CI 和 GitHub Actions，而且原生支持 Perforce —— 这一条在 UE 的语境下几乎是决定性的。

## 踩到的几个坑

**service 模式启动的 agent 调不了 GPU。** 这是 Windows 的限制，不是 Jenkins 的问题。解法是把 agent 改成 websocket 方式连接（类似 GitHub Actions 的 self-hosted runner），限制随之消失，环境配置也更方便。

这个坑对做游戏的人是致命的 —— 出包、烘焙、跑真机截图，没有 GPU 一步都走不下去。而它的表现是"任务能跑，但结果不对"，不是直接报错。

**pipeline 有两种模式。** 一种是基于 node 的基础模式，一种是基于 pipeline 的进阶模式。后者更接近 GitLab CI、Travis CI 那种结构，做整合更合适。

**执行代码块也有两种写法。** 原生 groovy：

```groovy
script {
    echo "hello"
    env.Custom = "hello"
}
```

或者本机的 shell / bat：

```groovy
sh '''
echo "hello"
'''
```

差别在于：只有 groovy 脚本能直接访问 pipeline 上的变量。不过位于 env 区域的变量已经设置到了环境变量里，shell 那边也能直接读。

顺带一提，Windows 机器只要把 git 自带的 `sh` / `nohup` 配到 PATH 里，也可以执行 shell 块。

## 通知和数据这一层要自己补

Jenkins 原生给了流水线配置脚本和 email 通知。email 可以先用起来，但自建环境需要更自定义的通知方式。

我的规划是在每次任务的 report 阶段，把关键信息通过 restful api 提交到时序数据库：

- 耗时；
- 成功与否；
- 出档数据；
- error / warning 数量；
- error log。

然后用 Grafana 抓这份数据做持续的健康监控。任务成功或失败时，再通过 restful api 走邮件 / IM 通知到对应的人。

家里这套的技术栈就是：Jenkins + InfluxDB + Grafana + 一个 koa 写的服务器。

koa 那一层负责 query 时序数据库，把最新的版本信息呈现出来，提供构建产物的下载链接，同时也提供 Jenkins 后台和 minio 存储桶的入口 —— 相当于一个统一的管理平台。

它其实是我之前那个 devhub 的改造升级版。区别在于这次整套系统全部是自己搭的，不再需要和别人对接，架构上反而更利索。

## 真正被服务到的那一次

搭好之后，说实话有一阵子基本没实际用上。

直到今天被它服务了一把，才想起来记一笔。

今天要做一个多平台的 uniform 控制 dynamic branch 的可行性测试，需要在真机上反复验证结果。这种事的常规流程是：插手机到电脑上，本地出包，`adb install`，手动运行。每验一次重来一遍。

有了 CI，流程变成了：点包，网页上点下载，更新 APK，运行。

整圈快了非常多。但更关键的是另一件事 —— **点完包之后，我可以立刻开始下一个 case 的开发**，而不是守着本地的编译等它结束。

省下来的不只是构建时间，是那段本来只能干等的注意力。

## 边界

这套东西是给一个人用的。多人协作要考虑的并发、权限、workspace 复用、缓存，我一条都还没碰。

数据监控那一层目前也只有构想加一个能跑的雏形，离"出问题会主动找上门"还差得远。
