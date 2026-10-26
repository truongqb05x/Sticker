/**
 * ========================================================
 * ADMIN BỘ SƯU TẬP (COLLECTION MANAGEMENT) - JAVASCRIPT
 * ========================================================
 */

document.addEventListener("DOMContentLoaded", function () {
  // 1. Khởi tạo Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 2. Elements Bộ Lọc & Tìm Kiếm
  const searchInput = document.getElementById("collectionSearchInput");
  const categorySelect = document.getElementById("collectionCategoryFilter");
  const statusTabs = document.querySelectorAll(".status-tab-btn");
  const resetFilterBtn = document.getElementById("resetFilterBtn");
  const tableRows = document.querySelectorAll("#collectionsTableBody tr");
  const countIndicator = document.getElementById("pageVisibleCount");

  let currentStatus = "all";

  // Hàm lọc tổng hợp (Tìm kiếm + Danh mục + Trạng thái)
  function applyFilters() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const selectedCategory = categorySelect ? categorySelect.value.toLowerCase() : "all";

    let visibleCount = 0;

    tableRows.forEach(row => {
      const rowCat = (row.getAttribute("data-category") || "").toLowerCase();
      const rowStatus = (row.getAttribute("data-status") || "").toLowerCase();
      const rowText = row.textContent.toLowerCase();

      const matchSearch = (!query || rowText.includes(query));
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

  // Sự kiện Đặt lại bộ lọc
  resetFilterBtn?.addEventListener("click", function () {
    if (searchInput) searchInput.value = "";
    if (categorySelect) categorySelect.value = "all";
    statusTabs.forEach(t => t.classList.remove("active"));
    const allTab = document.querySelector('.status-tab-btn[data-status="all"]');
    allTab?.classList.add("active");
    currentStatus = "all";
    applyFilters();
    showToast("Đã đặt lại bộ lọc về mặc định.");
  });

  // 3. Xử lý Modal Thêm / Chỉnh Sửa Bộ Sưu Tập
  const addModal = document.getElementById("addCollectionModal");
  const openAddModalBtn = document.getElementById("openAddModalBtn");
  const closeAddModalBtn = document.getElementById("closeAddModalBtn");
  const cancelAddModalBtn = document.getElementById("cancelAddModalBtn");
  const addForm = document.getElementById("addCollectionForm");

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

  openAddModalBtn?.addEventListener("click", openModal);
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

  // Xử lý gửi Form thêm mới
  addForm?.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("packNameInput")?.value.trim();
    const author = document.getElementById("packAuthorInput")?.value.trim();
    const category = document.getElementById("packCategorySelect")?.value;

    if (!name) {
      showToast("⚠️ Vui lòng nhập tên bộ sưu tập!");
      return;
    }

    closeModal();
    showToast(`✅ Đã thêm mới thành công bộ sưu tập "${name}" (${author || 'Studio'})!`);
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
