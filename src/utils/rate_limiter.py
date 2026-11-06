"""
In-Memory Rate Limiter Module
Giới hạn tần suất gọi API theo địa chỉ IP: chống Brute-force đăng nhập và Spam tải xuống
"""

import time
from collections import defaultdict
from functools import wraps
from threading import Lock
from flask import request, jsonify


class InMemoryRateLimiter:
    """Bộ giới hạn tần suất dựa trên bộ nhớ đệm (Sliding Window Counter)"""

    def __init__(self):
        self._records = defaultdict(list)
        self._lock = Lock()

    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> tuple[bool, int]:
        now = time.time()
        cutoff = now - window_seconds
        with self._lock:
            # Dọn dẹp các mốc thời gian đã quá thời hạn
            timestamps = [t for t in self._records[key] if t > cutoff]
            if len(timestamps) >= max_requests:
                retry_after = max(1, int(timestamps[0] + window_seconds - now))
                self._records[key] = timestamps
                return False, retry_after
            timestamps.append(now)
            self._records[key] = timestamps
            return True, 0

    def reset(self, key: str) -> None:
        """Đặt lại bộ đếm cho một key nhất định (ví dụ: sau khi đăng nhập thành công)"""
        with self._lock:
            self._records.pop(key, None)


limiter = InMemoryRateLimiter()


def rate_limit(
    max_requests: int = 60,
    window_seconds: int = 60,
    message: str = "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút!"
):
    """
    Decorator giới hạn tần suất yêu cầu cho Route:
    - Mặc định: 60 yêu cầu / 60 giây theo IP
    - Trả về HTTP 429 Too Many Requests khi vượt quá ngưỡng
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            # Lấy địa chỉ IP thực tế (xử lý proxy/reverse proxy)
            forwarded = request.headers.get("X-Forwarded-For")
            if forwarded:
                ip = forwarded.split(",")[0].strip()
            else:
                ip = request.remote_addr or "127.0.0.1"

            key = f"{request.endpoint or request.path}:{ip}"
            allowed, retry_after = limiter.is_allowed(key, max_requests, window_seconds)

            if not allowed:
                return jsonify({
                    "success": False,
                    "error": "Too Many Requests",
                    "message": f"{message} (Vui lòng thử lại sau {retry_after} giây).",
                    "retry_after": retry_after
                }), 429

            return f(*args, **kwargs)
        return wrapper
    return decorator

