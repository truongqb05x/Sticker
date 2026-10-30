"""
Pack Service Module - StickerHub Admin
Cung cấp toàn bộ nghiệp vụ quản lý bộ sưu tập sticker (CRUD, lọc, tìm kiếm, phân trang, gán nhãn)
"""

import re
import uuid
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy import func, or_, desc
from sqlalchemy.orm import Session
from src.database import StickerPack, Category, Tag


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


class PackService:
    """Dịch vụ xử lý nghiệp vụ Quản lý Bộ sưu tập Sticker"""

    @classmethod
    def serialize_pack(cls, pack: StickerPack) -> Dict[str, Any]:
        """Chuyển đổi đối tượng StickerPack sang dict an toàn cho JSON & SSR"""
        cat_name = pack.category.name if pack.category else "Chưa phân loại"
        cat_slug = pack.category.slug if pack.category else "others"
        tags_list = [t.name for t in pack.tags] if pack.tags else []

        return {
            "id": pack.id,
            "code": pack.code or f"SPK-{pack.id}",
            "title": pack.title,
            "slug": pack.slug,
            "author_name": pack.author_name,
            "category_id": pack.category_id,
            "category_name": cat_name,
            "category_slug": cat_slug,
            "description": pack.description or "",
            "cover_image": pack.cover_image or "../../assets/logo_cat.svg",
            "total_stickers": int(pack.total_stickers or 0),
            "total_downloads": int(pack.total_downloads or 0),
            "total_downloads_fmt": format_compact(pack.total_downloads or 0),
            "total_favorites": int(pack.total_favorites or 0),
            "status": pack.status or "active",
            "tags": tags_list,
            "tags_str": ", ".join(tags_list),
            "created_at": pack.created_at.strftime("%d/%m/%Y") if pack.created_at else "",
            "updated_at": pack.updated_at.strftime("%d/%m/%Y") if pack.updated_at else "",
        }

    @classmethod
    def get_status_counts(cls, db: Session) -> Dict[str, int]:
        """Đếm số lượng bộ sưu tập theo từng trạng thái (all, active, pending, hidden)"""
        total = int(db.query(func.count(StickerPack.id)).scalar() or 0)
        active_count = int(db.query(func.count(StickerPack.id)).filter(StickerPack.status == "active").scalar() or 0)
        pending_count = int(db.query(func.count(StickerPack.id)).filter(StickerPack.status == "pending").scalar() or 0)
        hidden_count = int(db.query(func.count(StickerPack.id)).filter(StickerPack.status == "hidden").scalar() or 0)

        return {
            "all": total,
            "active": active_count,
            "pending": pending_count,
            "hidden": hidden_count,
        }

    @classmethod
    def get_packs(
        cls,
        db: Session,
        category: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> Dict[str, Any]:
        """Lấy danh sách bộ sưu tập có bộ lọc, tìm kiếm và phân trang"""
        query = db.query(StickerPack).join(Category, StickerPack.category_id == Category.id, isouter=True)

        # Lọc theo Trạng thái
        if status and status != "all":
            query = query.filter(StickerPack.status == status)

        # Lọc theo Danh mục (hỗ trợ category_id hoặc category slug)
        if category and category != "all":
            if category.isdigit():
                query = query.filter(StickerPack.category_id == int(category))
            else:
                query = query.filter(Category.slug == category)

        # Tìm kiếm từ khóa (tên bộ sưu tập, slug, tên tác giả)
        if search:
            s = f"%{search.strip().lower()}%"
            query = query.filter(
                or_(
                    func.lower(StickerPack.title).like(s),
                    func.lower(StickerPack.slug).like(s),
                    func.lower(StickerPack.author_name).like(s),
                )
            )

        total_records = query.count()
        pages = max(1, (total_records + limit - 1) // limit) if limit > 0 else 1
        page = max(1, min(page, pages))

        packs_orm = (
            query.order_by(desc(StickerPack.id))
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )

        packs_data = [cls.serialize_pack(p) for p in packs_orm]
        counts = cls.get_status_counts(db)

        return {
            "packs": packs_data,
            "total": total_records,
            "page": page,
            "pages": pages,
            "limit": limit,
            "counts": counts,
        }

    @classmethod
    def get_pack_by_id(cls, db: Session, pack_id: int) -> Optional[Dict[str, Any]]:
        """Lấy chi tiết một bộ sưu tập theo ID"""
        pack = db.query(StickerPack).filter_by(id=pack_id).first()
        if not pack:
            return None
        return cls.serialize_pack(pack)

    @classmethod
    def _generate_unique_slug(cls, db: Session, base_slug: str, exclude_id: Optional[int] = None) -> str:
        """Đảm bảo slug là duy nhất trong CSDL"""
        slug = base_slug or "bo-suu-tap"
        counter = 1
        test_slug = slug

        while True:
            q = db.query(StickerPack).filter(StickerPack.slug == test_slug)
            if exclude_id:
                q = q.filter(StickerPack.id != exclude_id)
            if not q.first():
                return test_slug
            test_slug = f"{slug}-{counter}"
            counter += 1

    @classmethod
    def _sync_tags(cls, db: Session, pack: StickerPack, tags_str: Optional[str]):
        """Đồng bộ danh sách Tags cho bộ sưu tập"""
        if tags_str is None:
            return

        tag_names = [t.strip() for t in tags_str.split(",") if t.strip()]
        new_tags = []

        for name in tag_names:
            tag_slug = slugify_vn(name)
            if not tag_slug:
                continue

            tag_obj = db.query(Tag).filter(or_(Tag.name == name, Tag.slug == tag_slug)).first()
            if not tag_obj:
                tag_obj = Tag(name=name, slug=tag_slug, usage_count=1)
                db.add(tag_obj)
                db.flush()
            else:
                tag_obj.usage_count += 1
            new_tags.append(tag_obj)

        pack.tags = new_tags

    @classmethod
    def create_pack(cls, db: Session, data: Dict[str, Any]) -> Dict[str, Any]:
        """Thêm mới bộ sưu tập vào CSDL"""
        title = (data.get("title") or "").strip()
        if not title:
            raise ValueError("Tên bộ sưu tập không được để trống!")

        # Chuẩn hóa slug
        raw_slug = (data.get("slug") or "").strip()
        base_slug = slugify_vn(raw_slug) if raw_slug else slugify_vn(title)
        slug = cls._generate_unique_slug(db, base_slug)

        # Xử lý danh mục: hỗ trợ category_id hoặc category slug
        cat_val = data.get("category_id") or data.get("category")
        category_id = 1
        if cat_val:
            if str(cat_val).isdigit():
                category_id = int(cat_val)
            else:
                cat_match = db.query(Category).filter_by(slug=str(cat_val)).first()
                if cat_match:
                    category_id = cat_match.id

        author_name = (data.get("author_name") or "StickerHub Team").strip()
        status = data.get("status", "active")
        if status not in ("active", "pending", "hidden"):
            status = "active"

        description = (data.get("description") or "").strip()
        cover_image = (data.get("cover_image") or "../../assets/pack_cats.jpg").strip()

        # Tạo mã định danh pack
        code = f"SPK-{int(time.time()) % 1000000:06d}"

        new_pack = StickerPack(
            category_id=category_id,
            code=code,
            title=title,
            slug=slug,
            author_name=author_name,
            description=description,
            cover_image=cover_image,
            total_stickers=int(data.get("total_stickers") or 24),
            status=status,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        # Xử lý tags nếu có
        if "tags" in data or "tags_str" in data:
            cls._sync_tags(db, new_pack, data.get("tags") or data.get("tags_str"))

        db.add(new_pack)
        db.commit()
        db.refresh(new_pack)

        return cls.serialize_pack(new_pack)

    @classmethod
    def update_pack(cls, db: Session, pack_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Cập nhật thông tin bộ sưu tập"""
        pack = db.query(StickerPack).filter_by(id=pack_id).first()
        if not pack:
            return None

        title = (data.get("title") or "").strip()
        if title:
            pack.title = title

        # Cập nhật slug nếu được cung cấp
        if "slug" in data and data["slug"]:
            clean_slug = slugify_vn(data["slug"])
            pack.slug = cls._generate_unique_slug(db, clean_slug, exclude_id=pack.id)

        if "author_name" in data:
            pack.author_name = (data["author_name"] or "").strip() or "StickerHub Team"

        # Cập nhật danh mục
        cat_val = data.get("category_id") or data.get("category")
        if cat_val is not None:
            if str(cat_val).isdigit():
                pack.category_id = int(cat_val)
            else:
                cat_match = db.query(Category).filter_by(slug=str(cat_val)).first()
                if cat_match:
                    pack.category_id = cat_match.id

        if "status" in data and data["status"] in ("active", "pending", "hidden"):
            pack.status = data["status"]

        if "description" in data:
            pack.description = (data["description"] or "").strip()

        if "cover_image" in data and data["cover_image"]:
            pack.cover_image = data["cover_image"].strip()

        if "total_stickers" in data and str(data["total_stickers"]).isdigit():
            pack.total_stickers = int(data["total_stickers"])

        # Cập nhật tags
        if "tags" in data or "tags_str" in data:
            cls._sync_tags(db, pack, data.get("tags") or data.get("tags_str"))

        pack.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(pack)

        return cls.serialize_pack(pack)

    @classmethod
    def delete_pack(cls, db: Session, pack_id: int) -> bool:
        """Xóa vĩnh viễn bộ sưu tập khỏi CSDL"""
        pack = db.query(StickerPack).filter_by(id=pack_id).first()
        if not pack:
            return False
        db.delete(pack)
        db.commit()
        return True

    @classmethod
    def update_status(cls, db: Session, pack_id: int, new_status: str) -> bool:
        """Cập nhật trạng thái duyệt / xuất bản"""
        pack = db.query(StickerPack).filter_by(id=pack_id).first()
        if not pack:
            return False
        pack.status = new_status
        pack.updated_at = datetime.utcnow()
        db.commit()
        return True

