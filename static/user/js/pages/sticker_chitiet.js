document.addEventListener("DOMContentLoaded", function () {
  // 1. Khởi tạo Lucide Icons
  const initLucide = () => {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  };
  initLucide();

  // Helper hiển thị thông báo dùng chung
  const notify = (msg) => {
    if (typeof window.showToast === "function") {
      window.showToast(msg);
    } else {
      console.log("[Toast]", msg);
    }
  };

  // Helper định dạng số gọn
  const formatCompact = (num) => {
    try {
      const n = parseInt(num, 10);
      if (isNaN(n)) return num || "0";
      if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
      if (n >= 1000) return (n / 1000).toFixed(1) + "K";
      return n.toLocaleString("vi-VN");
    } catch (e) {
      return num || "0";
    }
  };

  // 2. Đọc dữ liệu Hydration từ Server
  let packData = null;
  let stickersData = [];
  let paginationData = { page: 1, limit: 20, total: 0, total_pages: 1 };

  const hydrationScript = document.getElementById("initialPackData");
  if (hydrationScript) {
    try {
      const initial = JSON.parse(hydrationScript.textContent);
      if (initial) {
        packData = initial.pack || null;
        stickersData = initial.stickers || [];
        paginationData = initial.pagination || paginationData;
      }
    } catch (e) {
      console.warn("[Hydration] Không thể phân tích initialPackData:", e);
    }
  }

  const packId = packData ? packData.id : (document.getElementById("btnDownloadZip")?.getAttribute("data-pack-id") || 1);
  const packTitle = packData ? packData.title : (document.getElementById("btnDownloadZip")?.getAttribute("data-pack-title") || "Sticker");

  // ========================================================
  // 3. CHỨC NĂNG YÊU THÍCH (FAVORITE TOGGLE)
  // ========================================================
  const favBtn = document.getElementById("favBtn");
  const favCount = document.getElementById("favCount");
  const infoFavCount = document.getElementById("infoFavCount");
  let isFavLoading = false;

  if (favBtn) {
    favBtn.addEventListener("click", async function () {
      if (isFavLoading) return;
      isFavLoading = true;

      try {
        const response = await fetch(`/api/packs/${packId}/favorite`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();

        if (result.success) {
          favBtn.classList.toggle("is-favorited", result.is_favorited);
          const compactText = result.total_favorites_compact;
          if (favCount) favCount.textContent = `${compactText} yêu thích`;
          if (infoFavCount) infoFavCount.textContent = compactText;

          notify(result.message || (result.is_favorited ? "❤️ Đã thêm vào yêu thích!" : "Đã xóa khỏi yêu thích."));
          initLucide();
        } else {
          notify(result.message || "Không thể thực hiện thao tác yêu thích!");
        }
      } catch (err) {
        console.error("[Favorite Error]:", err);
        notify("Lỗi kết nối khi cập nhật yêu thích!");
      } finally {
        isFavLoading = false;
      }
    });
  }

  const btnDownloadZip = document.getElementById("btnDownloadZip");
  const packDownloadsCount = document.getElementById("packDownloadsCount");
  const infoDownloadCount = document.getElementById("infoDownloadCount");

  if (btnDownloadZip) {
    btnDownloadZip.addEventListener("click", async function () {
      notify(` Đang chuẩn bị tệp ZIP '${packTitle.replace(/\s+/g, "_")}_Stickers.zip' (bao gồm 512x512px)...`);

      try {
        const response = await fetch(`/api/packs/${packId}/download`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData.success && resData.downloads) {
            const compactText = formatCompact(resData.downloads);
            if (packDownloadsCount) packDownloadsCount.textContent = `${compactText} lượt tải`;
            if (infoDownloadCount) infoDownloadCount.textContent = compactText;
          }
        }
      } catch (err) {
        console.warn("[Download Log Error]:", err);
      }

      setTimeout(function () {
        notify(` Tải xuống thành công bộ sticker ${packTitle}!`);

        if (!stickersData || stickersData.length === 0) {
          notify(" Bộ sưu tập hiện chưa có sticker nào để tải về!");
          return;
        }
        const firstSticker = stickersData[0].file_path;
        const link = document.createElement("a");
        link.href = firstSticker;
        link.download = `${packTitle.replace(/\s+/g, "_")}_Preview.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, 1000);
    });
  }

  // ========================================================
  // ONBOARDING TOUR HƯỚNG DẪN TẢI TỪNG ẢNH ĐƠN LẺ
  // ========================================================
  let isOnboardingTourActive = false;
  let onboardingStep = 0;
  let tourBackdrop = null;

  function getOrCreateTourBackdrop() {
    let bd = document.getElementById("onboardingTourBackdrop");
    if (!bd) {
      bd = document.createElement("div");
      bd.id = "onboardingTourBackdrop";
      bd.className = "onboarding-tour-backdrop";
      document.body.appendChild(bd);
      bd.addEventListener("click", function () {
        endOnboardingTour(false);
      });
    }
    return bd;
  }

  function startSingleDownloadTour() {
    const firstSticker = document.querySelector("#stickerPreviewGrid .sticker-item-box");
    if (!firstSticker) {
      notify("Bộ sưu tập hiện chưa có sticker nào để tải về!");
      return;
    }

    // Kết thúc tour cũ nếu có
    endOnboardingTour(false);

    isOnboardingTourActive = true;
    onboardingStep = 1;

    // Cuộn tới vị trí sticker đầu tiên
    firstSticker.scrollIntoView({ behavior: "smooth", block: "center" });

    // Hiển thị backdrop mờ nhẹ
    tourBackdrop = getOrCreateTourBackdrop();
    tourBackdrop.classList.add("active");

    // Đánh dấu highlight sticker #1
    firstSticker.classList.add("onboarding-target-pulse");

    // Tạo bóng thoại hướng dẫn Step 1
    const bubble = document.createElement("div");
    bubble.id = "onboardingBubbleStep1";
    bubble.className = "onboarding-tour-bubble step-1";
    bubble.innerHTML = `
      <div class="onboarding-bubble-top">
        <span class="onboarding-bubble-badge">
          Bước 1 / 2: Chọn sticker
        </span>
        <button type="button" class="onboarding-bubble-close" id="onboardingSkipBtn1" title="Bỏ qua hướng dẫn">
          <i data-lucide="x" style="width: 13px; height: 13px;"></i>
        </button>
      </div>
      <p class="onboarding-bubble-desc">
        Nhấp vào <strong>sticker số 1</strong> (hoặc bất kỳ ảnh nào) để mở xem trước.
      </p>
    `;
    firstSticker.appendChild(bubble);

    // Tạo bàn tay chỉ trỏ nhấp nháy Step 1
    const hand = document.createElement("div");
    hand.id = "onboardingHandStep1";
    hand.className = "onboarding-hand-indicator step-1";
    hand.innerHTML = `
      <span class="onboarding-hand-emoji">👆</span>
      <div class="onboarding-touch-ripple"></div>
    `;
    firstSticker.appendChild(hand);

    // Gắn sự kiện nút bỏ qua Step 1
    document.getElementById("onboardingSkipBtn1")?.addEventListener("click", function (e) {
      e.stopPropagation();
      endOnboardingTour(false);
    });

    initLucide();
  }

  function startTourStep2() {
    if (!isOnboardingTourActive) return;

    // Dọn dẹp Step 1
    cleanStep1Elements();

    onboardingStep = 2;

    const modalDownloadBtn = document.getElementById("btnModalDownload");
    const actionsRow = document.querySelector(".modal-actions-row");
    const modalBox = document.querySelector(".sticker-modal");

    if (!modalDownloadBtn || !actionsRow || !modalBox) return;

    // Highlight nút Tải ảnh này
    modalDownloadBtn.classList.add("onboarding-target-btn-pulse");

    // Thẻ hướng dẫn Step 2 trong modal
    const guideCard = document.createElement("div");
    guideCard.id = "onboardingModalGuideCard";
    guideCard.className = "onboarding-modal-guide-card";
    guideCard.innerHTML = `
      <div class="onboarding-bubble-top">
        <span class="onboarding-bubble-badge">
          Bước 2 / 2: Tải ảnh về máy
        </span>
        <button type="button" class="onboarding-bubble-close" id="onboardingSkipBtn2" title="Bỏ qua hướng dẫn">
          <i data-lucide="x" style="width: 13px; height: 13px;"></i>
        </button>
      </div>
      <p class="onboarding-bubble-desc">
        Nhấn vào <strong>"Tải ảnh này"</strong> bên dưới để lưu sticker về thiết bị.
      </p>
    `;
    modalBox.insertBefore(guideCard, actionsRow);

    // Bàn tay chỉ trỏ Step 2 chỉ thẳng vào nút tải
    const handBtn = document.createElement("div");
    handBtn.id = "onboardingHandStep2";
    handBtn.className = "onboarding-hand-indicator step-2";
    handBtn.innerHTML = `
      <span class="onboarding-hand-emoji">👇</span>
      <div class="onboarding-touch-ripple"></div>
    `;
    modalDownloadBtn.appendChild(handBtn);

    // Gắn sự kiện nút bỏ qua Step 2
    document.getElementById("onboardingSkipBtn2")?.addEventListener("click", function () {
      endOnboardingTour(false);
    });

    initLucide();
  }

  function cleanStep1Elements() {
    document.querySelectorAll(".onboarding-target-pulse").forEach(el => {
      el.classList.remove("onboarding-target-pulse");
    });
    document.getElementById("onboardingBubbleStep1")?.remove();
    document.getElementById("onboardingHandStep1")?.remove();
    if (tourBackdrop) {
      tourBackdrop.classList.remove("active");
    }
  }

  function endOnboardingTour(isCompleted) {
    cleanStep1Elements();

    const modalDownloadBtn = document.getElementById("btnModalDownload");
    if (modalDownloadBtn) {
      modalDownloadBtn.classList.remove("onboarding-target-btn-pulse");
    }
    document.getElementById("onboardingModalGuideCard")?.remove();
    document.getElementById("onboardingHandStep2")?.remove();

    isOnboardingTourActive = false;
    onboardingStep = 0;
  }

  // Nút Tải từng ảnh -> Kích hoạt Onboarding Tour
  const btnDownloadSingle = document.getElementById("btnDownloadSingle");
  if (btnDownloadSingle) {
    btnDownloadSingle.addEventListener("click", function () {
      startSingleDownloadTour();
    });
  }

  const modalBackdrop = document.getElementById("stickerModalBackdrop");
  const modalImg = document.getElementById("modalStickerImg");
  const modalTitle = document.getElementById("modalStickerTitle");
  const modalMeta = document.getElementById("modalStickerMeta");
  const btnModalDownload = document.getElementById("btnModalDownload");
  const btnModalCopy = document.getElementById("btnModalCopy");
  const modalCloseBtn = document.getElementById("modalCloseBtn");

  let currentStickerSrc = "";
  let currentStickerName = "";
  let currentStickerId = null;

  window.openStickerModal = function (src, name, id) {
    currentStickerSrc = src;
    currentStickerName = name;
    currentStickerId = id;

    if (modalImg) modalImg.src = src;
    if (modalTitle) modalTitle.textContent = name || `${packTitle} #${id || ""}`;
    if (modalMeta) modalMeta.textContent = "Kích thước: 512x512px • Định dạng: SVG / PNG";
    if (modalBackdrop) modalBackdrop.classList.add("active");
    initLucide();

    // Nếu đang trong Onboarding Tour bước 1, chuyển sang bước 2
    if (isOnboardingTourActive && onboardingStep === 1) {
      setTimeout(startTourStep2, 220);
    }
  };

  window.closeStickerModal = function () {
    if (modalBackdrop) modalBackdrop.classList.remove("active");
    if (isOnboardingTourActive) {
      endOnboardingTour(false);
    }
  };

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeStickerModal);
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", function (e) {
      if (e.target === modalBackdrop) {
        closeStickerModal();
      }
    });
  }

  // Phím Esc đóng modal hoặc thoát tour
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (modalBackdrop && modalBackdrop.classList.contains("active")) {
        closeStickerModal();
      } else if (isOnboardingTourActive) {
        endOnboardingTour(false);
      }
    }
  });

  // Nút Tải ảnh này trong Modal
  if (btnModalDownload) {
    btnModalDownload.addEventListener("click", async function () {
      if (!currentStickerSrc) return;

      // Ghi nhận lượt tải sticker lẻ nếu có ID
      if (currentStickerId) {
        try {
          const response = await fetch(`/api/stickers/${currentStickerId}/download`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          if (response.ok) {
            const resData = await response.json();
            if (resData.success && resData.pack_downloads !== undefined) {
              const compactText = formatCompact(resData.pack_downloads);
              if (packDownloadsCount) packDownloadsCount.textContent = `${compactText} lượt tải`;
              if (infoDownloadCount) infoDownloadCount.textContent = compactText;
            }
          }
        } catch (e) {
          console.warn("[Sticker Download Error]:", e);
        }
      }

      const a = document.createElement("a");
      a.href = currentStickerSrc;
      const fileExt = currentStickerSrc.split('.').pop().split(/[?#]/)[0] || 'png';
      const cleanFileName = currentStickerName ? currentStickerName.toLowerCase().replace(/[\s\W]+/g, "_") : "sticker";
      a.download = `${cleanFileName}.${fileExt}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (isOnboardingTourActive && onboardingStep === 2) {
        endOnboardingTour(true);
      }
    });
  }

  // Nút Sao chép liên kết ảnh trong Modal
  if (btnModalCopy) {
    btnModalCopy.addEventListener("click", function () {
      const fullUrl = currentStickerSrc.startsWith("http") ? currentStickerSrc : (window.location.origin + currentStickerSrc);
      navigator.clipboard.writeText(fullUrl).then(function () {
        notify(" Đã sao chép liên kết ảnh sticker vào bộ nhớ tạm!");
      }).catch(function () {
        notify(" Đã sao chép liên kết sticker!");
      });
    });
  }

  // ========================================================
  // 6. PHÂN TRANG XEM TRƯỚC STICKER (/api/packs/<id>/stickers)
  // ========================================================
  const stickerPreviewGrid = document.getElementById("stickerPreviewGrid");
  const prevStickersBtn = document.getElementById("prevStickersBtn");
  const nextStickersBtn = document.getElementById("nextStickersBtn");
  const pageNumbersContainer = document.getElementById("pageNumbersContainer");

  function renderStickersGrid(stickers) {
    if (!stickerPreviewGrid) return;
    if (!stickers || stickers.length === 0) {
      stickerPreviewGrid.innerHTML = `
        <div class="empty-stickers-box" style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 20px; text-align: center; background: #FAF5EE; border-radius: 12px; border: 1.5px dashed #DFD3C4;">
          <i data-lucide="package-open" style="width: 44px; height: 44px; color: #C45832; margin-bottom: 12px;"></i>
          <h4 style="font-size: 15px; font-weight: 700; color: #2D1C14; margin-bottom: 4px;">Chưa có sticker nào</h4>
          <p style="font-size: 13px; color: #8C7B71; margin: 0;">Bộ sưu tập này chưa có sticker nào được thêm vào.</p>
        </div>
      `;
      initLucide();
      return;
    }
    stickerPreviewGrid.innerHTML = stickers.map(s => `
      <div class="sticker-item-box" title="Bấm để xem và tải ảnh" data-src="${escapeHtml(s.file_path)}" data-title="${escapeHtml(s.title)}" data-id="${s.id}">
        <img src="${escapeHtml(s.file_path)}" alt="${escapeHtml(s.title)}" loading="lazy">
      </div>
    `).join("");
    initLucide();
  }

  // Sự kiện click mở modal xem sticker lớn (Event Delegation cho cả SSR và AJAX)
  if (stickerPreviewGrid) {
    stickerPreviewGrid.addEventListener("click", function (e) {
      const box = e.target.closest(".sticker-item-box");
      if (!box) return;
      const src = box.getAttribute("data-src") || "";
      const name = box.getAttribute("data-title") || "";
      const id = box.getAttribute("data-id") || null;
      window.openStickerModal(src, name, id);
    });
  }

  function updateStickerPaginationUI(pagination) {
    if (prevStickersBtn) prevStickersBtn.disabled = !pagination.has_prev;
    if (nextStickersBtn) nextStickersBtn.disabled = !pagination.has_next;

    if (pageNumbersContainer) {
      let btnsHtml = "";
      for (let p = 1; p <= pagination.total_pages; p++) {
        btnsHtml += `<button class="page-btn ${p === pagination.page ? 'active' : ''}" data-page="${p}">${p}</button>`;
      }
      pageNumbersContainer.innerHTML = btnsHtml;
      bindPageNumberEvents();
    }
  }

  async function fetchStickersPage(page) {
    if (!stickerPreviewGrid) return;
    stickerPreviewGrid.style.opacity = "0.5";

    try {
      const response = await fetch(`/api/packs/${packId}/stickers?page=${page}&limit=${paginationData.limit || 20}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (data.success) {
        stickersData = data.stickers;
        paginationData = data.pagination;
        renderStickersGrid(data.stickers);
        updateStickerPaginationUI(data.pagination);
        notify(` Đang hiển thị trang ${page} của bộ sưu tập ${packTitle}`);
      }
    } catch (err) {
      console.error("[Fetch Stickers Error]:", err);
      notify("Có lỗi khi tải trang sticker!");
    } finally {
      stickerPreviewGrid.style.opacity = "1";
    }
  }

  function bindPageNumberEvents() {
    if (!pageNumbersContainer) return;
    const pageBtns = pageNumbersContainer.querySelectorAll(".page-btn");
    pageBtns.forEach(btn => {
      btn.addEventListener("click", function () {
        const pageNum = parseInt(this.getAttribute("data-page"), 10);
        if (pageNum && pageNum !== paginationData.page) {
          fetchStickersPage(pageNum);
        }
      });
    });
  }
  bindPageNumberEvents();

  if (prevStickersBtn) {
    prevStickersBtn.addEventListener("click", function () {
      if (paginationData.page > 1) {
        fetchStickersPage(paginationData.page - 1);
      }
    });
  }

  if (nextStickersBtn) {
    nextStickersBtn.addEventListener("click", function () {
      if (paginationData.page < paginationData.total_pages) {
        fetchStickersPage(paginationData.page + 1);
      }
    });
  }

  // ========================================================
  // 7. CHIA SẺ MẠNG XÃ HỘI
  // ========================================================
  window.shareSocial = function (platform) {
    const pageUrl = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(`Khám phá bộ sưu tập sticker ${packTitle} siêu dễ thương trên StickerHub!`);

    if (platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`, "_blank", "width=600,height=400");
    } else if (platform === "zalo") {
      window.open(`https://sp.zalo.me/share?url=${pageUrl}`, "_blank", "width=600,height=400");
    } else if (platform === "x") {
      window.open(`https://twitter.com/intent/tweet?url=${pageUrl}&text=${title}`, "_blank", "width=600,height=400");
    } else if (platform === "link") {
      navigator.clipboard.writeText(window.location.href).then(function () {
        notify(" Đã sao chép liên kết bộ sưu tập vào bộ nhớ tạm!");
      }).catch(function () {
        notify(" Đã sao chép liên kết!");
      });
    }
  };
});
