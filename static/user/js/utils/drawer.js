/**
 * ========================================================
 * UTILITY: MOBILE DRAWER CONTROLLER (drawer.js)
 * ========================================================
 * Quản lý menu trượt di động (Mobile Drawer), lớp phủ mờ (Backdrop)
 * và các hộp đóng mở nội dung danh mục (Accordions).
 */

/**
 * Mở thanh trượt menu Mobile Drawer
 */
export function openDrawer() {
  const mobileDrawer = document.getElementById("mobileDrawer");
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  if (mobileDrawer) mobileDrawer.classList.add("active");
  if (drawerBackdrop) drawerBackdrop.classList.add("active");
  document.body.style.overflow = "hidden";
}

/**
 * Đóng thanh trượt menu Mobile Drawer
 */
export function closeDrawer() {
  const mobileDrawer = document.getElementById("mobileDrawer");
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  if (mobileDrawer) mobileDrawer.classList.remove("active");
  if (drawerBackdrop) drawerBackdrop.classList.remove("active");
  document.body.style.overflow = "";
}

/**
 * Bật/Tắt Accordion (Danh mục & Bộ sưu tập nổi bật) trong Drawer
 * @param {string} id 
 */
export function toggleDrawerAccordion(id) {
  const acc = document.getElementById(id);
  if (!acc) return;
  const btn = acc.querySelector(".drawer-accordion-btn");
  const content = acc.querySelector(".drawer-accordion-content");
  const isOpen = acc.classList.toggle("open");

  if (btn) btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  if (content) {
    content.style.maxHeight = isOpen ? content.scrollHeight + "px" : "0px";
  }
}

/**
 * Xử lý khi bấm vào mục nổi bật trong Drawer
 * @param {string} name 
 */
export function handleDrawerFeaturedClick(name) {
  closeDrawer();
}

/**
 * Khởi tạo sự kiện mở/đóng Mobile Drawer
 */
export function initDrawer() {
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const drawerCloseBtn = document.getElementById("drawerCloseBtn");
  const drawerBackdrop = document.getElementById("drawerBackdrop");

  mobileMenuBtn?.addEventListener("click", openDrawer);
  drawerCloseBtn?.addEventListener("click", closeDrawer);
  drawerBackdrop?.addEventListener("click", closeDrawer);
}

