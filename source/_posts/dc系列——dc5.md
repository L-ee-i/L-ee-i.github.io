---
link: https://blog.csdn.net/2403_88102829/article/details/157176530
title: dc5靶机报告
description: 记录 DC-5 靶机的 Web 参数测试、文件包含与日志写入利用、WebShell 验证以及 Linux 内核提权过程。
excerpt: 记录 DC-5 靶机的 Web 参数测试、文件包含与日志写入利用、WebShell 验证以及 Linux 内核提权过程。
keywords: android
author: Lee
date: 2026-01-28T07:30:56.811Z
categories:
  - 靶场复现
tags:
  - DC靶场
  - 文件包含
  - Linux
---

#### 信息收集：

arp-scan -l扫

![](https://i-blog.csdnimg.cn/direct/a84d5e4e535647d5883b071fdcd98a54.png)

nmap扫

分析回显，我们可以看到操作系统是linux3-4的，开了三个端口

80：http协议，nigux1.6.2的服务

![](https://i-blog.csdnimg.cn/direct/8ae0a35227194852add7b195210bb1e3.png)

#### 看80端口

`http://192.168.145.187`

![](https://i-blog.csdnimg.cn/direct/3d66ce7c7489442ca5e47d92b1b80f4f.png)

点击 `Contact` 页面提交表单，会跳转到 `thankyou.php`

![](https://i-blog.csdnimg.cn/direct/9f8458556e0d4b708c172a162f668915.png)

可以看到url中 `thankyou.php` 后面包含了firstname,lastname,cuntry等参数，我们试一下写入可 `file` 参数，看是否存在文件包含

在?file=后面尝试读取系统文件：

```
http://192.168.145.187/thankyou.php?file=/etc/passwd
```

如果成功显示用户列表，则证实存在 **本地文件包含（LFI）**漏洞。

再刷新一遍，bp抓包，看到我们刚才测试的文件路径，把这个改成一句话木马

![](https://i-blog.csdnimg.cn/direct/27ce9f2d8f044d39b69cfc1f4e5be866.png)

![](https://i-blog.csdnimg.cn/direct/6ad43408597c4ba8ba0b4fa1e33246ff.png)

forward放包，linux的报错日志常见路径是

```
/var/log/nginx/error.log
```

我们尝试访问一下，可以发现木马被成功写入

![](https://i-blog.csdnimg.cn/direct/ab19d6e862f94c2e8f607d0643f6df36.png)

蚁剑连接，连接成功

![](https://i-blog.csdnimg.cn/direct/4d5305402e8c431c9f37de89e9ce959f.png)

![](https://i-blog.csdnimg.cn/direct/574ed255ba974c7aa0cdb9c122aa5091.png)

用kali建立反弹shell

![](https://i-blog.csdnimg.cn/direct/d2d1abb7ad63487cba09241c34ca224b.png)

![](https://i-blog.csdnimg.cn/direct/11bd5a9ad833472c9053f3c1a8d74dfc.png)

用python构造一个伪终端

![](https://i-blog.csdnimg.cn/direct/841f1ddd9323458aa009ab146808277b.png)

这时候再kali的反弹shell里面检查suid程序

find / -perm -u=s -type f 2>/dev/null

可以找到关键程序 /usr/bin/screen-4.5.0

![](https://i-blog.csdnimg.cn/direct/e4cebe451f3a4e6b83cf55cdb850a7f8.png)

查找漏洞，尝试第一个41154.sh脚本

![](https://i-blog.csdnimg.cn/direct/8601c50bded84729bf2a26884cab1a29.png)

复制到kali终端的tmp文件下，保存整个脚本

![](https://i-blog.csdnimg.cn/direct/df56d7a5cab943bba91ca8f8abc0ab33.png)

看看

![](https://i-blog.csdnimg.cn/direct/2e44ca8f910d411a93ffef9647f429b8.png)

在kali上开启http服务

![](https://i-blog.csdnimg.cn/direct/732dd4ba702746ffae628a27fd7d1c95.png)

在靶机的shell里下载exp脚本，给执行权限，./dc5.sh执行提权

![](https://i-blog.csdnimg.cn/direct/34884df104c94b51b8408df0a29ffc47.png)

提权成功，在root下找到flag文件

![](https://i-blog.csdnimg.cn/direct/917249dd8650432db95f9813a3d204a3.png)

![](https://i-blog.csdnimg.cn/direct/21df2908c53044d483e88ab2e9f6ca0e.png)

完结撒花！！！！！
