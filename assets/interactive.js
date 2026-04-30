// Interactive OS / Path selector
// Auto-detects OS, allows user to choose, shows only relevant steps.

(function() {
  function detectOS() {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('mac')) return 'mac';
    if (ua.includes('win')) return 'win';
    if (ua.includes('android')) return 'android';
    if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
    return 'mac';
  }

  function applyOS(os) {
    localStorage.setItem('preferred_os', os);

    // Update active button
    document.querySelectorAll('.os-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.os === os);
    });

    // Show/hide content blocks
    document.querySelectorAll('[data-os]').forEach(el => {
      if (el.classList.contains('os-btn')) return;
      const targets = el.dataset.os.split(',').map(s => s.trim());
      const matches = targets.includes(os) || targets.includes('all');
      el.style.display = matches ? '' : 'none';
    });
  }

  window.setOS = function(os) {
    applyOS(os);
    // Smooth scroll to next visible step
    const next = document.querySelector('.step-card[data-os]:not([style*="none"])');
    if (next) next.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('.os-selector')) return;

    const saved = localStorage.getItem('preferred_os');
    const os = saved || detectOS();
    applyOS(os);
  });
})();

// Path / experience selector (similar pattern)
(function() {
  window.setPath = function(path) {
    localStorage.setItem('preferred_path', path);
    document.querySelectorAll('.path-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.path === path);
    });
    document.querySelectorAll('[data-path]').forEach(el => {
      if (el.classList.contains('path-btn')) return;
      const targets = el.dataset.path.split(',').map(s => s.trim());
      el.style.display = targets.includes(path) || targets.includes('all') ? '' : 'none';
    });
  };
  document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('.path-selector')) return;
    const saved = localStorage.getItem('preferred_path') || 'beginner';
    setPath(saved);
  });
})();
