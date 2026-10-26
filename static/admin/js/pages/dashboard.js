/**
 * ========================================================
 * ADMIN DASHBOARD JAVASCRIPT - STICKERHUB
 * ========================================================
 */

document.addEventListener("DOMContentLoaded", function () {
  // 1. Khởi tạo Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 2. Toggle Mobile Sidebar
  const sidebarToggleBtn = document.getElementById("sidebarToggleBtn");
  const adminSidebar = document.getElementById("adminSidebar");

  sidebarToggleBtn?.addEventListener("click", function () {
    adminSidebar?.classList.toggle("show-mobile");
  });

  // 3. Xử lý Biểu đồ Xu hướng Tải Sticker (Interactive Hover Tooltip & Filter)
  const trendChartWrapper = document.getElementById("trendChartWrapper");
  const chartBarsArea = document.getElementById("chartBarsArea");
  const chartTooltip = document.getElementById("chartHoverTooltip");
  const tooltipHeader = document.getElementById("tooltipHeader");
  const tooltipNum = document.getElementById("tooltipNum");
  const tooltipBadge = document.getElementById("tooltipBadge");
  const chartPills = document.querySelectorAll(".chart-pill-btn");

  // Dữ liệu mẫu tương ứng các mốc thời gian
  const chartDataSets = {
    "7d": {
      yLabels: ["40K", "30K", "20K", "10K", "0"],
      cols: [
        { label: "T2", day: "Thứ Hai", date: "20/10/2026", downloads: "14,250", change: "+8.4%", height: "37%" },
        { label: "T3", day: "Thứ Ba", date: "21/10/2026", downloads: "18,500", change: "+12.1%", height: "48%" },
        { label: "T4", day: "Thứ Tư", date: "22/10/2026", downloads: "17,100", change: "-2.5%", height: "44%" },
        { label: "T5", day: "Thứ Năm", date: "23/10/2026", downloads: "25,400", change: "+15.8%", height: "66%" },
        { label: "T6", day: "Thứ Sáu", date: "24/10/2026", downloads: "29,800", change: "+22.3%", height: "77%" },
        { label: "T7", day: "Thứ Bảy", date: "25/10/2026", downloads: "27,300", change: "+18.5%", height: "71%" },
        { label: "CN", day: "Chủ Nhật", date: "26/10/2026", downloads: "38,500", change: "+34.2% 🔥", height: "100%", highlight: true }
      ]
    },
    "30d": {
      yLabels: ["50K", "37K", "25K", "12K", "0"],
      cols: [
        { label: "01/10", day: "Đầu tháng", date: "01/10/2026", downloads: "15,800", change: "+5.1%", height: "32%" },
        { label: "05/10", day: "Mốc 5 ngày", date: "05/10/2026", downloads: "22,400", change: "+14.3%", height: "45%" },
        { label: "10/10", day: "Giữa kỳ", date: "10/10/2026", downloads: "29,600", change: "+19.0%", height: "59%" },
        { label: "15/10", day: "Rằm tháng", date: "15/10/2026", downloads: "33,100", change: "+11.2%", height: "66%" },
        { label: "20/10", day: "Ngày Phụ nữ VN", date: "20/10/2026", downloads: "46,800", change: "+42.5% 🔥", height: "94%", highlight: true },
        { label: "24/10", day: "Cuối tuần", date: "24/10/2026", downloads: "37,200", change: "-8.4%", height: "74%" },
        { label: "26/10", day: "Hôm nay", date: "26/10/2026", downloads: "38,500", change: "+18.2%", height: "77%" }
      ]
    },
    "month": {
      yLabels: ["60K", "45K", "30K", "15K", "0"],
      cols: [
        { label: "Tuần 1", day: "01/10 - 07/10", date: "Tuần 1", downloads: "34,200", change: "+6.8%", height: "57%" },
        { label: "Tuần 2", day: "08/10 - 14/10", date: "Tuần 2", downloads: "42,800", change: "+15.3%", height: "71%" },
        { label: "Tuần 3", day: "15/10 - 21/10", date: "Tuần 3", downloads: "58,600", change: "+36.9% 🔥", height: "98%", highlight: true },
        { label: "Tuần 4", day: "22/10 - 28/10", date: "Tuần 4", downloads: "46,800", change: "+12.4%", height: "78%" }
      ]
    }
  };

  // Hàm định vị và hiển thị tooltip
  function showColumnTooltip(col) {
    if (!chartTooltip || !trendChartWrapper) return;

    const day = col.getAttribute("data-day") || "";
    const date = col.getAttribute("data-date") || "";
    const downloads = col.getAttribute("data-downloads") || "0";
    const change = col.getAttribute("data-change") || "";

    if (tooltipHeader) tooltipHeader.textContent = `${day} • ${date}`;
    if (tooltipNum) tooltipNum.textContent = downloads;
    if (tooltipBadge) {
      tooltipBadge.textContent = `${change} so với kỳ trước`;
      if (change.includes("-")) {
        tooltipBadge.style.color = "#F87171";
      } else {
        tooltipBadge.style.color = "#4ADE80";
      }
    }

    const wrapperRect = trendChartWrapper.getBoundingClientRect();
    const fillEl = col.querySelector(".col-bar-fill") || col;
    const fillRect = fillEl.getBoundingClientRect();

    // Tọa độ tương đối trong khung trendChartWrapper
    const centerX = (fillRect.left + fillRect.width / 2) - wrapperRect.left;
    const topY = fillRect.top - wrapperRect.top;

    // Giới hạn để tooltip không bị lệch ra ngoài khung
    const safeLeft = Math.max(70, Math.min(centerX, wrapperRect.width - 70));
    const safeTop = Math.max(12, topY - 10);

    chartTooltip.style.left = `${safeLeft}px`;
    chartTooltip.style.top = `${safeTop}px`;
    chartTooltip.classList.add("active");
  }

  function hideColumnTooltip() {
    if (chartTooltip) {
      chartTooltip.classList.remove("active");
    }
  }

  // Gắn sự kiện hover cho các cột
  function bindChartHoverEvents() {
    const cols = chartBarsArea?.querySelectorAll(".chart-col") || [];
    cols.forEach(col => {
      col.addEventListener("mouseenter", function () {
        cols.forEach(c => c.classList.remove("hover-focus"));
        this.classList.add("hover-focus");
        showColumnTooltip(this);
      });

      col.addEventListener("mousemove", function () {
        showColumnTooltip(this);
      });

      col.addEventListener("mouseleave", function () {
        this.classList.remove("hover-focus");
        hideColumnTooltip();
      });

      // Hỗ trợ thiết bị cảm ứng
      col.addEventListener("touchstart", function (e) {
        cols.forEach(c => c.classList.remove("hover-focus"));
        this.classList.add("hover-focus");
        showColumnTooltip(this);
      }, { passive: true });
    });
  }

  // Render lại dữ liệu biểu đồ khi đổi filter
  function renderChart(rangeKey) {
    const dataset = chartDataSets[rangeKey];
    if (!dataset || !chartBarsArea) return;

    // Cập nhật trục Y nếu có
    const yAxisContainer = document.querySelector(".chart-y-axis");
    if (yAxisContainer && dataset.yLabels) {
      yAxisContainer.innerHTML = dataset.yLabels
        .map(lbl => `<span class="y-label">${lbl}</span>`)
        .join("");
    }

    // Cập nhật các cột dữ liệu
    const colsHtml = dataset.cols.map(c => `
      <div class="chart-col ${c.highlight ? 'highlight' : ''}" 
           data-day="${c.day}" 
           data-date="${c.date}" 
           data-downloads="${c.downloads}" 
           data-change="${c.change}">
        <div class="col-bar-track">
          <div class="col-bar-fill" style="height: ${c.height};"></div>
        </div>
        <span class="col-day-label">${c.label}</span>
      </div>
    `).join("");

    chartBarsArea.innerHTML = `
      <!-- Đường lưới ngang phụ -->
      <div class="chart-grid-line" style="top: 0%;"></div>
      <div class="chart-grid-line" style="top: 25%;"></div>
      <div class="chart-grid-line" style="top: 50%;"></div>
      <div class="chart-grid-line" style="top: 75%;"></div>
      <div class="chart-grid-line" style="top: 100%;"></div>
      ${colsHtml}
    `;

    bindChartHoverEvents();
  }

  // Khởi tạo hover ban đầu
  bindChartHoverEvents();

  // Đổi mốc thời gian khi nhấn nút filter
  chartPills.forEach(btn => {
    btn.addEventListener("click", function () {
      chartPills.forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      const range = this.getAttribute("data-range") || "7d";
      renderChart(range);
      showToast(`Đã cập nhật biểu đồ: ${this.textContent}`);
    });
  });

  // 4. Lọc danh mục trong bảng quản lý bộ sưu tập
  const tableFilterSelect = document.getElementById("tableCategoryFilter");
  const tableSearchInput = document.getElementById("tableSearchInput");
  const tableRows = document.querySelectorAll("#collectionsTableBody tr");

  function filterTable() {
    const selectedCategory = tableFilterSelect ? tableFilterSelect.value.toLowerCase() : "all";
    const searchQuery = tableSearchInput ? tableSearchInput.value.toLowerCase().trim() : "";

    let matchCount = 0;
    tableRows.forEach(row => {
      const category = row.getAttribute("data-category")?.toLowerCase() || "";
      const text = row.textContent.toLowerCase();

      const matchCat = (selectedCategory === "all" || category === selectedCategory);
      const matchSearch = (!searchQuery || text.includes(searchQuery));

      if (matchCat && matchSearch) {
        row.style.display = "";
        matchCount++;
      } else {
        row.style.display = "none";
      }
    });
  }

  tableFilterSelect?.addEventListener("change", filterTable);
  tableSearchInput?.addEventListener("input", filterTable);

  // 5. Xử lý Modal Thêm Bộ Sưu Tập Mới
  const openAddModalBtn = document.getElementById("openAddModalBtn");
  const addModalBackdrop = document.getElementById("addCollectionModal");
  const closeAddModalBtn = document.getElementById("closeAddModalBtn");
  const cancelAddModalBtn = document.getElementById("cancelAddModalBtn");
  const addCollectionForm = document.getElementById("addCollectionForm");

  function openAddModal() {
    if (addModalBackdrop) {
      addModalBackdrop.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }

  function closeAddModal() {
    if (addModalBackdrop) {
      addModalBackdrop.classList.remove("active");
      document.body.style.overflow = "";
      addCollectionForm?.reset();
    }
  }

  openAddModalBtn?.addEventListener("click", openAddModal);
  closeAddModalBtn?.addEventListener("click", closeAddModal);
  cancelAddModalBtn?.addEventListener("click", closeAddModal);

  addCollectionForm?.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("packNameInput")?.value.trim();
    const cat = document.getElementById("packCatSelect")?.value;

    if (!name) {
      showToast("⚠️ Vui lòng nhập tên bộ sưu tập!");
      return;
    }

    closeAddModal();
    showToast(`✅ Đã thêm mới thành công bộ sưu tập: "${name}" (${cat})!`);
  });

  // 6. Xử lý Xóa / Khóa Bộ sưu tập
  const deleteButtons = document.querySelectorAll(".btn-delete-row");
  deleteButtons.forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const row = this.closest("tr");
      const name = row?.querySelector(".table-pack-title")?.textContent.trim() || "Bộ sưu tập";

      if (confirm(`Bạn có chắc chắn muốn xóa/ẩn bộ sưu tập "${name}"?`)) {
        row?.remove();
        showToast(`🗑️ Đã xóa bộ sưu tập "${name}" khỏi hệ thống.`);
      }
    });
  });

  // 7. Click outside modal để đóng
  addModalBackdrop?.addEventListener("click", function (e) {
    if (e.target === addModalBackdrop) {
      closeAddModal();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && addModalBackdrop?.classList.contains("active")) {
      closeAddModal();
    }
  });
});

// Toast Notification Helper
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
