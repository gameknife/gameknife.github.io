---
layout: post
title: 重设r6300v2路由器
category: tech
---

# ·

前几周玩路由器时，听信谣言，尝试超频，结果路由启动就进入无线断线-重连的循环中...
幸好机器是在京东买的，保修，取货，换新...

今天把机器拿回来了，ddwrt系统没了，jffs2中的各种conf肯定也没了，xunlei没了，之前配好的lightTPD服务器系统也没了...

恩，反正做过一次，这次直接换kong ac的最新版本呗~

# ·

一路很快下来，开机 -> 刷r6300v2.chk -> ddwrt -> 查看版本号到了24850M -> 收手 -> 开始装必要服务: xunlei, svn, minidlna

我了个大擦， ipkg, opkg都没有？

什么情况... 哦，查到一篇文章说，执行以下kong ac提供的bootstrap，就帮你把opkg装好，真贴心

那么，

`
root@DD-WRT:·# bootstrap...
`

我了个大擦，kong ac的网站被403了... 路由自己翻墙不便啊...

# ·

开始，找方案，结果，发现了这么一个源:

> [http://qnapware.zyxmon.org/binaries-armv7/](http://qnapware.zyxmon.org/binaries-armv7/)

真是大牛逼！还提供了安装脚本

> [http://qnapware.zyxmon.org/binaries-armv7/installer/entware_install_arm.sh](http://qnapware.zyxmon.org/binaries-armv7/installer/entware_install_arm.sh)

技术真是进步太快啊，跟不上脚步了...  相当年，搞着破路由真是踏破铁鞋啊...

果断安装上opkg，然后，各种软件都有！

`
opkg install subversion-server
`

`
opkg install mysql/php5/...
`

这次大概花了一小时，配置成功，svn, minidlna, smb服务器 都 重新通过DDNS连到gameknife.cc上，又重新为我工作了！

wordpress那个博客可以废弃了，考虑要不要再本机搭建一个jekyll的博客系统呢~
