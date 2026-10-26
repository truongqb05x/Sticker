/**
 * ========================================================
 * ADMIN DANH MỤC CHỦ ĐỀ (CATEGORY MANAGEMENT) - JAVASCRIPT
 * ========================================================
 */

document.addEventListener("DOMContentLoaded", function () {
  // 1. Khởi tạo Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 2. Elements Tìm Kiếm & Lọc
  const searchInput = document.getElementById("categorySearchInput");
  const statusSelect = document.getElementById("categoryStatusFilter");
  const resetBtn = document.getElementById("resetCatFilterBtn");
  const tableRows = document.querySelectorAll("#categoryTableBody tr");
  const visibleCountBadge = document.getElementById("catVisibleCount");

  function filterCategories() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const selectedStatus = statusSelect ? statusSelect.value.toLowerCase() : "all";

    let visibleCount = 0;

    tableRows.forEach(row => {
      const text = row.textContent.toLowerCase();
      const rowStatus = (row.getAttribute("data-status") || "").toLowerCase();

      const matchSearch = (!query || text.includes(query));
      const matchStatus = (selectedStatus === "all" || rowStatus === selectedStatus);

      if (matchSearch && matchStatus) {
        row.style.display = "";
        visibleCount++;
      } else {
        row.style.display = "none";
      }
    });

    if (visibleCountBadge) {
      visibleCountBadge.textContent = visibleCount;
    }
  }

  searchInput?.addEventListener("input", filterCategories);
  statusSelect?.addEventListener("change", filterCategories);

  resetBtn?.addEventListener("click", function () {
    if (searchInput) searchInput.value = "";
    if (statusSelect) statusSelect.value = "all";
    filterCategories();
    showToast("Đã đặt lại bộ lọc danh mục.");
  });

  // 3. Xử lý Modal Thêm / Chỉnh Sửa Danh Mục
  const addModal = document.getElementById("addCategoryModal");
  const openModalBtn = document.getElementById("openAddModalBtn");
  const closeModalBtn = document.getElementById("closeAddModalBtn");
  const cancelModalBtn = document.getElementById("cancelAddModalBtn");
  const addForm = document.getElementById("addCategoryForm");

  function openModal() {
    if (addModal) {
      addModal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }

  function closeModal() {
    if (addModal) {
      addModal.classList.remove("active");
      document.body.style.overflow = "";
      addForm?.reset();
    }
  }

  openModalBtn?.addEventListener("click", openModal);
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

  addForm?.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("catNameInput")?.value.trim();
    const slug = document.getElementById("catSlugInput")?.value.trim();

    if (!name || !slug) {
      showToast("⚠️ Vui lòng nhập đầy đủ Tên và Mã danh mục (Slug)!");
      return;
    }

    closeModal();
    showToast(`✅ Đã thêm mới danh mục: "${name}" (/${slug})!`);
  });

  // 4. Các thao tác hàng (Row Actions)
  // Xóa danh mục
  const deleteButtons = document.querySelectorAll(".btn-delete-cat");
  deleteButtons.forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const row = this.closest("tr");
      const name = row?.querySelector(".cat-title")?.textContent.trim() || "Danh mục";

      if (confirm(`Bạn có chắc muốn xóa danh mục "${name}"? Các bộ sưu tập thuộc danh mục này sẽ chuyển về "Chủ đề khác".`)) {
        row?.remove();
        filterCategories();
        showToast(`🗑️ Đã xóa danh mục "${name}".`);
      }
    });
  });

  // Ẩn / Hiện danh mục
  const toggleButtons = document.querySelectorAll(".btn-toggle-cat");
  toggleButtons.forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const row = this.closest("tr");
      const name = row?.querySelector(".cat-title")?.textContent.trim() || "Danh mục";
      const statusBadge = row?.querySelector(".status-badge");
      const currentStatus = row?.getAttribute("data-status");

      if (currentStatus === "active") {
        row.setAttribute("data-status", "hidden");
        if (statusBadge) {
          statusBadge.className = "status-badge status-badge-hidden";
          statusBadge.innerHTML = `<i data-lucide="eye-off" style="width: 12px; height: 12px;"></i> Tạm ẩn`;
        }
        this.title = "Hiện danh mục";
        showToast(`👁️‍🗨️ Đã tạm ẩn danh mục "${name}" trên trang người dùng.`);
      } else {
        row.setAttribute("data-status", "active");
        if (statusBadge) {
          statusBadge.className = "status-badge status-badge-active";
          statusBadge.innerHTML = `<i data-lucide="check-circle" style="width: 12px; height: 12px;"></i> Công khai`;
        }
        this.title = "Ẩn danh mục";
        showToast(`✅ Đã hiển thị công khai danh mục "${name}".`);
      }

      if (window.lucide) window.lucide.createIcons();
    });
  });

  // Chỉnh sửa danh mục
  const editButtons = document.querySelectorAll(".btn-edit-cat");
  editButtons.forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const row = this.closest("tr");
      const name = row?.querySelector(".cat-title")?.textContent.trim() || "Danh mục";
      const slug = row?.querySelector(".slug-tag-code")?.textContent.trim() || "";

      const nameInput = document.getElementById("catNameInput");
      const slugInput = document.getElementById("catSlugInput");

      if (nameInput) nameInput.value = name;
      if (slugInput) slugInput.value = slug;

      openModal();
      showToast(`Đang chỉnh sửa danh mục: "${name}"`);
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
