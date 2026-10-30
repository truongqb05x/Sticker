/**
 * ========================================================
 * TOAST NOTIFICATION UTILITY - STICKERHUB
 * ========================================================
 * Module tiện ích hiển thị thông báo Toast dùng chung toàn hệ thống.
 */

export function showToast(message) {
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

// Luôn gắn sẵn vào window để các script thông thường có thể gọi trực tiếp
if (typeof window !== "undefined") {
  window.showToast = showToast;
}

export default showToast;

