---
layout: post
title: gkENGINE windows平台快速上手指南
category: tech
---

windows平台快速部署分为，部署，编译，运行，打包四个步骤。

### 部署

*部署开发平台，安装和准备平台所需的第三方依赖库以及测试资源*

1. 从github / codeplex pull最新版本
> **github GIT** | [https://github.com/gameknife/gkEngine.git](https://github.com/gameknife/gkEngine.git)

1. 运行 init\_engine\_res.bat ，建立引擎目录环境

1. 从资源服务器获取depends.7z第三方依赖库和media.7z资源库
> **depends.7z** | [http://pan.baidu.com/s/1i38C5ud](http://pan.baidu.com/s/1i38C5ud)
> 
> **media.7z** | [http://pan.baidu.com/s/1qWK90Jy](http://pan.baidu.com/s/1qWK90Jy)
> 
> 分别放置于code/thirdparty下和exec/media下

1. 运行hand\_make\_env.bat，部署第三方依赖环境

1. 运行hand\_make\_resource.bat，部署和编译资源

### 编译

*编译gkENGINE*

1. 通过code/engine/solution/gkENGINE_vc10.sln打开工程

1. 选择Develop | Win32编译配置

1. Build Solution

1. 等待编译结束，如果全部工程编译成功，则编译完成，否则请到codeplex上提交issue

### 运行

*测试运行*

1. 使用exec/bin32/gkLauncher.exe打开，自动进入默认的测试用例模块。

2. 模块的配置可以在exec/media/config/startup.cfg中详细配置

3. 在测试用例模块中，方向键左右切换主项目类型，上下键切换当前项目，回车键执行测试用例

4. 使用exec/bin32/gkStudio.exe打开编辑器，可以进行场景编辑。编辑器代码位于code/editor/gkstudio中

### 打包

*打包为二次运行包，隐藏开发资源，剔除不必要文件，以供发布运行*

1. 测试完成后，使用exec/tools/version\_task/build\_version_pc.bat来打包pc版本的运行包

2. 运行包生成完成后，会保存在exec/builds目录下
