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

// Hàm chuyển đổi Tiếng Việt có dấu thành Slug chuẩn URL
function convertToSlug(text) {
  if (!text) return "";
  let slug = text.toLowerCase().trim();

  // 1. Chuyển đổi các ký tự có dấu tiếng Việt sang không dấu
  slug = slug.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  slug = slug.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  slug = slug.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  slug = slug.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  slug = slug.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  slug = slug.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  slug = slug.replace(/đ/g, "d");

  // 2. Xóa các ký tự đặc biệt, chỉ giữ chữ thường, số và khoảng trắng/dấu gạch ngang
  slug = slug.replace(/[^a-z0-9\s-]/g, "");

  // 3. Thay khoảng trắng và nhiều dấu gạch ngang liên tiếp thành một dấu gạch ngang
  slug = slug.replace(/[\s-]+/g, "-");

  // 4. Xóa dấu gạch ngang ở đầu và cuối chuỗi
  slug = slug.replace(/^-+|-+$/g, "");

  return slug;
}

document.addEventListener("DOMContentLoaded", function () {
  // 1. Khởi tạo Lucide Icons ban đầu
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 2. Các phần tử DOM bộ lọc và bảng
  const searchInput = document.getElementById("collectionSearchInput");
  const categorySelect = document.getElementById("collectionCategoryFilter");
  const statusTabs = document.querySelectorAll(".status-tab-btn");
  const tableBody = document.getElementById("collectionsTableBody");

  const pageVisibleCount = document.getElementById("pageVisibleCount");
  const pageTotalCount = document.getElementById("pageTotalCount");
  const totalPacksBadge = document.getElementById("totalPacksBadge");
  const sidebarPackCounter = document.getElementById("sidebarPackCounter");

  const countAll = document.getElementById("countAll");
  const countActive = document.getElementById("countActive");
  const countPending = document.getElementById("countPending");
  const countHidden = document.getElementById("countHidden");

  // Phân trang
  const btnPrevPage = document.getElementById("btnPrevPage");
  const btnNextPage = document.getElementById("btnNextPage");
  const btnPageNum = document.getElementById("btnPageNum");

  // Trạng thái lọc & phân trang
  let currentStatus = "all";
  let currentCategory = "all";
  let currentSearch = "";
  let currentPage = 1;
  let totalPages = 1;

  // 3. Phần tử Modal Thêm / Chỉnh Sửa Bộ Sưu Tập
  const addModal = document.getElementById("addCollectionModal");
  const openAddModalBtn = document.getElementById("openAddModalBtn");
  const closeAddModalBtn = document.getElementById("closeAddModalBtn");
  const cancelAddModalBtn = document.getElementById("cancelAddModalBtn");
  const addForm = document.getElementById("addCollectionForm");

  const modalHeadingIcon = document.getElementById("modalHeadingIcon");
  const modalHeadingText = document.getElementById("modalHeadingText");
  const submitCollectionModalBtn = document.getElementById("submitCollectionModalBtn");

  const packEditId = document.getElementById("packEditId");
  const packNameInput = document.getElementById("packNameInput");
  const packSlugInput = document.getElementById("packSlugInput");
  const packAuthorInput = document.getElementById("packAuthorInput");
  const packCategorySelect = document.getElementById("packCategorySelect");
  const packStatusSelect = document.getElementById("packStatusSelect");
  const packTagInput = document.getElementById("packTagInput");
  const packCoverFile = document.getElementById("packCoverFile");
  const packCoverInput = document.getElementById("packCoverInput");
  const packCoverPreview = document.getElementById("packCoverPreview");
  const packCoverName = document.getElementById("packCoverName");
  const packCoverPreviewContainer = document.getElementById("packCoverPreviewContainer");

  const packDescInput = document.getElementById("packDescInput");

  // Xem truoc anh bia khi chon tep
  packCoverFile?.addEventListener("change", function (e) {
    const file = e.target.files?.[0];
    if (file) {
      if (packCoverPreview) packCoverPreview.src = URL.createObjectURL(file);
      if (packCoverName) packCoverName.textContent = file.name;
      if (packCoverPreviewContainer) packCoverPreviewContainer.style.display = "flex";
    }
  });

  let isSlugManuallyEdited = false;

  // Tự động sinh Slug khi người dùng gõ Tên bộ sưu tập
  packNameInput?.addEventListener("input", function () {
    if (!isSlugManuallyEdited && packSlugInput) {
      packSlugInput.value = convertToSlug(this.value);
    }
  });

  // Khi người dùng chủ động sửa Slug
  packSlugInput?.addEventListener("input", function () {
    if (this.value.trim() === "") {
      isSlugManuallyEdited = false;
      if (packNameInput) {
        this.value = convertToSlug(packNameInput.value);
      }
    } else {
      isSlugManuallyEdited = true;
    }
  });

  packSlugInput?.addEventListener("blur", function () {
    if (this.value.trim() !== "") {
      this.value = convertToSlug(this.value);
    }
  });

  // Mở modal Thêm mới
  function openAddModal() {
    if (!addModal) return;
    addForm?.reset();
    if (packEditId) packEditId.value = "";
    isSlugManuallyEdited = false;

    if (packCoverFile) packCoverFile.value = "";
    if (packCoverInput) packCoverInput.value = "";
    if (packCoverPreview) packCoverPreview.src = "";
    if (packCoverName) packCoverName.textContent = "";
    if (packCoverPreviewContainer) packCoverPreviewContainer.style.display = "none";

    if (modalHeadingText) modalHeadingText.textContent = "Thêm bộ sưu tập mới";
    if (modalHeadingIcon) {
      modalHeadingIcon.setAttribute("data-lucide", "folder-plus");
      modalHeadingIcon.style.color = "#C45832";
    }
    if (submitCollectionModalBtn) submitCollectionModalBtn.textContent = "Xuất bản";


    if (window.lucide) window.lucide.createIcons();

    addModal.classList.add("active");
    document.body.style.overflow = "hidden";
    setTimeout(() => packNameInput?.focus(), 100);
  }

  // Mở modal Chỉnh sửa theo ID (lấy dữ liệu thực từ API)
  async function openEditModal(packId) {
    if (!addModal || !packId) return;

    try {
      const response = await fetch(`/admin/api/packs/${packId}`);
      const data = await response.json();

      if (!data.success || !data.pack) {
        showToast("❌ Không thể tải thông tin bộ sưu tập!");
        return;
      }

      const pack = data.pack;

      if (packEditId) packEditId.value = pack.id;
      if (packNameInput) packNameInput.value = pack.title || "";
      if (packSlugInput) packSlugInput.value = pack.slug || "";
      if (packAuthorInput) packAuthorInput.value = pack.author_name || "";
      if (packCategorySelect) packCategorySelect.value = pack.category_id || "";
      if (packStatusSelect) packStatusSelect.value = pack.status || "active";
      if (packTagInput) packTagInput.value = pack.tags_str || (pack.tags ? pack.tags.join(", ") : "");
      if (packCoverFile) packCoverFile.value = "";
      if (packCoverInput) packCoverInput.value = pack.cover_image || "";
      if (packCoverPreview && pack.cover_image) packCoverPreview.src = pack.cover_image;
      if (packCoverName) packCoverName.textContent = pack.cover_image || "";
      if (packCoverPreviewContainer) packCoverPreviewContainer.style.display = pack.cover_image ? "flex" : "none";

      if (packDescInput) packDescInput.value = pack.description || "";

      isSlugManuallyEdited = true;

      if (modalHeadingText) modalHeadingText.textContent = `Chỉnh sửa: ${pack.title}`;
      if (modalHeadingIcon) {
        modalHeadingIcon.setAttribute("data-lucide", "edit-3");
        modalHeadingIcon.style.color = "#2E78D6";
      }
      if (submitCollectionModalBtn) submitCollectionModalBtn.textContent = "Lưu thay đổi";

      if (window.lucide) window.lucide.createIcons();

      addModal.classList.add("active");
      document.body.style.overflow = "hidden";
      setTimeout(() => packNameInput?.focus(), 100);
    } catch (err) {
      console.error("Lỗi khi mở modal chỉnh sửa:", err);
      showToast("❌ Lỗi kết nối tới máy chủ khi tải dữ liệu!");
    }
  }

  // Đóng Modal
  function closeModal() {
    if (addModal) {
      addModal.classList.remove("active");
      document.body.style.overflow = "";
      addForm?.reset();
      if (packEditId) packEditId.value = "";
      isSlugManuallyEdited = false;
    }
  }

  openAddModalBtn?.addEventListener("click", openAddModal);
  closeAddModalBtn?.addEventListener("click", closeModal);
  cancelAddModalBtn?.addEventListener("click", closeModal);

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

  // 4. Render Bảng dữ liệu từ danh sách Packs
  function renderTable(packs) {
    if (!tableBody) return;

    if (!packs || packs.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 48px 16px; color: #8C7B71;">
            <i data-lucide="inbox" style="width: 34px; height: 34px; display: block; margin: 0 auto 10px; opacity: 0.5;"></i>
            Không tìm thấy bộ sưu tập nào phù hợp với bộ lọc hiện tại.
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    let html = "";
    packs.forEach((p, index) => {
      let statusBadgeHtml = "";
      let quickActionHtml = "";

      if (p.status === "active") {
        statusBadgeHtml = `
          <span class="status-badge status-badge-active">
            <i data-lucide="check-circle" style="width: 12px; height: 12px;"></i>
            Công khai
          </span>
        `;
      } else if (p.status === "pending") {
        statusBadgeHtml = `
          <span class="status-badge status-badge-pending">
            <i data-lucide="clock" style="width: 12px; height: 12px;"></i>
            Chờ duyệt
          </span>
        `;
        quickActionHtml = `
          <button type="button" class="tbl-action-btn btn-approve btn-approve-row" data-id="${p.id}" data-name="${escapeHtml(p.title)}" title="Phê duyệt xuất bản">
            <i data-lucide="check" style="width: 15px; height: 15px; color: #2E7D32;"></i>
          </button>
        `;
      } else {
        statusBadgeHtml = `
          <span class="status-badge status-badge-hidden">
            <i data-lucide="eye-off" style="width: 12px; height: 12px;"></i>
            Tạm ẩn
          </span>
        `;
        quickActionHtml = `
          <button type="button" class="tbl-action-btn btn-approve btn-approve-row" data-id="${p.id}" data-name="${escapeHtml(p.title)}" title="Công khai lại">
            <i data-lucide="eye" style="width: 15px; height: 15px; color: #2E7D32;"></i>
          </button>
        `;
      }

      html += `
        <tr data-id="${p.id}" data-category="${p.category_id}" data-status="${p.status}" data-slug="${escapeHtml(p.slug)}">
          <td style="text-align: center; color: #9E8E84; font-weight: 700;">${(currentPage - 1) * 20 + index + 1}</td>
          <td>
            <div class="table-pack-cell">
              <img src="${escapeHtml(p.cover_image || '../../assets/logo_cat.svg')}" alt="${escapeHtml(p.title)}" class="table-pack-thumb" onerror="this.src='../../assets/logo_cat.svg'">
              <div>
                <a href="/admin/chitietsticker?id=${p.id}" class="table-pack-title">${escapeHtml(p.title)}</a>
                <div class="table-pack-author">Tác giả: <strong>${escapeHtml(p.author_name)}</strong></div>
              </div>
            </div>
          </td>
          <td><span class="category-tag-badge">${escapeHtml(p.category_name)}</span></td>
          <td><strong>${p.total_stickers}</strong> sticker</td>
          <td><strong>${escapeHtml(p.total_downloads_fmt || String(p.total_downloads))}</strong></td>
          <td>${statusBadgeHtml}</td>
          <td style="color: #8C7B71; font-size: 12.5px;">${escapeHtml(p.updated_at || p.created_at)}</td>
          <td>
            <div class="table-btn-group" style="justify-content: flex-end;">
              ${quickActionHtml}
              <a href="/admin/chitietsticker?id=${p.id}" class="tbl-action-btn" title="Xem chi tiết">
                <i data-lucide="eye" style="width: 15px; height: 15px;"></i>
              </a>
              <button type="button" class="tbl-action-btn btn-edit-row" data-id="${p.id}" title="Chỉnh sửa">
                <i data-lucide="edit-3" style="width: 15px; height: 15px;"></i>
              </button>
              <button type="button" class="tbl-action-btn btn-delete btn-delete-row" data-id="${p.id}" data-name="${escapeHtml(p.title)}" title="Xóa">
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

  // 5. Gắn sự kiện Thao tác trên từng hàng của Bảng (Approve, Edit, Delete)
  function bindRowEvents() {
    // Duyệt / Công khai bộ sưu tập
    document.querySelectorAll(".btn-approve-row").forEach(btn => {
      btn.onclick = async function (e) {
        e.preventDefault();
        const packId = this.getAttribute("data-id");
        const packName = this.getAttribute("data-name") || "bộ sưu tập";

        try {
          const response = await fetch(`/admin/api/packs/${packId}/status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "active" }),
          });
          const result = await response.json();
          if (result.success) {
            showToast(`✅ Đã phê duyệt phát hành: "${packName}"!`);
            fetchPacks();
          } else {
            showToast(`❌ ${result.message || "Không thể phê duyệt bộ sưu tập!"}`);
          }
        } catch (err) {
          console.error("Lỗi khi duyệt bộ sưu tập:", err);
          showToast("❌ Lỗi kết nối tới máy chủ khi phê duyệt!");
        }
      };
    });

    // Mở modal Chỉnh sửa
    document.querySelectorAll(".btn-edit-row").forEach(btn => {
      btn.onclick = function (e) {
        e.preventDefault();
        const packId = this.getAttribute("data-id") || this.closest("tr")?.getAttribute("data-id");
        if (packId) {
          openEditModal(packId);
        }
      };
    });

    // Xóa bộ sưu tập khỏi CSDL
    document.querySelectorAll(".btn-delete-row").forEach(btn => {
      btn.onclick = async function (e) {
        e.preventDefault();
        const packId = this.getAttribute("data-id") || this.closest("tr")?.getAttribute("data-id");
        const packName = this.getAttribute("data-name") ||
          this.closest("tr")?.querySelector(".table-pack-title")?.textContent.trim() ||
          "bộ sưu tập";

        if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn bộ sưu tập "${packName}" khỏi hệ thống CSDL?`)) {
          return;
        }

        try {
          const response = await fetch(`/admin/api/packs/${packId}`, {
            method: "DELETE",
          });
          const result = await response.json();
          if (result.success) {
            showToast(`🗑️ Đã xóa bộ sưu tập "${packName}" thành công!`);
            fetchPacks();
          } else {
            showToast(`❌ ${result.message || "Không thể xóa bộ sưu tập!"}`);
          }
        } catch (err) {
          console.error("Lỗi khi xóa bộ sưu tập:", err);
          showToast("❌ Lỗi kết nối tới máy chủ khi xóa!");
        }
      };
    });
  }

  // 6. Tải dữ liệu bộ sưu tập qua REST API
  async function fetchPacks() {
    try {
      const params = new URLSearchParams({
        status: currentStatus,
        category: currentCategory,
        search: currentSearch,
        page: currentPage,
        limit: 20,
      });

      const response = await fetch(`/admin/api/packs?${params.toString()}`);
      const data = await response.json();

      if (!data.success) {
        showToast("❌ Không thể tải danh sách bộ sưu tập!");
        return;
      }

      // Render danh sách bộ sưu tập
      renderTable(data.packs);

      // Cập nhật số lượng
      if (pageVisibleCount) pageVisibleCount.textContent = data.packs.length;
      if (pageTotalCount) pageTotalCount.textContent = data.total;

      if (data.counts) {
        if (countAll) countAll.textContent = data.counts.all;
        if (countActive) countActive.textContent = data.counts.active;
        if (countPending) countPending.textContent = data.counts.pending;
        if (countHidden) countHidden.textContent = data.counts.hidden;
        if (totalPacksBadge) totalPacksBadge.textContent = `${data.counts.all} bộ sưu tập`;
        if (sidebarPackCounter) sidebarPackCounter.textContent = data.counts.all;
      }

      // Cập nhật phân trang
      totalPages = data.pages || 1;
      if (btnPageNum) btnPageNum.textContent = currentPage;
      if (btnPrevPage) btnPrevPage.disabled = currentPage <= 1;
      if (btnNextPage) btnNextPage.disabled = currentPage >= totalPages;

    } catch (err) {
      console.error("Lỗi khi tải bộ sưu tập từ API:", err);
      showToast("❌ Lỗi kết nối khi tải dữ liệu bộ sưu tập!");
    }
  }

  // 7. Gắn sự kiện Bộ lọc & Tìm kiếm
  let searchDebounceTimer = null;
  searchInput?.addEventListener("input", function () {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      currentSearch = this.value.trim();
      currentPage = 1;
      fetchPacks();
    }, 280);
  });

  categorySelect?.addEventListener("change", function () {
    currentCategory = this.value;
    currentPage = 1;
    fetchPacks();
  });

  statusTabs.forEach(tab => {
    tab.addEventListener("click", function () {
      statusTabs.forEach(t => t.classList.remove("active"));
      this.classList.add("active");
      currentStatus = this.getAttribute("data-status") || "all";
      currentPage = 1;
      fetchPacks();
    });
  });

  // Điều khiển phân trang
  btnPrevPage?.addEventListener("click", function () {
    if (currentPage > 1) {
      currentPage--;
      fetchPacks();
    }
  });

  btnNextPage?.addEventListener("click", function () {
    if (currentPage < totalPages) {
      currentPage++;
      fetchPacks();
    }
  });

  // 8. Xử lý Gửi Form (Thêm mới hoặc Cập nhật)
  addForm?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const title = packNameInput?.value.trim();
    let slug = packSlugInput?.value.trim() || convertToSlug(title);
    const author_name = packAuthorInput?.value.trim() || "StickerHub Team";
    const category_id = packCategorySelect?.value || "1";
    const status = packStatusSelect?.value || "active";
    const tags = packTagInput?.value.trim() || "";
    const cover_image = packCoverInput?.value.trim() || "../../assets/pack_cats.jpg";
    const description = packDescInput?.value.trim() || "";

    if (!title) {
      showToast("⚠️ Vui lòng nhập tên bộ sưu tập!");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("slug", slug);
    formData.append("author_name", author_name);
    formData.append("category_id", category_id);
    formData.append("status", status);
    formData.append("tags", tags);
    formData.append("description", description);

    if (packCoverFile?.files?.[0]) {
      formData.append("cover_file", packCoverFile.files[0]);
    } else {
      formData.append("cover_image", packCoverInput?.value.trim() || "");
    }

    const editId = packEditId?.value;
    const isEditMode = Boolean(editId);

    // Disable nút bấm khi đang lưu
    if (submitCollectionModalBtn) {
      submitCollectionModalBtn.disabled = true;
      submitCollectionModalBtn.textContent = "Đang lưu...";
    }

    try {
      const url = isEditMode ? `/admin/api/packs/${editId}` : "/admin/api/packs";
      const method = "POST";

      const response = await fetch(url, {
        method: method,
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        closeModal();
        showToast(`✅ ${result.message}`);
        fetchPacks();
      } else {
        showToast(`❌ ${result.message || "Thao tác thất bại!"}`);
      }
    } catch (err) {
      console.error("Lỗi khi lưu bộ sưu tập:", err);
      showToast("❌ Lỗi kết nối tới máy chủ khi lưu bộ sưu tập!");
    } finally {
      if (submitCollectionModalBtn) {
        submitCollectionModalBtn.disabled = false;
        submitCollectionModalBtn.textContent = isEditMode ? "Lưu thay đổi" : "Xuất bản";
      }
    }
  });

  const catModal = document.getElementById("addCategoryModal");
  const openCatModalBtn = document.getElementById("openAddCategoryModalBtn");
  const closeCatModalBtn = document.getElementById("closeAddCategoryModalBtn");
  const cancelCatModalBtn = document.getElementById("cancelAddCategoryModalBtn");
  const quickAddCatInPackModal = document.getElementById("quickAddCatInPackModal");
  const addCatForm = document.getElementById("addCategoryForm");
  const btnSubmitCat = document.getElementById("btnSubmitCategory");

  const catNameInput = document.getElementById("catNameInput");
  const catSlugInput = document.getElementById("catSlugInput");
  const catOrderInput = document.getElementById("catOrderInput");
  const catStatusSelect = document.getElementById("catStatusSelect");
  const catIconSelect = document.getElementById("catIconSelect");
  const catColorSelect = document.getElementById("catColorSelect");
  const catDescInput = document.getElementById("catDescInput");
  const sidebarCatCounter = document.getElementById("sidebarCatCounter");

  let isCatSlugManuallyEdited = false;

  // Tự động chuyển tên danh mục thành Slug URL chuẩn
  catNameInput?.addEventListener("input", function () {
    if (!isCatSlugManuallyEdited && catSlugInput) {
      catSlugInput.value = convertToSlug(this.value);
    }
  });

  catSlugInput?.addEventListener("input", function () {
    if (this.value.trim() === "") {
      isCatSlugManuallyEdited = false;
      if (catNameInput) {
        this.value = convertToSlug(catNameInput.value);
      }
    } else {
      isCatSlugManuallyEdited = true;
    }
  });

  catSlugInput?.addEventListener("blur", function () {
    if (this.value.trim() !== "") {
      this.value = convertToSlug(this.value);
    }
  });

  // Mở modal thêm danh mục mới
  function openCategoryModal() {
    if (!catModal) return;
    addCatForm?.reset();
    isCatSlugManuallyEdited = false;
    if (catOrderInput) catOrderInput.value = "9";
    if (catStatusSelect) catStatusSelect.value = "active";
    if (catIconSelect) catIconSelect.value = "tag";
    if (catColorSelect) catColorSelect.value = "badge-bg-1";

    if (window.lucide) window.lucide.createIcons();
    catModal.classList.add("active");
    document.body.style.overflow = "hidden";
    setTimeout(() => catNameInput?.focus(), 120);
  }

  // Đóng modal thêm danh mục
  function closeCategoryModal() {
    if (catModal) {
      catModal.classList.remove("active");
      // Nếu modal thêm bộ sưu tập đang mở thì giữ lại overflow: hidden
      if (!addModal?.classList.contains("active")) {
        document.body.style.overflow = "";
      }
      addCatForm?.reset();
      isCatSlugManuallyEdited = false;
    }
  }

  openCatModalBtn?.addEventListener("click", openCategoryModal);
  quickAddCatInPackModal?.addEventListener("click", openCategoryModal);
  closeCatModalBtn?.addEventListener("click", closeCategoryModal);
  cancelCatModalBtn?.addEventListener("click", closeCategoryModal);

  catModal?.addEventListener("click", function (e) {
    if (e.target === catModal) {
      closeCategoryModal();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && catModal?.classList.contains("active")) {
      closeCategoryModal();
    }
  });

  // Xử lý gửi Form thêm danh mục thực tế tới REST API
  addCatForm?.addEventListener("submit", async function (e) {
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

    if (btnSubmitCat) {
      btnSubmitCat.disabled = true;
      btnSubmitCat.textContent = "Đang lưu...";
    }

    try {
      const response = await fetch("/admin/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success && result.category) {
        closeCategoryModal();
        showToast(`✅ ${result.message}`);

        const newCat = result.category;

        // 1. Thêm danh mục mới vào Dropdown Lọc ngoài thanh công cụ
        if (categorySelect) {
          const optFilter = document.createElement("option");
          optFilter.value = newCat.id;
          optFilter.textContent = newCat.name;
          categorySelect.appendChild(optFilter);
        }

        // 2. Thêm danh mục mới vào Dropdown Danh mục trong Modal Bộ Sưu Tập và tự chọn nó
        if (packCategorySelect) {
          const optModal = document.createElement("option");
          optModal.value = newCat.id;
          optModal.textContent = newCat.name;
          packCategorySelect.appendChild(optModal);
          packCategorySelect.value = newCat.id;
        }

        // 3. Tăng bộ đếm danh mục ở Sidebar nếu có
        if (sidebarCatCounter) {
          const currentCount = parseInt(sidebarCatCounter.textContent.trim(), 10) || 0;
          sidebarCatCounter.textContent = currentCount + 1;
        }
      } else {
        showToast(`❌ ${result.message || "Không thể lưu danh mục!"}`);
      }
    } catch (err) {
      console.error("Lỗi khi thêm danh mục:", err);
      showToast("❌ Lỗi kết nối máy chủ khi lưu danh mục!");
    } finally {
      if (btnSubmitCat) {
        btnSubmitCat.disabled = false;
        btnSubmitCat.textContent = "Lưu danh mục";
      }
    }
  });

  // ========================================================
  // 8. LOGIC MODAL CẤU HÌNH HERO STICKER (TRANG CHỦ)
  // ========================================================
  const heroModal = document.getElementById("heroConfigModal");
  const openHeroConfigBtn = document.getElementById("openHeroConfigBtn");
  const closeHeroModalBtn = document.getElementById("closeHeroModalBtn");
  const cancelHeroModalBtn = document.getElementById("cancelHeroModalBtn");
  const saveHeroConfigBtn = document.getElementById("saveHeroConfigBtn");

  const heroSlotsGrid = document.getElementById("heroSlotsGrid");
  const heroSlotsCounterBadge = document.getElementById("heroSlotsCounterBadge");
  const heroPackSearchInput = document.getElementById("heroPackSearchInput");
  const heroPacksPickerList = document.getElementById("heroPacksPickerList");

  let heroSlots = [null, null, null, null];
  let heroAvailablePacks = [];
  let heroSearchTerm = "";

  function openHeroModal() {
    if (!heroModal) return;
    heroModal.classList.add("active");
    document.body.style.overflow = "hidden";
    if (heroPackSearchInput) heroPackSearchInput.value = "";
    heroSearchTerm = "";

    // Hiển thị khung chờ
    if (heroSlotsGrid) {
      heroSlotsGrid.innerHTML = `
        <div style="grid-column: span 4; text-align: center; padding: 24px; color: #8C7B71;">
          <i data-lucide="loader" style="width: 24px; height: 24px; animation: spin 1s linear infinite; display: inline-block;"></i>
          <p style="margin-top: 8px; font-size: 13px;">Đang tải danh sách Hero Sticker...</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    }

    loadHeroData();
  }

  function closeHeroModal() {
    if (!heroModal) return;
    heroModal.classList.remove("active");
    if (!addModal?.classList.contains("active") && !catModal?.classList.contains("active")) {
      document.body.style.overflow = "";
    }
  }

  async function loadHeroData() {
    try {
      const response = await fetch("/admin/api/hero-packs");
      const data = await response.json();

      if (!data.success) {
        showToast("❌ Không thể nạp dữ liệu Hero Sticker!");
        return;
      }

      heroAvailablePacks = data.available_packs || [];

      // Reset và nạp 4 slots
      heroSlots = [null, null, null, null];
      const selected = data.selected_hero_packs || [];
      for (let i = 0; i < 4; i++) {
        heroSlots[i] = selected[i] || null;
      }

      renderHeroSlots();
      renderHeroPickerList();
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu Hero:", err);
      showToast("❌ Lỗi kết nối khi tải cấu hình Hero!");
    }
  }

  function renderHeroSlots() {
    if (!heroSlotsGrid) return;

    const selectedCount = heroSlots.filter(Boolean).length;
    if (heroSlotsCounterBadge) {
      heroSlotsCounterBadge.textContent = `Đã chọn: ${selectedCount}/4`;
      if (selectedCount === 4) {
        heroSlotsCounterBadge.style.color = "#2E7D32";
        heroSlotsCounterBadge.style.backgroundColor = "#E8F5E9";
        heroSlotsCounterBadge.style.borderColor = "#C8E6C9";
      } else {
        heroSlotsCounterBadge.style.color = "#C45832";
        heroSlotsCounterBadge.style.backgroundColor = "#FFF2EC";
        heroSlotsCounterBadge.style.borderColor = "#F0C4B4";
      }
    }

    let slotsHtml = "";
    for (let i = 0; i < 4; i++) {
      const pack = heroSlots[i];
      if (pack) {
        const coverImg = pack.cover_image || "/assets/logo_cat.svg";
        slotsHtml += `
          <div class="hero-slot-card">
            <span class="hero-slot-order-tag">
              <i data-lucide="sparkles" style="width: 11px; height: 11px;"></i>
              #${i + 1} Slide ${i + 1}
            </span>
            <button type="button" class="hero-slot-remove-btn btn-remove-slot" data-slot="${i}" title="Gỡ bộ này khỏi vị trí #${i + 1}">
              <i data-lucide="x" style="width: 14px; height: 14px;"></i>
            </button>
            <img src="${escapeHtml(coverImg)}" alt="${escapeHtml(pack.title)}" class="hero-slot-thumb" onerror="this.src='/assets/logo_cat.svg'">
            <div class="hero-slot-name" title="${escapeHtml(pack.title)}">${escapeHtml(pack.title)}</div>
            <div class="hero-slot-meta">
              <span>${escapeHtml(pack.category_name || "Khác")}</span>
              <span>${pack.total_stickers || 0} stks</span>
            </div>
          </div>
        `;
      } else {
        slotsHtml += `
          <div class="hero-slot-card hero-slot-empty">
            <span class="hero-slot-order-tag" style="background-color: #EFE8DF; color: #8C7B71;">
              Vị trí #${i + 1}
            </span>
            <i data-lucide="plus-circle" class="hero-slot-empty-icon"></i>
            <span class="hero-slot-empty-title">Còn trống</span>
            <span class="hero-slot-empty-desc">Chọn từ danh sách bên dưới</span>
          </div>
        `;
      }
    }

    heroSlotsGrid.innerHTML = slotsHtml;
    if (window.lucide) window.lucide.createIcons();

    // Gắn sự kiện gỡ slot
    heroSlotsGrid.querySelectorAll(".btn-remove-slot").forEach((btn) => {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const slotIdx = parseInt(this.getAttribute("data-slot"), 10);
        if (!isNaN(slotIdx) && slotIdx >= 0 && slotIdx < 4) {
          heroSlots[slotIdx] = null;
          renderHeroSlots();
          renderHeroPickerList();
        }
      });
    });
  }

  function renderHeroPickerList() {
    if (!heroPacksPickerList) return;

    let filtered = heroAvailablePacks;
    if (heroSearchTerm) {
      filtered = heroAvailablePacks.filter((p) => {
        const title = (p.title || "").toLowerCase();
        const slug = (p.slug || "").toLowerCase();
        const cat = (p.category_name || "").toLowerCase();
        const author = (p.author || "").toLowerCase();
        return (
          title.includes(heroSearchTerm) ||
          slug.includes(heroSearchTerm) ||
          cat.includes(heroSearchTerm) ||
          author.includes(heroSearchTerm)
        );
      });
    }

    if (!filtered || filtered.length === 0) {
      heroPacksPickerList.innerHTML = `
        <div style="text-align: center; padding: 32px 16px; color: #8C7B71;">
          <i data-lucide="search-x" style="width: 28px; height: 28px; display: block; margin: 0 auto 8px; opacity: 0.6;"></i>
          Không tìm thấy bộ sưu tập nào phù hợp.
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    let listHtml = "";
    filtered.forEach((p) => {
      const inSlotIdx = heroSlots.findIndex((s) => s && s.id === p.id);
      const isSelected = inSlotIdx !== -1;
      const coverImg = p.cover_image || "/assets/logo_cat.svg";

      listHtml += `
        <div class="hero-pack-row ${isSelected ? "is-selected" : ""}" data-id="${p.id}">
          <div class="hero-pack-row-left">
            <img src="${escapeHtml(coverImg)}" alt="${escapeHtml(p.title)}" class="hero-pack-row-thumb" onerror="this.src='/assets/logo_cat.svg'">
            <div class="hero-pack-row-details">
              <span class="hero-pack-row-title">${escapeHtml(p.title)}</span>
              <div class="hero-pack-row-meta">
                <span class="hero-pack-row-badge">${escapeHtml(p.category_name || "Chưa phân loại")}</span>
                <span>• ${p.total_stickers || 0} sticker</span>
                <span>• ${p.total_downloads || 0} lượt tải</span>
              </div>
            </div>
          </div>
          <div class="hero-pack-row-right">
            ${
              isSelected
                ? `
                <span class="btn-hero-action-selected">
                  <i data-lucide="check" style="width: 13px; height: 13px;"></i>
                  Vị trí #${inSlotIdx + 1}
                </span>
                <button type="button" class="btn-hero-action-remove hero-unpick-btn" data-id="${p.id}" title="Gỡ khỏi Hero Slider">
                  <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                </button>
              `
                : `
                <button type="button" class="btn-hero-action-select hero-pick-btn" data-id="${p.id}">
                  <i data-lucide="plus" style="width: 13px; height: 13px;"></i>
                  Chọn vào Hero
                </button>
              `
            }
          </div>
        </div>
      `;
    });

    heroPacksPickerList.innerHTML = listHtml;
    if (window.lucide) window.lucide.createIcons();

    // Gắn sự kiện Chọn
    heroPacksPickerList.querySelectorAll(".hero-pick-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const packId = parseInt(this.getAttribute("data-id"), 10);
        const pack = heroAvailablePacks.find((p) => p.id === packId);
        if (!pack) return;

        // Tìm vị trí trống đầu tiên
        const emptyIdx = heroSlots.findIndex((s) => s === null);
        if (emptyIdx === -1) {
          showToast("⚠️ Đã chọn đủ 4 vị trí Hero! Vui lòng gỡ bớt 1 bộ trước.");
          return;
        }

        heroSlots[emptyIdx] = pack;
        renderHeroSlots();
        renderHeroPickerList();
      });
    });

    // Gắn sự kiện Gỡ
    heroPacksPickerList.querySelectorAll(".hero-unpick-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const packId = parseInt(this.getAttribute("data-id"), 10);
        const slotIdx = heroSlots.findIndex((s) => s && s.id === packId);
        if (slotIdx !== -1) {
          heroSlots[slotIdx] = null;
          renderHeroSlots();
          renderHeroPickerList();
        }
      });
    });
  }

  // Lắng nghe tìm kiếm bộ sưu tập
  heroPackSearchInput?.addEventListener("input", function (e) {
    heroSearchTerm = (e.target.value || "").trim().toLowerCase();
    renderHeroPickerList();
  });

  // Mở & Đóng modal Hero
  openHeroConfigBtn?.addEventListener("click", openHeroModal);
  closeHeroModalBtn?.addEventListener("click", closeHeroModal);
  cancelHeroModalBtn?.addEventListener("click", closeHeroModal);

  heroModal?.addEventListener("click", function (e) {
    if (e.target === heroModal) {
      closeHeroModal();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && heroModal?.classList.contains("active")) {
      closeHeroModal();
    }
  });

  // Lưu cấu hình Hero
  saveHeroConfigBtn?.addEventListener("click", async function () {
    const validSlots = heroSlots.filter(Boolean);
    if (validSlots.length !== 4) {
      showToast("⚠️ Vui lòng chọn đủ đúng 4 bộ sưu tập cho 4 vị trí Hero!");
      return;
    }

    const packIds = validSlots.map((p) => p.id);

    saveHeroConfigBtn.disabled = true;
    const originalText = saveHeroConfigBtn.innerHTML;
    saveHeroConfigBtn.innerHTML = `
      <i data-lucide="loader" style="width: 16px; height: 16px; animation: spin 1s linear infinite;"></i>
      <span>Đang lưu cấu hình...</span>
    `;
    if (window.lucide) window.lucide.createIcons();

    try {
      const response = await fetch("/admin/api/hero-packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack_ids: packIds }),
      });

      const result = await response.json();

      if (result.success) {
        showToast(`✅ ${result.message}`);
        closeHeroModal();
        if (typeof fetchPacks === "function") {
          fetchPacks();
        }
      } else {
        showToast(`❌ ${result.message || "Không thể lưu cấu hình Hero!"}`);
      }
    } catch (err) {
      console.error("Lỗi khi lưu Hero Sticker:", err);
      showToast("❌ Lỗi kết nối máy chủ khi lưu Hero!");
    } finally {
      saveHeroConfigBtn.disabled = false;
      saveHeroConfigBtn.innerHTML = originalText;
      if (window.lucide) window.lucide.createIcons();
    }
  });

  // Gắn sự kiện cho các hàng SSR ban đầu
  bindRowEvents();
});