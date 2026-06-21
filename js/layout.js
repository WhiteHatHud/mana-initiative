/* ── Injects nav + footer, sets up mobile menu, cookie consent, active links ── */
(function () {
  const NAV_HTML = `
<a class="skip-link" href="#main-content">Skip to content</a>
<header class="site-header" id="site-header" role="banner">
  <div class="header-inner container">
    <nav class="nav-left" aria-label="Primary navigation">
      <a href="/about">About</a>
      <a href="/sessions">Sessions</a>
      <a href="/booklist">Booklist</a>
    </nav>
    <a href="/" class="wordmark" aria-label="The Ma'na Initiative — home">
      <img src="/assets/crest.svg" class="wordmark-crest" alt="The Ma'na Initiative crest" width="36" height="36">
      <span class="wordmark-text">The Ma'na Initiative</span>
    </a>
    <nav class="nav-right" aria-label="Secondary navigation">
      <a href="/engagements">Engagements</a>
      <a href="/join">Join</a>
      <a href="/faqs">FAQs</a>
      <a href="/contact">Contact</a>
    </nav>
    <button class="hamburger" aria-label="Open navigation menu" aria-expanded="false" aria-controls="mobile-drawer">
      <span></span><span></span><span></span>
    </button>
  </div>
  <nav class="mobile-drawer" id="mobile-drawer" aria-label="Mobile navigation" aria-hidden="true">
    <a href="/about">About</a>
    <a href="/sessions">Sessions</a>
    <a href="/booklist">Booklist</a>
    <a href="/engagements">Engagements</a>
    <a href="/join">Join</a>
    <a href="/faqs">FAQs</a>
    <a href="/contact">Contact</a>
  </nav>
</header>`;

  const FOOTER_HTML = `
<footer class="site-footer surface-forest" role="contentinfo">
  <div class="container footer-inner">
    <div class="footer-brand">
      <a href="/" class="footer-wordmark" aria-label="The Ma'na Initiative — home">
        <img src="/assets/crest.svg" alt="" width="40" height="40" aria-hidden="true">
        <span class="footer-wordmark-text">The Ma'na Initiative</span>
      </a>
      <p class="footer-tagline">Illuminating minds with authentic Islamic wisdom for a meaningful and purposeful life.</p>
      <div class="footer-contact">
        <span>Singapore</span>
        <a href="mailto:hello@mana-initiative.sg">hello@mana-initiative.sg</a>
      </div>
      <div class="footer-socials">
        <a href="https://instagram.com/manainitiative" target="_blank" rel="noopener" aria-label="Instagram">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
        </a>
      </div>
    </div>
    <div class="footer-nav">
      <h4>Explore</h4>
      <ul>
        <li><a href="/about">About</a></li>
        <li><a href="/sessions">Sessions</a></li>
        <li><a href="/booklist">Booklist</a></li>
        <li><a href="/engagements">Engagements</a></li>
      </ul>
    </div>
    <div class="footer-nav">
      <h4>Community</h4>
      <ul>
        <li><a href="/join">Join the circle</a></li>
        <li><a href="/faqs">FAQs</a></li>
        <li><a href="/contact">Contact</a></li>
        <li><a href="/committee">Committee</a></li>
      </ul>
    </div>
  </div>
  <div class="container">
    <div class="footer-bottom">
      <span>© <span id="footer-year"></span> The Ma'na Initiative · Singapore</span>
      <div class="footer-bottom-links">
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
      </div>
    </div>
  </div>
</footer>`;

  const COOKIE_HTML = `
<div class="cookie-banner" id="cookie-banner" role="region" aria-label="Cookie consent">
  <p>We use cookies to remember your preferences. See our <a href="/privacy">Privacy Policy</a>.</p>
  <div class="cookie-banner-actions">
    <button class="btn btn-sm btn-ghost" id="cookie-manage">Manage</button>
    <button class="btn btn-sm btn-primary" id="cookie-accept">Accept</button>
  </div>
</div>`;

  document.addEventListener('DOMContentLoaded', function () {
    /* Inject nav before #nav-root or at top of body */
    const navRoot = document.getElementById('nav-root');
    if (navRoot) {
      navRoot.outerHTML = NAV_HTML;
    } else {
      document.body.insertAdjacentHTML('afterbegin', NAV_HTML);
    }

    /* Inject footer */
    const footerRoot = document.getElementById('footer-root');
    if (footerRoot) {
      footerRoot.outerHTML = FOOTER_HTML;
    } else {
      document.body.insertAdjacentHTML('beforeend', FOOTER_HTML);
    }

    /* Footer year */
    const yr = document.getElementById('footer-year');
    if (yr) yr.textContent = new Date().getFullYear();

    /* Cookie banner */
    document.body.insertAdjacentHTML('beforeend', COOKIE_HTML);
    const banner = document.getElementById('cookie-banner');
    if (localStorage.getItem('mana_cookie_consent')) {
      banner.classList.add('hidden');
    }
    document.getElementById('cookie-accept').addEventListener('click', function () {
      localStorage.setItem('mana_cookie_consent', 'true');
      banner.classList.add('hidden');
    });
    document.getElementById('cookie-manage').addEventListener('click', function () {
      window.location.href = '/privacy#cookies';
    });

    /* Sticky header shadow */
    const header = document.getElementById('site-header');
    if (header) {
      window.addEventListener('scroll', function () {
        header.classList.toggle('scrolled', window.scrollY > 10);
      }, { passive: true });
    }

    /* Mobile hamburger */
    const hamburger = document.querySelector('.hamburger');
    const drawer = document.getElementById('mobile-drawer');
    if (hamburger && drawer) {
      hamburger.addEventListener('click', function () {
        const open = drawer.classList.toggle('open');
        hamburger.setAttribute('aria-expanded', String(open));
        drawer.setAttribute('aria-hidden', String(!open));
      });
      /* Close drawer on link click */
      drawer.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          drawer.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
          drawer.setAttribute('aria-hidden', 'true');
        });
      });
    }

    /* Active nav link */
    const path = window.location.pathname;
    document.querySelectorAll('.nav-left a, .nav-right a, .mobile-drawer a').forEach(a => {
      const href = a.getAttribute('href');
      if (href === '/' ? path === '/' : path.startsWith(href)) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
    });
  });
})();
