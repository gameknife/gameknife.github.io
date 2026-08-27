---
layout: post
title: UE4's iOS Cross Compile
category: tech
---

<br>
<br>

### 编译地狱

安卓的真机版本搞定了，比预计快了很多，因此，准备把iOS的真机版本也提上日程。

由于已经身经百战，之前好歹也出过2-3个iOS真机包了，这次准备直接在构建机的虚拟macOS系统上开搞

git pull 源码，编译源码，编译编辑器，编译game，cook，package，archive，至少第一个可以上手机的ipa包，肯定是一气呵成~

没想到，第三步就翻车了...

编辑器，编译报一大堆错，嗯，也正常，我们的代码各种msvc风格，改就是了~ 可是，什么骚操作，居然有 XXXProj 和 XXXProjEditor的循环依赖，

而且，还不太好改，windows因为dll的关系，editor下这种循环依赖是可以运行的。

本来，是准备静下心来，认真梳理关系，整理一下代码，让mac编译通过。然而，一来是时间有限，二来，一直看ue4有iOS的远程编译，是不是可以试试呢？

<br>

### 远程编译

找了篇文章，介绍iOS的Remote Build，原理其实挺简单的，就是通过同一个网络下的ssh，windows ssh到mac系统，
将构建用的依赖文件发送过去，并在远程mac系统编译，再把编译结果发送回来。

这样依赖，mac机完全作为一种“资源”，只需要安装有xcode，具备build能力即可，
而不需要ue的超大源码，也不需要编译出ue，也不需要编译出项目的editor，不需要cook，
只具备构建app和打包app的能力即可。

这对于已经在Windows系统上统一了PC和Android构建的我们来说，应该是一个很大的福音，我们可以统一整个构建环境在windows上，外挂一个
