---
title: "UE 编辑器一直在打点，我把这份数据接到了自己的 InfluxDB"
date: 2023-05-20
category: tech
description: "工程设置里那个 privacy 选项背后是 StudioAnalytics。断点看一眼它往 Epic 发的 JSON，会发现编辑器早就把研发过程量化好了 —— 只是默认发给了别人。"
tags: ["UE5", "研发效率", "InfluxDB", "Grafana", "数据监控"]
draft: true
---
UE 的工程选项里有一项 privacy：是否上传使用数据。

背后干活的是 StudioAnalytics 这个组件。UE 为此抽象了一种 AnalyticET，专门处理这类"打点"行为。

我一直知道它存在，但没想过里面到底装了什么。这次打了个断点。

## 它到底在发什么

它往 `https://datarouter.ol.epicgames.com` 发的，基本都是这种结构：

```json
{
    "Events": [
        {
            "EventName": "Editor.Usage.BlueprintCreated",
            "DateOffset": "+00:00:27.881",
            "ParentType": "Native",
            "ParentClass": "AnimInstance",
            "ProjectId": "F8B42CE645686A5A541E72B264A8AB94",
            "BlueprintId": "D6E2EAF84328B81BF686C0B4B3A5B885"
        },
        {
            "EventName": "Editor.Usage.Heartbeat",
            "DateOffset": "+00:00:27.221",
            "Idle": false,
            "AverageFPS": 0.102333,
            "AverageFrameTime": 16.448084,
            "AverageGameThreadTime": 9.804644,
            "AverageRenderThreadTime": 5.396903,
            "AverageGPUFrameTime": 16.381613,
            "IsVanilla": false,
            "IntervalSec": 60,
            "IsInPIE": false,
            "Is5MinIdle": false,
            "Is30MinIdle": false
        },
        {
            "EventName": "Editor.Usage.PIE",
            "DateOffset": "+00:00:52.328",
            "PlayLocation": "DefaultPlayerStart"
        }
    ]
}
```

看到 Heartbeat 那一段的时候我愣了一下。

`AverageGameThreadTime`、`AverageRenderThreadTime`、`AverageGPUFrameTime`、`Is30MinIdle` —— 这就是"每个人的编辑器现在跑得有多卡、卡在哪个线程、有没有在空转"。每 60 秒一条。

再加上 PIE 的次数与位置、蓝图创建、音频设置……编辑器早就把研发过程量化好了。只是这份数据默认发给了 Epic，而不是我们自己。

## 落到哪里去

GitHub 上有个做游戏 devops 的人开了个项目 `ue5_studio_analytics`，把 UE 的 analytics 接到自己后端：写一个服务器接 API，数据直接落 MongoDB，再用 Grafana 做可视化。

思路可行。不过我看到另一条线索：RoboMerge 的作者 —— 也就是 Epic 内部做 devops 的那位 —— 他的 analytics 用的是 InfluxDB。

顺着查了一下，InfluxDB 是时序数据库，比通用文档库更贴合这种按时间打点的数据。Grafana 对它有原生支持。而且它直接支持 URL API，意味着这一环可以做成 serverless，不需要自己养一个后端。

注册了一个免费的云服务，前后 20 分钟，整条链路就通了。

最终的流程只剩一句话：**把 UE 发出来的这份 JSON，转成 InfluxDB 接受的 Line Protocol，通过 URL API 落到云上的 InfluxDB。**

## Line Protocol

这是 InfluxDB 的核心，数据组织方式很简单：

- **measurement** —— 项目，比如上面的 `Editor.Usage.PIE`；
- **tags** —— 类别，来自 StartSession 上的属性，比如机器名称；
- **fields** —— 实际数据，比如 `PlayMode`、`PlayLocation`；
- **timestamp** —— UNIX 时间戳。

tag 和 field 的划分是唯一需要想一下的地方：tag 会建索引、适合用来切分和过滤（机器、分支、平台），field 是被聚合的量（耗时、FPS、次数）。分错了，后面 Grafana 上的每一次查询都会难写一点。

## 为什么值得做

单看一条 Heartbeat 没有任何意义。它有意义的形态是"一条曲线"。

编辑器启动时间这个月是不是变长了，PIE 的平均耗时有没有回退，某台机器的 GPU frame time 是不是明显比别人差 —— 这些问题没有数据的时候只能靠感觉，而且只能感觉一次。

有了曲线，"变慢了"才变成一个可以定位、可以归因、可以回归的事实。

## 边界

这份数据是**开发期的编辑器行为数据**，不是玩家数据。它落到哪、谁能看、保留多久，这些应该在开团队之前讲清楚 —— 那个 privacy 选项本来就是为了让人有得选。

我做的这一版只到"通了"为止：数据能落、Grafana 能画。要真正用起来，还差告警、差和构建数据的关联、也差一份说明白采集范围的文档。
