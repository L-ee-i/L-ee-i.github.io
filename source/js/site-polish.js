(() => {
  const controlLabels = [
    ['.navbar-item.search.search-popup-trigger', '搜索文章'],
    ['.icon-item.search.search-popup-trigger', '搜索文章'],
    ['.icon-item.navbar-bar', '打开导航菜单'],
    ['.page-aside-toggle', '展开或收起目录'],
    ['.tool-font-adjust-plus', '增大字号'],
    ['.tool-font-adjust-minus', '减小字号'],
    ['.tool-dark-light-toggle', '切换深色模式'],
    ['.rss', '订阅 RSS'],
    ['.tool-scroll-to-bottom', '滚动到页面底部'],
    ['.toggle-tools-list', '展开或收起工具'],
    ['.tool-scroll-to-top', '返回页面顶部'],
    ['.popup-btn-close', '关闭搜索']
  ];

  const socialLabels = [
    ['github.com/L-ee-i', 'GitHub'],
    ['zhihu.com/people/yu-gan-86-73', '知乎'],
    ['xhslink.cn/o/4YwzlDNEZIG', '小红书'],
    ['blog.csdn.net/2403_88102829', 'CSDN'],
    ['mailto:1412760342@qq.com', '邮箱']
  ];

  function makeAccessible(element, label) {
    element.setAttribute('aria-label', label);
    element.setAttribute('title', label);
    element.setAttribute('data-tooltip', label);

    if (!/^(A|BUTTON|INPUT)$/.test(element.tagName)) {
      element.setAttribute('role', 'button');
      element.tabIndex = 0;
      if (!element.dataset.keyboardReady) {
        element.dataset.keyboardReady = 'true';
        element.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            element.click();
          }
        });
      }
    }
  }

  function enhanceControls() {
    controlLabels.forEach(([selector, label]) => {
      document.querySelectorAll(selector).forEach((element) => makeAccessible(element, label));
    });

    document.querySelectorAll('a.logo-image, .navbar-logo a').forEach((element) => {
      element.setAttribute('aria-label', '返回首页');
      element.setAttribute('title', '返回首页');
    });
  }

  function enhanceSocialLinks() {
    document.querySelectorAll('.social-contact-item > a').forEach((link) => {
      const href = link.getAttribute('href') || '';
      const match = socialLabels.find(([fragment]) => href.includes(fragment));
      if (!match) return;

      const label = match[1];
      link.setAttribute('aria-label', `访问${label}`);
      link.setAttribute('title', `访问${label}`);
      if (!href.startsWith('mailto:')) {
        link.setAttribute('rel', 'noopener noreferrer');
      }

      if (!link.querySelector('.social-contact-label')) {
        const text = document.createElement('span');
        text.className = 'social-contact-label';
        text.textContent = label;
        link.appendChild(text);
      }
    });
  }

  function updateRuntime() {
    const start = new Date('2025-10-27T00:00:00+08:00').getTime();
    const diff = Math.max(0, Date.now() - start);
    const units = {
      runtime_days: Math.floor(diff / 86400000),
      runtime_hours: Math.floor((diff % 86400000) / 3600000),
      runtime_minutes: Math.floor((diff % 3600000) / 60000),
      runtime_seconds: Math.floor((diff % 60000) / 1000)
    };

    Object.entries(units).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = String(value);
    });
  }

  function applyEnhancements() {
    enhanceControls();
    enhanceSocialLinks();
    updateRuntime();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyEnhancements, { once: true });
  } else {
    applyEnhancements();
  }

  document.addEventListener('pjax:complete', applyEnhancements);
  document.addEventListener('redefine:page:refresh', applyEnhancements);
  window.setInterval(updateRuntime, 1000);
})();
