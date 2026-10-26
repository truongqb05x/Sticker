/**
 * ========================================================
 * ADMIN BÁO CÁO & THỐNG KÊ (ANALYTICS) - JAVASCRIPT
 * Tương thích bộ lọc thời gian toàn diện (Hôm nay, 7 ngày, 30 ngày, Năm nay, Tất cả)
 * ========================================================
 */

document.addEventListener("DOMContentLoaded", function () {
  // 1. Khởi tạo Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
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

  // ========================================================
  // BỘ DỮ LIỆU ĐỒNG BỘ THEO MỐC THỜI GIAN
  // ========================================================

  // Dữ liệu 4 Thẻ KPI
  const kpiDataSets = {
    "today": {
      downloadsLabel: "Lượt tải hôm nay",
      downloadsVal: "15.98K",
      downloadsChange: "+8.4%",
      dailyLabel: "Lượt tải TB / giờ",
      dailyVal: "1,332",
      dailyChange: "+5.2%",
      topPackLabel: "Top #1 hôm nay",
      topPackName: "Cute Cats",
      topPackDownloads: "4.1K tải",
      trafficLabel: "Lưu lượng truy cập hôm nay",
      trafficVal: "32.0K",
      trafficChange: "+14.2%"
    },
    "7d": {
      downloadsLabel: "Lượt tải 7 ngày qua",
      downloadsVal: "169.8K",
      downloadsChange: "+18.2%",
      dailyLabel: "Lượt tải TB / ngày",
      dailyVal: "24,250",
      dailyChange: "+12.4%",
      topPackLabel: "Bộ sưu tập #1 Top",
      topPackName: "Cute Cats",
      topPackDownloads: "38.5K tải",
      trafficLabel: "Lưu lượng truy cập 7 ngày",
      trafficVal: "264.4K",
      trafficChange: "+22.6%"
    },
    "30d": {
      downloadsLabel: "Lượt tải 30 ngày qua",
      downloadsVal: "182.4K",
      downloadsChange: "+16.5%",
      dailyLabel: "Lượt tải TB / ngày",
      dailyVal: "6,080",
      dailyChange: "+10.2%",
      topPackLabel: "Bộ sưu tập #1 Top",
      topPackName: "Cute Cats",
      topPackDownloads: "62.8K tải",
      trafficLabel: "Lưu lượng truy cập 30 ngày",
      trafficVal: "342.8K",
      trafficChange: "+24.6%"
    },
    "year": {
      downloadsLabel: "Lượt tải năm nay",
      downloadsVal: "624.1K",
      downloadsChange: "+32.8%",
      dailyLabel: "Lượt tải TB / tháng",
      dailyVal: "52,008",
      dailyChange: "+21.4%",
      topPackLabel: "Bộ sưu tập #1 Năm nay",
      topPackName: "Cute Cats",
      topPackDownloads: "145.2K tải",
      trafficLabel: "Lưu lượng truy cập năm nay",
      trafficVal: "1.28M",
      trafficChange: "+44.2%"
    },
    "all": {
      downloadsLabel: "Tổng lượt tải toàn thời gian",
      downloadsVal: "1.85M",
      downloadsChange: "+58.4%",
      dailyLabel: "Lượt tải TB / năm",
      dailyVal: "462.5K",
      dailyChange: "+35.0%",
      topPackLabel: "Bộ sưu tập #1 Kỷ lục",
      topPackName: "Cute Cats",
      topPackDownloads: "386.4K tải",
      trafficLabel: "Tổng lưu lượng truy cập",
      trafficVal: "3.92M",
      trafficChange: "+62.1%"
    }
  };

  // Dữ liệu Biểu đồ Xu hướng Lượt tải
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
    },
    "all": {
      yLabels: ["800K", "600K", "400K", "200K", "0"],
      cols: [
        { label: "2023", day: "Năm 2023", date: "01/01 - 31/12/2023", downloads: "310,000", change: "+42.5%", height: "39%" },
        { label: "2024", day: "Năm 2024", date: "01/01 - 31/12/2024", downloads: "485,000", change: "+56.4%", height: "61%" },
        { label: "2025", day: "Năm 2025", date: "01/01 - 31/12/2025", downloads: "635,000", change: "+30.9%", height: "79%" },
        { label: "2026", day: "Năm 2026", date: "01/01 - 26/10/2026", downloads: "798,000", change: "+25.7% 🔥", height: "100%", highlight: true }
      ]
    }
  };

  // Dữ liệu Biểu đồ Lưu lượng truy cập hệ thống (chỉ thống kê lưu lượng)
  const trafficDataSets = {
    "today": {
      yLabels: ["10K", "7.5K", "5K", "2.5K", "0"],
      cols: [
        { label: "00h-04h", day: "Đêm muộn", date: "Hôm nay", traffic: "1,650", change: "+4.2%", height: "20%" },
        { label: "04h-08h", day: "Sáng sớm", date: "Hôm nay", traffic: "2,890", change: "+6.8%", height: "35%" },
        { label: "08h-12h", day: "Buổi sáng", date: "Hôm nay", traffic: "6,400", change: "+14.1%", height: "78%" },
        { label: "12h-16h", day: "Buổi chiều", date: "Hôm nay", traffic: "5,720", change: "-2.3%", height: "69%" },
        { label: "16h-20h", day: "Chiều tối", date: "Hôm nay", traffic: "8,100", change: "+18.9%", height: "98%", highlight: true },
        { label: "20h-24h", day: "Đêm", date: "Hôm nay", traffic: "7,240", change: "+11.5%", height: "87%" }
      ]
    },
    "7d": {
      yLabels: ["60K", "45K", "30K", "15K", "0"],
      cols: [
        { label: "T2", day: "Thứ Hai", date: "20/10/2026", traffic: "22,400", change: "+9.2%", height: "37%" },
        { label: "T3", day: "Thứ Ba", date: "21/10/2026", traffic: "28,900", change: "+14.5%", height: "48%" },
        { label: "T4", day: "Thứ Tư", date: "22/10/2026", traffic: "26,700", change: "-3.1%", height: "44%" },
        { label: "T5", day: "Thứ Năm", date: "23/10/2026", traffic: "38,200", change: "+18.4%", height: "64%" },
        { label: "T6", day: "Thứ Sáu", date: "24/10/2026", traffic: "46,500", change: "+25.8%", height: "77%" },
        { label: "T7", day: "Thứ Bảy", date: "25/10/2026", traffic: "42,800", change: "+21.3%", height: "71%" },
        { label: "CN", day: "Chủ Nhật", date: "26/10/2026", traffic: "58,900", change: "+38.5% 🔥", height: "98%", highlight: true }
      ]
    },
    "30d": {
      yLabels: ["90K", "68K", "45K", "23K", "0"],
      cols: [
        { label: "Tuần 1", day: "01/10 - 07/10", date: "Tuần 1", traffic: "52,400", change: "+11.2%", height: "58%" },
        { label: "Tuần 2", day: "08/10 - 14/10", date: "Tuần 2", traffic: "65,200", change: "+15.8%", height: "72%" },
        { label: "Tuần 3", day: "15/10 - 21/10", date: "Tuần 3", traffic: "88,400", change: "+28.4% 🔥", height: "98%", highlight: true },
        { label: "Tuần 4", day: "22/10 - 28/10", date: "Tuần 4", traffic: "71,500", change: "+19.1%", height: "79%" }
      ]
    },
    "year": {
      yLabels: ["300K", "225K", "150K", "75K", "0"],
      cols: [
        { label: "Q1", day: "Quý 1", date: "T1 - T3", traffic: "168,000", change: "+14.6%", height: "56%" },
        { label: "Q2", day: "Quý 2", date: "T4 - T6", traffic: "218,000", change: "+22.4%", height: "73%" },
        { label: "Q3", day: "Quý 3", date: "T7 - T9", traffic: "252,000", change: "+18.8%", height: "84%" },
        { label: "Q4", day: "Quý 4", date: "T10 - T12", traffic: "298,000", change: "+31.2% 🔥", height: "99%", highlight: true }
      ]
    },
    "all": {
      yLabels: ["1.6M", "1.2M", "800K", "400K", "0"],
      cols: [
        { label: "2023", day: "Năm 2023", date: "01/01 - 31/12/2023", traffic: "640,000", change: "+52.1%", height: "40%" },
        { label: "2024", day: "Năm 2024", date: "01/01 - 31/12/2024", traffic: "980,000", change: "+53.1%", height: "61%" },
        { label: "2025", day: "Năm 2025", date: "01/01 - 31/12/2025", traffic: "1,320,000", change: "+34.7%", height: "82%" },
        { label: "2026", day: "Năm 2026", date: "01/01 - 26/10/2026", traffic: "1,580,000", change: "+19.7% 🔥", height: "99%", highlight: true }
      ]
    }
  };

  // Dữ liệu Bảng Top Bộ Sưu Tập
  const topPacksDataSets = {
    "today": {
      note: "(Hôm nay)",
      items: [
        { thumb: "../../assets/pack_cats.jpg", title: "Cute Cats", author: "MiuMiu Studio", cat: "Động vật", count: 120, downloads: "4.1K", likes: "320" },
        { thumb: "../../assets/stickers/cat_02.svg", title: "Sweet Couple", author: "LoveStory", cat: "Tình yêu", count: 50, downloads: "3.2K", likes: "240" },
        { thumb: "../../assets/pack_anime.jpg", title: "Anime Girls", author: "Sakura Art", cat: "Anime & Manga", count: 96, downloads: "2.9K", likes: "190" },
        { thumb: "../../assets/pack_onepiece.svg", title: "One Piece Wano", author: "OtakuZone", cat: "Anime & Manga", count: 83, downloads: "2.4K", likes: "180" },
        { thumb: "../../assets/thumb_anime.svg", title: "Chibi Heroes", author: "ComicChibi", cat: "Chibi", count: 64, downloads: "1.8K", likes: "110" }
      ]
    },
    "7d": {
      note: "(7 ngày qua)",
      items: [
        { thumb: "../../assets/pack_cats.jpg", title: "Cute Cats", author: "MiuMiu Studio", cat: "Động vật", count: 120, downloads: "38.5K", likes: "2.4K" },
        { thumb: "../../assets/pack_anime.jpg", title: "Anime Girls", author: "Sakura Art", cat: "Anime & Manga", count: 96, downloads: "25.3K", likes: "1.8K" },
        { thumb: "../../assets/pack_onepiece.svg", title: "One Piece Wano", author: "OtakuZone", cat: "Anime & Manga", count: 83, downloads: "22.4K", likes: "1.5K" },
        { thumb: "../../assets/stickers/cat_02.svg", title: "Sweet Couple", author: "LoveStory", cat: "Tình yêu", count: 50, downloads: "21.2K", likes: "1.4K" },
        { thumb: "../../assets/thumb_anime.svg", title: "Chibi Heroes", author: "ComicChibi", cat: "Chibi", count: 64, downloads: "19.8K", likes: "1.1K" }
      ]
    },
    "30d": {
      note: "(30 ngày qua)",
      items: [
        { thumb: "../../assets/pack_cats.jpg", title: "Cute Cats", author: "MiuMiu Studio", cat: "Động vật", count: 120, downloads: "62.8K", likes: "4.8K" },
        { thumb: "../../assets/pack_anime.jpg", title: "Anime Girls", author: "Sakura Art", cat: "Anime & Manga", count: 96, downloads: "42.1K", likes: "3.2K" },
        { thumb: "../../assets/stickers/cat_02.svg", title: "Sweet Couple", author: "LoveStory", cat: "Tình yêu", count: 50, downloads: "36.4K", likes: "2.9K" },
        { thumb: "../../assets/pack_onepiece.svg", title: "One Piece Wano", author: "OtakuZone", cat: "Anime & Manga", count: 83, downloads: "31.8K", likes: "2.4K" },
        { thumb: "../../assets/thumb_anime.svg", title: "Chibi Heroes", author: "ComicChibi", cat: "Chibi", count: 64, downloads: "28.5K", likes: "2.0K" }
      ]
    },
    "year": {
      note: "(Năm nay)",
      items: [
        { thumb: "../../assets/pack_cats.jpg", title: "Cute Cats", author: "MiuMiu Studio", cat: "Động vật", count: 120, downloads: "145.2K", likes: "11.2K" },
        { thumb: "../../assets/pack_anime.jpg", title: "Anime Girls", author: "Sakura Art", cat: "Anime & Manga", count: 96, downloads: "112.4K", likes: "8.6K" },
        { thumb: "../../assets/pack_onepiece.svg", title: "One Piece Wano", author: "OtakuZone", cat: "Anime & Manga", count: 83, downloads: "96.5K", likes: "7.4K" },
        { thumb: "../../assets/stickers/cat_02.svg", title: "Sweet Couple", author: "LoveStory", cat: "Tình yêu", count: 50, downloads: "88.0K", likes: "6.8K" },
        { thumb: "../../assets/thumb_anime.svg", title: "Chibi Heroes", author: "ComicChibi", cat: "Chibi", count: 64, downloads: "75.3K", likes: "5.2K" }
      ]
    },
    "all": {
      note: "(Toàn thời gian)",
      items: [
        { thumb: "../../assets/pack_cats.jpg", title: "Cute Cats", author: "MiuMiu Studio", cat: "Động vật", count: 120, downloads: "386.4K", likes: "28.5K" },
        { thumb: "../../assets/pack_anime.jpg", title: "Anime Girls", author: "Sakura Art", cat: "Anime & Manga", count: 96, downloads: "294.2K", likes: "21.8K" },
        { thumb: "../../assets/pack_onepiece.svg", title: "One Piece Wano", author: "OtakuZone", cat: "Anime & Manga", count: 83, downloads: "245.0K", likes: "18.2K" },
        { thumb: "../../assets/stickers/cat_02.svg", title: "Sweet Couple", author: "LoveStory", cat: "Tình yêu", count: 50, downloads: "210.8K", likes: "15.6K" },
        { thumb: "../../assets/thumb_anime.svg", title: "Chibi Heroes", author: "ComicChibi", cat: "Chibi", count: 64, downloads: "188.6K", likes: "13.4K" }
      ]
    }
  };

  // ========================================================
  // RENDER HÀM CẬP NHẬT GIAO DIỆN
  // ========================================================

  // Cập nhật 4 Thẻ KPI
  function renderKPIs(rangeKey) {
    const kpi = kpiDataSets[rangeKey];
    if (!kpi) return;

    if (kpiDownloadsLabel) kpiDownloadsLabel.textContent = kpi.downloadsLabel;
    if (kpiDownloadsVal) kpiDownloadsVal.textContent = kpi.downloadsVal;
    if (kpiDownloadsChange) kpiDownloadsChange.textContent = kpi.downloadsChange;

    if (kpiDailyLabel) kpiDailyLabel.textContent = kpi.dailyLabel;
    if (kpiDailyVal) kpiDailyVal.textContent = kpi.dailyVal;
    if (kpiDailyChange) kpiDailyChange.textContent = kpi.dailyChange;

    if (kpiTopPackLabel) kpiTopPackLabel.textContent = kpi.topPackLabel;
    if (kpiTopPackName) kpiTopPackName.textContent = kpi.topPackName;
    if (kpiTopPackDownloads) kpiTopPackDownloads.textContent = kpi.topPackDownloads;

    if (kpiTrafficLabel) kpiTrafficLabel.textContent = kpi.trafficLabel;
    if (kpiTrafficVal) kpiTrafficVal.textContent = kpi.trafficVal;
    if (kpiTrafficChange) kpiTrafficChange.textContent = kpi.trafficChange;
  }

  // Cập nhật Bảng Top Bộ Sưu Tập
  function renderTopPacksTable(rangeKey) {
    const tableData = topPacksDataSets[rangeKey];
    if (!tableData || !topPacksTableBody) return;

    if (tableTimeframeNote) {
      tableTimeframeNote.textContent = tableData.note;
    }

    topPacksTableBody.innerHTML = tableData.items.map(pack => `
      <tr>
        <td>
          <div class="table-pack-cell">
            <img src="${pack.thumb}" alt="${pack.title}" class="table-pack-thumb">
            <div>
              <div class="table-pack-title">${pack.title}</div>
              <div class="table-pack-sub">Tác giả: ${pack.author}</div>
            </div>
          </div>
        </td>
        <td><span class="cat-pill">${pack.cat}</span></td>
        <td><strong>${pack.count}</strong> sticker</td>
        <td><strong style="color: #C45832;">${pack.downloads}</strong></td>
        <td><strong>${pack.likes}</strong></td>
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
    // Ẩn thông tin biểu đồ bên kia nếu đang hiện
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

  function renderAnalyticsChart(rangeKey) {
    const dataset = analyticsDataSets[rangeKey];
    if (!dataset || !chartWaveSvg) return;

    currentAnalyticsDataset = dataset;

    const yAxisContainer = document.querySelector("#analyticsYAxis");
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

    currentAnalyticsPoints = dataset.cols.map((col, i) => {
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
      chartTriggersLayer.innerHTML = dataset.cols.map((col, i) => `
        <div class="wave-trigger-col ${col.highlight ? 'highlight' : ''}" data-index="${i}"></div>
      `).join("");
    }

    if (chartXAxis) {
      chartXAxis.innerHTML = dataset.cols.map((col, i) => `
        <div class="wave-x-label">
          <span class="wave-x-tag ${col.highlight ? 'highlight' : ''}" data-index="${i}">${col.label}</span>
        </div>
      `).join("");
    }

    bindAnalyticsWaveInteractions();

    // Mặc định ban đầu ẩn thông tin, chỉ hiện khi người dùng rê chuột
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
    // Ẩn thông tin biểu đồ bên kia nếu đang hiện
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

  function renderTrafficChart(rangeKey) {
    const dataset = trafficDataSets[rangeKey];
    if (!dataset || !trafficWaveSvg) return;

    currentTrafficDataset = dataset;

    if (trafficYAxis && dataset.yLabels) {
      trafficYAxis.innerHTML = dataset.yLabels
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

    currentTrafficPoints = dataset.cols.map((col, i) => {
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
      trafficTriggersLayer.innerHTML = dataset.cols.map((col, i) => `
        <div class="wave-trigger-col ${col.highlight ? 'highlight' : ''}" data-index="${i}"></div>
      `).join("");
    }

    if (trafficXAxis) {
      trafficXAxis.innerHTML = dataset.cols.map((col, i) => `
        <div class="wave-x-label">
          <span class="wave-x-tag ${col.highlight ? 'highlight' : ''}" data-index="${i}">${col.label}</span>
        </div>
      `).join("");
    }

    bindTrafficWaveInteractions();

    // Mặc định ban đầu ẩn thông tin, chỉ hiện khi người dùng rê chuột
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

  // Khởi tạo hiển thị ban đầu cho 2 biểu đồ (không bật tooltip trước)
  renderAnalyticsChart("7d");
  renderTrafficChart("7d");

  // ========================================================
  // BẮT SỰ KIỆN CLICK BỘ LỌC THỜI GIAN
  // ========================================================
  timeframeButtons.forEach(btn => {
    btn.addEventListener("click", function () {
      timeframeButtons.forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      const range = this.getAttribute("data-range") || "7d";

      // 1. Cập nhật 4 Thẻ KPI
      renderKPIs(range);

      // 2. Cập nhật Biểu đồ Xu hướng Tải
      renderAnalyticsChart(range);

      // 3. Cập nhật Biểu đồ Lưu lượng truy cập
      renderTrafficChart(range);

      // 4. Cập nhật Bảng Top Bộ Sưu Tập
      renderTopPacksTable(range);

      // Thông báo Toast
      showToast(`Đã đồng bộ thống kê: ${this.textContent.trim()}`);
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
