---
title: "gkENGINE跨平台的问题总结"
date: 2013-04-27
category: tech
description: "gkENGINE跨平台的心酸血泪史 总结了一下去年在做gkENGINE跨平台工作时，遇到的一些坑和解决方案。 开发环境选择 IOS IOS支持C++的方式是C++（GCC编译器）和objC混编 IOS平台使用xcode作为“编译器”和“调试器” VisualStudio作为“开发IDE” 利用..."
tags: ["gkEngine", "跨平台", "C++", "CMake"]
draft: false
---

# **gkENGINE跨平台的心酸血泪史**

总结了一下去年在做gkENGINE跨平台工作时，遇到的一些坑和解决方案。

# **开发环境选择** 　　

## IOS 

IOS支持C++的方式是C++（GCC编译器）和objC混编

IOS平台使用xcode作为“编译器”和“调试器”

VisualStudio作为“开发IDE”

利用VMWARE虚拟机，在WIN7环境下开一个MAC虚拟机，一切和IOS真机/虚拟机相关的问题在虚拟机中搞定。

在WIN7下开一个代码托管仓库，VMWARE桥接网络可以在MAC OS里pull代码。

## ANDROID 　　　　　　　　　　

ANDROID支持C++的方式是NDK。Android2.3之后支持纯原生代码。

NDK的官方开发流是geek范儿：手写mk文件，调用windows版的gcc编译器直接编译出可在arm架构上跑的二进制。然后使用gdb server进行真机调试。

可以通过vs-android方案，将手写mk文件的步骤，变为熟悉的vs管理工程。通过MSBuild扩展出一个Android平台（对应WIN32/WIN64）编译选项。同时配合Android-SDK和ANT，可以直接生成用于真机安装的APK包。

# **参考工程** 　　　　　　　 

COCOS2D-X

POWERVR SDK

# **跨平台不得不改的几个模块** 　　　　　　　 

## 渲染API 　　　　　　　　　 

l D3D是用不了的，需要使用GLES2来实现渲染器

## 输入 　　　　　　　　　 

l 输入方式和WINDOWS是完全不同的，触屏VS键鼠

l IOS和ANDROID的输入消息驱动方式也有区别，需要分别实现

## 操作系统打交道的 　　　　　　　　　 

l 线程API，Linux可以用pthread

l 各种数据类型定义， 通过DEFINE的转

l WIN API，一部分WIN API可以用LINUX平台的函数封装

## GCC和MSVC编译器不同的脾气 　　　　　　　　　 

l 模板

l 传参行为

l 编译器特性和关键字_stdcall _fastcall等等

l switch case只支持8位... 被坑惨了

## UNICODE和MULTIBYTE 　　　　　　　　　 

l NDK 7对UNICODE支持不好，最终选择了MULTIBYTE

## WINDOWS的专有库 　　　　　　　　　 

l ATL, MFC… gkENGINE还好都没有选用

l 各种第三方库，有源码的可以尝试编译跨平台（rapidXML等等）

## 库的封装 　　　　　　　　　 

ANDROID支持动态链接（.so）

IOS锁死了动态链接，只能使用静态链接(.a)

## 资源引用 　　　　　　　　　 

IOS需要把文件按目录结构打进APP包中，用一个obj系统提供的bundle路径来作为root路径引用文件

ANDROID的数据可以类似IOS一样，统一打进APK包中。安装后直接位于APK程序位置。也可以放置于SD卡中，索引SDCARD路径的方法可能会根据机型有不同。

## 文件系统 　　　　　　　　　 

IOS真机的文件系统是HFS+，该文件系统对文件名是大小写敏感的！ 而MAC OS可以是HFS，大小写不敏感。这是一个大坑。资源和路径可能需要全部处理为小写。

LINUX系统不支持“\”作为路径分割，因此在路径索引和源代码中，一律要使用“/”。

# **渲染器 ** 　　　　　　　 

渲染器需要使用openGL ES/ES2来实现。

在WINDOWS平台上可使用POWERVR SDK提供的GLES2模拟库来模拟，该库是对OPENGL的封装。COCOS2D-X也使用这种方式。使用WINDOWS模拟器的最大优势在于， 可以脱离于移动平台，直接在WINDOWS平台下开发。在发布里程碑版本时再针对移动平台编译，解决部分问题。提高开发和调试效率。

在ANDROID和IOS中，OPENGLES2的行为还稍显不同。

# **C标准库和C++标准库** 　　　　　　 

在移动平台上，对这两个标准库都支持得很好。因此如果之前的工程如果大量的使用标准库函数和对象来开发，跨平台时可以事半功倍。

# **规格** 　　　　　　　 

移动平台的内存偏小，这一点需要十分注意。容易爆内存崩溃。

移动平台显卡支持的硬件解码纹理格式各异：

ETC ：所有厂商支持 | 不支持ALPHA通道

PVR ：POWERVR | ALPHA通道支持很烂

DDS : NVIDIA

AT2: 高通
