/**
 * ========================================================
 * USER HOME PAGE (INDEX) JAVASCRIPT - STICKERHUB
 * ========================================================
 * Xử lý:
 * 1. Banner Carousel trình chiếu tự động (Hero Slider)
 * 2. Lọc danh mục bộ sưu tập (Category Filter)
 * 3. Ghi nhận lượt tải bộ sưu tập tức thì qua REST API
 * 4. Tích hợp thanh tìm kiếm và gợi ý với dữ liệu thực từ CSDL
 * 5. Tái sử dụng showToast dùng chung từ utils/showToast.js
 */

document.addEventListener("DOMContentLoaded", function () {
  // 1. Khởi tạo Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Helper hiển thị thông báo dùng chung
  function notify(msg) {
    if (typeof window.showToast === "function") {
      window.showToast(msg);
    } else {
      console.log("[Toast]", msg);
    }
  }

  // ========================================================
  // 2. HERO BANNER CAROUSEL
  // ========================================================
  const bannerDots = document.querySelectorAll(".hero-dot");
  const heroTitle = document.getElementById("heroHeadline");
  const heroSubtitle = document.getElementById("heroSubheadline");
  const heroImg = document.getElementById("heroImg");

  // Nạp dữ liệu banner từ script JSON SSR nếu có
  let bannerSlides = [];
  const bannerScript = document.getElementById("initialHeroBanners");
  if (bannerScript && bannerScript.textContent.trim()) {
    try {
      bannerSlides = JSON.parse(bannerScript.textContent);
    } catch (e) {
      console.warn("Không thể parse initialHeroBanners:", e);
    }
  }

  // Fallback banner nếu rỗng
  if (!bannerSlides || bannerSlides.length === 0) {
    bannerSlides = [
      {
        title: "Khám phá thế giới Sticker",
        subtitle: "Hàng ngàn bộ sticker đẹp, độc đáo, miễn phí!",
        image_url: "/assets/hero_banner.jpg",
      },
      {
        title: "Sticker Mèo Cưng Siêu Kawaii",
        subtitle: "Bộ sưu tập mèo con cute với biểu cảm độc lạ!",
        image_url: "/assets/pack_cats.jpg",
      },
      {
        title: "Manga Chibi Hải Tặc One Piece",
        subtitle: "Luffy, Zoro, Sanji tái xuất cực vui nhộn!",
        image_url: "/assets/pack_onepiece.svg",
      },
      {
        title: "Sticker Trà Sữa & Đồ Ăn Vặt",
        subtitle: "Ngập tràn vị ngọt ngào cho khung chat của bạn!",
        image_url: "/assets/pack_food.svg",
      },
    ];
  }

  let currentSlide = 0;
  let bannerTimer = null;

  function setSlide(index) {
    if (!bannerSlides[index]) return;
    currentSlide = index;

    bannerDots.forEach((dot, idx) => {
      dot.classList.toggle("active", idx === index);
    });

    if (heroTitle) heroTitle.textContent = bannerSlides[index].title;
    if (heroSubtitle) heroSubtitle.textContent = bannerSlides[index].subtitle;
    if (heroImg) {
      heroImg.src = bannerSlides[index].image_url;
      heroImg.alt = bannerSlides[index].title;
    }
  }

  bannerDots.forEach(dot => {
    dot.addEventListener("click", () => {
      const slideIndex = parseInt(dot.getAttribute("data-slide"), 10) || 0;
      setSlide(slideIndex);
      restartBannerTimer();
    });
  });

  function startBannerTimer() {
    if (bannerSlides.length <= 1) return;
    bannerTimer = setInterval(() => {
      currentSlide = (currentSlide + 1) % bannerSlides.length;
      setSlide(currentSlide);
    }, 6000);
  }

  function restartBannerTimer() {
    if (bannerTimer) clearInterval(bannerTimer);
    startBannerTimer();
  }

  startBannerTimer();

  // ========================================================
  // 3. TẢI VÀ LỌC BỘ SƯU TẬP THEO DANH MỤC
  // ========================================================
  const categoryItems = document.querySelectorAll(".category-item");
  const drawerCategoryItems = document.querySelectorAll(".drawer-sub-item");
  const stickerGrid = document.getElementById("stickerGrid");

  function filterPacks(categorySlug) {
    const cards = document.querySelectorAll(".sticker-card");
    let matchCount = 0;

    cards.forEach(card => {
      const cardCategory = card.getAttribute("data-category") || "";
      const cardTags = card.getAttribute("data-tags") || "";

      if (categorySlug === "all" || cardCategory === categorySlug || cardTags.includes(categorySlug)) {
        card.style.display = "flex";
        matchCount++;
      } else {
        card.style.display = "none";
      }
    });

    // Cập nhật thông báo nếu không có kết quả
    let noResultMsg = document.getElementById("homeGridNoResult");
    if (matchCount === 0) {
      if (!noResultMsg && stickerGrid) {
        noResultMsg = document.createElement("div");
        noResultMsg.id = "homeGridNoResult";
        noResultMsg.style.gridColumn = "1 / -1";
        noResultMsg.style.textAlign = "center";
        noResultMsg.style.padding = "48px 0";
        noResultMsg.style.color = "#7E6E64";
        noResultMsg.innerHTML = `
          <i data-lucide="package-open" style="width: 42px; height: 42px; margin-bottom: 12px; color: #A89A90;"></i>
          <p style="font-size: 15px; font-weight: 700;">Chưa có bộ sưu tập nào trong danh mục này.</p>
        `;
        stickerGrid.appendChild(noResultMsg);
        if (window.lucide) window.lucide.createIcons();
      }
    } else if (noResultMsg) {
      noResultMsg.remove();
    }
  }

  categoryItems.forEach(item => {
    item.addEventListener("click", () => {
      categoryItems.forEach(c => c.classList.remove("active"));
      item.classList.add("active");
      const cat = item.getAttribute("data-category") || "all";
      filterPacks(cat);
    });
  });

  drawerCategoryItems.forEach(item => {
    item.addEventListener("click", () => {
      drawerCategoryItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      const cat = item.getAttribute("data-category") || "all";
      filterPacks(cat);

      // Đồng bộ trạng thái trên Sidebar Desktop
      categoryItems.forEach(ci => {
        ci.classList.toggle("active", ci.getAttribute("data-category") === cat);
      });
    });
  });

  // ========================================================
  // 4. XỬ LÝ NÚT TẢI VỀ NHANH (QUICK DOWNLOAD)
  // ========================================================
  document.addEventListener("click", async function (e) {
    const btn = e.target.closest(".btn-download");
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    const packId = btn.getAttribute("data-id");
    const packName = btn.getAttribute("data-name") || "Bộ sưu tập";

    // Tránh bấm liên tục nhiều lần
    if (btn.disabled) return;
    btn.disabled = true;

    const originalHtml = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader" class="spin" style="width: 14px; height: 14px;"></i><span>Đang tải...</span>`;
    if (window.lucide) window.lucide.createIcons();

    try {
      if (packId) {
        // Ghi nhận lượt tải thực tế vào CSDL
        fetch(`/api/packs/${packId}/download`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `platform=web`
        }).catch(err => console.warn("Lỗi ghi nhận download:", err));
      }

      // Đổi trạng thái nút thành công
      btn.innerHTML = `<i data-lucide="check" style="width: 15px; height: 15px;"></i><span>Đã tải!</span>`;
      btn.style.backgroundColor = "#10B981";
      btn.style.borderColor = "#10B981";
      if (window.lucide) window.lucide.createIcons();

      notify(`Đã bắt đầu tải bộ sưu tập: ${packName}`);

      setTimeout(() => {
        btn.innerHTML = originalHtml;
        btn.style.backgroundColor = "";
        btn.style.borderColor = "";
        btn.disabled = false;
        if (window.lucide) window.lucide.createIcons();
      }, 2200);

    } catch (err) {
      console.error("Lỗi khi tải sticker:", err);
      btn.innerHTML = originalHtml;
      btn.disabled = false;
      notify("❌ Lỗi kết nối khi tải bộ sưu tập!");
    }
  });

  // ========================================================
  // 5. CÁC NÚT ĐIỀU HƯỚNG BỔ SỢ
  // ========================================================
  const heroExploreBtn = document.getElementById("heroExploreBtn");
  if (heroExploreBtn) {
    heroExploreBtn.addEventListener("click", () => {
      if (stickerGrid) {
        stickerGrid.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  // ========================================================
  // 6. CẬP NHẬT DỮ LIỆU TÌM KIẾM TOÀN CỤC CHO LAYOUT.JS
  // ========================================================
  const searchSeedScript = document.getElementById("initialSearchSeed");
  if (searchSeedScript && searchSeedScript.textContent.trim()) {
    try {
      const realPacks = JSON.parse(searchSeedScript.textContent);
      if (Array.isArray(realPacks) && realPacks.length > 0) {
        window.packsData = realPacks;
      }
    } catch (e) {
      console.warn("Không thể nạp initialSearchSeed:", e);
    }
  }
});

