"""
StickerHub - Ứng Dụng Web Quản Lý & Chia Sẻ Sticker
File chạy chính (Application Entry Point)
"""

import os
from flask import Flask, send_from_directory, render_template
from src.database import init_db
from src.user import user_bp
from src.admin import admin_bp
from src.api import api_bp

# Đường dẫn thư mục gốc dự án
BASE_DIR = os.path.abspath(os.path.dirname(__file__))


def create_app() -> Flask:
    """
    Application Factory: Khởi tạo và cấu hình ứng dụng Flask chuẩn module hóa
    """
    app = Flask(
        __name__,
        template_folder=os.path.join(BASE_DIR, "templates"),
        static_folder=os.path.join(BASE_DIR, "static"),
        static_url_path="/static"
    )

    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "stickerhub-super-secret-key-2026")

    # 1. Tự động khởi tạo & đồng bộ bảng CSDL khi khởi động
    init_db(seed=True, auto_sync=True)

    # 2. Định tuyến phục vụ tài nguyên tệp tĩnh /assets
    @app.route("/assets/<path:filename>")
    def serve_assets(filename):
        """Phục vụ các tệp hình ảnh, icon SVG trong thư mục assets/"""
        return send_from_directory(os.path.join(BASE_DIR, "assets"), filename)

    # 3. Đăng ký các phân hệ Blueprint
    app.register_blueprint(user_bp)      # Giao diện người dùng (/)
    app.register_blueprint(admin_bp)     # Giao diện quản trị viên (/admin)
    app.register_blueprint(api_bp)       # Điểm cuối JSON API (/api)

    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1")
    print(f"\n🚀 StickerHub dang khoi chay tai: http://127.0.0.1:{port}")
    print(f"👉 Trang chu User: http://127.0.0.1:{port}/")
    print(f"👉 Trang Admin:    http://127.0.0.1:{port}/admin/login\n")
    app.run(host="0.0.0.0", port=port, debug=debug)
