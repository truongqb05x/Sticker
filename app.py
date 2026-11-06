import os
import secrets
from datetime import timedelta
from flask import Flask, send_from_directory, render_template, jsonify
from src.database import init_db
from src.user import user_bp
from src.admin import admin_bp
from src.api import api_bp

# Đường dẫn thư mục gốc dự án
BASE_DIR = os.path.abspath(os.path.dirname(__file__))


def create_app() -> Flask:
    app = Flask(
        __name__,
        template_folder=os.path.join(BASE_DIR, "templates"),
        static_folder=os.path.join(BASE_DIR, "static"),
        static_url_path="/static"
    )

    # 1. Cấu hình bảo mật ứng dụng & phiên làm việc
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY") or secrets.token_hex(32)
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=7)
    app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # Giới hạn tối đa 16MB cho mỗi request tải lên

    # 2. HTTP Security Headers (Bảo vệ chống Clickjacking, MIME Sniffing, XSS)
    @app.after_request
    def set_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

    # 3. Tự động khởi tạo & đồng bộ bảng CSDL khi khởi động
    init_db(seed=True, auto_sync=True)

    # 4. Định tuyến phục vụ tài nguyên tệp tĩnh /assets
    @app.route("/assets/<path:filename>")
    def serve_assets(filename):
        """Phục vụ các tệp hình ảnh, icon SVG trong thư mục assets/"""
        return send_from_directory(os.path.join(BASE_DIR, "assets"), filename)

    # 5. Đăng ký các phân hệ Blueprint
    app.register_blueprint(user_bp)      # Giao diện người dùng (/)
    app.register_blueprint(admin_bp)     # Giao diện quản trị viên (/admin)
    app.register_blueprint(api_bp)       # Điểm cuối JSON API (/api)

    # 6. Xử lý lỗi chuẩn
    @app.errorhandler(404)
    def page_not_found(e):
        return render_template("404.html"), 404

    @app.errorhandler(413)
    def request_entity_too_large(e):
        return jsonify({
            "success": False,
            "message": "Dung lượng tệp tải lên vượt quá giới hạn cho phép (tối đa 16MB)!"
        }), 413

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "False").lower() in ("true", "1")
    app.run(host="0.0.0.0", port=port, debug=debug)
