/**
 * ========================================================
 * UTILITY: NAVIGATION CONTROLLER (navigation.js)
 * ========================================================
 * Quản lý trạng thái tab điều hướng trên Header và Mobile Drawer,
 * hỗ trợ cuộn mượt và kích hoạt active tab tương ứng.
 */

/**
 * Xử lý chuyển đổi active tab và cuộn trang
 * @param {string} tab 
 */
export function handleTabClick(tab) {
  const navLinks = document.querySelectorAll(".nav-link");
  const drawerNavItems = document.querySelectorAll(".drawer-nav-item");

  navLinks.forEach((l) => l.classList.toggle("active", l.getAttribute("data-tab") === tab));
  drawerNavItems.forEach((i) => i.classList.toggle("active", i.getAttribute("data-tab") === tab));

  if (tab === "home") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

/**
 * Khởi tạo các sự kiện click trên thanh điều hướng Header & Drawer
 */
export function initNavigation() {
  const navLinks = document.querySelectorAll(".nav-link");
  const drawerNavItems = document.querySelectorAll(".drawer-nav-item");

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (href && href !== "#" && !href.startsWith("javascript:")) {
        return; // Cho phép điều hướng URL trang thông thường
      }
      e.preventDefault();
      const tab = link.getAttribute("data-tab");
      handleTabClick(tab);
    });
  });

  drawerNavItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      const href = item.getAttribute("href");
      if (href && href !== "#" && !href.startsWith("javascript:")) {
        if (typeof window.closeDrawer === "function") window.closeDrawer();
        return; // Cho phép điều hướng URL trang thông thường
      }
      e.preventDefault();
      const tab = item.getAttribute("data-tab");
      if (typeof window.closeDrawer === "function") window.closeDrawer();
      handleTabClick(tab);
    });
  });
}