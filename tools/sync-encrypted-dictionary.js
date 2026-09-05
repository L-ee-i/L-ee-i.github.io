'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { JSDOM } = require('jsdom');
const { marked } = require('marked');
const { generatePracticeMarkdown } = require('./generate-practice-markdown');

const projectRoot = path.resolve(__dirname, '..');
const sourceRoot = path.resolve(process.env.KNOWLEDGE_SOURCE || 'C:\\Users\\pc\\Desktop\\Helpme!');
const outputRoot = path.join(projectRoot, 'source', 'dictionary');
const outputFile = path.join(outputRoot, 'knowledge.enc');
const mode = process.argv.includes('--check') ? 'check' : 'sync';
const password = process.env.DICTIONARY_PASSWORD || '';

const MAGIC = Buffer.from('LEEKBD01', 'ascii');
const KDF_ITERATIONS = 600000;
const EXCLUDED_DIRECTORIES = new Set(['.claude', '.git', '__pycache__', 'node_modules']);
const EXCLUDED_EXTENSIONS = new Set(['.pem', '.encrypted', '.sig', '.log', '.key', '.p12', '.pfx']);
const ATTACHMENT_EXTENSIONS = new Set(['.doc', '.docx', '.pdf', '.ppt', '.pptx', '.xls', '.xlsx']);
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const SKIP_FILE_PATTERNS = [/\+待填\+教程\.md$/i];
const RISK_RULES = [
  ['私钥正文', /BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/],
  ['疑似云访问密钥', /AKIA[0-9A-Z]{16}/],
  ['疑似 GitHub 令牌', /gh[pousr]_[A-Za-z0-9_]{30,}/],
  ['疑似固定密码', /(?:password|passwd|pwd)\s*[:=]\s*["'][^"'\r\n]{6,}["']/i],
  ['公网 flag', /(?:flag|ctf)\{[^}\r\n]+\}/i]
];

marked.setOptions({
  gfm: true,
  breaks: false,
  headerIds: true,
  mangle: false
});

const toPosix = (value) => value.split(path.sep).join('/');
const shaId = (value) => crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
const safeDecode = (value) => {
  try { return decodeURIComponent(value); } catch { return value; }
};

const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  if (entry.isDirectory() && (EXCLUDED_DIRECTORIES.has(entry.name) || entry.name.startsWith('.'))) return [];
  const fullPath = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(fullPath) : [fullPath];
});

const splitFrontmatter = (raw) => {
  const normalized = raw.replace(/^\uFEFF/, '').replaceAll('\r\n', '\n');
  const match = normalized.match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/);
  if (!match) {
    return { meta: {}, body: normalized.replace(/^---\s*\n/, ''), malformed: normalized.startsWith('---') };
  }

  const meta = {};
  let currentList = null;
  for (const line of match[1].split('\n')) {
    const listItem = line.match(/^\s*-\s+(.+)$/);
    if (listItem && currentList) {
      meta[currentList].push(listItem[1].trim().replace(/^['"]|['"]$/g, ''));
      continue;
    }
    const pair = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!pair) continue;
    const [, key, rawValue] = pair;
    const value = rawValue.trim().replace(/^['"]|['"]$/g, '');
    if (!value) {
      meta[key] = [];
      currentList = key;
    } else {
      meta[key] = value.startsWith('[') && value.endsWith(']')
        ? value.slice(1, -1).split(',').map((item) => item.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
        : value;
      currentList = null;
    }
  }
  return { meta, body: normalized.slice(match[0].length), malformed: false };
};

const stripMarkdown = (markdown) => markdown
  .replace(/```[\s\S]*?```/g, ' ')
  .replace(/`([^`]+)`/g, '$1')
  .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/<[^>]+>/g, ' ')
  .replace(/^\s{0,3}#{1,6}\s+/gm, '')
  .replace(/[>*_~|]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const inferTags = (title, category, body) => {
  const haystack = `${title} ${category} ${body}`.toLowerCase();
  const rules = [
    ['SQL注入', ['sql注入', 'sqli', 'sqlmap']], ['XSS', ['xss', '跨站脚本']],
    ['SSTI', ['ssti', '模板注入']], ['SSRF', ['ssrf', '服务端请求伪造']],
    ['命令执行', ['rce', '命令执行', '代码执行']], ['文件上传', ['文件上传', 'upload']],
    ['内网', ['内网', '横向', '域环境']], ['密码学', ['rsa', 'aes', 'crypto', '密码学']],
    ['逆向', ['逆向', 'reverse']], ['Pwn', ['pwn', '栈溢出', 'ret2']],
    ['Linux', ['linux', 'kali']], ['SRC', ['src', '漏洞挖掘']]
  ];
  const tags = category ? [category.split('/')[0]] : [];
  for (const [tag, needles] of rules) {
    if (needles.some((needle) => haystack.includes(needle)) && !tags.includes(tag)) tags.push(tag);
  }
  return tags.slice(0, 6);
};

const sanitizeAndRewrite = (html, sourcePath, documentsByPath, attachmentsByPath) => {
  const dom = new JSDOM(`<!doctype html><body>${html}</body>`);
  const { document } = dom.window;
  document.querySelectorAll('script,style,iframe,object,embed,form,input,button,textarea,select,meta,link,base,svg,math').forEach((node) => node.remove());

  for (const element of document.querySelectorAll('*')) {
    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLowerCase();
      if (name.startsWith('on') || name === 'style' || name === 'srcdoc' || name === 'formaction') {
        element.removeAttribute(attribute.name);
      }
    }
  }

  for (const anchor of document.querySelectorAll('a[href]')) {
    const original = anchor.getAttribute('href').trim();
    if (/^(?:https?:|mailto:|tel:)/i.test(original)) {
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
      continue;
    }
    if (original.startsWith('#')) continue;
    if (/^(?:javascript|data):/i.test(original)) {
      anchor.removeAttribute('href');
      continue;
    }

    const [pathname, hash = ''] = original.split('#', 2);
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(sourcePath), safeDecode(pathname)));
    const candidates = [resolved, `${resolved}.md`, path.posix.join(resolved, 'index.md')];
    const doc = candidates.map((item) => documentsByPath.get(item.toLowerCase())).find(Boolean);
    if (doc) {
      anchor.setAttribute('href', `#/doc/${doc.id}${hash ? `?anchor=${encodeURIComponent(hash)}` : ''}`);
      continue;
    }
    const attachment = candidates.map((item) => attachmentsByPath.get(item.toLowerCase())).find(Boolean);
    if (attachment) {
      anchor.setAttribute('href', `#/attachment/${attachment.id}`);
      continue;
    }
    anchor.classList.add('unavailable-link');
    anchor.setAttribute('title', '该本地资源未包含在公开加密包中');
  }

  for (const media of document.querySelectorAll('[src]')) {
    const source = media.getAttribute('src').trim();
    if (/^javascript:/i.test(source) || /^data:(?!image\/(?:png|gif|jpe?g|webp);base64,)/i.test(source)) {
      media.removeAttribute('src');
    }
  }
  return document.body.innerHTML;
};

const collectKnowledge = () => {
  if (!fs.existsSync(sourceRoot)) throw new Error(`知识库目录不存在：${sourceRoot}`);
  const allFiles = walk(sourceRoot);
  const markdownFiles = allFiles.filter((file) => path.extname(file).toLowerCase() === '.md')
    .filter((file) => fs.statSync(file).size >= 50)
    .filter((file) => !SKIP_FILE_PATTERNS.some((pattern) => pattern.test(file)));
  const attachmentFiles = allFiles.filter((file) => ATTACHMENT_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .filter((file) => fs.statSync(file).size <= MAX_ATTACHMENT_BYTES);
  const excludedSensitiveFiles = allFiles.filter((file) => EXCLUDED_EXTENSIONS.has(path.extname(file).toLowerCase()));
  const oversizedFiles = allFiles.filter((file) => fs.statSync(file).size > MAX_ATTACHMENT_BYTES);

  const documents = markdownFiles.map((file) => {
    const relativePath = toPosix(path.relative(sourceRoot, file));
    const raw = fs.readFileSync(file, 'utf8');
    const parsed = splitFrontmatter(raw);
    const heading = parsed.body.match(/^\s*#{1,2}\s+(.+?)\s*$/m);
    const title = String(parsed.meta.title || heading?.[1] || path.basename(file, '.md')).replace(/[*_`]/g, '').trim();
    const category = String(parsed.meta.category || path.posix.dirname(relativePath)).replace(/^\.$/, '首页');
    const plainText = stripMarkdown(parsed.body);
    const description = String(parsed.meta.description || parsed.meta.summary || plainText.slice(0, 150)).trim();
    const stats = fs.statSync(file);
    const risk = RISK_RULES.filter(([, pattern]) => pattern.test(raw)).map(([label]) => label);
    return {
      id: shaId(relativePath.toLowerCase()), relativePath, title, category, description,
      tags: Array.isArray(parsed.meta.tags) ? parsed.meta.tags : inferTags(title, category, plainText.slice(0, 4000)),
      difficulty: String(parsed.meta.difficulty || ''),
      updated: String(parsed.meta.updated || stats.mtime.toISOString().slice(0, 10)),
      malformedFrontmatter: parsed.malformed,
      risk,
      markdown: parsed.body,
      plainText
    };
  });

  const attachments = attachmentFiles.map((file) => {
    const relativePath = toPosix(path.relative(sourceRoot, file));
    return {
      id: shaId(`attachment:${relativePath.toLowerCase()}`), relativePath,
      name: path.basename(file), mime: {
        '.pdf': 'application/pdf', '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.ppt': 'application/vnd.ms-powerpoint', '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      }[path.extname(file).toLowerCase()] || 'application/octet-stream',
      data: fs.readFileSync(file).toString('base64')
    };
  });

  const documentsByPath = new Map(documents.map((doc) => [doc.relativePath.toLowerCase(), doc]));
  const attachmentsByPath = new Map(attachments.map((item) => [item.relativePath.toLowerCase(), item]));
  for (const doc of documents) {
    const rendered = marked.parse(doc.markdown);
    doc.html = sanitizeAndRewrite(rendered, doc.relativePath, documentsByPath, attachmentsByPath);
    delete doc.markdown;
  }

  return { documents, attachments, excludedSensitiveFiles, oversizedFiles };
};

const encryptPayload = (payload, secret) => {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(secret, salt, KDF_ITERATIONS, 32, 'sha256');
  const compressed = zlib.gzipSync(Buffer.from(JSON.stringify(payload)), { level: 9 });
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(compressed), cipher.final()]);
  const tag = cipher.getAuthTag();
  const iterations = Buffer.allocUnsafe(4);
  iterations.writeUInt32BE(KDF_ITERATIONS);
  key.fill(0);
  return { buffer: Buffer.concat([MAGIC, iterations, salt, iv, encrypted, tag]), plainBytes: compressed.length };
};

const main = () => {
  if (mode === 'sync') {
    const generated = generatePracticeMarkdown(sourceRoot);
    console.log(`练习脚本文档：${generated.scripts} 个代码文件，${generated.changed ? '已重新生成' : '内容未变化'}`);
  }
  const result = collectKnowledge();
  const riskyDocuments = result.documents.filter((doc) => doc.risk.length);
  const malformedDocuments = result.documents.filter((doc) => doc.malformedFrontmatter);

  console.log(`知识库来源：${sourceRoot}`);
  console.log(`Markdown：${result.documents.length} 篇`);
  console.log(`加密附件：${result.attachments.length} 个`);
  console.log(`强制排除敏感文件：${result.excludedSensitiveFiles.length} 个`);
  console.log(`排除超大文件：${result.oversizedFiles.length} 个`);
  console.log(`不完整头信息：${malformedDocuments.length} 篇（同步时已兼容处理）`);
  console.log(`内容风险提示：${riskyDocuments.length} 篇（内容会进入加密包，请确认密码强度）`);
  for (const doc of riskyDocuments.slice(0, 12)) console.log(`  - ${doc.relativePath}: ${doc.risk.join('、')}`);

  if (mode === 'check') return;
  if (password.length < 16) throw new Error('DICTIONARY_PASSWORD 至少需要 16 个字符。密码不会被写入仓库。');

  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    sourceName: 'Lee Security Dictionary',
    documents: result.documents,
    attachments: result.attachments
  };
  const encrypted = encryptPayload(payload, password);
  fs.mkdirSync(outputRoot, { recursive: true });
  const temporaryFile = `${outputFile}.tmp`;
  fs.writeFileSync(temporaryFile, encrypted.buffer);
  fs.renameSync(temporaryFile, outputFile);
  console.log(`加密包：${toPosix(path.relative(projectRoot, outputFile))}`);
  console.log(`压缩后明文：${encrypted.plainBytes} bytes；加密包：${encrypted.buffer.length} bytes`);
};

try {
  main();
} catch (error) {
  console.error(`字典同步失败：${error.message}`);
  process.exit(1);
}
