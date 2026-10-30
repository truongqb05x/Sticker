/**
 * ========================================================
 * ADMIN CHI TIẾT BỘ SƯU TẬP (COLLECTION DETAIL) - JAVASCRIPT
 * ========================================================
 */

document.addEventListener("DOMContentLoaded", function () {
  // 1. Khởi tạo Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 2. Lọc sticker trong bộ sưu tập (Tag Filter & Search)
  const tagFilterBtns = document.querySelectorAll(".tag-filter-btn");
  const subStickerItems = document.querySelectorAll(".sticker-sub-item");
  const countBadge = document.getElementById("packVisibleCount");

  let currentTag = "all";

  function filterPackStickers() {
    let visibleCount = 0;

    subStickerItems.forEach(item => {
      const itemTags = (item.getAttribute("data-tags") || "").toLowerCase();
      const matchTag = (currentTag === "all" || itemTags.includes(currentTag));

      if (matchTag) {
        item.style.display = "";
        visibleCount++;
      } else {
        item.style.display = "none";
      }
    });

    if (countBadge) {
      countBadge.textContent = `${visibleCount} / 120 sticker`;
    }
  }

  tagFilterBtns.forEach(btn => {
    btn.addEventListener("click", function () {
      tagFilterBtns.forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      currentTag = this.getAttribute("data-tag") || "all";
      filterPackStickers();
    });
  });

  // 3. Modal Chỉnh Sửa Thông Tin Bộ Sưu Tập
  const editPackModal = document.getElementById("editPackModal");
  const openEditPackBtn = document.getElementById("openEditPackBtn");
  const closeEditPackBtn = document.getElementById("closeEditPackBtn");
  const cancelEditPackBtn = document.getElementById("cancelEditPackBtn");
  const editPackForm = document.getElementById("editPackForm");

  function openEditModal() {
    if (editPackModal) {
      editPackModal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }

  function closeEditModal() {
    if (editPackModal) {
      editPackModal.classList.remove("active");
      document.body.style.overflow = "";
    }
  }

  openEditPackBtn?.addEventListener("click", openEditModal);
  closeEditPackBtn?.addEventListener("click", closeEditModal);
  cancelEditPackBtn?.addEventListener("click", closeEditModal);

  editPackModal?.addEventListener("click", function (e) {
    if (e.target === editPackModal) closeEditModal();
  });

  editPackForm?.addEventListener("submit", function (e) {
    e.preventDefault();
    const newName = document.getElementById("editPackTitleInput")?.value.trim();
    if (newName) {
      const titleEl = document.querySelector(".pack-main-title span");
      if (titleEl) titleEl.textContent = newName;
      closeEditModal();
      showToast(`✅ Đã cập nhật thành công thông tin bộ sưu tập "${newName}"!`);
    }
  });

  // 4. Modal Thêm Sticker Mới Vào Bộ Sưu Tập
  const addStickerModal = document.getElementById("addStickerToPackModal");
  const openAddStickerBtn = document.getElementById("openAddStickerModalBtn");
  const closeAddStickerBtn = document.getElementById("closeAddStickerModalBtn");
  const cancelAddStickerBtn = document.getElementById("cancelAddStickerModalBtn");
  const addStickerForm = document.getElementById("addStickerForm");

  function openAddSticker() {
    if (addStickerModal) {
      addStickerModal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }

  function closeAddSticker() {
    if (addStickerModal) {
      addStickerModal.classList.remove("active");
      document.body.style.overflow = "";
      addStickerForm?.reset();
    }
  }

  openAddStickerBtn?.addEventListener("click", openAddSticker);
  closeAddStickerBtn?.addEventListener("click", closeAddSticker);
  cancelAddStickerBtn?.addEventListener("click", closeAddSticker);

  addStickerModal?.addEventListener("click", function (e) {
    if (e.target === addStickerModal) closeAddSticker();
  });

  addStickerForm?.addEventListener("submit", function (e) {
    e.preventDefault();
    const title = document.getElementById("newStickerTitle")?.value.trim();
    if (!title) {
      showToast("⚠️ Vui lòng nhập tiêu đề sticker!");
      return;
    }
    closeAddSticker();
    showToast(`✅ Đã thêm mới sticker "${title}" vào bộ sưu tập Cute Cats!`);
  });

  // 5. Lightbox Xem Phóng To Sticker
  const lightboxModal = document.getElementById("lightboxModal");
  const closeLightboxBtn = document.getElementById("closeLightboxBtn");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxTitle = document.getElementById("lightboxTitle");
  const lightboxDim = document.getElementById("lightboxDim");
  const lightboxDownloads = document.getElementById("lightboxDownloads");

  function openLightbox(item) {
    const imgEl = item.querySelector(".sub-sticker-img");
    const name = item.querySelector(".sub-title")?.textContent.trim() || "Sticker";
    const downloads = item.querySelector(".sub-footer-meta span:last-child")?.textContent.trim() || "0";

    if (lightboxImg && imgEl) {
      lightboxImg.src = imgEl.src;
      lightboxImg.alt = name;
    }
    if (lightboxTitle) lightboxTitle.textContent = name;
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
    if (e.target === lightboxModal) closeLightbox();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (editPackModal?.classList.contains("active")) closeEditModal();
      if (addStickerModal?.classList.contains("active")) closeAddSticker();
      if (lightboxModal?.classList.contains("active")) closeLightbox();
    }
  });

  subStickerItems.forEach(item => {
    const stage = item.querySelector(".sub-thumb-stage");
    const zoomBtn = item.querySelector(".btn-zoom-sub");

    stage?.addEventListener("click", () => openLightbox(item));
    zoomBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      openLightbox(item);
    });
  });

  // 6. Xóa sticker khỏi bộ
  const deleteBtns = document.querySelectorAll(".btn-delete-sub");
  deleteBtns.forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      const item = this.closest(".sticker-sub-item");
      const name = item?.querySelector(".sub-title")?.textContent.trim() || "Sticker";

      if (confirm(`Bạn có chắc muốn xóa sticker "${name}" khỏi bộ sưu tập này?`)) {
        item?.remove();
        filterPackStickers();
        showToast(`🗑️ Đã xóa sticker "${name}".`);
      }
    });
  });

  // 7. Chuyển đổi trạng thái gói (Công khai / Tạm ẩn)
  const toggleStatusBtn = document.getElementById("btnTogglePackStatus");
  toggleStatusBtn?.addEventListener("click", function () {
    const statusBadge = document.getElementById("packStatusBadge");
    const isPublic = statusBadge?.classList.contains("status-badge-active");

    if (isPublic) {
      statusBadge.className = "status-badge status-badge-hidden";
      statusBadge.innerHTML = `<i data-lucide="eye-off" style="width: 12px; height: 12px;"></i> Tạm ẩn`;
      this.innerHTML = `<i data-lucide="eye" style="width: 14px; height: 14px;"></i><span>Công khai gói</span>`;
      showToast("👁️‍🗨️ Đã tạm ẩn bộ sưu tập Cute Cats khỏi trang người dùng.");
    } else {
      statusBadge.className = "status-badge status-badge-active";
      statusBadge.innerHTML = `<i data-lucide="check-circle" style="width: 12px; height: 12px;"></i> Công khai`;
      this.innerHTML = `<i data-lucide="eye-off" style="width: 14px; height: 14px;"></i><span>Tạm ẩn gói</span>`;
      showToast("✅ Đã công khai lại bộ sưu tập Cute Cats.");
    }

    if (window.lucide) window.lucide.createIcons();
  });

  // 8. Tải trọn bộ ZIP
  const downloadZipBtn = document.getElementById("btnDownloadPackZip");
  downloadZipBtn?.addEventListener("click", function () {
    showToast("📦 Đang đóng gói và tải xuống tệp: Cute_Cats_Pack_120_Stickers.zip...");
  });
});
