/**
 * ========================================================
 * STICKERHUB - USER GLOBAL APPLICATION SCRIPT (app.js)
 * ========================================================
 * File kịch bản khởi tạo trung tâm cho toàn bộ giao diện User.
 * Điều phối các module chức năng độc lập theo trình tự logic chặt chẽ.
 */

// 1. Nhập các tiện ích dùng chung
import { showToast } from "./utils/showToast.js";
import { securityManager, SecurityManager } from "./utils/security.js";
import { LoadingScreen } from "./utils/loading_screen.js";
import { escapeHtml, removeVietnameseTones, highlightMatch } from "./utils/helpers.js";
import { initIcons } from "./utils/icons.js";
import { initNavigation, handleTabClick } from "./utils/navigation.js";
import {
  initDrawer,
  openDrawer,
  closeDrawer,
  toggleDrawerAccordion,
  handleDrawerFeaturedClick,
} from "./utils/drawer.js";
import {
  initSearch,
  renderSuggestions,
  goToPack,
  submitSearch,
  resetSearch,
  selectSuggestion,
} from "./utils/search.js";
import { syncCategoryCountsFromApi } from "./utils/category_sync.js";

// ========================================================
// 2. GẮN CÁC TIỆN ÍCH TOÀN CỤC VÀO WINDOW
// (Để tương thích với các inline attribute onclick trên HTML)
// ========================================================
window.packsData = window.packsData || [];

// Toast & Màn hình Loading
window.showToast = showToast;
window.LoadingScreen = LoadingScreen;
window.showLoading = (title, sub) => LoadingScreen.show(title, sub);
window.hideLoading = (force) => LoadingScreen.hide(force);

// Bảo mật
window.securityManager = securityManager;
window.SecurityManager = SecurityManager;

// Tiện ích xử lý chuỗi
window.escapeHtml = escapeHtml;
window.removeVietnameseTones = removeVietnameseTones;
window.highlightMatch = highlightMatch;

// Menu điều hướng & Mobile Drawer
window.handleTabClick = handleTabClick;
window.openDrawer = openDrawer;
window.closeDrawer = closeDrawer;
window.toggleDrawerAccordion = toggleDrawerAccordion;
window.handleDrawerFeaturedClick = handleDrawerFeaturedClick;

// Tìm kiếm & Điều hướng bộ sưu tập
window.renderSuggestions = renderSuggestions;
window.goToPack = goToPack;
window.submitSearch = submitSearch;
window.resetSearch = resetSearch;
window.selectSuggestion = selectSuggestion;

// Đồng bộ danh mục
window.syncCategoryCountsFromApi = syncCategoryCountsFromApi;

// ========================================================
// 3. KHỞI CHẠY CÁC DỊCH VỤ CỐT LÕI (TIỀN KHỞI TẠO DOM)
// ========================================================
// Bước 3.1: Khởi chạy bảo mật (chặn devtools, bảo vệ bản quyền) TRƯỚC TIÊN
securityManager.init();

// Bước 3.2: Khởi chạy quản lý màn hình loading (khóa cuộn, chuẩn bị khung tải trang)
LoadingScreen.init();

// ========================================================
// 4. KHỞI CHẠY GIAO DIỆN KHI DOM SẴN SÀNG (DOMContentLoaded)
// ========================================================
document.addEventListener("DOMContentLoaded", () => {
  // Bước 4.1: Render icon Lucide SVG trên toàn bộ các thẻ i[data-lucide]
  initIcons();

  // Bước 4.2: Khởi tạo điều hướng menu, active link & cuộn trang
  initNavigation();

  // Bước 4.3: Khởi tạo sự kiện mở/đóng Mobile Drawer và Accordion
  initDrawer();

  // Bước 4.4: Khởi tạo hệ thống tìm kiếm realtime, autocomplete & phím tắt
  initSearch();

  // Bước 4.5: Tự động đồng bộ số lượng sticker thực tế cho các danh mục từ REST API
  syncCategoryCountsFromApi();
});
