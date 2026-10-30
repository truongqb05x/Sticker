/**
 * ========================================================
 * ADMIN DANH MỤC CHỦ ĐỀ (CATEGORY MANAGEMENT) - JAVASCRIPT
 * Tích hợp REST API CSDL thực, tìm kiếm, lọc, CRUD và quản lý trạng thái
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

// Chuyển đổi Tiếng Việt có dấu thành Slug URL chuẩn
function convertToSlug(text) {
  if (!text) return "";
  let slug = text.toLowerCase().trim();

  slug = slug.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  slug = slug.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  slug = slug.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  slug = slug.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  slug = slug.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  slug = slug.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  slug = slug.replace(/đ/g, "d");

  slug = slug.replace(/[^a-z0-9\s-]/g, "");
  slug = slug.replace(/[\s-]+/g, "-");
  slug = slug.replace(/^-+|-+$/g, "");

  return slug;
}

document.addEventListener("DOMContentLoaded", function () {
  // 1. Khởi tạo Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 2. Elements Tìm Kiếm & Lọc
  const searchInput = document.getElementById("categorySearchInput");
  const statusSelect = document.getElementById("categoryStatusFilter");
  const resetBtn = document.getElementById("resetCatFilterBtn");
  const tableBody = document.getElementById("categoryTableBody");

  const catVisibleCount = document.getElementById("catVisibleCount");
  const catTotalCount = document.getElementById("catTotalCount");
  const totalCatsBadge = document.getElementById("totalCatsBadge");
  const sidebarCatCounter = document.getElementById("sidebarCatCounter");

  const statTotalCats = document.getElementById("statTotalCats");
  const statStatusRatio = document.getElementById("statStatusRatio");
  const statTopCategory = document.getElementById("statTopCategory");
  const totalPacksFooter = document.getElementById("totalPacksFooter");

  let currentSearch = "";
  let currentStatus = "all";

  // 3. Modal Thêm / Chỉnh Sửa Danh Mục
  const addModal = document.getElementById("addCategoryModal");
  const openModalBtn = document.getElementById("openAddModalBtn");
  const closeModalBtn = document.getElementById("closeAddModalBtn");
  const cancelModalBtn = document.getElementById("cancelAddModalBtn");
  const addForm = document.getElementById("addCategoryForm");

  const modalHeadingIcon = document.getElementById("modalHeadingIcon");
  const modalHeadingText = document.getElementById("modalHeadingText");
  const btnSubmitCat = document.getElementById("btnSubmitCat");

  const catEditId = document.getElementById("catEditId");
  const catNameInput = document.getElementById("catNameInput");
  const catSlugInput = document.getElementById("catSlugInput");
  const catOrderInput = document.getElementById("catOrderInput");
  const catStatusSelect = document.getElementById("catStatusSelect");
  const catIconSelect = document.getElementById("catIconSelect");
  const catColorSelect = document.getElementById("catColorSelect");
  const catDescInput = document.getElementById("catDescInput");

  let isSlugManuallyEdited = false;

  // Tự động sinh Slug khi người dùng gõ Tên danh mục
  catNameInput?.addEventListener("input", function () {
    if (!isSlugManuallyEdited && catSlugInput) {
      catSlugInput.value = convertToSlug(this.value);
    }
  });

  // Khi người dùng chủ động sửa Slug
  catSlugInput?.addEventListener("input", function () {
    if (this.value.trim() === "") {
      isSlugManuallyEdited = false;
      if (catNameInput) {
        this.value = convertToSlug(catNameInput.value);
      }
    } else {
      isSlugManuallyEdited = true;
    }
  });

  catSlugInput?.addEventListener("blur", function () {
    if (this.value.trim() !== "") {
      this.value = convertToSlug(this.value);
    }
  });

  // Mở modal Thêm mới
  function openAddModal() {
    if (!addModal) return;
    addForm?.reset();
    if (catEditId) catEditId.value = "";
    isSlugManuallyEdited = false;

    if (modalHeadingText) modalHeadingText.textContent = "Thêm danh mục chủ đề mới";
    if (modalHeadingIcon) {
      modalHeadingIcon.setAttribute("data-lucide", "tag");
      modalHeadingIcon.style.color = "#C45832";
    }
    if (btnSubmitCat) btnSubmitCat.textContent = "Lưu danh mục";

    if (window.lucide) window.lucide.createIcons();

    addModal.classList.add("active");
    document.body.style.overflow = "hidden";
    setTimeout(() => catNameInput?.focus(), 100);
  }

  // Mở modal Chỉnh sửa theo ID (lấy dữ liệu từ API)
  async function openEditModal(catId) {
    if (!addModal || !catId) return;

    try {
      const response = await fetch(`/admin/api/categories/${catId}`);
      const data = await response.json();

      if (!data.success || !data.category) {
        showToast("❌ Không thể tải thông tin danh mục!");
        return;
      }

      const cat = data.category;

      if (catEditId) catEditId.value = cat.id;
      if (catNameInput) catNameInput.value = cat.name || "";
      if (catSlugInput) catSlugInput.value = cat.slug || "";
      if (catOrderInput) catOrderInput.value = cat.sort_order || 9;
      if (catStatusSelect) catStatusSelect.value = cat.status || "active";
      if (catIconSelect) catIconSelect.value = cat.icon_name || "tag";
      if (catColorSelect) catColorSelect.value = cat.badge_bg_class || "badge-bg-1";
      if (catDescInput) catDescInput.value = cat.description || "";

      isSlugManuallyEdited = true;

      if (modalHeadingText) modalHeadingText.textContent = `Chỉnh sửa: ${cat.name}`;
      if (modalHeadingIcon) {
        modalHeadingIcon.setAttribute("data-lucide", "edit-3");
        modalHeadingIcon.style.color = "#2E78D6";
      }
      if (btnSubmitCat) btnSubmitCat.textContent = "Cập nhật thay đổi";

      if (window.lucide) window.lucide.createIcons();

      addModal.classList.add("active");
      document.body.style.overflow = "hidden";
      setTimeout(() => catNameInput?.focus(), 100);
    } catch (err) {
      console.error("Lỗi khi mở modal chỉnh sửa danh mục:", err);
      showToast("❌ Lỗi kết nối khi tải chi tiết danh mục!");
    }
  }

  // Đóng modal
  function closeModal() {
    if (addModal) {
      addModal.classList.remove("active");
      document.body.style.overflow = "";
      addForm?.reset();
      if (catEditId) catEditId.value = "";
      isSlugManuallyEdited = false;
    }
  }

  openModalBtn?.addEventListener("click", openAddModal);
  closeModalBtn?.addEventListener("click", closeModal);
  cancelModalBtn?.addEventListener("click", closeModal);

  addModal?.addEventListener("click", function (e) {
    if (e.target === addModal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && addModal?.classList.contains("active")) {
      closeModal();
    }
  });

  // 4. Render Bảng dữ liệu Danh mục
  function renderTable(categories) {
    if (!tableBody) return;

    if (!categories || categories.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 48px 16px; color: #8C7B71;">
            <i data-lucide="inbox" style="width: 36px; height: 36px; display: block; margin: 0 auto 10px; opacity: 0.5;"></i>
            Không tìm thấy danh mục nào phù hợp với bộ lọc hiện tại.
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    let html = "";
    categories.forEach(cat => {
      const isActive = cat.status === "active";
      const statusBadgeHtml = isActive
        ? `<span class="status-badge status-badge-active"><i data-lucide="check-circle" style="width: 12px; height: 12px;"></i> Công khai</span>`
        : `<span class="status-badge status-badge-hidden"><i data-lucide="eye-off" style="width: 12px; height: 12px;"></i> Tạm ẩn</span>`;

      const toggleIcon = isActive ? "eye-off" : "eye";
      const toggleTitle = isActive ? "Tạm ẩn danh mục" : "Hiển thị công khai";

      html += `
        <tr data-id="${cat.id}" data-status="${cat.status}" data-slug="${escapeHtml(cat.slug)}">
          <td style="text-align: center;"><span class="order-num-badge">${cat.sort_order}</span></td>
          <td>
            <div class="category-name-cell">
              <div class="cat-icon-badge ${escapeHtml(cat.badge_bg_class)}">
                <i data-lucide="${escapeHtml(cat.icon_name)}" style="width: 18px; height: 18px;"></i>
              </div>
              <div>
                <span class="cat-title">${escapeHtml(cat.name)}</span>
                <div class="cat-desc">${escapeHtml(cat.description)}</div>
              </div>
            </div>
          </td>
          <td><span class="slug-tag-code">${escapeHtml(cat.slug)}</span></td>
          <td><strong>${cat.total_packs}</strong> bộ</td>
          <td><strong>${cat.total_stickers}</strong></td>
          <td><strong style="color: #C45832;">${escapeHtml(cat.total_downloads_fmt || String(cat.total_downloads))}</strong></td>
          <td>${statusBadgeHtml}</td>
          <td>
            <div class="table-btn-group" style="justify-content: flex-end;">
              <button type="button" class="tbl-action-btn btn-edit-cat" data-id="${cat.id}" title="Chỉnh sửa">
                <i data-lucide="edit-3" style="width: 15px; height: 15px;"></i>
              </button>
              <button type="button" class="tbl-action-btn btn-toggle-cat" data-id="${cat.id}" data-status="${cat.status}" title="${toggleTitle}">
                <i data-lucide="${toggleIcon}" style="width: 15px; height: 15px;"></i>
              </button>
              <button type="button" class="tbl-action-btn btn-delete btn-delete-cat" data-id="${cat.id}" data-name="${escapeHtml(cat.name)}" title="Xóa">
                <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
    bindRowEvents();
  }

  // 5. Gắn sự kiện Thao tác từng hàng (Sửa, Ẩn/Hiện, Xóa)
  function bindRowEvents() {
    // Chỉnh sửa danh mục
    document.querySelectorAll(".btn-edit-cat").forEach(btn => {
      btn.onclick = function (e) {
        e.preventDefault();
        const catId = this.getAttribute("data-id") || this.closest("tr")?.getAttribute("data-id");
        if (catId) openEditModal(catId);
      };
    });

    // Chuyển đổi trạng thái Ẩn / Hiện
    document.querySelectorAll(".btn-toggle-cat").forEach(btn => {
      btn.onclick = async function (e) {
        e.preventDefault();
        const catId = this.getAttribute("data-id");

        try {
          const response = await fetch(`/admin/api/categories/${catId}/toggle`, {
            method: "POST",
          });
          const result = await response.json();

          if (result.success) {
            showToast(`✅ ${result.message}`);
            fetchCategories();
          } else {
            showToast(`❌ ${result.message || "Không thể chuyển trạng thái!"}`);
          }
        } catch (err) {
          console.error("Lỗi khi chuyển trạng thái danh mục:", err);
          showToast("❌ Lỗi kết nối máy chủ!");
        }
      };
    });

    // Xóa danh mục
    document.querySelectorAll(".btn-delete-cat").forEach(btn => {
      btn.onclick = async function (e) {
        e.preventDefault();
        const catId = this.getAttribute("data-id");
        const name = this.getAttribute("data-name") || "danh mục";

        if (!confirm(`Bạn có chắc muốn xóa vĩnh viễn danh mục "${name}"? Các bộ sưu tập thuộc danh mục này sẽ tự động chuyển sang danh mục dự phòng an toàn.`)) {
          return;
        }

        try {
          const response = await fetch(`/admin/api/categories/${catId}`, {
            method: "DELETE",
          });
          const result = await response.json();

          if (result.success) {
            showToast(`🗑️ ${result.message}`);
            fetchCategories();
          } else {
            showToast(`❌ ${result.message || "Không thể xóa danh mục!"}`);
          }
        } catch (err) {
          console.error("Lỗi khi xóa danh mục:", err);
          showToast("❌ Lỗi kết nối khi xóa danh mục!");
        }
      };
    });
  }

  // 6. Gọi REST API lấy danh sách Danh mục
  async function fetchCategories() {
    try {
      const params = new URLSearchParams({
        search: currentSearch,
        status: currentStatus,
      });

      const response = await fetch(`/admin/api/categories?${params.toString()}`);
      const data = await response.json();

      if (!data.success) {
        showToast("❌ Không thể tải danh sách danh mục!");
        return;
      }

      renderTable(data.categories);

      // Cập nhật số đếm
      if (catVisibleCount) catVisibleCount.textContent = data.categories.length;

      if (data.metrics) {
        const m = data.metrics;
        if (catTotalCount) catTotalCount.textContent = m.total_categories;
        if (totalCatsBadge) totalCatsBadge.textContent = `${m.total_categories} danh mục`;
        if (sidebarCatCounter) sidebarCatCounter.textContent = m.total_categories;
        if (statTotalCats) statTotalCats.textContent = `${m.total_categories} Danh mục`;
        if (statStatusRatio) statStatusRatio.textContent = m.status_ratio;
        if (statTopCategory) statTopCategory.textContent = m.top_category;
        if (totalPacksFooter) totalPacksFooter.textContent = m.total_packs;
      }
    } catch (err) {
      console.error("Lỗi khi tải danh mục từ API:", err);
      showToast("❌ Lỗi kết nối khi tải danh sách danh mục!");
    }
  }

  // 7. Gắn sự kiện Tìm kiếm & Lọc
  let searchDebounceTimer = null;
  searchInput?.addEventListener("input", function () {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      currentSearch = this.value.trim();
      fetchCategories();
    }, 280);
  });

  statusSelect?.addEventListener("change", function () {
    currentStatus = this.value;
    fetchCategories();
  });

  resetBtn?.addEventListener("click", function () {
    if (searchInput) searchInput.value = "";
    if (statusSelect) statusSelect.value = "all";
    currentSearch = "";
    currentStatus = "all";
    fetchCategories();
    showToast("Đã đặt lại bộ lọc danh mục.");
  });

  // 8. Gửi Form Thêm mới / Cập nhật
  addForm?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = catNameInput?.value.trim();
    let slug = catSlugInput?.value.trim() || convertToSlug(name);
    const sort_order = parseInt(catOrderInput?.value || "9", 10);
    const status = catStatusSelect?.value || "active";
    const icon_name = catIconSelect?.value || "tag";
    const badge_bg_class = catColorSelect?.value || "badge-bg-1";
    const description = catDescInput?.value.trim() || "";

    if (!name) {
      showToast("⚠️ Vui lòng nhập tên danh mục!");
      return;
    }

    const payload = {
      name,
      slug,
      sort_order,
      status,
      icon_name,
      badge_bg_class,
      description,
    };

    const editId = catEditId?.value;
    const isEditMode = Boolean(editId);

    if (btnSubmitCat) {
      btnSubmitCat.disabled = true;
      btnSubmitCat.textContent = "Đang lưu...";
    }

    try {
      const url = isEditMode ? `/admin/api/categories/${editId}` : "/admin/api/categories";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        closeModal();
        showToast(`✅ ${result.message}`);
        fetchCategories();
      } else {
        showToast(`❌ ${result.message || "Thao tác thất bại!"}`);
      }
    } catch (err) {
      console.error("Lỗi khi lưu danh mục:", err);
      showToast("❌ Lỗi kết nối khi lưu danh mục!");
    } finally {
      if (btnSubmitCat) {
        btnSubmitCat.disabled = false;
        btnSubmitCat.textContent = isEditMode ? "Cập nhật thay đổi" : "Lưu danh mục";
      }
    }
  });

  // Gắn sự kiện cho các hàng SSR ban đầu
  bindRowEvents();
});
