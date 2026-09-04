'use strict';

// Redefine 2.9 lowercases canonical URLs even though GitHub Pages paths are
// case-sensitive. Preserve the generated route's exact casing instead.
hexo.extend.filter.register('after_render:html', (html, data) => {
  if (!data.path || !/<link rel="canonical"/i.test(html)) return html;

  const baseUrl = hexo.config.url.replace(/\/$/, '');
  const route = data.path.replace(/index\.html$/, '');
  const canonicalUrl = `${baseUrl}/${route}`;

  return html.replace(
    /<link rel="canonical" href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${canonicalUrl}"/>`
  );
});
