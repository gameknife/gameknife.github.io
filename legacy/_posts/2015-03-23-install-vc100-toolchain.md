---
layout: post
title: 安装vc100独立工具链
category: tech
---

#### 前言

这周末花时间尝试研究[制作vc100独立工具链](http://gameknife.github.io/tech/2015/03/21/make-custom-vc100-toolchain/)，功夫不负有心人，事实证明是完全可行的。下面我给出独立工具链的下载地址和安装注意事项。

#### 下载地址

[http://pan.baidu.com/s/1sjOBUkX](http://pan.baidu.com/s/1sjOBUkX)

#### 安装注意事项

系统要求：win7+ & 64bit

环境要求：vs2011+ & 没有安装vs2010

安装方法：

1. 下载package.zip, 放置于c:\, 
2. 解压到c:\package, 使得文件install\_vc100\_toolchain.bat存在于c:\package\install\_vc100\_toolchain.bat
3. 使用**管理员**身份运行c:\package\install\_vc100\_toolchain.bat
4. 等待pause, 按下回车cmd关闭后，安装完成

