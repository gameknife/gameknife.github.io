---
layout: post
title: UE4 & Gradle & NDK-Build & Clang & std14 & LLVM
category: tech
---
<br>
<br>
### 缘分

来新项目1个月整了

动态寻路和一些功能开发暂告一个段落了，最近一周开始搞ue4与上android真机的事情。

不再是之前玩具demo的玩法，涉及到很多第三方组件的整合与一个庞大的native库的迁移

不管是主动还是被迫的，把上面一堆的，陌生的技术名字，都摸了一遍。总算，基本搞明白了Android最新的这套工具链的用法，以及与UE4的整合

<br>
### UE4 APL & UPL

Epic真的喜欢造Language，Unreal Plugin Language，怎么说呢，在接入第三方库的时候，还是挺好用的，详细如下

<br>
### Gradle Toolchain

什么是Gradle，他一般来说，和ANT对应，是一种构建系统。在UE4里面，作为Archive和Deploy阶段才出手的东西，详细如下

<br>
### Clang & NDK14+

上一次实际使用ndk，记得他的版本好像还刚到10，r10e，这次接触，已经是16和20版本了，工具链也变成了纯clang了，折腾了挺久，详细如下

<br>
### std14

由于前几年都没怎么好好写native代码，最近也是就着ue4提供方式在使用新的c++标准，这次因为使用clang来编译现在用msvc开发的代码，算是把c++标准重新理了一遍，详细：

<br>
### LLVM

各种工具链，都没绕开LLVM，现在windows平台编译也支持Clang了，就顺手看了几篇LLVM的历史与发展，总算真正对其开始了了解。也明白了，为什么LLVM还跟shader有关系，嗯，关系不小。
