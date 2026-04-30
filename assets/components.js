// ============================================
// THE QUIET REVOLUTION, Shared Components
// ============================================

const NAV_STRUCTURE = [
  {
    title: 'Shuru Karo',
    items: [
      { href: '/index.html', icon: '🏠', label: 'Home' },
      { href: '/pages/start-here.html', icon: '🎯', label: 'Start Here' },
    ]
  },
  {
    title: 'AI Tools Setup',
    items: [
      { href: '/pages/claude-setup.html', icon: '✨', label: 'Claude Setup' },
      { href: '/pages/wispr-setup.html', icon: '🎙️', label: 'Wispr Flow Setup' },
      { href: '/pages/workflow.html', icon: '⚡', label: 'Mera Workflow' },
    ]
  },
  {
    title: 'Paise Kaise Kamao',
    items: [
      { href: '/pages/business-ideas.html', icon: '💡', label: '100+ Business Ideas' },
      { href: '/pages/fiverr-guide.html', icon: '💰', label: 'Fiverr Guide' },
      { href: '/pages/upwork-guide.html', icon: '🌍', label: 'Upwork Guide' },
      { href: '/pages/content-writing.html', icon: '📝', label: 'Content Writing' },
      { href: '/pages/automation.html', icon: '🤖', label: 'Automation Services' },
      { href: '/pages/saas-guide.html', icon: '🚀', label: 'SaaS Building' },
    ]
  },
  {
    title: 'AI Se Banao',
    items: [
      { href: '/pages/build-apps.html', icon: '📱', label: 'Apps Banao' },
      { href: '/pages/deploy-guide.html', icon: '⚡', label: 'VS Code + Deploy' },
      { href: '/pages/image-generation.html', icon: '🎨', label: 'Image Generation' },
      { href: '/pages/free-hosting.html', icon: '🌐', label: 'Free Hosting' },
      { href: '/pages/prompts-library.html', icon: '📚', label: 'Prompts Library' },
    ]
  },
  {
    title: 'Help',
    items: [
      { href: '/pages/ask-talha.html', icon: '💬', label: 'Ask Talha (AI)' },
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
      <div class="brand-name">The Quiet <span class="accent">Revolution</span></div>
      <div class="brand-tag">By Talha Tariq · ThemeKnock</div>
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
      <strong>The Quiet Revolution</strong><br/>
      Pakistani students ke liye<br/>
      AI-powered earning guide<br/><br/>
      <a href="https://github.com/talhaatariq/quiet-revolution" target="_blank" style="color: var(--muted);">GitHub →</a>
    </div>
  `;

  document.getElementById('sidebar').innerHTML = html;
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

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  renderSidebar();

  // Add mobile nav button
  if (!document.querySelector('.mobile-nav-btn')) {
    const btn = document.createElement('button');
    btn.className = 'mobile-nav-btn';
    btn.innerHTML = '☰';
    btn.onclick = toggleMobileNav;
    document.body.appendChild(btn);
  }
});
