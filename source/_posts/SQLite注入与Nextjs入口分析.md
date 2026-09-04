---
title: "SQLite 注入与 Next.js 页面入口分析"
description: 记录授权 CTF 场景中 Next.js 页面入口定位和 SQLite 注入判断过程，整理数据库特征、查询验证与参数化防御方法。
excerpt: 记录授权 CTF 场景中 Next.js 页面入口定位和 SQLite 注入判断过程，整理数据库特征、查询验证与参数化防御方法。
author: Lee
disableNunjucks: true
date: 2026-05-07 16:25:15
updated: 2026-09-04 00:00:00
categories:
  - 漏洞研究
tags:
  - SQLite
  - SQL注入
  - Next.js
  - CTF
article_status: 待复验
difficulty: 中级
original_sources:
  - https://blog.csdn.net/2403_88102829/article/details/160834600
---

> **文章状态：待复验**  
> 本文由 Lee 的 CSDN 原创学习记录迁移并重新整理。以下操作仅限自建环境、CTF 与明确授权靶场，请勿用于未授权目标。

## 学习目标

- 从页面与接口行为识别 Next.js 应用入口
- 理解 SQLite 与常见数据库在语法和元数据上的差异
- 使用最小化验证确认注入而不过度获取数据

## 实验说明

- 难度：中级
- 范围：本地或公开授权靶场
- 复验状态：正文已完成格式迁移，关键结论将在后续使用固定环境重新验证

## 原始实验记录

1：基于sqlite的sql注入

2：next.js

### \[GHCTF 2025\]SQL???

——bool盲注，union注入

##### 测试代码

给了web页面，先测一下

![实验截图 1](/images/csdn/160834600/01.png)

又一个flask，而且有参数，直接尝试sql，并且注意，这里的正常页面长度大概是710k+

![实验截图 2](/images/csdn/160834600/02.png)

恒真恒假测试，回显有异，继续进行bool盲注，试了好几个mysql函数都用不了，尝试SQLlite回显了一个正常页面

![实验截图 3](/images/csdn/160834600/03.png)

后端数据库为 **SQLite，**

以下环境换成23570端口

在url里探测列数，测到?id=1 order by 6--+报错，说明有5列

![实验截图 4](/images/csdn/160834600/04.png)

继续测联合注入?id=-1 union select 1,2,3,4,5--+，回显成功

![实验截图 5](/images/csdn/160834600/05.png)

#### 学习一下SQLite：

- SQLite 是文件型数据库，MySQL 是服务型数据库，两者注入方式不同
- SQLite没有默认端口，但mysql默认端口是3306
- 前者获取版本是sqlite\_version()，后者是version() or @@VERSION
- 都能用group\_concat()
- SQLite用group\_concat(name)一次性查出所有表名
- sqlite\_master是SQLite 的元数据目录表，存储所有表的信息，相当于 MySQL 的 **`information_schema`**

爆版本号?id=-1 union select 1,sqlite\_version(),3,4,5--+

![实验截图 6](/images/csdn/160834600/06.png)

获取表名：?id=-1 union select 1,sqlite\_version(),group\_concat(name),4,5 from sqlite\_master

![实验截图 7](/images/csdn/160834600/07.png)

发现flag表，进一步进去看?id=-1 union select 1,\*,3,4,5 from flag

![实验截图 8](/images/csdn/160834600/08.png)

成功找到flag

### \[LitCTF 2025\]nest\_js

进去是一个登录框，先disearch扫下url，只扫到一个favicon.ico ，进去看是一个图标，没什么用，whatweb看一下

![实验截图 9](/images/csdn/160834600/09.png)

PasswordField，跟页面的登录框对应上，注意还有个X-Powered-By\[Next.js\]，说明前面的x框架由Next.js驱动

学习一下Next.js，**Next.js** 是**框架**，它**基于 React(构建用户界面的JS库)**，并给它加上了**路由、服务端渲染、API 后端**等全套功能

题目提示了弱口令爆破，但是对于next.js./react框架，页面源码看不到是post还是get，js文件里才能看到

看源码再确定一下，提交框无action属性

![实验截图 10](/images/csdn/160834600/10.png)

路径里有js文件

![实验截图 11](/images/csdn/160834600/11.png)

下载这个文件

```
curl -s http://authorized-lab.local/_next/static/chunks/app/login/page-b20a48e2d273348a.js -o login_page.js
```

* * *

**目的：** Next.js 会将页面逻辑打包到 `/_next/static/chunks/` 目录，分析这些文件找到 API 端点。

下载登录页面的 JS 文件（从页面源码中找到的路径）

curl -s http://authorized-lab.local/\_next/static/chunks/app/login/page-b20a48e2d273348a.js -o login\_page.js

搜索 API 相关关键词 grep -E "(api|fetch|axios|login|/api/)" login\_page.js | head -20

![实验截图 12](/images/csdn/160834600/12.png) 发现了是POST，两个字段名是username和password

![实验截图 13](/images/csdn/160834600/13.png)

弱密码爆破得到admin:password

 携带 token 访问 dashboard

curl -s -H "Cookie: token=generated-jwt-token-here" \\ http://authorized-lab.local/dashboard

得到flag

![实验截图 14](/images/csdn/160834600/14.png)

## 防御与复盘

- 所有查询参数均使用参数化语句，不拼接来自 URL、表单或 JSON 的输入。
- 为异常查询、数据库错误和高频探测建立监控。
- 生产环境关闭详细错误回显，并限制数据库文件和备份文件的访问。

## 原文出处

- [CSDN 原创记录](https://blog.csdn.net/2403_88102829/article/details/160834600)
