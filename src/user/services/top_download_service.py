"""
Top Download Service Module - StickerHub User Portal
Cung cấp toàn bộ nghiệp vụ truy vấn dữ liệu thực tế cho trang Bảng xếp hạng Top tải nhiều (templates/user/toptainhieu.html):
- Lấy danh sách 12 bộ sưu tập hàng đầu có huy hiệu thứ hạng (Rank 1 Vàng, Rank 2 Bạc, Rank 3 Đồng, Rank 4-12)
- Lọc theo danh mục chủ đề (Tất cả, Anime & Manga, Động vật, Chibi, Phong cảnh, Khác)
- Sắp xếp linh hoạt theo Lượt tải nhiều nhất, Yêu thích nhất, hoặc Tên A-Z
- Lấy danh sách Top 5 bộ sưu tập hot nhất cho cột Sidebar bên phải
- Cung cấp REST API /api/top-downloads phục vụ lọc và sắp xếp động trên trình duyệt
"""

from typing import Dict, Any, List, Optional
from sqlalchemy import func, desc, or_
from sqlalchemy.orm import Session
from src.database import (
    StickerPack,
    Category,
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
    if p.startswith("../../assets/"):
        p = p.replace("../../assets/", "/assets/")
    elif p.startswith("../assets/"):
        p = p.replace("../assets/", "/assets/")
    elif p.startswith("assets/"):
        p = "/" + p
    elif not p.startswith("/") and not p.startswith("http"):
        p = "/" + p
    return p


class TopDownloadService:
    """Dịch vụ tổng hợp bảng xếp hạng sticker top tải nhiều"""

    @classmethod
    def get_top_downloads(
        cls,
        db: Session,
        category_slug: Optional[str] = None,
        sort_by: str = "downloads",
        limit: int = 12,
    ) -> List[Dict[str, Any]]:
        """
        Lấy danh sách các bộ sưu tập hàng đầu kèm huy hiệu thứ hạng (Rank 1 - 12):
        - category_slug: 'all', 'anime', 'animals', 'chibi', 'nature', 'other'
        - sort_by: 'downloads' (mặc định), 'favorites', 'name'
        - limit: Số lượng tối đa (mặc định 12)
        """
        query = db.query(StickerPack).filter(StickerPack.status == "active")

        # 1. Bộ lọc danh mục
        if category_slug and category_slug != "all":
            category_slug = category_slug.lower()
            if category_slug in ("other", "others"):
                # Nhóm "Khác": gồm các chủ đề ngoài 4 chủ đề chính
                query = query.join(StickerPack.category).filter(
                    or_(
                        Category.slug.in_(["others", "love", "animation", "expressions"]),
                        ~Category.slug.in_(["anime", "animals", "chibi", "nature"])
                    )
                )
            else:
                query = query.join(StickerPack.category).filter(Category.slug == category_slug)

        # 2. Sắp xếp thứ tự
        sort_by = (sort_by or "downloads").lower()
        if sort_by == "favorites":
            query = query.order_by(StickerPack.total_favorites.desc(), StickerPack.id.desc())
        elif sort_by == "name":
            query = query.order_by(StickerPack.title.asc(), StickerPack.id.desc())
        else:  # 'downloads'
            query = query.order_by(StickerPack.total_downloads.desc(), StickerPack.id.desc())

        packs_orm = query.limit(limit).all()

        result: List[Dict[str, Any]] = []
        for i, p in enumerate(packs_orm):
            rank = i + 1
            if rank == 1:
                badge_class = "rank-1"
            elif rank == 2:
                badge_class = "rank-2"
            elif rank == 3:
                badge_class = "rank-3"
            else:
                badge_class = "rank-neutral"

            result.append({
                "rank": rank,
                "rank_badge_class": badge_class,
                "id": p.id,
                "title": p.title,
                "slug": p.slug,
                "cover_image": normalize_asset_url(p.cover_image),
                "total_stickers": p.total_stickers or 0,
                "total_downloads": p.total_downloads or 0,
                "total_downloads_compact": format_compact(p.total_downloads or 0),
                "total_favorites": p.total_favorites or 0,
                "total_favorites_compact": format_compact(p.total_favorites or 0),
                "category_id": p.category_id,
                "category_slug": p.category.slug if p.category else "others",
                "category_name": p.category.name if p.category else "Chung",
            })

        return result

    @classmethod
    def get_hot_ranking(cls, db: Session, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Lấy danh sách Top 5 bộ sưu tập hot nhất cho cột Sidebar bên phải
        """
        packs_orm = (
            db.query(StickerPack)
            .filter(StickerPack.status == "active")
            .order_by(StickerPack.total_downloads.desc())
            .limit(limit)
            .all()
        )

        result: List[Dict[str, Any]] = []
        for i, p in enumerate(packs_orm):
            result.append({
                "order": f"{i + 1}.",
                "id": p.id,
                "title": p.title,
                "slug": p.slug,
                "cover_image": normalize_asset_url(p.cover_image),
                "total_downloads": p.total_downloads or 0,
                "total_downloads_compact": format_compact(p.total_downloads or 0),
                "total_stickers": p.total_stickers or 0,
                "category_name": p.category.name if p.category else "Chung",
            })

        return result

