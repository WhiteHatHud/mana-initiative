document.addEventListener('DOMContentLoaded', async function () {
  const grid    = document.getElementById('sessions-grid');
  const filters = document.querySelectorAll('[data-filter]');
  const sorts   = document.querySelectorAll('[data-sort]');
  let allSessions = [];
  let currentFilter = 'all';
  let currentSort   = 'desc';

  function render() {
    let list = [...allSessions];
    if (currentFilter === 'upcoming') list = list.filter(s => s.is_upcoming);
    if (currentFilter === 'past')     list = list.filter(s => !s.is_upcoming);
    list.sort((a, b) => {
      const da = new Date(a.date), db = new Date(b.date);
      return currentSort === 'asc' ? da - db : db - da;
    });
    if (!list.length) {
      const labels = { all: 'No sessions yet.', upcoming: 'No upcoming sessions scheduled.', past: 'No past sessions yet.' };
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>${labels[currentFilter]}</p></div>`;
      return;
    }
    grid.innerHTML = list.map(s => MANA.sessionCard(s)).join('');
  }

  /* Load data */
  try {
    allSessions = await window.getSessions('all');
    render();
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<p style="color:var(--error);grid-column:1/-1;">Could not load sessions — please try refreshing.</p>';
  }

  /* Filter buttons */
  filters.forEach(btn => {
    btn.addEventListener('click', function () {
      filters.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      this.classList.add('active');
      this.setAttribute('aria-pressed', 'true');
      currentFilter = this.dataset.filter;
      render();
    });
  });

  /* Sort buttons */
  sorts.forEach(btn => {
    btn.addEventListener('click', function () {
      sorts.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      this.classList.add('active');
      this.setAttribute('aria-pressed', 'true');
      currentSort = this.dataset.sort;
      render();
    });
  });
});
