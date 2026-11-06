"""
File Security & Sanitization Module
Kiểm tra an toàn tệp tải lên: whitelist đuôi tệp, phát hiện mã độc SVG (XSS), sinh tên ngẫu nhiên chống ghi đè
"""

import os
import re
import uuid
import time
import werkzeug.utils
from typing import Tuple, Optional

# Danh sách đuôi tệp hình ảnh được phép
ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "svg", "gif"}

# Các biểu thức chính quy phát hiện mã độc XSS trong tệp SVG
SVG_DANGEROUS_PATTERNS = [
    re.compile(r"<\s*script", re.IGNORECASE),
    re.compile(r"javascript\s*:", re.IGNORECASE),
    re.compile(r"on\w+\s*=", re.IGNORECASE),  # onload=, onerror=, onclick=, onmouseover=...
    re.compile(r"<\s*iframe", re.IGNORECASE),
    re.compile(r"<\s*object", re.IGNORECASE),
    re.compile(r"<\s*embed", re.IGNORECASE),
    re.compile(r"<\s*foreignObject", re.IGNORECASE),
]


def is_allowed_image(filename: str) -> bool:
    """Kiểm tra tên tệp có đuôi mở rộng hợp lệ trong whitelist hay không"""
    if not filename or "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[-1].lower()
    return ext in ALLOWED_IMAGE_EXTENSIONS


def is_safe_svg_content(content_bytes: bytes) -> Tuple[bool, Optional[str]]:
    """Quét nội dung tệp SVG để chặn các mã thực thi độc hại (Stored XSS)"""
    try:
        text = content_bytes.decode("utf-8", errors="ignore")
        for pattern in SVG_DANGEROUS_PATTERNS:
            if pattern.search(text):
                return False, "Tệp SVG chứa mã thực thi độc hại hoặc sự kiện nhúng không an toàn!"
        return True, None
    except Exception as e:
        return False, f"Không thể phân tích cú pháp tệp SVG: {str(e)}"


def save_uploaded_image(
    file_storage,
    target_folder: str,
    prefix: str = "img"
) -> Tuple[bool, str, Optional[str]]:
    """
    Xác thực và lưu trữ an toàn một tệp hình ảnh được tải lên:
    - Kiểm tra tính hợp lệ của tệp và đuôi mở rộng
    - Kiểm tra mã độc XSS nếu là tệp SVG
    - Sinh tên ngẫu nhiên độc nhất chống ghi đè
    - Trả về: (success: bool, file_path_or_msg: str, unique_filename: Optional[str])
    """
    if not file_storage or not file_storage.filename:
        return False, "Không có tệp nào được chọn để tải lên!", None

    safe_name = werkzeug.utils.secure_filename(file_storage.filename)
    if not is_allowed_image(safe_name):
        ext_list = ", ".join(sorted(ALLOWED_IMAGE_EXTENSIONS))
        return False, f"Định dạng tệp không được hỗ trợ! Hệ thống chỉ chấp nhận: {ext_list}", None

    ext = safe_name.rsplit(".", 1)[-1].lower()

    # Kiểm tra an toàn cho tệp SVG
    if ext == "svg":
        content = file_storage.read()
        is_safe, err_msg = is_safe_svg_content(content)
        file_storage.seek(0)
        if not is_safe:
            return False, err_msg or "Tệp SVG không an toàn!", None

    # Sinh tên ngẫu nhiên độc nhất chống ghi đè
    unique_filename = f"{prefix}_{int(time.time())}_{uuid.uuid4().hex[:8]}.{ext}"
    os.makedirs(target_folder, exist_ok=True)
    destination = os.path.join(target_folder, unique_filename)

    file_storage.save(destination)
    return True, destination, unique_filename

