/**
 * ========================================================
 * STICKER CHI TIẾT (STICKER DETAIL) INTERACTION SCRIPT
 * ========================================================
 */

document.addEventListener("DOMContentLoaded", function () {
  // 1. Khởi tạo Lucide Icons nếu có
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 2. Chức năng Yêu thích (Favorite toggle)
  const favBtn = document.getElementById("favBtn");
  const favCount = document.getElementById("favCount");
  let isFavorited = false;
  let currentLikes = 2400;

  if (favBtn) {
    favBtn.addEventListener("click", function () {
      isFavorited = !isFavorited;
      if (isFavorited) {
        favBtn.classList.add("is-favorited");
        currentLikes++;
        favCount.textContent = (currentLikes / 1000).toFixed(1) + "K yêu thích";
        showToast("❤️ Đã thêm Cute Cats vào danh sách yêu thích!");
      } else {
        favBtn.classList.remove("is-favorited");
        currentLikes--;
        favCount.textContent = (currentLikes / 1000).toFixed(1) + "K yêu thích";
        showToast("Đã xóa khỏi danh sách yêu thích.");
      }
    });
  }

  // 3. Tải về ZIP
  const btnDownloadZip = document.getElementById("btnDownloadZip");
  if (btnDownloadZip) {
    btnDownloadZip.addEventListener("click", function () {
      showToast("⏳ Đang chuẩn bị tệp ZIP 'Cute_Cats_120_Stickers.zip'...");
      setTimeout(function () {
        showToast("🎉 Tải xuống thành công bộ sticker Cute Cats!");
        // Tải thử sticker đầu tiên làm tệp minh họa nếu muốn
        const link = document.createElement("a");
        link.href = "../../assets/stickers/cat_01.svg";
        link.download = "Cute_Cat_Sticker.svg";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, 1200);
    });
  }

  // 4. Tải từng ảnh
  const btnDownloadSingle = document.getElementById("btnDownloadSingle");
  if (btnDownloadSingle) {
    btnDownloadSingle.addEventListener("click", function () {
      showToast("💡 Bấm vào bất kỳ sticker nào trong lưới để xem và tải ảnh đơn lẻ nhé!");
    });
  }

  // 5. Modal Lightbox Xem & Tải Sticker Đơn Lẻ
  const modalBackdrop = document.getElementById("stickerModalBackdrop");
  const modalImg = document.getElementById("modalStickerImg");
  const modalTitle = document.getElementById("modalStickerTitle");
  const btnModalDownload = document.getElementById("btnModalDownload");
  const btnModalCopy = document.getElementById("btnModalCopy");
  const modalCloseBtn = document.getElementById("modalCloseBtn");

  let currentStickerSrc = "";
  let currentStickerName = "";

  window.openStickerModal = function (src, name, index) {
    currentStickerSrc = src;
    currentStickerName = name;
    if (modalImg) modalImg.src = src;
    if (modalTitle) modalTitle.textContent = name || ("Cute Cat #" + index);
    if (modalBackdrop) modalBackdrop.classList.add("active");
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

  if (btnModalDownload) {
    btnModalDownload.addEventListener("click", function () {
      if (!currentStickerSrc) return;
      const a = document.createElement("a");
      a.href = currentStickerSrc;
      a.download = (currentStickerName ? currentStickerName.toLowerCase().replace(/\s+/g, "_") : "sticker") + ".svg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast("🎉 Đã tải sticker " + (currentStickerName || "") + " về máy!");
    });
  }

  if (btnModalCopy) {
    btnModalCopy.addEventListener("click", function () {
      navigator.clipboard.writeText(window.location.origin + "/" + currentStickerSrc).then(function () {
        showToast("📋 Đã sao chép liên kết ảnh sticker!");
      }).catch(function () {
        showToast("📋 Đã sao chép liên kết sticker!");
      });
    });
  }

  // 6. Phân trang tương tác
  const pageBtns = document.querySelectorAll(".page-btn:not(.page-arrow)");
  pageBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      pageBtns.forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      const pageNum = this.textContent.trim();
      showToast("📄 Đang hiển thị trang " + pageNum + " của bộ sưu tập Cute Cats");
    });
  });

  // 7. Chia sẻ mạng xã hội
  window.shareSocial = function (platform) {
    const pageUrl = encodeURIComponent(window.location.href);
    const title = encodeURIComponent("Khám phá bộ sưu tập sticker Cute Cats siêu dễ thương trên StickerHub!");

    if (platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`, "_blank", "width=600,height=400");
    } else if (platform === "zalo") {
      window.open(`https://sp.zalo.me/share?url=${pageUrl}`, "_blank", "width=600,height=400");
    } else if (platform === "x") {
      window.open(`https://twitter.com/intent/tweet?url=${pageUrl}&text=${title}`, "_blank", "width=600,height=400");
    } else if (platform === "link") {
      navigator.clipboard.writeText(window.location.href).then(function () {
        showToast("🔗 Đã sao chép liên kết bộ sưu tập vào bộ nhớ tạm!");
      }).catch(function () {
        showToast("🔗 Đã sao chép liên kết!");
      });
    }
  };
});

// Toast notification helper dùng chung
function showToast(message) {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(function () {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.25s ease";
    setTimeout(() => toast.remove(), 250);
  }, 2600);
}
