---
title: 学习路径
date: 2026-09-04 00:00:00
comments: false
description: Lee's SecLab 的网络安全学习路径，将分散实验整理为带有目标、难度、复盘和防御视角的系列课程。
---

这里按照知识依赖组织内容，而不是简单罗列文章。迁移自早期笔记的内容会标注复验状态；完成固定环境验证后再升级为“已复验”。

<div class="project-grid">
  <a class="project-card" href="/learning/sql-injection/">
    <span class="project-status">3 个现有单元</span>
    <h3>SQL 注入学习路径</h3>
    <p>从输入面识别、数据库差异到文件权限风险，逐步整理 SQLi-Labs 与 CTF 实验。</p>
  </a>
  <a class="project-card" href="/2025/05/30/DVWA-CSRF防护差异/">
    <span class="project-status">入门</span>
    <h3>DVWA · CSRF</h3>
    <p>比较不同安全等级下的请求行为、令牌校验和来源限制。</p>
  </a>
  <a class="project-card" href="/2025/06/05/DVWA-CSP-Bypass/">
    <span class="project-status">中级</span>
    <h3>DVWA · CSP Bypass</h3>
    <p>分析脚本来源、信任边界与策略绕过条件，并回到防御配置。</p>
  </a>
  <a class="project-card" href="/2026/08/01/无字符WebShell与PHP代码审计/">
    <span class="project-status">进阶</span>
    <h3>PHP 代码审计</h3>
    <p>从无字符表达式构造理解黑名单缺陷、动态调用和危险数据流。</p>
  </a>
</div>

## 新增专题文章

- [HTTP 方法枚举与 PUT 风险](/2026/08/04/HTTP方法枚举与PUT风险/)
- [Flask SSTI：过滤条件下的模板注入分析](/2026/05/08/Flask-SSTI过滤条件分析/)
- [SQLite 注入与 Next.js 页面入口分析](/2026/05/07/SQLite注入与Nextjs入口分析/)

后续会继续把 DVWA 和 SQLi-Labs 系列按知识点合并，减少“逐关流水账”，补充代码根因、检测方法和修复练习。
