"""
Admin Routes Blueprint
Quản lý toàn bộ các tuyến đường (routes) và REST API dành cho giao diện quản trị (Admin Portal)
"""

import os
from flask import Blueprint, render_template, request, jsonify
from sqlalchemy.orm import joinedload
from src.database import get_db, Category, StickerPack, Sticker
from .auth import (
    login_required,
    login_handler,
    logout_handler,
    me_handler,
    get_current_user,
)
from .services import (
    DashboardService,
    PackService,
    StickerService,
    CategoryService,
    AnalyticsService,
)

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


# ========================================================
# XÁC THỰC & ĐĂNG NHẬP / ĐĂNG XUẤT ADMIN
# ========================================================

@admin_bp.route("/login", methods=["GET", "POST"])
def login():
    """Giao diện và API xử lý đăng nhập Quản trị viên"""
    return login_handler()


@admin_bp.route("/logout", methods=["GET", "POST"])
def logout():
    """Đăng xuất Quản trị viên và đưa về trang đăng nhập"""
    return logout_handler()


@admin_bp.route("/api/me", methods=["GET"])
@login_required
def me():
    """API lấy thông tin Quản trị viên hiện tại"""
    return me_handler()


# ========================================================
# DASHBOARD TỔNG QUAN (VIEW & REST API)
# ========================================================

# ========================================================
# DASHBOARD TỔNG QUAN (VIEW & REST API)
# ========================================================

@admin_bp.route("/dashboard")
@login_required
def dashboard():
    """Bảng điều khiển tổng quan: lấy toàn bộ số liệu thời gian thực từ CSDL"""
    with get_db() as db:
        stats = DashboardService.get_summary_metrics(db)
        categories = db.query(Category).order_by(Category.sort_order).all()
        top_categories = DashboardService.get_category_distribution(db)
        packs = DashboardService.get_packs_table(db)
        top_packs = DashboardService.get_top_packs_today(db)
        recent_activities = DashboardService.get_recent_activities(db)
        initial_chart = DashboardService.get_trend_chart_data(db, "7d")

    current_user = get_current_user() or {"username": "Quản trị viên"}

    return render_template(
        "admin/dashboard.html",
        stats=stats,
        categories=categories,
        top_categories=top_categories,
        packs=packs,
        top_packs=top_packs,
        recent_activities=recent_activities,
        chart_data=initial_chart,
        current_user=current_user,
    )


@admin_bp.route("/api/dashboard/chart", methods=["GET"])
@login_required
def api_dashboard_chart():
    """API chuyển đổi dữ liệu biểu đồ xu hướng (7d, 30d, month)"""
    range_type = request.args.get("range", "7d")
    if range_type not in ("7d", "30d", "month"):
        range_type = "7d"

    with get_db() as db:
        data = DashboardService.get_trend_chart_data(db, range_type)

    return jsonify({"success": True, "range": range_type, "data": data})


# ========================================================
# QUẢN LÝ BỘ SƯU TẬP (COLLECTIONS CRUD REST API)
# ========================================================

@admin_bp.route("/api/packs", methods=["GET"])
@login_required
def api_get_packs():
    """API lấy danh sách bộ sưu tập có bộ lọc, tìm kiếm và phân trang"""
    category = request.args.get("category")
    status = request.args.get("status")
    search = request.args.get("search")
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 20, type=int)

    with get_db() as db:
        result = PackService.get_packs(
            db, category=category, status=status, search=search, page=page, limit=limit
        )

    return jsonify({"success": True, **result})


@admin_bp.route("/api/packs", methods=["POST"])
@login_required
def api_create_pack():
    """API thêm mới bộ sưu tập sticker"""
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"success": False, "message": "Vui lòng nhập tên bộ sưu tập!"}), 400

    try:
        with get_db() as db:
            new_pack = PackService.create_pack(db, data)
        return jsonify({
            "success": True,
            "message": f"Đã thêm mới bộ sưu tập '{new_pack['title']}' thành công!",
            "pack": new_pack,
        }), 201
    except Exception as e:
        return jsonify({"success": False, "message": f"Lỗi khi thêm bộ sưu tập: {str(e)}"}), 500


@admin_bp.route("/api/packs/<int:pack_id>", methods=["GET"])
@login_required
def api_get_pack_detail(pack_id: int):
    """API lấy thông tin chi tiết một bộ sưu tập để chỉnh sửa"""
    with get_db() as db:
        pack = PackService.get_pack_by_id(db, pack_id)
        if not pack:
            return jsonify({"success": False, "message": "Không tìm thấy bộ sưu tập!"}), 404

    return jsonify({"success": True, "pack": pack})


@admin_bp.route("/api/packs/<int:pack_id>", methods=["PUT", "POST"])
@login_required
def api_update_pack(pack_id: int):
    """API cập nhật thông tin bộ sưu tập"""
    data = request.get_json(silent=True) or {}
    try:
        with get_db() as db:
            updated_pack = PackService.update_pack(db, pack_id, data)
            if not updated_pack:
                return jsonify({"success": False, "message": "Không tìm thấy bộ sưu tập để cập nhật!"}), 404

        return jsonify({
            "success": True,
            "message": f"Đã cập nhật bộ sưu tập '{updated_pack['title']}' thành công!",
            "pack": updated_pack,
        })
    except Exception as e:
        return jsonify({"success": False, "message": f"Lỗi khi cập nhật bộ sưu tập: {str(e)}"}), 500


@admin_bp.route("/api/packs/<int:pack_id>/status", methods=["POST", "PUT"])
@login_required
def api_update_pack_status(pack_id: int):
    """API phê duyệt / chuyển trạng thái bộ sưu tập (active, pending, hidden)"""
    data = request.get_json(silent=True) or {}
    new_status = data.get("status", "active")
    if new_status not in ("active", "pending", "hidden"):
        return jsonify({"success": False, "message": "Trạng thái không hợp lệ!"}), 400

    with get_db() as db:
        success = PackService.update_status(db, pack_id, new_status)
        if not success:
            return jsonify({"success": False, "message": "Không tìm thấy bộ sưu tập!"}), 404

    status_labels = {
        "active": "Công khai",
        "pending": "Chờ duyệt",
        "hidden": "Tạm ẩn",
    }
    return jsonify({
        "success": True,
        "message": f"Đã cập nhật trạng thái bộ sưu tập sang '{status_labels.get(new_status, new_status)}' thành công!",
        "status": new_status,
    })


@admin_bp.route("/api/packs/<int:pack_id>", methods=["DELETE"])
@login_required
def api_delete_pack(pack_id: int):
    """API xóa bộ sưu tập khỏi hệ thống"""
    with get_db() as db:
        success = PackService.delete_pack(db, pack_id)
        if not success:
            return jsonify({"success": False, "message": "Không tìm thấy bộ sưu tập để xóa!"}), 404

    return jsonify({"success": True, "message": "Đã xóa bộ sưu tập thành công khỏi CSDL!"})


# ========================================================
# CÁC TUYẾN ĐƯỜNG TRANG QUẢN TRỊ KHÁC
# ========================================================

# ========================================================
# QUẢN LÝ DANH MỤC CHỦ ĐỀ (CATEGORY CRUD REST API)
# ========================================================

@admin_bp.route("/categories")
@admin_bp.route("/danhmuc")
@login_required
def categories():
    """Quản lý danh mục chủ đề: SSR dữ liệu thực tế từ CSDL"""
    with get_db() as db:
        cats = CategoryService.get_categories(db)
        metrics = CategoryService.get_category_metrics(db)
        total_packs = metrics["total_packs"]

    current_user = get_current_user() or {"username": "Quản trị viên"}

    return render_template(
        "admin/danhmuc.html",
        categories=cats,
        metrics=metrics,
        total_packs=total_packs,
        current_user=current_user,
    )


@admin_bp.route("/api/categories", methods=["GET"])
@login_required
def api_get_categories():
    """API lấy danh sách danh mục có lọc và tìm kiếm"""
    search = request.args.get("search")
    status = request.args.get("status")

    with get_db() as db:
        cats = CategoryService.get_categories(db, search=search, status=status)
        metrics = CategoryService.get_category_metrics(db)

    return jsonify({"success": True, "categories": cats, "metrics": metrics})


@admin_bp.route("/api/categories", methods=["POST"])
@login_required
def api_create_category():
    """API thêm mới danh mục chủ đề"""
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"success": False, "message": "Vui lòng nhập tên danh mục!"}), 400

    try:
        with get_db() as db:
            new_cat = CategoryService.create_category(db, data)
        return jsonify({
            "success": True,
            "message": f"Đã thêm mới danh mục '{new_cat['name']}' thành công!",
            "category": new_cat,
        }), 201
    except ValueError as ve:
        return jsonify({"success": False, "message": str(ve)}), 400
    except Exception as e:
        return jsonify({"success": False, "message": f"Lỗi khi lưu danh mục: {str(e)}"}), 500


@admin_bp.route("/api/categories/<int:cat_id>", methods=["GET"])
@login_required
def api_get_category_detail(cat_id: int):
    """API lấy thông tin chi tiết một danh mục để chỉnh sửa"""
    with get_db() as db:
        cat = CategoryService.get_category_by_id(db, cat_id)
        if not cat:
            return jsonify({"success": False, "message": "Không tìm thấy danh mục!"}), 404
    return jsonify({"success": True, "category": cat})


@admin_bp.route("/api/categories/<int:cat_id>", methods=["PUT", "POST"])
@login_required
def api_update_category(cat_id: int):
    """API cập nhật thông tin danh mục chủ đề"""
    data = request.get_json(silent=True) or {}
    try:
        with get_db() as db:
            updated_cat = CategoryService.update_category(db, cat_id, data)
            if not updated_cat:
                return jsonify({"success": False, "message": "Không tìm thấy danh mục để cập nhật!"}), 404

        return jsonify({
            "success": True,
            "message": f"Đã cập nhật danh mục '{updated_cat['name']}' thành công!",
            "category": updated_cat,
        })
    except Exception as e:
        return jsonify({"success": False, "message": f"Lỗi khi cập nhật danh mục: {str(e)}"}), 500


@admin_bp.route("/api/categories/<int:cat_id>/toggle", methods=["POST"])
@login_required
def api_toggle_category_status(cat_id: int):
    """API chuyển đổi trạng thái hiển thị (active <-> hidden)"""
    with get_db() as db:
        cat = CategoryService.toggle_status(db, cat_id)
        if not cat:
            return jsonify({"success": False, "message": "Không tìm thấy danh mục!"}), 404

    status_label = "Công khai" if cat["status"] == "active" else "Tạm ẩn"
    return jsonify({
        "success": True,
        "message": f"Đã chuyển trạng thái danh mục '{cat['name']}' sang '{status_label}'!",
        "category": cat,
    })


@admin_bp.route("/api/categories/<int:cat_id>", methods=["DELETE"])
@login_required
def api_delete_category(cat_id: int):
    """API xóa danh mục và di dời an toàn các bộ sưu tập con"""
    with get_db() as db:
        success = CategoryService.delete_category(db, cat_id)
        if not success:
            return jsonify({"success": False, "message": "Không tìm thấy danh mục để xóa!"}), 404

    return jsonify({"success": True, "message": "Đã xóa danh mục thành công!"})


@admin_bp.route("/bosuutap")
@login_required
def collections():
    """Quản lý các bộ sưu tập sticker"""
    with get_db() as db:
        categories = db.query(Category).order_by(Category.sort_order).all()
        packs_result = PackService.get_packs(db, limit=20)
        counts = packs_result["counts"]
        packs = packs_result["packs"]

    current_user = get_current_user() or {"username": "Quản trị viên"}

    return render_template(
        "admin/bosuutap.html",
        categories=categories,
        packs=packs,
        counts=counts,
        current_user=current_user,
    )


# ========================================================
# QUẢN LÝ KHO STICKER ĐƠN LẺ (STICKER CRUD REST API)
# ========================================================

@admin_bp.route("/khosticker")
@login_required
def stickers():
    """Kho quản lý chi tiết từng sticker: SSR dữ liệu thực từ CSDL"""
    with get_db() as db:
        categories = db.query(Category).order_by(Category.sort_order).all()
        packs = (
            db.query(StickerPack)
            .options(joinedload(StickerPack.category))
            .filter_by(status="active")
            .order_by(StickerPack.title)
            .all()
        )
        result = StickerService.get_stickers(db, limit=12)
        stickers_list = result["stickers"]
        total_stickers = result["total"]
        cat_counts = result["cat_counts"]

    current_user = get_current_user() or {"username": "Quản trị viên"}

    return render_template(
        "admin/khosticker.html",
        categories=categories,
        packs=packs,
        stickers=stickers_list,
        total_stickers=total_stickers,
        cat_counts=cat_counts,
        current_user=current_user,
    )


@admin_bp.route("/api/stickers", methods=["GET"])
@login_required
def api_get_stickers():
    """API lấy danh sách sticker có lọc danh mục, bộ sưu tập, tìm kiếm và phân trang"""
    category = request.args.get("category")
    pack_id = request.args.get("pack_id")
    search = request.args.get("search")
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 12, type=int)

    with get_db() as db:
        result = StickerService.get_stickers(
            db, category=category, pack_id=pack_id, search=search, page=page, limit=limit
        )

    return jsonify({"success": True, **result})


@admin_bp.route("/api/stickers", methods=["POST"])
@login_required
def api_create_sticker():
    """API tải lên hoặc tạo mới sticker vào bộ sưu tập"""
    if request.is_json:
        data = request.get_json() or {}
    else:
        data = request.form.to_dict()
        file = request.files.get("file")
        if file and file.filename:
            import werkzeug.utils
            filename = werkzeug.utils.secure_filename(file.filename)
            upload_dir = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "assets", "stickers"
            )
            os.makedirs(upload_dir, exist_ok=True)
            file_path_disk = os.path.join(upload_dir, filename)
            file.save(file_path_disk)
            data["file_name"] = filename
            data["file_path"] = f"../../assets/stickers/{filename}"
            data["format"] = filename.rsplit(".", 1)[-1].lower() if "." in filename else "svg"
            data["file_size_kb"] = max(1, os.path.getsize(file_path_disk) // 1024)

    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"success": False, "message": "Vui lòng nhập tiêu đề sticker!"}), 400

    try:
        with get_db() as db:
            new_sticker = StickerService.create_sticker(db, data)
        return jsonify({
            "success": True,
            "message": f"Đã tải lên thành công sticker '{new_sticker['title']}'!",
            "sticker": new_sticker,
        }), 201
    except ValueError as ve:
        return jsonify({"success": False, "message": str(ve)}), 400
    except Exception as e:
        return jsonify({"success": False, "message": f"Lỗi khi lưu sticker: {str(e)}"}), 500


@admin_bp.route("/api/stickers/<int:sticker_id>", methods=["GET"])
@login_required
def api_get_sticker_detail(sticker_id: int):
    """API lấy thông tin chi tiết một sticker (hiển thị trên Lightbox)"""
    with get_db() as db:
        sticker = StickerService.get_sticker_by_id(db, sticker_id)
        if not sticker:
            return jsonify({"success": False, "message": "Không tìm thấy sticker!"}), 404

    return jsonify({"success": True, "sticker": sticker})


@admin_bp.route("/api/stickers/<int:sticker_id>", methods=["DELETE"])
@login_required
def api_delete_sticker(sticker_id: int):
    """API xóa vĩnh viễn sticker khỏi kho lưu trữ"""
    with get_db() as db:
        success = StickerService.delete_sticker(db, sticker_id)
        if not success:
            return jsonify({"success": False, "message": "Không tìm thấy sticker để xóa!"}), 404

    return jsonify({"success": True, "message": "Đã xóa sticker khỏi kho thành công!"})


@admin_bp.route("/api/stickers/<int:sticker_id>/download", methods=["POST"])
@login_required
def api_download_sticker(sticker_id: int):
    """API ghi nhận lượt tải về của sticker"""
    with get_db() as db:
        total = StickerService.increment_download(db, sticker_id)

    return jsonify({"success": True, "downloads": total})


@admin_bp.route("/chitietsticker")
@login_required
def collection_detail():
    """Chi tiết bộ sưu tập sticker"""
    return render_template("admin/chitietsticker.html")


@admin_bp.route("/thongke")
@login_required
def stats():
    """Báo cáo & số liệu thống kê: SSR dữ liệu 7 ngày qua và toàn bộ số liệu thời gian thực từ CSDL"""
    with get_db() as db:
        initial_data = AnalyticsService.get_analytics_data(db, "7d")
        total_packs = db.query(StickerPack).count()
        total_stickers = db.query(Sticker).count()
        total_categories = db.query(Category).count()

    current_user = get_current_user() or {"username": "Quản trị viên"}

    return render_template(
        "admin/thongke.html",
        initial_data=initial_data,
        kpis=initial_data["kpis"],
        downloads_chart=initial_data["downloads_chart"],
        traffic_chart=initial_data["traffic_chart"],
        top_packs=initial_data["top_packs"],
        note=initial_data["note"],
        total_packs=total_packs,
        total_stickers=total_stickers,
        total_categories=total_categories,
        current_user=current_user,
    )


@admin_bp.route("/api/stats", methods=["GET"])
@login_required
def api_get_stats():
    """API lấy số liệu thống kê theo bộ lọc thời gian: today, 7d, 30d, year, all"""
    range_key = request.args.get("range", "7d")
    if range_key not in ("today", "7d", "30d", "year", "all"):
        range_key = "7d"

    with get_db() as db:
        data = AnalyticsService.get_analytics_data(db, range_key)

    return jsonify({"success": True, **data})

