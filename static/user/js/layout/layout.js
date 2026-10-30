/**
 * ========================================================
 * MASTER LAYOUT JAVASCRIPT (SHARED ACROSS ALL USER PAGES)
 * ========================================================
 * Chứa logic dùng chung cho:
 * 1. Thanh tìm kiếm & Gợi ý tìm kiếm realtime (Realtime Search Suggestions)
 * 2. Điều hướng bàn phím trên dropdown gợi ý (Arrow Up/Down, Enter, Esc)
 * 3. Mở/đóng Mobile Navigation Drawer & Backdrop
 * 4. Thu gọn / mở rộng Accordion trong Drawer (Danh mục & Bộ sưu tập)
 * 5. Toast Notifications thông báo tương tác
 * 6. Khởi tạo biểu tượng Lucide Icons
 */

// Dữ liệu sticker dùng chung cho chức năng tìm kiếm & gợi ý (đồng bộ hoặc dự phòng)
window.packsData = window.packsData || [];

// Helper: Escape HTML ký tự đặc biệt để phòng ngừa XSS
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Helper: Bỏ dấu tiếng Việt để tìm kiếm không dấu
function removeVietnameseTones(str) {
  if (!str) return "";
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, "");
  str = str.replace(/\u02C6|\u0306|\u031B/g, "");
  return str.trim();
}

// Helper: Tô màu nổi bật phần văn bản khớp với từ khóa
function highlightMatch(text, query) {
  if (!text) return "";
  if (!query) return escapeHtml(text);
  const cleanText = removeVietnameseTones(text);
  const cleanQuery = removeVietnameseTones(query);
  const startIdx = cleanText.indexOf(cleanQuery);
  if (startIdx === -1) return escapeHtml(text);

  const before = escapeHtml(text.slice(0, startIdx));
  const match = escapeHtml(text.slice(startIdx, startIdx + query.length));
  const after = escapeHtml(text.slice(startIdx + query.length));
  return `${before}<mark>${match}</mark>${after}`;
}

// Global UI handler variables
let selectedSuggestionIndex = -1;
let currentSearchAbortController = null;

// Render realtime search suggestions kết nối trực tiếp CSDL qua REST API
async function renderSuggestions(query) {
  const searchInput = document.getElementById('stickerSearch');
  const searchSuggestions = document.getElementById('searchSuggestions');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const searchBtn = document.getElementById('searchBtn');

  if (!searchSuggestions || !searchInput) return;

  const rawQuery = (query || '').trim();
  if (!rawQuery) {
    searchSuggestions.classList.remove('active');
    clearSearchBtn?.classList.remove('active');
    searchBtn?.classList.remove('hidden');
    selectedSuggestionIndex = -1;
    if (currentSearchAbortController) {
      currentSearchAbortController.abort();
      currentSearchAbortController = null;
    }
    return;
  }

  clearSearchBtn?.classList.add('active');
  searchBtn?.classList.add('hidden');

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
        const safeImg = escapeHtml(pack.img || '/assets/pack_cats.jpg');
        const safeName = escapeHtml(pack.name || '');
        const safeSlug = escapeHtml(pack.slug || '');
        const safeCategory = escapeHtml(pack.category || '');
        const safeSubtitle = escapeHtml(pack.subtitle || '');

        return `
          <li class="suggestion-item" data-index="${idx}" data-slug="${safeSlug}" data-name="${safeName}" onclick="goToPack('${safeSlug}')">
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
      }).join('');

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

    searchSuggestions.classList.add('active');
  } catch (err) {
    if (err.name === 'AbortError') return;
    console.error('[Search Suggestion Error]:', err);
  }
}

// Chuyển hướng trực tiếp tới trang chi tiết bộ sưu tập khi click vào gợi ý
function goToPack(slug) {
  if (!slug) return;
  const searchSuggestions = document.getElementById('searchSuggestions');
  searchSuggestions?.classList.remove('active');
  window.location.href = `/pack/${encodeURIComponent(slug)}`;
}

// Thực hiện tìm kiếm: nếu đang ở /bosuutap thì lọc tức thì, nếu ở trang khác thì chuyển hướng sang /bosuutap?search=...
function submitSearch(query) {
  const searchInput = document.getElementById('stickerSearch');
  const rawQuery = (query !== undefined && query !== null ? query : (searchInput ? searchInput.value : '')).trim();
  if (!rawQuery) return;

  const searchSuggestions = document.getElementById('searchSuggestions');
  searchSuggestions?.classList.remove('active');

  if (window.location.pathname === '/bosuutap') {
    if (searchInput && searchInput.value !== rawQuery) {
      searchInput.value = rawQuery;
    }
    // Phát sự kiện input để bosuutap.js kích hoạt tìm kiếm in-page
    searchInput?.dispatchEvent(new Event('input', { bubbles: true }));

    // Cập nhật tham số URL không reload trang
    const url = new URL(window.location.href);
    url.searchParams.set('search', rawQuery);
    url.searchParams.set('page', '1');
    window.history.pushState({}, '', url.toString());
  } else {
    // Điều hướng sang trang bộ sưu tập kèm từ khóa
    window.location.href = `/bosuutap?search=${encodeURIComponent(rawQuery)}`;
  }
}

// Hàm tương thích ngược khi chọn item
function selectSuggestion(name) {
  submitSearch(name);
}

// Xóa và reset ô tìm kiếm
function resetSearch() {
  const searchInput = document.getElementById('stickerSearch');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const searchBtn = document.getElementById('searchBtn');
  const searchSuggestions = document.getElementById('searchSuggestions');

  if (searchInput) {
    searchInput.value = '';
    searchInput.focus();
  }
  clearSearchBtn?.classList.remove('active');
  searchBtn?.classList.remove('hidden');
  searchSuggestions?.classList.remove('active');
  selectedSuggestionIndex = -1;

  if (window.location.pathname === '/bosuutap') {
    if (searchInput) {
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const url = new URL(window.location.href);
    if (url.searchParams.has('search')) {
      url.searchParams.delete('search');
      window.history.pushState({}, '', url.toString());
    }
  }
}

// Drawer functions
function openDrawer() {
  const mobileDrawer = document.getElementById('mobileDrawer');
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  if (mobileDrawer) mobileDrawer.classList.add('active');
  if (drawerBackdrop) drawerBackdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  const mobileDrawer = document.getElementById('mobileDrawer');
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  if (mobileDrawer) mobileDrawer.classList.remove('active');
  if (drawerBackdrop) drawerBackdrop.classList.remove('active');
  document.body.style.overflow = '';
}

// Toggle drawer accordions (Danh mục / Bộ sưu tập)
function toggleDrawerAccordion(id) {
  const acc = document.getElementById(id);
  if (!acc) return;
  const btn = acc.querySelector('.drawer-accordion-btn');
  const content = acc.querySelector('.drawer-accordion-content');
  const isOpen = acc.classList.toggle('open');
  if (btn) btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  if (content) {
    content.style.maxHeight = isOpen ? content.scrollHeight + 'px' : '0px';
  }
}

// Handle clicking featured items in drawer
function handleDrawerFeaturedClick(name) {
  closeDrawer();
}

// Initialize all layout events when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Lucide icons
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }

  const searchInput = document.getElementById('stickerSearch');
  const searchSuggestions = document.getElementById('searchSuggestions');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const searchBtn = document.getElementById('searchBtn');
  const searchBoxContainer = document.getElementById('searchBoxContainer');

  // Khôi phục từ khóa tìm kiếm từ query params nếu có (ví dụ khi từ trang khác chuyển qua /bosuutap?search=...)
  const currentUrlParams = new URLSearchParams(window.location.search);
  const existingSearchParam = currentUrlParams.get('search');
  if (existingSearchParam && searchInput) {
    searchInput.value = existingSearchParam;
    clearSearchBtn?.classList.add('active');
    searchBtn?.classList.add('hidden');
  }

  // Input event: Debounce gọi API gợi ý tìm kiếm realtime (250ms)
  let inputDebounceTimer = null;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(inputDebounceTimer);
      inputDebounceTimer = setTimeout(() => {
        renderSuggestions(e.target.value);
      }, 250);
    });

    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim()) {
        renderSuggestions(searchInput.value);
      }
    });

    // Điều hướng bàn phím trên dropdown gợi ý (ArrowDown, ArrowUp, Enter, Escape)
    searchInput.addEventListener('keydown', (e) => {
      const isSuggestionsActive = searchSuggestions && searchSuggestions.classList.contains('active');
      const items = isSuggestionsActive ? searchSuggestions.querySelectorAll('.suggestion-item') : [];

      if (e.key === 'ArrowDown') {
        if (isSuggestionsActive && items.length > 0) {
          e.preventDefault();
          selectedSuggestionIndex = (selectedSuggestionIndex + 1) % items.length;
          items.forEach((item, idx) => {
            item.classList.toggle('selected', idx === selectedSuggestionIndex);
            if (idx === selectedSuggestionIndex) item.scrollIntoView({ block: 'nearest' });
          });
        }
      } else if (e.key === 'ArrowUp') {
        if (isSuggestionsActive && items.length > 0) {
          e.preventDefault();
          selectedSuggestionIndex = (selectedSuggestionIndex - 1 + items.length) % items.length;
          items.forEach((item, idx) => {
            item.classList.toggle('selected', idx === selectedSuggestionIndex);
            if (idx === selectedSuggestionIndex) item.scrollIntoView({ block: 'nearest' });
          });
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (isSuggestionsActive && selectedSuggestionIndex >= 0 && selectedSuggestionIndex < items.length) {
          const selectedItem = items[selectedSuggestionIndex];
          const slug = selectedItem.getAttribute('data-slug');
          if (slug) {
            goToPack(slug);
          } else {
            const name = selectedItem.getAttribute('data-name');
            submitSearch(name);
          }
        } else {
          submitSearch(searchInput.value);
        }
      } else if (e.key === 'Escape') {
        searchSuggestions?.classList.remove('active');
        selectedSuggestionIndex = -1;
      }
    });
  }

  // Clear button click
  clearSearchBtn?.addEventListener('click', resetSearch);

  // Search button click
  searchBtn?.addEventListener('click', () => {
    submitSearch(searchInput ? searchInput.value : '');
  });

  // Click outside to close search suggestions
  document.addEventListener('click', (e) => {
    if (searchBoxContainer && !searchBoxContainer.contains(e.target)) {
      searchSuggestions?.classList.remove('active');
    }
  });

  // Mobile Drawer event listeners
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const drawerCloseBtn = document.getElementById('drawerCloseBtn');
  const drawerBackdrop = document.getElementById('drawerBackdrop');

  mobileMenuBtn?.addEventListener('click', openDrawer);
  drawerCloseBtn?.addEventListener('click', closeDrawer);
  drawerBackdrop?.addEventListener('click', closeDrawer);

  // Sync tab active states across desktop nav & drawer nav
  const navLinks = document.querySelectorAll('.nav-link');
  const drawerNavItems = document.querySelectorAll('.drawer-nav-item');

  function handleTabClick(tab) {
    navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('data-tab') === tab));
    drawerNavItems.forEach(i => i.classList.toggle('active', i.getAttribute('data-tab') === tab));

    if (tab === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href !== '#' && !href.startsWith('javascript:')) {
        return; // Allow native page navigation
      }
      e.preventDefault();
      const tab = link.getAttribute('data-tab');
      handleTabClick(tab);
    });
  });

  drawerNavItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const href = item.getAttribute('href');
      if (href && href !== '#' && !href.startsWith('javascript:')) {
        closeDrawer();
        return; // Allow native page navigation
      }
      e.preventDefault();
      const tab = item.getAttribute('data-tab');
      closeDrawer();
      handleTabClick(tab);
    });
  });
});
