---
title: 项目
date: 2026-09-04 00:00:00
comments: false
description: Lee's SecLab 中已经完成验证、可以继续阅读的安全研究与自动化实践。
---

这里仅展示已经有过程记录和验证结果的实践，不把构想或空白入口包装成“已完成项目”。

<div class="project-grid">
  <a class="project-card" href="/2026/07/20/cat命令注入绕过检测规则的自动化生成/">
    <span class="project-status">实验验证完成</span>
    <h3>命令注入规则自动挖掘</h3>
    <p>围绕 OWASP CRS 的 cat 命令注入检测，从攻击样本、语义聚类、规则生成到 ModSecurity 实测，比较检出率和误报表现。</p>
  </a>
  <a class="project-card" href="/2026/09/04/科来流量分析+结合MCP自动化/">
    <span class="project-status">原型已验证</span>
    <h3>科来流量分析与 MCP 自动化</h3>
    <p>使用真实 Weevely 通信抓包还原 WebShell 操作，并把本地解析能力封装为 MCP 服务，完成检索、统计和报告生成。</p>
  </a>
</div>

项目卡片会进入对应的完整文章；目前没有公开代码仓库的项目不会显示虚假的“源码”按钮。后续有可复用代码时，再补充真实仓库地址。
