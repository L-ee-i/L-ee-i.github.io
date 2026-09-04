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
  'archives/index.html',
  'categories/index.html',
  'tags/index.html',
  'search.xml',
  'sitemap.xml',
  'atom.xml'
];

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

  const relativePath = decodedPath.replace(/^\/+/, '');
  const directPath = path.join(publicRoot, relativePath);
  const candidates = [directPath];

  if (pathname.endsWith('/') || fs.existsSync(directPath) && fs.statSync(directPath).isDirectory()) {
    candidates.push(path.join(directPath, 'index.html'));
  } else if (!path.extname(relativePath)) {
    candidates.push(path.join(directPath, 'index.html'), `${directPath}.html`);
  }

  return candidates.some((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
};

if (!fs.existsSync(publicRoot)) {
  console.error('Missing public directory. Run npm run build first.');
  process.exit(1);
}

const missingRequired = requiredOutputs.filter((relativePath) => !fs.existsSync(path.join(publicRoot, relativePath)));
const htmlFiles = walk(publicRoot).filter((filePath) => filePath.endsWith('.html'));
const missingLinks = new Map();
const placeholderReferences = [];

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
}

if (missingRequired.length || missingLinks.size || placeholderReferences.length) {
  if (missingRequired.length) console.error('Missing required outputs:', missingRequired.join(', '));
  for (const [url, sources] of missingLinks) {
    console.error(`Broken internal link ${url} referenced by ${Array.from(sources).slice(0, 5).join(', ')}`);
  }
  if (placeholderReferences.length) {
    console.error('Placeholder configuration remains in:', placeholderReferences.slice(0, 10).join(', '));
  }
  process.exit(1);
}

console.log(`Verified ${htmlFiles.length} HTML files: required outputs exist and internal links resolve.`);
