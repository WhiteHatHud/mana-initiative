document.addEventListener('DOMContentLoaded', async function () {
  const grid      = document.getElementById('books-grid');
  const countEl   = document.getElementById('book-count');
  const statusBtns = document.querySelectorAll('[data-status]');
  const catSelect  = document.getElementById('category-filter');
  let allBooks     = [];
  let currentStatus = 'all';
  let currentCat    = '';

  function render() {
    let list = [...allBooks];
    if (currentStatus !== 'all') list = list.filter(b => b.status === currentStatus);
    if (currentCat)              list = list.filter(b => b.category === currentCat);

    if (countEl) countEl.textContent = `${list.length} book${list.length !== 1 ? 's' : ''}`;

    if (!list.length) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><p>No books match this filter.</p></div>';
      return;
    }
    grid.innerHTML = list.map(b => MANA.bookCard(b)).join('');

    /* Wire up "Express interest" buttons */
    grid.querySelectorAll('.express-interest-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        MANA.showInterestModal(this.dataset.bookId, this.dataset.bookTitle);
      });
    });
  }

  try {
    allBooks = await window.getBooks();
    render();
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<p style="color:var(--error);grid-column:1/-1;">Could not load books — please try refreshing.</p>';
  }

  statusBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      statusBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      this.classList.add('active');
      this.setAttribute('aria-pressed', 'true');
      currentStatus = this.dataset.status;
      render();
    });
  });

  catSelect.addEventListener('change', function () {
    currentCat = this.value;
    render();
  });
});
