/**
 * ========================================================
 * ADMIN BÁO CÁO & THỐNG KÊ (ANALYTICS) - JAVASCRIPT
 * Tích hợp REST API CSDL thực, hỗ trợ các mốc thời gian:
 * Hôm nay, 7 ngày, 30 ngày, Năm nay, Tất cả
 * ========================================================
 */

// Chống tấn công XSS khi render chuỗi động
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

  // Helper hiển thị thông báo dùng chung từ utils/showToast.js
  function notify(msg) {
    if (typeof window.showToast === "function") {
      window.showToast(msg);
    } else if (typeof showToast === "function") {
      showToast(msg);
    } else {
      console.log("[Toast]", msg);
    }
  }

  // 2. Elements Biểu đồ Xu hướng Tải (Wave Chart)
  const chartWrapper = document.getElementById("analyticsTrendWrapper");
  const chartWaveArea = document.getElementById("analyticsWaveArea");
  const chartWaveSvg = document.getElementById("analyticsWaveSvg");
  const waveAreaPath = document.getElementById("analyticsWaveAreaPath");
  const waveLinePath = document.getElementById("analyticsWaveLinePath");
  const waveCrosshair = document.getElementById("analyticsCrosshair");
  const waveActiveMarker = document.getElementById("analyticsActiveMarker");
  const waveDotsGroup = document.getElementById("analyticsDotsGroup");
  const chartTriggersLayer = document.getElementById("analyticsTriggersLayer");
  const chartXAxis = document.getElementById("analyticsXAxis");
  const chartTooltip = document.getElementById("analyticsHoverTooltip");
  const tooltipHeader = document.getElementById("tooltipHeader");
  const tooltipNum = document.getElementById("tooltipNum");
  const tooltipBadge = document.getElementById("tooltipBadge");
  const timeframeButtons = document.querySelectorAll(".timeframe-btn");

  // 3. Elements KPI Cards
  const kpiDownloadsLabel = document.getElementById("kpiDownloadsLabel");
  const kpiDownloadsVal = document.getElementById("kpiDownloadsVal");
  const kpiDownloadsChange = document.getElementById("kpiDownloadsChange");
  const kpiDownloadsBadge = document.getElementById("kpiDownloadsBadge");

  const kpiDailyLabel = document.getElementById("kpiDailyLabel");
  const kpiDailyVal = document.getElementById("kpiDailyVal");
  const kpiDailyChange = document.getElementById("kpiDailyChange");
  const kpiDailyBadge = document.getElementById("kpiDailyBadge");

  const kpiTopPackLabel = document.getElementById("kpiTopPackLabel");
  const kpiTopPackName = document.getElementById("kpiTopPackName");
  const kpiTopPackDownloads = document.getElementById("kpiTopPackDownloads");

  const kpiTrafficLabel = document.getElementById("kpiTrafficLabel");
  const kpiTrafficVal = document.getElementById("kpiTrafficVal");
  const kpiTrafficChange = document.getElementById("kpiTrafficChange");
  const kpiTrafficBadge = document.getElementById("kpiTrafficBadge");

  // 4. Elements Biểu đồ Traffic (Wave Chart)
  const trafficWrapper = document.getElementById("trafficChartWrapper");
  const trafficWaveArea = document.getElementById("trafficWaveArea");
  const trafficWaveSvg = document.getElementById("trafficWaveSvg");
  const trafficWaveAreaPath = document.getElementById("trafficWaveAreaPath");
  const trafficWaveLinePath = document.getElementById("trafficWaveLinePath");
  const trafficCrosshair = document.getElementById("trafficCrosshair");
  const trafficActiveMarker = document.getElementById("trafficActiveMarker");
  const trafficDotsGroup = document.getElementById("trafficDotsGroup");
  const trafficTriggersLayer = document.getElementById("trafficTriggersLayer");
  const trafficXAxis = document.getElementById("trafficXAxis");
  const trafficTooltip = document.getElementById("trafficHoverTooltip");
  const trafficTooltipHeader = document.getElementById("trafficTooltipHeader");
  const trafficTooltipVal = document.getElementById("trafficTooltipVal");
  const trafficTooltipBadge = document.getElementById("trafficTooltipBadge");
  const trafficYAxis = document.getElementById("trafficYAxis");

  // 5. Elements Bảng Top Bộ Sưu Tập
  const tableTimeframeNote = document.getElementById("tableTimeframeNote");
  const topPacksTableBody = document.getElementById("topPacksTableBody");

  // Bộ nhớ cache tạm thời theo mốc thời gian để chuyển tab tức thì
  const statsCache = {};

  // ========================================================
  // RENDER HÀM CẬP NHẬT GIAO DIỆN
  // ========================================================

  // Cập nhật 4 Thẻ KPI
  function renderKPIs(kpi) {
    if (!kpi) return;

    if (kpiDownloadsLabel) kpiDownloadsLabel.textContent = kpi.downloadsLabel || "Lượt tải";
    if (kpiDownloadsVal) kpiDownloadsVal.textContent = kpi.downloadsVal || "0";
    if (kpiDownloadsChange) kpiDownloadsChange.textContent = kpi.downloadsChange || "+0%";
    if (kpiDownloadsBadge) {
      const isDown = (kpi.downloadsChange || "").includes("-");
      kpiDownloadsBadge.className = `analytic-badge ${isDown ? "badge-growth-down" : "badge-growth-up"}`;
    }

    if (kpiDailyLabel) kpiDailyLabel.textContent = kpi.dailyLabel || "Lượt tải TB";
    if (kpiDailyVal) kpiDailyVal.textContent = kpi.dailyVal || "0";
    if (kpiDailyChange) kpiDailyChange.textContent = kpi.dailyChange || "+0%";
    if (kpiDailyBadge) {
      const isDown = (kpi.dailyChange || "").includes("-");
      kpiDailyBadge.className = `analytic-badge ${isDown ? "badge-growth-down" : "badge-growth-up"}`;
    }

    if (kpiTopPackLabel) kpiTopPackLabel.textContent = kpi.topPackLabel || "Top #1";
    if (kpiTopPackName) kpiTopPackName.textContent = kpi.topPackName || "---";
    if (kpiTopPackDownloads) kpiTopPackDownloads.textContent = kpi.topPackDownloads || "0 tải";

    if (kpiTrafficLabel) kpiTrafficLabel.textContent = kpi.trafficLabel || "Lưu lượng truy cập";
    if (kpiTrafficVal) kpiTrafficVal.textContent = kpi.trafficVal || "0";
    if (kpiTrafficChange) kpiTrafficChange.textContent = kpi.trafficChange || "+0%";
    if (kpiTrafficBadge) {
      const isDown = (kpi.trafficChange || "").includes("-");
      kpiTrafficBadge.className = `analytic-badge ${isDown ? "badge-growth-down" : "badge-growth-up"}`;
    }
  }

  // Cập nhật Bảng Top Bộ Sưu Tập
  function renderTopPacksTable(items, note) {
    if (tableTimeframeNote && note) {
      tableTimeframeNote.textContent = note;
    }
    if (!topPacksTableBody) return;

    if (!items || items.length === 0) {
      topPacksTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 32px; color: #A89A90;">
            Chưa có dữ liệu thống kê cho mốc thời gian này
          </td>
        </tr>
      `;
      return;
    }

    topPacksTableBody.innerHTML = items.map(pack => `
      <tr>
        <td>
          <div class="table-pack-cell">
            <img src="${escapeHtml(pack.thumb)}" alt="${escapeHtml(pack.title)}" class="table-pack-thumb" onerror="this.src='../../assets/pack_cats.jpg'">
            <div>
              <div class="table-pack-title">${escapeHtml(pack.title)}</div>
              <div class="table-pack-sub">Tác giả: ${escapeHtml(pack.author)}</div>
            </div>
          </div>
        </td>
        <td><span class="cat-pill">${escapeHtml(pack.cat)}</span></td>
        <td><strong>${escapeHtml(pack.count)}</strong> sticker</td>
        <td><strong style="color: #C45832;">${escapeHtml(pack.downloads)}</strong></td>
        <td><strong>${escapeHtml(pack.likes)}</strong></td>
      </tr>
    `).join("");
  }

  // ========================================================
  // XỬ LÝ 2 BIỂU ĐỒ LƯỢN SÓNG (SMOOTH SPLINE WAVE CHARTS)
  // ========================================================

  let currentAnalyticsPoints = [];
  let currentAnalyticsDataset = null;

  let currentTrafficPoints = [];
  let currentTrafficDataset = null;

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

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;

      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  }

  // --- 1. BIỂU ĐỒ XU HƯỚNG LƯỢT TẢI ---
  function highlightAnalyticsPoint(index) {
    hideTrafficHighlight();

    if (!currentAnalyticsPoints[index] || !currentAnalyticsDataset || !chartTooltip || !chartWrapper) return;

    const pt = currentAnalyticsPoints[index];
    const col = currentAnalyticsDataset.cols[index];

    if (tooltipHeader) tooltipHeader.textContent = `${col.day} • ${col.date}`;
    if (tooltipNum) tooltipNum.textContent = col.downloads;
    if (tooltipBadge) {
      tooltipBadge.textContent = `${col.change} so với kỳ trước`;
      tooltipBadge.style.color = col.change.includes("-") ? "#F87171" : "#4ADE80";
    }

    if (waveCrosshair) {
      waveCrosshair.setAttribute("x1", pt.x.toFixed(1));
      waveCrosshair.setAttribute("x2", pt.x.toFixed(1));
      waveCrosshair.classList.add("active");
    }

    if (waveActiveMarker) {
      waveActiveMarker.setAttribute("transform", `translate(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})`);
      waveActiveMarker.classList.add("active");
    }

    const svgRect = chartWaveSvg ? chartWaveSvg.getBoundingClientRect() : chartWrapper.getBoundingClientRect();
    const wrapperRect = chartWrapper.getBoundingClientRect();

    const realPixelX = (svgRect.left - wrapperRect.left) + (pt.x / 700) * svgRect.width;
    const realPixelY = (svgRect.top - wrapperRect.top) + (pt.y / 180) * svgRect.height;

    const safeLeft = Math.max(70, Math.min(realPixelX, wrapperRect.width - 70));
    const safeTop = Math.max(10, realPixelY - 14);

    chartTooltip.style.left = `${safeLeft}px`;
    chartTooltip.style.top = `${safeTop}px`;
    chartTooltip.classList.add("active");

    const xTags = chartXAxis?.querySelectorAll(".wave-x-tag") || [];
    xTags.forEach((tag, i) => tag.classList.toggle("hover-focus", i === index));

    const triggers = chartTriggersLayer?.querySelectorAll(".wave-trigger-col") || [];
    triggers.forEach((trg, i) => trg.classList.toggle("hover-focus", i === index));
  }

  function hideAnalyticsHighlight() {
    if (waveCrosshair) waveCrosshair.classList.remove("active");
    if (waveActiveMarker) waveActiveMarker.classList.remove("active");
    if (chartTooltip) chartTooltip.classList.remove("active");

    const xTags = chartXAxis?.querySelectorAll(".wave-x-tag") || [];
    xTags.forEach(tag => tag.classList.remove("hover-focus"));

    const triggers = chartTriggersLayer?.querySelectorAll(".wave-trigger-col") || [];
    triggers.forEach(trg => trg.classList.remove("hover-focus"));
  }

  function renderAnalyticsChart(dataset) {
    if (!dataset || !chartWaveSvg) return;

    currentAnalyticsDataset = dataset;

    const yAxisContainer = document.querySelector("#analyticsYAxis");
    if (yAxisContainer && dataset.yLabels) {
      yAxisContainer.innerHTML = dataset.yLabels
        .map(lbl => `<span class="y-label">${escapeHtml(lbl)}</span>`)
        .join("");
    }

    const cols = dataset.cols || [];
    const n = cols.length;
    const margin = 45;
    const totalW = 700;
    const baseY = 162;
    const minY = 24;
    const availableH = baseY - minY;
    const stepX = n > 1 ? (totalW - 2 * margin) / (n - 1) : 0;

    currentAnalyticsPoints = cols.map((col, i) => {
      const heightPercent = parseFloat(col.height) || 0;
      const x = n > 1 ? margin + i * stepX : totalW / 2;
      const y = baseY - (heightPercent / 100) * availableH;
      return { x, y, col, index: i };
    });

    const lineD = buildSplinePath(currentAnalyticsPoints);
    const areaD = currentAnalyticsPoints.length > 0
      ? `${lineD} L ${currentAnalyticsPoints[currentAnalyticsPoints.length - 1].x.toFixed(1)} ${baseY} L ${currentAnalyticsPoints[0].x.toFixed(1)} ${baseY} Z`
      : "";

    if (waveLinePath) waveLinePath.setAttribute("d", lineD);
    if (waveAreaPath) waveAreaPath.setAttribute("d", areaD);

    if (waveDotsGroup) {
      waveDotsGroup.innerHTML = currentAnalyticsPoints.map(pt => `
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

    if (chartTriggersLayer) {
      chartTriggersLayer.innerHTML = cols.map((col, i) => `
        <div class="wave-trigger-col ${col.highlight ? 'highlight' : ''}" data-index="${i}"></div>
      `).join("");
    }

    if (chartXAxis) {
      chartXAxis.innerHTML = cols.map((col, i) => `
        <div class="wave-x-label">
          <span class="wave-x-tag ${col.highlight ? 'highlight' : ''}" data-index="${i}">${escapeHtml(col.label)}</span>
        </div>
      `).join("");
    }

    bindAnalyticsWaveInteractions();
    hideAnalyticsHighlight();
  }

  function bindAnalyticsWaveInteractions() {
    const triggers = chartTriggersLayer?.querySelectorAll(".wave-trigger-col") || [];
    triggers.forEach(trg => {
      const idx = parseInt(trg.getAttribute("data-index"), 10);
      trg.addEventListener("mouseenter", () => highlightAnalyticsPoint(idx));
      trg.addEventListener("mousemove", () => highlightAnalyticsPoint(idx));
      trg.addEventListener("touchstart", () => highlightAnalyticsPoint(idx), { passive: true });
    });

    if (chartWaveArea) {
      chartWaveArea.addEventListener("mouseleave", () => {
        hideAnalyticsHighlight();
      });
    }
  }

  // --- 2. BIỂU ĐỒ LƯU LƯỢNG TRUY CẬP (TRAFFIC) ---
  function highlightTrafficPoint(index) {
    hideAnalyticsHighlight();

    if (!currentTrafficPoints[index] || !currentTrafficDataset || !trafficTooltip || !trafficWrapper) return;

    const pt = currentTrafficPoints[index];
    const col = currentTrafficDataset.cols[index];

    if (trafficTooltipHeader) trafficTooltipHeader.textContent = `${col.day} • ${col.date}`;
    if (trafficTooltipVal) trafficTooltipVal.textContent = col.traffic;
    if (trafficTooltipBadge) {
      trafficTooltipBadge.textContent = `${col.change} so với trước`;
      trafficTooltipBadge.style.color = col.change.includes("-") ? "#F87171" : "#4ADE80";
    }

    if (trafficCrosshair) {
      trafficCrosshair.setAttribute("x1", pt.x.toFixed(1));
      trafficCrosshair.setAttribute("x2", pt.x.toFixed(1));
      trafficCrosshair.classList.add("active");
    }

    if (trafficActiveMarker) {
      trafficActiveMarker.setAttribute("transform", `translate(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})`);
      trafficActiveMarker.classList.add("active");
    }

    const svgRect = trafficWaveSvg ? trafficWaveSvg.getBoundingClientRect() : trafficWrapper.getBoundingClientRect();
    const wrapperRect = trafficWrapper.getBoundingClientRect();

    const realPixelX = (svgRect.left - wrapperRect.left) + (pt.x / 700) * svgRect.width;
    const realPixelY = (svgRect.top - wrapperRect.top) + (pt.y / 180) * svgRect.height;

    const safeLeft = Math.max(70, Math.min(realPixelX, wrapperRect.width - 70));
    const safeTop = Math.max(10, realPixelY - 14);

    trafficTooltip.style.left = `${safeLeft}px`;
    trafficTooltip.style.top = `${safeTop}px`;
    trafficTooltip.classList.add("active");

    const xTags = trafficXAxis?.querySelectorAll(".wave-x-tag") || [];
    xTags.forEach((tag, i) => tag.classList.toggle("hover-focus", i === index));

    const triggers = trafficTriggersLayer?.querySelectorAll(".wave-trigger-col") || [];
    triggers.forEach((trg, i) => trg.classList.toggle("hover-focus", i === index));
  }

  function hideTrafficHighlight() {
    if (trafficCrosshair) trafficCrosshair.classList.remove("active");
    if (trafficActiveMarker) trafficActiveMarker.classList.remove("active");
    if (trafficTooltip) trafficTooltip.classList.remove("active");

    const xTags = trafficXAxis?.querySelectorAll(".wave-x-tag") || [];
    xTags.forEach(tag => tag.classList.remove("hover-focus"));

    const triggers = trafficTriggersLayer?.querySelectorAll(".wave-trigger-col") || [];
    triggers.forEach(trg => trg.classList.remove("hover-focus"));
  }

  function renderTrafficChart(dataset) {
    if (!dataset || !trafficWaveSvg) return;

    currentTrafficDataset = dataset;

    if (trafficYAxis && dataset.yLabels) {
      trafficYAxis.innerHTML = dataset.yLabels
        .map(lbl => `<span class="y-label">${escapeHtml(lbl)}</span>`)
        .join("");
    }

    const cols = dataset.cols || [];
    const n = cols.length;
    const margin = 45;
    const totalW = 700;
    const baseY = 162;
    const minY = 24;
    const availableH = baseY - minY;
    const stepX = n > 1 ? (totalW - 2 * margin) / (n - 1) : 0;

    currentTrafficPoints = cols.map((col, i) => {
      const heightPercent = parseFloat(col.height) || 0;
      const x = n > 1 ? margin + i * stepX : totalW / 2;
      const y = baseY - (heightPercent / 100) * availableH;
      return { x, y, col, index: i };
    });

    const lineD = buildSplinePath(currentTrafficPoints);
    const areaD = currentTrafficPoints.length > 0
      ? `${lineD} L ${currentTrafficPoints[currentTrafficPoints.length - 1].x.toFixed(1)} ${baseY} L ${currentTrafficPoints[0].x.toFixed(1)} ${baseY} Z`
      : "";

    if (trafficWaveLinePath) trafficWaveLinePath.setAttribute("d", lineD);
    if (trafficWaveAreaPath) trafficWaveAreaPath.setAttribute("d", areaD);

    if (trafficDotsGroup) {
      trafficDotsGroup.innerHTML = currentTrafficPoints.map(pt => `
        <circle class="wave-dot ${pt.col.highlight ? 'highlight' : ''}" 
                cx="${pt.x.toFixed(1)}" 
                cy="${pt.y.toFixed(1)}" 
                r="${pt.col.highlight ? 5.5 : 4}" 
                fill="#FFFFFF" 
                stroke="#2563EB" 
                stroke-width="${pt.col.highlight ? 3 : 2.5}" 
                data-index="${pt.index}"></circle>
      `).join("");
    }

    if (trafficTriggersLayer) {
      trafficTriggersLayer.innerHTML = cols.map((col, i) => `
        <div class="wave-trigger-col ${col.highlight ? 'highlight' : ''}" data-index="${i}"></div>
      `).join("");
    }

    if (trafficXAxis) {
      trafficXAxis.innerHTML = cols.map((col, i) => `
        <div class="wave-x-label">
          <span class="wave-x-tag ${col.highlight ? 'highlight' : ''}" data-index="${i}">${escapeHtml(col.label)}</span>
        </div>
      `).join("");
    }

    bindTrafficWaveInteractions();
    hideTrafficHighlight();
  }

  function bindTrafficWaveInteractions() {
    const triggers = trafficTriggersLayer?.querySelectorAll(".wave-trigger-col") || [];
    triggers.forEach(trg => {
      const idx = parseInt(trg.getAttribute("data-index"), 10);
      trg.addEventListener("mouseenter", () => highlightTrafficPoint(idx));
      trg.addEventListener("mousemove", () => highlightTrafficPoint(idx));
      trg.addEventListener("touchstart", () => highlightTrafficPoint(idx), { passive: true });
    });

    if (trafficWaveArea) {
      trafficWaveArea.addEventListener("mouseleave", () => {
        hideTrafficHighlight();
      });
    }
  }

  // ========================================================
  // TẢI VÀ ĐỒNG BỘ DỮ LIỆU TỪ REST API
  // ========================================================

  async function loadStats(rangeKey, showFeedback = true) {
    try {
      // 1. Kiểm tra cache
      if (statsCache[rangeKey]) {
        applyStatsData(statsCache[rangeKey]);
        if (showFeedback) {
          const btn = document.querySelector(`.timeframe-btn[data-range="${rangeKey}"]`);
          notify(`Đã đồng bộ thống kê: ${btn ? btn.textContent.trim() : rangeKey}`);
        }
        return;
      }

      // 2. Fetch dữ liệu từ API thực
      const res = await fetch(`/admin/api/stats?range=${encodeURIComponent(rangeKey)}`);
      const result = await res.json();

      if (!result.success) {
        throw new Error(result.message || "Không thể tải số liệu thống kê");
      }

      statsCache[rangeKey] = result;
      applyStatsData(result);

      if (showFeedback) {
        const btn = document.querySelector(`.timeframe-btn[data-range="${rangeKey}"]`);
        notify(`Đã đồng bộ thống kê: ${btn ? btn.textContent.trim() : rangeKey}`);
      }
    } catch (err) {
      console.error("Lỗi khi tải số liệu thống kê:", err);
      notify("❌ Lỗi kết nối khi tải số liệu thống kê!");
    }
  }

  function applyStatsData(data) {
    if (!data) return;

    // 1. Cập nhật 4 thẻ KPI
    renderKPIs(data.kpis);

    // 2. Cập nhật Biểu đồ Xu hướng Tải
    renderAnalyticsChart(data.downloads_chart);

    // 3. Cập nhật Biểu đồ Lưu lượng truy cập
    renderTrafficChart(data.traffic_chart);

    // 4. Cập nhật Bảng Top Bộ Sưu Tập
    renderTopPacksTable(data.top_packs, data.note);

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // ========================================================
  // KHỞI TẠO DỮ LIỆU BAN ĐẦU
  // ========================================================
  const initialScript = document.getElementById("initialStatsData");
  if (initialScript && initialScript.textContent.trim()) {
    try {
      const initialData = JSON.parse(initialScript.textContent);
      const range = initialData.range || "7d";
      statsCache[range] = initialData;
      // Khởi tạo các đường cong SVG của biểu đồ
      renderAnalyticsChart(initialData.downloads_chart);
      renderTrafficChart(initialData.traffic_chart);
    } catch (e) {
      console.warn("Không thể parse dữ liệu initialStatsData, tải lại qua API:", e);
      loadStats("7d", false);
    }
  } else {
    loadStats("7d", false);
  }

  // ========================================================
  // BẮT SỰ KIỆN CLICK BỘ LỌC THỜI GIAN
  // ========================================================
  timeframeButtons.forEach(btn => {
    btn.addEventListener("click", function () {
      timeframeButtons.forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      const range = this.getAttribute("data-range") || "7d";
      loadStats(range, true);
    });
  });
});
