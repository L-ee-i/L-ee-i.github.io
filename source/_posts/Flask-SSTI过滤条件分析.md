---
title: "Flask SSTI：过滤条件下的模板注入分析"
description: 通过授权靶场识别 Flask/Jinja2 模板注入，分析表达式过滤、对象访问和上下文暴露问题，并给出模板渲染边界与修复建议。
excerpt: 通过授权靶场识别 Flask/Jinja2 模板注入，分析表达式过滤、对象访问和上下文暴露问题，并给出模板渲染边界与修复建议。
author: Lee
disableNunjucks: true
date: 2026-05-08 09:16:06
updated: 2026-09-04 00:00:00
categories:
  - 漏洞研究
tags:
  - Flask
  - SSTI
  - Jinja2
  - 代码审计
article_status: 待复验
difficulty: 进阶
original_sources:
  - https://blog.csdn.net/2403_88102829/article/details/160869205
---

> **文章状态：待复验**  
> 本文由 Lee 的 CSDN 原创学习记录迁移并重新整理。以下操作仅限自建环境、CTF 与明确授权靶场，请勿用于未授权目标。

## 学习目标

- 判断用户输入是否进入服务端模板解释器
- 理解模板上下文和对象访问带来的攻击面
- 区分输出转义与禁止动态模板执行的作用

## 实验说明

- 难度：进阶
- 范围：本地或公开授权靶场
- 复验状态：正文已完成格式迁移，关键结论将在后续使用固定环境重新验证

## 原始实验记录

两个思路一样的题er...

### 星愿信箱；

给了一个输入内容重复回显的页面，先用wappalyzer进行技术栈识别

![实验截图 1](/images/csdn/160869205/01.png)

一个基于python的flask，先看有没有ssti漏洞，没有的话尝试session伪造

尝试{{7\*7}}，没有有效回显

![实验截图 2](/images/csdn/160869205/02.png)

补充模板引擎：

- Jinja2：使用{{}}作为输出语法（{{7\*7}}）
- Mako：使用${}作为输出语法（${7\*7}）

尝试{%%}，回显成功，存在ssti漏洞，而且{{}}可能被过滤掉了

![实验截图 3](/images/csdn/160869205/03.png)

找可以访问的全局对象——回显包括这个flask的所有全局变量，函数，导入模块，内置函数，看全局对象的原因是为了看\_\_builtins\_\_与os模块是否存在，他们如果都存在的话，证明我们可以用一些命令来探测信息

```
{% print(url_for.__globals__) %}
```

![实验截图 4](/images/csdn/160869205/04.png)

![实验截图 5](/images/csdn/160869205/05.png)

存在包含 `__builtins__` 的字典对象以及os

直接尝试读取flag

```
{% print(url_for.__globals__['__builtins__']['open']('/flag').read()) %}
```

回显成功

![实验截图 6](/images/csdn/160869205/06.png)

### \[玄武杯 2025\]锦家有什么

flask..

![实验截图 7](/images/csdn/160869205/07.png)

进入主页面，发现按钮失效，view-source一下：

提示路径try\_a\_try

![实验截图 8](/images/csdn/160869205/08.png)

访问，提示输入参数

![实验截图 9](/images/csdn/160869205/09.png)

发现写入name参数的时候回显有改变?name=leee

![实验截图 10](/images/csdn/160869205/10.png)

因为先前验证了模板是flask，所以试一下ssti，回显正确

![实验截图 11](/images/csdn/160869205/11.png)

继续看全局对象,?name={{url\_for.\_\_globals\_\_}}，回显有\_\_builtins\_\_以及os

![实验截图 12](/images/csdn/160869205/12.png)

![实验截图 13](/images/csdn/160869205/13.png)

直接读，?name=={{(url\_for.\_\_globals\_\_\['\_\_builtins\_\_'\]\['open'\]('/flag').read())}}

拿到flag

![实验截图 14](/images/csdn/160869205/14.png)

## 防御与复盘

- 不要把用户输入拼接成模板源代码，应将其作为普通数据传入固定模板。
- 减少模板上下文中暴露的对象和函数，避免依赖不完整的字符黑名单。
- 为异常模板表达式和执行错误建立日志与告警。

## 原文出处

- [CSDN 原创记录](https://blog.csdn.net/2403_88102829/article/details/160869205)
