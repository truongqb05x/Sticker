"""
User Routes Blueprint
Quản lý các tuyến đường giao diện người dùng (User Portal) và REST API liên quan
Đồng nhất cấu trúc kiến trúc Service Layer chuyên nghiệp tương tự phân hệ Admin
"""

import uuid
from flask import Blueprint, render_template, request, jsonify, make_response, redirect, url_for
from src.database import get_db
from .services import HomeService, CollectionService, PackDetailService, TopDownloadService

user_bp = Blueprint("user", __name__)


def get_or_create_session_token():
    """Lấy hoặc tạo mã phiên nhận diện ẩn danh người dùng lưu trong cookie"""
    token = request.cookies.get("sh_session_token")
    is_new = False
    if not token:
        token = str(uuid.uuid4())
        is_new = True
    return token, is_new


# ========================================================
# TRANG CHỦ & REST API TRANG CHỦ
# ========================================================

@user_bp.route("/")
@user_bp.route("/index")
def home():
    """Trang chủ: SSR toàn bộ banner, danh mục, bộ sưu tập nổi bật & mới nhất từ CSDL"""
    with get_db() as db:
        banners = HomeService.get_hero_banners(db)
        categories = HomeService.get_categories_with_counts(db)
        featured_packs = HomeService.get_featured_packs(db, limit=4)
        latest_packs = HomeService.get_latest_packs(db, limit=8)
        search_seed = HomeService.get_search_suggestions_seed(db, limit=20)

    return render_template(
        "index.html",
        banners=banners,
        categories=categories,
        featured_packs=featured_packs,
        latest_packs=latest_packs,
        search_seed=search_seed,
    )


@user_bp.route("/api/home/packs", methods=["GET"])
@user_bp.route("/api/packs", methods=["GET"])
def api_get_home_packs():
    """API lấy danh sách gói sticker trang chủ theo bộ lọc danh mục và từ khóa tìm kiếm"""
    category = request.args.get("category")
    search = request.args.get("search")
    limit = request.args.get("limit", 8, type=int)

    with get_db() as db:
        packs = HomeService.get_latest_packs(db, category_slug=category, search=search, limit=limit)

    return jsonify({"success": True, "packs": packs})


@user_bp.route("/api/search/suggestions", methods=["GET"])
def api_search_suggestions():
    """REST API cung cấp danh sách gợi ý tìm kiếm realtime từ CSDL"""
    query = request.args.get("q", "").strip()
    limit = request.args.get("limit", 10, type=int)

    with get_db() as db:
        results = HomeService.search_suggestions(db, query=query, limit=limit)

    return jsonify({
        "success": True,
        "query": query,
        "total": len(results),
        "results": results,
    })


@user_bp.route("/api/packs/<int:pack_id>/download", methods=["POST"])
def api_download_pack(pack_id: int):
    """API ghi nhận một lượt tải trọn bộ sticker từ người dùng"""
    platform = request.form.get("platform") or request.args.get("platform") or "web"
    ip_address = request.remote_addr

    with get_db() as db:
        total = HomeService.record_pack_download(
            db, pack_id=pack_id, platform=platform, ip_address=ip_address
        )

    if total == 0:
        return jsonify({"success": False, "message": "Không tìm thấy bộ sưu tập!"}), 404

    return jsonify({
        "success": True,
        "message": "Đã ghi nhận tải bộ sưu tập thành công!",
        "downloads": total,
    })


# ========================================================
# TRANG BỘ SƯU TẬP & REST API BỘ SƯU TẬP
# ========================================================

@user_bp.route("/bosuutap")
def collections():
    """Trang danh sách bộ sưu tập: SSR đầy đủ danh mục, danh sách nổi bật và lưới 12 bộ sưu tập đầu tiên"""
    category = request.args.get("category")
    filter_type = request.args.get("filter", "all")
    search = request.args.get("search")
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 12, type=int)

    with get_db() as db:
        data = CollectionService.get_collections(
            db,
            category_slug=category,
            filter_type=filter_type,
            search=search,
            page=page,
            limit=limit,
        )
        categories = CollectionService.get_categories_summary(db, active_slug=category)
        featured_packs = CollectionService.get_featured_packs(db, limit=5)

    return render_template(
        "user/bosuutap.html",
        packs=data["packs"],
        pagination=data["pagination"],
        categories=categories,
        featured_packs=featured_packs,
        initial_data=data,
        active_category=category or "all",
        active_filter=filter_type or "all",
    )


@user_bp.route("/api/collections", methods=["GET"])
def api_get_collections():
    """REST API lấy danh sách bộ sưu tập phục vụ bộ lọc tab, danh mục và chuyển trang không tải lại"""
    category = request.args.get("category")
    filter_type = request.args.get("filter", "all")
    search = request.args.get("search")
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 12, type=int)

    with get_db() as db:
        data = CollectionService.get_collections(
            db,
            category_slug=category,
            filter_type=filter_type,
            search=search,
            page=page,
            limit=limit,
        )

    return jsonify({
        "success": True,
        "packs": data["packs"],
        "pagination": data["pagination"],
    })


# ========================================================
# TRANG CHI TIẾT BỘ SƯU TẬP & REST API LIÊN QUAN
# ========================================================

@user_bp.route("/pack/<slug>")
@user_bp.route("/collection/<slug>")
def pack_detail(slug=None):
    """Trang chi tiết một bộ sưu tập: SSR toàn bộ thông tin gói, danh sách sticker, bộ sưu tập liên quan"""
    session_token, is_new = get_or_create_session_token()

    with get_db() as db:
        pack = PackDetailService.get_pack_by_slug_or_id(db, slug or "cute-cats", session_token=session_token)
        if not pack:
            return redirect(url_for("user.collections"))

        categories = CollectionService.get_categories_summary(db, active_slug=pack["category_slug"])
        related_packs = PackDetailService.get_related_packs(
            db, pack_id=pack["id"], category_id=pack["category_id"], limit=5
        )
        stickers_data = PackDetailService.get_pack_stickers(db, pack_id=pack["id"], page=1, limit=20)

    initial_data = {
        "pack": pack,
        "stickers": stickers_data["stickers"],
        "pagination": stickers_data["pagination"],
    }

    rendered = render_template(
        "user/sticker_chitiet.html",
        pack=pack,
        stickers=stickers_data["stickers"],
        pagination=stickers_data["pagination"],
        categories=categories,
        related_packs=related_packs,
        initial_data=initial_data,
    )

    resp = make_response(rendered)
    if is_new:
        resp.set_cookie(
            "sh_session_token",
            session_token,
            max_age=365 * 24 * 3600,
            httponly=True,
            samesite="Lax",
        )
    return resp


@user_bp.route("/api/packs/<slug_or_id>", methods=["GET"])
def api_get_pack_detail(slug_or_id):
    """REST API lấy thông tin chi tiết một bộ sưu tập sticker"""
    session_token, _ = get_or_create_session_token()

    with get_db() as db:
        pack = PackDetailService.get_pack_by_slug_or_id(db, slug_or_id, session_token=session_token)
        if not pack:
            return jsonify({"success": False, "message": "Không tìm thấy bộ sưu tập!"}), 404

        stickers_data = PackDetailService.get_pack_stickers(db, pack_id=pack["id"], page=1, limit=20)

    return jsonify({
        "success": True,
        "pack": pack,
        "stickers": stickers_data["stickers"],
        "pagination": stickers_data["pagination"],
    })


@user_bp.route("/api/packs/<int:pack_id>/stickers", methods=["GET"])
def api_get_pack_stickers(pack_id: int):
    """REST API lấy danh sách sticker trong gói phân trang (20 sticker / trang)"""
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 20, type=int)

    with get_db() as db:
        stickers_data = PackDetailService.get_pack_stickers(db, pack_id=pack_id, page=page, limit=limit)

    return jsonify({
        "success": True,
        "stickers": stickers_data["stickers"],
        "pagination": stickers_data["pagination"],
    })


@user_bp.route("/api/packs/<int:pack_id>/favorite", methods=["POST"])
def api_toggle_favorite(pack_id: int):
    """REST API chuyển đổi trạng thái thả tim / yêu thích của bộ sưu tập"""
    session_token, is_new = get_or_create_session_token()

    with get_db() as db:
        res = PackDetailService.toggle_favorite(db, pack_id=pack_id, session_token=session_token)

    resp = make_response(jsonify(res))
    if is_new:
        resp.set_cookie(
            "sh_session_token",
            session_token,
            max_age=365 * 24 * 3600,
            httponly=True,
            samesite="Lax",
        )
    return resp


@user_bp.route("/api/stickers/<int:sticker_id>/download", methods=["POST"])
def api_download_sticker(sticker_id: int):
    """REST API ghi nhận lượt tải về một sticker đơn lẻ"""
    platform = request.form.get("platform") or request.args.get("platform") or "web"
    ip_address = request.remote_addr

    with get_db() as db:
        res = PackDetailService.record_single_download(
            db, sticker_id=sticker_id, platform=platform, ip_address=ip_address
        )

    if not res.get("success"):
        return jsonify(res), 404

    return jsonify(res)


# ========================================================
# TRANG TOP TẢI NHIỀU & REST API TOP TẢI NHIỀU
# ========================================================

@user_bp.route("/top-tai-nhieu")
def top_downloaded():
    """Trang bảng xếp hạng sticker top tải nhiều: SSR toàn bộ bảng xếp hạng 12 bộ sưu tập đầu, sidebar và hot top 5"""
    category = request.args.get("category", "all")
    sort = request.args.get("sort", "downloads")

    with get_db() as db:
        top_packs = TopDownloadService.get_top_downloads(
            db, category_slug=category, sort_by=sort, limit=12
        )
        hot_ranking = TopDownloadService.get_hot_ranking(db, limit=5)
        categories = CollectionService.get_categories_summary(db, active_slug=category)
        featured_packs = CollectionService.get_featured_packs(db, limit=5)

    initial_data = {
        "packs": top_packs,
        "category": category,
        "sort": sort,
    }

    return render_template(
        "user/toptainhieu.html",
        top_packs=top_packs,
        hot_ranking=hot_ranking,
        categories=categories,
        featured_packs=featured_packs,
        initial_data=initial_data,
        active_category=category,
        active_sort=sort,
    )


@user_bp.route("/api/top-downloads", methods=["GET"])
def api_get_top_downloads():
    """REST API lấy danh sách bảng xếp hạng top sticker theo danh mục và sắp xếp"""
    category = request.args.get("category", "all")
    sort = request.args.get("sort", "downloads")
    limit = request.args.get("limit", 12, type=int)

    with get_db() as db:
        top_packs = TopDownloadService.get_top_downloads(
            db, category_slug=category, sort_by=sort, limit=limit
        )

    return jsonify({
        "success": True,
        "packs": top_packs,
        "category": category,
        "sort": sort,
    })


# ========================================================
# CÁC TUYẾN ĐƯỜNG TRANG CON USER KHÁC
# ========================================================

@user_bp.route("/gioi-thieu")
def about():
    """Trang giới thiệu StickerHub"""
    return render_template("user/gioithieu.html")


@user_bp.route("/dieu-khoan-su-dung")
def terms():
    """Trang điều khoản sử dụng"""
    return render_template("user/dieukhoansudung.html")
