/* ── Shared utilities ── */
window.MANA = window.MANA || {};

/* Date formatting */
MANA.formatDate = function (iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Singapore' });
};

MANA.formatDateShort = function (iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Singapore' });
};

MANA.formatTime = function (timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const d = new Date();
  d.setHours(+h, +m);
  return d.toLocaleTimeString('en-SG', { hour: 'numeric', minute: '2-digit', hour12: true });
};

/* Medium badge */
MANA.mediumBadge = function (medium) {
  const map = { in_person: ['In-person', 'badge-in-person'], online: ['Online', 'badge-online'], hybrid: ['Hybrid', 'badge-hybrid'] };
  const [label, cls] = map[medium] || ['Unknown', ''];
  return `<span class="badge ${cls}">${label}</span>`;
};

/* Status badge */
MANA.statusBadge = function (status) {
  const map = { completed: ['Completed', 'badge-completed'], reading: ['Reading', 'badge-reading'], upcoming: ['Upcoming', 'badge-upcoming'] };
  const [label, cls] = map[status] || ['Unknown', ''];
  return `<span class="badge ${cls}">${label}</span>`;
};

/* Escape HTML */
MANA.esc = function (str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
};

/* Book cover placeholder */
MANA.bookPlaceholder = function () {
  return `<div class="book-cover-placeholder" aria-hidden="true">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1zm-1 14H7a1 1 0 0 1 0-2h13v2zm0-4H7V6h13v8z"/>
    </svg>
  </div>`;
};

/* Session card HTML */
MANA.sessionCard = function (s) {
  const date = MANA.formatDate(s.date);
  const time = s.time ? ` · ${MANA.formatTime(s.time)}` : '';
  const book = s.book_title ? `<p class="card-subtitle">Reading: <em>${MANA.esc(s.book_title)}</em>${s.book_author ? ` by ${MANA.esc(s.book_author)}` : ''}</p>` : '';
  const cta  = s.is_upcoming
    ? `<a href="/sessions/${MANA.esc(s.slug)}" class="btn btn-primary btn-sm">Register</a>`
    : (s.recording_url ? `<a href="${MANA.esc(s.recording_url)}" class="btn btn-ghost btn-sm" target="_blank" rel="noopener">Watch recording</a>` : `<span class="badge">Recording pending</span>`);
  return `
  <article class="card" role="listitem">
    <div class="card-body">
      <div class="card-meta">
        ${MANA.mediumBadge(s.medium)}
        ${s.is_featured ? '<span class="badge">Featured</span>' : ''}
      </div>
      <h3 class="card-title"><a href="/sessions/${MANA.esc(s.slug)}">${MANA.esc(s.title)}</a></h3>
      ${book}
      <p class="card-description">${MANA.esc(s.description || '')}</p>
    </div>
    <div class="card-footer">
      <span class="card-date">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        ${date}${time}
      </span>
      ${cta}
    </div>
  </article>`;
};

/* Book card HTML */
MANA.bookCard = function (b) {
  const cover = b.cover_url
    ? `<img class="book-cover" src="${MANA.esc(b.cover_url)}" alt="Cover of ${MANA.esc(b.title)}" loading="lazy">`
    : MANA.bookPlaceholder();
  return `
  <article class="card book-card" role="listitem">
    ${cover}
    <div class="card-body">
      <div class="card-meta">
        ${MANA.statusBadge(b.status)}
        ${b.category ? `<span class="badge">${MANA.esc(b.category)}</span>` : ''}
      </div>
      <h3 class="card-title">${MANA.esc(b.title)}</h3>
      ${b.author ? `<p class="card-subtitle">${MANA.esc(b.author)}</p>` : ''}
    </div>
    <div class="card-footer">
      <button class="btn btn-sm btn-primary-forest express-interest-btn" data-book-id="${MANA.esc(b.id)}" data-book-title="${MANA.esc(b.title)}">
        Express interest
      </button>
    </div>
  </article>`;
};

/* Debounce */
MANA.debounce = function (fn, ms) {
  let t;
  return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
};

/* CSV export */
MANA.downloadCSV = function (rows, filename) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const lines = [keys.join(','), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
};

/* Simple modal for "Express interest" */
MANA.showInterestModal = function (bookId, bookTitle) {
  const existing = document.getElementById('interest-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'interest-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'interest-modal-title');
  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-box">
      <button class="modal-close" aria-label="Close">&times;</button>
      <h3 id="interest-modal-title">Express interest</h3>
      <p>Leave your email and we'll let you know when <em>${MANA.esc(bookTitle)}</em> is available to order.</p>
      <form id="interest-form" class="form-stack" style="margin-top:1rem;">
        <div class="form-group">
          <label class="form-label" for="interest-email">Email <span class="required">*</span></label>
          <input class="form-input" type="email" id="interest-email" required placeholder="you@example.com">
        </div>
        <div class="form-status form-status-success" id="interest-success">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
          Interest recorded! We'll be in touch.
        </div>
        <div class="form-status form-status-error" id="interest-error">Something went wrong — please try again.</div>
        <button type="submit" class="btn btn-primary-forest">Send</button>
      </form>
    </div>`;
  modal.style.cssText = 'position:fixed;inset:0;z-index:300;display:flex;align-items:center;justify-content:center;padding:1rem;';
  document.body.appendChild(modal);
  modal.querySelector('.modal-backdrop').style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,.55);';
  modal.querySelector('.modal-box').style.cssText = 'position:relative;background:var(--cream-2);border-radius:var(--radius-card);padding:2rem;max-width:420px;width:100%;';
  modal.querySelector('.modal-close').style.cssText = 'position:absolute;top:.75rem;right:.75rem;background:none;border:none;font-size:1.5rem;cursor:pointer;color:var(--muted);';
  modal.querySelector('.modal-close').onclick = () => modal.remove();
  modal.querySelector('.modal-backdrop').onclick = () => modal.remove();
  const form = modal.querySelector('#interest-form');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const email = form.querySelector('#interest-email').value;
    try {
      await window.submitBookInterest(bookId, email);
      document.getElementById('interest-success').classList.add('show');
      form.querySelector('button[type=submit]').disabled = true;
    } catch {
      document.getElementById('interest-error').classList.add('show');
    }
  };
};
