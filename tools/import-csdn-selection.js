'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const TurndownService = require('turndown');
const { gfm } = require('turndown-plugin-gfm');

const projectRoot = path.resolve(__dirname, '..');
const postsRoot = path.join(projectRoot, 'source', '_posts');
const imagesRoot = path.join(projectRoot, 'source', 'images', 'csdn');
const author = '2403_88102829';
const browserHeaders = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36',
  'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8'
};

const selections = [
  {
    ids: ['163472901'],
    filename: 'HTTP方法枚举与PUT风险.md',
    title: 'HTTP 方法枚举与 PUT 风险：从 OPTIONS 探测到配置加固',
    date: '2026-08-04 14:44:27',
    description: '通过授权靶场分析 OPTIONS 方法枚举与 PUT 写入风险，记录识别思路、验证过程、必要条件以及服务端方法限制与权限加固方案。',
    category: '漏洞研究',
    tags: ['HTTP', '方法枚举', 'PUT', 'Web安全'],
    difficulty: '中级',
    objectives: ['理解 OPTIONS 响应与 Allow 头的意义', '识别 PUT 风险成立所需的写入和执行条件', '从服务端配置角度限制不必要的 HTTP 方法'],
    defense: ['仅开放业务实际需要的 HTTP 方法，并在反向代理与应用层同时校验。', '上传或写入目录与可执行目录分离，避免文件写入直接演变为代码执行。', '记录异常 OPTIONS、PUT、DELETE 请求，并结合来源、路径和响应状态进行告警。']
  },
  {
    ids: ['163079661'],
    filename: '无字符WebShell与PHP代码审计.md',
    title: '无字符 WebShell：PHP 表达式构造与代码审计',
    date: '2026-08-01 10:22:47',
    description: '在授权 CTF 场景中分析字母过滤条件下的 PHP 表达式构造，解释异或、可变变量与动态调用的原理，并总结代码审计和防御要点。',
    category: '漏洞研究',
    tags: ['PHP', '代码审计', 'WebShell', 'CTF'],
    difficulty: '进阶',
    objectives: ['理解 PHP 字符串异或和可变变量的行为', '分析黑名单过滤为何无法等价于安全控制', '建立从输入点到危险函数的数据流审计思路'],
    defense: ['避免执行来自用户输入的表达式，不使用 eval 等动态执行机制处理不可信数据。', '使用明确的语法和参数白名单，而不是依赖字母或关键字黑名单。', '结合静态分析、运行时审计和最小权限降低代码执行后的影响。']
  },
  {
    ids: ['160869205'],
    filename: 'Flask-SSTI过滤条件分析.md',
    title: 'Flask SSTI：过滤条件下的模板注入分析',
    date: '2026-05-08 09:16:06',
    description: '通过授权靶场识别 Flask/Jinja2 模板注入，分析表达式过滤、对象访问和上下文暴露问题，并给出模板渲染边界与修复建议。',
    category: '漏洞研究',
    tags: ['Flask', 'SSTI', 'Jinja2', '代码审计'],
    difficulty: '进阶',
    objectives: ['判断用户输入是否进入服务端模板解释器', '理解模板上下文和对象访问带来的攻击面', '区分输出转义与禁止动态模板执行的作用'],
    defense: ['不要把用户输入拼接成模板源代码，应将其作为普通数据传入固定模板。', '减少模板上下文中暴露的对象和函数，避免依赖不完整的字符黑名单。', '为异常模板表达式和执行错误建立日志与告警。']
  },
  {
    ids: ['160834600'],
    filename: 'SQLite注入与Nextjs入口分析.md',
    title: 'SQLite 注入与 Next.js 页面入口分析',
    date: '2026-05-07 16:25:15',
    description: '记录授权 CTF 场景中 Next.js 页面入口定位和 SQLite 注入判断过程，整理数据库特征、查询验证与参数化防御方法。',
    category: '漏洞研究',
    tags: ['SQLite', 'SQL注入', 'Next.js', 'CTF'],
    difficulty: '中级',
    objectives: ['从页面与接口行为识别 Next.js 应用入口', '理解 SQLite 与常见数据库在语法和元数据上的差异', '使用最小化验证确认注入而不过度获取数据'],
    defense: ['所有查询参数均使用参数化语句，不拼接来自 URL、表单或 JSON 的输入。', '为异常查询、数据库错误和高频探测建立监控。', '生产环境关闭详细错误回显，并限制数据库文件和备份文件的访问。']
  },
  {
    ids: ['148307235'],
    filename: 'DVWA-CSRF防护差异.md',
    title: 'DVWA CSRF：不同安全等级下的防护差异',
    date: '2025-05-30 09:35:59',
    description: '基于 DVWA 授权环境比较不同安全等级下的 CSRF 行为，从请求构造、令牌校验和来源限制三个角度理解漏洞与防护。',
    category: 'Web安全教学',
    tags: ['DVWA', 'CSRF', 'Web安全', '安全教学'],
    difficulty: '入门',
    objectives: ['理解浏览器自动携带身份凭据造成的 CSRF 风险', '比较无防护、来源校验和随机令牌的差异', '掌握 SameSite Cookie 等纵深防御措施'],
    defense: ['对状态变更请求使用不可预测并与会话绑定的 CSRF Token。', '合理设置 SameSite Cookie，并校验 Origin 或 Referer 作为辅助措施。', '敏感操作增加重新认证或二次确认，且不要使用 GET 执行状态变更。']
  },
  {
    ids: ['148453276'],
    filename: 'DVWA-CSP-Bypass.md',
    title: 'DVWA CSP Bypass：策略配置、信任边界与绕过条件',
    date: '2025-06-05 19:10:59',
    description: '通过 DVWA 授权环境分析 CSP 配置与绕过条件，说明宽泛来源、内联脚本和受信任端点如何削弱策略，并总结安全配置方法。',
    category: 'Web安全教学',
    tags: ['DVWA', 'CSP', 'XSS', 'Web安全'],
    difficulty: '中级',
    objectives: ['读懂常见 CSP 指令及其信任边界', '理解允许列表为何可能被受信任端点反向利用', '设计基于 nonce 或 hash 的更严格脚本策略'],
    defense: ['优先使用 nonce 或 hash，减少 unsafe-inline 和宽泛域名允许列表。', '检查允许来源中的 JSONP、开放重定向和用户可控内容端点。', '先以 Report-Only 观察违规报告，再逐步收紧正式策略。']
  },
  {
    ids: ['147981770'],
    filename: 'SQLi-Labs文件导出注入.md',
    title: 'SQLi-Labs 文件导出注入：权限条件与防御',
    date: '2025-05-15 20:54:42',
    description: '在 SQLi-Labs 授权环境中分析文件导出型 SQL 注入，重点说明数据库文件权限、secure_file_priv、目标路径和 Web 执行条件。',
    category: 'SQL注入专题',
    tags: ['SQLi-Labs', 'SQL注入', '文件写入', 'MySQL'],
    difficulty: '中级',
    objectives: ['理解数据库文件导出能力与 SQL 注入的组合风险', '识别 FILE 权限和 secure_file_priv 等必要条件', '区分“能够注入”“能够写文件”和“能够执行代码”'],
    defense: ['业务数据库账户不授予 FILE 等非必要高权限。', '启用并限制 secure_file_priv，数据库进程与 Web 目录采用最小文件权限。', '使用参数化查询，同时监控包含 outfile、dumpfile 等关键行为的异常语句。']
  },
  {
    ids: ['148122009', '148122969', '148123432'],
    sectionTitles: ['User-Agent 注入', 'Referer 注入', 'Cookie 注入'],
    filename: 'SQL注入中的请求头与Cookie输入面.md',
    title: 'SQL 注入中的请求头与 Cookie 输入面',
    date: '2025-05-21 20:37:46',
    description: '合并三篇 SQLi-Labs 实验，比较 User-Agent、Referer 与 Cookie 进入数据库查询时的注入风险，强调所有外部输入均不可信。',
    category: 'SQL注入专题',
    tags: ['SQLi-Labs', 'SQL注入', 'HTTP请求头', 'Cookie'],
    difficulty: '中级',
    objectives: ['识别表单之外的请求头和 Cookie 输入面', '理解日志、审计和登录逻辑中的二次数据流', '为所有外部输入统一实施参数化查询'],
    defense: ['User-Agent、Referer、Cookie 和代理头都属于不可信输入。', '日志或审计写库同样必须使用参数化语句并限制字段长度。', '避免把 WAF 作为唯一防线，应在应用数据访问层消除字符串拼接。']
  }
];

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchWithRetry(url, options = {}, retries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < retries) await wait(attempt * 800);
    }
  }
  throw lastError;
}

function cleanText(value) {
  return value
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

function cleanImportedMarkdown(value) {
  return cleanText(value)
    .replace(/^#{1,5}\s+/gm, (heading) => `#${heading}`)
    .replace(/^#{2,6}\s*[^\n]*完结撒花[^\n]*\n?/gm, '')
    .replace(/^(#{2,6})\s+(!\[[^\]]*\]\([^)]+\))\s*(.+)$/gm, '$2\n\n$1 $3')
    .replace(/([^\n])(!\[[^\]]*\]\([^)]+\))/g, '$1\n\n$2')
    .replace(/(!\[[^\]]*\]\([^)]+\))(?=!\[)/g, '$1\n\n')
    .replace(/node\d+\.anna\.nssctf\.cn:\d+/g, 'authorized-lab.local')
    .replace(/\bDELET\b/g, 'DELETE')
    .replace(/\bOPPTIONS\b/g, 'OPTIONS')
    .replace(/爆数据库名/g, '获取数据库名')
    .replace(/爆库名/g, '获取数据库名')
    .replace(/爆表名/g, '获取表名')
    .replace(/爆列名/g, '获取列名')
    .replace(/爆数据/g, '获取数据')
    .replace(/判断流程和前一关一样\[sqli-labs[^\]]*\]\([^)]+\)/g, '判断流程与前一节相同，可参见本文“User-Agent 注入”部分。')
    .replace(/^-\s{2,}/gm, '- ')
    .replace(/^(#{2,6})\s+(\d+)\.([^\s])/gm, '$1 $2. $3')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

function extensionFor(url, contentType) {
  const pathname = new URL(url).pathname;
  const extension = path.extname(pathname).toLowerCase();
  if (/^\.(png|jpe?g|gif|webp|svg)$/.test(extension)) return extension === '.jpeg' ? '.jpg' : extension;
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('gif')) return '.gif';
  if (contentType.includes('svg')) return '.svg';
  return '.jpg';
}

async function localizeImages(article, articleId) {
  const directory = path.join(imagesRoot, articleId);
  fs.mkdirSync(directory, { recursive: true });
  let index = 0;

  for (const image of article.querySelectorAll('img')) {
    const source = image.getAttribute('data-src') || image.getAttribute('data-original') || image.getAttribute('src');
    if (!source || !/^https?:\/\//i.test(source)) continue;

    index += 1;
    try {
      const response = await fetchWithRetry(source, { headers: { ...browserHeaders, referer: `https://blog.csdn.net/${author}/` } });
      const buffer = Buffer.from(await response.arrayBuffer());
      const extension = extensionFor(source, response.headers.get('content-type') || '');
      const filename = `${String(index).padStart(2, '0')}${extension}`;
      fs.writeFileSync(path.join(directory, filename), buffer);
      image.setAttribute('src', `/images/csdn/${articleId}/${filename}`);
      image.removeAttribute('data-src');
      image.removeAttribute('data-original');
      if (!image.getAttribute('alt')) image.setAttribute('alt', `实验截图 ${index}`);
    } catch (error) {
      console.warn(`Image skipped for ${articleId}: ${source} (${error.message})`);
    }
  }
}

function createTurndown() {
  const service = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*'
  });
  service.use(gfm);
  service.addRule('cleanPre', {
    filter: 'pre',
    replacement(content, node) {
      const codeElement = node.querySelector('code');
      const className = codeElement?.className || '';
      const language = className.match(/language-([\w+-]+)/)?.[1] || '';
      const code = (codeElement || node).textContent.replace(/^\n+|\n+$/g, '');
      return `\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
    }
  });
  return service;
}

async function extractArticle(articleId) {
  const url = `https://blog.csdn.net/${author}/article/details/${articleId}`;
  const response = await fetchWithRetry(url, { headers: { ...browserHeaders, referer: `https://blog.csdn.net/${author}?type=blog` } });
  const html = await response.text();
  const dom = new JSDOM(html);
  const article = dom.window.document.querySelector('#content_views');
  if (!article) throw new Error(`Article body not found: ${articleId}`);

  article.querySelectorAll('script, style, noscript, .hljs-button, .copy-code-btn, svg').forEach((element) => element.remove());
  article.querySelectorAll('[style]').forEach((element) => element.removeAttribute('style'));
  await localizeImages(article, articleId);

  const markdown = createTurndown().turndown(article.innerHTML);
  return { url, markdown: cleanImportedMarkdown(markdown) };
}

function list(values) {
  return values.map((value) => `  - ${value}`).join('\n');
}

function buildPost(selection, extracted) {
  const sources = extracted.map((article) => article.url);
  const sections = extracted.map((article, index) => {
    if (selection.sectionTitles) {
      return `## ${selection.sectionTitles[index]}\n\n${article.markdown}`;
    }
    return article.markdown;
  }).join('\n\n');

  return `---
title: ${JSON.stringify(selection.title)}
description: ${selection.description}
excerpt: ${selection.description}
author: Lee
disableNunjucks: true
date: ${selection.date}
updated: 2026-09-04 00:00:00
categories:
  - ${selection.category}
tags:
${list(selection.tags)}
article_status: 待复验
difficulty: ${selection.difficulty}
original_sources:
${list(sources)}
---

> **文章状态：待复验**  
> 本文由 Lee 的 CSDN 原创学习记录迁移并重新整理。以下操作仅限自建环境、CTF 与明确授权靶场，请勿用于未授权目标。

## 学习目标

${selection.objectives.map((item) => `- ${item}`).join('\n')}

## 实验说明

- 难度：${selection.difficulty}
- 范围：本地或公开授权靶场
- 复验状态：正文已完成格式迁移，关键结论将在后续使用固定环境重新验证

## 原始实验记录

${sections}

## 防御与复盘

${selection.defense.map((item) => `- ${item}`).join('\n')}

## 原文出处

${sources.map((url, index) => `- [CSDN 原创记录${sources.length > 1 ? ` ${index + 1}` : ''}](${url})`).join('\n')}
`;
}

async function main() {
  fs.mkdirSync(postsRoot, { recursive: true });
  fs.mkdirSync(imagesRoot, { recursive: true });

  for (const selection of selections) {
    const target = path.join(postsRoot, selection.filename);
    if (fs.existsSync(target) && !process.argv.includes('--force')) {
      console.log(`Skipped existing ${path.relative(projectRoot, target)}`);
      continue;
    }
    const extracted = [];
    for (const articleId of selection.ids) {
      console.log(`Fetching article ${articleId}...`);
      extracted.push(await extractArticle(articleId));
      await wait(350);
    }
    fs.writeFileSync(target, buildPost(selection, extracted), 'utf8');
    console.log(`Created ${path.relative(projectRoot, target)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
