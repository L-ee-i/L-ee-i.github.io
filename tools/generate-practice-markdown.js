'use strict';

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_SOURCE = 'C:\\Users\\pc\\Desktop\\Helpme!';
const SCRIPT_FOLDER = path.join('crypto', '练习脚本');
const OUTPUT_NAME = 'index.md';

const titleFor = (filename) => path.basename(filename, path.extname(filename))
  .replaceAll('-', ' ')
  .replace(/\s+/g, ' ')
  .trim();

const describeCompanion = (filename) => {
  if (filename.endsWith('.pem')) return filename.includes('private') ? '练习用私钥，仅保留本地' : '练习用公钥，仅保留本地';
  if (filename.endsWith('.encrypted')) return '加密结果样本，仅保留本地';
  if (filename.endsWith('.sig')) return '二进制签名样本，仅保留本地';
  if (filename.endsWith('.log')) return '运行日志，仅保留本地';
  if (filename === 'base.txt') return '大型题目数据，仅保留本地';
  if (filename.endsWith('.txt')) return '练习输入数据，仅保留本地';
  return '配套文件，仅保留本地';
};

const generatePracticeMarkdown = (sourceRoot = process.env.KNOWLEDGE_SOURCE || DEFAULT_SOURCE) => {
  const folder = path.join(sourceRoot, SCRIPT_FOLDER);
  if (!fs.existsSync(folder)) throw new Error(`练习脚本目录不存在：${folder}`);

  const files = fs.readdirSync(folder, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name !== OUTPUT_NAME)
    .map((entry) => {
      const fullPath = path.join(folder, entry.name);
      return { name: entry.name, fullPath, stat: fs.statSync(fullPath) };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  const scripts = files.filter((file) => path.extname(file.name).toLowerCase() === '.py');
  const companions = files.filter((file) => path.extname(file.name).toLowerCase() !== '.py');
  const latest = files.reduce((date, file) => file.stat.mtime > date ? file.stat.mtime : date, new Date(0));

  const sections = scripts.map((file) => {
    const code = fs.readFileSync(file.fullPath, 'utf8').replaceAll('\r\n', '\n').trimEnd();
    return `## ${titleFor(file.name)}\n\n` +
      `源文件：\`${file.name}\`\n\n` +
      (code ? `\`\`\`python\n${code}\n\`\`\`` : '> 当前源文件为空，等待补充代码。');
  }).join('\n\n');

  const companionRows = companions.map((file) =>
    `| \`${file.name}\` | ${(file.stat.size / 1024).toFixed(file.stat.size >= 1024 ? 1 : 2)} KB | ${describeCompanion(file.name)} |`).join('\n');
  const markdown = `---
title: Crypto 练习脚本合集
category: Crypto/练习脚本
tags:
  - Crypto
  - Python
  - 实验代码
difficulty: 入门到进阶
updated: ${latest.toISOString().slice(0, 10)}
description: AES、DES、RSA、数字签名与凯撒密码练习脚本，可在加密字典中一键复制。
---

# Crypto 练习脚本合集

> 本页由原始 Python 文件自动生成。代码仅用于个人学习、CTF 和明确授权的实验环境。修改源脚本后，重新同步字典即可更新本页。

${sections}

## 配套文件

以下文件仍保存在本地练习目录中。它们属于密钥、密文、签名、日志或大型输入数据，不作为可复制代码嵌入字典。

| 文件 | 大小 | 处理方式 |
| --- | ---: | --- |
${companionRows}
`;

  const outputPath = path.join(folder, OUTPUT_NAME);
  const previous = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8').replaceAll('\r\n', '\n') : '';
  if (previous !== markdown) fs.writeFileSync(outputPath, markdown, 'utf8');
  return { outputPath, scripts: scripts.length, companions: companions.length, changed: previous !== markdown };
};

if (require.main === module) {
  try {
    const result = generatePracticeMarkdown();
    console.log(`练习脚本 Markdown：${result.outputPath}`);
    console.log(`Python 脚本：${result.scripts} 个；本地配套文件：${result.companions} 个；${result.changed ? '已更新' : '无需更新'}`);
  } catch (error) {
    console.error(`生成失败：${error.message}`);
    process.exit(1);
  }
}

module.exports = { generatePracticeMarkdown };
