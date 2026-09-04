function toArray(collection) {
  if (!collection) return [];
  return typeof collection.toArray === 'function' ? collection.toArray() : Array.from(collection);
}

function names(collection) {
  return new Set(toArray(collection).map((item) => item.name).filter(Boolean));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

hexo.extend.filter.register('after_post_render', function addRelatedPosts(data) {
  if (data.layout !== 'post' || data.relatedPostsAdded) return data;

  const currentTags = names(data.tags);
  const currentCategories = names(data.categories);
  const posts = hexo.locals.get('posts').toArray();

  const ranked = posts
    .filter((post) => post.path !== data.path)
    .map((post) => {
      const postTags = names(post.tags);
      const postCategories = names(post.categories);
      let score = 0;
      postTags.forEach((name) => { if (currentTags.has(name)) score += 2; });
      postCategories.forEach((name) => { if (currentCategories.has(name)) score += 3; });
      return { post, score };
    })
    .sort((a, b) => b.score - a.score || b.post.date.valueOf() - a.post.date.valueOf())
    .slice(0, 3);

  if (!ranked.length) return data;

  const cards = ranked.map(({ post }) => {
    const description = post.description || '继续阅读这篇学习与实践记录。';
    return `<a class="related-post-card" href="${hexo.config.root}${post.path}"><strong>${escapeHtml(post.title)}</strong><span>${escapeHtml(description)}</span></a>`;
  }).join('');

  data.content += `<section class="related-posts-custom" aria-labelledby="related-posts-title"><h2 id="related-posts-title">相关文章</h2><div class="related-posts-list">${cards}</div></section>`;
  data.relatedPostsAdded = true;
  return data;
}, 20);
