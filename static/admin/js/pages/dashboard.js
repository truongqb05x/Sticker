/**
 * ========================================================
 * ADMIN DASHBOARD JAVASCRIPT - STICKERHUB
 * ========================================================
 */

document.addEventListener("DOMContentLoaded", function () {
  // 1. Khởi tạo Lucide Icons nếu chưa khởi tạo
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 2. Xử lý Biểu đồ Xu hướng Tải Sticker (Smooth Spline / Wave Chart SVG)

  const trendChartWrapper = document.getElementById("trendChartWrapper");
  const chartWaveArea = document.getElementById("chartWaveArea");
  const chartWaveSvg = document.getElementById("chartWaveSvg");
  const waveAreaPath = document.getElementById("waveAreaPath");
  const waveLinePath = document.getElementById("waveLinePath");
  const waveCrosshair = document.getElementById("waveCrosshair");
  const waveActiveMarker = document.getElementById("waveActiveMarker");
  const waveDotsGroup = document.getElementById("waveDotsGroup");
  const chartTriggersLayer = document.getElementById("chartTriggersLayer");
  const chartXAxis = document.getElementById("chartXAxis");
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

  // Biến lưu trữ điểm hiện tại
  let currentPoints = [];
  let currentDataset = null;

  // Thuật toán xây dựng đường cong Catmull-Rom to Cubic Bézier (Sóng mềm mại)
  function buildSplinePath(points) {
    if (!points || points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      // Hệ số làm mịn đường cong (spline smoothing factor = 1/6)
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;

      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  }

  // Hiển thị tooltip và neo điểm sáng tại chỉ số mốc index
  function highlightWavePoint(index) {
    if (!currentPoints[index] || !currentDataset || !chartTooltip || !trendChartWrapper) return;

    const pt = currentPoints[index];
    const col = currentDataset.cols[index];

    // Cập nhật tooltip
    if (tooltipHeader) tooltipHeader.textContent = `${col.day} • ${col.date}`;
    if (tooltipNum) tooltipNum.textContent = col.downloads;
    if (tooltipBadge) {
      tooltipBadge.textContent = `${col.change} so với kỳ trước`;
      if (col.change.includes("-")) {
        tooltipBadge.style.color = "#F87171";
      } else {
        tooltipBadge.style.color = "#4ADE80";
      }
    }

    // Cập nhật thước gióng dọc
    if (waveCrosshair) {
      waveCrosshair.setAttribute("x1", pt.x.toFixed(1));
      waveCrosshair.setAttribute("x2", pt.x.toFixed(1));
      waveCrosshair.classList.add("active");
    }

    // Cập nhật điểm sáng neo
    if (waveActiveMarker) {
      waveActiveMarker.setAttribute("transform", `translate(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})`);
      waveActiveMarker.classList.add("active");
    }

    // Tính toán tọa độ pixel thực tế của tooltip
    const svgRect = chartWaveSvg ? chartWaveSvg.getBoundingClientRect() : trendChartWrapper.getBoundingClientRect();
    const wrapperRect = trendChartWrapper.getBoundingClientRect();
    
    const realPixelX = (svgRect.left - wrapperRect.left) + (pt.x / 700) * svgRect.width;
    const realPixelY = (svgRect.top - wrapperRect.top) + (pt.y / 180) * svgRect.height;

    const safeLeft = Math.max(70, Math.min(realPixelX, wrapperRect.width - 70));
    const safeTop = Math.max(10, realPixelY - 14);

    chartTooltip.style.left = `${safeLeft}px`;
    chartTooltip.style.top = `${safeTop}px`;
    chartTooltip.classList.add("active");

    // Highlight nhãn X và cột trigger
    const xTags = chartXAxis?.querySelectorAll(".wave-x-tag") || [];
    xTags.forEach((tag, i) => {
      tag.classList.toggle("hover-focus", i === index);
    });

    const triggers = chartTriggersLayer?.querySelectorAll(".wave-trigger-col") || [];
    triggers.forEach((trg, i) => {
      trg.classList.toggle("hover-focus", i === index);
    });
  }

  function hideWaveHighlight() {
    if (waveCrosshair) waveCrosshair.classList.remove("active");
    if (waveActiveMarker) waveActiveMarker.classList.remove("active");
    if (chartTooltip) chartTooltip.classList.remove("active");

    const xTags = chartXAxis?.querySelectorAll(".wave-x-tag") || [];
    xTags.forEach(tag => tag.classList.remove("hover-focus"));

    const triggers = chartTriggersLayer?.querySelectorAll(".wave-trigger-col") || [];
    triggers.forEach(trg => trg.classList.remove("hover-focus"));
  }

  // Render lại biểu đồ lượn sóng
  function renderChart(rangeKey) {
    const dataset = chartDataSets[rangeKey];
    if (!dataset || !chartWaveSvg) return;

    currentDataset = dataset;

    // Cập nhật trục Y
    const yAxisContainer = document.querySelector(".chart-y-axis");
    if (yAxisContainer && dataset.yLabels) {
      yAxisContainer.innerHTML = dataset.yLabels
        .map(lbl => `<span class="y-label">${lbl}</span>`)
        .join("");
    }

    const n = dataset.cols.length;
    const margin = 45;
    const totalW = 700;
    const baseY = 162;
    const minY = 24;
    const availableH = baseY - minY;
    const stepX = n > 1 ? (totalW - 2 * margin) / (n - 1) : 0;

    // Tính toán tọa độ các điểm
    currentPoints = dataset.cols.map((col, i) => {
      const heightPercent = parseFloat(col.height) || 0;
      const x = n > 1 ? margin + i * stepX : totalW / 2;
      const y = baseY - (heightPercent / 100) * availableH;
      return { x, y, col, index: i };
    });

    // Tạo SVG Path dạng sóng
    const lineD = buildSplinePath(currentPoints);
    const areaD = currentPoints.length > 0 
      ? `${lineD} L ${currentPoints[currentPoints.length - 1].x.toFixed(1)} ${baseY} L ${currentPoints[0].x.toFixed(1)} ${baseY} Z`
      : "";

    if (waveLinePath) waveLinePath.setAttribute("d", lineD);
    if (waveAreaPath) waveAreaPath.setAttribute("d", areaD);

    // Vẽ các điểm mốc (dots)
    if (waveDotsGroup) {
      waveDotsGroup.innerHTML = currentPoints.map(pt => `
        <circle class="wave-dot ${pt.col.highlight ? 'highlight' : ''}" 
                cx="${pt.x.toFixed(1)}" 
                cy="${pt.y.toFixed(1)}" 
                r="${pt.col.highlight ? 5.5 : 4}" 
                fill="#FFFFFF" 
                stroke="#C45832" 
                stroke-width="${pt.col.highlight ? 3 : 2.5}" 
                data-index="${pt.index}"></circle>
      `).join("");
    }

    // Vẽ các cột trigger cảm ứng/hover
    if (chartTriggersLayer) {
      chartTriggersLayer.innerHTML = dataset.cols.map((col, i) => `
        <div class="wave-trigger-col ${col.highlight ? 'highlight' : ''}" data-index="${i}"></div>
      `).join("");
    }

    // Vẽ nhãn trục X
    if (chartXAxis) {
      chartXAxis.innerHTML = dataset.cols.map((col, i) => `
        <div class="wave-x-label">
          <span class="wave-x-tag ${col.highlight ? 'highlight' : ''}" data-index="${i}">${col.label}</span>
        </div>
      `).join("");
    }

    // Gắn sự kiện tương tác
    bindWaveInteractions();

    // Mặc định ban đầu ẩn thông tin, chỉ hiện khi người dùng rê chuột
    hideWaveHighlight();
  }

  // Gắn sự kiện hover và touch
  function bindWaveInteractions() {
    const triggers = chartTriggersLayer?.querySelectorAll(".wave-trigger-col") || [];
    triggers.forEach(trg => {
      const idx = parseInt(trg.getAttribute("data-index"), 10);

      trg.addEventListener("mouseenter", function () {
        highlightWavePoint(idx);
      });

      trg.addEventListener("mousemove", function () {
        highlightWavePoint(idx);
      });

      trg.addEventListener("touchstart", function () {
        highlightWavePoint(idx);
      }, { passive: true });
    });

    if (chartWaveArea) {
      chartWaveArea.addEventListener("mouseleave", function () {
        hideWaveHighlight();
      });
    }
  }

  // Render khởi tạo biểu đồ sóng
  renderChart("7d");

  // Đổi mốc thời gian khi nhấn nút filter
  chartPills.forEach(btn => {
    btn.addEventListener("click", function () {
      chartPills.forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      const range = this.getAttribute("data-range") || "7d";
      renderChart(range);
      if (typeof showToast === "function") {
        showToast(`Đã cập nhật biểu đồ xu hướng: ${this.textContent}`);
      }
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

  // 5. Xử lý Xóa / Khóa Bộ sưu tập
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
});

// Toast Notification Helper
function showToast(message) {
  if (typeof window.showToast === "function") {
    window.showToast(message);
    return;
  }
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

