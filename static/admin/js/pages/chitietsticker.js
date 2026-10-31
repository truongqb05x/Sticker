/**
 * ========================================================
 * ADMIN CHI TIẾT BỘ SƯU TẬP (COLLECTION DETAIL) - JAVASCRIPT
 * Tích hợp REST API CSDL thực tế 100%: quản lý sticker, thêm/xóa/phóng to,
 * chỉnh sửa thông tin gói, lọc theo tag và chuyển trạng thái phát hành.
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

  // Lấy pack ID từ DOM hoặc URL
  const overviewCard = document.getElementById("packOverviewCard");
  const urlParams = new URLSearchParams(window.location.search);
  const packId = overviewCard?.getAttribute("data-pack-id") || urlParams.get("id") || "1";

  // Các phần tử DOM chính
  const packVisibleCount = document.getElementById("packVisibleCount");
  const heroStickersCount = document.getElementById("heroStickersCount");
  const stickerFilterRow = document.getElementById("stickerFilterRow");
  const packStickersGrid = document.getElementById("packStickersGrid");

  let currentTag = "all";
  let stickersData = [];

  // ========================================================
  // 2. TẠO BỘ LỌC TAGS CẢM XÚC DỰA TRÊN DỮ LIỆU THỰC
  // ========================================================
  function buildTagFilterButtons(stickers) {
    if (!stickerFilterRow) return;

    // Đếm số lượng theo từng tag
    const tagCounts = { all: stickers.length };
    stickers.forEach(s => {
      if (!s.tags) return;
      const tags = s.tags.split(/[,#\s]+/).filter(t => t.trim().length > 0);
      tags.forEach(t => {
        const cleanTag = t.trim().toLowerCase();
        tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
      });
    });

    // Tạo HTML cho các nút tag
    let tagsHtml = `<button type="button" class="tag-filter-btn ${currentTag === 'all' ? 'active' : ''}" data-tag="all">Tất cả (${stickers.length})</button>`;
    
    // Sắp xếp các tag theo số lượng sticker nhiều nhất
    const sortedTags = Object.keys(tagCounts)
      .filter(t => t !== "all")
      .sort((a, b) => tagCounts[b] - tagCounts[a])
      .slice(0, 10); // Lấy tối đa 10 tag phổ biến nhất

    sortedTags.forEach(tag => {
      const isActive = currentTag === tag ? "active" : "";
      tagsHtml += `<button type="button" class="tag-filter-btn ${isActive}" data-tag="${escapeHtml(tag)}">#${escapeHtml(tag)} (${tagCounts[tag]})</button>`;
    });

    stickerFilterRow.innerHTML = tagsHtml;

    // Gắn sự kiện click cho các nút lọc
    stickerFilterRow.querySelectorAll(".tag-filter-btn").forEach(btn => {
      btn.addEventListener("click", function () {
        stickerFilterRow.querySelectorAll(".tag-filter-btn").forEach(b => b.classList.remove("active"));
        this.classList.add("active");
        currentTag = this.getAttribute("data-tag") || "all";
        applyStickerFilter();
      });
    });
  }

  // ========================================================
  // 3. LỌC VÀ HIỂN THỊ STICKERS THEO TAG
  // ========================================================
  function applyStickerFilter() {
    const items = packStickersGrid?.querySelectorAll(".sticker-sub-item");
    if (!items) return;

    let visibleCount = 0;
    items.forEach(item => {
      const itemTags = (item.getAttribute("data-tags") || "").toLowerCase();
      const matchTag = (currentTag === "all" || itemTags.includes(currentTag.toLowerCase()));

      if (matchTag) {
        item.style.display = "";
        visibleCount++;
      } else {
        item.style.display = "none";
      }
    });

    if (packVisibleCount) {
      packVisibleCount.textContent = `${visibleCount} / ${items.length} sticker`;
    }
  }

  // ========================================================
  // 4. RENDER DANH SÁCH STICKERS TỪ API
  // ========================================================
  function renderStickers(stickers) {
    if (!packStickersGrid) return;
    stickersData = stickers || [];

    if (stickersData.length === 0) {
      packStickersGrid.innerHTML = `
        <div class="empty-stickers-box" style="grid-column: 1 / -1; text-align: center; padding: 48px 16px; color: #8C7B71;">
          <i data-lucide="inbox" style="width: 44px; height: 44px; display: block; margin: 0 auto 12px; opacity: 0.5;"></i>
          <p style="font-size: 15px; font-weight: 700; margin-bottom: 6px;">Bộ sưu tập này chưa có sticker nào</p>
          <p style="font-size: 13px;">Nhấn nút "Thêm sticker vào bộ" ở trên để tải lên sticker đầu tiên!</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      if (packVisibleCount) packVisibleCount.textContent = "0 sticker";
      if (heroStickersCount) heroStickersCount.textContent = "0 sticker";
      buildTagFilterButtons([]);
      return;
    }

    let html = "";
    stickersData.forEach(s => {
      const formatUpper = (s.format || "SVG").toUpperCase();
      const dimStr = s.dimensions || "512 x 512 px";
      const downloadsStr = s.total_downloads_fmt || (s.total_downloads ? `${s.total_downloads}` : "0");
      const tagsStr = s.tags ? s.tags.split(/[,#\s]+/).filter(t => t).map(t => `#${t}`).join(" ") : "";

      html += `
        <div class="sticker-sub-item" 
             data-id="${s.id}" 
             data-tags="${escapeHtml(s.tags || '')}" 
             data-title="${escapeHtml(s.title)}" 
             data-file="${escapeHtml(s.file_path)}" 
             data-dim="${escapeHtml(dimStr)}" 
             data-format="${escapeHtml(formatUpper)}" 
             data-downloads="${escapeHtml(downloadsStr)}">
          <div class="sub-thumb-stage" title="Nhấn để phóng to">
            <img src="${escapeHtml(s.file_path)}" alt="${escapeHtml(s.title)}" class="sub-sticker-img" loading="lazy" onerror="this.src='/assets/logo_cat.svg'">
            <div class="sub-stage-overlay">
              <button type="button" class="sub-stage-btn btn-zoom-sub" data-id="${s.id}" title="Phóng to">
                <i data-lucide="zoom-in" style="width: 14px; height: 14px;"></i>
              </button>
              <button type="button" class="sub-stage-btn btn-delete-sub" data-id="${s.id}" data-name="${escapeHtml(s.title)}" title="Xóa khỏi bộ">
                <i data-lucide="trash-2" style="width: 14px; height: 14px; color: #C4381C;"></i>
              </button>
            </div>
          </div>
          <div class="sub-info-block">
            <div class="sub-title">${escapeHtml(s.file_name || s.title)} • ${escapeHtml(s.title)}</div>
            <div class="sub-tags-list">${escapeHtml(tagsStr)}</div>
            <div class="sub-footer-meta">
              <span>${escapeHtml(formatUpper)} • ${escapeHtml(dimStr)}</span>
              <span style="font-weight: 700; color: #2E7D32;">${escapeHtml(downloadsStr)} tải</span>
            </div>
          </div>
        </div>
      `;
    });

    packStickersGrid.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();

    if (heroStickersCount) heroStickersCount.textContent = `${stickersData.length} sticker`;
    if (packVisibleCount) packVisibleCount.textContent = `${stickersData.length} / ${stickersData.length} sticker`;

    buildTagFilterButtons(stickersData);
    bindStickerEvents();
  }

  // ========================================================
  // 5. GỌI API LẤY DANH SÁCH STICKERS THỰC TẾ
  // ========================================================
  async function fetchStickers() {
    try {
      const response = await fetch(`/admin/api/stickers?pack_id=${packId}&limit=150`);
      const data = await response.json();

      if (data.success && Array.isArray(data.stickers)) {
        renderStickers(data.stickers);
      } else {
        showToast("❌ Không thể tải danh sách sticker của bộ sưu tập!");
      }
    } catch (err) {
      console.error("Lỗi khi tải stickers:", err);
      showToast("❌ Lỗi kết nối khi tải danh sách sticker!");
    }
  }

  // ========================================================
  // 6. GẮN SỰ KIỆN XÓA & LIGHTBOX CHO TỪNG STICKER
  // ========================================================
  function bindStickerEvents() {
    const items = packStickersGrid?.querySelectorAll(".sticker-sub-item");
    if (!items) return;

    items.forEach(item => {
      const stage = item.querySelector(".sub-thumb-stage");
      const zoomBtn = item.querySelector(".btn-zoom-sub");
      const deleteBtn = item.querySelector(".btn-delete-sub");

      // Bấm vào khung ảnh để phóng to
      stage?.addEventListener("click", (e) => {
        if (!e.target.closest(".btn-delete-sub")) {
          openLightbox(item);
        }
      });

      zoomBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        openLightbox(item);
      });

      // Bấm nút xóa sticker
      deleteBtn?.addEventListener("click", async function (e) {
        e.stopPropagation();
        const stickerId = this.getAttribute("data-id");
        const name = this.getAttribute("data-name") || "sticker";

        if (!confirm(`Bạn có chắc muốn xóa vĩnh viễn sticker "${name}" khỏi bộ sưu tập này?`)) {
          return;
        }

        try {
          const response = await fetch(`/admin/api/stickers/${stickerId}`, {
            method: "DELETE",
          });
          const result = await response.json();

          if (result.success) {
            showToast(`🗑️ Đã xóa sticker "${name}" thành công!`);
            item.remove();
            applyStickerFilter();

            // Cập nhật lại số đếm ở hero card
            const remaining = packStickersGrid.querySelectorAll(".sticker-sub-item").length;
            if (heroStickersCount) heroStickersCount.textContent = `${remaining} sticker`;
            if (packVisibleCount) packVisibleCount.textContent = `${remaining} / ${remaining} sticker`;
          } else {
            showToast(`❌ ${result.message || "Không thể xóa sticker!"}`);
          }
        } catch (err) {
          console.error("Lỗi khi xóa sticker:", err);
          showToast("❌ Lỗi kết nối khi xóa sticker!");
        }
      });
    });
  }

  // ========================================================
  // 7. LIGHTBOX XEM PHÓNG TO STICKER
  // ========================================================
  const lightboxModal = document.getElementById("lightboxModal");
  const closeLightboxBtn = document.getElementById("closeLightboxBtn");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxTitle = document.getElementById("lightboxTitle");
  const lightboxDim = document.getElementById("lightboxDim");
  const lightboxDownloads = document.getElementById("lightboxDownloads");
  const lightboxPackName = document.getElementById("lightboxPackName");

  function openLightbox(item) {
    const file = item.getAttribute("data-file") || item.querySelector(".sub-sticker-img")?.src;
    const title = item.getAttribute("data-title") || "Sticker";
    const dim = item.getAttribute("data-dim") || "512 x 512 px";
    const format = item.getAttribute("data-format") || "SVG";
    const downloads = item.getAttribute("data-downloads") || "0";
    const packTitle = document.getElementById("packTitleText")?.textContent || "Bộ sưu tập";

    if (lightboxImg) {
      lightboxImg.src = file;
      lightboxImg.alt = title;
    }
    if (lightboxTitle) lightboxTitle.textContent = title;
    if (lightboxDim) lightboxDim.textContent = `${dim} (${format})`;
    if (lightboxDownloads) lightboxDownloads.textContent = `${downloads} lượt tải`;
    if (lightboxPackName) lightboxPackName.textContent = packTitle;

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

  // ========================================================
  // 8. MODAL 1: CHỈNH SỬA THÔNG TIN BỘ SƯU TẬP (PUT API)
  // ========================================================
  const editPackModal = document.getElementById("editPackModal");
  const openEditPackBtn = document.getElementById("openEditPackBtn");
  const closeEditPackBtn = document.getElementById("closeEditPackBtn");
  const cancelEditPackBtn = document.getElementById("cancelEditPackBtn");
  const editPackForm = document.getElementById("editPackForm");
  const btnSubmitEditPack = document.getElementById("btnSubmitEditPack");

  const editPackTitleInput = document.getElementById("editPackTitleInput");
  const editPackAuthorInput = document.getElementById("editPackAuthorInput");
  const editPackCategory = document.getElementById("editPackCategory");
  const editPackStatus = document.getElementById("editPackStatus");
  const editPackCoverFile = document.getElementById("editPackCoverFile");
  const editPackCoverInput = document.getElementById("editPackCoverInput");
  const editPackCoverPreview = document.getElementById("editPackCoverPreview");
  const editPackCoverName = document.getElementById("editPackCoverName");
  const editPackTagsInput = document.getElementById("editPackTagsInput");
  const editPackDesc = document.getElementById("editPackDesc");

  // Xem trước ảnh khi người dùng chọn tệp mới
  editPackCoverFile?.addEventListener("change", function (e) {
    const file = e.target.files?.[0];
    if (file) {
      if (editPackCoverPreview) editPackCoverPreview.src = URL.createObjectURL(file);
      if (editPackCoverName) editPackCoverName.textContent = file.name;
    }
  });

  function openEditModal() {
    if (!editPackModal) return;
    editPackModal.classList.add("active");
    document.body.style.overflow = "hidden";
    setTimeout(() => editPackTitleInput?.focus(), 100);
  }

  function closeEditModal() {
    if (!editPackModal) return;
    editPackModal.classList.remove("active");
    document.body.style.overflow = "";
  }

  openEditPackBtn?.addEventListener("click", openEditModal);
  closeEditPackBtn?.addEventListener("click", closeEditModal);
  cancelEditPackBtn?.addEventListener("click", closeEditModal);

  editPackModal?.addEventListener("click", function (e) {
    if (e.target === editPackModal) closeEditModal();
  });

  // Gửi form chỉnh sửa bộ sưu tập tới API
  editPackForm?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const title = editPackTitleInput?.value.trim();
    if (!title) {
      showToast("⚠️ Vui lòng nhập tên bộ sưu tập!");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("author_name", editPackAuthorInput?.value.trim() || "StickerHub Team");
    formData.append("category_id", editPackCategory?.value || "1");
    formData.append("status", editPackStatus?.value || "active");
    formData.append("tags_str", editPackTagsInput?.value.trim() || "");
    formData.append("description", editPackDesc?.value.trim() || "");

    if (editPackCoverFile?.files?.[0]) {
      formData.append("cover_file", editPackCoverFile.files[0]);
    } else if (editPackCoverInput?.value.trim()) {
      formData.append("cover_image", editPackCoverInput.value.trim());
    }

    if (btnSubmitEditPack) {
      btnSubmitEditPack.disabled = true;
      btnSubmitEditPack.textContent = "Đang lưu...";
    }

    try {
      const response = await fetch(`/admin/api/packs/${packId}`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.pack) {
        const p = result.pack;
        closeEditModal();
        showToast(`✅ ${result.message}`);

        // Reset input file sau khi lưu thành công
        if (editPackCoverFile) editPackCoverFile.value = "";
        if (editPackCoverInput && p.cover_image) editPackCoverInput.value = p.cover_image;
        if (editPackCoverPreview && p.cover_image) editPackCoverPreview.src = p.cover_image;
        if (editPackCoverName && p.cover_image) editPackCoverName.textContent = p.cover_image;

        // Cập nhật ngay các thông tin trên giao diện Hero
        const packTitleText = document.getElementById("packTitleText");
        const breadcrumbPackTitle = document.getElementById("breadcrumbPackTitle");
        const packAuthorText = document.getElementById("packAuthorText");
        const packCategoryBadge = document.getElementById("packCategoryBadge");
        const packDescText = document.getElementById("packDescText");
        const packCoverImg = document.getElementById("packCoverImg");

        if (packTitleText) packTitleText.textContent = p.title;
        if (breadcrumbPackTitle) breadcrumbPackTitle.textContent = p.title;
        if (packAuthorText) packAuthorText.textContent = p.author_name;
        if (packCategoryBadge) packCategoryBadge.textContent = p.category_name;
        if (packDescText) packDescText.textContent = p.description;
        if (packCoverImg && p.cover_image) packCoverImg.src = p.cover_image;

        // Cập nhật badge trạng thái
        updateStatusBadge(p.status);
      } else {
        showToast(`❌ ${result.message || "Không thể cập nhật bộ sưu tập!"}`);
      }
    } catch (err) {
      console.error("Lỗi khi cập nhật bộ sưu tập:", err);
      showToast("❌ Lỗi kết nối khi cập nhật bộ sưu tập!");
    } finally {
      if (btnSubmitEditPack) {
        btnSubmitEditPack.disabled = false;
        btnSubmitEditPack.textContent = "Lưu thay đổi";
      }
    }
  });

  // ========================================================
  // 9. MODAL 2: THÊM STICKER MỚI VÀO BỘ (POST FORM-DATA API)
  // ========================================================
  const addStickerModal = document.getElementById("addStickerToPackModal");
  const openAddStickerBtn = document.getElementById("openAddStickerModalBtn");
  const closeAddStickerBtn = document.getElementById("closeAddStickerModalBtn");
  const cancelAddStickerBtn = document.getElementById("cancelAddStickerModalBtn");
  const addStickerForm = document.getElementById("addStickerForm");
  const btnSubmitAddSticker = document.getElementById("btnSubmitAddSticker");

  const newStickerTitle = document.getElementById("newStickerTitle");
  const newStickerTags = document.getElementById("newStickerTags");
  const newStickerFile = document.getElementById("newStickerFile");

  function openAddSticker() {
    if (!addStickerModal) return;
    addStickerForm?.reset();
    addStickerModal.classList.add("active");
    document.body.style.overflow = "hidden";
    setTimeout(() => newStickerTitle?.focus(), 100);
  }

  function closeAddSticker() {
    if (!addStickerModal) return;
    addStickerModal.classList.remove("active");
    document.body.style.overflow = "";
    addStickerForm?.reset();
  }

  openAddStickerBtn?.addEventListener("click", openAddSticker);
  closeAddStickerBtn?.addEventListener("click", closeAddSticker);
  cancelAddStickerBtn?.addEventListener("click", closeAddSticker);

  addStickerModal?.addEventListener("click", function (e) {
    if (e.target === addStickerModal) closeAddSticker();
  });

  // Gửi Form tạo mới sticker qua FormData tới API /admin/api/stickers
  addStickerForm?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const title = newStickerTitle?.value.trim();
    if (!title) {
      showToast("⚠️ Vui lòng nhập tiêu đề cho sticker!");
      return;
    }

    const formData = new FormData();
    formData.append("pack_id", packId);
    formData.append("title", title);
    formData.append("tags", newStickerTags?.value.trim() || "");

    if (newStickerFile?.files?.[0]) {
      formData.append("file", newStickerFile.files[0]);
    }

    if (btnSubmitAddSticker) {
      btnSubmitAddSticker.disabled = true;
      btnSubmitAddSticker.textContent = "Đang tải lên...";
    }

    try {
      const response = await fetch("/admin/api/stickers", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        closeAddSticker();
        showToast(`✅ ${result.message}`);
        // Nạp lại danh sách sticker thực tế
        fetchStickers();
      } else {
        showToast(`❌ ${result.message || "Không thể tải lên sticker!"}`);
      }
    } catch (err) {
      console.error("Lỗi khi tải lên sticker:", err);
      showToast("❌ Lỗi kết nối khi tải lên sticker!");
    } finally {
      if (btnSubmitAddSticker) {
        btnSubmitAddSticker.disabled = false;
        btnSubmitAddSticker.textContent = "Thêm vào bộ";
      }
    }
  });

  // ========================================================
  // 10. CHUYỂN TRẠNG THÁI GÓI (CÔNG KHAI / TẠM ẨN)
  // ========================================================
  const toggleStatusBtn = document.getElementById("btnTogglePackStatus");

  function updateStatusBadge(status) {
    const statusBadge = document.getElementById("packStatusBadge");
    const statusLabel = document.getElementById("packStatusLabel");
    const toggleLabel = document.getElementById("btnTogglePackStatusLabel");

    if (status === "active") {
      if (statusBadge) statusBadge.className = "status-badge status-badge-active";
      if (statusBadge) statusBadge.innerHTML = `<i data-lucide="check-circle" style="width: 12px; height: 12px;"></i> Công khai`;
      if (toggleStatusBtn) {
        toggleStatusBtn.setAttribute("data-status", "active");
        toggleStatusBtn.innerHTML = `<i data-lucide="eye-off" style="width: 14px; height: 14px;"></i><span>Tạm ẩn gói</span>`;
      }
    } else {
      if (statusBadge) statusBadge.className = "status-badge status-badge-hidden";
      if (statusBadge) statusBadge.innerHTML = `<i data-lucide="eye-off" style="width: 12px; height: 12px;"></i> Tạm ẩn`;
      if (toggleStatusBtn) {
        toggleStatusBtn.setAttribute("data-status", "hidden");
        toggleStatusBtn.innerHTML = `<i data-lucide="eye" style="width: 14px; height: 14px;"></i><span>Công khai gói</span>`;
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }

  toggleStatusBtn?.addEventListener("click", async function () {
    const currentStatus = this.getAttribute("data-status") || "active";
    const nextStatus = currentStatus === "active" ? "hidden" : "active";

    try {
      const response = await fetch(`/admin/api/packs/${packId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const result = await response.json();

      if (result.success) {
        updateStatusBadge(nextStatus);
        showToast(`✅ ${result.message}`);
      } else {
        showToast(`❌ ${result.message || "Không thể chuyển trạng thái!"}`);
      }
    } catch (err) {
      console.error("Lỗi khi chuyển trạng thái:", err);
      showToast("❌ Lỗi kết nối khi đổi trạng thái bộ sưu tập!");
    }
  });

  // ========================================================
  // 11. TẢI TRỌN BỘ ZIP
  // ========================================================
  const downloadZipBtn = document.getElementById("btnDownloadPackZip");
  downloadZipBtn?.addEventListener("click", function () {
    const title = document.getElementById("packTitleText")?.textContent || "Pack";
    showToast(`📦 Đang chuẩn bị gói nén ZIP cho bộ sưu tập "${title}"...`);
  });

  // Đóng modal khi bấm Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (editPackModal?.classList.contains("active")) closeEditModal();
      if (addStickerModal?.classList.contains("active")) closeAddSticker();
      if (lightboxModal?.classList.contains("active")) closeLightbox();
    }
  });

  // ========================================================
  // 12. KHỞI TẠO BAN ĐẦU
  // ========================================================
  // Gắn sự kiện cho các thẻ sticker đã SSR sẵn
  bindStickerEvents();

  // Khởi tạo bộ lọc tags từ các sticker SSR
  const initialItems = packStickersGrid?.querySelectorAll(".sticker-sub-item");
  if (initialItems && initialItems.length > 0) {
    const ssrStickers = [];
    initialItems.forEach(item => {
      ssrStickers.push({
        id: item.getAttribute("data-id"),
        title: item.getAttribute("data-title"),
        tags: item.getAttribute("data-tags"),
      });
    });
    buildTagFilterButtons(ssrStickers);
  }
});
