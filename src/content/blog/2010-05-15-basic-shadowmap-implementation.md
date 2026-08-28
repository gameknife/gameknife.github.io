---
title: "基础ShadowMap实现"
date: 2010-05-15
category: tech
description: "花了将近一天的时间，终于做好了GameKnife v0.9.6的ShadowMap系统。 上图： 整体效果 远看效果很棒了，设计有平行光和SPOT LIGHT两种阴影模式 这里使用的是平行光阴影 局部效果1 shadowmap的尺寸是10241024，细节上还是锯齿比较大 局部效果2 加上之前..."
tags: ["DirectX", "ShadowMap", "阴影", "渲染"]
draft: false
---

花了将近一天的时间，终于做好了GameKnife v0.9.6的ShadowMap系统。

上图：

> 整体效果

> 远看效果很棒了，设计有平行光和SPOT LIGHT两种阴影模式

> 这里使用的是平行光阴影
> 
> 
> 
> <div class="img-lost"><b>[ 配图已遗失 ]</b> 早期博文配图（原外链已失效）</div>

> 局部效果1

> shadowmap的尺寸是1024*1024，细节上还是锯齿比较大
> 
> 
> 
> <div class="img-lost"><b>[ 配图已遗失 ]</b> 早期博文配图（原外链已失效）</div>

> 局部效果2

> 加上之前的全屏辉光，效果很棒
> 
> 
> 
> <div class="img-lost"><b>[ 配图已遗失 ]</b> 早期博文配图（原外链已失效）</div>

> 材质的CastShadow和ReceiveShadow

> 为材质设计了产生和接受阴影的属性，方便控制阴影的产生

> 此图关闭了FLOWER的cast和receive属性
> 
> 
> 
> <div class="img-lost"><b>[ 配图已遗失 ]</b> 早期博文配图（原外链已失效）</div>

今天就写到这里，目前系统还封装得不是很完善，对锯齿的控制也还有待研究。

今天关注了一些流行的SHADOW MAP算法，其中PSM, CSM应该比较容易实现，并且可以有效解决锯齿和实现软影，决定有时间进行深入研究。

目前GameKnife渲染部分的功能基本实现完全了，大概花一周时间再次封装和设计，便准备进入结课游戏的制作中去了。
