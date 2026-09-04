'use strict';

/**
 * Redefine ships developer files and duplicate uncompiled assets in its source
 * directory. They are useful to theme authors but are not referenced by this
 * site. Removing their routes keeps the Pages artifact small without patching
 * the installed theme.
 */
hexo.extend.filter.register('after_generate', () => {
  const keepFontAwesomeCss = new Set([
    'fontawesome/brands.min.css',
    'fontawesome/fontawesome.min.css',
    'fontawesome/regular.min.css',
    'fontawesome/solid.min.css'
  ]);

  const unusedPatterns = [
    /\.map$/,
    /^css\/tailwind\.source\.css$/,
    /^js\/(?:app|layouts|libs|plugins|state|tools|utils)\//,
    /^js\/(?:build|main|utils)\.js$/,
    /^js\/build\/libs\/(?:APlayer|mermaid|waline)/i,
    /^js\/build\/plugins\/(?:aplayer|hbe|mermaid)/i,
    /^(?:assets|css)\/hbe\.style\.css$/,
    /^webfonts\/fa-(?:duotone|light|sharp-solid|thin|v4compatibility)/
  ];

  let removed = 0;
  for (const route of hexo.route.list()) {
    const isUnusedFontAwesomeCss =
      route.startsWith('fontawesome/') &&
      route.endsWith('.css') &&
      !keepFontAwesomeCss.has(route);

    if (isUnusedFontAwesomeCss || unusedPatterns.some((pattern) => pattern.test(route))) {
      hexo.route.remove(route);
      removed += 1;
    }
  }

  hexo.log.info(`Removed ${removed} unused theme assets from the generated site.`);
});
