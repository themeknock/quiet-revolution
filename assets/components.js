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
        <button onclick="setLang('roman')" id="lang-roman" class="lang-btn active">Roman Urdu</button>
        <button onclick="setLang('en')" id="lang-en" class="lang-btn">English</button>
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

// Language toggle - uses Google Translate API
function setLang(lang) {
  const btnRoman = document.getElementById('lang-roman');
  const btnEn = document.getElementById('lang-en');

  if (btnRoman) btnRoman.classList.toggle('active', lang === 'roman');
  if (btnEn) btnEn.classList.toggle('active', lang === 'en');

  if (lang === 'en') {
    // Use Google Translate
    if (!window.googleTranslateLoaded) {
      window.googleTranslateLoaded = true;
      const script = document.createElement('script');
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.body.appendChild(script);

      window.googleTranslateElementInit = function() {
        new google.translate.TranslateElement({
          pageLanguage: 'ur',
          includedLanguages: 'en,ur,hi',
          autoDisplay: false,
          layout: google.translate.TranslateElement.InlineLayout.SIMPLE
        }, 'google_translate_element');

        // Programmatically trigger English translation
        setTimeout(() => {
          const select = document.querySelector('.goog-te-combo');
          if (select) {
            select.value = 'en';
            select.dispatchEvent(new Event('change'));
          }
        }, 1500);
      };
    } else {
      // Already loaded, just trigger
      const select = document.querySelector('.goog-te-combo');
      if (select) {
        select.value = 'en';
        select.dispatchEvent(new Event('change'));
      }
    }
    localStorage.setItem('preferred_lang', 'en');
  } else {
    // Reset to Roman Urdu (original)
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = '';
      select.dispatchEvent(new Event('change'));
    }
    // Force reload to clear translation
    if (localStorage.getItem('preferred_lang') === 'en') {
      localStorage.setItem('preferred_lang', 'roman');
      // Clear Google Translate cookie
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.' + window.location.hostname;
      window.location.reload();
    }
    localStorage.setItem('preferred_lang', 'roman');
  }
}

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  renderSidebar();

  // Hidden translate element
  if (!document.getElementById('google_translate_element')) {
    const el = document.createElement('div');
    el.id = 'google_translate_element';
    el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;visibility:hidden;';
    document.body.appendChild(el);
  }

  // Restore language preference
  const savedLang = localStorage.getItem('preferred_lang');
  if (savedLang === 'en') {
    setTimeout(() => setLang('en'), 200);
  }

  // Add mobile nav button
  if (!document.querySelector('.mobile-nav-btn')) {
    const btn = document.createElement('button');
    btn.className = 'mobile-nav-btn';
    btn.innerHTML = '☰';
    btn.onclick = toggleMobileNav;
    document.body.appendChild(btn);
  }
});
