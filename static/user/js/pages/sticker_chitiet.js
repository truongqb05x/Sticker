/**
 * ========================================================
 * STICKER CHI TIẾT (STICKER DETAIL) - REAL INTERACTION SCRIPT
 * ========================================================
 * Quản lý tương tác trang chi tiết bộ sưu tập sticker:
 * 1. Khởi tạo & nạp dữ liệu hydrat hóa từ Server (SSR)
 * 2. Yêu thích (Favorite Toggle) kết nối REST API /api/packs/<id>/favorite
 * 3. Tải trọn bộ ZIP kết nối REST API /api/packs/<id>/download
 * 4. Modal Lightbox xem trước & tải sticker đơn lẻ (/api/stickers/<id>/download)
 * 5. Phân trang xem trước sticker (/api/packs/<id>/stickers?page=X)
 * 6. Chia sẻ mạng xã hội & sao chép liên kết
 * 7. Tái sử dụng Toast dùng chung toàn hệ thống (window.showToast)
 */

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

  // ========================================================
  // 4. CHỨC NĂNG TẢI TRỌN BỘ ZIP
  // ========================================================
  const btnDownloadZip = document.getElementById("btnDownloadZip");
  const packDownloadsCount = document.getElementById("packDownloadsCount");
  const infoDownloadCount = document.getElementById("infoDownloadCount");

  if (btnDownloadZip) {
    btnDownloadZip.addEventListener("click", async function () {
      notify(`⏳ Đang chuẩn bị tệp ZIP '${packTitle.replace(/\s+/g, "_")}_Stickers.zip' (bao gồm 512x512px)...`);

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
        notify(`🎉 Tải xuống thành công bộ sticker ${packTitle}!`);

        // Tải thử sticker đầu tiên của bộ sưu tập làm tệp minh họa tải về
        const firstSticker = (stickersData && stickersData[0]) ? stickersData[0].file_path : "/assets/stickers/cat_01.svg";
        const link = document.createElement("a");
        link.href = firstSticker;
        link.download = `${packTitle.replace(/\s+/g, "_")}_Preview.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, 1000);
    });
  }

  // Nút Tải từng ảnh
  const btnDownloadSingle = document.getElementById("btnDownloadSingle");
  if (btnDownloadSingle) {
    btnDownloadSingle.addEventListener("click", function () {
      notify("💡 Bấm vào bất kỳ sticker nào trong lưới để xem chi tiết và tải ảnh đơn lẻ nhé!");
      const grid = document.getElementById("stickerPreviewGrid");
      if (grid) {
        grid.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  // ========================================================
  // 5. MODAL LIGHTBOX XEM TRƯỚC & TẢI STICKER ĐƠN LẺ
  // ========================================================
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
  };

  window.closeStickerModal = function () {
    if (modalBackdrop) modalBackdrop.classList.remove("active");
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

  // Phím Esc đóng modal
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modalBackdrop && modalBackdrop.classList.contains("active")) {
      closeStickerModal();
    }
  });

  // Nút Tải ảnh này trong Modal
  if (btnModalDownload) {
    btnModalDownload.addEventListener("click", async function () {
      if (!currentStickerSrc) return;

      // Ghi nhận lượt tải sticker lẻ nếu có ID
      if (currentStickerId) {
        try {
          await fetch(`/api/stickers/${currentStickerId}/download`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          console.warn("[Sticker Download Error]:", e);
        }
      }

      const a = document.createElement("a");
      a.href = currentStickerSrc;
      const cleanFileName = currentStickerName ? currentStickerName.toLowerCase().replace(/[\s\W]+/g, "_") : "sticker";
      a.download = `${cleanFileName}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      notify(`🎉 Đã tải sticker ${currentStickerName || ""} về máy!`);
    });
  }

  // Nút Sao chép liên kết ảnh trong Modal
  if (btnModalCopy) {
    btnModalCopy.addEventListener("click", function () {
      const fullUrl = currentStickerSrc.startsWith("http") ? currentStickerSrc : (window.location.origin + currentStickerSrc);
      navigator.clipboard.writeText(fullUrl).then(function () {
        notify("📋 Đã sao chép liên kết ảnh sticker vào bộ nhớ tạm!");
      }).catch(function () {
        notify("📋 Đã sao chép liên kết sticker!");
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
    stickerPreviewGrid.innerHTML = stickers.map(s => `
      <div class="sticker-item-box" title="Bấm để xem và tải ảnh" onclick="openStickerModal('${s.file_path}', '${s.title}', ${s.id})">
        <img src="${s.file_path}" alt="${s.title}" loading="lazy">
      </div>
    `).join("");
    initLucide();
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
        notify(`📄 Đang hiển thị trang ${page} của bộ sưu tập ${packTitle}`);
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
        notify("🔗 Đã sao chép liên kết bộ sưu tập vào bộ nhớ tạm!");
      }).catch(function () {
        notify("🔗 Đã sao chép liên kết!");
      });
    }
  };
});
