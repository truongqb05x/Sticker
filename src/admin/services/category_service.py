"""
Category Service Module - StickerHub Admin
Cung cấp toàn bộ nghiệp vụ quản lý danh mục chủ đề: thống kê, tìm kiếm, lọc, CRUD và bảo toàn dữ liệu
"""

import re
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy import func, or_, desc
from sqlalchemy.orm import Session
from src.database import Category, StickerPack, Sticker


def slugify_vn(text: str) -> str:
    """Chuyển đổi chuỗi tiếng Việt có dấu thành slug URL chuẩn SEO"""
    if not text:
        return ""
    text = text.lower().strip()
    replacements = {
        'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a', 'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a',
        'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
        'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
        'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
        'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o', 'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o',
        'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
        'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u', 'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
        'đ': 'd'
    }
    for char, rep in replacements.items():
        text = text.replace(char, rep)
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text)
    return text.strip('-')


def format_compact(val: Any) -> str:
    """Định dạng số rút gọn (1.2K, 35.8M)"""
    try:
        n = int(val)
        if n >= 1_000_000:
            return f"{n / 1_000_000:.1f}M"
        if n >= 1_000:
            return f"{n / 1_000:.1f}K"
        return f"{n:,}".replace(",", ".")
    except (ValueError, TypeError):
        return str(val or "0")


class CategoryService:
    """Dịch vụ xử lý nghiệp vụ Quản lý Danh mục Chủ đề"""

    @classmethod
    def serialize_category(
        cls,
        cat: Category,
        total_packs: int = 0,
        total_stickers: int = 0,
        total_downloads: int = 0,
    ) -> Dict[str, Any]:
        """Chuyển đổi đối tượng Category sang dict chuẩn JSON / SSR"""
        icon = cat.icon_name or "tag"
        badge_bg = cat.badge_bg_class or f"badge-bg-{(cat.sort_order % 8) + 1}"

        return {
            "id": cat.id,
            "name": cat.name,
            "slug": cat.slug,
            "icon_name": icon,
            "badge_bg_class": badge_bg,
            "description": cat.description or "",
            "sort_order": int(cat.sort_order or 0),
            "status": cat.status or "active",
            "total_packs": int(total_packs),
            "total_stickers": int(total_stickers),
            "total_downloads": int(total_downloads),
            "total_downloads_fmt": format_compact(total_downloads),
            "created_at": cat.created_at.strftime("%d/%m/%Y") if cat.created_at else "",
            "updated_at": cat.updated_at.strftime("%d/%m/%Y") if cat.updated_at else "",
        }

    @classmethod
    def get_categories(
        cls,
        db: Session,
        search: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Lấy danh sách danh mục kèm thống kê số bộ sưu tập, sticker và lượt tải"""
        query = db.query(Category)

        if status and status != "all":
            query = query.filter(Category.status == status)

        if search:
            s = f"%{search.strip().lower()}%"
            query = query.filter(
                or_(
                    func.lower(Category.name).like(s),
                    func.lower(Category.slug).like(s),
                    func.lower(Category.description).like(s),
                )
            )

        cats_orm = query.order_by(Category.sort_order.asc(), Category.id.asc()).all()

        # Tổng hợp thống kê theo category_id
        # 1. Số packs và lượt tải theo category
        pack_stats = (
            db.query(
                StickerPack.category_id,
                func.count(StickerPack.id).label("pack_count"),
                func.sum(StickerPack.total_stickers).label("sticker_sum"),
                func.sum(StickerPack.total_downloads).label("download_sum"),
            )
            .group_by(StickerPack.category_id)
            .all()
        )

        pack_stat_map = {}
        for cat_id, p_cnt, s_sum, d_sum in pack_stats:
            pack_stat_map[cat_id] = {
                "packs": int(p_cnt or 0),
                "stickers": int(s_sum or 0),
                "downloads": int(d_sum or 0),
            }

        result = []
        for cat in cats_orm:
            stats = pack_stat_map.get(cat.id, {"packs": 0, "stickers": 0, "downloads": 0})
            result.append(
                cls.serialize_category(
                    cat,
                    total_packs=stats["packs"],
                    total_stickers=stats["stickers"],
                    total_downloads=stats["downloads"],
                )
            )

        return result

    @classmethod
    def get_category_metrics(cls, db: Session) -> Dict[str, Any]:
        """Tổng hợp 3 thẻ chỉ số nhanh trên đầu trang Quản lý Danh mục"""
        total_cats = int(db.query(func.count(Category.id)).scalar() or 0)
        active_cats = int(db.query(func.count(Category.id)).filter(Category.status == "active").scalar() or 0)
        hidden_cats = int(db.query(func.count(Category.id)).filter(Category.status == "hidden").scalar() or 0)

        # Tổng số packs và stickers trên toàn hệ thống
        total_packs = int(db.query(func.count(StickerPack.id)).scalar() or 0)
        total_stickers = int(db.query(func.count(Sticker.id)).scalar() or db.query(func.sum(StickerPack.total_stickers)).scalar() or 0)

        # Danh mục dẫn đầu lượt tải
        top_cat_row = (
            db.query(
                Category.name,
                func.sum(StickerPack.total_downloads).label("total_dl"),
            )
            .join(StickerPack, StickerPack.category_id == Category.id)
            .group_by(Category.id, Category.name)
            .order_by(desc("total_dl"))
            .first()
        )

        top_cat_name = top_cat_row[0] if top_cat_row else "Động vật"
        top_cat_dl = int(top_cat_row[1] or 0) if top_cat_row else 0
        top_cat_display = f"{top_cat_name} ({format_compact(top_cat_dl)})"

        return {
            "total_categories": total_cats,
            "active_categories": active_cats,
            "hidden_categories": hidden_cats,
            "status_ratio": f"{active_cats}/{total_cats} Đang hiển thị",
            "top_category": top_cat_display,
            "top_category_name": top_cat_name,
            "top_category_downloads": format_compact(top_cat_dl),
            "total_packs": total_packs,
            "total_stickers": total_stickers,
        }

    @classmethod
    def get_category_by_id(cls, db: Session, category_id: int) -> Optional[Dict[str, Any]]:
        """Lấy chi tiết một danh mục theo ID"""
        cat = db.query(Category).filter_by(id=category_id).first()
        if not cat:
            return None

        # Đếm số pack thuộc danh mục
        total_packs = db.query(func.count(StickerPack.id)).filter_by(category_id=cat.id).scalar() or 0
        total_stickers = db.query(func.sum(StickerPack.total_stickers)).filter_by(category_id=cat.id).scalar() or 0
        total_downloads = db.query(func.sum(StickerPack.total_downloads)).filter_by(category_id=cat.id).scalar() or 0

        return cls.serialize_category(
            cat,
            total_packs=int(total_packs),
            total_stickers=int(total_stickers),
            total_downloads=int(total_downloads),
        )

    @classmethod
    def create_category(cls, db: Session, data: Dict[str, Any]) -> Dict[str, Any]:
        """Tạo danh mục chủ đề mới"""
        name = (data.get("name") or "").strip()
        if not name:
            raise ValueError("Tên danh mục không được để trống!")

        raw_slug = (data.get("slug") or "").strip()
        base_slug = slugify_vn(raw_slug) if raw_slug else slugify_vn(name)
        if not base_slug:
            base_slug = "danh-muc"

        # Đảm bảo slug duy nhất
        slug = base_slug
        counter = 1
        while db.query(Category).filter_by(slug=slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1

        sort_order = int(data.get("sort_order") or 9)
        status = data.get("status", "active")
        if status not in ("active", "hidden"):
            status = "active"

        icon_name = (data.get("icon_name") or "tag").strip()
        badge_bg_class = (data.get("badge_bg_class") or f"badge-bg-{(sort_order % 8) + 1}").strip()
        description = (data.get("description") or "").strip()

        new_cat = Category(
            name=name,
            slug=slug,
            icon_name=icon_name,
            badge_bg_class=badge_bg_class,
            description=description,
            sort_order=sort_order,
            status=status,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        db.add(new_cat)
        db.commit()
        db.refresh(new_cat)

        return cls.serialize_category(new_cat)

    @classmethod
    def update_category(cls, db: Session, category_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Cập nhật thông tin danh mục"""
        cat = db.query(Category).filter_by(id=category_id).first()
        if not cat:
            return None

        name = (data.get("name") or "").strip()
        if name:
            cat.name = name

        if "slug" in data and data["slug"]:
            clean_slug = slugify_vn(data["slug"])
            if clean_slug and clean_slug != cat.slug:
                # Kiểm tra trùng slug với bản ghi khác
                existing = db.query(Category).filter(Category.slug == clean_slug, Category.id != cat.id).first()
                if not existing:
                    cat.slug = clean_slug

        if "sort_order" in data and str(data["sort_order"]).isdigit():
            cat.sort_order = int(data["sort_order"])

        if "status" in data and data["status"] in ("active", "hidden"):
            cat.status = data["status"]

        if "description" in data:
            cat.description = (data["description"] or "").strip()

        if "icon_name" in data and data["icon_name"]:
            cat.icon_name = data["icon_name"].strip()

        if "badge_bg_class" in data and data["badge_bg_class"]:
            cat.badge_bg_class = data["badge_bg_class"].strip()

        cat.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(cat)

        # Lấy lại thống kê
        total_packs = db.query(func.count(StickerPack.id)).filter_by(category_id=cat.id).scalar() or 0
        total_stickers = db.query(func.sum(StickerPack.total_stickers)).filter_by(category_id=cat.id).scalar() or 0
        total_downloads = db.query(func.sum(StickerPack.total_downloads)).filter_by(category_id=cat.id).scalar() or 0

        return cls.serialize_category(
            cat,
            total_packs=int(total_packs),
            total_stickers=int(total_stickers),
            total_downloads=int(total_downloads),
        )

    @classmethod
    def toggle_status(cls, db: Session, category_id: int) -> Optional[Dict[str, Any]]:
        """Chuyển đổi trạng thái hiển thị (active <-> hidden)"""
        cat = db.query(Category).filter_by(id=category_id).first()
        if not cat:
            return None

        cat.status = "hidden" if cat.status == "active" else "active"
        cat.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(cat)

        return cls.serialize_category(cat)

    @classmethod
    def delete_category(cls, db: Session, category_id: int) -> bool:
        """Xóa danh mục: tự động di dời các bộ sưu tập con sang danh mục khác để tránh lỗi khóa ngoại"""
        cat = db.query(Category).filter_by(id=category_id).first()
        if not cat:
            return False

        # Tìm danh mục dự phòng (fallback) để chuyển các pack con sang
        fallback_cat = (
            db.query(Category)
            .filter(Category.id != category_id)
            .order_by(Category.id.desc())
            .first()
        )

        if fallback_cat:
            # Chuyển toàn bộ sticker packs thuộc category sắp xóa sang category dự phòng
            db.query(StickerPack).filter_by(category_id=category_id).update(
                {"category_id": fallback_cat.id}, synchronize_session=False
            )

        db.delete(cat)
        db.commit()
        return True

