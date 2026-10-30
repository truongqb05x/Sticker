/**
 * ========================================================
 * BỘ SƯU TẬP (COLLECTIONS LISTING) - REAL INTERACTION SCRIPT
 * ========================================================
 * Quản lý tương tác trang danh sách bộ sưu tập sticker:
 * 1. Khởi tạo & nạp dữ liệu hydrat hóa từ Server (SSR)
 * 2. Lọc theo danh mục thực tế từ CSDL (Desktop Sidebar & Mobile Drawer)
 * 3. Lọc theo tiêu chí: Tất cả, Mới nhất, Tải nhiều nhất, Yêu thích
 * 4. Phân trang dữ liệu thông qua REST API /api/collections
 * 5. Tích hợp tìm kiếm theo từ khóa thời gian thực
 * 6. Tái sử dụng Toast dùng chung toàn hệ thống (window.showToast)
 */

document.addEventListener("DOMContentLoaded", function () {
  // 1. Khởi tạo biểu tượng Lucide
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

  // 2. Trạng thái ứng dụng
  let state = {
    category: "all",
    filter: "all",
    search: "",
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
    isLoading: false,
  };

  // Đọc dữ liệu SSR Hydration nếu có
  const hydrationScript = document.getElementById("initialCollectionsData");
  if (hydrationScript) {
    try {
      const initialData = JSON.parse(hydrationScript.textContent);
      if (initialData && initialData.pagination) {
        state.category = initialData.pagination.category || "all";
        state.filter = initialData.pagination.filter || "all";
        state.search = initialData.pagination.search || "";
        state.page = initialData.pagination.page || 1;
        state.limit = initialData.pagination.limit || 12;
        state.total = initialData.pagination.total || 0;
        state.totalPages = initialData.pagination.total_pages || 1;
      }
    } catch (e) {
      console.warn("[Hydration] Không thể giải mã initialCollectionsData:", e);
    }
  }

  // DOM Elements
  const collectionsGrid = document.getElementById("collectionsGrid");
  const pageCounter = document.getElementById("pageCounter");
  const prevBtn = document.getElementById("prevPageBtn");
  const nextBtn = document.getElementById("nextPageBtn");
  const filterBtns = document.querySelectorAll(".filter-btn");
  const catItems = document.querySelectorAll(".category-item");
  const drawerSubItems = document.querySelectorAll(".drawer-sub-item");
  const searchInput = document.getElementById("stickerSearch");

  // Helper escape HTML để tránh XSS
  const escapeHtml = (str) => {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // 3. Render giao diện một thẻ Card Bộ sưu tập
  function renderCard(pack) {
    let badgeHtml = "";
    if (pack.is_featured) {
      badgeHtml = '<span class="pack-badge badge-hot">HOT</span>';
    } else if (pack.is_new) {
      badgeHtml = '<span class="pack-badge badge-new">MỚI</span>';
    }

    return `
      <a href="/pack/${escapeHtml(pack.slug)}" class="collection-card" data-id="${pack.id}" data-category="${escapeHtml(pack.category_slug)}">
        <div class="card-thumb-container">
          <img src="${escapeHtml(pack.cover_image)}" alt="${escapeHtml(pack.title)}" class="card-thumb-img" loading="lazy">
          ${badgeHtml}
        </div>
        <div class="card-body-content">
          <h3 class="card-title-text">${escapeHtml(pack.title)}</h3>
          <p class="card-desc-text">${escapeHtml(pack.description || "")}</p>
          <div class="card-stats-row">
            <span class="stat-entry">
              <i data-lucide="layers" style="width: 13px; height: 13px;"></i>
              ${pack.total_stickers || 0} sticker
            </span>
            <span class="stat-entry">
              <i data-lucide="download" style="width: 13px; height: 13px;"></i>
              ${escapeHtml(pack.total_downloads_compact || "0")}
            </span>
            <span class="stat-entry">
              <i data-lucide="heart" style="width: 13px; height: 13px;"></i>
              ${escapeHtml(pack.total_favorites_compact || "0")}
            </span>
          </div>
        </div>
      </a>
    `;
  }

  // 4. Cập nhật thanh phân trang
  function updatePaginationUI(pagination) {
    if (pageCounter) {
      if (pagination.total > 0) {
        pageCounter.textContent = `Hiển thị ${pagination.start_idx} - ${pagination.end_idx} / ${pagination.total} bộ sưu tập`;
      } else {
        pageCounter.textContent = `0 bộ sưu tập`;
      }
    }

    if (prevBtn) {
      prevBtn.disabled = !pagination.has_prev;
    }
    if (nextBtn) {
      nextBtn.disabled = !pagination.has_next;
    }
  }

  // 5. Truy vấn danh sách bộ sưu tập từ REST API
  async function fetchCollections(resetPage = false) {
    if (state.isLoading) return;
    state.isLoading = true;

    if (resetPage) {
      state.page = 1;
    }

    if (collectionsGrid) {
      collectionsGrid.style.opacity = "0.5";
      collectionsGrid.style.pointerEvents = "none";
    }

    const params = new URLSearchParams({
      category: state.category,
      filter: state.filter,
      search: state.search,
      page: state.page,
      limit: state.limit,
    });

    try {
      const response = await fetch(`/api/collections?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const resData = await response.json();
      if (resData.success) {
        state.page = resData.pagination.page;
        state.total = resData.pagination.total;
        state.totalPages = resData.pagination.total_pages;

        if (collectionsGrid) {
          if (resData.packs && resData.packs.length > 0) {
            collectionsGrid.innerHTML = resData.packs.map(renderCard).join("");
          } else {
            collectionsGrid.innerHTML = `
              <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: #FAF5EE; border-radius: 14px; border: 1.5px dashed #E0D3C3;">
                <i data-lucide="folder-search" style="width: 48px; height: 48px; color: #9C8A7B; margin-bottom: 12px;"></i>
                <h4 style="font-size: 17px; font-weight: 700; color: #35231B; margin-bottom: 6px;">Không tìm thấy bộ sưu tập nào</h4>
                <p style="font-size: 14px; color: #766557;">Thử chọn danh mục hoặc bộ lọc khác nhé!</p>
              </div>
            `;
          }
        }

        updatePaginationUI(resData.pagination);
        initLucide();
      } else {
        notify("Không thể tải danh sách bộ sưu tập. Vui lòng thử lại!");
      }
    } catch (err) {
      console.error("[Collection API Error]:", err);
      notify("Có lỗi kết nối đến máy chủ. Vui lòng thử lại!");
    } finally {
      state.isLoading = false;
      if (collectionsGrid) {
        collectionsGrid.style.opacity = "1";
        collectionsGrid.style.pointerEvents = "auto";
      }
    }
  }

  // 6. Xử lý nút Lọc Tab (Tất cả, Mới nhất, Tải nhiều nhất, Yêu thích)
  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (this.classList.contains("active") && !state.search) return;

      filterBtns.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      state.filter = this.getAttribute("data-filter") || "all";
      const filterName = this.textContent.trim();

      fetchCollections(true).then(() => {
        notify(`Đã lọc danh sách: ${filterName} (${state.total} bộ sưu tập)`);
      });
    });
  });

  // 7. Đồng bộ kích hoạt danh mục ở cả Sidebar và Mobile Drawer
  function syncCategoryActiveUI(categorySlug) {
    catItems.forEach((c) => {
      const cat = c.getAttribute("data-category");
      c.classList.toggle("active", cat === categorySlug);
    });

    drawerSubItems.forEach((d) => {
      const cat = d.getAttribute("data-category");
      d.classList.toggle("active", cat === categorySlug);
    });
  }

  // Xử lý Lọc theo Danh mục bên Sidebar
  catItems.forEach(function (cat) {
    cat.addEventListener("click", function () {
      const category = this.getAttribute("data-category") || "all";
      if (state.category === category && !state.search) return;

      state.category = category;
      syncCategoryActiveUI(category);

      const catName = this.querySelector(".cat-info span")?.textContent || "Danh mục";
      fetchCollections(true).then(() => {
        notify(`Đang xem danh mục: ${catName} (${state.total} bộ sưu tập)`);
      });
    });
  });

  // Xử lý Lọc theo Danh mục trong Mobile Drawer
  drawerSubItems.forEach(function (sub) {
    sub.addEventListener("click", function () {
      const category = this.getAttribute("data-category") || "all";
      state.category = category;
      syncCategoryActiveUI(category);

      if (typeof window.closeDrawer === "function") {
        window.closeDrawer();
      }

      const catName = this.querySelector(".cat-info span")?.textContent || "Danh mục";
      fetchCollections(true).then(() => {
        notify(`Đang xem danh mục: ${catName} (${state.total} bộ sưu tập)`);
      });
    });
  });

  // 8. Chức năng Phân trang
  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      if (state.page > 1) {
        state.page--;
        fetchCollections(false).then(() => {
          notify(`Trang ${state.page} / ${state.totalPages}`);
          window.scrollTo({ top: 320, behavior: "smooth" });
        });
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      if (state.page < state.totalPages) {
        state.page++;
        fetchCollections(false).then(() => {
          notify(`Trang ${state.page} / ${state.totalPages}`);
          window.scrollTo({ top: 320, behavior: "smooth" });
        });
      }
    });
  }

  // 9. Tích hợp thanh tìm kiếm trên Header
  if (searchInput) {
    let debounceTimer = null;
    searchInput.addEventListener("input", function (e) {
      const val = e.target.value.trim();
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (state.search !== val) {
          state.search = val;
          fetchCollections(true);
        }
      }, 350);
    });

    const clearBtn = document.getElementById("clearSearchBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        if (state.search) {
          state.search = "";
          fetchCollections(true);
        }
      });
    }
  }
});
