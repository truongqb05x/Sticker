/**
 * ========================================================
 * ADMIN BÁO CÁO & THỐNG KÊ (ANALYTICS) - JAVASCRIPT
 * ========================================================
 */

document.addEventListener("DOMContentLoaded", function () {
  // 1. Khởi tạo Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 2. Xử lý Biểu đồ Xu hướng Tải (Interactive Hover Tooltip & Switch Timeframe)
  const chartWrapper = document.getElementById("analyticsTrendWrapper");
  const chartBarsArea = document.getElementById("analyticsBarsArea");
  const chartTooltip = document.getElementById("analyticsHoverTooltip");
  const tooltipHeader = document.getElementById("tooltipHeader");
  const tooltipNum = document.getElementById("tooltipNum");
  const tooltipBadge = document.getElementById("tooltipBadge");
  const timeframeButtons = document.querySelectorAll(".timeframe-btn");
  const exportBtn = document.getElementById("btnExportReport");

  // Dữ liệu mẫu theo các mốc thời gian
  const analyticsDataSets = {
    "today": {
      yLabels: ["4K", "3K", "2K", "1K", "0"],
      cols: [
        { label: "00h-04h", day: "Đêm muộn", date: "Hôm nay", downloads: "820", change: "+4.1%", height: "20%" },
        { label: "04h-08h", day: "Sáng sớm", date: "Hôm nay", downloads: "1,450", change: "+8.3%", height: "36%" },
        { label: "08h-12h", day: "Buổi sáng", date: "Hôm nay", downloads: "3,200", change: "+15.6%", height: "80%" },
        { label: "12h-16h", day: "Buổi chiều", date: "Hôm nay", downloads: "2,840", change: "+11.2%", height: "71%" },
        { label: "16h-20h", day: "Chiều tối", date: "Hôm nay", downloads: "4,050", change: "+24.5% 🔥", height: "100%", highlight: true },
        { label: "20h-24h", day: "Đêm", date: "Hôm nay", downloads: "3,620", change: "+18.0%", height: "89%" }
      ]
    },
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
      yLabels: ["60K", "45K", "30K", "15K", "0"],
      cols: [
        { label: "Tuần 1", day: "01/10 - 07/10", date: "Tuần 1", downloads: "34,200", change: "+6.8%", height: "57%" },
        { label: "Tuần 2", day: "08/10 - 14/10", date: "Tuần 2", downloads: "42,800", change: "+15.3%", height: "71%" },
        { label: "Tuần 3", day: "15/10 - 21/10", date: "Tuần 3", downloads: "58,600", change: "+36.9% 🔥", height: "98%", highlight: true },
        { label: "Tuần 4", day: "22/10 - 28/10", date: "Tuần 4", downloads: "46,800", change: "+12.4%", height: "78%" }
      ]
    },
    "year": {
      yLabels: ["200K", "150K", "100K", "50K", "0"],
      cols: [
        { label: "Q1", day: "Quý 1", date: "T1 - T3", downloads: "112,000", change: "+14.2%", height: "56%" },
        { label: "Q2", day: "Quý 2", date: "T4 - T6", downloads: "145,500", change: "+29.8%", height: "72%" },
        { label: "Q3", day: "Quý 3", date: "T7 - T9", downloads: "168,200", change: "+15.6%", height: "84%" },
        { label: "Q4", day: "Quý 4", date: "T10 - T12", downloads: "198,400", change: "+41.0% 🔥", height: "100%", highlight: true }
      ]
    }
  };

  // Định vị tooltip
  function showColumnTooltip(col) {
    if (!chartTooltip || !chartWrapper) return;

    const day = col.getAttribute("data-day") || "";
    const date = col.getAttribute("data-date") || "";
    const downloads = col.getAttribute("data-downloads") || "0";
    const change = col.getAttribute("data-change") || "";

    if (tooltipHeader) tooltipHeader.textContent = `${day} • ${date}`;
    if (tooltipNum) tooltipNum.textContent = downloads;
    if (tooltipBadge) {
      tooltipBadge.textContent = `${change} so với kỳ trước`;
      tooltipBadge.style.color = change.includes("-") ? "#F87171" : "#4ADE80";
    }

    const wrapperRect = chartWrapper.getBoundingClientRect();
    const fillEl = col.querySelector(".col-bar-fill") || col;
    const fillRect = fillEl.getBoundingClientRect();

    const centerX = (fillRect.left + fillRect.width / 2) - wrapperRect.left;
    const topY = fillRect.top - wrapperRect.top;

    const safeLeft = Math.max(70, Math.min(centerX, wrapperRect.width - 70));
    const safeTop = Math.max(12, topY - 10);

    chartTooltip.style.left = `${safeLeft}px`;
    chartTooltip.style.top = `${safeTop}px`;
    chartTooltip.classList.add("active");
  }

  function hideColumnTooltip() {
    chartTooltip?.classList.remove("active");
  }

  function bindHoverEvents() {
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

      col.addEventListener("touchstart", function () {
        cols.forEach(c => c.classList.remove("hover-focus"));
        this.classList.add("hover-focus");
        showColumnTooltip(this);
      }, { passive: true });
    });
  }

  function renderAnalyticsChart(rangeKey) {
    const dataset = analyticsDataSets[rangeKey];
    if (!dataset || !chartBarsArea) return;

    const yAxisContainer = document.querySelector(".chart-y-axis");
    if (yAxisContainer && dataset.yLabels) {
      yAxisContainer.innerHTML = dataset.yLabels
        .map(lbl => `<span class="y-label">${lbl}</span>`)
        .join("");
    }

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
      <div class="chart-grid-line" style="top: 0%;"></div>
      <div class="chart-grid-line" style="top: 25%;"></div>
      <div class="chart-grid-line" style="top: 50%;"></div>
      <div class="chart-grid-line" style="top: 75%;"></div>
      <div class="chart-grid-line" style="top: 100%;"></div>
      ${colsHtml}
    `;

    bindHoverEvents();
  }

  bindHoverEvents();

  timeframeButtons.forEach(btn => {
    btn.addEventListener("click", function () {
      timeframeButtons.forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      const range = this.getAttribute("data-range") || "7d";
      renderAnalyticsChart(range);
      showToast(`Đã cập nhật số liệu: ${this.textContent.trim()}`);
    });
  });

  exportBtn?.addEventListener("click", function () {
    showToast("📊 Đang tổng hợp và xuất tệp báo cáo StickerHub (CSV)...");
    setTimeout(() => {
      showToast("✅ Đã xuất thành công tệp: stickerhub_analytics_report.csv");
    }, 1200);
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
