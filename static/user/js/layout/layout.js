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

// Dữ liệu sticker dùng chung cho chức năng tìm kiếm & gợi ý
window.packsData = window.packsData || [
  {
    id: "cats",
    name: "Cute Cats",
    subtitle: "120 sticker",
    category: "Động vật",
    img: "assets/pack_cats.jpg",
    tags: ["cats", "animals", "cute", "meow", "mèo", "meo", "động vật", "dong vat", "dễ thương"]
  },
  {
    id: "anime",
    name: "Anime Girls",
    subtitle: "96 sticker",
    category: "Anime & Manga",
    img: "assets/pack_anime.jpg",
    tags: ["anime", "chibi", "girls", "manga", "cute", "hoạt hình", "gái xinh", "nữ sinh", "wibu"]
  },
  {
    id: "funny",
    name: "Funny Animals",
    subtitle: "74 sticker",
    category: "Động vật",
    img: "assets/pack_funny_animals.svg",
    tags: ["funny", "animals", "bear", "frog", "cute", "hài hước", "hai huoc", "gấu", "gau", "ếch", "ech"]
  },
  {
    id: "nature",
    name: "Nature Vibes",
    subtitle: "62 sticker",
    category: "Phong cảnh",
    img: "assets/pack_nature.svg",
    tags: ["nature", "vibes", "mountain", "fuji", "phong cảnh", "phong canh", "thiên nhiên", "núi phú sĩ", "cay coi", "rừng"]
  },
  {
    id: "expressions",
    name: "Biểu cảm đáng yêu",
    subtitle: "58 sticker",
    category: "Biểu cảm",
    img: "assets/pack_expressions.svg",
    tags: ["biểu cảm", "bieu cam", "đáng yêu", "dang yeu", "mochi", "emoji", "chibi", "faces", "vui vẻ", "cảm xúc"]
  },
  {
    id: "love",
    name: "Tình yêu ngọt ngào",
    subtitle: "47 sticker",
    category: "Tình yêu",
    img: "assets/pack_love.svg",
    tags: ["tình yêu", "tinh yeu", "ngọt ngào", "ngot ngao", "love", "heart", "valentine", "lãng mạn", "đôi lứa", "trái tim"]
  },
  {
    id: "onepiece",
    name: "One Piece",
    subtitle: "83 sticker",
    category: "Anime & Manga",
    img: "assets/pack_onepiece.svg",
    tags: ["one piece", "luffy", "zoro", "sanji", "anime", "manga", "chibi", "vua hải tặc", "hải tặc", "hai tac"]
  },
  {
    id: "food",
    name: "Trà sữa & Ăn vặt",
    subtitle: "55 sticker",
    category: "Ăn uống",
    img: "assets/pack_food.svg",
    tags: ["trà sữa", "tra sua", "ăn vặt", "an vat", "food", "drinks", "boba", "đồ ăn", "do an", "bánh ngọt"]
  }
];

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
  if (!query) return text;
  const cleanText = removeVietnameseTones(text);
  const cleanQuery = removeVietnameseTones(query);
  const startIdx = cleanText.indexOf(cleanQuery);
  if (startIdx === -1) return text;

  const before = text.slice(0, startIdx);
  const match = text.slice(startIdx, startIdx + query.length);
  const after = text.slice(startIdx + query.length);
  return `${before}<mark>${match}</mark>${after}`;
}



// Global UI handler variables
let selectedSuggestionIndex = -1;

// Render realtime search suggestions
function renderSuggestions(query) {
  const searchInput = document.getElementById('stickerSearch');
  const searchSuggestions = document.getElementById('searchSuggestions');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const searchBtn = document.getElementById('searchBtn');

  if (!searchSuggestions || !searchInput) return;

  const cleanQuery = removeVietnameseTones(query);
  if (!cleanQuery) {
    searchSuggestions.classList.remove('active');
    clearSearchBtn?.classList.remove('active');
    searchBtn?.classList.remove('hidden');
    selectedSuggestionIndex = -1;
    return;
  }

  clearSearchBtn?.classList.add('active');
  searchBtn?.classList.add('hidden');

  const matches = (window.packsData || []).filter(pack => {
    const cleanName = removeVietnameseTones(pack.name);
    const cleanCategory = removeVietnameseTones(pack.category);
    if (cleanName.includes(cleanQuery) || cleanCategory.includes(cleanQuery)) {
      return true;
    }
    return (pack.tags || []).some(tag => removeVietnameseTones(tag).includes(cleanQuery));
  });

  selectedSuggestionIndex = -1;

  if (matches.length > 0) {
    const itemsHtml = matches.map((pack, idx) => {
      const highlightedTitle = highlightMatch(pack.name, query);
      return `
        <li class="suggestion-item" data-index="${idx}" data-name="${pack.name}" onclick="selectSuggestion('${pack.name}')">
          <img src="${pack.img}" alt="${pack.name}" class="suggestion-thumb" loading="lazy">
          <div class="suggestion-details">
            <span class="suggestion-title">${highlightedTitle}</span>
            <span class="suggestion-meta">
              <span class="suggestion-badge">${pack.category}</span>
              <span class="suggestion-extra">• ${pack.subtitle}</span>
            </span>
          </div>
          <svg class="suggestion-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </li>
      `;
    }).join('');

    searchSuggestions.innerHTML = `
      <div class="suggestions-header">
        <span>Gợi ý (${matches.length})</span>
        <button class="suggestions-close-btn" type="button" onclick="document.getElementById('searchSuggestions').classList.remove('active')" aria-label="Đóng gợi ý" title="Đóng">✕</button>
      </div>
      <ul class="suggestions-list" id="suggestionsList" role="list">
        ${itemsHtml}
      </ul>
    `;
  } else {
    searchSuggestions.innerHTML = `
      <div class="suggestions-empty">
        <div class="suggestions-empty-title">Không tìm thấy sticker nào</div>
        <div class="suggestions-empty-sub">Không có kết quả khớp với "${query}"</div>
      </div>
    `;
  }

  searchSuggestions.classList.add('active');
}

// Select a suggestion item
function selectSuggestion(name) {
  const searchInput = document.getElementById('stickerSearch');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const searchBtn = document.getElementById('searchBtn');
  const searchSuggestions = document.getElementById('searchSuggestions');

  if (searchInput) searchInput.value = name;
  clearSearchBtn?.classList.add('active');
  searchBtn?.classList.add('hidden');
  searchSuggestions?.classList.remove('active');
}

// Reset search input
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

  // Input event: Search suggestions
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderSuggestions(e.target.value);
    });

    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim()) {
        renderSuggestions(searchInput.value);
      }
    });

    // Keyboard navigation (ArrowDown, ArrowUp, Enter, Escape)
    searchInput.addEventListener('keydown', (e) => {
      if (!searchSuggestions || !searchSuggestions.classList.contains('active')) {
        return;
      }

      const items = searchSuggestions.querySelectorAll('.suggestion-item');
      if (items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedSuggestionIndex = (selectedSuggestionIndex + 1) % items.length;
        items.forEach((item, idx) => {
          item.classList.toggle('selected', idx === selectedSuggestionIndex);
          if (idx === selectedSuggestionIndex) item.scrollIntoView({ block: 'nearest' });
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedSuggestionIndex = (selectedSuggestionIndex - 1 + items.length) % items.length;
        items.forEach((item, idx) => {
          item.classList.toggle('selected', idx === selectedSuggestionIndex);
          if (idx === selectedSuggestionIndex) item.scrollIntoView({ block: 'nearest' });
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < items.length) {
          const selectedName = items[selectedSuggestionIndex].getAttribute('data-name');
          selectSuggestion(selectedName);
        } else {
          searchSuggestions.classList.remove('active');
        }
      } else if (e.key === 'Escape') {
        searchSuggestions.classList.remove('active');
      }
    });
  }

  // Clear button click
  clearSearchBtn?.addEventListener('click', resetSearch);

  // Search button click
  searchBtn?.addEventListener('click', () => {
    if (searchInput && searchInput.value.trim()) {
      searchSuggestions?.classList.remove('active');
    }
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
      e.preventDefault();
      const tab = link.getAttribute('data-tab');
      handleTabClick(tab);
    });
  });

  drawerNavItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = item.getAttribute('data-tab');
      closeDrawer();
      handleTabClick(tab);
    });
  });
});
