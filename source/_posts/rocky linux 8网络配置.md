---
link: https://blog.csdn.net/2403_88102829/article/details/154960222
title: RockyLinux8网络配置
description: 
keywords: Rocky Linux 8 网络配置
author: Le_ee 博客等级 码龄1年
date: 2025-11-18T04:40:52.775Z
categories:
  - 网络与系统
tags:
  - Linux
  - Rocky Linux
  - 网络配置
publisher: null
stats: paragraph=127 sentences=61, words=155
---

<meta name="referrer" content="no-referrer"/>
查看网络接口列表

command: ip addr show 或 ip a

![](https://i-blog.csdnimg.cn/direct/00f19683f65249af8d7dd604abb06634.png)

查看网络接口

command: nmcli connection show

![](https://i-blog.csdnimg.cn/direct/d9fcb00afb424d14b24d2367e2c79e9e.png)

我的网络接口: ens33

查看设备状态

command: nmcli device status

![](https://i-blog.csdnimg.cn/direct/7a40e07f13a54339be2722d41515c8d9.png)

查看特定接口信息

command: ip addr show ens33

![](https://i-blog.csdnimg.cn/direct/33a0c1dc3e954543bcf9295e1321f7a4.png)

查看接口统计信息：

command: ip addr show ens33

![](https://i-blog.csdnimg.cn/direct/bd407c52d32147db938426e98f6ccaeb.png)

**nmcli 配置网络**

交互式配置

command: nmcli connection edit ens33

![](https://i-blog.csdnimg.cn/direct/4d0adfc5ad9240fd9cc9a2b079dadb9f.png)

先在主机上查看dns地址，子网掩码，网关等信息

command: ipconfig /all (windows)

![](https://i-blog.csdnimg.cn/direct/733f2501cf90439a9a6390dd751b4370.png)

dns: 192.168.145.254

netmask: 255.255.255.0

网关：192.168.145.1

随后按照信息修改：

![](https://i-blog.csdnimg.cn/direct/dd27f7995b31476fa4d0551add49625c.png)

激活网络接口：

command: nmcli connection ip ens33

![](https://i-blog.csdnimg.cn/direct/6a28125c6cf14eb9a80ee257ad895926.png)

激活成功

单方面配置静态ip并激活网卡:

![](https://i-blog.csdnimg.cn/direct/c4ceed13957c4448b51cd0a611c0423a.png)

查看ip:

![](https://i-blog.csdnimg.cn/direct/e1b9c56480ec4985929e4734dbc57cc5.png)

配置成功

创建新的网络连接

![](https://i-blog.csdnimg.cn/direct/6a0f09d8d40e45919a267d8c123ee648.png)

激活并查看ip![](https://i-blog.csdnimg.cn/direct/10f81ccdd9fd4a7f8e8d5caf3b1ff968.png)

ping一下确认网络是通畅的

![](https://i-blog.csdnimg.cn/direct/75f0aea5757a4782849b420ce7c9e1ff.png)

配置dhcp协议：

![](https://i-blog.csdnimg.cn/direct/81c2e156646c455591310f319d0408b8.png)

消去之前配的静态ip，改为dhcp协议获取的ip地址并激活网卡：

![](https://i-blog.csdnimg.cn/direct/3723e310950046cfafcb828435f82db6.png)

查看ip，发现变回了192.168.145.181

![](https://i-blog.csdnimg.cn/direct/fdaf4670686d45f49af288cb91786aa2.png)

查看连接详情：

command: nmcli connection show ens33

![](https://i-blog.csdnimg.cn/direct/3286689fbb354fa8a232047b29ad64dc.png)

重启和启用网络接口：nmcli connection up/down ens33

设置网卡为开机自启：

![](https://i-blog.csdnimg.cn/direct/f502f5f0f4424d39a5ce8372f0293751.png)

删除网络连接：

command: nmcli connection delete ens33

![](https://i-blog.csdnimg.cn/direct/4455a0ffaaaf496e9c1c5081dbdc6b54.png)

用add方式重建网络连接：

![](https://i-blog.csdnimg.cn/direct/230f7f7e315049be90f469c50c3586d0.png)

重新删除后让NetworkManager自动检测，用命令: nmcli connection show 来检测是否创建成功

![](https://i-blog.csdnimg.cn/direct/a60a8bb36b4d4db7abdc8efe34d4d5a4.png)

通过配置文件配置网络

![](https://i-blog.csdnimg.cn/direct/ae65ae8d6f63479ba07648fd6e7ef312.png)

可以通过修改BOOTPROTO = (static/dhcp)来切换静态IP和使用dhcp动态ip地址

![](https://i-blog.csdnimg.cn/direct/3c2f6eb6284042ecb5fe393785f09bde.png)

配置多个ip地址：

创建别的网卡配置文件：

![](https://i-blog.csdnimg.cn/direct/4401f7e931e54036aebbe982ab497bca.png)

重启网络服务：

![](https://i-blog.csdnimg.cn/direct/1cdd8ae663c2401489167705e5e96cee.png)

发现有两个ip

![](https://i-blog.csdnimg.cn/direct/94d0e0bc76ba4c23b4ac0cbd58131f25.png)

第二个ip能ping 通：

![](https://i-blog.csdnimg.cn/direct/9065d80115f946d4803443b9cb316604.png)

网络服务管理：

查看服务状态：

command: systemctl status NetworkManager

![](https://i-blog.csdnimg.cn/direct/5c2c8af3e6aa4ed58ab7e22b15145d89.png)

关闭或打开,重启，开机自启以及禁用开机自启

command: systemctl (start/stop/restart/enable/disable) NetworkManager

查看当前主机名：

command: hostnamectl

![](https://i-blog.csdnimg.cn/direct/a252b65de58b4d359e0513667e53ea24.png)

设置主机名：

![](https://i-blog.csdnimg.cn/direct/20c76ec1f26e42d6bf894451243d2233.png)

![](https://i-blog.csdnimg.cn/direct/b12d435ea0bf4656ae504194a3505589.png)

配置dns

通过NetworkManager

![](https://i-blog.csdnimg.cn/direct/3082f8f2d946461b8bdcca48f339089d.png)

测试网络通畅性：

测试网关通畅:

ping -c 4 192.168.145.1

![](https://i-blog.csdnimg.cn/direct/614ba182c0ee427299081beed7137664.png)

查看路由表：

ip route show

![](https://i-blog.csdnimg.cn/direct/278110c88a4348249f2ffdf61d3762e0.png)

查看网络连接：

command: ss -tunlp![](https://i-blog.csdnimg.cn/direct/8e2d2a2c3452481e94c0dc68067b048c.png)

查看监听端口：

command: netstat -tunlp

![](https://i-blog.csdnimg.cn/direct/b55edf4d5d09409882b29f234e1c9a24.png)

查看网络流量：

command: ip -s link

![](https://i-blog.csdnimg.cn/direct/7654e2aada9145aa9864a4badd35b536.png)

查看防火墙状态：

command: firewall-cmd --state

![](https://i-blog.csdnimg.cn/direct/e17e6c5ccc794397ad2029d43c0060fe.png)

关闭及临时关闭防火墙：

command: systemctl (stop/disable) firewall

开启端口：

command: firewall-cmd --permanent --add-port=80/tcp

![](https://i-blog.csdnimg.cn/direct/51f7f4b1ee3c489d870d22d8da7c86fb.png)

重启：firewall-cmd --reload

![](https://i-blog.csdnimg.cn/direct/b229b0a45d4d4aecb379be7712215794.png)

查看SElinux状态

command: geteforce

![](https://i-blog.csdnimg.cn/direct/91a00189e47644e1969547f7590c35c9.png)

临时设置为宽容模式

command: setenforce 0

getenforce

![](https://i-blog.csdnimg.cn/direct/195cfbdd824446648ac322377319bfdf.png)

重新扫描硬件：

command: nmcli device reapply ens33

![](https://i-blog.csdnimg.cn/direct/5ac42350ecc445a6953c66d8baa66f38.png)

完全重启网络服务：

command: systemctl restart NetworkManager

![](https://i-blog.csdnimg.cn/direct/087e9666db0f4e9a99b4ee47d17cb5b5.png)
