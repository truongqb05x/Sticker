/**
 * ========================================================
 * TOP TẢI NHIỀU JAVASCRIPT LOGIC
 * ========================================================
 * Xử lý lọc danh mục, sắp xếp, tải về và thông báo toast.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Lọc theo danh mục
  const filterBtns = document.querySelectorAll('.filter-cat-btn');
  const cards = document.querySelectorAll('.top-sticker-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      cards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filterValue === 'all' || category === filterValue || (filterValue === 'other' && (category === 'others' || category === 'love' || category === 'animation' || category === 'expressions'))) {
          card.style.display = 'flex';
          card.style.animation = 'fadeIn 0.25s ease';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 2. Sắp xếp dropdown
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      const sortValue = sortSelect.value;
      const grid = document.getElementById('topStickersGrid');
      const cardsArr = Array.from(cards);

      if (sortValue === 'downloads') {
        cardsArr.sort((a, b) => {
          return parseFloat(b.dataset.downloads || 0) - parseFloat(a.dataset.downloads || 0);
        });
      } else if (sortValue === 'favorites') {
        cardsArr.sort((a, b) => {
          return parseFloat(b.dataset.favorites || 0) - parseFloat(a.dataset.favorites || 0);
        });
      } else if (sortValue === 'name') {
        cardsArr.sort((a, b) => {
          return a.dataset.name.localeCompare(b.dataset.name);
        });
      }

      cardsArr.forEach(c => grid.appendChild(c));
      showToast(`Đã sắp xếp theo: ${sortSelect.options[sortSelect.selectedIndex].text}`);
    });
  }

  // 3. Nút tải về trên từng thẻ
  const downloadBtns = document.querySelectorAll('.btn-card-download');
  downloadBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.top-sticker-card');
      const title = card ? card.querySelector('.card-pack-title').textContent : 'sticker';
      showToast(`Đang tải bộ sticker: ${title}...`);
    });
  });
});

// Toast notification function
function showToast(message) {
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 2500);
}
