/**
 * ========================================================
 * UTILITY: STRING & HTML HELPERS (helpers.js)
 * ========================================================
 * Cung cấp các tiện ích xử lý chuỗi, phòng chống XSS và lọc tiếng Việt.
 */

/**
 * Escape HTML ký tự đặc biệt để phòng ngừa tấn công XSS
 * @param {string} str 
 * @returns {string}
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Loại bỏ dấu tiếng Việt để tìm kiếm không dấu chuẩn xác
 * @param {string} str 
 * @returns {string}
 */
export function removeVietnameseTones(str) {
  if (!str) return "";
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, "");
  str = str.replace(/\u02C6|\u0306|\u031B/g, "");
  return str.trim();
}

/**
 * Tô màu nổi bật phần văn bản khớp với từ khóa tìm kiếm
 * @param {string} text 
 * @param {string} query 
 * @returns {string}
 */
export function highlightMatch(text, query) {
  if (!text) return "";
  if (!query) return escapeHtml(text);
  const cleanText = removeVietnameseTones(text);
  const cleanQuery = removeVietnameseTones(query);
  const startIdx = cleanText.indexOf(cleanQuery);
  if (startIdx === -1) return escapeHtml(text);

  const before = escapeHtml(text.slice(0, startIdx));
  const match = escapeHtml(text.slice(startIdx, startIdx + query.length));
  const after = escapeHtml(text.slice(startIdx + query.length));
  return `${before}<mark>${match}</mark>${after}`;
}

