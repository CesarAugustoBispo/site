/* ── Theme toggle ─────────────────────────────────────────── */
(function() {
  const html = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  const icon = document.getElementById('theme-icon');

  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial = saved || (prefersDark ? 'dark' : 'light');
  html.setAttribute('data-theme', initial);
  if (icon) icon.textContent = initial === 'dark' ? '☀️' : '🌙';

  if (btn) {
    btn.addEventListener('click', function() {
      var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      icon.textContent = next === 'dark' ? '☀️' : '🌙';
      localStorage.setItem('theme', next);
    });
  }

  /* ── Mobile menu ──────────────────────────────────────────── */
  var hamburger = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobile-menu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function() {
      mobileMenu.classList.toggle('open');
    });

    document.addEventListener('click', function(e) {
      if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove('open');
      }
    });

    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() { mobileMenu.classList.remove('open'); });
    });
  }
})();
