---
layout: post
title: 构建MacOSX工具链
category: tech
---

### ·

最近两天，利用晚上的时间，为gkENGINE构建了原生的MacOSX工具链。此时可以完全脱离windows及windows虚拟机，
直接在一台纯净的Mac机上clone, build, package, deploy，直接发布iOS App以及直接在MacOSX中运行gkENGINE了。

### ·

其实这是一个比较复杂的过程，大概的步骤有以下几点

* 改写bat到sh

> 其实这是一个看起来较为简单，实际操作起来还挺麻烦的工作。在windows下我设置了几个系统变量来保存引擎根目录，其中使用了当前目录和日期变量。而在macosx上，在一个shell中sh一个shell，在子shell中设置的环境变量不会保留到父ahell。因此，只能使用source命令来include，到source的语句目录又不会切换，这是个cmdbatch很不相同的地方。最后包括文件的遍历，各种字符串的拼接，都需要做挺多流程上的改变。

* 编译gkResourceCompiler

> shell翻译完之后，就要开始测试了，接下来得主要问题就是shell中调用的各种控制台程序了。7zr，texconv，pvrtextool，gkresourcecompiler这几个。其中大概就texconv不太可能有osx的版本，其它都可以重新寻找和编译。7zr, pvrtextool很快找到了osx版本，接下来就是编译gkresourcecompiler的osx版本，gkcommon的库全部是跨平台的，所以编译很顺利。平台相关的atc_compiler没有加入编译，gkresourcecompiler目前只能处理obj -> gmf和utf8了。

* 寻找或替换MacOSX上的纹理转换工具

* 重新打包
