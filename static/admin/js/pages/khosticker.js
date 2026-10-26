/**
 * ========================================================
 * ADMIN KHO STICKER (STICKER REPOSITORY) - JAVASCRIPT
 * ========================================================
 */

document.addEventListener("DOMContentLoaded", function () {
  // 1. Khởi tạo Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 2. Elements Tìm Kiếm & Lọc
  const searchInput = document.getElementById("stickerSearchInput");
  const packSelect = document.getElementById("stickerPackFilter");
  const catTabs = document.querySelectorAll(".cat-tab-btn");
  const stickerItems = document.querySelectorAll(".sticker-grid-item");
  const countIndicator = document.getElementById("stickerVisibleCount");

  let currentCategory = "all";

  function applyStickerFilters() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const selectedPack = packSelect ? packSelect.value.toLowerCase() : "all";

    let visibleCount = 0;

    stickerItems.forEach(item => {
      const text = item.textContent.toLowerCase();
      const itemCategory = (item.getAttribute("data-category") || "").toLowerCase();
      const itemPack = (item.getAttribute("data-pack") || "").toLowerCase();

      const matchSearch = (!query || text.includes(query));
      const matchCategory = (currentCategory === "all" || itemCategory === currentCategory);
      const matchPack = (selectedPack === "all" || itemPack === selectedPack);

      if (matchSearch && matchCategory && matchPack) {
        item.style.display = "";
        visibleCount++;
      } else {
        item.style.display = "none";
      }
    });

    if (countIndicator) {
      countIndicator.textContent = visibleCount;
    }
  }

  searchInput?.addEventListener("input", applyStickerFilters);
  packSelect?.addEventListener("change", applyStickerFilters);

  catTabs.forEach(tab => {
    tab.addEventListener("click", function () {
      catTabs.forEach(t => t.classList.remove("active"));
      this.classList.add("active");
      currentCategory = this.getAttribute("data-category") || "all";
      applyStickerFilters();
    });
  });

  // 3. Xử lý Modal Tải Lên Sticker
  const uploadModal = document.getElementById("uploadStickerModal");
  const openUploadBtn = document.getElementById("openUploadModalBtn");
  const closeUploadBtn = document.getElementById("closeUploadModalBtn");
  const cancelUploadBtn = document.getElementById("cancelUploadModalBtn");
  const uploadForm = document.getElementById("uploadStickerForm");

  function openUpload() {
    if (uploadModal) {
      uploadModal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }

  function closeUpload() {
    if (uploadModal) {
      uploadModal.classList.remove("active");
      document.body.style.overflow = "";
      uploadForm?.reset();
    }
  }

  openUploadBtn?.addEventListener("click", openUpload);
  closeUploadBtn?.addEventListener("click", closeUpload);
  cancelUploadBtn?.addEventListener("click", closeUpload);

  uploadModal?.addEventListener("click", function (e) {
    if (e.target === uploadModal) {
      closeUpload();
    }
  });

  uploadForm?.addEventListener("submit", function (e) {
    e.preventDefault();
    const title = document.getElementById("stickerTitleInput")?.value.trim();
    const pack = document.getElementById("uploadPackSelect")?.value;

    if (!title) {
      showToast("⚠️ Vui lòng nhập tiêu đề sticker!");
      return;
    }

    closeUpload();
    showToast(`✅ Đã tải lên thành công sticker "${title}" vào bộ sưu tập!`);
  });

  // 4. Xử lý Lightbox Xem Chi Tiết Phóng To
  const lightboxModal = document.getElementById("lightboxModal");
  const closeLightboxBtn = document.getElementById("closeLightboxBtn");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxTitle = document.getElementById("lightboxTitle");
  const lightboxPack = document.getElementById("lightboxPack");
  const lightboxDim = document.getElementById("lightboxDim");
  const lightboxDownloads = document.getElementById("lightboxDownloads");

  function openLightbox(item) {
    const imgEl = item.querySelector(".sticker-img");
    const name = item.querySelector(".sticker-name-title")?.textContent.trim() || "Sticker";
    const pack = item.querySelector(".sticker-pack-label")?.textContent.trim() || "Bộ sưu tập";
    const downloads = item.querySelector(".sticker-downloads")?.textContent.trim() || "0";

    if (lightboxImg && imgEl) {
      lightboxImg.src = imgEl.src;
      lightboxImg.alt = name;
    }
    if (lightboxTitle) lightboxTitle.textContent = name;
    if (lightboxPack) lightboxPack.textContent = pack;
    if (lightboxDim) lightboxDim.textContent = "512 x 512 px (SVG Vector)";
    if (lightboxDownloads) lightboxDownloads.textContent = downloads;

    if (lightboxModal) {
      lightboxModal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }

  function closeLightbox() {
    if (lightboxModal) {
      lightboxModal.classList.remove("active");
      document.body.style.overflow = "";
    }
  }

  closeLightboxBtn?.addEventListener("click", closeLightbox);
  lightboxModal?.addEventListener("click", function (e) {
    if (e.target === lightboxModal) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (uploadModal?.classList.contains("active")) closeUpload();
      if (lightboxModal?.classList.contains("active")) closeLightbox();
    }
  });

  // Click vào ảnh trên thẻ để mở Lightbox
  stickerItems.forEach(item => {
    const stage = item.querySelector(".sticker-thumb-stage");
    const zoomBtn = item.querySelector(".btn-zoom-sticker");

    stage?.addEventListener("click", function () {
      openLightbox(item);
    });

    zoomBtn?.addEventListener("click", function (e) {
      e.stopPropagation();
      openLightbox(item);
    });
  });

  // 5. Thao tác trên từng sticker (Download / Xóa)
  const downloadBtns = document.querySelectorAll(".btn-download-sticker");
  downloadBtns.forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      const item = this.closest(".sticker-grid-item");
      const name = item?.querySelector(".sticker-name-title")?.textContent.trim() || "sticker";
      showToast(`📥 Đang tải xuống tệp: ${name}...`);
    });
  });

  const deleteBtns = document.querySelectorAll(".btn-delete-sticker");
  deleteBtns.forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      const item = this.closest(".sticker-grid-item");
      const name = item?.querySelector(".sticker-name-title")?.textContent.trim() || "Sticker";

      if (confirm(`Bạn có chắc muốn xóa vĩnh viễn sticker "${name}" khỏi kho lưu trữ?`)) {
        item?.remove();
        applyStickerFilters();
        showToast(`🗑️ Đã xóa sticker "${name}".`);
      }
    });
  });

  // 6. Phân trang
  const pageNavButtons = document.querySelectorAll(".btn-page-nav:not(:disabled)");
  pageNavButtons.forEach(btn => {
    btn.addEventListener("click", function () {
      if (this.textContent.trim()) {
        pageNavButtons.forEach(b => b.classList.remove("active"));
        this.classList.add("active");
        showToast(`Đang chuyển đến trang ${this.textContent.trim()}...`);
      }
    });
  });
});

// Toast Helper
function showToast(message) {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(function () {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.25s ease";
    setTimeout(() => toast.remove(), 250);
  }, 2800);
}
