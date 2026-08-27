---
layout: post
title: Vertex Array Object的纠缠
category: tech
---

### ·

前些天，把一件一直想做又没做的工作完成了！将gkRendererGL330调试通过，在OSX, WIN32上跑起来了。

顺便，还完成了另一项壮举，将GL330和GLES2的代码统一了起来。在少量的地方通过宏或者VirtualAPI的方式封装，来区隔开来。

整个过程蛮顺利的，在上安卓真机之前...

### ·

统一的过程，主要就是将近期实现的GLES2上的deferred lighting和到GL330。处理了几个纹理生成，纹理格式的错误之后。
再修改了一下shader的preprocess逻辑，GL330没有经过太多的波折就成功的跑起来了，
（除了昨天发现的一个导致GL330比GLES2画面发暗的bug）。

统一中，主要就是就Vertex Array Object的使用进行了封装。VAO主要有一下几个函数：

* glGenVertexArrays
* glBindVertexArray
* glDeleteVertexArrays

而在iOS中，VAO需要extension支持，就变为了

* glGenVertexArraysOES
* glBindVertexArrayOES
* glDeleteVertexArraysOES

好在只需要宏替换一下函数名，参数以及效果没有太大问题。

而在android的adreno驱动中，也提供VAO的extension支持，但是使用了之后却发现顶点全部花掉。尝试搜索了很久解决方法，也只能放弃。最终在android中只能放弃使用VAO。

因此，最终将VAO的过程抽象为**bind_or_gen_vao**, **use_layout**, **unbind_vao**三个过程。

在三个阶段中根据平台，分别完成

* genVAO/bindVAO 或 bindBuffer
* 非VAO，应用vertex layout
* unbindVAO 或 unbindBuffer

最终，在三个平台上用同一套驱动代码驱动起来。

