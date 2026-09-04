---
link: https://blog.csdn.net/2403_88102829/article/details/154015358
title: dc系列靶机——dc1
description: 文章浏览阅读100次。IP扫描手段，smb协议，伪终端，哈希密码加盐，/etc/passwd文件与/etc/shadow文件，bin/bash，有suid的find提权
keywords: dc系列靶机——dc1
author: Le_ee 博客等级 码龄1年
date: 2025-11-02T09:26:07.778Z
categories:
  - 靶场复现
tags:
  - DC靶场
  - Linux
  - 提权
publisher: null
stats: paragraph=107 sentences=60, words=234
---
<meta name="referrer" content="no-referrer"/>
学习补充：

1.工具对比——nmap，arp-scan

使用范围差异场景建议nmap（全/深入）可以跨网段扫描扫描开放端口，跨网段arp-scan（快/隐蔽）只能探测同一局域网内快速发现局域网设备，绕防火墙

综：可以先用arp-scan快速定位目标，找存活主机，再用nmap深度扫描端口服务

2.SMB协议：是​ **​Windows网络文件共享的基础协议​**​，在内网渗透中比较重要，是横向移动的主要通道，能让电脑之间通过网络互相传文件

3.伪终端：python -c 'import pty; pty.spawn("/bin/bash")'

4.哈希密码加盐

5./ect/passwd文件与/ect/shadow文件

6./bin/bash

7.有suid位的find提权

先扫ip

![](https://i-blog.csdnimg.cn/direct/2d9661ce6b074ee89cded61b8e0bfc6a.png)

![](https://i-blog.csdnimg.cn/direct/7b8c3aa774d545e4aef880e5e7f650ba.png)

侵略性扫一下端口

![](https://i-blog.csdnimg.cn/direct/c4551ce342f84b699b49ab83c04f7199.png)

可以观察到开了三个端口：22，80，111，提供的服务分别对应着ssh远程管理，http运行网站服务，rpcbind远程过程调用服务

所以对应这几个端口的渗透方向：

22：ssh渗透——爆破，版本漏洞

80：web渗透

111：RPC信息收集

同时还能了解靶机技术栈的一些组成部分

我们在网站服务上看到了运行apache，初步确定了是web服务器

以及下面的running可以发现操作系统是linux

应用层部分有Drupal——（由CMS和php开发框架共同构成）

在主机上访问https://192.168.145.156

![](https://i-blog.csdnimg.cn/direct/cee4e0a1c9c8425e8959248751455644.png)

根据我们上面搜集到的信息，该网站是使用Drupal 7的CMS搭建的

打开msf搜drupal 7的框架

![](https://i-blog.csdnimg.cn/direct/c140555932ad42ac9b9ff17c954f7c9e.png)

选择第二个框架进行攻击

![](https://i-blog.csdnimg.cn/direct/c0687b6337c449cdb0891c8d8c8164e9.png)

options一下发现需要补全RHOSTS

![](https://i-blog.csdnimg.cn/direct/322e945205af49e1bfae19eec182df87.png)

![](https://i-blog.csdnimg.cn/direct/97b5604c1c4c4a3bbed10d4828aec2da.png)

利用python脚本构造一个伪终端，使得正常终端的功能得以实现

伪终端执行命令

python -c 'import pty; pty.spawn("/bin/bash")'

like：tab键补全，ctrl-c正常用，还能执行一些交互性命令
![](https://i-blog.csdnimg.cn/direct/aef7cdc8565f42c0906302db048f94ff.png)

查看一下文件列表，发现flag1

```
flag1&#xFF1A;Every good CMS needs a config file - and so do you.

```

![](https://i-blog.csdnimg.cn/direct/d8d84a6f030440f5aa09b66468be0331.png)

cat一下

:内容提示我们去找config file——配置文件——setting![](https://i-blog.csdnimg.cn/direct/9b27c44b12d44da6963d3cc9b9da2498.png)

选择文件夹一个个打开找....

![](https://i-blog.csdnimg.cn/direct/9ed5f9a4771042a290c9cf826b6a62f0.png)

在sites文件里面发现一个奇怪的default，进去看看

![](https://i-blog.csdnimg.cn/direct/84287c61dd66441099f00ad92c0eef06.png)

找到了settings.php，cat，报出了flag2

```
flag2&#xFF1A;force and dictionary attacks aren't the
 * only ways to gain access (and you WILL need access).

 * What can you do with these credentials?

```

flag2提示我们找凭据，下面刚好报了数据库信息：

库名：drupaldb

用户名：dbuser

密码：R0ck3t

端口默认·3306

数据库类型mysqlm

![](https://i-blog.csdnimg.cn/direct/3b47b41add0f4377833fa43b050ef863.png)

输入用户名和密码进入mysql客户端环境

![](https://i-blog.csdnimg.cn/direct/e37bcd59a32d48c6b057789e925bddf7.png)

选择drupaldb数据库![](https://i-blog.csdnimg.cn/direct/980466596762478bb8705a15ebe457fd.png)

查看表

![](https://i-blog.csdnimg.cn/direct/fc52d0b7003e408382c0e1479c395a25.png)

发现users表

![](https://i-blog.csdnimg.cn/direct/2641926b3e784bb3b78eb5d292d904c0.png)

观察这里存储的密码基本都是哈希值——（$S$开头），并且是加盐过的（也就是在变哈希值前在原始密码中加入随机字符串，因为同一个字符串生成的哈希值是唯一不变的，这样做，能使得生成的哈希值是独一无二的，可以保护常见的密码不受攻击）

![](https://i-blog.csdnimg.cn/direct/538bf43eb46e43d091ea349c642d56cc.png)

很难破解，所以我们选择直接退出去修改一下admin的密码

php命令生成一下想要密码的哈希值：

```
php scripts/password-hash.sh &#x65B0;&#x5BC6;&#x7801;
//&#x6267;&#x884C;php&#x89E3;&#x91CA;&#x5668; drupal&#x81EA;&#x5E26;&#x7684;&#x5BC6;&#x7801;&#x54C8;&#x5E0C;&#x751F;&#x6210;&#x811A;&#x672C; &#x65B0;&#x5BC6;&#x7801;
```

![](https://i-blog.csdnimg.cn/direct/8182ebb1ced249229aeb463c17e36a85.png)

复制hash值，然后用sql的update命令来重置一下admin密码

```
update users set pass = "hash" where uid="admin";
```

用新密码去登录，成功

![](https://i-blog.csdnimg.cn/direct/2f8b988c54f542909a3582542a401dd8.png)

进dashboard仪表盘看看，发现flag3

![](https://i-blog.csdnimg.cn/direct/a329d3e89e864166b898ab0e9a37f2b8.png)

![](https://i-blog.csdnimg.cn/direct/1576ef581a0b4deda0bfe489d07bec7a.png)

```
flag3&#xFF1A;Special PERMS will help FIND the passwd - but you'll need to -exec that command to work out how to get what's in the shadow.

```

分析一下这个flag：

1.special perms——我们需要特殊权限才能找到密码

2.-exec命令——是find命令的一个核心参数，允许对找到的文件执行任意命令

3.shadow：

学习两个linux系统中最重要的用户认证文件——/ect/passwd文件和/ect/shadow文件

这两个文件都存储了系统所有用户的用户名列表，但后者中还有用户名的密码哈希值，也就是说前者任意权限都能看，而后者只有root能看

意味着，我们后续要进行提权操作

先看一下/etc/passwd文件，发现了flag4用户!!并且有bin/bash——/bin/bash代表这个用户可以通过找到密码手动登录

（还有mysql服务，和ssh服务，22端口和3306端口都是运行状态）

![](https://i-blog.csdnimg.cn/direct/d4793f8e8c2b4ad5858ff201dcd51d92.png)

下一步用find提权查看/etc/shadow中的flag4密码，尝试登录flag4用户，进去看看有没有有用的flag信息

检查find是否有suid位，输出有s！表示find有suid位，表示，只要执行find命令，就会以root权限运行！

suid位：

像一个提权令牌，普通用户在运行有suid命令时，会临时获得root的身份

![](https://i-blog.csdnimg.cn/direct/85e70238d2fa4461b296f1d1dd7e5a71.png)

touch一个text文件假装查找，执行find语句之后立刻能切换到root权限

提权

```
find / -name text -exec /bin/sh \;
//find [&#x641C;&#x7D22;&#x8DEF;&#x5F84;] [&#x641C;&#x7D22;&#x6761;&#x4EF6;] -exec [&#x8981;&#x6267;&#x884C;&#x7684;&#x547D;&#x4EE4;] \; [&#x63A7;&#x5236;&#x9009;&#x9879;]
```

进入root

![](https://i-blog.csdnimg.cn/direct/19b8043910e34bf981c7b73770d46929.png)

找到flag4！![](https://i-blog.csdnimg.cn/direct/5e2f0762e3c9446d9dba268655912b06.png)

```
flag4:Can you use this same method to find or access the flag in root?

Probably. But perhaps it's not that easy.  Or maybe it is?

```

提示我们去根目录root里面看看![](https://i-blog.csdnimg.cn/direct/3b4b0857360b4bc9a1237b0a9b36d890.png)

❀❀❀完结撒花！！！❀❀❀
