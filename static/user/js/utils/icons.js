/**
 * ========================================================
 * UTILITY: ICON INITIALIZER (icons.js)
 * ========================================================
 * Tự động tạo biểu tượng Lucide SVG cho toàn bộ giao diện.
 */

/**
 * Khởi tạo icon Lucide an toàn
 */
export function initIcons() {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    try {
      window.lucide.createIcons();
    } catch (err) {
      console.warn("[Lucide Icons] Khởi tạo không thành công:", err);
    }
  }
}

