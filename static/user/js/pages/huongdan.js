/**
 * ========================================================
 * HUONGDAN.JS - LOGIC TƯƠNG TÁC TRANG HƯỚNG DẪN
 * ========================================================
 * Xử lý sự kiện nhấn nút "Xem tại đây", hiển thị thông báo Toast
 * chức năng đang được phát triển.
 */

document.addEventListener('DOMContentLoaded', () => {
  const guideBtns = document.querySelectorAll('.guide-btn-action');

  /**
   * Hiển thị thông báo chức năng đang phát triển
   */
  function showDevelopingNotice() {
    const msg = 'Chức năng đang phát triển, vui lòng quay lại sau nhé! 🐾';

    if (typeof window.showToast === 'function') {
      window.showToast(msg);
    } else {
      let container = document.getElementById('toastContainer');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = `<span>${msg}</span>`;
      container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.25s ease';
        setTimeout(() => toast.remove(), 250);
      }, 2800);
    }
  }

  // Đăng ký sự kiện click cho các nút "Xem tại đây"
  guideBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showDevelopingNotice();
    });
  });

  // Hỗ trợ hàm global trong trường hợp gọi từ nơi khác
  window.openGuideModal = function () {
    showDevelopingNotice();
  };
});
