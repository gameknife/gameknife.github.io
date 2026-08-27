---
layout: post
title: SoftRenderer迁移到github
category: tech
---

昨天花了些时间，将codeplex上的softrenderer v0.3 clone下来，然后做了些改动，迁移到github上。现已上传：

[https://github.com/gameKnife/Softrenderer](https://github.com/gameKnife/Softrenderer)

目前的效率蛮高

head, 640 x 360 px, 2186tri, 135fps

![head](https://raw.githubusercontent.com/gameknife/gameknife.github.io/master/images/blog-add/sr_show_2.jpg "head")

sponza, 640 x 360 px, 78118tri, 27fps

![head](https://raw.githubusercontent.com/gameknife/gameknife.github.io/master/images/blog-add/sr_show_1.jpg "sponza")

这次修改的地方：

* 让softrenderer重新成为一个学习项目
* 将之前的hw renderer暂时去除，以使得其更加纯粹
* 添加除了sponza之外的一些小模型：head, teapot, knox，使后续开发测试有更多资源可选
* 修改了rasterizer中的一处错误，之前的SrRendPrimitive队列结构的建立，没有用到operator new，也就没有进行16字节对齐的内存申请。所以在场景简单时（这个情形和特殊，复杂的场景居然没有问题了），有时在SIMD运算时会有问题。
* 修改了shader constants的大小，之前的192有点太大了，比较耗。

目前的版本还有几处bug，到时候提到issue上

同时，对目前版本还有几个规划：

* 将架构整理的更加简单清晰
* 进一步探索可以优化加速的地方
* 使用最新的intel compiler再测试下速度，特别是avx指令集
