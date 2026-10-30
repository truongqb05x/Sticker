/**
 * ========================================================
 * STICKERHUB - USER GLOBAL APPLICATION SCRIPT (app.js)
 * ========================================================
 * File kịch bản khởi tạo chung cho toàn bộ giao diện User.
 * Được nạp ở tất cả các trang.
 */

import { showToast } from "./utils/showToast.js";

// Đảm bảo gắn toàn cục cho toàn bộ hệ thống
window.showToast = showToast;

document.addEventListener("DOMContentLoaded", () => {
  // Global User Initialization logic nếu cần
});
