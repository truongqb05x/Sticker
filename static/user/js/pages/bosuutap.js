/**
 * ========================================================
 * BỘ SƯU TẬP (COLLECTIONS LISTING) INTERACTION SCRIPT
 * ========================================================
 */

document.addEventListener("DOMContentLoaded", function () {
  // 1. Khởi tạo Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 2. Chức năng Lọc Bộ sưu tập theo Tab (Tất cả, Mới nhất, Tải nhiều nhất, Yêu thích)
  const filterBtns = document.querySelectorAll(".filter-btn");
  const cards = document.querySelectorAll(".collection-card");

  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      const filter = this.getAttribute("data-filter");
      
      let count = 0;
      cards.forEach(card => {
        const cardFilter = card.getAttribute("data-filter") || "";
        if (filter === "all" || cardFilter.includes(filter)) {
          card.style.display = "flex";
          count++;
        } else {
          card.style.display = "none";
        }
      });

      const filterName = this.textContent.trim();
      showToast(`Đã lọc danh sách: ${filterName} (${count} bộ sưu tập)`);
    });
  });

  // 3. Chức năng Lọc theo Danh mục bên Sidebar
  const catItems = document.querySelectorAll(".category-item");
  catItems.forEach(function (cat) {
    cat.addEventListener("click", function () {
      catItems.forEach(c => c.classList.remove("active"));
      this.classList.add("active");
      const category = this.getAttribute("data-category");
      
      let matchCount = 0;
      cards.forEach(card => {
        const cardCat = card.getAttribute("data-category") || "";
        if (!category || cardCat === category) {
          card.style.display = "flex";
          matchCount++;
        } else {
          card.style.display = "none";
        }
      });

      const catName = this.querySelector(".cat-info span")?.textContent || "Danh mục";
      showToast(`Đang hiển thị danh mục: ${catName} (${matchCount} bộ sưu tập)`);
    });
  });

  // 4. Phân trang
  const prevBtn = document.getElementById("prevPageBtn");
  const nextBtn = document.getElementById("nextPageBtn");
  const pageCounter = document.getElementById("pageCounter");

  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      showToast("Bạn đang ở trang đầu tiên (Trang 1 / 4)");
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      showToast("Chuyển sang trang 2 (Bộ sưu tập 13 - 24 / 48)");
    });
  }
});
