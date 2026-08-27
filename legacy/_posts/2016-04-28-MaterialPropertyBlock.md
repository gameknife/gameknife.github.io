---
layout: post
title: Unity3D中的MaterialPropertyBlock
category: tech
---

<br>

背景故事
---

最近两天，在针对Unity3D做传统gpuskin的尝试。

所谓传统gpuskin，即使指利用vertexshader，通过传入的bone matrix进行蒙皮计算的方式。

而Unity3D提供的gpu skin，是一种更加鲁棒的方法：
利用"StreamOut"，在正常的vs-ps流程前，进行一次“通用”的蒙皮计算，而后stream out。因此，Unity3D的gpu skin对于用户来说是完全透明的！

然而不幸的是，这个特性，DX9享受不到，GLES2也享受不到。因此，Unity3D声明，gpu skin只能在dx11以及gles3平台才可使用。

更深入的实现细节之后再写文章详解，而今天要说的，是初次实验后的性能优化阶段... 发生的故事。

这一次的性能优化，才让我意识到了之前的一个很大的误区。

<br>

瓶颈所在
---

在初步demo实现之后，通过UntiyProfiler，逐步将实验期间的(12ms/9chr)的cpu消耗，降低到(1ms/9chr)。然而结果并不理想，因为主线程的cpu skin prepare + skin wait也仅仅使用了(0.8ms/9chr)。

不过还是准备将用例直接port到真机上看看瓶颈所在。

不看不知道，一看吓一跳。

在iPhone5S上，消耗为3ms/9chr，而cpu skin的消耗为2.5-3ms/9chr。看起来，和PC上比例差不太多。

而当我在Instrument Time Profiler中仔细查看调用才发现，GSKINRenderer.Update的消耗，超过50%都消耗在了Material.SetVector这个函数之上！而我本身认为非常繁重值得优化的一个Matrix4x4 Decompose操作，仅仅消耗了大约25%的时间。
![placeholder](https://raw.githubusercontent.com/gameknife/gameknife.github.io/master/images/blog-add/materialsetvector.jpeg)
而Material.SetVector，最终其实只会促成glUniform4fv的调用，而这个调用在GLEngine库中的查看，全局消耗非常小。
![placeholder](https://raw.githubusercontent.com/gameknife/gameknife.github.io/master/images/blog-add/gluniform4fv.jpeg)
看来，最大的问题在于对Material.SetVector的优化！

<br>

瓶颈形成分析
---

那么
