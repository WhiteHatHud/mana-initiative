/* Admin dashboard JS */
(function () {
  const db = window.MANA_DB;
  const auth = db.auth;

  /* ── Auth ── */
  async function checkAuth() {
    const { data } = await auth.getSession();
    return data.session ? data.session.user : null;
  }

  async function init() {
    const user = await checkAuth();
    if (user) showShell(user.email);
    else       showLogin();
  }

  function showLogin()  { document.getElementById('admin-login-view').style.display = 'flex'; document.getElementById('admin-shell').style.display = 'none'; }
  function showShell(email) {
    document.getElementById('admin-login-view').style.display = 'none';
    document.getElementById('admin-shell').style.display = 'flex';
    document.getElementById('admin-user-email').textContent = email;
    loadAllData();
  }

  /* Login form */
  document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const email    = this.querySelector('#login-email').value;
    const password = this.querySelector('#login-password').value;
    const errEl    = document.getElementById('login-error');
    errEl.classList.remove('show');
    const btn = this.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Signing in…';
    try {
      const { data, error } = await auth.signInWithPassword({ email, password });
      if (error) throw error;
      showShell(data.user.email);
    } catch {
      errEl.classList.add('show');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sign in';
    }
  });

  document.getElementById('admin-signout').addEventListener('click', async function () {
    await auth.signOut();
    showLogin();
  });

  /* ── Tabs ── */
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.admin-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      this.setAttribute('aria-selected', 'true');
      document.getElementById(`tab-${this.dataset.tab}`).classList.add('active');
    });
  });

  /* ── Generic CRUD helpers ── */
  function makeRow(cols) { return `<tr>${cols.map(c => `<td>${c ?? ''}</td>`).join('')}</tr>`; }
  function tick(val)     { return val ? '✓' : '–'; }
  function shortDate(iso){ return iso ? new Date(iso).toLocaleDateString('en-SG', {day:'numeric',month:'short',year:'numeric'}) : ''; }
  function fillForm(form, data, fields) {
    fields.forEach(f => {
      const el = form.querySelector(`[name="${f}"]`);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = !!data[f];
      else el.value = data[f] ?? '';
    });
  }
  function readForm(form) {
    const fd = new FormData(form);
    const out = {};
    form.querySelectorAll('[name]').forEach(el => {
      if (el.type === 'checkbox') out[el.name] = el.checked;
      else out[el.name] = el.value || null;
    });
    if (out.id === '') delete out.id;
    return out;
  }
  function showMsg(okId, errId, type) {
    document.getElementById(okId).classList.remove('show');
    document.getElementById(errId).classList.remove('show');
    document.getElementById(type === 'ok' ? okId : errId).classList.add('show');
    setTimeout(() => { document.getElementById(okId).classList.remove('show'); document.getElementById(errId).classList.remove('show'); }, 3000);
  }
  function makeActionBtns(table, id, editFn, deleteFn) {
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'btn-admin-secondary';
    editBtn.style.marginRight = '6px';
    editBtn.onclick = () => editFn(id);
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.className = 'btn-admin-danger';
    delBtn.onclick = async () => {
      if (!confirm('Delete this item?')) return;
      await window.adminDelete(table, id);
      loadAllData();
    };
    const wrap = document.createElement('div');
    wrap.className = 'col-actions';
    wrap.appendChild(editBtn);
    wrap.appendChild(delBtn);
    return wrap;
  }

  /* ── SESSIONS ── */
  let sessionsData = [];
  async function loadSessions() {
    sessionsData = await window.adminGetAll('sessions');
    const tbody = document.getElementById('sessions-tbody');
    if (!sessionsData.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:2rem;">No sessions yet.</td></tr>'; return; }
    tbody.innerHTML = '';
    sessionsData.forEach(s => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${MANA.esc(s.title)}</td><td>${shortDate(s.date)}</td><td>${s.medium||''}</td><td>${tick(s.is_upcoming)}</td><td>${tick(s.is_published)}</td><td>${tick(s.is_featured)}</td>`;
      const td = document.createElement('td');
      td.appendChild(makeActionBtns('sessions', s.id, editSession, () => { window.adminDelete('sessions', s.id).then(loadAllData); }));
      tr.appendChild(td);
      tbody.appendChild(tr);
    });
    /* Populate notify select */
    const sel = document.getElementById('notify-session');
    const upcomingSessions = sessionsData.filter(s => s.is_upcoming && s.is_published);
    sel.innerHTML = '<option value="">— select a session —</option>' + upcomingSessions.map(s => `<option value="${s.id}">${MANA.esc(s.title)} (${shortDate(s.date)})</option>`).join('');
  }

  function openSessionEditor(clear = true) {
    const editor = document.getElementById('session-editor');
    editor.classList.add('active');
    editor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (clear) {
      document.getElementById('session-form').reset();
      document.getElementById('s-id').value = '';
      document.getElementById('session-editor-title').textContent = 'New session';
    }
  }
  function editSession(id) {
    const s = sessionsData.find(x => x.id === id);
    if (!s) return;
    openSessionEditor(false);
    document.getElementById('session-editor-title').textContent = 'Edit session';
    fillForm(document.getElementById('session-form'), s, ['id','title','slug','date','time','medium','location','zoom_url','recording_url','book_title','book_author','book_cover_url','description','is_published','is_upcoming','is_featured']);
  }
  document.getElementById('new-session-btn').addEventListener('click', () => openSessionEditor(true));
  document.getElementById('s-cancel').addEventListener('click', () => document.getElementById('session-editor').classList.remove('active'));
  document.getElementById('session-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const data = readForm(this);
    try {
      await window.adminUpsert('sessions', data);
      showMsg('s-save-ok', 's-save-err', 'ok');
      document.getElementById('session-editor').classList.remove('active');
      loadSessions();
    } catch { showMsg('s-save-ok', 's-save-err', 'err'); }
  });
  /* Auto-slug from title */
  document.getElementById('s-title').addEventListener('input', function () {
    const slugField = document.getElementById('s-slug');
    if (!slugField.dataset.manual) {
      slugField.value = this.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g,'');
    }
  });
  document.getElementById('s-slug').addEventListener('input', function () { this.dataset.manual = '1'; });

  /* ── BOOKS ── */
  let booksData = [];
  async function loadBooks() {
    booksData = await window.adminGetAll('books');
    const tbody = document.getElementById('books-tbody');
    if (!booksData.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:2rem;">No books yet.</td></tr>'; return; }
    tbody.innerHTML = '';
    booksData.forEach(b => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${MANA.esc(b.title)}</td><td>${MANA.esc(b.author||'')}</td><td>${b.category||''}</td><td>${b.status||''}</td><td>${tick(b.is_published)}</td>`;
      const td = document.createElement('td');
      td.appendChild(makeActionBtns('books', b.id, editBook, () => {}));
      tr.appendChild(td);
      tbody.appendChild(tr);
    });
  }
  function editBook(id) {
    const b = booksData.find(x => x.id === id);
    if (!b) return;
    document.getElementById('book-editor').classList.add('active');
    document.getElementById('book-editor-title').textContent = 'Edit book';
    fillForm(document.getElementById('book-form'), b, ['id','title','slug','author','category','status','cover_url','supplier_note','is_published']);
    document.getElementById('book-editor').scrollIntoView({ behavior:'smooth', block:'nearest' });
  }
  document.getElementById('new-book-btn').addEventListener('click', () => {
    document.getElementById('book-form').reset();
    document.getElementById('b-id').value = '';
    document.getElementById('book-editor-title').textContent = 'New book';
    document.getElementById('book-editor').classList.add('active');
    document.getElementById('book-editor').scrollIntoView({ behavior:'smooth', block:'nearest' });
  });
  document.getElementById('b-cancel').addEventListener('click', () => document.getElementById('book-editor').classList.remove('active'));
  document.getElementById('book-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const data = readForm(this);
    try {
      await window.adminUpsert('books', data);
      showMsg('b-save-ok', 'b-save-err', 'ok');
      document.getElementById('book-editor').classList.remove('active');
      loadBooks();
    } catch { showMsg('b-save-ok', 'b-save-err', 'err'); }
  });
  document.getElementById('b-title').addEventListener('input', function () {
    const slugField = document.getElementById('b-slug');
    if (!slugField.dataset.manual) slugField.value = this.value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  });
  document.getElementById('b-slug').addEventListener('input', function () { this.dataset.manual = '1'; });

  /* ── ENGAGEMENTS ── */
  let engagementsData = [];
  async function loadEngagements() {
    engagementsData = await window.adminGetAll('engagements');
    const tbody = document.getElementById('engagements-tbody');
    tbody.innerHTML = '';
    engagementsData.forEach(e => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${MANA.esc(e.title||'')}</td><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${MANA.esc(e.caption||'')}</td><td>${e.sort_order??0}</td><td>${tick(e.is_published)}</td>`;
      const td = document.createElement('td');
      td.appendChild(makeActionBtns('engagements', e.id, editEngagement, () => {}));
      tr.appendChild(td);
      tbody.appendChild(tr);
    });
    if (!engagementsData.length) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:2rem;">No engagements yet.</td></tr>';
  }
  function editEngagement(id) {
    const e = engagementsData.find(x => x.id === id);
    if (!e) return;
    fillForm(document.getElementById('engagement-form'), e, ['id','title','caption','sort_order','image_url','is_published']);
    document.getElementById('engagement-editor').classList.add('active');
    document.getElementById('engagement-editor').scrollIntoView({ behavior:'smooth', block:'nearest' });
  }
  document.getElementById('new-engagement-btn').addEventListener('click', () => {
    document.getElementById('engagement-form').reset();
    document.getElementById('e-id').value = '';
    document.getElementById('engagement-editor').classList.add('active');
    document.getElementById('engagement-editor').scrollIntoView({ behavior:'smooth', block:'nearest' });
  });
  document.getElementById('e-cancel').addEventListener('click', () => document.getElementById('engagement-editor').classList.remove('active'));
  document.getElementById('engagement-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    try { await window.adminUpsert('engagements', readForm(this)); showMsg('e-save-ok','e-save-err','ok'); document.getElementById('engagement-editor').classList.remove('active'); loadEngagements(); }
    catch { showMsg('e-save-ok','e-save-err','err'); }
  });

  /* ── FAQs ── */
  let faqsData = [];
  async function loadFAQs() {
    faqsData = await window.adminGetAll('faqs');
    const tbody = document.getElementById('faqs-tbody');
    tbody.innerHTML = '';
    faqsData.forEach(f => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td style="max-width:300px;">${MANA.esc(f.question)}</td><td>${f.sort_order??0}</td><td>${tick(f.is_published)}</td>`;
      const td = document.createElement('td');
      td.appendChild(makeActionBtns('faqs', f.id, editFAQ, () => {}));
      tr.appendChild(td);
      tbody.appendChild(tr);
    });
    if (!faqsData.length) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:2rem;">No FAQs yet.</td></tr>';
  }
  function editFAQ(id) {
    const f = faqsData.find(x => x.id === id);
    if (!f) return;
    fillForm(document.getElementById('faq-form'), f, ['id','question','answer','sort_order','is_published']);
    document.getElementById('faq-editor').classList.add('active');
    document.getElementById('faq-editor').scrollIntoView({ behavior:'smooth', block:'nearest' });
  }
  document.getElementById('new-faq-btn').addEventListener('click', () => {
    document.getElementById('faq-form').reset();
    document.getElementById('f-id').value = '';
    document.getElementById('faq-editor').classList.add('active');
    document.getElementById('faq-editor').scrollIntoView({ behavior:'smooth', block:'nearest' });
  });
  document.getElementById('f-cancel').addEventListener('click', () => document.getElementById('faq-editor').classList.remove('active'));
  document.getElementById('faq-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    try { await window.adminUpsert('faqs', readForm(this)); showMsg('f-save-ok','f-save-err','ok'); document.getElementById('faq-editor').classList.remove('active'); loadFAQs(); }
    catch { showMsg('f-save-ok','f-save-err','err'); }
  });

  /* ── REGISTRATIONS ── */
  let regsData = [];
  async function loadRegistrations() {
    regsData = await window.adminGetAll('registrations');
    const tbody = document.getElementById('registrations-tbody');
    if (!regsData.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:2rem;">No registrations yet.</td></tr>'; return; }
    const sessionMap = {};
    sessionsData.forEach(s => { sessionMap[s.id] = s.title; });
    tbody.innerHTML = regsData.map(r => `<tr>
      <td>${MANA.esc(r.name)}</td><td>${MANA.esc(r.email)}</td><td>${MANA.esc(r.ihl||'')}</td>
      <td>${r.medium_pref||''}</td><td>${MANA.esc(sessionMap[r.session_id]||r.session_id)}</td><td>${shortDate(r.created_at)}</td>
    </tr>`).join('');
  }
  document.getElementById('export-registrations').addEventListener('click', () => MANA.downloadCSV(regsData, 'registrations.csv'));

  /* ── SUBSCRIBERS ── */
  let subData = [], joinerData = [];
  async function loadSubscribers() {
    [subData, joinerData] = await Promise.all([window.adminGetAll('subscribers'), window.adminGetAll('join_interest')]);
    const st = document.getElementById('subscribers-tbody');
    st.innerHTML = subData.length
      ? subData.map(s => `<tr><td>${MANA.esc(s.email)}</td><td>${MANA.esc(s.phone||'')}</td><td>${MANA.esc(s.source||'')}</td><td>${shortDate(s.created_at)}</td></tr>`).join('')
      : '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:2rem;">No subscribers yet.</td></tr>';
    const jt = document.getElementById('joiners-tbody');
    jt.innerHTML = joinerData.length
      ? joinerData.map(j => `<tr><td>${MANA.esc(j.name)}</td><td>${MANA.esc(j.email)}</td><td>${MANA.esc(j.ihl||'')}</td><td style="max-width:200px;">${MANA.esc(j.motivation||'')}</td><td>${shortDate(j.created_at)}</td></tr>`).join('')
      : '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:2rem;">No join interest yet.</td></tr>';
  }
  document.getElementById('export-subscribers').addEventListener('click', () => MANA.downloadCSV(subData, 'subscribers.csv'));
  document.getElementById('export-joiners').addEventListener('click', () => MANA.downloadCSV(joinerData, 'join-interest.csv'));

  /* ── NOTIFY ── */
  document.getElementById('notify-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const ok  = document.getElementById('notify-ok');
    const err = document.getElementById('notify-err');
    ok.classList.remove('show'); err.classList.remove('show');
    const btn = this.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Sending…';
    const sessionId = document.getElementById('notify-session').value;
    const message   = document.getElementById('notify-message').value;
    try {
      const res = await fetch('/api/notify-subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message }),
      });
      if (!res.ok) throw new Error(await res.text());
      ok.classList.add('show');
      this.reset();
    } catch { err.classList.add('show'); }
    finally { btn.disabled = false; btn.textContent = 'Send announcement'; }
  });

  /* ── COMMITTEE ── */
  let committeeData = [];
  async function loadCommittee() {
    committeeData = await window.adminGetAll('committee_members');
    const tbody = document.getElementById('committee-tbody');
    if (!committeeData.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:2rem;">No members yet.</td></tr>'; return; }
    tbody.innerHTML = '';
    committeeData.forEach(m => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${MANA.esc(m.name)}</td><td>${MANA.esc(m.role)}</td><td>${MANA.esc(m.department||'')}</td><td>${tick(m.consent_to_publish)}</td><td>${tick(m.is_published)}</td>`;
      const td = document.createElement('td');
      td.appendChild(makeActionBtns('committee_members', m.id, editMember, () => {}));
      tr.appendChild(td);
      tbody.appendChild(tr);
    });
  }
  function editMember(id) {
    const m = committeeData.find(x => x.id === id);
    if (!m) return;
    fillForm(document.getElementById('member-form'), m, ['id','name','role','department','sort_order','photo_url','consent_to_publish','is_published']);
    document.getElementById('member-editor').classList.add('active');
    document.getElementById('member-editor').scrollIntoView({ behavior:'smooth', block:'nearest' });
  }
  document.getElementById('new-member-btn').addEventListener('click', () => {
    document.getElementById('member-form').reset();
    document.getElementById('m-id').value = '';
    document.getElementById('member-editor').classList.add('active');
    document.getElementById('member-editor').scrollIntoView({ behavior:'smooth', block:'nearest' });
  });
  document.getElementById('m-cancel').addEventListener('click', () => document.getElementById('member-editor').classList.remove('active'));
  document.getElementById('member-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    try { await window.adminUpsert('committee_members', readForm(this)); showMsg('m-save-ok','m-save-err','ok'); document.getElementById('member-editor').classList.remove('active'); loadCommittee(); }
    catch { showMsg('m-save-ok','m-save-err','err'); }
  });

  /* ── Stats ── */
  async function loadStats() {
    const counts = await Promise.allSettled([
      window.adminGetAll('sessions'),
      window.adminGetAll('books'),
      window.adminGetAll('registrations'),
      window.adminGetAll('subscribers'),
    ]);
    const vals = counts.map(r => r.status === 'fulfilled' ? r.value.length : '?');
    document.getElementById('stat-sessions').textContent       = vals[0];
    document.getElementById('stat-books').textContent          = vals[1];
    document.getElementById('stat-registrations').textContent  = vals[2];
    document.getElementById('stat-subscribers').textContent    = vals[3];
  }

  async function loadAllData() {
    await Promise.allSettled([
      loadStats(),
      loadSessions(),
      loadBooks(),
      loadEngagements(),
      loadFAQs(),
      loadRegistrations(),
      loadSubscribers(),
      loadCommittee(),
    ]);
  }

  init();
})();
