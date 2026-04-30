// ============================================
// THE QUIET REVOLUTION, Shared Components
// ============================================

const NAV_STRUCTURE = [
  {
    title: 'Shuru Karo',
    items: [
      { href: '/index.html', icon: '🏠', label: 'Home' },
      { href: '/pages/start-here/', icon: '🎯', label: 'Start Here' },
    ]
  },
  {
    title: 'AI Tools Setup',
    items: [
      { href: '/pages/claude-setup/', icon: '✨', label: 'Claude Setup' },
      { href: '/pages/wispr-setup/', icon: '🎙️', label: 'Wispr Flow Setup' },
      { href: '/pages/workflow/', icon: '⚡', label: 'Mera Workflow' },
    ]
  },
  {
    title: 'Paise Kaise Kamao',
    items: [
      { href: '/pages/business-ideas/', icon: '💡', label: '100+ Business Ideas' },
      { href: '/pages/fiverr-guide/', icon: '💰', label: 'Fiverr Guide' },
      { href: '/pages/upwork-guide/', icon: '🌍', label: 'Upwork Guide' },
      { href: '/pages/content-writing/', icon: '📝', label: 'Content Writing' },
      { href: '/pages/automation/', icon: '🤖', label: 'Automation Services' },
      { href: '/pages/saas-guide/', icon: '🚀', label: 'SaaS Building' },
    ]
  },
  {
    title: 'AI Se Banao',
    items: [
      { href: '/pages/build-apps/', icon: '📱', label: 'Apps Banao' },
      { href: '/pages/deploy-guide/', icon: '⚡', label: 'VS Code + Deploy' },
      { href: '/pages/image-generation/', icon: '🎨', label: 'Image Generation' },
      { href: '/pages/free-hosting/', icon: '🌐', label: 'Free Hosting' },
      { href: '/pages/prompts-library/', icon: '📚', label: 'Prompts Library' },
    ]
  },
  {
    title: 'Help',
    items: [
      { href: '/pages/ask-talha/', icon: '💬', label: 'Ask Talha (AI)' },
    ]
  }
];

function renderSidebar() {
  // Determine current page path
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/index.html';
  const isHome = currentPath === '/' || currentPath.endsWith('index.html') && !currentPath.includes('/pages/');

  // Build base path - if we're in /pages/, links should be relative
  const inPages = currentPath.includes('/pages/');
  const linkPrefix = inPages ? '..' : '.';

  let html = `
    <div class="brand">
      <div class="brand-name">Talha's AI <span class="accent">Guide</span></div>
      <div class="brand-tag">Pakistan · ThemeKnock</div>
    </div>
    <div id="translator-widget" style="margin-bottom: 18px; padding: 0 12px;">
      <div style="font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted-2); margin-bottom: 6px;">Language</div>
      <div style="display: flex; gap: 6px;">
        <button onclick="setLang('roman')" id="lang-roman" class="lang-btn active">🇵🇰 Roman</button>
        <button onclick="setLang('en')" id="lang-en" class="lang-btn">🇬🇧 English</button>
      </div>
    </div>
  `;

  NAV_STRUCTURE.forEach(section => {
    html += `<div class="nav-section">`;
    html += `<div class="nav-title">${section.title}</div>`;
    html += `<ul class="nav-list">`;
    section.items.forEach(item => {
      const fullHref = linkPrefix + item.href;
      const isActive = currentPath.endsWith(item.href);
      html += `
        <li>
          <a href="${fullHref}" class="nav-link${isActive ? ' active' : ''}">
            <span class="nav-icon">${item.icon}</span>
            <span>${item.label}</span>
          </a>
        </li>
      `;
    });
    html += `</ul></div>`;
  });

  html += `
    <div class="sidebar-footer">
      <strong>Talha's AI Guide</strong><br/>
      Pakistani students ke liye<br/>
      Free practical resource<br/><br/>
      <a href="https://themeknock.net" target="_blank" style="color: var(--muted);">themeknock.net →</a>
    </div>
  `;

  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.innerHTML = html;
}

// Mobile nav toggle
function toggleMobileNav() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('mobile-open');
}

// Copy to clipboard
function copyPrompt(btn) {
  const promptBox = btn.parentElement;
  const text = promptBox.querySelector('.prompt-text').innerText;
  navigator.clipboard.writeText(text).then(() => {
    const original = btn.innerText;
    btn.innerText = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.innerText = original;
      btn.classList.remove('copied');
    }, 2000);
  });
}

// Language toggle using Google Translate cookie + reload
function setLang(lang) {
  const target = lang === 'en' ? 'en' : '';

  // Save preference
  localStorage.setItem('preferred_lang', lang);

  // Set cookie that Google Translate reads on page load
  if (target) {
    document.cookie = `googtrans=/auto/${target}; path=/`;
    document.cookie = `googtrans=/auto/${target}; path=/; domain=.${window.location.hostname}`;
  } else {
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`;
  }

  // Reload page to apply translation cleanly
  window.location.reload();
}

// Initialize Google Translate widget on page load if needed
function initGoogleTranslate() {
  if (window.__googleTranslateInit) return;
  window.__googleTranslateInit = true;

  // Hidden div for Google's widget
  if (!document.getElementById('google_translate_element')) {
    const el = document.createElement('div');
    el.id = 'google_translate_element';
    el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;visibility:hidden;width:1px;height:1px;';
    document.body.appendChild(el);
  }

  window.googleTranslateElementInit = function() {
    new google.translate.TranslateElement({
      pageLanguage: 'ur',
      includedLanguages: 'en,ur,hi,ar',
      autoDisplay: false,
      layout: google.translate.TranslateElement.InlineLayout.SIMPLE
    }, 'google_translate_element');
  };

  const script = document.createElement('script');
  script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  script.async = true;
  document.body.appendChild(script);
}

// Update active button based on current state
function syncLangButtons() {
  const cookie = document.cookie.split(';').find(c => c.trim().startsWith('googtrans='));
  const isEn = cookie && cookie.includes('/en');
  const btnRoman = document.getElementById('lang-roman');
  const btnEn = document.getElementById('lang-en');
  if (btnRoman) btnRoman.classList.toggle('active', !isEn);
  if (btnEn) btnEn.classList.toggle('active', isEn);
}

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  renderSidebar();
  initGoogleTranslate();
  syncLangButtons();

  // Add mobile nav button
  if (!document.querySelector('.mobile-nav-btn')) {
    const btn = document.createElement('button');
    btn.className = 'mobile-nav-btn';
    btn.innerHTML = '☰';
    btn.onclick = toggleMobileNav;
    document.body.appendChild(btn);
  }
});
