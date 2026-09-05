(() => {
  'use strict';

  const MAGIC = 'LEEKBD01';
  const decoder = new TextDecoder();
  const state = { payload: null, docsById: new Map(), attachmentsById: new Map(), failedAttempts: 0 };
  const $ = (selector) => document.querySelector(selector);
  const unlockView = $('#unlock-view');
  const appView = $('#app-view');
  const unlockForm = $('#unlock-form');
  const passwordInput = $('#password');
  const unlockButton = $('#unlock-button');
  const unlockStatus = $('#unlock-status');
  const content = $('#content');
  const categoryNav = $('#category-nav');
  const searchDialog = $('#search-dialog');
  const searchInput = $('#search-input');
  const searchResults = $('#search-results');

  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));

  const bytesToText = async (bytes) => {
    if (!('DecompressionStream' in window)) throw new Error('当前浏览器不支持本地解压，请使用最新版 Chrome、Edge 或 Firefox。');
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return decoder.decode(await new Response(stream).arrayBuffer());
  };

  const decrypt = async (password) => {
    const response = await fetch(`./knowledge.enc?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('加密知识包尚未部署，请稍后重试。');
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (decoder.decode(bytes.slice(0, 8)) !== MAGIC) throw new Error('知识包格式无效。');
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const iterations = view.getUint32(8);
    const salt = bytes.slice(12, 28);
    const iv = bytes.slice(28, 40);
    const cipherText = bytes.slice(40);
    const passwordBytes = new TextEncoder().encode(password);
    const material = await crypto.subtle.importKey('raw', passwordBytes, 'PBKDF2', false, ['deriveKey']);
    passwordBytes.fill(0);
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
      material,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherText);
    return JSON.parse(await bytesToText(new Uint8Array(plain)));
  };

  const topCategory = (doc) => doc.category === '首页' ? '首页' : doc.category.split('/')[0];
  const categoryCounts = () => {
    const counts = new Map([['全部', state.payload.documents.length]]);
    for (const doc of state.payload.documents) {
      const category = topCategory(doc);
      counts.set(category, (counts.get(category) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => a[0] === '全部' ? -1 : b[1] - a[1]);
  };

  const renderSidebar = (active = '全部') => {
    categoryNav.innerHTML = categoryCounts().map(([name, count]) => `
      <button class="category-link ${name === active ? 'active' : ''}" type="button" data-category="${escapeHtml(name)}">
        <span>${escapeHtml(name)}</span><span>${count}</span>
      </button>`).join('');
    $('#document-count').textContent = `${state.payload.documents.length} 篇`;
  };

  const card = (doc) => `
    <a class="document-card" href="#/doc/${doc.id}">
      <span class="count-badge">${escapeHtml(doc.category)}</span>
      <strong>${escapeHtml(doc.title)}</strong>
      <p>${escapeHtml(doc.description || '知识库文章')}</p>
    </a>`;

  const renderHome = (selectedCategory = '全部') => {
    renderSidebar(selectedCategory);
    const docs = selectedCategory === '全部'
      ? state.payload.documents
      : state.payload.documents.filter((doc) => topCategory(doc) === selectedCategory);
    const categories = categoryCounts().filter(([name]) => name !== '全部');
    const categorySection = selectedCategory === '全部' ? `
      <h2 class="section-title">分类浏览</h2>
      <div class="category-grid">${categories.map(([name, count]) => `
        <a class="category-card" href="#/category/${encodeURIComponent(name)}">
          <span class="count-badge">${count} 篇</span><strong>${escapeHtml(name)}</strong>
        </a>`).join('')}</div>` : '';
    content.innerHTML = `
      <section class="hero">
        <h1>${selectedCategory === '全部' ? 'Security Dictionary' : escapeHtml(selectedCategory)}</h1>
        <p>${docs.length} 篇</p>
      </section>
      ${categorySection}
      <h2 class="section-title">${selectedCategory === '全部' ? '最近更新' : '全部条目'}</h2>
      <div class="document-grid">${[...docs].sort((a, b) => b.updated.localeCompare(a.updated)).map(card).join('')}</div>`;
    content.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  };

  const renderDocument = (id, anchor = '') => {
    const doc = state.docsById.get(id);
    if (!doc) return renderNotFound();
    renderSidebar(topCategory(doc));
    content.innerHTML = `
      <article>
        <header class="doc-header">
          <nav class="breadcrumbs"><a href="#/">字典</a><span>/</span><a href="#/category/${encodeURIComponent(topCategory(doc))}">${escapeHtml(doc.category)}</a></nav>
          <h1>${escapeHtml(doc.title)}</h1>
          <div class="doc-meta"><span>更新于 ${escapeHtml(doc.updated)}</span>${doc.difficulty ? `<span class="tag">${escapeHtml(doc.difficulty)}</span>` : ''}${doc.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
        </header>
        <div class="article">${doc.html}</div>
      </article>`;
    enableCodeCopy();
    content.focus({ preventScroll: true });
    if (anchor) requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' }));
    else window.scrollTo({ top: 0 });
  };

  const renderNotFound = () => {
    renderSidebar();
    content.innerHTML = '<div class="empty"><h1>没有找到这个条目</h1><p><a href="#/">返回字典首页</a></p></div>';
  };

  const enableCodeCopy = () => {
    for (const pre of content.querySelectorAll('.article pre')) {
      const shell = document.createElement('div');
      shell.className = 'code-shell';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy-code';
      button.textContent = '复制';
      button.setAttribute('aria-label', '复制这段代码');
      pre.before(shell);
      shell.append(button, pre);
      button.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(pre.innerText);
          button.textContent = '已复制';
          setTimeout(() => { button.textContent = '复制'; }, 1600);
        } catch {
          button.textContent = '复制失败';
        }
      });
    }
  };

  const downloadAttachment = (id) => {
    const attachment = state.attachmentsById.get(id);
    if (!attachment) return renderNotFound();
    const binary = atob(attachment.data);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: attachment.mime }));
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    history.replaceState(null, '', '#/');
  };

  const route = () => {
    if (!state.payload) return;
    const routeValue = location.hash.slice(2) || '';
    if (routeValue.startsWith('doc/')) {
      const [id, query = ''] = routeValue.slice(4).split('?', 2);
      const params = new URLSearchParams(query);
      renderDocument(id, params.get('anchor') || '');
    } else if (routeValue.startsWith('category/')) {
      renderHome(decodeURIComponent(routeValue.slice('category/'.length)));
    } else if (routeValue.startsWith('attachment/')) {
      downloadAttachment(routeValue.slice('attachment/'.length));
    } else renderHome();
  };

  const runSearch = (query) => {
    const normalized = query.normalize('NFKC').trim().toLowerCase();
    if (!normalized) {
      searchResults.innerHTML = '<div class="empty">输入关键词开始搜索</div>';
      return;
    }
    const tokens = normalized.split(/\s+/).filter(Boolean);
    const matches = state.payload.documents.map((doc) => {
      const title = doc.title.toLowerCase();
      const tags = `${doc.category} ${doc.tags.join(' ')}`.toLowerCase();
      const body = doc.plainText.toLowerCase();
      const score = tokens.reduce((total, token) => total + (title.includes(token) ? 8 : 0) + (tags.includes(token) ? 4 : 0) + (body.includes(token) ? 1 : 0), 0);
      return { doc, score };
    }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 30);
    searchResults.innerHTML = matches.length ? matches.map(({ doc }) => `
      <a class="search-result" href="#/doc/${doc.id}"><strong>${escapeHtml(doc.title)}</strong><span>${escapeHtml(doc.category)} · ${escapeHtml(doc.description)}</span></a>`).join('') : '<div class="empty">没有找到匹配内容</div>';
  };

  const unlock = async (event) => {
    event.preventDefault();
    unlockButton.disabled = true;
    unlockStatus.textContent = '正在进入…';
    try {
      const payload = await decrypt(passwordInput.value);
      state.payload = payload;
      state.docsById = new Map(payload.documents.map((doc) => [doc.id, doc]));
      state.attachmentsById = new Map(payload.attachments.map((item) => [item.id, item]));
      passwordInput.value = '';
      unlockView.hidden = true;
      appView.hidden = false;
      state.failedAttempts = 0;
      route();
    } catch (error) {
      state.failedAttempts += 1;
      const wait = Math.min(state.failedAttempts * 900, 5000);
      unlockStatus.textContent = error.name === 'OperationError' ? '密码错误' : error.message;
      await new Promise((resolve) => setTimeout(resolve, wait));
      passwordInput.select();
    } finally {
      unlockButton.disabled = false;
    }
  };

  unlockForm.addEventListener('submit', unlock);
  $('#toggle-password').addEventListener('click', (event) => {
    const showing = passwordInput.type === 'text';
    passwordInput.type = showing ? 'password' : 'text';
    event.currentTarget.textContent = showing ? '显示' : '隐藏';
  });
  $('#lock-button').addEventListener('click', () => location.reload());
  $('#open-search').addEventListener('click', () => {
    searchDialog.showModal();
    searchInput.value = '';
    runSearch('');
    setTimeout(() => searchInput.focus(), 0);
  });
  searchInput.addEventListener('input', () => runSearch(searchInput.value));
  searchResults.addEventListener('click', () => searchDialog.close());
  categoryNav.addEventListener('click', (event) => {
    const button = event.target.closest('[data-category]');
    if (button) location.hash = button.dataset.category === '全部' ? '#/' : `#/category/${encodeURIComponent(button.dataset.category)}`;
  });
  window.addEventListener('hashchange', route);
})();
