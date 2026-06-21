document.addEventListener('DOMContentLoaded', async function () {
  /* Get slug from URL path: /sessions/my-session-slug */
  const slug = window.location.pathname.replace(/^\/sessions\//, '').replace(/\/$/, '');
  const content = document.getElementById('session-content');

  if (!slug) {
    window.location.href = '/sessions';
    return;
  }

  let session;
  try {
    session = await window.getSessionBySlug(slug);
  } catch {
    content.innerHTML = `<div style="padding:4rem 0;text-align:center;">
      <h2 style="color:var(--forest);">Session not found</h2>
      <p style="margin:1rem 0 2rem;color:var(--muted);">This session may have been removed or the link may be incorrect.</p>
      <a href="/sessions" class="btn btn-primary-forest">See all sessions</a>
    </div>`;
    return;
  }

  /* Update <title> and meta */
  document.title = `${session.title} — The Ma'na Initiative`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.content = session.description || `${session.title} — Ma'na Initiative reading session.`;

  const date   = MANA.formatDate(session.date);
  const time   = session.time ? MANA.formatTime(session.time) : null;
  const medium = MANA.mediumBadge(session.medium);

  /* Build the page */
  content.innerHTML = `
  <div class="session-detail-wrap">
    <!-- Main info -->
    <div>
      <a href="/sessions" class="back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        All sessions
      </a>
      <div style="display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1rem;">${medium}</div>
      <h1 style="font-size:var(--text-4xl);color:var(--forest);margin-bottom:1rem;">${MANA.esc(session.title)}</h1>
      ${session.book_title ? `
        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem;padding:1rem;background:var(--cream-2);border-radius:var(--radius-card);border:1px solid var(--border-light);">
          ${session.book_cover_url
            ? `<img src="${MANA.esc(session.book_cover_url)}" alt="Cover of ${MANA.esc(session.book_title)}" style="width:60px;height:80px;object-fit:cover;border-radius:4px;" loading="lazy">`
            : `<div style="width:60px;height:80px;background:var(--border-light);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;" aria-hidden="true">📖</div>`}
          <div>
            <p style="font-size:var(--text-xs);color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.25rem;">Book</p>
            <p style="font-weight:600;color:var(--forest);">${MANA.esc(session.book_title)}</p>
            ${session.book_author ? `<p style="font-size:var(--text-sm);color:var(--muted);">${MANA.esc(session.book_author)}</p>` : ''}
          </div>
        </div>` : ''}
      <ul class="session-meta-list" aria-label="Session details">
        <li class="session-meta-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>${date}${time ? ` · ${time}` : ''}</span>
        </li>
        ${session.location ? `
        <li class="session-meta-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>${MANA.esc(session.location)}</span>
        </li>` : ''}
        ${session.zoom_url ? `
        <li class="session-meta-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
          <a href="${MANA.esc(session.zoom_url)}" target="_blank" rel="noopener" style="color:var(--forest);text-decoration:underline;">Join via Zoom</a>
        </li>` : ''}
      </ul>
      ${session.description ? `
        <div style="color:var(--ink);line-height:var(--leading-body);max-width:70ch;">
          <p>${MANA.esc(session.description)}</p>
        </div>` : ''}
    </div>

    <!-- Sidebar: register or recording -->
    <aside aria-label="${session.is_upcoming ? 'Register' : 'Watch recording'}">
      ${session.is_upcoming ? buildRegisterCard(session) : buildRecordingCard(session)}
    </aside>
  </div>`;

  /* Attach registration form handler */
  const regForm = document.getElementById('reg-form');
  if (regForm) {
    regForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const ok  = document.getElementById('reg-success');
      const err = document.getElementById('reg-error');
      const btn = regForm.querySelector('button[type=submit]');
      ok.classList.remove('show');
      err.classList.remove('show');
      btn.disabled = true;
      btn.textContent = 'Submitting…';
      const data = new FormData(regForm);
      try {
        await window.submitRegistration({
          session_id:   session.id,
          name:         data.get('name'),
          email:        data.get('email'),
          ihl:          data.get('ihl') || null,
          medium_pref:  data.get('medium_pref') || null,
          note:         data.get('note') || null,
        });
        ok.classList.add('show');
        regForm.reset();
      } catch (ex) {
        console.error(ex);
        err.classList.add('show');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Register';
      }
    });
  }
});

function buildRegisterCard(session) {
  return `
  <div class="register-card">
    <h3>Register for this session</h3>
    <form id="reg-form" class="form-stack" novalidate>
      <div class="form-group">
        <label class="form-label" for="reg-name">Full name <span class="required">*</span></label>
        <input class="form-input" type="text" id="reg-name" name="name" required autocomplete="name" placeholder="Your name">
      </div>
      <div class="form-group">
        <label class="form-label" for="reg-email">Email <span class="required">*</span></label>
        <input class="form-input" type="email" id="reg-email" name="email" required autocomplete="email" placeholder="you@example.com">
      </div>
      <div class="form-group">
        <label class="form-label" for="reg-ihl">IHL / School</label>
        <input class="form-input" type="text" id="reg-ihl" name="ihl" placeholder="e.g. NUS, NTU, SMU…" autocomplete="organization">
      </div>
      <div class="form-group">
        <label class="form-label" for="reg-medium">Preferred medium</label>
        <select class="form-select" id="reg-medium" name="medium_pref">
          <option value="">— select —</option>
          <option value="in_person">In-person</option>
          <option value="online">Online</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="reg-note">Any notes or questions? (optional)</label>
        <textarea class="form-textarea" id="reg-note" name="note" rows="3" placeholder="Anything you'd like us to know…"></textarea>
      </div>
      <div class="form-status form-status-success" id="reg-success">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
        You're registered! We'll send a confirmation to your email.
      </div>
      <div class="form-status form-status-error" id="reg-error">
        Something went wrong — please try again.
      </div>
      <button type="submit" class="btn btn-primary-forest" style="width:100%;">Register</button>
    </form>
    <p style="margin-top:.75rem;font-size:var(--text-xs);color:var(--muted);">No account needed. Registration is free.</p>
  </div>`;
}

function buildRecordingCard(session) {
  return session.recording_url ? `
  <div class="recording-card">
    <h3>Watch the recording</h3>
    <p>This session has been recorded. Click below to watch at your own pace.</p>
    <a href="${MANA.esc(session.recording_url)}" target="_blank" rel="noopener" class="btn btn-primary" style="width:100%;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      Watch recording
    </a>
    <div style="margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid var(--border-dark);">
      <p style="font-size:var(--text-sm);color:rgba(246,232,210,.65);margin-bottom:.75rem;">Missed this one? Join us next time.</p>
      <a href="/sessions" class="btn btn-ghost btn-sm" style="width:100%;">See upcoming sessions</a>
    </div>
  </div>` : `
  <div class="recording-card">
    <h3>Recording pending</h3>
    <p>The recording for this session will be available soon. Subscribe to be notified.</p>
    <a href="/#subscribe" class="btn btn-primary" style="width:100%;">Subscribe for updates</a>
  </div>`;
}
