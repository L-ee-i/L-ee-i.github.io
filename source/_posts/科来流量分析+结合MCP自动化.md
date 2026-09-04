---
link: https://blog.csdn.net/2403_88102829/article/details/164360137
title: 科来流量分析与 MCP 自动化
description: 通过两份 Weevely 通信流量还原 WebShell 操作，并将科来命令行解析能力封装为 MCP 服务，实现抓包检索、协议统计与报告自动生成。
excerpt: 通过两份 Weevely 通信流量还原 WebShell 操作，并将科来命令行解析能力封装为 MCP 服务，实现抓包检索、协议统计与报告自动生成。
keywords: 自动化,运维
author: Lee
date: 2026-09-04T02:03:14.000Z
categories:
  - 工具与自动化
tags:
  - 流量分析
  - WebShell
  - MCP
  - 自动化
---
主要分析两份 Weevely 通信流量，并尝试把科来网络分析系统与 Codex 连接起来，实现抓包文件的自动解析和报告生成。

使用的抓包文件为：

* `weevely3_4.pcapng`
* `weevely3_4_C.pcapng`

从当前抓包可以确认 `/hackable/uploads/wShell.php` 已经存在并被调用，但没有直接捕获其上传过程。

上传者的IP172.16.1.76——攻击端

被上传者的IP172.16.1.163——被攻击的服务器![](https://i-blog.csdnimg.cn/direct/da3d23db27b04c85a719cfa2e81a5072.png)

webshell文件上传后存储在这里![](https://i-blog.csdnimg.cn/direct/e031662346e84d01a04cf2a2b136e461.png)

完整请求路径是：

```
/hackable/uploads/wShell.php
```

Webshell上传后 攻击者又做什么？

看一下第一个http请求对应的数据流，可以看到攻击者通过POST请求像webshell发送了payload——HTTP请求体

这里需要注意：这条 POST 请求能够证明 WebShell 已经存在于服务器上，并且开始接收攻击命令，但不能单独证明 WebShell 的上传过程也包含在这段流量中。

然后双击查看第一条http通信的数据流，可以看到攻击者通过 POST 请求向 WebShell 发送了一段 Payload。

由于抓包文件名中带有 `weevely`，因此判断这可能是 Weevely 产生的加密通信。

Weevely 不会直接发送明文命令，而是使用连接密码生成 MD5，并将 MD5 的不同部分作为异或密钥和通信标记。

在请求体和响应体中，可以发现下面两个字符串反复出现

```
0339f2efd328
6b3c9e505489
```

对密码字典进行计算后，发现：

```
MD5(bmk) = 890ce1120339f2efd3286b3c9e505489
```

刚好可以对应抓包中的两个固定标记，因此可以确定连接密码为：

```
bmk
```

其中，MD5 的前8位：

```
890ce112
```

就是解密通信内容使用的异或密钥。

完整的对应关系为：

```
异或密钥：890ce112
开始标记：0339f2efd328
结束标记：6b3c9e505489
```

Weevely 流量的基本还原过程为：

解密第一轮通信后得到：

```
try {
    echo(24331);
} catch(Exception $e) {
    // 返回执行错误
}
```

其中真正执行的操作是：

```
echo(24331);
```

外面的 `try...catch` 主要用于捕获错误，并把错误信息返回给 Weevely 客户端。

后续还原出的命令依次为：

```
echo 40902
whoami
ls
pwd
```

对应结果如下：

```
echo 40902：返回 40902，用于测试命令执行是否正常。

whoami：返回 nginx，说明 Web 服务以 nginx 用户身份运行。

ls：查看当前目录中的文件。

pwd：返回 /usr/share/nginx/html/hackable/uploads，
说明 WebShell 当前位于该目录。
```

还是看http日志，发现攻击者已经上传了webshell——wShell3.php，HTTP 日志中发现向 `/vulnerabilities/upload/` 发起的 multipart/form-data POST 请求，上传文件名为 `wShell3.php`，服务器响应显示上传成功。

点进去看源ip和目的ip，跟上一个一样![](https://i-blog.csdnimg.cn/direct/bbce648ce5384016a437848d86cdff93.png)

按照前面同样的方法分析，这一次的固定标记是：![](https://i-blog.csdnimg.cn/direct/358c280ae80d4889b7d4e84d40735359.png)![](https://i-blog.csdnimg.cn/direct/5ee3a42bb64c464f90e8baf1eaabd117.png)

按照案例一相同的方法，观察 HTTP 请求体和响应体，可以找到这一组固定标记：

```
开始标记：b5c349531268
结束标记：ae8484112a78
```

通过字典计算，发现密码 `lyb` 的 MD5 为：

```
MD5(lyb) = 38d17dd2b5c349531268ae8484112a78
```

它正好包含抓包中的两个固定标记，因此可以确定本次 Weevely 连接使用的密码为：

```
lyb
```

本次通信使用的异或密钥为 MD5 的前8位：

```
38d17dd2
```

完整对应关系为：

```
异或密钥：38d17dd2
开始标记：b5c349531268
结束标记：ae8484112a78
```

对每一轮通信进行解密后，得到以下操作：

```
echo 89386
```

返回 `89386`，用于测试 WebShell 能否正常执行和返回结果。

```
echo 38658
```

返回 `38658`，再次测试系统命令执行功能。

```
gethostname()
```

获取服务器主机名，结果为：

```
localhost.localdomain
```

随后 Weevely 获取当前运行用户，结果为：

```
nginx
```

```
getcwd()
```

获取当前工作目录，结果为：

```
/usr/share/nginx/html/hackable/uploads
```

```
whoami
```

再次确认当前用户，返回：

```
nginx
```

查看当前目录中的文件，返回结果中包括：

```
Decrypt.php
antShell.php
cShell.php
dvwa_email.png
shell.php
shell3.php
wShell.phar
wShell.php
wShell3.php
weevelyDeCrypt.php
```

```
pwd
```

确认当前目录为：

```
/usr/share/nginx/html/hackable/uploads
```

之后，攻击者又尝试执行：

```
ip a
ip
ipconfig
ifconfig
```

这些命令都用于查看服务器的网络配置，但响应中均提示命令不存在。

最后执行：

```
netstat
```

攻击者可能想查看服务器当前的网络连接，不过抓包中没有捕获到对应的响应结果，因此无法确定该命令最终是否执行成功。

综合当前抓包能够还原的内容，攻击者获取了服务器主机名、运行用户、当前目录和目录文件。除此之外，暂未发现其获取更多敏感信息的证据。

正常情况下，使用科来完成抓包后，需要手动打开文件、查看协议统计、筛选 IP，再把结果交给 Codex 分析。

为了减少这些重复操作，我使用科来自带的 `cmdl.exe` 抓包解析工具，制作了一个本地 MCP Server。

连接以后，Codex 可以直接调用科来的解析能力，对 `.cap`、 `.pcap` 和 `.pcapng` 文件进行查询，例如：

* 检查科来及解析组件是否正常。
* 查找指定目录中的抓包文件。
* 统计协议数量和通信端点。
* 按照 IP、端口或协议筛选数据包。
* 分析 DNS 查询和错误响应。
* 查看 ICMP 请求与响应。
* 分析主要网络会话。

整个 MCP 只读取本地抓包，不会主动发送数据包，也不会修改科来的配置。

首先在 Codex 的配置文件中添加：

```
[mcp_servers.colasoft]
command = 'C:\Program Files\Python38\python.exe'
args = [
  'D:\工具\Colasoft-MCP\colasoft_mcp.py',
  '--capture-root',
  'C:\Users\pc\Desktop\流量分析作业'
]
```

其中：

```
command
```

用于指定运行 MCP Server 的 Python。

```
colasoft_mcp.py
```

是编写的 MCP Server 主程序。

```
--capture-root
```

用于指定 Codex 可以查找和分析抓包文件的目录。

新建 Codex 任务时，Codex 会按照该配置启动 Python 程序。双方通过标准输入和标准输出传递 MCP 消息。

当 Codex发起分析请求后，MCP Server 调用科来的 `cmdl.exe` 解析抓包，再把数据包结果整理成结构化内容返回给 Codex。

基本流程如下：

```
用户提出分析要求
        ↓
Codex 调用 MCP 工具
        ↓
colasoft_mcp.py 接收请求
        ↓
调用科来 cmdl.exe 解析抓包
        ↓
MCP 整理解析结果
        ↓
Codex 输出分析结论
```

除了 MCP Server，还运行了一个单独的目录监控程序：

```
colasoft_watcher.py
```

该程序会在后台监控抓包目录。

当科来保存新的抓包文件后，监控程序会等待文件写入完成，然后调用相同的解析功能，并在抓包旁边生成 HTML 报告。

例如：

```
kall-Packets.cap
```

会自动生成：

```
kall-Packets.analysis.html
```

因此，这套功能分为两部分：

```
MCP Server：供 Codex 按需查询和分析抓包。

目录监控程序：发现新抓包后自动生成 HTML 报告。
```

为了测试自动分析是否正常，我使用 Kali 分别 Ping Windows 主机和 VMware 网关。

测试环境中的 IP 为：

```
Kali：192.168.145.10
Windows 主机：192.168.145.1
VMware 网关：192.168.145.2
```

测试期间使用科来进行抓包。

首先从 Kali Ping Windows 主机：

```
ping 192.168.145.1
```

然后 Ping VMware 网关：

```
ping 192.168.145.2
```

停止捕获后，将数据包保存为：

```
kall-Packets.cap
```

文件保存完成后，后台监控程序自动发现该抓包，并生成：

```
kall-Packets.analysis.html
```

报告中的分析结果为：

```
数据包总数：34
ICMP 数据包：16
ARP 数据包：18
```

Kali 与 Windows 主机之间存在：

```
4个 ICMP Echo Request
4个 ICMP Echo Reply
```

Kali 与 VMware 网关之间也存在：

```
4个 ICMP Echo Request
4个 ICMP Echo Reply
```

每个请求都收到了对应响应，因此可以确定两次 Ping 均成功。

这也说明科来能够正常捕获数据包，后台程序能够自动发现并解析新抓包，生成的协议统计和 ICMP 通信结果也与实际测试过程一致。

通过两份 Weevely 抓包，可以还原攻击者与 WebShell 之间的通信过程。

案例一中，攻击者已经开始使用 `wShell.php`，并执行了 `echo`、 `whoami`、 `ls` 和 `pwd` 等命令。

案例二中，不仅捕获到了 `wShell3.php` 的上传过程，还还原出了获取主机名、用户名、当前目录以及尝试查询网络配置等操作。

在此基础上，将科来的 `cmdl.exe` 封装成 MCP Server，使 Codex 可以直接查询本地抓包；再配合目录监控程序，实现新抓包保存后自动生成 HTML 报告。

这套方式的作用不是代替科来抓包，而是把抓包完成后的查找、统计、筛选和报告生成过程自动化，减少每次手动打开抓包、截图和整理结果的重复操作。

分析结果：

总共捕获34个数据包，其中有16个 ICMP包和18个 ARP包。

Kali与Windows主机之间有4个请求和4个响应。

Kali与VMware网关之间也有4个请求和4个响应。

由此可以确定两次 Ping 均成功，功能一切正常~
