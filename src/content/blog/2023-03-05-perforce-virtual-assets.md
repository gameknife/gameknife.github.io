---
title: "Virtual Assets：把纹理的 bulk data 搬出主库，主库小了一半"
date: 2023-03-05
category: tech
description: "一直以为解决 UE 资产库膨胀的是 Zen Store，其实是 Virtual Assets。思路和 Unity 的 meta、git lfs 一样朴素：元数据留在主库，二进制搬到别处。"
tags: ["UE5", "Perforce", "资产管理", "研发效率"]
draft: true
---
这个东西是和 Epic 中国的老师交流时得知的。

在那之前，我一直以为解决资产库膨胀的方案是 Zen Store。结果不是 —— 是 Virtual Assets。

## 思路朴素到有点眼熟

Virtual Assets 干的事情，一句话就能说完：把大尺寸的 bulk data 和资产的元数据分离。

主库里只保留元数据，bulk data 单独存在别的位置 —— 在 UE 的语境下，这个"别的位置"基本上只有一个选择：Perforce 的另一个仓库。

要找参考的话，最近的可能是 Unity 的 meta 文件，或者 git lfs。

之所以对纹理特别有效，是因为纹理的那一大坨二进制**基本不会改变**。它每次都跟着元数据一起被拉下来、一起被存进历史，纯属浪费。

收益有两层：主库的存储量大幅下降；拉主库变快。而且你不使用的 bulk data，永远不会被拉到本地。

## 实操踩到的三个坑

Virtual Assets 现在还标着 beta，所以我先自己测了一遍。

只要 Perforce 服务搭好了，跟着官方的 quickstart 基本就能用起来。但有三个地方会卡住：

1. **Perforce 库需要设置 partitioned 属性**，这样才能建 partitioned 的 workspace。
2. **ignore 设置里不要包含 saved 文件夹**，否则 upayload 文件提交不上去。
3. **depot 库不能是 streaming 的库。** payload 上传产生的提交来自一个非 streaming 的 partitioned workspace，如果 target 是 streaming 库，就无法产生提交。

第三条我卡了最久 —— 现在大家的库基本都是 stream，很容易想当然。

## 效果

目前 VA 其实只支持纹理。

但纹理基本上就是资产的最大头。只处理纹理这一项，主库的存储占用就已经小了大约一半。

## 边界

**商业项目我暂时不会用。** 它还是 beta，如果后续 storage 策略发生变化，最坏的情况是数据损毁。等它标成 production 之后再说。

现在做的这一轮，价值在于把坑先踩完 —— 等到能用的那天，不用从零开始摸。

参考资料是 Epic Japan 关于 UE5.1 World Building / Core 的那份分享，里面有涵盖 VA 的部分。
