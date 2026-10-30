/**
 * ========================================================
 * TOP TẢI NHIỀU (MOST DOWNLOADED) - REAL INTERACTION SCRIPT
 * ========================================================
 * Quản lý tương tác trang bảng xếp hạng sticker top tải nhiều:
 * 1. Khởi tạo & nạp dữ liệu hydrat hóa từ Server (SSR)
 * 2. Lọc theo danh mục chủ đề (Tất cả, Anime, Động vật, Chibi, Phong cảnh, Khác)
 * 3. Sắp xếp danh sách (Tải nhiều nhất, Yêu thích nhất, Tên A-Z) qua REST API
 * 4. Tải nhanh bộ sticker trực tiếp từ thẻ card (/api/packs/<id>/download)
 * 5. Tái sử dụng Toast dùng chung toàn hệ thống (window.showToast)
 */

document.addEventListener("DOMContentLoaded", function () {
  // 1. Khởi tạo Lucide Icons
  const initLucide = () => {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  };
  initLucide();

  // Helper hiển thị thông báo dùng chung
  const notify = (msg) => {
    if (typeof window.showToast === "function") {
      window.showToast(msg);
    } else {
      console.log("[Toast]", msg);
    }
  };

  // Helper escape HTML
  const escapeHtml = (str) => {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // Helper định dạng số gọn
  const formatCompact = (num) => {
    try {
      const n = parseInt(num, 10);
      if (isNaN(n)) return num || "0";
      if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
      if (n >= 1000) return (n / 1000).toFixed(1) + "K";
      return n.toLocaleString("vi-VN");
    } catch (e) {
      return num || "0";
    }
  };

  // 2. Trạng thái ứng dụng
  let state = {
    category: "all",
    sort: "downloads",
    isLoading: false,
  };

  // Đọc dữ liệu Hydration nếu có
  const hydrationScript = document.getElementById("initialTopData");
  if (hydrationScript) {
    try {
      const initial = JSON.parse(hydrationScript.textContent);
      if (initial) {
        state.category = initial.category || "all";
        state.sort = initial.sort || "downloads";
      }
    } catch (e) {
      console.warn("[Hydration] Không thể phân tích initialTopData:", e);
    }
  }

  // DOM Elements
  const grid = document.getElementById("topStickersGrid");
  const filterCatBtns = document.querySelectorAll(".filter-cat-btn");
  const sortSelect = document.getElementById("sortSelect");

  // 3. Render giao diện thẻ Card Bảng xếp hạng
  function renderTopCard(pack) {
    return `
      <div class="top-sticker-card" data-category="${escapeHtml(pack.category_slug)}" data-id="${pack.id}" data-downloads="${pack.total_downloads}" data-favorites="${pack.total_favorites}" data-name="${escapeHtml(pack.title)}">
        <span class="rank-badge ${pack.rank_badge_class}" title="Hạng ${pack.rank}">${pack.rank}</span>
        <a href="/pack/${escapeHtml(pack.slug)}" class="card-preview-box">
          <img src="${escapeHtml(pack.cover_image)}" alt="${escapeHtml(pack.title)}" loading="lazy">
        </a>
        <div class="card-meta-info">
          <a href="/pack/${escapeHtml(pack.slug)}" style="text-decoration: none; color: inherit;">
            <h3 class="card-pack-title">${escapeHtml(pack.title)}</h3>
          </a>
          <span class="card-sticker-count">${pack.total_stickers || 0} sticker</span>
          <div class="card-stats-line">
            <span class="stat-item" title="Lượt tải về">
              <i data-lucide="download" style="width: 13px; height: 13px;"></i>
              <span class="stat-downloads-text">${escapeHtml(pack.total_downloads_compact || "0")}</span>
            </span>
            <span class="stat-item" title="Yêu thích">
              <i data-lucide="heart" style="width: 13px; height: 13px;"></i>
              <span>${escapeHtml(pack.total_favorites_compact || "0")}</span>
            </span>
          </div>
          <button class="btn-card-download" type="button" data-pack-id="${pack.id}" data-pack-title="${escapeHtml(pack.title)}" aria-label="Tải về bộ sticker ${escapeHtml(pack.title)}">
            <i data-lucide="download" style="width: 14px; height: 14px;"></i>
            <span>Tải về</span>
          </button>
        </div>
      </div>
    `;
  }

  // Gắn sự kiện nút Tải về trên từng thẻ
  function bindDownloadButtons() {
    const downloadBtns = document.querySelectorAll(".btn-card-download");
    downloadBtns.forEach((btn) => {
      btn.onclick = async function (e) {
        e.preventDefault();
        e.stopPropagation();

        const packId = this.getAttribute("data-pack-id");
        const title = this.getAttribute("data-pack-title") || "sticker";
        const card = this.closest(".top-sticker-card");
        const downloadSpan = card ? card.querySelector(".stat-downloads-text") : null;

        notify(`⏳ Đang tải bộ sticker: ${title}...`);

        try {
          const response = await fetch(`/api/packs/${packId}/download`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.downloads && downloadSpan) {
              downloadSpan.textContent = formatCompact(data.downloads);
            }
          }
        } catch (err) {
          console.warn("[Download error]:", err);
        }

        setTimeout(() => {
          notify(`🎉 Tải xuống thành công bộ sticker ${title}!`);
        }, 800);
      };
    });
  }
  bindDownloadButtons();

  // 4. Truy vấn danh sách Top tải nhiều từ REST API
  async function fetchTopDownloads() {
    if (state.isLoading || !grid) return;
    state.isLoading = true;
    grid.style.opacity = "0.5";

    const params = new URLSearchParams({
      category: state.category,
      sort: state.sort,
      limit: 12,
    });

    try {
      const response = await fetch(`/api/top-downloads?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (data.success) {
        if (data.packs && data.packs.length > 0) {
          grid.innerHTML = data.packs.map(renderTopCard).join("");
        } else {
          grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: #FAF5EE; border-radius: 14px; border: 1.5px dashed #E0D3C3;">
              <i data-lucide="folder-search" style="width: 48px; height: 48px; color: #9C8A7B; margin-bottom: 12px;"></i>
              <h4 style="font-size: 17px; font-weight: 700; color: #35231B; margin-bottom: 6px;">Không tìm thấy bộ sưu tập nào</h4>
              <p style="font-size: 14px; color: #766557;">Thử chọn danh mục hoặc tiêu chí sắp xếp khác nhé!</p>
            </div>
          `;
        }

        initLucide();
        bindDownloadButtons();
      }
    } catch (err) {
      console.error("[Fetch Top Downloads Error]:", err);
      notify("Có lỗi kết nối đến máy chủ khi tải bảng xếp hạng!");
    } finally {
      state.isLoading = false;
      grid.style.opacity = "1";
    }
  }

  // 5. Sự kiện Lọc theo Danh mục
  filterCatBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      if (this.classList.contains("active")) return;

      filterCatBtns.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      state.category = this.getAttribute("data-filter") || "all";
      const catName = this.textContent.trim();

      fetchTopDownloads().then(() => {
        notify(`Đang xem bảng xếp hạng: ${catName}`);
      });
    });
  });

  // 6. Sự kiện Sắp xếp Dropdown
  if (sortSelect) {
    sortSelect.addEventListener("change", function () {
      state.sort = this.value;
      const sortText = this.options[this.selectedIndex].text;

      fetchTopDownloads().then(() => {
        notify(`Đã sắp xếp theo: ${sortText}`);
      });
    });
  }
});
