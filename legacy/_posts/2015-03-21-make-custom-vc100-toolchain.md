---
layout: post
title: 制作自定义vc100工具链
category: tech
---

# ·

gkEngine发布后，由于第三方库版本以及我自己是vs2010的使用者等原因，gkEngine对vs2010之后的版本基本是没有支持。由于使用的havok, toolkitpro界面库等原因，导致gkHavok, gkHavokAnimation, gkstudio无法编译。

而相当多的朋友，使用的是vs2010之后的版本，所以导致编译无法进行下去。

其实解决方案相对简单，找一个vs2010安装，然后在vs2013等高版本选择vc100的工具链编译即可。不过这不免需要多下载安装一次工具链。

vs编译是经由msbuild来做的，那么理论上我们只用把msbuild系统及其依赖的sdk拷贝到相应位置即可。

如果能直接剥离出来一个独立的工具链安装包，相信所有朋友都愿意一试的。

所以，周末开始利用一台只安装vs2013的计算机来进行实验。

# ·

最终选择了在虚拟机中安装一个纯净的win7系统，然后单独安装一个vs2013

> 这里不得不提一下虚拟机的快照功能，确实太好用了。这种系统级的文件操作，有了快照完全就和玩游戏一样嘛！

然后，开始拷贝msbuild, 依赖的vc, crt, atlmfc, win sdk等... 最终精简下来，需要部署的内容大致有：

```
windows/microsoft.net/assembly/microsoft.build.cpptask.common
windows/microsoft.net/assembly/microsoft.build.cpptask.win32
windows/microsoft.net/assembly/microsoft.build.cpptask.x64

program files(x86)/microsoft visual studio 10.0/vc
program files(x86)/microsoft visual studio 10.0/ide/下的几个工具

program files(x86)/msbuild/microsoft.cpp/v4.0下的工具链

program files(x86)/microsoft sdks/windows/v7.0a
```

最后，再在注册表的HKLM/software/syswow64node/microsoft/msbuild | visualstudio | windows sdks几个项目下面添加一些注册表项，整个工具链就可以安装成功了

这时候，再打开vs2013，选择do not upgrade，就可以用vc100工具链编译工程了。

# ·

最终，我再删除了一些没有用的win sdk, vc sdk的库后，写了bat安装脚本，打包。最终的vc100工具链安装包打包大小为50+mb。相当精悍了。回头写篇wiki放在gkENGINE的repo里，给大家方便。

# ·

最后有一点ps，由于我是win7 64bit操作系统，所以没有对xp和win7 32作测试。
可能需要修改一下注册表和路径位置，使用32位的朋友可以自行尝试修改，ok之后可以提到wiki上，谢谢！


