/**
 * ========================================================
 * MASTER ADMIN LAYOUT JAVASCRIPT - STICKERHUB
 * ========================================================
 * Chứa logic dùng chung cho toàn bộ hệ thống Admin:
 * 1. Khởi tạo biểu tượng Lucide Icons
 * 2. Đóng / mở thanh điều hướng Sidebar trên thiết bị di động (Drawer & Backdrop)
 * 3. Đóng khi click ngoài, backdrop hoặc phím Escape
 * 4. Tiện ích hiển thị thông báo Toast (window.showToast)
 */

document.addEventListener("DOMContentLoaded", function () {
  // 1. Khởi tạo Lucide Icons nếu có thư viện
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 2. Logic Mobile Sidebar Drawer & Backdrop
  const sidebarToggleBtn = document.getElementById("sidebarToggleBtn");
  const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
  const adminSidebar = document.getElementById("adminSidebar");
  let backdrop = document.getElementById("adminSidebarBackdrop");

  // Tự động tạo backdrop nếu trang chưa có sẵn
  if (!backdrop && adminSidebar) {
    backdrop = document.createElement("div");
    backdrop.id = "adminSidebarBackdrop";
    backdrop.className = "admin-sidebar-backdrop";
    backdrop.setAttribute("aria-hidden", "true");
    document.body.appendChild(backdrop);
  }

  function openSidebar() {
    if (!adminSidebar) return;
    adminSidebar.classList.add("show-mobile");
    if (backdrop) backdrop.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeSidebar() {
    if (!adminSidebar) return;
    adminSidebar.classList.remove("show-mobile");
    if (backdrop) backdrop.classList.remove("active");
    document.body.style.overflow = "";
  }

  sidebarToggleBtn?.addEventListener("click", function (e) {
    e.stopPropagation();
    if (adminSidebar?.classList.contains("show-mobile")) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  sidebarCloseBtn?.addEventListener("click", function (e) {
    e.stopPropagation();
    closeSidebar();
  });

  backdrop?.addEventListener("click", closeSidebar);

  // Đóng bằng phím Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && adminSidebar?.classList.contains("show-mobile")) {
      closeSidebar();
    }
  });

  // Tự đóng khi mở rộng màn hình lớn hơn 900px
  window.addEventListener("resize", function () {
    if (window.innerWidth > 900 && adminSidebar?.classList.contains("show-mobile")) {
      closeSidebar();
    }
  });

  // Đóng drawer khi người dùng click vào link điều hướng (nếu là cùng trang / chuyển trang mượt)
  const navLinks = adminSidebar?.querySelectorAll(".admin-nav-item");
  navLinks?.forEach(function (link) {
    link.addEventListener("click", function () {
      if (window.innerWidth <= 900) {
        closeSidebar();
      }
    });
  });
});
