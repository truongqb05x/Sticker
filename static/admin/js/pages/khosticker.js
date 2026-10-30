/**
 * ========================================================
 * ADMIN KHO STICKER (STICKER REPOSITORY) - JAVASCRIPT
 * Tích hợp REST API, Gallery Grid, Lightbox xem trước, Upload & CRUD thực tế
 * ========================================================
 */

// Chống tấn công XSS khi render dữ liệu động
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", function () {
  // 1. Khởi tạo Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 2. Elements Tìm Kiếm & Lọc
  const searchInput = document.getElementById("stickerSearchInput");
  const packSelect = document.getElementById("stickerPackFilter");
  const catTabs = document.querySelectorAll(".cat-tab-btn");
  const galleryGrid = document.getElementById("stickerGalleryGrid");

  const stickerVisibleCount = document.getElementById("stickerVisibleCount");
  const stickerTotalCount = document.getElementById("stickerTotalCount");
  const totalStickerBadge = document.getElementById("totalStickerBadge");
  const sidebarStickerCounter = document.getElementById("sidebarStickerCounter");
  const countCatAll = document.getElementById("countCatAll");

  // Điều khiển Phân trang
  const btnPrevPage = document.getElementById("btnStickerPrevPage");
  const btnNextPage = document.getElementById("btnStickerNextPage");
  const btnPageNum = document.getElementById("btnStickerPageNum");

  // Trạng thái tìm kiếm & phân trang
  let currentCategory = "all";
  let currentPack = "all";
  let currentSearch = "";
  let currentPage = 1;
  let totalPages = 1;

  // 3. Modal Tải Lên Sticker Mới
  const uploadModal = document.getElementById("uploadStickerModal");
  const openUploadBtn = document.getElementById("openUploadModalBtn");
  const closeUploadBtn = document.getElementById("closeUploadModalBtn");
  const cancelUploadBtn = document.getElementById("cancelUploadModalBtn");
  const uploadForm = document.getElementById("uploadStickerForm");
  const dropzoneArea = document.getElementById("dropzoneArea");
  const dropzoneTitle = document.getElementById("dropzoneTitle");
  const stickerFileInput = document.getElementById("stickerFileInput");
  const uploadPackSelect = document.getElementById("uploadPackSelect");
  const stickerTitleInput = document.getElementById("stickerTitleInput");
  const stickerTagsInput = document.getElementById("stickerTagsInput");
  const btnSubmitUpload = document.getElementById("btnSubmitUpload");

  function openUpload() {
    if (uploadModal) {
      uploadModal.classList.add("active");
      document.body.style.overflow = "hidden";
      setTimeout(() => stickerTitleInput?.focus(), 100);
    }
  }

  function closeUpload() {
    if (uploadModal) {
      uploadModal.classList.remove("active");
      document.body.style.overflow = "";
      uploadForm?.reset();
      if (dropzoneTitle) {
        dropzoneTitle.textContent = "Kéo & thả tệp sticker vào đây, hoặc click để chọn";
      }
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

  // Xử lý chọn tệp và hiển thị tên tệp được chọn
  stickerFileInput?.addEventListener("change", function () {
    if (this.files && this.files[0]) {
      const file = this.files[0];
      if (dropzoneTitle) {
        dropzoneTitle.textContent = `Đã chọn: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      }
      // Gợi ý tiêu đề tự động nếu ô tiêu đề còn trống
      if (stickerTitleInput && !stickerTitleInput.value.trim()) {
        const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
        stickerTitleInput.value = baseName.replace(/[_-]/g, " ");
      }
    }
  });

  // Kéo thả tệp vào Dropzone
  dropzoneArea?.addEventListener("dragover", function (e) {
    e.preventDefault();
    dropzoneArea.style.borderColor = "#C45832";
    dropzoneArea.style.backgroundColor = "rgba(196, 88, 50, 0.05)";
  });

  dropzoneArea?.addEventListener("dragleave", function () {
    dropzoneArea.style.borderColor = "";
    dropzoneArea.style.backgroundColor = "";
  });

  dropzoneArea?.addEventListener("drop", function (e) {
    e.preventDefault();
    dropzoneArea.style.borderColor = "";
    dropzoneArea.style.backgroundColor = "";
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      stickerFileInput.files = e.dataTransfer.files;
      const file = e.dataTransfer.files[0];
      if (dropzoneTitle) {
        dropzoneTitle.textContent = `Đã chọn: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      }
      if (stickerTitleInput && !stickerTitleInput.value.trim()) {
        const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
        stickerTitleInput.value = baseName.replace(/[_-]/g, " ");
      }
    }
  });

  // Gửi Form Tải Lên Sticker
  uploadForm?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const title = stickerTitleInput?.value.trim();
    const packId = uploadPackSelect?.value;
    const tags = stickerTagsInput?.value.trim();

    if (!title) {
      showToast("⚠️ Vui lòng nhập tiêu đề sticker!");
      return;
    }

    if (!packId) {
      showToast("⚠️ Vui lòng chọn bộ sưu tập!");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("pack_id", packId);
    formData.append("tags", tags);

    if (stickerFileInput?.files && stickerFileInput.files[0]) {
      formData.append("file", stickerFileInput.files[0]);
    }

    if (btnSubmitUpload) {
      btnSubmitUpload.disabled = true;
      btnSubmitUpload.textContent = "Đang tải lên...";
    }

    try {
      const response = await fetch("/admin/api/stickers", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        closeUpload();
        showToast(`✅ ${result.message}`);
        fetchStickers();
      } else {
        showToast(`❌ ${result.message || "Tải lên thất bại!"}`);
      }
    } catch (err) {
      console.error("Lỗi khi tải lên sticker:", err);
      showToast("❌ Lỗi kết nối khi tải lên sticker!");
    } finally {
      if (btnSubmitUpload) {
        btnSubmitUpload.disabled = false;
        btnSubmitUpload.textContent = "Tải lên ngay";
      }
    }
  });

  // 4. Modal Lightbox Xem Chi Tiết Phóng To
  const lightboxModal = document.getElementById("lightboxModal");
  const closeLightboxBtn = document.getElementById("closeLightboxBtn");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxTitle = document.getElementById("lightboxTitle");
  const lightboxPack = document.getElementById("lightboxPack");
  const lightboxDim = document.getElementById("lightboxDim");
  const lightboxDownloads = document.getElementById("lightboxDownloads");
  const lightboxFileSize = document.getElementById("lightboxFileSize");
  const lightboxTags = document.getElementById("lightboxTags");

  async function openLightbox(stickerId) {
    if (!lightboxModal) return;

    try {
      const response = await fetch(`/admin/api/stickers/${stickerId}`);
      const data = await response.json();

      if (!data.success || !data.sticker) {
        showToast("❌ Không thể tải thông tin sticker!");
        return;
      }

      const s = data.sticker;

      if (lightboxImg) {
        lightboxImg.src = s.file_path;
        lightboxImg.alt = s.title;
      }
      if (lightboxTitle) lightboxTitle.textContent = `${s.title} (${s.file_name})`;
      if (lightboxPack) lightboxPack.textContent = `${s.pack_title} (${s.category_name})`;
      if (lightboxDim) lightboxDim.textContent = `${s.dimensions} (${s.format} Vector)`;
      if (lightboxDownloads) lightboxDownloads.textContent = `${s.total_downloads_fmt || s.total_downloads} lượt tải`;
      if (lightboxFileSize) lightboxFileSize.textContent = `${s.file_size_kb} KB`;
      if (lightboxTags) lightboxTags.textContent = s.tags || "Không có từ khóa";

      lightboxModal.classList.add("active");
      document.body.style.overflow = "hidden";
    } catch (err) {
      console.error("Lỗi khi mở lightbox:", err);
      showToast("❌ Lỗi kết nối khi tải chi tiết sticker!");
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

  // 5. Render Thẻ Gallery Grid
  function renderGallery(stickers) {
    if (!galleryGrid) return;

    if (!stickers || stickers.length === 0) {
      galleryGrid.innerHTML = `
        <div class="empty-gallery-state" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #8C7B71;">
          <i data-lucide="inbox" style="width: 42px; height: 42px; display: block; margin: 0 auto 12px; opacity: 0.5;"></i>
          Không tìm thấy sticker nào phù hợp với bộ lọc hiện tại.
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    let html = "";
    stickers.forEach(s => {
      html += `
        <div class="sticker-grid-item" data-id="${s.id}" data-category="${escapeHtml(s.category_slug)}" data-pack="${s.pack_id}">
          <div class="sticker-thumb-stage" title="Nhấn để phóng to">
            <img src="${escapeHtml(s.file_path)}" alt="${escapeHtml(s.title)}" class="sticker-img" loading="lazy" onerror="this.src='../../assets/logo_cat.svg'">
            <div class="stage-hover-overlay">
              <button type="button" class="stage-action-btn btn-zoom-sticker" data-id="${s.id}" title="Phóng to">
                <i data-lucide="zoom-in" style="width: 15px; height: 15px;"></i>
              </button>
              <button type="button" class="stage-action-btn btn-download-sticker" data-id="${s.id}" data-file="${escapeHtml(s.file_path)}" data-name="${escapeHtml(s.file_name)}" title="Tải tệp về">
                <i data-lucide="download" style="width: 15px; height: 15px;"></i>
              </button>
              <button type="button" class="stage-action-btn btn-delete-sticker" data-id="${s.id}" data-title="${escapeHtml(s.title)}" title="Xóa sticker">
                <i data-lucide="trash-2" style="width: 15px; height: 15px; color: #C4381C;"></i>
              </button>
            </div>
          </div>
          <div class="sticker-info-block">
            <div class="sticker-name-title">${escapeHtml(s.title)} (${escapeHtml(s.file_name)})</div>
            <div class="sticker-pack-label">
              <i data-lucide="folder" style="width: 12px; height: 12px;"></i>
              <span>${escapeHtml(s.pack_title)}</span>
            </div>
            <div class="sticker-spec-row">
              <span class="sticker-format-tag">${escapeHtml(s.format)} ${escapeHtml(s.dimensions)}</span>
              <span class="sticker-downloads">
                <i data-lucide="download" style="width: 12px; height: 12px;"></i>
                ${escapeHtml(s.total_downloads_fmt || String(s.total_downloads))}
              </span>
            </div>
          </div>
        </div>
      `;
    });

    galleryGrid.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
    bindCardEvents();
  }

  // 6. Gắn sự kiện cho các nút trên thẻ Sticker
  function bindCardEvents() {
    // Phóng to Lightbox
    document.querySelectorAll(".sticker-thumb-stage").forEach(stage => {
      stage.onclick = function (e) {
        // Tránh trigger khi bấm các nút overlay bên trong
        if (e.target.closest(".stage-action-btn")) return;
        const card = this.closest(".sticker-grid-item");
        const stickerId = card?.getAttribute("data-id");
        if (stickerId) openLightbox(stickerId);
      };
    });

    document.querySelectorAll(".btn-zoom-sticker").forEach(btn => {
      btn.onclick = function (e) {
        e.stopPropagation();
        const stickerId = this.getAttribute("data-id");
        if (stickerId) openLightbox(stickerId);
      };
    });

    // Tải tệp Sticker
    document.querySelectorAll(".btn-download-sticker").forEach(btn => {
      btn.onclick = async function (e) {
        e.stopPropagation();
        const stickerId = this.getAttribute("data-id");
        const filePath = this.getAttribute("data-file");
        const fileName = this.getAttribute("data-name") || "sticker.svg";

        showToast(`📥 Đang tải xuống tệp: ${fileName}...`);

        try {
          // Ghi nhận lượt tải vào backend
          fetch(`/admin/api/stickers/${stickerId}/download`, { method: "POST" });

          // Kích hoạt tải file trình duyệt
          const a = document.createElement("a");
          a.href = filePath;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } catch (err) {
          console.error("Lỗi khi tải file:", err);
        }
      };
    });

    // Xóa Sticker khỏi CSDL
    document.querySelectorAll(".btn-delete-sticker").forEach(btn => {
      btn.onclick = async function (e) {
        e.stopPropagation();
        const stickerId = this.getAttribute("data-id");
        const title = this.getAttribute("data-title") || "sticker";

        if (!confirm(`Bạn có chắc muốn xóa vĩnh viễn sticker "${title}" khỏi kho lưu trữ?`)) {
          return;
        }

        try {
          const response = await fetch(`/admin/api/stickers/${stickerId}`, {
            method: "DELETE",
          });
          const result = await response.json();

          if (result.success) {
            showToast(`🗑️ Đã xóa sticker "${title}" thành công!`);
            fetchStickers();
          } else {
            showToast(`❌ ${result.message || "Không thể xóa sticker!"}`);
          }
        } catch (err) {
          console.error("Lỗi khi xóa sticker:", err);
          showToast("❌ Lỗi kết nối tới máy chủ khi xóa sticker!");
        }
      };
    });
  }

  // 7. Gọi API lấy danh sách Stickers
  async function fetchStickers() {
    try {
      const params = new URLSearchParams({
        category: currentCategory,
        pack_id: currentPack,
        search: currentSearch,
        page: currentPage,
        limit: 12,
      });

      const response = await fetch(`/admin/api/stickers?${params.toString()}`);
      const data = await response.json();

      if (!data.success) {
        showToast("❌ Không thể tải danh sách sticker!");
        return;
      }

      renderGallery(data.stickers);

      // Cập nhật số lượng hiển thị
      if (stickerVisibleCount) stickerVisibleCount.textContent = data.stickers.length;
      if (stickerTotalCount) stickerTotalCount.textContent = data.total;
      if (totalStickerBadge) totalStickerBadge.textContent = `${data.total} sticker`;
      if (sidebarStickerCounter) sidebarStickerCounter.textContent = data.total;

      // Cập nhật số lượng trên các tab danh mục
      if (data.cat_counts) {
        if (countCatAll) countCatAll.textContent = data.cat_counts.all || data.total;
        document.querySelectorAll("[data-cat-slug]").forEach(badge => {
          const slug = badge.getAttribute("data-cat-slug");
          if (slug && data.cat_counts[slug] !== undefined) {
            badge.textContent = data.cat_counts[slug];
          }
        });
      }

      // Điều khiển nút phân trang
      totalPages = data.pages || 1;
      if (btnPageNum) btnPageNum.textContent = currentPage;
      if (btnPrevPage) btnPrevPage.disabled = currentPage <= 1;
      if (btnNextPage) btnNextPage.disabled = currentPage >= totalPages;

    } catch (err) {
      console.error("Lỗi khi tải stickers từ API:", err);
      showToast("❌ Lỗi kết nối khi tải danh sách sticker!");
    }
  }

  // 8. Gắn sự kiện Tìm kiếm & Bộ lọc
  let searchDebounceTimer = null;
  searchInput?.addEventListener("input", function () {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      currentSearch = this.value.trim();
      currentPage = 1;
      fetchStickers();
    }, 280);
  });

  packSelect?.addEventListener("change", function () {
    currentPack = this.value;
    currentPage = 1;
    fetchStickers();
  });

  catTabs.forEach(tab => {
    tab.addEventListener("click", function () {
      catTabs.forEach(t => t.classList.remove("active"));
      this.classList.add("active");
      currentCategory = this.getAttribute("data-category") || "all";
      currentPage = 1;
      fetchStickers();
    });
  });

  btnPrevPage?.addEventListener("click", function () {
    if (currentPage > 1) {
      currentPage--;
      fetchStickers();
    }
  });

  btnNextPage?.addEventListener("click", function () {
    if (currentPage < totalPages) {
      currentPage++;
      fetchStickers();
    }
  });

  // Gắn sự kiện cho các thẻ SSR ban đầu
  bindCardEvents();
});
