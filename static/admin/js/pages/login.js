/**
 * ========================================================
 * ADMIN LOGIN INTERACTION SCRIPT - STICKERHUB
 * ========================================================
 */

document.addEventListener("DOMContentLoaded", function () {
  // 1. Khởi tạo Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 2. Chức năng Toggle Ẩn / Hiện mật khẩu
  const togglePwdBtn = document.getElementById("togglePasswordBtn");
  const pwdInput = document.getElementById("adminPassword");
  const eyeIcon = document.getElementById("eyeIcon");

  if (togglePwdBtn && pwdInput) {
    togglePwdBtn.addEventListener("click", function () {
      const isPassword = pwdInput.type === "password";
      pwdInput.type = isPassword ? "text" : "password";

      // Cập nhật icon Lucide
      if (eyeIcon) {
        eyeIcon.setAttribute("data-lucide", isPassword ? "eye-off" : "eye");
        if (window.lucide) {
          window.lucide.createIcons();
        }
      }
    });
  }

  // 3. Form Validation & Xử lý Submit Đăng nhập Admin
  const loginForm = document.getElementById("adminLoginForm");
  const usernameInput = document.getElementById("adminUsername");
  const submitBtn = document.getElementById("adminSubmitBtn");

  const groupUser = document.getElementById("groupUsername");
  const groupPwd = document.getElementById("groupPassword");

  // Xóa báo lỗi khi người dùng gõ phím
  usernameInput?.addEventListener("input", function () {
    groupUser?.classList.remove("has-error");
  });

  pwdInput?.addEventListener("input", function () {
    groupPwd?.classList.remove("has-error");
  });

  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();

      let hasError = false;
      const usernameVal = usernameInput ? usernameInput.value.trim() : "";
      const pwdVal = pwdInput ? pwdInput.value : "";

      if (!usernameVal) {
        groupUser?.classList.add("has-error");
        hasError = true;
      }

      if (!pwdVal) {
        groupPwd?.classList.add("has-error");
        hasError = true;
      }

      if (hasError) {
        showToast("⚠️ Vui lòng nhập đầy đủ thông tin đăng nhập!");
        return;
      }

      // Giả lập trạng thái tải (Loading State) & Kiểm tra bảo mật
      if (submitBtn) {
        submitBtn.classList.add("loading");
      }

      setTimeout(function () {
        submitBtn?.classList.remove("loading");

        // Demo đăng nhập thành công
        showToast("✅ Xác thực thành công! Đang chuyển hướng vào bảng điều khiển quản trị...");
        
        setTimeout(function() {
          showToast("🎉 Chào mừng Quản trị viên quay trở lại StickerHub!");
        }, 1500);
      }, 1000);
    });
  }
});

// Toast Notification Helper
function showToast(message) {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(function () {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.25s ease";
    setTimeout(() => toast.remove(), 250);
  }, 2800);
}
