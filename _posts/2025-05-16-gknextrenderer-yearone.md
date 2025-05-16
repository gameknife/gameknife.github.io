---
layout: post
title: gkNextRenderer - YearOne
category: tech
---

去年五一节结束后，在RayTracingInOneWeekend项目的基础上，开始了gkNextRenderer的学习。一开始的目的很简单

* 学习现代渲染
* 学习硬件光追
* 大量的写一些自由代码

正好现在刚过了今年的五一节，是时候做一个正式的年度总结了。



这几天看到zeux大佬分享的一篇文章，他里面的一句话，感同深受：

> my working level of rendering stopped around “late PS3-early PS4” level, notably excluding ray tracing, bindless, the exciting world of temporal jitter and “boiling soup of pixels” and other revolutionary advances since.

这简直是我的嘴替，我的渲染知识也是停留在了dx11时代，硬件光追，bindless，各种基于样本的渲染技术，通通的都错过了。这么多年主要是在搞移动平台的渲染和优化，以及各种系统的来回嫁接。在那之前，我还可以说我是一个图形程序员，现在我都不太听得懂其他人在说什么了...

内心的动力有了，就差一个契机，这个契机就是我买了一台支持硬件光追的M3Max笔记本，这台电脑算是我的现代渲染启蒙，我从苹果的官方例子开始，了解硬件光追的一些事情。后面，我回到了桌面平台，我了解到了这个基于vulkan的硬件光追项目，RayTracingInOneWeekend。并同时又仔细的读了一遍原文。

作者的实现比较鲁棒，我又顺着NextWeekend, RestOfYourLife把后面的重要性采样，NEE等科目作了一遍。然后便开始思索，如何做实时的路径追踪。硬件来做，目标就是实时嘛。

当然，这方面其实也有很多人做得非常深入了，最新的UE5，也有一个完全基于硬件PathTracing的渲染器，并且有不俗的渲染质量，Nvidia的工程师很强。（不过这是后话了，当时刚涉足这个领域的我，并没有看到如此多的论文和信息，当然不知道那时如果看到了这些，会不会干脆就放弃了）

从实时路径追踪这个目标开始，慢慢的做了很多课题，就做到现在了。中间的过程，都是些比较繁琐的流水账，这里就按下不表了，写几个剖有感悟的点。作一个总结

## hardware-raytracing

硬件光追其实已经出现很多年了，从2060开始，可以说，现在steam上80%的机器都可以跑硬件光追了。一开始我是不太相信硬件光追能够成气候的，特别是rtx20时代。我的3080的显卡，感觉也就顺跑一个control，control效果是不错，不过他也是混合光追架构。2077的pathtracing渲染模式倒是非常惊艳，但是性能让我有点不敢相信。

直到开始自己实现硬件光追，我基本认定，未来应该是硬件光追的。甚至可以颠覆现在的渲染架构。

* 显卡厂商现在的着力点在这里，rtx20到50系，光追渲染性能的提升是光栅化性能的很多倍。
* 真正的照片集真实感，只能基于pathtracing。pixar和disney电影的这种渲染风格，也只能依靠pathtracing
* 真正的pathtracing已经被很多demo实现了（当然不是所有工况下）

因此，全面拥抱硬件光追，是一件必要的事情。RayTracing Gem上也有很多文章，并且有很多颠覆传统光栅化管线的做法。

## pathtracing

路径追踪其实才是最简单的渲染，RTIO的原始实现十分简单。根据材质的属性，向合适的方向，随机发射射线，遇到阻挡后，用diffuse来叠加，最终如果找到了光源（天，lightquad），用lightcolor叠加前面的diffuse结果，就得到了最终颜色。如果在n次内都没有找到光源，则此次追踪被抛弃。伪码写出来就这么几行

```glsl
vec3 org = getViewPos(camera)
vec3 dir = getViewRay(camera)
vec3 raycolor = vec3(1)

for i in n:
  rayContext ctx = traceScene(org, dir)
  if(ctx.m.type == TYPE_LIGHT)
    return rayColor * ctx.m.color;
  rayColor *= ctx.m.color;
  org = getHitPos(ctx);
  dir = getNextDir(ctx);  
```

最朴素的硬件路径追踪，shader代码量应该可以低于100行。

不过完整的pathtracing跑下来，实时性能还是比较难，因此目前出现了非常多的论文和talk，在讨论如何优化，如何做重要性采样，重要性重采样，xxxx采样。gkNextRenderer的PathTracing渲染器，使用了部分基础的优化策略，但更多的优化策略，还是需要从样本复用的角度来考虑。基于时空的样本复用还没有认真研究过蓄水池结构，而是自己在初期开发的reproject结构，基本够用。一定思路是类似蓄水池结构样本复用的，第二年的开发计划，应该要把蓄水池结构啃下来。

## visibilitybuffer

visibilitybuffer最早是由这篇论文提出的，解决的主要就是传统gbuffer在高overdraw的情况下，开销过大的问题。我是在做好了第一版pathtracing的情况下，开始看这个visibilitybuffer的。发现visibilitybuffer，刚好可以通过光栅化来完美替代primary ray。

visibility buffer有一些工程上的细节问题，一个问题就是现有api无法解决取得triangleId的问题（从硬件实现细节上看可能本就没有这个数据）。最暴力的做法把顶点全部裂开，每一个三角形都用独立的顶点，顶点上直接写上triangleId，这样在vs阶段，直接取顶点上的值输出即可。当然，公认的优化办法是使用provoking-vertex（激发顶点），在处理mesh的时候，对triangle进行精心排布，可以用较少的顶点开销达到同样的目的，zeux大神的mesh-optimizer库可以处理这个问题。

visibilitybuffer的传统用法，是用来解耦场景，把顶点信息和instance信息写在一个thin-gbuffer里，写入成本和读取成本都很低。然后后续使用一个个都compute shader，按照严格的顺序一次处理thin-gbuffer上的像素任务，最终完成shading。

## hybridtracing

路径追踪的最大问题，就是射线次数太多了，射线打得也太长了。消耗主要在求交。因此需要一种能够节省射线的渲染流程。visibilitybuffer可以节省掉第一次的primary-ray。second-ray可以使用硬件追踪，但可以减小距离，主要处理较近距离的遮蔽和反射效果。后续的ray，就可以考虑使用一些“cache”的数据了，最终基本能做到接近pathtracing的效果，但是每像素只有1-4次短距离tracing。

gkNextRenderer的hybridrenderer，在city场景可以做到2k@120fps

在slang统一了shader codebase之后，考虑对于不同的material type，可以选额在primary ray打到玻璃之后，走真正的pathtracing。

## tracing-gbuffer

这是一个反向的混合渲染，依赖一个primary-ray来替代传统的光栅化渲染，输出的结果是visibilitybuffer，后续的操作，即可走传统光栅化的后续流程了。

gkNextRenderer的reverse-hybird-renderer即是使用这个技术，整体渲染只有几个computeshader，传统光栅化的各种裁剪，drawcall优化的技术都不复存在了。

## vcpkg

vcpkg是c++的包管理器，由微软在github上开源维护。类似nodejs的npm。之前写c++，各种库的配置是最麻烦的一个过程，当然也有历史原因，那个时代，没有特别多的开源库，因此很多库只提供了各种编译器版本的lib和dll供使用。而现在这个时代，大量的开源库迸发，vcpkg的思路就是依赖开源库，cmake，在所有（尽量是）平台上自编译出静态库，使用作者写好的cmake为使用者提供编译支持，非常的方便。

gkNextRenderer使用了大量的vcpkg，当然，也有少部分的thirdparty代码（后续可以考虑帮这些库port一下），所以整个跨平台的编译开发都异常方便，基本所有功能都可以在我的多台设备上立即提供支持。

## cross-platform

gkEngine之前也支持跨平台，但是支持得很笨重。几乎可以算是在每个平台上实现了一个渲染器，部分核心代码做了跨平台编译。很多模块没有跨平台的支持。维护起来很复杂，渲染几乎就是完全不一样的，只有和场景接口的那一块保持了一致。

这次做gkNextRenderer，跨平台的需求放在了最前面，目前可以说是几乎100%跨平台。

* 选择vulkan，这是目前唯一一个可以实现完全跨平台的图形api。
* 第三方库都有意识的选择的能够跨平台的，尽量精简的实现。
* 利用github action，完成跨平台的ci，使得每一次PR，都有跨平台的编译检查，让每一次提交都是可以在所有平台上编译的。
* 周期性的全平台测试，我基本每周都会用我的mac笔记本，android手机，steamdeck跑一次阶段成品。以完成运行时的校验。

## bindless

bindless是现代渲染的一个重要组成部分，依赖现代gpu的address访问的机制。让渲染资源的访问，可以几乎自由的跑在gpu内部。bindless的出现，是我这次学习感受最为明显的。有了bindless，cpu的工作只是把gpu需要的资源，组织到一起，告诉gpu。光追时，gpu本就只能自由的根据hit的结果来访问需要的三角面，材质，纹理。而对于传统光栅化管线，也省去了之前逐个drawcall的多层级的寄存器绑定。只需要给一堆地址，gpu可以利用instanceid和triangleid，直接计算出顶点，材质，纹理的取用地址，然后在对应的资源上取值运算。

之前通过renderdoc，观察到诸如R星的荒野大镖客，Decima的地平线系列，他们的shader部分异常精简，基本都是使用了bindless，去掉了繁琐的传统渲染结构，实现高复杂度的场景。

## tinybvh

tinybvh是jacob的一个开源库，纯头文件实现的cpu/gpu加速的快速bvh查询。在cpu上可以做到惊人的射线检查速度，并且可以快速更新bvh结构。引入这个库的开端，是在做MagicaLego的时候，需要一个射线检测。因为有gpu的加速结构，所以之前的做法，都是从gpu用computershader做射线检测，再读回cpu完成的。而对于没有硬件光追的设备，就没办法了。恰好，以为好友正好聊到了这个库，碰巧他还实现了这个库的neon加速。我就拉下来用了，header only，非常轻量级。结构设计和gpu的加速结构也完全是吻合的，甚至后续版本可以直接构建gpu用的加速结构了。

再构建gpu加速结构的时候，同时也构建一份cpu的，这样两边都可以做射线检查这些工作了。射线检查也不需要等待硬件回读了。tinybvh的性能非常强，单帧10k级别检查次数是完全可以跑上120fps的。

因此，后续基于tinybvh，还完成了和gpu共享代码的probe generation算法。在场景内发射射线来生成ambient cube数据，用在后续渲染。完成了一版基于射线检查的shadowmap，可以异步的在cpu更新shadowmap，用于后续渲染。

## imgui

imgui之前一直被我不齿，可能是因为unity时代留下的后遗症。这次从RTIO库继承下来的imgui库，发现还是挺好用的，后来又深入研究了一些开源项目使用imgui开发编辑器的做法，用极少量的代码，实现了gkNextRenderer的编辑器架构，眨眼一看还十分像UE5。包含了outliner，content browser，propety editor等基础结构面板，还实现了一个node based的材质编辑面板。当然，editor的代码还很原始，投入的时间很不足，第二年的计划，可以在工具上对编辑器提一些要求，促进编辑器的发展。

## slang

slang是nvidia提出的一种大一统的shader语言，一开始，我只是想把glsl转换为hlsl，用dxc编译到spirv。后来发现某些语言特性依然不是很强，遂看到最新的vulkansdk已经自带slang的编译器了，原来，khronos已经把slang变为firstclass的shader语言了。于是又把转好的hlsl，用slangc编译了一遍，一次成功，基本一行不需要改。

slang不只是完全兼容hlsl那么简单，丰富的泛型支持，module支持，interface，非常多的语言特性。用了差不多一天时间，就把原来glsl上各种重复代码，难以维护的全局变量，传参逻辑等，优化成了和c++十分相似的codebase了。slang还有一个自动微分的基础设施，配合slangpy的训练，可以做到诸如神经网络纹理压缩之类的十分高档的功能。第二年的计划，可以考虑一个小case，把这个设施用起来。

## quickjs

quickjs是bellard的一个比较近的作品，作者是最为伟大的程序员之一。quickjs的实现十分优雅，对ecma标准的支持，几乎和v8是一致的。但是他的代码量极低，运行时的内存开销也极低。

gkNextRenderer最初引入脚本，是希望做一些灵活的交互动态的控制。当然，当时项目也在优化v8的js性能，对脚本语言也很感兴趣。就开始考察v8的接入，但发现v8太臃肿了，这可能也是各种chromium架构的app如此臃肿的原因，比如electron等。v8的尺寸，比目前整个gkNextRenderer还要大几倍，这让我感觉无法接受（幸好gkNextRenderer还处于初期阶段，如果成长为一个中型引擎，可能就接受了）。于是就看到了quickjs，quickjs的设计很优雅，小体积的优势其实非常大。而性能比v8弱的问题，在我看来其实也不算是问题，v8的性能在我们项目内，也发现很多问题。如果用quickjs，他天生“性能较弱”的特性，反而可以在写代码的时候，提醒我们要考虑性能，自然而然的只把一些事务性和流程性的工作写在脚本内，将复杂逻辑留在native语言上。

不过接入了demo后，gkNextRenderer的脚本引擎其实没怎么用起来。现在想来，应该是两个原因：

* 卡在了nodejs编译typescript这一步，因为我希望的脚本语言是typescript，如果选用javascript，其实是可以不需要nodejs的。而引用nodejs，在开发环境的自动部署上，当时遇到了一些问题。就导致后来没有自动部署脚本，也就没有接着往下发展写更多的脚本了。
* 脚本的框架，和gameplay框架相关。而我一直没有定下来一个想要发展的新demo的gameplay。当然，其实可以先搁置这些设计，把magicalego的逻辑转换为typescript，这个是第二年计划可以做的事情

第二年的计划，做一个更丰富gameplay的demo应该是必须的。gameplay的类型目前还在考察，但是目标应该是一个地形巨大，并且可以拥有很多实体的世界，以极限测试引擎的承载能力。

## moltenvk

这是一个在macos上跑vulkan的项目，目前除了硬件光追的支持缺失，其他都非常正常。一开始，我其实发愁选择vulkan可能在macos/ios平台上就不能用了，但moltenvk的实现还是很不错的，我还打通的抓帧，可以用xcode的gputrace来观察实际的gpu运行情况。目前就是硬件光追的缺失，但metal的硬件光追，实现上是完全和rayquery对齐的。并且spirv转metal的转义都已经被完成了。只是api层面还需要moltenvk再努把力。相信假以时日，moltenvk是可以平顺的支持vulkan的所有特性的。

## android

安卓用vulkan做现代渲染，兼容性超出我的想象。一开始，也是看到我的骁龙8gen2手机可以支持硬件光追，并且是vulkan的ray query。所以下的大力气做了安卓平台的兼容编译。这一块还是做了一些“跨平台”的支持，主要是支持android更为特殊的显示框架，而不能用glfw了（glfw其实也有人做android的port，但android版本更新太快了，还是用原生方式容易一些）。看下来，8gen2的光追性能，基本上和steamdeck的那2cu是持平的，也不是不能用... 然后，超出我想象的是，我的骁龙865，居然可以完整支持目前除了硬件光追之外的所有特性。bindless，transfer queue都是支持的。并且效率也很强。bindless的兼容性也超出我的想象了。不过目前还是可以继续以8gen2为平台，同步渲染器的开发。

第二年的计划，android平台倒是没什么特别的期待，能够同步目前的渲染器开发，并且解决掉一些特殊的性能问题即可。

## github copilot

今年AI的进步速度让我非常惊讶，目前，gkNextRenderer里已经有大量代码是和AI协作一起写的了，今年sonnet claude 3.7模型，写c++, glsl, hlsl这些，水平都有很大提升。并且一些我似是而非，没有细究过的知识点，提给他，他甚至能直接写出可用代码，就好似我囫囵吞枣学过一遍的程度。这个时候再辅以调试和进一步的资料阅读，能够极大的提升在未知领域上的进步水平。Ambient Cube Probe这个系统，就有很多这种未知领域的知识细节，是在有基础shader代码的基础上，和copilot协作书写，调试，翻阅资料这个过程中，熟悉起来的。

我越来越相信，通用人工智能，是可能在目前的技术基础上出现的了。今年deepseek的梁文峰的一句话，让我醍醐灌顶：

> 我们理解人类智能的本质就是语言，人的思维就是一个语言的过程。你以为你在思考，其实可能是你在脑子里编织语言。这意味着，在语言大模型上可能诞生出类人的人工智能（AGI）。

因此，接下来的开发工作，我会毫无保留的加入AI辅助，越来越多的借助AI的力量，已经学会更好的使用AI。

