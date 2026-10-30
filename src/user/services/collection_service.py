"""
Collection Service Module - StickerHub User Portal
Cung cấp toàn bộ nghiệp vụ truy vấn dữ liệu thực tế cho trang Bộ sưu tập (templates/user/bosuutap.html):
- Lấy danh sách bộ sưu tập phân trang theo danh mục, bộ lọc (Tất cả, Mới nhất, Tải nhiều, Yêu thích) và từ khóa tìm kiếm
- Lấy danh mục kèm số lượng sticker thực tế
- Lấy danh sách bộ sưu tập nổi bật cho Sidebar & Mobile Drawer
- Hỗ trợ REST API /api/collections phục vụ lọc động và chuyển trang mượt mà
"""

import math
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy import func, desc, or_
from sqlalchemy.orm import Session
from src.database import (
    StickerPack,
    Sticker,
    Category,
    Favorite,
)


def format_compact(val: Any) -> str:
    """Định dạng số gọn gàng (1.2K, 35.8M)"""
    try:
        n = int(val)
        if n >= 1_000_000:
            return f"{n / 1_000_000:.1f}M"
        if n >= 1_000:
            return f"{n / 1_000:.1f}K"
        return f"{n:,}".replace(",", ".")
    except (ValueError, TypeError):
        return str(val or "0")


def normalize_asset_url(path: Optional[str]) -> str:
    """Chuẩn hóa đường dẫn hình ảnh thành đường dẫn web tuyệt đối (/assets/...)"""
    if not path:
        return "/assets/pack_cats.jpg"
    p = path.strip()
    if p.startswith("http://") or p.startswith("https://"):
        return p
    while p.startswith("../"):
        p = p[3:]
    while p.startswith("./"):
        p = p[2:]
    while p.startswith("/"):
        p = p[1:]
    return "/" + p


class CollectionService:
    """Dịch vụ tổng hợp dữ liệu trang Bộ sưu tập StickerHub"""

    @classmethod
    def get_collections(
        cls,
        db: Session,
        category_slug: Optional[str] = None,
        filter_type: str = "all",
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 12,
    ) -> Dict[str, Any]:
        """
        Truy vấn danh sách bộ sưu tập có phân trang và bộ lọc linh hoạt:
        - category_slug: Lọc theo danh mục cụ thể (slug), hoặc None / 'all' để lấy tất cả
        - filter_type: 'all' (mới nhất), 'new' (mới nhất), 'popular' (tải nhiều nhất), 'favorite' (yêu thích nhất)
        - search: Từ khóa tìm kiếm theo tiêu đề, mô tả hoặc tác giả
        - page: Trang hiện tại (1-based)
        - limit: Số lượng phần tử mỗi trang (mặc định 12)
        """
        query = db.query(StickerPack).filter(StickerPack.status == "active")

        # 1. Bộ lọc danh mục
        if category_slug and category_slug != "all":
            query = query.join(StickerPack.category).filter(Category.slug == category_slug)

        # 2. Bộ lọc tìm kiếm
        if search and search.strip():
            s = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    StickerPack.title.ilike(s),
                    StickerPack.description.ilike(s),
                    StickerPack.author_name.ilike(s),
                )
            )

        # 3. Sắp xếp theo filter_type
        filter_type = (filter_type or "all").lower()
        if filter_type == "popular":
            query = query.order_by(StickerPack.total_downloads.desc(), StickerPack.id.desc())
        elif filter_type == "favorite":
            query = query.order_by(StickerPack.total_favorites.desc(), StickerPack.id.desc())
        elif filter_type == "new":
            query = query.order_by(StickerPack.created_at.desc(), StickerPack.id.desc())
        else:  # 'all'
            query = query.order_by(StickerPack.created_at.desc(), StickerPack.id.desc())

        # 4. Tính toán phân trang
        total = query.count()
        page = max(1, int(page or 1))
        limit = max(1, min(int(limit or 12), 48))
        total_pages = max(1, math.ceil(total / limit)) if total > 0 else 1

        if page > total_pages and total > 0:
            page = total_pages

        offset = (page - 1) * limit
        packs_orm = query.offset(offset).limit(limit).all()

        packs: List[Dict[str, Any]] = []
        for p in packs_orm:
            packs.append({
                "id": p.id,
                "title": p.title,
                "slug": p.slug,
                "category_id": p.category_id,
                "category_name": p.category.name if p.category else "Chung",
                "category_slug": p.category.slug if p.category else "others",
                "author_name": p.author_name or "StickerHub Team",
                "cover_image": normalize_asset_url(p.cover_image),
                "description": p.description or f"Bộ sưu tập {p.title} siêu đáng yêu, phù hợp để nhắn tin.",
                "total_stickers": p.total_stickers or 0,
                "total_downloads": p.total_downloads or 0,
                "total_downloads_compact": format_compact(p.total_downloads or 0),
                "total_favorites": p.total_favorites or 0,
                "total_favorites_compact": format_compact(p.total_favorites or 0),
                "is_featured": bool(p.is_featured),
                "is_new": (datetime.utcnow() - p.created_at).days <= 14 if p.created_at else False,
                "status": p.status,
                "created_at": p.created_at.strftime("%Y-%m-%d %H:%M:%S") if p.created_at else None,
            })

        start_idx = (offset + 1) if total > 0 else 0
        end_idx = min(offset + limit, total)

        pagination = {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
            "start_idx": start_idx,
            "end_idx": end_idx,
            "has_prev": page > 1,
            "has_next": page < total_pages,
            "category": category_slug or "all",
            "filter": filter_type,
            "search": search or "",
        }

        return {
            "packs": packs,
            "pagination": pagination,
        }

    @classmethod
    def get_categories_summary(
        cls,
        db: Session,
        active_slug: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Lấy danh sách toàn bộ danh mục kèm số lượng sticker thực tế từ CSDL
        Dùng cho cả Left Sidebar và Mobile Drawer accordion
        """
        cats_orm = (
            db.query(Category)
            .filter_by(status="active")
            .order_by(Category.sort_order.asc())
            .all()
        )

        result = []
        for c in cats_orm:
            active_packs = [p for p in c.sticker_packs if p.status == "active"] if c.sticker_packs else []
            pack_count = len(active_packs)
            sticker_count = sum(p.total_stickers or 0 for p in active_packs)

            result.append({
                "id": c.id,
                "name": c.name,
                "slug": c.slug,
                "icon_name": c.icon_name or "tag",
                "badge_bg_class": c.badge_bg_class or "badge-bg-1",
                "pack_count": pack_count,
                "sticker_count": sticker_count,
                "is_active": (c.slug == active_slug),
            })

        return result

    @classmethod
    def get_featured_packs(cls, db: Session, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Lấy danh sách các bộ sưu tập nổi bật nhất cho Sidebar & Mobile Drawer
        """
        packs_orm = (
            db.query(StickerPack)
            .filter(StickerPack.status == "active")
            .order_by(StickerPack.is_featured.desc(), StickerPack.total_downloads.desc())
            .limit(limit)
            .all()
        )

        result = []
        for p in packs_orm:
            result.append({
                "id": p.id,
                "title": p.title,
                "slug": p.slug,
                "cover_image": normalize_asset_url(p.cover_image),
                "total_stickers": p.total_stickers or 0,
                "total_downloads": p.total_downloads or 0,
                "total_downloads_compact": format_compact(p.total_downloads or 0),
                "total_favorites": p.total_favorites or 0,
                "category_name": p.category.name if p.category else "Chung",
                "category_slug": p.category.slug if p.category else "others",
            })

        return result

