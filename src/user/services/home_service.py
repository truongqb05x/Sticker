import re
import unicodedata
from datetime import datetime, date
from typing import Dict, Any, List, Optional
from sqlalchemy import func, desc, or_
from sqlalchemy.orm import Session
from src.database import (
    StickerPack,
    Sticker,
    Category,
    HeroBanner,
    DownloadLog,
    DailyStat,
)


def remove_vietnamese_tones(text: str) -> str:
    """Loại bỏ dấu tiếng Việt để tìm kiếm không phân biệt dấu và chữ hoa chữ thường"""
    if not text:
        return ""
    text = unicodedata.normalize("NFD", text)
    text = re.sub(r"[\u0300-\u036f]", "", text)
    text = text.replace("đ", "d").replace("Đ", "D")
    return text.lower().strip()


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
        return ""
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


class HomeService:
    """Dịch vụ tổng hợp dữ liệu trang chủ StickerHub"""

    @classmethod
    def get_hero_banners(cls, db: Session) -> List[Dict[str, Any]]:
        """Lấy danh sách slide banner trình chiếu trang chủ"""
        banners_orm = (
            db.query(HeroBanner)
            .filter_by(status="active")
            .order_by(HeroBanner.sort_order.asc())
            .all()
        )

        result = []
        for b in banners_orm:
            result.append({
                "id": b.id,
                "title": b.title,
                "subtitle": b.subtitle or "",
                "image_url": normalize_asset_url(b.image_url),
                "target_url": b.target_url or "#stickerGrid",
                "sort_order": b.sort_order,
            })

        return result

    @classmethod
    def get_categories_with_counts(cls, db: Session) -> List[Dict[str, Any]]:
        """Lấy danh sách toàn bộ danh mục chủ đề kèm số lượng sticker thực tế từ CSDL"""
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
            })

        return result

    @classmethod
    def get_featured_packs(cls, db: Session, limit: int = 4) -> List[Dict[str, Any]]:
        """Lấy danh sách các bộ sưu tập nổi bật (tải nhiều nhất) cho Sidebar và Drawer"""
        packs_orm = (
            db.query(StickerPack)
            .join(Category, StickerPack.category_id == Category.id, isouter=True)
            .filter(StickerPack.status == "active")
            .order_by(desc(StickerPack.is_featured), StickerPack.featured_order.asc(), desc(StickerPack.total_downloads))
            .limit(limit)
            .all()
        )

        result = []
        for p in packs_orm:
            result.append({
                "id": p.id,
                "title": p.title,
                "slug": p.slug,
                "author_name": p.author_name or "StickerHub",
                "category_name": p.category.name if p.category else "Chủ đề chung",
                "category_slug": p.category.slug if p.category else "others",
                "cover_image": normalize_asset_url(p.cover_image),
                "total_stickers": p.total_stickers or 0,
                "total_downloads": p.total_downloads or 0,
                "total_downloads_fmt": format_compact(p.total_downloads or 0),
            })
        return result

    @classmethod
    def get_latest_packs(
        cls,
        db: Session,
        category_slug: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 8
    ) -> List[Dict[str, Any]]:
        """Lấy danh sách bộ sưu tập hiển thị trên lưới chính (Sticker Grid)"""
        query = (
            db.query(StickerPack)
            .join(Category, StickerPack.category_id == Category.id, isouter=True)
            .filter(StickerPack.status == "active")
        )

        if category_slug and category_slug != "all":
            query = query.filter(Category.slug == category_slug)

        if search:
            term = f"%{search.strip()}%"
            query = query.filter(
                (StickerPack.title.ilike(term)) |
                (StickerPack.author_name.ilike(term)) |
                (StickerPack.description.ilike(term))
            )

        packs_orm = query.order_by(desc(StickerPack.created_at)).limit(limit).all()

        result = []
        for p in packs_orm:
            cat_name = p.category.name if p.category else "Chủ đề chung"
            cat_slug = p.category.slug if p.category else "others"

            # Xây dựng chuỗi tags phục vụ tìm kiếm / lọc nhanh ở client
            tags_list = [
                p.slug.replace("-", " "),
                p.title.lower(),
                cat_slug,
                cat_name.lower(),
                p.author_name.lower() if p.author_name else "",
            ]
            tags_str = " ".join(tags_list)

            result.append({
                "id": p.id,
                "title": p.title,
                "slug": p.slug,
                "author_name": p.author_name or "StickerHub",
                "category_name": cat_name,
                "category_slug": cat_slug,
                "cover_image": normalize_asset_url(p.cover_image),
                "total_stickers": p.total_stickers or 0,
                "total_downloads": p.total_downloads or 0,
                "total_downloads_fmt": format_compact(p.total_downloads or 0),
                "total_favorites_fmt": format_compact(p.total_favorites or 0),
                "tags_str": tags_str,
            })

        return result

    @classmethod
    def get_search_suggestions_seed(cls, db: Session, limit: int = 20) -> List[Dict[str, Any]]:
        """Lấy danh sách dữ liệu các gói phục vụ thanh tìm kiếm gợi ý realtime"""
        packs_orm = (
            db.query(StickerPack)
            .join(Category, StickerPack.category_id == Category.id, isouter=True)
            .filter(StickerPack.status == "active")
            .order_by(desc(StickerPack.is_featured), StickerPack.featured_order.asc(), desc(StickerPack.total_downloads))
            .limit(limit)
            .all()
        )

        result = []
        for p in packs_orm:
            cat_name = p.category.name if p.category else "Chủ đề chung"
            cat_slug = p.category.slug if p.category else "others"

            tags = [
                p.title.lower(),
                p.slug.replace("-", " "),
                cat_name.lower(),
                cat_slug,
            ]
            if p.author_name:
                tags.append(p.author_name.lower())

            result.append({
                "id": p.id,
                "slug": p.slug,
                "name": p.title,
                "subtitle": f"{p.total_stickers or 0} sticker",
                "category": cat_name,
                "category_slug": cat_slug,
                "img": normalize_asset_url(p.cover_image),
                "total_downloads": p.total_downloads or 0,
                "total_downloads_fmt": format_compact(p.total_downloads or 0),
                "tags": tags,
            })

        return result

    @classmethod
    def search_suggestions(
        cls,
        db: Session,
        query: str = "",
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Lọc và trả về danh sách gợi ý tìm kiếm theo từ khóa thực tế từ CSDL"""
        q_raw = (query or "").strip()
        if not q_raw:
            return cls.get_search_suggestions_seed(db, limit=limit)

        q_norm = remove_vietnamese_tones(q_raw)

        # 1. Lấy danh sách các gói sticker active từ CSDL
        packs_orm = (
            db.query(StickerPack)
            .join(Category, StickerPack.category_id == Category.id, isouter=True)
            .filter(StickerPack.status == "active")
            .order_by(desc(StickerPack.is_featured), StickerPack.featured_order.asc(), desc(StickerPack.total_downloads))
            .all()
        )

        matched_packs = []
        for p in packs_orm:
            cat_name = p.category.name if p.category else "Chủ đề chung"
            cat_slug = p.category.slug if p.category else "others"

            # Xây dựng danh sách tag tìm kiếm
            tags = [
                p.title.lower(),
                p.slug.replace("-", " "),
                cat_name.lower(),
                cat_slug,
            ]
            if p.author_name:
                tags.append(p.author_name.lower())
            if p.description:
                tags.append(p.description.lower())

            # Chuỗi tổng hợp để đối chiếu
            search_corpus = f"{p.title} {p.slug.replace('-', ' ')} {cat_name} {cat_slug} {p.author_name or ''} {p.description or ''}"
            corpus_norm = remove_vietnamese_tones(search_corpus)

            # Khớp có dấu hoặc không dấu
            if (q_raw.lower() in search_corpus.lower()) or (q_norm and q_norm in corpus_norm):
                matched_packs.append({
                    "id": p.id,
                    "slug": p.slug,
                    "name": p.title,
                    "subtitle": f"{p.total_stickers or 0} sticker",
                    "category": cat_name,
                    "category_slug": cat_slug,
                    "img": normalize_asset_url(p.cover_image),
                    "total_downloads": p.total_downloads or 0,
                    "total_downloads_fmt": format_compact(p.total_downloads or 0),
                    "tags": tags,
                })
                if len(matched_packs) >= limit:
                    break

        return matched_packs

    @classmethod
    def record_pack_download(
        cls,
        db: Session,
        pack_id: int,
        platform: str = "web",
        ip_address: Optional[str] = None
    ) -> int:
        """Ghi nhận một lượt tải bộ sưu tập từ người dùng thực"""
        pack = db.query(StickerPack).filter_by(id=pack_id).first()
        if not pack:
            return 0

        # 1. Tăng bộ đếm trên StickerPack
        pack.total_downloads = (pack.total_downloads or 0) + 1

        # 2. Lưu vết vào nhật ký DownloadLog
        log = DownloadLog(
            pack_id=pack.id,
            download_type="zip",
            platform=platform,
            ip_address=ip_address,
            downloaded_at=datetime.utcnow()
        )
        db.add(log)

        # 3. Tăng tổng lượt tải trong DailyStat hôm nay
        today = date.today()
        daily = db.query(DailyStat).filter_by(stat_date=today).first()
        if daily:
            daily.total_downloads = (daily.total_downloads or 0) + 1

        db.commit()
        return pack.total_downloads