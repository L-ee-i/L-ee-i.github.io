---
title: "DVWA CSRF：不同安全等级下的防护差异"
description: 基于 DVWA 授权环境比较不同安全等级下的 CSRF 行为，从请求构造、令牌校验和来源限制三个角度理解漏洞与防护。
excerpt: 基于 DVWA 授权环境比较不同安全等级下的 CSRF 行为，从请求构造、令牌校验和来源限制三个角度理解漏洞与防护。
author: Lee
disableNunjucks: true
date: 2025-05-30 09:35:59
updated: 2026-09-04 00:00:00
categories:
  - Web安全教学
tags:
  - DVWA
  - CSRF
  - Web安全
  - 安全教学
article_status: 待复验
difficulty: 入门
original_sources:
  - https://blog.csdn.net/2403_88102829/article/details/148307235
---

> **文章状态：待复验**  
> 本文由 Lee 的 CSDN 原创学习记录迁移并重新整理。以下操作仅限自建环境、CTF 与明确授权靶场，请勿用于未授权目标。

## 学习目标

- 理解浏览器自动携带身份凭据造成的 CSRF 风险
- 比较无防护、来源校验和随机令牌的差异
- 掌握 SameSite Cookie 等纵深防御措施

## 实验说明

- 难度：入门
- 范围：本地或公开授权靶场
- 复验状态：正文已完成格式迁移，关键结论将在后续使用固定环境重新验证

## 原始实验记录

### LOW：

先尝试change一组密码：123456

![实验截图 1](/images/csdn/148307235/01.png)

修改成功，我们观察上面的url代码

```
http://localhost/DVWA/vulnerabilities/csrf/?password_new=123456&password_conf=123456&Change=Change#
```

将password\_new部分与password\_conf部分改成我们想要的密码：4321

```
http://localhost/DVWA/vulnerabilities/csrf/?password_new=4321&password_conf=4321&Change=Change#
```

新建一个页面打开，发现密码修改成功

![实验截图 2](/images/csdn/148307235/02.png)

###  MEDIUM：

尝试同样的方法发现请求失败

![实验截图 3](/images/csdn/148307235/03.png)

并且上方跳出来这个 ，第一行说请求头缺失，请求头记录着

![实验截图 4](/images/csdn/148307235/04.png)

查看这一关的源码并与low的做对比 ，多出来的这个if判断条件应该是判断当前的访问请求是否更换页面了，如果不是，就不执行请求

![实验截图 5](/images/csdn/148307235/05.png)

用bp抓包原来的请求，可以注意到这里有一个referer

![实验截图 6](/images/csdn/148307235/06.png)

* * *

### \*\*\*Referer\*\*\*:

是http请求头中的一个字段，作用是指示**当前请求的网页的来源**，也就是说， referer后面的内容会告诉服务器这个请求来自于哪个页面或者url

* * *

在url里面像low一样修改成我们想要的密码，新起一个页面，bp抓包，抓到这些

![实验截图 7](/images/csdn/148307235/07.png)

send to repeater，添加如下代码

```
Referer:localhost
```

![实验截图 8](/images/csdn/148307235/08.png)

render！修改成功！！！

![实验截图 9](/images/csdn/148307235/09.png)

### HIGH：

我们刚才改的密码是1111，这一级我们要把它改成0000

先提交一个新密码hhhh，并且bp抓包，抓到这些，发现这一关有了token验证

![实验截图 10](/images/csdn/148307235/10.png)

send to intreuder，和第一关一样，先clear，再把三个参数add进去，攻击方式选择Pithchfork

然后去Payloads，在payloas setting里add进我们要修改的密码，防止token失效，我们多加几组

![实验截图 11](/images/csdn/148307235/11.png)

然后和第一关一样，递归找token，先在资源池resoource pool里设置单线程

![实验截图 12](/images/csdn/148307235/12.png)

 settings里（有的版本的dp是options）

![实验截图 13](/images/csdn/148307235/13.png)

![实验截图 14](/images/csdn/148307235/14.png)

回payloads，加上

![实验截图 15](/images/csdn/148307235/15.png)

Start attack！！！！！！！！！！

![实验截图 16](/images/csdn/148307235/16.png)

关闭bp，去第一关，输入用户名和密码

![实验截图 17](/images/csdn/148307235/17.png)

登陆成功！！！！！！！！！

### IMPOSSIBLE：

 我们观察一下源码

```
CSRF Source
vulnerabilities/csrf/source/impossible.php

<?php

if( isset( $_GET[ 'Change' ] ) ) {
    // Check Anti-CSRF token
    checkToken( $_REQUEST[ 'user_token' ], $_SESSION[ 'session_token' ], 'index.php' );

    // Get input
    $pass_curr = $_GET[ 'password_current' ];
    $pass_new  = $_GET[ 'password_new' ];
    $pass_conf = $_GET[ 'password_conf' ];

    // Sanitise current password input
    $pass_curr = stripslashes( $pass_curr );
    $pass_curr = ((isset($GLOBALS["___mysqli_ston"]) && is_object($GLOBALS["___mysqli_ston"])) ? mysqli_real_escape_string($GLOBALS["___mysqli_ston"],  $pass_curr ) : ((trigger_error("[MySQLConverterToo] Fix the mysql_escape_string() call! This code does not work.", E_USER_ERROR)) ? "" : ""));
    $pass_curr = md5( $pass_curr );

    // Check that the current password is correct
    $data = $db->prepare( 'SELECT password FROM users WHERE user = (:user) AND password = (:password) LIMIT 1;' );
    $data->bindParam( ':user', dvwaCurrentUser(), PDO::PARAM_STR );
    $data->bindParam( ':password', $pass_curr, PDO::PARAM_STR );
    $data->execute();

    // Do both new passwords match and does the current password match the user?
    if( ( $pass_new == $pass_conf ) && ( $data->rowCount() == 1 ) ) {
        // It does!
        $pass_new = stripslashes( $pass_new );
        $pass_new = ((isset($GLOBALS["___mysqli_ston"]) && is_object($GLOBALS["___mysqli_ston"])) ? mysqli_real_escape_string($GLOBALS["___mysqli_ston"],  $pass_new ) : ((trigger_error("[MySQLConverterToo] Fix the mysql_escape_string() call! This code does not work.", E_USER_ERROR)) ? "" : ""));
        $pass_new = md5( $pass_new );

        // Update database with new password
        $data = $db->prepare( 'UPDATE users SET password = (:password) WHERE user = (:user);' );
        $data->bindParam( ':password', $pass_new, PDO::PARAM_STR );
        $data->bindParam( ':user', dvwaCurrentUser(), PDO::PARAM_STR );
        $data->execute();

        // Feedback for the user
        echo "<pre>Password Changed.</pre>";
    }
    else {
        // Issue with passwords matching
        echo "<pre>Passwords did not match or current password incorrect.</pre>";
    }
}

// Generate Anti-CSRF token
generateSessionToken();

?>
```

#### 优化地方：

1.  使用了pdo预处理：我的理解是提前规划好了传递数据的模板，只从用户的输入中提取数据，而其输入不能当成代码处理，比如 'or '1'=1，只能被当初密码

![实验截图 18](/images/csdn/148307235/18.png)
2.  checktoken

![实验截图 19](/images/csdn/148307235/19.png)
3.  mysqli\_real\_escape\_string 转义

![实验截图 20](/images/csdn/148307235/20.png)
4.  原密码验证，攻击者很难知道

![实验截图 21](/images/csdn/148307235/21.png)
5.  MD5加密，好像需要彩虹表解密，还不了解

![实验截图 22](/images/csdn/148307235/22.png)

综上，无法突破

## 防御与复盘

- 对状态变更请求使用不可预测并与会话绑定的 CSRF Token。
- 合理设置 SameSite Cookie，并校验 Origin 或 Referer 作为辅助措施。
- 敏感操作增加重新认证或二次确认，且不要使用 GET 执行状态变更。

## 原文出处

- [CSDN 原创记录](https://blog.csdn.net/2403_88102829/article/details/148307235)
