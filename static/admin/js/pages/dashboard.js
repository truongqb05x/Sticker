/**
 * ========================================================
 * ADMIN DASHBOARD JAVASCRIPT - STICKERHUB
 * ========================================================
 * Xử lý biểu đồ xu hướng SVG lượn sóng, lọc & tìm kiếm danh sách
 * và các tác vụ phê duyệt / xóa bộ sưu tập thời gian thực qua REST API.
 */

document.addEventListener("DOMContentLoaded", function () {
  // 1. Khởi tạo Lucide Icons nếu có
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // ========================================================
  // 2. BIỂU ĐỒ XU HƯỚNG TẢI STICKER (SMOOTH SPLINE / WAVE CHART)
  // ========================================================

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

  // Bộ dữ liệu biểu đồ (cache client)
  const chartDataSets = {};

  // Parse dữ liệu biểu đồ ban đầu từ script tag SSR
  const initialDataElem = document.getElementById("initialChartData");
  if (initialDataElem) {
    try {
      const parsed = JSON.parse(initialDataElem.textContent);
      if (parsed && parsed.cols) {
        chartDataSets["7d"] = parsed;
      }
    } catch (e) {
      console.warn("Không thể nạp initialChartData:", e);
    }
  }

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

  // Hiển thị tooltip và neo điểm sáng tại mốc index
  function highlightWavePoint(index) {
    if (!currentPoints[index] || !currentDataset || !chartTooltip || !trendChartWrapper) return;

    const pt = currentPoints[index];
    const col = pt.col;

    // Cập nhật tooltip
    if (tooltipHeader) tooltipHeader.textContent = `${col.day} • ${col.date}`;
    if (tooltipNum) tooltipNum.textContent = col.downloads;
    if (tooltipBadge) tooltipBadge.textContent = `${col.change} so với mốc trước`;

    // Định vị tooltip
    const wrapperRect = trendChartWrapper.getBoundingClientRect();
    const areaRect = chartWaveArea.getBoundingClientRect();
    const scaleX = areaRect.width / 700;
    const scaleY = areaRect.height / 180;

    const actualPointX = pt.x * scaleX + (areaRect.left - wrapperRect.left);
    const actualPointY = pt.y * scaleY + (areaRect.top - wrapperRect.top);

    chartTooltip.style.left = `${actualPointX}px`;
    chartTooltip.style.top = `${actualPointY - 14}px`;
    chartTooltip.classList.add("active");

    // Di chuyển crosshair và active marker
    if (waveCrosshair) {
      waveCrosshair.setAttribute("x1", pt.x.toFixed(1));
      waveCrosshair.setAttribute("x2", pt.x.toFixed(1));
      waveCrosshair.classList.add("active");
    }

    if (waveActiveMarker) {
      waveActiveMarker.setAttribute("transform", `translate(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})`);
      waveActiveMarker.classList.add("active");
    }

    // Highlight nhãn trục X
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
    const yAxisContainer = document.getElementById("chartYAxis");
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

  // Tải dữ liệu biểu đồ qua REST API khi đổi mốc thời gian
  async function loadAndRenderChart(rangeKey) {
    if (chartDataSets[rangeKey]) {
      renderChart(rangeKey);
      return;
    }

    try {
      const res = await fetch(`/admin/api/dashboard/chart?range=${rangeKey}`);
      const resData = await res.json();
      if (res.ok && resData.success && resData.data) {
        chartDataSets[rangeKey] = resData.data;
        renderChart(rangeKey);
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu biểu đồ:", err);
    }
  }

  // Render khởi tạo biểu đồ
  if (chartDataSets["7d"]) {
    renderChart("7d");
  } else {
    loadAndRenderChart("7d");
  }

  // Đổi mốc thời gian khi nhấn nút filter
  chartPills.forEach(btn => {
    btn.addEventListener("click", function () {
      chartPills.forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      const range = this.getAttribute("data-range") || "7d";
      loadAndRenderChart(range);
    });
  });


  // ========================================================
  // 3. LỌC & TÌM KIẾM BỘ SƯU TẬP TRÊN BẢNG DỮ LIỆU
  // ========================================================

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


  // ========================================================
  // 4. PHÊ DUYỆT & XÓA BỘ SƯU TẬP QUA REST API
  // ========================================================

  const tableBody = document.getElementById("collectionsTableBody");
  if (tableBody) {
    tableBody.addEventListener("click", async function (e) {
      // Phê duyệt phát hành
      const approveBtn = e.target.closest(".btn-approve-pack");
      if (approveBtn) {
        e.preventDefault();
        const packId = approveBtn.getAttribute("data-id");
        const packTitle = approveBtn.getAttribute("data-title") || "Bộ sưu tập";

        approveBtn.disabled = true;
        try {
          const res = await fetch(`/admin/api/packs/${packId}/status`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify({ status: "active" })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            const row = document.getElementById(`pack-row-${packId}`);
            const statusCell = row?.querySelector(".status-cell");
            if (statusCell) {
              statusCell.innerHTML = `
                <span class="status-badge status-badge-active">
                  <i data-lucide="check-circle" style="width: 12px; height: 12px;"></i>
                  Công khai
                </span>
              `;
              if (window.lucide) window.lucide.createIcons();
            }
            approveBtn.remove();
            if (typeof window.showToast === "function") {
              window.showToast(`✅ Đã phê duyệt phát hành: ${packTitle}`);
            }
          } else {
            approveBtn.disabled = false;
            if (typeof window.showToast === "function") {
              window.showToast(`❌ ${data.message || "Phê duyệt thất bại!"}`);
            }
          }
        } catch (err) {
          approveBtn.disabled = false;
          console.error("Lỗi khi gửi yêu cầu phê duyệt:", err);
        }
        return;
      }

      // Xóa bộ sưu tập
      const deleteBtn = e.target.closest(".btn-delete-row");
      if (deleteBtn) {
        e.preventDefault();
        const packId = deleteBtn.getAttribute("data-id");
        const packTitle = deleteBtn.getAttribute("data-title") || "Bộ sưu tập";

        if (!confirm(`Bạn có chắc chắn muốn xóa bộ sưu tập "${packTitle}" khỏi hệ thống?`)) {
          return;
        }

        deleteBtn.disabled = true;
        try {
          const res = await fetch(`/admin/api/packs/${packId}`, {
            method: "DELETE",
            headers: { "Accept": "application/json" }
          });
          const data = await res.json();
          if (res.ok && data.success) {
            const row = document.getElementById(`pack-row-${packId}`);
            if (row) {
              row.style.transition = "all 0.3s ease";
              row.style.opacity = "0";
              row.style.transform = "translateX(20px)";
              setTimeout(() => row.remove(), 300);
            }

            // Giảm chỉ số thống kê trên UI
            const counter = document.getElementById("sidebarPacksCounter");
            if (counter) {
              const cur = parseInt(counter.textContent, 10);
              if (!isNaN(cur) && cur > 0) counter.textContent = cur - 1;
            }
            const kpi = document.getElementById("kpiTotalPacks");
            if (kpi) {
              const cur = parseInt(kpi.textContent, 10);
              if (!isNaN(cur) && cur > 0) kpi.textContent = cur - 1;
            }

            if (typeof window.showToast === "function") {
              window.showToast(`🗑️ ${data.message || "Đã xóa bộ sưu tập thành công!"}`);
            }
          } else {
            deleteBtn.disabled = false;
            if (typeof window.showToast === "function") {
              window.showToast(`❌ ${data.message || "Xóa thất bại!"}`);
            }
          }
        } catch (err) {
          deleteBtn.disabled = false;
          console.error("Lỗi khi gửi yêu cầu xóa:", err);
        }
      }
    });
  }
});
