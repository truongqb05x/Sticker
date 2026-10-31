from datetime import datetime
from functools import wraps
from typing import Optional, Dict, Any
from urllib.parse import urlparse, urljoin
from flask import (
    Blueprint,
    request,
    session,
    redirect,
    url_for,
    render_template,
    jsonify,
)
from src.database import get_db, User

# Blueprint chuyên biệt cho Xác thực Admin (tùy chọn nhúng hoặc dùng độc lập)
auth_bp = Blueprint("admin_auth", __name__)


def is_safe_redirect_url(target: Optional[str]) -> bool:
    """
    Kiểm tra URL chuyển hướng an toàn, ngăn chặn tấn công Open Redirect.
    Chỉ cho phép chuyển hướng trong cùng domain của hệ thống.
    """
    if not target:
        return False
    ref_url = urlparse(request.host_url)
    test_url = urlparse(urljoin(request.host_url, target))
    return test_url.scheme in ("http", "https") and ref_url.netloc == test_url.netloc


def authenticate(username: str, password: str) -> Optional[User]:
    """
    Xác thực thông tin tài khoản và mật khẩu của Quản trị viên trong CSDL.
    Nếu hợp lệ: tự động cập nhật mốc thời gian đăng nhập gần nhất (last_login_at).
    Nếu không hợp lệ: trả về None.
    """
    if not username or not password:
        return None

    clean_username = username.strip()
    with get_db() as db:
        user = db.query(User).filter_by(username=clean_username).first()
        if user and user.check_password(password):
            user.last_login_at = datetime.utcnow()
            db.commit()
            db.refresh(user)
            return user

    return None


def login_user(user: User, remember: bool = True) -> None:
    """
    Khởi tạo phiên đăng nhập (session) cho Quản trị viên.
    Lưu các thông tin định danh cần thiết vào cookie session được mã hóa.
    """
    session.clear()
    session["admin_id"] = user.id
    session["admin_username"] = user.username
    session["is_admin"] = True
    session["logged_in_at"] = datetime.utcnow().isoformat()
    session.permanent = remember


def logout_user() -> None:
    """
    Hủy toàn bộ phiên đăng nhập Quản trị viên khỏi session.
    """
    session.pop("admin_id", None)
    session.pop("admin_username", None)
    session.pop("is_admin", None)
    session.pop("logged_in_at", None)
    session.clear()


def is_authenticated() -> bool:
    """
    Kiểm tra xem phiên làm việc hiện tại đã đăng nhập quyền Quản trị viên hay chưa.
    """
    return bool(session.get("admin_id") and session.get("is_admin"))


def get_current_user() -> Optional[Dict[str, Any]]:
    """
    Lấy thông tin tài khoản admin hiện đang đăng nhập (dưới dạng an toàn, không chứa mật khẩu hash).
    """
    admin_id = session.get("admin_id")
    if not admin_id:
        return None

    with get_db() as db:
        user = db.query(User).filter_by(id=admin_id).first()
        if user:
            return user.to_safe_dict()

    return None


def login_required(view_func):
    """
    Decorator bảo vệ các tuyến đường quản trị:
    - Nếu đã đăng nhập: Cho phép thực thi route bình thường.
    - Nếu chưa đăng nhập:
        + Đối với JSON API / Fetch request: Trả về HTTP 401 Unauthorized kèm thông báo JSON.
        + Đối với truy cập Web thông thường: Chuyển hướng tới trang đăng nhập /admin/login kèm tham số ?next=...
    """
    @wraps(view_func)
    def decorated_function(*args, **kwargs):
        if not is_authenticated():
            wants_json = (
                request.is_json
                or request.path.startswith("/api/")
                or request.headers.get("X-Requested-With") == "XMLHttpRequest"
                or "application/json" in request.headers.get("Accept", "")
            )
            if wants_json:
                return jsonify({
                    "success": False,
                    "error": "Unauthorized",
                    "message": "Phiên đăng nhập đã hết hạn hoặc bạn chưa có quyền quản trị. Vui lòng đăng nhập lại."
                }), 401

            # Lưu lại URL trang admin mà người dùng muốn vào để chuyển tiếp sau khi đăng nhập thành công
            next_url = request.full_path if request.query_string else request.path
            return redirect(url_for("admin.login", next=next_url))

        return view_func(*args, **kwargs)

    return decorated_function


def login_handler():
    """
    Bộ xử lý logic đăng nhập Quản trị viên:
    - GET: Hiển thị giao diện login.html (nếu đã đăng nhập thì tự động chuyển hướng vào Dashboard).
    - POST: Tiếp nhận dữ liệu từ cả fetch (JSON) và Form truyền thống (FormData).
      Thực hiện xác thực mật khẩu, tạo phiên làm việc và trả kết quả phù hợp.
    """
    # 1. Nếu đã đăng nhập từ trước, chuyển ngay vào Dashboard
    if request.method == "GET":
        if is_authenticated():
            return redirect(url_for("admin.dashboard"))
        return render_template("admin/login.html")

    # 2. Xử lý yêu cầu POST đăng nhập
    username = ""
    password = ""
    next_url = ""

    # Trích xuất dữ liệu đăng nhập từ JSON hoặc Form POST
    if request.is_json or request.content_type == "application/json":
        data = request.get_json(silent=True) or {}
        username = data.get("username", "")
        password = data.get("password", "")
        next_url = data.get("next", "")
    else:
        username = request.form.get("username", "")
        password = request.form.get("password", "")
        next_url = request.form.get("next", "")

    # Lấy thêm `next` từ URL query string nếu chưa có
    if not next_url:
        next_url = request.args.get("next", "")

    wants_json = (
        request.is_json
        or request.headers.get("X-Requested-With") == "XMLHttpRequest"
        or "application/json" in request.headers.get("Accept", "")
    )

    # 3. Kiểm tra tính đầy đủ của trường đăng nhập
    if not username or not password:
        err_msg = "Vui lòng nhập đầy đủ tài khoản quản trị và mật khẩu!"
        if wants_json:
            return jsonify({"success": False, "message": err_msg}), 400
        return render_template("admin/login.html", error=err_msg, username=username), 400

    # 4. Xác thực tài khoản với CSDL
    user = authenticate(username, password)
    if not user:
        err_msg = "Tài khoản hoặc mật khẩu quản trị không chính xác!"
        if wants_json:
            return jsonify({"success": False, "message": err_msg}), 401
        return render_template("admin/login.html", error=err_msg, username=username), 401

    # 5. Đăng nhập thành công -> Lưu session
    login_user(user, remember=True)

    # Kiểm tra an toàn cho URL chuyển tiếp (mặc định vào dashboard)
    if not is_safe_redirect_url(next_url):
        target_redirect = url_for("admin.dashboard")
    else:
        target_redirect = next_url

    if wants_json:
        return jsonify({
            "success": True,
            "message": "Đăng nhập thành công! Đang chuyển hướng...",
            "redirect": target_redirect,
            "user": user.to_safe_dict()
        }), 200

    return redirect(target_redirect)


def logout_handler():
    """
    Bộ xử lý đăng xuất Quản trị viên:
    - Xóa toàn bộ session làm việc.
    - Hỗ trợ cả AJAX response (JSON) và redirect trực tiếp về /admin/login.
    """
    logout_user()

    wants_json = (
        request.is_json
        or request.headers.get("X-Requested-With") == "XMLHttpRequest"
        or "application/json" in request.headers.get("Accept", "")
    )

    if wants_json:
        return jsonify({
            "success": True,
            "message": "Đăng xuất thành công!",
            "redirect": url_for("admin.login")
        }), 200

    return redirect(url_for("admin.login"))


def me_handler():
    """
    API endpoint lấy thông tin Quản trị viên hiện đang đăng nhập.
    """
    user_info = get_current_user()
    if not user_info:
        return jsonify({"authenticated": False, "user": None}), 401

    return jsonify({"authenticated": True, "user": user_info}), 200


# Gắn các route mặc định cho auth_bp (nếu được sử dụng độc lập)
@auth_bp.route("/login", methods=["GET", "POST"])
def auth_login_route():
    return login_handler()


@auth_bp.route("/logout", methods=["GET", "POST"])
def auth_logout_route():
    return logout_handler()


@auth_bp.route("/api/me", methods=["GET"])
@login_required
def auth_me_route():
    return me_handler()