---
title: "DVWA CSP Bypass：策略配置、信任边界与绕过条件"
description: 通过 DVWA 授权环境分析 CSP 配置与绕过条件，说明宽泛来源、内联脚本和受信任端点如何削弱策略，并总结安全配置方法。
excerpt: 通过 DVWA 授权环境分析 CSP 配置与绕过条件，说明宽泛来源、内联脚本和受信任端点如何削弱策略，并总结安全配置方法。
author: Lee
disableNunjucks: true
date: 2025-06-05 19:10:59
updated: 2026-09-04 00:00:00
categories:
  - Web安全教学
tags:
  - DVWA
  - CSP
  - XSS
  - Web安全
article_status: 待复验
difficulty: 中级
original_sources:
  - https://blog.csdn.net/2403_88102829/article/details/148453276
---

> **文章状态：待复验**  
> 本文由 Lee 的 CSDN 原创学习记录迁移并重新整理。以下操作仅限自建环境、CTF 与明确授权靶场，请勿用于未授权目标。

## 学习目标

- 读懂常见 CSP 指令及其信任边界
- 理解允许列表为何可能被受信任端点反向利用
- 设计基于 nonce 或 hash 的更严格脚本策略

## 实验说明

- 难度：中级
- 范围：本地或公开授权靶场
- 复验状态：正文已完成格式迁移，关键结论将在后续使用固定环境重新验证

## 原始实验记录

### CSP（content security policy）：

个人理解是类似于白名单的东西，通过http头部或者<meta>标签声明，来控制网页可以加载哪些外部资源

ps:Meta标签是html文档里的一种标签，用于提供网页的**元信息**

也就是说，**CSP禁止所有未被明确允许的内容，只执行符合条件的资源**

##### 关键指令：script-src：

script-src指定哪些来源的JavaScript可以被浏览器加载和执行

### LOW

先分析一下源码

![实验截图 1](/images/csdn/148453276/01.png)

通过这一行可以得到允许的来源

- 'self '：同源脚本 （和当前页面有相同协议，域名，端口的js文件）
- https://pastebin.com
- hastebin.com
- example.com
- code.jquery.com
- https://ssl.google-analytics.com

这里选用https://pastebin.com来进行攻击，在newpaste里写

```
alert("rerelee")
```

![实验截图 2](/images/csdn/148453276/02.png)

Creat New Paste ，在出现的页面里面点击download，然后右键复制下载连接

![实验截图 3](/images/csdn/148453276/03.png)

![实验截图 4](/images/csdn/148453276/04.png)

 返回dvwa，在输入框里输入我们刚才复制的代码，然后Include提交！回显成功！

![实验截图 5](/images/csdn/148453276/05.png)

### MEDIUM

观察源码，发现直接泄露了，那就稍作改动输入

![实验截图 6](/images/csdn/148453276/06.png)

![实验截图 7](/images/csdn/148453276/07.png) 回显成功！

### HIGH

看到high的界面，我们发现输入框已经没了.....

打开high.js，直接在里面进行修改

![实验截图 8](/images/csdn/148453276/08.png)

试了好几种方法都改动不了，于是打开控制台

 输入这一串把前面的js文件覆盖掉

```
solveSum = function(obj) {
  alert("rerelee"); // 强制弹窗
  if ("answer" in obj) {
    document.getElementById("answer").innerHTML = obj['answer'];
  }
};
```

回车后回显成功

![实验截图 9](/images/csdn/148453276/09.png)

### IMPOSSIBLE

分析源码：

```
<?php

$headerCSP = "Content-Security-Policy: script-src 'self';";

header($headerCSP);

?>
<?php
if (isset ($_POST['include'])) {
$page[ 'body' ] .= "
    " . $_POST['include'] . "
";
}
$page[ 'body' ] .= '
<form name="csp" method="POST">
    <p>Unlike the high level, this does a JSONP call but does not use a callback, instead it hardcodes the function to call.</p><p>The CSP settings only allow external JavaScript on the local server and no inline code.</p>
    <p>1+2+3+4+5=<span id="answer"></span></p>
    <input type="button" id="solve" value="Solve the sum" />
</form>

<script src="source/impossible.js"></script>
';
```

![实验截图 10](/images/csdn/148453276/10.png)

优化的地方：

1.  csp更加严格，只允许加载同源脚本self
2.  

![实验截图 11](/images/csdn/148453276/11.png)
3.  通过document.createElement动态加载脚本确保来源是可信的

## 防御与复盘

- 优先使用 nonce 或 hash，减少 unsafe-inline 和宽泛域名允许列表。
- 检查允许来源中的 JSONP、开放重定向和用户可控内容端点。
- 先以 Report-Only 观察违规报告，再逐步收紧正式策略。

## 原文出处

- [CSDN 原创记录](https://blog.csdn.net/2403_88102829/article/details/148453276)
