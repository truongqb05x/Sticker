/**
 * ========================================================
 * UTILITY: REALTIME SEARCH CONTROLLER (search.js)
 * ========================================================
 * Quản lý tìm kiếm realtime, autocomplete suggestions, điều hướng
 * bàn phím trên danh sách gợi ý và xử lý điều hướng trang bộ sưu tập.
 */

import { escapeHtml, highlightMatch } from "./helpers.js";

let selectedSuggestionIndex = -1;
let currentSearchAbortController = null;

/**
 * Hiển thị dropdown gợi ý kết quả tìm kiếm realtime từ REST API
 * @param {string} query 
 */
export async function renderSuggestions(query) {
  const searchInput = document.getElementById("stickerSearch");
  const searchSuggestions = document.getElementById("searchSuggestions");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  const searchBtn = document.getElementById("searchBtn");

  if (!searchSuggestions || !searchInput) return;

  const rawQuery = (query || "").trim();
  if (!rawQuery) {
    searchSuggestions.classList.remove("active");
    clearSearchBtn?.classList.remove("active");
    searchBtn?.classList.remove("hidden");
    selectedSuggestionIndex = -1;
    if (currentSearchAbortController) {
      currentSearchAbortController.abort();
      currentSearchAbortController = null;
    }
    return;
  }

  clearSearchBtn?.classList.add("active");
  searchBtn?.classList.add("hidden");

  if (currentSearchAbortController) {
    currentSearchAbortController.abort();
  }
  currentSearchAbortController = new AbortController();

  try {
    const resp = await fetch(`/api/search/suggestions?q=${encodeURIComponent(rawQuery)}&limit=8`, {
      signal: currentSearchAbortController.signal
    });
    if (!resp.ok) return;
    const data = await resp.json();
    if (!data.success) return;

    const matches = data.results || [];
    selectedSuggestionIndex = -1;

    if (matches.length > 0) {
      const itemsHtml = matches.map((pack, idx) => {
        const highlightedTitle = highlightMatch(pack.name, rawQuery);
        const safeImg = escapeHtml(pack.img || "/assets/pack_cats.jpg");
        const safeName = escapeHtml(pack.name || "");
        const safeSlug = escapeHtml(pack.slug || "");
        const safeCategory = escapeHtml(pack.category || "");
        const safeCategorySlug = escapeHtml(pack.category_slug || "others");
        const safeSubtitle = escapeHtml(pack.subtitle || "");

        return `
          <li class="suggestion-item" data-index="${idx}" data-category="${safeCategorySlug}" data-slug="${safeSlug}" data-name="${safeName}" onclick="goToPack('${safeCategorySlug}', '${safeSlug}')">
            <img src="${safeImg}" alt="${safeName}" class="suggestion-thumb" loading="lazy" onerror="this.src='/assets/pack_cats.jpg'">
            <div class="suggestion-details">
              <span class="suggestion-title">${highlightedTitle}</span>
              <span class="suggestion-meta">
                <span class="suggestion-badge">${safeCategory}</span>
                <span class="suggestion-extra">• ${safeSubtitle}</span>
              </span>
            </div>
            <svg class="suggestion-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </li>
        `;
      }).join("");

      const safeQuery = escapeHtml(rawQuery);
      searchSuggestions.innerHTML = `
        <div class="suggestions-header">
          <span>Gợi ý (${matches.length})</span>
          <button class="suggestions-close-btn" type="button" onclick="document.getElementById('searchSuggestions').classList.remove('active')" aria-label="Đóng gợi ý" title="Đóng">✕</button>
        </div>
        <ul class="suggestions-list" id="suggestionsList" role="list">
          ${itemsHtml}
        </ul>
        <a href="javascript:void(0)" class="suggestions-view-all" onclick="submitSearch('${safeQuery}')">
          <span>Xem tất cả kết quả cho "${safeQuery}"</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </a>
      `;
    } else {
      const safeQuery = escapeHtml(rawQuery);
      searchSuggestions.innerHTML = `
        <div class="suggestions-empty">
          <div class="suggestions-empty-title">Không tìm thấy sticker nào</div>
          <div class="suggestions-empty-sub">Không có kết quả khớp với "${safeQuery}"</div>
        </div>
        <a href="javascript:void(0)" class="suggestions-view-all" onclick="submitSearch('${safeQuery}')">
          <span>Xem tất cả bộ sưu tập</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </a>
      `;
    }

    searchSuggestions.classList.add("active");
  } catch (err) {
    if (err.name === "AbortError") return;
    console.error("[Search Suggestion Error]:", err);
  }
}

/**
 * Chuyển hướng trực tiếp tới trang chi tiết bộ sưu tập theo cấu trúc /bo-suu-tap/the-loai/ten-bo-suu-tap
 * @param {string} categorySlug 
 * @param {string} slug 
 */
export function goToPack(categorySlug, slug) {
  if (!slug) return;
  const searchSuggestions = document.getElementById("searchSuggestions");
  searchSuggestions?.classList.remove("active");
  const cat = categorySlug || "others";
  window.location.href = `/bo-suu-tap/${encodeURIComponent(cat)}/${encodeURIComponent(slug)}`;
}

/**
 * Thực hiện tìm kiếm: nếu đang ở /bosuutap thì lọc tức thì, nếu ở trang khác thì chuyển hướng sang /bosuutap?search=...
 * @param {string} [query] 
 */
export function submitSearch(query) {
  const searchInput = document.getElementById("stickerSearch");
  const rawQuery = (query !== undefined && query !== null ? query : (searchInput ? searchInput.value : "")).trim();
  if (!rawQuery) return;

  const searchSuggestions = document.getElementById("searchSuggestions");
  searchSuggestions?.classList.remove("active");

  if (window.location.pathname.startsWith("/bo-suu-tap") || window.location.pathname.startsWith("/bosuutap")) {
    if (searchInput && searchInput.value !== rawQuery) {
      searchInput.value = rawQuery;
    }
    // Phát sự kiện input để trang bộ sưu tập kích hoạt tìm kiếm in-page
    searchInput?.dispatchEvent(new Event("input", { bubbles: true }));

    // Cập nhật tham số URL không reload trang
    const url = new URL(window.location.href);
    url.searchParams.set("search", rawQuery);
    url.searchParams.set("page", "1");
    window.history.pushState({}, "", url.toString());
  } else {
    // Điều hướng sang trang bộ sưu tập kèm từ khóa
    window.location.href = `/bo-suu-tap?search=${encodeURIComponent(rawQuery)}`;
  }
}

/**
 * Hàm tương thích ngược khi chọn item gợi ý
 * @param {string} name 
 */
export function selectSuggestion(name) {
  submitSearch(name);
}

/**
 * Xóa và reset ô tìm kiếm
 */
export function resetSearch() {
  const searchInput = document.getElementById("stickerSearch");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  const searchBtn = document.getElementById("searchBtn");
  const searchSuggestions = document.getElementById("searchSuggestions");

  if (searchInput) {
    searchInput.value = "";
    searchInput.focus();
  }
  clearSearchBtn?.classList.remove("active");
  searchBtn?.classList.remove("hidden");
  searchSuggestions?.classList.remove("active");
  selectedSuggestionIndex = -1;

  if (window.location.pathname.startsWith("/bo-suu-tap") || window.location.pathname.startsWith("/bosuutap")) {
    if (searchInput) {
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
    const url = new URL(window.location.href);
    if (url.searchParams.has("search")) {
      url.searchParams.delete("search");
      window.history.pushState({}, "", url.toString());
    }
  }
}

/**
 * Khởi tạo toàn bộ các sự kiện tìm kiếm trên Header
 */
export function initSearch() {
  const searchInput = document.getElementById("stickerSearch");
  const searchSuggestions = document.getElementById("searchSuggestions");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  const searchBtn = document.getElementById("searchBtn");
  const searchBoxContainer = document.getElementById("searchBoxContainer");

  // Khôi phục từ khóa tìm kiếm từ query params nếu có (ví dụ khi từ trang khác chuyển qua /bosuutap?search=...)
  const currentUrlParams = new URLSearchParams(window.location.search);
  const existingSearchParam = currentUrlParams.get("search");
  if (existingSearchParam && searchInput) {
    searchInput.value = existingSearchParam;
    clearSearchBtn?.classList.add("active");
    searchBtn?.classList.add("hidden");
  }

  // Input event: Debounce gọi API gợi ý tìm kiếm realtime (250ms)
  let inputDebounceTimer = null;
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      clearTimeout(inputDebounceTimer);
      inputDebounceTimer = setTimeout(() => {
        renderSuggestions(e.target.value);
      }, 250);
    });

    searchInput.addEventListener("focus", () => {
      if (searchInput.value.trim()) {
        renderSuggestions(searchInput.value);
      }
    });

    // Điều hướng bàn phím trên dropdown gợi ý (ArrowDown, ArrowUp, Enter, Escape)
    searchInput.addEventListener("keydown", (e) => {
      const isSuggestionsActive = searchSuggestions && searchSuggestions.classList.contains("active");
      const items = isSuggestionsActive ? searchSuggestions.querySelectorAll(".suggestion-item") : [];

      if (e.key === "ArrowDown") {
        if (isSuggestionsActive && items.length > 0) {
          e.preventDefault();
          selectedSuggestionIndex = (selectedSuggestionIndex + 1) % items.length;
          items.forEach((item, idx) => {
            item.classList.toggle("selected", idx === selectedSuggestionIndex);
            if (idx === selectedSuggestionIndex) item.scrollIntoView({ block: "nearest" });
          });
        }
      } else if (e.key === "ArrowUp") {
        if (isSuggestionsActive && items.length > 0) {
          e.preventDefault();
          selectedSuggestionIndex = (selectedSuggestionIndex - 1 + items.length) % items.length;
          items.forEach((item, idx) => {
            item.classList.toggle("selected", idx === selectedSuggestionIndex);
            if (idx === selectedSuggestionIndex) item.scrollIntoView({ block: "nearest" });
          });
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (isSuggestionsActive && selectedSuggestionIndex >= 0 && selectedSuggestionIndex < items.length) {
          const selectedItem = items[selectedSuggestionIndex];
          const slug = selectedItem.getAttribute("data-slug");
          const catSlug = selectedItem.getAttribute("data-category") || "others";
          if (slug) {
            goToPack(catSlug, slug);
          } else {
            const name = selectedItem.getAttribute("data-name");
            submitSearch(name);
          }
        } else {
          submitSearch(searchInput.value);
        }
      } else if (e.key === "Escape") {
        searchSuggestions?.classList.remove("active");
        selectedSuggestionIndex = -1;
      }
    });
  }

  // Clear button click
  clearSearchBtn?.addEventListener("click", resetSearch);

  // Search button click
  searchBtn?.addEventListener("click", () => {
    submitSearch(searchInput ? searchInput.value : "");
  });

  // Click outside to close search suggestions
  document.addEventListener("click", (e) => {
    if (searchBoxContainer && !searchBoxContainer.contains(e.target)) {
      searchSuggestions?.classList.remove("active");
    }
  });
}

