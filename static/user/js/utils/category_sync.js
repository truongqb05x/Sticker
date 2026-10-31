/**
 * ========================================================
 * UTILITY: CATEGORY COUNTS SYNC (category_sync.js)
 * ========================================================
 * Tự động đồng bộ số lượng sticker theo từng danh mục từ REST API (/api/categories)
 * vào Sidebar và Mobile Drawer.
 */

/**
 * Đồng bộ số lượng danh mục từ REST API thực tế
 */
export async function syncCategoryCountsFromApi() {
  try {
    const res = await fetch("/api/categories");
    if (!res.ok) return;
    const data = await res.json();
    if (!data.success || !Array.isArray(data.categories)) return;

    data.categories.forEach((cat) => {
      if (!cat || !cat.slug) return;
      const count = cat.sticker_count !== undefined ? cat.sticker_count : 0;
      const countText = `(${count})`;

      // CHỈ cập nhật liên kết danh mục trong Sidebar và Mobile Drawer, tuyệt đối không chạm vào các thẻ card bộ sưu tập
      const catElements = document.querySelectorAll(`
        #categoryList .category-item[data-category="${cat.slug}"],
        #drawerCategoryList .drawer-sub-item[data-category="${cat.slug}"],
        aside .category-item[data-category="${cat.slug}"],
        aside .drawer-sub-item[data-category="${cat.slug}"]
      `);

      catElements.forEach((el) => {
        if (
          el.closest(".collection-card, .sticker-card, .top-sticker-card") ||
          el.matches(".collection-card, .sticker-card, .top-sticker-card")
        ) {
          return;
        }

        const countEl = el.querySelector(".cat-count");
        if (countEl) {
          countEl.textContent = countText;
        }
      });
    });

    // Dọn dẹp phòng ngừa: Xóa mọi thẻ .cat-count bị chèn nhầm vào bên trong các thẻ card bộ sưu tập
    document
      .querySelectorAll(".collection-card .cat-count, .sticker-card .cat-count, .top-sticker-card .cat-count")
      .forEach((el) => el.remove());
  } catch (err) {
    console.warn("[Category Sync] Lỗi khi tải số lượng danh mục từ API:", err);
  }
}

