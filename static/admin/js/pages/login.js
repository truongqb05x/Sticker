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

  const userErrorSpan = groupUser?.querySelector(".form-error-msg span");
  const pwdErrorSpan = groupPwd?.querySelector(".form-error-msg span");

  // Xóa báo lỗi khi người dùng gõ phím
  usernameInput?.addEventListener("input", function () {
    groupUser?.classList.remove("has-error");
    if (userErrorSpan) {
      userErrorSpan.textContent = "Vui lòng nhập tài khoản quản trị!";
    }
  });

  pwdInput?.addEventListener("input", function () {
    groupPwd?.classList.remove("has-error");
    if (pwdErrorSpan) {
      pwdErrorSpan.textContent = "Vui lòng nhập mật khẩu quản trị!";
    }
  });

  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();

      let hasError = false;
      const usernameVal = usernameInput ? usernameInput.value.trim() : "";
      const pwdVal = pwdInput ? pwdInput.value : "";

      if (!usernameVal) {
        groupUser?.classList.add("has-error");
        if (userErrorSpan) {
          userErrorSpan.textContent = "Vui lòng nhập tài khoản quản trị!";
        }
        hasError = true;
      }

      if (!pwdVal) {
        groupPwd?.classList.add("has-error");
        if (pwdErrorSpan) {
          pwdErrorSpan.textContent = "Vui lòng nhập mật khẩu quản trị!";
        }
        hasError = true;
      }

      if (hasError) {
        if (!usernameVal && usernameInput) {
          usernameInput.focus();
        } else if (pwdInput) {
          pwdInput.focus();
        }
        return;
      }

      // Trạng thái tải (Loading State) & Vô hiệu hóa nút trong khi chờ
      if (submitBtn) {
        submitBtn.classList.add("loading");
        submitBtn.disabled = true;
      }

      // Lấy tham số next từ query string nếu có
      const urlParams = new URLSearchParams(window.location.search);
      const nextParam = urlParams.get("next") || "";

      // Gửi yêu cầu xác thực thật tới API /admin/login (src/admin/auth.py)
      fetch("/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          username: usernameVal,
          password: pwdVal,
          next: nextParam,
        }),
      })
        .then(async function (response) {
          const data = await response.json().catch(function () {
            return {};
          });

          if (response.ok && data.success) {
            window.location.href = data.redirect || "/admin/dashboard";
          } else {
            groupUser?.classList.add("has-error");
            groupPwd?.classList.add("has-error");
            if (pwdErrorSpan) {
              pwdErrorSpan.textContent = data.message || "Tài khoản hoặc mật khẩu quản trị không chính xác!";
            }
            if (pwdInput) {
              pwdInput.focus();
              pwdInput.select();
            }
            if (submitBtn) {
              submitBtn.classList.remove("loading");
              submitBtn.disabled = false;
            }
          }
        })
        .catch(function (error) {
          console.error("Lỗi khi gửi yêu cầu đăng nhập:", error);
          groupPwd?.classList.add("has-error");
          if (pwdErrorSpan) {
            pwdErrorSpan.textContent = "Không thể kết nối máy chủ. Vui lòng thử lại!";
          }
          if (submitBtn) {
            submitBtn.classList.remove("loading");
            submitBtn.disabled = false;
          }
        });
    });
  }
});
