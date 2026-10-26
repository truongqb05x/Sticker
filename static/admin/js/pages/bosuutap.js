/**
 * ========================================================
 * ADMIN BỘ SƯU TẬP (COLLECTION MANAGEMENT) - JAVASCRIPT
 * Tích hợp logic sinh mã Slug URL tự động & Chỉnh sửa bộ sưu tập
 * ========================================================
 */

// Tên danh mục hiển thị tiếng Việt
const categoryMap = {
  animals: "Động vật",
  anime: "Anime & Manga",
  chibi: "Chibi",
  nature: "Phong cảnh",
  love: "Tình yêu",
  expressions: "Biểu cảm",
  others: "Lễ hội & Khác"
};

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
  // 1. Khởi tạo Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 2. Elements Bộ Lọc & Tìm Kiếm
  const searchInput = document.getElementById("collectionSearchInput");
  const categorySelect = document.getElementById("collectionCategoryFilter");
  const statusTabs = document.querySelectorAll(".status-tab-btn");
  const tableRows = document.querySelectorAll("#collectionsTableBody tr");
  const countIndicator = document.getElementById("pageVisibleCount");

  let currentStatus = "all";

  // Hàm lọc tổng hợp (Tìm kiếm theo Tên, Slug, Tác giả + Danh mục + Trạng thái)
  function applyFilters() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const selectedCategory = categorySelect ? categorySelect.value.toLowerCase() : "all";

    let visibleCount = 0;

    tableRows.forEach(row => {
      const rowCat = (row.getAttribute("data-category") || "").toLowerCase();
      const rowStatus = (row.getAttribute("data-status") || "").toLowerCase();
      const rowSlug = (row.getAttribute("data-slug") || "").toLowerCase();
      const rowText = row.textContent.toLowerCase();

      const matchSearch = (!query || rowText.includes(query) || rowSlug.includes(query));
      const matchCategory = (selectedCategory === "all" || rowCat === selectedCategory);
      const matchStatus = (currentStatus === "all" || rowStatus === currentStatus);

      if (matchSearch && matchCategory && matchStatus) {
        row.style.display = "";
        visibleCount++;
      } else {
        row.style.display = "none";
      }
    });

    if (countIndicator) {
      countIndicator.textContent = visibleCount;
    }
  }

  // Sự kiện tìm kiếm & chọn danh mục
  searchInput?.addEventListener("input", applyFilters);
  categorySelect?.addEventListener("change", applyFilters);

  // Sự kiện chuyển Tab trạng thái
  statusTabs.forEach(tab => {
    tab.addEventListener("click", function () {
      statusTabs.forEach(t => t.classList.remove("active"));
      this.classList.add("active");
      currentStatus = this.getAttribute("data-status") || "all";
      applyFilters();
    });
  });

  // 3. Xử lý Modal Thêm / Chỉnh Sửa Bộ Sưu Tập & Logic Slug
  const addModal = document.getElementById("addCollectionModal");
  const openAddModalBtn = document.getElementById("openAddModalBtn");
  const closeAddModalBtn = document.getElementById("closeAddModalBtn");
  const cancelAddModalBtn = document.getElementById("cancelAddModalBtn");
  const addForm = document.getElementById("addCollectionForm");

  const modalHeadingIcon = document.getElementById("modalHeadingIcon");
  const modalHeadingText = document.getElementById("modalHeadingText");
  const submitCollectionModalBtn = document.getElementById("submitCollectionModalBtn");

  const packNameInput = document.getElementById("packNameInput");
  const packSlugInput = document.getElementById("packSlugInput");
  const packAuthorInput = document.getElementById("packAuthorInput");
  const packCategorySelect = document.getElementById("packCategorySelect");
  const packStatusSelect = document.getElementById("packStatusSelect");
  const packTagInput = document.getElementById("packTagInput");
  const packDescInput = document.getElementById("packDescInput");

  // Biến lưu hàng đang chỉnh sửa (null nếu thêm mới)
  let editingRow = null;

  // Cờ kiểm tra người dùng có chủ động gõ sửa Slug hay không
  let isSlugManuallyEdited = false;

  // Tự động sinh Slug khi người dùng gõ Tên bộ sưu tập
  packNameInput?.addEventListener("input", function () {
    if (!isSlugManuallyEdited && packSlugInput) {
      packSlugInput.value = convertToSlug(this.value);
    }
  });

  // Cho phép người dùng tùy chỉnh slug theo ý muốn
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

  // Tự động chuẩn hóa khi rời khỏi ô nhập Slug
  packSlugInput?.addEventListener("blur", function () {
    if (this.value.trim() !== "") {
      this.value = convertToSlug(this.value);
    }
  });

  // Mở modal Thêm mới
  function openAddModal() {
    if (!addModal) return;
    editingRow = null;
    isSlugManuallyEdited = false;
    addForm?.reset();

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

  // Mở modal Chỉnh sửa bộ sưu tập từ hàng trong bảng
  function openEditModal(row) {
    if (!addModal || !row) return;
    editingRow = row;

    const titleEl = row.querySelector(".table-pack-title");
    const authorEl = row.querySelector(".table-pack-author strong");

    const name = titleEl ? titleEl.textContent.trim() : "";
    const author = authorEl ? authorEl.textContent.trim() : "";
    const category = row.getAttribute("data-category") || "animals";
    const status = row.getAttribute("data-status") || "active";
    const slug = row.getAttribute("data-slug") || convertToSlug(name);

    // Điền dữ liệu hiện tại vào form
    if (packNameInput) packNameInput.value = name;
    if (packSlugInput) packSlugInput.value = slug;
    if (packAuthorInput) packAuthorInput.value = author;
    if (packCategorySelect) packCategorySelect.value = category;
    if (packStatusSelect) packStatusSelect.value = status;
    if (packTagInput) packTagInput.value = "";
    if (packDescInput) packDescInput.value = "";

    // Đánh dấu để giữ nguyên slug hiện tại, không tự động ghi đè
    isSlugManuallyEdited = true;

    if (modalHeadingText) modalHeadingText.textContent = `Chỉnh sửa: ${name}`;
    if (modalHeadingIcon) {
      modalHeadingIcon.setAttribute("data-lucide", "edit-3");
      modalHeadingIcon.style.color = "#2E78D6";
    }
    if (submitCollectionModalBtn) submitCollectionModalBtn.textContent = "Lưu thay đổi";

    if (window.lucide) window.lucide.createIcons();

    addModal.classList.add("active");
    document.body.style.overflow = "hidden";
    setTimeout(() => packNameInput?.focus(), 100);
  }

  function closeModal() {
    if (addModal) {
      addModal.classList.remove("active");
      document.body.style.overflow = "";
      addForm?.reset();
      editingRow = null;
      isSlugManuallyEdited = false;
      if (packSlugInput) packSlugInput.value = "";
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

  // Gắn sự kiện click mở modal chỉnh sửa cho tất cả các nút icon chỉnh sửa
  const editButtons = document.querySelectorAll(".btn-edit-row");
  editButtons.forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const row = this.closest("tr");
      if (row) {
        openEditModal(row);
      }
    });
  });

  // Xử lý gửi Form (Thêm mới hoặc Cập nhật)
  addForm?.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = packNameInput?.value.trim();
    let slug = packSlugInput?.value.trim() || convertToSlug(name);
    const author = packAuthorInput?.value.trim() || "Studio";
    const category = packCategorySelect?.value || "animals";
    const status = packStatusSelect?.value || "active";

    if (!name) {
      showToast("⚠️ Vui lòng nhập tên bộ sưu tập!");
      return;
    }

    if (!slug) {
      slug = convertToSlug(name);
      if (packSlugInput) packSlugInput.value = slug;
    }

    // NẾU LÀ CHẾ ĐỘ CHỈNH SỬA
    if (editingRow) {
      // 1. Cập nhật các thuộc tính dữ liệu trên hàng
      editingRow.setAttribute("data-slug", slug);
      editingRow.setAttribute("data-category", category);
      editingRow.setAttribute("data-status", status);

      // 2. Cập nhật tên và tác giả trên DOM
      const titleEl = editingRow.querySelector(".table-pack-title");
      if (titleEl) titleEl.textContent = name;

      const authorStrong = editingRow.querySelector(".table-pack-author strong");
      if (authorStrong) authorStrong.textContent = author;

      // 3. Cập nhật nhãn danh mục
      const catBadge = editingRow.querySelector(".category-tag-badge");
      if (catBadge) {
        catBadge.textContent = categoryMap[category] || category;
      }

      // 4. Cập nhật huy hiệu trạng thái
      const statusBadge = editingRow.querySelector(".status-badge");
      if (statusBadge) {
        if (status === "active") {
          statusBadge.className = "status-badge status-badge-active";
          statusBadge.innerHTML = `<i data-lucide="check-circle" style="width: 12px; height: 12px;"></i> Công khai`;
        } else if (status === "pending") {
          statusBadge.className = "status-badge status-badge-pending";
          statusBadge.innerHTML = `<i data-lucide="clock" style="width: 12px; height: 12px;"></i> Chờ duyệt`;
        } else {
          statusBadge.className = "status-badge status-badge-hidden";
          statusBadge.innerHTML = `<i data-lucide="eye-off" style="width: 12px; height: 12px;"></i> Tạm ẩn`;
        }
      }

      // 5. Cập nhật ngày sửa thành hôm nay
      const dateCell = editingRow.querySelector("td:nth-child(7)");
      if (dateCell) {
        const today = new Date();
        const d = String(today.getDate()).padStart(2, "0");
        const m = String(today.getMonth() + 1).padStart(2, "0");
        const y = today.getFullYear();
        dateCell.textContent = `${d}/${m}/${y}`;
      }

      if (window.lucide) window.lucide.createIcons();
      applyFilters();
      closeModal();
      showToast(`✅ Đã cập nhật thành công: "${name}" (Slug: /${slug})!`);
    } else {
      // NẾU LÀ THÊM MỚI
      closeModal();
      showToast(`✅ Đã thêm mới thành công bộ sưu tập "${name}" (Slug: /${slug})!`);
    }
  });

  // 4. Các thao tác trên hàng (Row actions)
  // Xóa bộ sưu tập
  const deleteButtons = document.querySelectorAll(".btn-delete-row");
  deleteButtons.forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const row = this.closest("tr");
      const name = row?.querySelector(".table-pack-title")?.textContent.trim() || "Bộ sưu tập";

      if (confirm(`Bạn có chắc muốn xóa vĩnh viễn bộ sưu tập "${name}" khỏi hệ thống?`)) {
        row?.remove();
        applyFilters();
        showToast(`🗑️ Đã xóa bộ sưu tập "${name}".`);
      }
    });
  });

  // Duyệt xuất bản
  const approveButtons = document.querySelectorAll(".btn-approve-row");
  approveButtons.forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const row = this.closest("tr");
      const name = row?.querySelector(".table-pack-title")?.textContent.trim() || "Bộ sưu tập";
      const statusBadge = row?.querySelector(".status-badge");

      if (statusBadge) {
        statusBadge.className = "status-badge status-badge-active";
        statusBadge.innerHTML = `<i data-lucide="check-circle" style="width: 12px; height: 12px;"></i> Công khai`;
        row.setAttribute("data-status", "active");
        this.remove();
        if (window.lucide) window.lucide.createIcons();
        showToast(`✅ Đã phê duyệt phát hành: "${name}"!`);
      }
    });
  });

  // Phân trang
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
