/**
 * ========================================================
 * PAGE LOADING SCREEN UTILITY - STICKERHUB
 * ========================================================
 * Module quản lý hiệu ứng màn hình loading toàn trang.
 * Tự động đồng bộ với vòng đời tải trang (DOM, fonts, images)
 * và cung cấp API show/hide/wrap tiện ích cho các trang.
 */

const DEFAULT_TITLE = "Đang tải trang";
const DEFAULT_SUBTITLE = "Chuẩn bị những sticker thật xinh cho bạn!";
const MIN_DISPLAY_TIME = 350; // ms tối thiểu hiển thị để tránh chớp màn hình
const MAX_SAFETY_TIMEOUT = 3500; // ms tối đa an toàn tự động ẩn

class LoadingScreenManager {
  constructor() {
    this.loaderEl = null;
    this.titleEl = null;
    this.subtitleEl = null;
    this.showStartTime = 0;
    this.hideTimeout = null;
    this.safetyTimer = null;
    this.isInitialized = false;
    this.isShowing = false;
  }

  /**
   * Tạo hoặc lấy phần tử loading screen từ DOM
   */
  ensureDOM() {
    if (this.loaderEl && document.body && document.body.contains(this.loaderEl)) {
      return this.loaderEl;
    }

    let el = document.getElementById("screenLoader");
    if (!el) {
      el = document.createElement("div");
      el.id = "screenLoader";
      el.className = "screen-loading-wrapper";
      el.setAttribute("aria-label", "Đang tải trang");
      el.innerHTML = `
        <svg class="screen-paw-decor paw-tl" width="46" height="46" viewBox="0 0 24 24" fill="currentColor">
          <ellipse cx="12" cy="15" rx="7" ry="5.5"/><circle cx="5" cy="6" r="2.5"/><circle cx="12" cy="3.5" r="2.8"/><circle cx="19" cy="6" r="2.5"/>
        </svg>
        <svg class="screen-paw-decor paw-tr" width="46" height="46" viewBox="0 0 24 24" fill="currentColor">
          <ellipse cx="12" cy="15" rx="7" ry="5.5"/><circle cx="5" cy="6" r="2.5"/><circle cx="12" cy="3.5" r="2.8"/><circle cx="19" cy="6" r="2.5"/>
        </svg>
        <svg class="screen-paw-decor paw-bl" width="46" height="46" viewBox="0 0 24 24" fill="currentColor">
          <ellipse cx="12" cy="15" rx="7" ry="5.5"/><circle cx="5" cy="6" r="2.5"/><circle cx="12" cy="3.5" r="2.8"/><circle cx="19" cy="6" r="2.5"/>
        </svg>
        <svg class="screen-paw-decor paw-br" width="46" height="46" viewBox="0 0 24 24" fill="currentColor">
          <ellipse cx="12" cy="15" rx="7" ry="5.5"/><circle cx="5" cy="6" r="2.5"/><circle cx="12" cy="3.5" r="2.8"/><circle cx="19" cy="6" r="2.5"/>
        </svg>

        <div class="screen-loading-center">
          <div class="loading-header-brand">
            <img src="/assets/logo_cat.svg" alt="StickerHub" class="loading-brand-logo" width="32" height="32">
            <span class="loading-brand-title">Sticker<span class="hub-part">Hub</span></span>
          </div>

          <div class="loading-illustration-box">
            <img src="/assets/illustration_loading_cat.svg" alt="Bé mèo StickerHub" class="loading-cat-img" width="280" height="200">
          </div>

          <div class="loading-content-meta">
            <div class="loading-title" id="loadingTitleText">
              <span>${DEFAULT_TITLE}</span>
              <span class="loading-dots"><span>.</span><span>.</span><span>.</span></span>
            </div>
            <p class="loading-subtitle" id="loadingSubtitleText">${DEFAULT_SUBTITLE}</p>
          </div>

          <div class="loading-spinner-wrap">
            <div class="dot-spinner" aria-label="Đang tải">
              <div class="dot-spinner-leaf"></div><div class="dot-spinner-leaf"></div><div class="dot-spinner-leaf"></div>
              <div class="dot-spinner-leaf"></div><div class="dot-spinner-leaf"></div><div class="dot-spinner-leaf"></div>
              <div class="dot-spinner-leaf"></div><div class="dot-spinner-leaf"></div><div class="dot-spinner-leaf"></div>
              <div class="dot-spinner-leaf"></div><div class="dot-spinner-leaf"></div><div class="dot-spinner-leaf"></div>
            </div>
          </div>
        </div>
      `;

      if (document.body) {
        document.body.prepend(el);
      } else {
        document.documentElement.appendChild(el);
      }
    }

    this.loaderEl = el;
    this.titleEl = el.querySelector("#loadingTitleText span") || el.querySelector(".loading-title");
    this.subtitleEl = el.querySelector("#loadingSubtitleText") || el.querySelector(".loading-subtitle");
    return el;
  }

  /**
   * Hiển thị màn hình loading
   * @param {string} [title] - Tiêu đề (mặc định: "Đang tải trang")
   * @param {string} [subtitle] - Phụ đề (mặc định: "Chuẩn bị những sticker thật xinh cho bạn!")
   */
  show(title, subtitle) {
    const el = this.ensureDOM();
    if (!el) return;

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    if (title && this.titleEl) {
      const cleanTitle = title.replace(/\.+$/, "");
      this.titleEl.textContent = cleanTitle;
    }
    if (subtitle && this.subtitleEl) {
      this.subtitleEl.textContent = subtitle;
    }

    el.style.display = "flex";
    void el.offsetWidth;
    el.classList.remove("is-hidden");
    document.documentElement.classList.add("loading-active");
    if (document.body) document.body.classList.add("loading-active");
    this.isShowing = true;
    this.showStartTime = performance.now();

    // Safety timeout: tự động ẩn nếu quá thời gian tối đa
    if (this.safetyTimer) clearTimeout(this.safetyTimer);
    this.safetyTimer = setTimeout(() => {
      this.hide();
    }, MAX_SAFETY_TIMEOUT);
  }

  /**
   * Ẩn màn hình loading với hiệu ứng mờ dần mượt mà
   * @param {boolean} [force=false] - Bỏ qua thời gian tối thiểu
   */
  hide(force = false) {
    if (!this.loaderEl) {
      this.loaderEl = document.getElementById("screenLoader");
    }
    if (!this.loaderEl) return;

    if (this.safetyTimer) {
      clearTimeout(this.safetyTimer);
      this.safetyTimer = null;
    }

    const elapsed = performance.now() - (this.showStartTime || 0);
    const delay = force ? 0 : Math.max(0, MIN_DISPLAY_TIME - elapsed);

    if (this.hideTimeout) clearTimeout(this.hideTimeout);

    this.hideTimeout = setTimeout(() => {
      document.documentElement.classList.remove("loading-active");
      if (document.body) document.body.classList.remove("loading-active");
      if (this.loaderEl) {
        this.loaderEl.classList.add("is-hidden");
        this.isShowing = false;
        setTimeout(() => {
          if (!this.isShowing && this.loaderEl) {
            this.loaderEl.style.display = "none";
          }
        }, 360);
      }
    }, delay);
  }

  /**
   * Bọc một Promise: Tự động show và hide khi Promise hoàn tất
   * @param {Promise|Function} action
   * @param {string} [title]
   * @param {string} [subtitle]
   */
  async wrap(action, title, subtitle) {
    this.show(title, subtitle);
    try {
      const promise = typeof action === "function" ? action() : action;
      return await promise;
    } finally {
      this.hide();
    }
  }

  /**
   * Khởi chạy theo dõi tải trang
   * Khi mọi tài nguyên (DOM, Font chữ, Ảnh, API ban đầu) sẵn sàng thì mới ẩn đi
   */
  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Lấy phần tử đã có sẵn trong HTML (nếu có)
    const existing = document.getElementById("screenLoader");
    if (!existing) {
      // Nếu trang không khai báo sẵn #screenLoader, không tự ý hiện
      return;
    }

    document.documentElement.classList.add("loading-active");
    if (document.body) document.body.classList.add("loading-active");

    this.loaderEl = existing;
    this.titleEl = existing.querySelector("#loadingTitleText span") || existing.querySelector(".loading-title");
    this.subtitleEl = existing.querySelector("#loadingSubtitleText") || existing.querySelector(".loading-subtitle");
    this.isShowing = !existing.classList.contains("is-hidden") && existing.style.display !== "none";
    this.showStartTime = performance.now();

    const checkReadyAndHide = () => {
      if (document.readyState === "complete") {
        this.hide();
      } else {
        window.addEventListener("load", () => {
          this.hide();
        }, { once: true });
      }
    };

    // Đợi font chữ hệ thống tải xong nếu có hỗ trợ
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        checkReadyAndHide();
      }).catch(() => {
        checkReadyAndHide();
      });
    } else {
      checkReadyAndHide();
    }

    // Safety timeout: Sau 3.5s tự động ẩn nếu mạng nghẽn
    setTimeout(() => {
      this.hide();
    }, 3500);
  }
}

// Singleton instance
export const LoadingScreen = new LoadingScreenManager();

// Gắn toàn cục vào window
if (typeof window !== "undefined") {
  window.LoadingScreen = LoadingScreen;
  window.showLoading = (title, sub) => LoadingScreen.show(title, sub);
  window.hideLoading = (force) => LoadingScreen.hide(force);
}

export default LoadingScreen;
