/**
 * ========================================================
 * TAIXUONG.JS - LOGIC TƯƠNG TÁC TRANG TẢI ỨNG DỤNG
 * ========================================================
 * Xử lý sự kiện tải file APK cho Android, mở trang App Store
 * cho iOS, hiển thị mã QR và thông báo tải mượt mà.
 */

document.addEventListener('DOMContentLoaded', () => {
  const btnDownloadApk = document.getElementById('btnDownloadApk');
  const btnDownloadIos = document.getElementById('btnDownloadIos');
  const modalOverlay = document.getElementById('downloadModalOverlay');
  const modalCloseBtn = document.getElementById('dlModalCloseBtn');
  const modalTitle = document.getElementById('dlModalTitle');
  const modalDesc = document.getElementById('dlModalDesc');
  const btnModalAction = document.getElementById('btnModalAction');

  /**
   * Hiển thị thông báo chức năng đang phát triển
   */
  function showDevelopmentNotice(platform) {
    const message = 'Chức năng đang phát triển, vui lòng quay lại sau nhé! 🐾';

    if (typeof window.showToast === 'function') {
      window.showToast(message);
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
      toast.innerHTML = `<span>${message}</span>`;
      container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.25s ease';
        setTimeout(() => toast.remove(), 250);
      }, 2800);
    }
  }

  /**
   * Mở modal QR Code hoặc hướng dẫn tải
   */
  window.openDownloadModal = function(platform) {
    if (!modalOverlay) return;

    if (platform === 'ios') {
      if (modalTitle) modalTitle.textContent = 'Tải StickerHub trên App Store';
      if (modalDesc) modalDesc.textContent = 'Quét mã QR bằng camera iPhone hoặc iPad của bạn để mở trực tiếp trang tải ứng dụng trên App Store.';
      if (btnModalAction) {
        btnModalAction.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 170 170" fill="currentColor">
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.64-7.73-11.83-14.07-5.46-8.24-9.75-17.65-12.87-28.24-3.12-10.59-4.68-20.73-4.68-30.42 0-14.04 3.65-25.75 10.96-35.12 7.31-9.37 16.5-14.15 27.58-14.34 4.79 0 10.15 1.25 16.08 3.75 5.93 2.5 9.87 3.79 11.82 3.87 1.52 0 5.64-1.39 12.36-4.17 6.72-2.78 12.44-3.95 17.16-3.51 12.74.88 22.84 5.76 30.3 14.64-11.09 6.73-16.54 16.09-16.34 28.09.2 9.57 3.86 17.66 11 24.28 7.14 6.62 15.54 10.42 25.21 11.41-2.45 7.42-5.77 15.03-9.97 22.84zM119.22 31.84c0-7.39 2.65-14.32 7.96-20.78 5.3-6.47 11.83-10.57 19.59-12.31.2 1.4.3 2.61.3 3.64 0 7.3-2.73 14.34-8.19 21.12-5.46 6.77-12.08 10.74-19.86 11.89.1-1.19.2-2.38.2-3.56z"/>
          </svg>
          <span>Mở App Store</span>
        `;
        btnModalAction.onclick = () => {
          showDevelopmentNotice('iOS');
          window.closeDownloadModal();
        };
      }
    } else {
      if (modalTitle) modalTitle.textContent = 'Tải StickerHub APK cho Android';
      if (modalDesc) modalDesc.textContent = 'Quét mã QR bằng điện thoại Android để tải nhanh file cài đặt APK phiên bản mới nhất (v2.4.0).';
      if (btnModalAction) {
        btnModalAction.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>Tải file APK trực tiếp</span>
        `;
        btnModalAction.onclick = () => {
          showDevelopmentNotice('Android');
          window.closeDownloadModal();
        };
      }
    }

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  /**
   * Đóng modal
   */
  window.closeDownloadModal = function() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  // Sự kiện nút Android APK: hiển thị thông báo chức năng đang phát triển thay vì giả lập
  if (btnDownloadApk) {
    btnDownloadApk.addEventListener('click', (e) => {
      e.preventDefault();
      showDevelopmentNotice('Android');
    });
  }

  // Sự kiện nút iOS: hiển thị thông báo chức năng đang phát triển
  if (btnDownloadIos) {
    btnDownloadIos.addEventListener('click', (e) => {
      e.preventDefault();
      showDevelopmentNotice('iOS');
    });
  }

  // Đóng modal
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', window.closeDownloadModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        window.closeDownloadModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('active')) {
      window.closeDownloadModal();
    }
  });
});

