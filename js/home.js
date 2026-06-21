/* Home page — loads featured session + engagements teaser */
document.addEventListener('DOMContentLoaded', async function () {

  /* Featured session */
  const wrap = document.getElementById('featured-session-wrap');
  try {
    const session = await window.getFeaturedSession();
    if (session) {
      const date   = MANA.formatDate(session.date);
      const time   = session.time ? ` · ${MANA.formatTime(session.time)}` : '';
      const medium = MANA.mediumBadge(session.medium);
      const cover  = session.book_cover_url
        ? `<img class="featured-session-book" src="${MANA.esc(session.book_cover_url)}" alt="Cover of ${MANA.esc(session.book_title || '')}" loading="lazy">`
        : `<div class="featured-book-placeholder" aria-hidden="true">📖</div>`;
      wrap.innerHTML = `
        <div class="featured-session">
          ${cover}
          <div class="featured-session-info">
            <div class="featured-session-meta">
              ${medium}
              <span class="meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                ${date}${time}
              </span>
              ${session.location ? `<span class="meta-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${MANA.esc(session.location)}</span>` : ''}
            </div>
            <h3>${MANA.esc(session.title)}</h3>
            ${session.book_title ? `<p style="color:rgba(246,232,210,.7);font-size:var(--text-sm);margin-bottom:1rem;">Reading: <em>${MANA.esc(session.book_title)}</em>${session.book_author ? ` by ${MANA.esc(session.book_author)}` : ''}</p>` : ''}
            <a href="/sessions/${MANA.esc(session.slug)}" class="btn btn-primary">Register now</a>
          </div>
        </div>`;
    } else {
      wrap.innerHTML = `<p class="section-body" style="opacity:.7;text-align:center;">No upcoming sessions scheduled yet — <a href="/sessions" style="color:var(--gold);">check back soon</a>.</p>`;
    }
  } catch (err) {
    console.error('Featured session error:', err);
    wrap.innerHTML = `<p class="section-body" style="opacity:.6;text-align:center;">Could not load session — <a href="/sessions" style="color:var(--gold);">see sessions page</a>.</p>`;
  }

  /* Engagements teaser */
  const grid = document.getElementById('engagements-teaser-grid');
  if (grid) {
    try {
      const items = await window.getEngagements(4);
      if (items.length) {
        grid.innerHTML = items.map(e => `
          <div class="engagement-item">
            ${e.image_url
              ? `<img class="engagement-img" src="${MANA.esc(e.image_url)}" alt="${MANA.esc(e.title || e.caption || '')}" loading="lazy">`
              : `<div class="engagement-placeholder" aria-hidden="true"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`}
            <div class="engagement-caption">${MANA.esc(e.caption || e.title || '')}</div>
          </div>`).join('');
      } else {
        grid.innerHTML = '<p style="color:var(--muted);grid-column:1/-1;">Engagements coming soon.</p>';
      }
    } catch (err) {
      console.error('Engagements teaser error:', err);
      grid.innerHTML = '';
    }
  }

  /* Subscribe form */
  const form  = document.getElementById('subscribe-form');
  const ok    = document.getElementById('sub-success');
  const err   = document.getElementById('sub-error');
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const email = document.getElementById('sub-email').value.trim();
      ok.classList.remove('show');
      err.classList.remove('show');
      const btn = form.querySelector('button[type=submit]');
      btn.disabled = true;
      try {
        await window.submitSubscriber({ email, consent: true, source: 'home_subscribe' });
        ok.classList.add('show');
        form.reset();
      } catch {
        err.classList.add('show');
      } finally {
        btn.disabled = false;
      }
    });
  }
});
