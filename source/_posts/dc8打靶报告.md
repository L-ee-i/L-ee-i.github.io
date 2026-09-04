---
link: https://blog.csdn.net/2403_88102829/article/details/157612010
title: dc8靶机报告
description: 文章浏览阅读319次，点赞8次，收藏8次。环境：攻击机kali ip：192.168.145.128先arp-scan -l 扫描存活主机，得到靶机ip：192.168.145.190扫端口，发现开放了80——http协议，apache服务，drupal7的cms还有一个22端口的远程连接看一眼网页发现url里面有?nid=1/2/3参数可控制，测试是否存在sql注入点，试一下?nid=1'，有回显sql报错用sqlmap跑（可以尝试droopescan扫用户）枚举所有的数据库。
keywords: android
author: Le_ee 博客等级 码龄1年
date: 2026-02-05T03:02:36.007Z
categories:
  - 靶场复现
tags:
  - DC靶场
  - SQL注入
  - Drupal
publisher: null
stats: paragraph=63 sentences=56, words=96
---

<meta name="referrer" content="no-referrer"/>
环境：

攻击机kali ip：192.168.145.128

先arp-scan -l 扫描存活主机，得到靶机ip：192.168.145.190

![](https://i-blog.csdnimg.cn/direct/d000f3c975ce4622bf6430925b3cf3ba.png)

扫端口，发现开放了80——http协议，apache服务，drupal7的cms

还有一个22端口的远程连接

![](https://i-blog.csdnimg.cn/direct/d6b2c12e24e543dc97d7c6513beb73be.png)

看一眼网页![](https://i-blog.csdnimg.cn/direct/83c40247aa634ce89f5a487c7f219ea5.png)

发现url `http://192.168.145.190/?nid=1`里面有?nid=1/2/3参数可控制，测试是否存在sql注入点，试一下?nid=1'，有回显sql报错

![](https://i-blog.csdnimg.cn/direct/a33eb56c90fa4bd1a4cdca9ea92b53db.png)

```
用sqlmap跑（可以尝试droopescan扫用户）
sqlmap -u "http://192.168.145.190?nid=1" --dbs
枚举所有的数据库

sqlmap -u "http://192.168.145.190?nid=1" -D d7db -T users -C name,pass --dump-D指定数据库名，-T指定表名
```

**然后**获得两个用户hash：

`admin:$S$D2tRcYRyqVFNSc0NvYUrYeQbLQgxkoA`

`john:$S$DqupvJbxVmqjr6cYePnx2A891ln7ls`

![](https://i-blog.csdnimg.cn/direct/0af11654ad4b435eb4ab3d77a522f2ff.png)

touch一个文件，把这两个密码都放进去爆破

![](https://i-blog.csdnimg.cn/direct/fda984780e3249c9af7fda66f0a52392.png)

$S$D2tRcYRyqVFNSc0NvYUrYeQbLQg5koMKtihYTIDC9QQqJi3ICg5z

$S$DqupvJbxVmqjr6cYePnx2A891ln7lsuku/3if/oRVZJaz5mKC2vF

![](https://i-blog.csdnimg.cn/direct/8102ce75867146efb6c1f995f316579f.png)

```
john pass.txt --format=drupal7
```

得到一个针对john的密码turtle

![](https://i-blog.csdnimg.cn/direct/fc2054cb882c4dada572c05ac78bcf46.png)

dirsearch扫一下可以确定登录页面的路径

![](https://i-blog.csdnimg.cn/direct/2184242a464e4120b74b82c6dde5c3b3.png)

![](https://i-blog.csdnimg.cn/direct/a37577c225b4439382185a8d5dde99a4.png)

访问 `http://192.168.145.190/user/login`

使用 `john:turtle`登录成功

发现可提交PHP代码的表单

![](https://i-blog.csdnimg.cn/direct/224284ffb1044d6f9828e9a5db94cf0f.png)

#### 3.4 反弹Shell

按dc7的思路去找能注入php代码的地方，进去add content发现创建内容被分类了——基础页面和网络表单，无论哪个都无法指定php语言![](https://i-blog.csdnimg.cn/direct/ebd726f46bf84664b2c4a228a23ba9cc.png)

回到主页，到处乱翻，然后在contact us 下进入webform内，我们可以发现在form settings下有

text format可以修改

![](https://i-blog.csdnimg.cn/direct/dbe30050476e4bbd890f5e62ca139a0e.png)

![](https://i-blog.csdnimg.cn/direct/e5781edd3c214f69aa87a7b9377929ca.png)

选择之后打开kali的1234端口![](https://i-blog.csdnimg.cn/direct/d58754c21a384df8b73a5fa1ebc96203.png)

然后save configuration，返回view填写表单触发执行php代码

![](https://i-blog.csdnimg.cn/direct/2c833daae1a34df6b1f64c11d62fb9ba.png)

![](https://i-blog.csdnimg.cn/direct/116a0ef87a9e44029523ace96d06e529.png)

kali这边连接成功

![](https://i-blog.csdnimg.cn/direct/4be081a26a1146e1af30ed9a76c2a75a.png)

python写一个伪终端

![](https://i-blog.csdnimg.cn/direct/8e43c37714884e7da947f6fd8f99a0f5.png)

```
find / -user root -perm -u=s 2>/dev/null
```

![](https://i-blog.csdnimg.cn/direct/172121e38f9a40f68d93da5ab4495ccf.png)

![](https://i-blog.csdnimg.cn/direct/f7db6cc02ae744578ca2374ac11bd83d.png)

**发现**Exim 4.89版本，有root权限的SUID文件

![](https://i-blog.csdnimg.cn/direct/08492d35137542ae9e35630ea1fcc335.png)

#### 利用Exim提权

```

```

![](https://i-blog.csdnimg.cn/direct/eaa40c41aa7f4430aeb5763dee690a71.png)

![](https://i-blog.csdnimg.cn/direct/3da9f232810d4271a5fda5dbfbb56940.png)

给文件加权

![](https://i-blog.csdnimg.cn/direct/0c0c5a4934fc4599bc94440ab7124e44.png)

获得root权限shell

![](https://i-blog.csdnimg.cn/direct/309d5fad7db3424c846d1aeee85b14e7.png)

![](https://i-blog.csdnimg.cn/direct/f1a31cd158cd473db69626a85752315d.png)

```
cd /root
cat flag.txt
```

![](https://i-blog.csdnimg.cn/direct/23497fe61d24478db825bc9b42942f05.png)

### 完结撒花！！
