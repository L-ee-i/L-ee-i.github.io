'use strict';

const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const publicRoot = path.join(projectRoot, 'public');
const requiredOutputs = [
  'index.html',
  '404.html',
  'CNAME',
  'about/index.html',
  'projects/index.html',
  'learning/index.html',
  'learning/sql-injection/index.html',
  'dictionary/index.html',
  'dictionary/dictionary.css',
  'dictionary/dictionary.js',
  'dictionary/knowledge.enc',
  'archives/index.html',
  'categories/index.html',
  'tags/index.html',
  'search.xml',
  'sitemap.xml',
  'atom.xml'
];

let publicFiles;

const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const fullPath = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(fullPath) : [fullPath];
});

const resolvePublicPath = (pathname) => {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    decodedPath = pathname;
  }

  const relativePath = decodedPath.replace(/^\/+/, '').replaceAll('\\', '/');
  const candidates = [relativePath];

  if (pathname.endsWith('/')) {
    candidates.push(`${relativePath}index.html`);
  } else if (!path.extname(relativePath)) {
    candidates.push(`${relativePath}/index.html`, `${relativePath}.html`);
  }

  // A Set comparison remains case-sensitive on Windows, matching GitHub Pages.
  return candidates.some((candidate) => publicFiles.has(candidate.replace(/^\/+/, '')));
};

if (!fs.existsSync(publicRoot)) {
  console.error('Missing public directory. Run npm run build first.');
  process.exit(1);
}

const allFiles = walk(publicRoot);
publicFiles = new Set(allFiles.map((filePath) => path.relative(publicRoot, filePath).split(path.sep).join('/')));
const missingRequired = requiredOutputs.filter((relativePath) => !publicFiles.has(relativePath));
const htmlFiles = allFiles.filter((filePath) => filePath.endsWith('.html'));
const missingLinks = new Map();
const placeholderReferences = [];
const contentRegressions = [];

for (const htmlFile of htmlFiles) {
  const html = fs.readFileSync(htmlFile, 'utf8');
  const pageRelativePath = path.relative(publicRoot, htmlFile).split(path.sep).join('/');
  const pageUrl = new URL(pageRelativePath.endsWith('index.html')
    ? `/${pageRelativePath.slice(0, -'index.html'.length)}`
    : `/${pageRelativePath}`, 'https://leei.site/');

  for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    const reference = match[1].trim();
    if (!reference || reference.startsWith('#') || /^(?:data|javascript|mailto|tel):/i.test(reference)) continue;

    let url;
    try {
      url = new URL(reference.replaceAll('\\', '/'), pageUrl);
    } catch {
      continue;
    }

    if (url.hostname !== 'leei.site') continue;
    if (!resolvePublicPath(url.pathname)) {
      const key = url.pathname;
      if (!missingLinks.has(key)) missingLinks.set(key, new Set());
      missingLinks.get(key).add(pageRelativePath);
    }
  }

  if (/example\.example\.com|\/link[123](?:\/|["'])|status\.ohevan\.com/i.test(html)) {
    placeholderReferences.push(pageRelativePath);
  }

  if (/CSDN博客|【这里放自动生成的 HTML 报告截图】|&#xFF1A;|博客等级|>Lv3</i.test(html)) {
    contentRegressions.push(pageRelativePath);
  }
}

const homeHtml = fs.readFileSync(path.join(publicRoot, 'index.html'), 'utf8');
const articleHtml = fs.readFileSync(path.join(publicRoot, '2026', '09', '04', '科来流量分析+结合MCP自动化', 'index.html'), 'utf8');
const dictionaryRoot = path.join(publicRoot, 'dictionary');
const dictionaryBundle = path.join(dictionaryRoot, 'knowledge.enc');
const dictionaryLeaks = fs.existsSync(dictionaryRoot)
  ? walk(dictionaryRoot).filter((filePath) => /(?:\.md|\.pem|\.key|\.log|\.encrypted|search_content\.js)$/i.test(filePath))
  : [];

if (!homeHtml.includes('https://xhslink.cn/o/4YwzlDNEZIG') ||
    !homeHtml.includes('https://blog.csdn.net/2403_88102829?type=blog') ||
    !homeHtml.includes('/js/site-polish.js')) {
  contentRegressions.push('index.html (missing social profile or accessibility script)');
}

if (!articleHtml.includes('related-posts-custom')) {
  contentRegressions.push('latest article (missing related posts)');
}

if (!fs.existsSync(dictionaryBundle) || fs.readFileSync(dictionaryBundle).subarray(0, 8).toString('ascii') !== 'LEEKBD01') {
  contentRegressions.push('dictionary (missing or invalid encrypted bundle)');
}

if (dictionaryLeaks.length) {
  contentRegressions.push(`dictionary (plaintext or sensitive files leaked: ${dictionaryLeaks.map((filePath) => path.basename(filePath)).join(', ')})`);
}

if (missingRequired.length || missingLinks.size || placeholderReferences.length || contentRegressions.length) {
  if (missingRequired.length) console.error('Missing required outputs:', missingRequired.join(', '));
  for (const [url, sources] of missingLinks) {
    console.error(`Broken internal link ${url} referenced by ${Array.from(sources).slice(0, 5).join(', ')}`);
  }
  if (placeholderReferences.length) {
    console.error('Placeholder configuration remains in:', placeholderReferences.slice(0, 10).join(', '));
  }
  if (contentRegressions.length) {
    console.error('Content regression found in:', contentRegressions.slice(0, 10).join(', '));
  }
  process.exit(1);
}

console.log(`Verified ${htmlFiles.length} HTML files: required outputs exist and internal links resolve.`);
