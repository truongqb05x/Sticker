import os
import time
import uuid
import werkzeug.utils
from flask import Blueprint, render_template, request, jsonify
from sqlalchemy import desc
from sqlalchemy.orm import joinedload
from src.database import get_db, Category, StickerPack, Sticker, HeroBanner
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


@admin_bp.route("/login", methods=["GET", "POST"])
def login():
    return login_handler()

@admin_bp.route("/logout", methods=["GET", "POST"])
def logout():
    return logout_handler()

@admin_bp.route("/api/me", methods=["GET"])
@login_required
def me():
    return me_handler()


@admin_bp.route("/dashboard")
@login_required
def dashboard():
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
    """API thêm mới bộ sưu tập sticker (hỗ trợ cả JSON và Multipart Form Upload)"""
    if request.is_json:
        data = request.get_json() or {}
    else:
        data = request.form.to_dict()
        file = request.files.get("cover_file") or request.files.get("file")
        if file and file.filename:
            filename = werkzeug.utils.secure_filename(file.filename)
            ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
            unique_filename = f"pack_{int(time.time())}_{uuid.uuid4().hex[:6]}.{ext}"
            upload_dir = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "assets", "packs"
            )
            os.makedirs(upload_dir, exist_ok=True)
            file_path_disk = os.path.join(upload_dir, unique_filename)
            file.save(file_path_disk)
            data["cover_image"] = f"/assets/packs/{unique_filename}"

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
    """API cập nhật thông tin bộ sưu tập (hỗ trợ cả JSON và Multipart Form Upload)"""
    if request.is_json:
        data = request.get_json() or {}
    else:
        data = request.form.to_dict()
        file = request.files.get("cover_file") or request.files.get("file")
        if file and file.filename:
            filename = werkzeug.utils.secure_filename(file.filename)
            ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
            unique_filename = f"pack_{pack_id}_{int(time.time())}_{uuid.uuid4().hex[:6]}.{ext}"
            upload_dir = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "assets", "packs"
            )
            os.makedirs(upload_dir, exist_ok=True)
            file_path_disk = os.path.join(upload_dir, unique_filename)
            file.save(file_path_disk)
            data["cover_image"] = f"/assets/packs/{unique_filename}"

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
    """Chi tiết bộ sưu tập sticker: nạp dữ liệu thực tế từ CSDL theo id hoặc slug"""
    pack_id = request.args.get("id")
    slug = request.args.get("slug")
    with get_db() as db:
        pack = None
        if pack_id and pack_id.isdigit():
            pack = db.query(StickerPack).filter_by(id=int(pack_id)).first()
        elif slug:
            pack = db.query(StickerPack).filter_by(slug=slug).first()

        # Nếu có truyền id hoặc slug nhưng không tìm thấy, trả về lỗi 404
        if (pack_id or slug) and not pack:
            return render_template("404.html", message="Không tìm thấy bộ sưu tập!"), 404
        if not pack:
            pack = db.query(StickerPack).order_by(StickerPack.id.asc()).first()

        if not pack:
            return render_template("404.html", message="Chưa có bộ sưu tập nào trong hệ thống!"), 404

        pack_data = PackService.get_pack_by_id(db, pack.id)
        categories = db.query(Category).order_by(Category.sort_order).all()
        stickers_result = StickerService.get_stickers(db, pack_id=str(pack.id), limit=150)
        stickers = stickers_result["stickers"]

    current_user = get_current_user() or {"username": "Quản trị viên"}

    return render_template(
        "admin/chitietsticker.html",
        pack=pack_data,
        categories=categories,
        stickers=stickers,
        current_user=current_user,
    )


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

# ========================================================
# API CẤU HÌNH 4 BỘ SƯU TẬP HERO CHO TRANG CHỦ
# ========================================================

@admin_bp.route("/api/hero-packs", methods=["GET"])
@login_required
def api_get_hero_packs():
    """Lấy danh sách các bộ sưu tập đang được cấu hình làm Hero và danh sách toàn bộ các gói khả dụng"""
    with get_db() as db:
        # 1. Lấy các pack hiện đang có cờ is_featured = 1
        current_hero_packs = (
            db.query(StickerPack)
            .filter(StickerPack.status == "active", StickerPack.is_featured == 1)
            .order_by(StickerPack.featured_order.asc())
            .limit(4)
            .all()
        )

        hero_pack_ids = [p.id for p in current_hero_packs]

        # Nếu chưa đủ 4 pack, lấy bù các pack tải nhiều nhất để người dùng dễ chọn
        if len(hero_pack_ids) < 4:
            more_packs = (
                db.query(StickerPack)
                .filter(
                    StickerPack.status == "active",
                    ~StickerPack.id.in_(hero_pack_ids) if hero_pack_ids else True
                )
                .order_by(desc(StickerPack.total_downloads))
                .limit(4 - len(hero_pack_ids))
                .all()
            )
            for mp in more_packs:
                current_hero_packs.append(mp)
                hero_pack_ids.append(mp.id)

        # 2. Lấy danh sách toàn bộ các bộ sưu tập active để chọn
        all_active_packs = (
            db.query(StickerPack)
            .filter(StickerPack.status == "active")
            .order_by(StickerPack.title.asc())
            .all()
        )

        selected = [PackService.serialize_pack(p) for p in current_hero_packs]
        available = [PackService.serialize_pack(p) for p in all_active_packs]

    return jsonify({
        "success": True,
        "selected_hero_packs": selected,
        "available_packs": available,
    })


@admin_bp.route("/api/hero-packs", methods=["POST"])
@login_required
def api_save_hero_packs():
    """Lưu 4 bộ sưu tập được chỉ định làm Hero Slider hiển thị trên trang chủ"""
    data = request.get_json(silent=True) or {}
    pack_ids = data.get("pack_ids") or []

    if not isinstance(pack_ids, list) or len(pack_ids) != 4:
        return jsonify({"success": False, "message": "Vui lòng chọn đúng 4 bộ sưu tập cho vị trí Hero!"}), 400

    try:
        with get_db() as db:
            # 1. Reset trạng thái is_featured của toàn bộ các bộ sưu tập khác
            db.query(StickerPack).update({"is_featured": 0, "featured_order": 0}, synchronize_session=False)

            # 2. Làm mới bảng hero_banners
            db.query(HeroBanner).delete()

            # 3. Cập nhật 4 pack được chọn và tạo slide banner tương ứng
            selected_packs = []
            for idx, pid in enumerate(pack_ids):
                pack = db.query(StickerPack).filter_by(id=int(pid)).first()
                if not pack:
                    continue
                pack.is_featured = 1
                pack.featured_order = idx + 1
                selected_packs.append(pack)

                cat_slug = pack.category.slug if pack.category else "others"
                banner = HeroBanner(
                    title=pack.title,
                    subtitle=pack.description or f"Bộ sưu tập {pack.title} siêu đáng yêu, miễn phí!",
                    image_url=pack.cover_image or "/assets/logo_cat.svg",
                    target_url=f"/bo-suu-tap/{cat_slug}/{pack.slug}",
                    sort_order=idx,
                    status="active",
                )
                db.add(banner)

            db.commit()

        return jsonify({
            "success": True,
            "message": "Đã lưu thành công 4 bộ sưu tập Hero cho trang chủ!",
            "hero_pack_ids": pack_ids,
        })
    except Exception as e:
        return jsonify({"success": False, "message": f"Lỗi khi lưu Hero Sticker: {str(e)}"}), 500
