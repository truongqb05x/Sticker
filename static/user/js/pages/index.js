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

  // Helper escape HTML tránh XSS
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Render thẻ card bộ sưu tập sticker trên lưới
  function renderStickerCard(pack) {
    const slug = escapeHtml(pack.slug);
    const title = escapeHtml(pack.title);
    const coverImage = escapeHtml(pack.cover_image || '/assets/pack_cats.jpg');
    const catSlug = escapeHtml(pack.category_slug || 'others');
    const tagsStr = escapeHtml(pack.tags_str || '');
    const stickers = pack.total_stickers || 0;
    const downloadsFmt = escapeHtml(pack.total_downloads_fmt || '0');

    return `
      <div class="sticker-card" data-id="${pack.id}" data-slug="${slug}" data-category="${catSlug}" data-tags="${tagsStr}" data-name="${title}">
        <a href="/bo-suu-tap/${catSlug}/${slug}" class="card-preview" title="Xem chi tiết ${title}">
          <img src="${coverImage}" alt="${title}" loading="lazy" onerror="this.src='/assets/pack_cats.jpg'">
        </a>
        <div class="card-info">
          <div class="card-text">
            <a href="/bo-suu-tap/${catSlug}/${slug}" class="card-title-link" style="text-decoration: none; color: inherit;">
              <h3 class="card-title">${title}</h3>
            </a>
            <span class="card-subtitle">${stickers} sticker • ${downloadsFmt} tải</span>
          </div>
          <button type="button" class="btn-download" data-id="${pack.id}" data-name="${title}" title="Tải trọn bộ ${title}">
            <i data-lucide="download" style="width: 14px; height: 14px;"></i>
            <span>Tải về</span>
          </button>
        </div>
      </div>
    `;
  }

  // ========================================================
  // 3. TẢI VÀ LỌC BỘ SƯU TẬP THEO DANH MỤC
  // ========================================================
  const categoryItems = document.querySelectorAll(".category-item");
  const drawerCategoryItems = document.querySelectorAll(".drawer-sub-item");
  const stickerGrid = document.getElementById("stickerGrid");
  const sectionTitleIcon = document.getElementById("sectionTitleIcon");
  const sectionTitleText = document.getElementById("sectionTitleText");
  const seeAllBtn = document.getElementById("seeAllBtn");
  const seeAllText = document.getElementById("seeAllText");

  let currentCategory = "all";
  let isFetchingPacks = false;

  async function selectCategory(catSlug, catName, catIcon, shouldScroll = false, pushUrl = true) {
    if (isFetchingPacks && currentCategory === catSlug) return;
    currentCategory = catSlug || "all";

    // 1. Cập nhật cấu trúc URL trên thanh địa chỉ: /bo-suu-tap/<theloai> hoặc / khi chọn tất cả
    if (pushUrl && window.history && window.history.pushState) {
      const targetUrl = (currentCategory && currentCategory !== "all")
        ? `/bo-suu-tap/${encodeURIComponent(currentCategory)}`
        : "/";
      if (window.location.pathname !== targetUrl) {
        window.history.pushState(
          { category: currentCategory, name: catName, icon: catIcon },
          "",
          targetUrl
        );
      }
    }

    // 2. Đồng bộ trạng thái active trên cả Sidebar Desktop và Drawer Mobile
    categoryItems.forEach(ci => {
      ci.classList.toggle("active", ci.getAttribute("data-category") === currentCategory);
    });
    drawerCategoryItems.forEach(di => {
      di.classList.toggle("active", di.getAttribute("data-category") === currentCategory);
    });

    // 2. Cập nhật tiêu đề mục & nút "Xem tất cả"
    if (currentCategory === "all") {
      if (sectionTitleIcon) {
        sectionTitleIcon.innerHTML = `<i data-lucide="flame" style="color: #E64A38; fill: #E64A38;"></i>`;
      }
      if (sectionTitleText) {
        sectionTitleText.textContent = "Bộ sưu tập mới nhất";
      }
      if (seeAllBtn) {
        seeAllBtn.href = "/bo-suu-tap";
        seeAllBtn.setAttribute("title", "Xem tất cả bộ sưu tập");
      }
      if (seeAllText) {
        seeAllText.textContent = "Xem tất cả";
      }
    } else {
      const displayName = catName || "Danh mục";
      const displayIcon = catIcon || "tag";

      if (sectionTitleIcon) {
        sectionTitleIcon.innerHTML = `<i data-lucide="${displayIcon}" style="color: #C45832;"></i>`;
      }
      if (sectionTitleText) {
        sectionTitleText.textContent = displayName;
      }
      if (seeAllBtn) {
        seeAllBtn.href = `/bo-suu-tap/${encodeURIComponent(currentCategory)}`;
        seeAllBtn.setAttribute("title", `Xem tất cả bộ sưu tập trong danh mục ${displayName}`);
      }
      if (seeAllText) {
        seeAllText.textContent = `Xem tất cả (${displayName})`;
      }
    }

    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }

    // 3. Truy vấn các gói sticker thực tế từ CSDL qua REST API
    isFetchingPacks = true;
    if (stickerGrid) {
      stickerGrid.style.opacity = "0.5";
      stickerGrid.style.pointerEvents = "none";
    }

    try {
      const queryParam = currentCategory !== "all" ? `?category=${encodeURIComponent(currentCategory)}` : "";
      const res = await fetch(`/api/home/packs${queryParam}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.packs)) {
        const packs = data.packs;

        if (stickerGrid) {
          if (packs.length > 0) {
            stickerGrid.innerHTML = packs.map(renderStickerCard).join("");
          } else {
            const displayName = catName || "danh mục này";
            stickerGrid.innerHTML = `
              <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: #FAF5EE; border-radius: 14px; border: 1.5px dashed #E0D3C3;">
                <i data-lucide="package-open" style="width: 44px; height: 44px; margin-bottom: 12px; color: #9C8A7B;"></i>
                <h4 style="font-size: 16px; font-weight: 700; color: #35231B; margin-bottom: 6px;">Chưa có bộ sưu tập nào trong "${escapeHtml(displayName)}"</h4>
                <p style="font-size: 13.5px; color: #766557; margin-bottom: 14px;">Bạn có thể khám phá hàng ngàn sticker hấp dẫn khác ở danh mục bên dưới!</p>
                <button type="button" id="resetCatFilterBtn" style="padding: 7px 16px; background: #C45832; color: #fff; border: none; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; transition: background 0.15s;">
                  Quay lại tất cả danh mục
                </button>
              </div>
            `;
            const resetBtn = document.getElementById("resetCatFilterBtn");
            resetBtn?.addEventListener("click", () => {
              selectCategory("all", "Tất cả danh mục", "flame", true);
            });
          }
        }

        if (window.lucide && typeof window.lucide.createIcons === "function") {
          window.lucide.createIcons();
        }

        if (currentCategory !== "all") {
          notify(`Đang xem danh mục: ${catName}`);
        }
      }
    } catch (err) {
      console.error("[Home Category API Error]:", err);
      notify("Có lỗi kết nối khi tải danh mục sticker.");
    } finally {
      isFetchingPacks = false;
      if (stickerGrid) {
        stickerGrid.style.opacity = "1";
        stickerGrid.style.pointerEvents = "auto";
      }
    }

    // 4. Cuộn mượt đến lưới sticker nếu cần
    if (shouldScroll && stickerGrid) {
      stickerGrid.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // Đăng ký sự kiện click danh mục bên Sidebar Desktop
  categoryItems.forEach(item => {
    item.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.which === 2 || e.button === 1) return;
      e.preventDefault();
      const cat = item.getAttribute("data-category") || "all";
      const name = item.getAttribute("data-name") || item.querySelector(".cat-info span")?.textContent?.trim() || "Danh mục";
      const icon = item.getAttribute("data-icon") || "tag";
      selectCategory(cat, name, icon, false, true);
    });
  });

  // Đăng ký sự kiện click danh mục trong Mobile Drawer
  drawerCategoryItems.forEach(item => {
    item.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.which === 2 || e.button === 1) return;
      e.preventDefault();
      const cat = item.getAttribute("data-category") || "all";
      const name = item.getAttribute("data-name") || item.querySelector(".cat-info span")?.textContent?.trim() || "Danh mục";
      const icon = item.getAttribute("data-icon") || "tag";
      if (typeof window.closeDrawer === "function") {
        window.closeDrawer();
      }
      selectCategory(cat, name, icon, true, true);
    });
  });

  // Lắng nghe sự kiện popstate khi bấm nút Back/Forward trên trình duyệt
  window.addEventListener("popstate", () => {
    const path = window.location.pathname;
    if (path === "/" || path === "") {
      selectCategory("all", "Tất cả danh mục", "flame", false, false);
    } else {
      const match = path.match(/^\/bo-suu-tap\/([^/?#]+)/);
      if (match) {
        const slug = decodeURIComponent(match[1]);
        const matchedItem = document.querySelector(`.category-item[data-category="${slug}"]`) ||
                            document.querySelector(`.drawer-sub-item[data-category="${slug}"]`);
        const name = matchedItem?.getAttribute("data-name") || "Danh mục";
        const icon = matchedItem?.getAttribute("data-icon") || "tag";
        selectCategory(slug, name, icon, false, false);
      }
    }
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

