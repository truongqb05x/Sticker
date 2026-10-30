"""
Sticker Service Module - StickerHub Admin
Quản lý toàn bộ nghiệp vụ kho sticker đơn lẻ: tìm kiếm, lọc, phân trang, tải lên, xem trước, tải về và xóa
"""

import os
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy import func, or_, desc
from sqlalchemy.orm import Session
from src.database import Sticker, StickerPack, Category


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


class StickerService:
    """Dịch vụ xử lý nghiệp vụ Quản lý Kho Sticker"""

    @classmethod
    def serialize_sticker(cls, sticker: Sticker) -> Dict[str, Any]:
        """Chuyển đổi đối tượng Sticker sang dict chuẩn JSON / SSR"""
        pack = sticker.pack
        cat = pack.category if pack else None

        return {
            "id": sticker.id,
            "pack_id": sticker.pack_id,
            "pack_title": pack.title if pack else "Không xác định",
            "pack_slug": pack.slug if pack else "",
            "category_id": cat.id if cat else None,
            "category_name": cat.name if cat else "Chưa phân loại",
            "category_slug": cat.slug if cat else "others",
            "title": sticker.title,
            "file_name": sticker.file_name,
            "file_path": sticker.file_path,
            "format": (sticker.format or "svg").upper(),
            "dimensions": sticker.dimensions or "512 x 512 px",
            "file_size_kb": int(sticker.file_size_kb or 0),
            "tags": sticker.tags or "",
            "total_downloads": int(sticker.total_downloads or 0),
            "total_downloads_fmt": format_compact(sticker.total_downloads or 0),
            "status": sticker.status or "active",
            "created_at": sticker.created_at.strftime("%d/%m/%Y") if sticker.created_at else "",
            "updated_at": sticker.updated_at.strftime("%d/%m/%Y") if sticker.updated_at else "",
        }

    @classmethod
    def get_category_counts(cls, db: Session) -> Dict[str, int]:
        """Đếm số lượng sticker theo từng chủ đề danh mục"""
        total = int(db.query(func.count(Sticker.id)).scalar() or 0)

        # Lấy số lượng sticker theo category slug
        rows = (
            db.query(Category.slug, func.count(Sticker.id))
            .join(StickerPack, StickerPack.category_id == Category.id)
            .join(Sticker, Sticker.pack_id == StickerPack.id)
            .group_by(Category.slug)
            .all()
        )

        counts = {"all": total}
        for slug, cnt in rows:
            counts[slug] = int(cnt)

        return counts

    @classmethod
    def get_stickers(
        cls,
        db: Session,
        category: Optional[str] = None,
        pack_id: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 12,
    ) -> Dict[str, Any]:
        """Lấy danh sách sticker có bộ lọc danh mục, bộ sưu tập, tìm kiếm và phân trang"""
        query = (
            db.query(Sticker)
            .join(StickerPack, Sticker.pack_id == StickerPack.id)
            .join(Category, StickerPack.category_id == Category.id, isouter=True)
        )

        # 1. Lọc theo danh mục (category_id hoặc slug)
        if category and category != "all":
            if category.isdigit():
                query = query.filter(Category.id == int(category))
            else:
                query = query.filter(Category.slug == category)

        # 2. Lọc theo bộ sưu tập (pack_id hoặc slug)
        if pack_id and pack_id != "all":
            if pack_id.isdigit():
                query = query.filter(Sticker.pack_id == int(pack_id))
            else:
                query = query.filter(StickerPack.slug == pack_id)

        # 3. Tìm kiếm theo tên sticker, tên file, hoặc tags
        if search:
            s = f"%{search.strip().lower()}%"
            query = query.filter(
                or_(
                    func.lower(Sticker.title).like(s),
                    func.lower(Sticker.file_name).like(s),
                    func.lower(Sticker.tags).like(s),
                    func.lower(StickerPack.title).like(s),
                )
            )

        total_records = query.count()
        pages = max(1, (total_records + limit - 1) // limit) if limit > 0 else 1
        page = max(1, min(page, pages))

        stickers_orm = (
            query.order_by(desc(Sticker.id))
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )

        stickers_data = [cls.serialize_sticker(s) for s in stickers_orm]
        cat_counts = cls.get_category_counts(db)

        return {
            "stickers": stickers_data,
            "total": total_records,
            "page": page,
            "pages": pages,
            "limit": limit,
            "cat_counts": cat_counts,
        }

    @classmethod
    def get_sticker_by_id(cls, db: Session, sticker_id: int) -> Optional[Dict[str, Any]]:
        """Lấy thông tin chi tiết một sticker"""
        sticker = db.query(Sticker).filter_by(id=sticker_id).first()
        if not sticker:
            return None
        return cls.serialize_sticker(sticker)

    @classmethod
    def create_sticker(cls, db: Session, data: Dict[str, Any]) -> Dict[str, Any]:
        """Tải lên hoặc thêm mới một sticker vào bộ sưu tập"""
        pack_id = data.get("pack_id")
        if not pack_id:
            raise ValueError("Vui lòng chọn bộ sưu tập chứa sticker!")

        # Tìm bộ sưu tập
        if str(pack_id).isdigit():
            pack = db.query(StickerPack).filter_by(id=int(pack_id)).first()
        else:
            pack = db.query(StickerPack).filter_by(slug=str(pack_id)).first()

        if not pack:
            raise ValueError("Bộ sưu tập chỉ định không tồn tại!")

        title = (data.get("title") or "").strip()
        if not title:
            raise ValueError("Tiêu đề sticker không được để trống!")

        file_name = (data.get("file_name") or "").strip()
        file_path = (data.get("file_path") or "").strip()

        # Nếu không có file_path, gán ảnh mẫu vector có sẵn
        if not file_path:
            file_name = file_name or f"sticker_{int(datetime.utcnow().timestamp())}.svg"
            file_path = f"../../assets/stickers/cat_01.svg"
        elif not file_name:
            file_name = os.path.basename(file_path)

        fmt = (data.get("format") or "svg").lower()
        dimensions = data.get("dimensions") or "512x512"
        file_size_kb = int(data.get("file_size_kb") or 15)
        tags = (data.get("tags") or "").strip()

        # Số thứ tự sort_order
        max_sort = (
            db.query(func.max(Sticker.sort_order))
            .filter_by(pack_id=pack.id)
            .scalar()
            or 0
        )

        new_sticker = Sticker(
            pack_id=pack.id,
            title=title,
            file_name=file_name,
            file_path=file_path,
            format=fmt,
            dimensions=dimensions,
            file_size_kb=file_size_kb,
            tags=tags,
            total_downloads=0,
            sort_order=max_sort + 1,
            status="active",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        db.add(new_sticker)

        # Cập nhật tổng số lượng sticker của pack
        pack.total_stickers = (pack.total_stickers or 0) + 1
        pack.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(new_sticker)

        return cls.serialize_sticker(new_sticker)

    @classmethod
    def delete_sticker(cls, db: Session, sticker_id: int) -> bool:
        """Xóa vĩnh viễn sticker khỏi kho lưu trữ"""
        sticker = db.query(Sticker).filter_by(id=sticker_id).first()
        if not sticker:
            return False

        pack = sticker.pack
        if pack and pack.total_stickers > 0:
            pack.total_stickers -= 1
            pack.updated_at = datetime.utcnow()

        db.delete(sticker)
        db.commit()
        return True

    @classmethod
    def increment_download(cls, db: Session, sticker_id: int) -> int:
        """Tăng số lượt tải của sticker và bộ sưu tập cha"""
        sticker = db.query(Sticker).filter_by(id=sticker_id).first()
        if not sticker:
            return 0

        sticker.total_downloads = (sticker.total_downloads or 0) + 1
        if sticker.pack:
            sticker.pack.total_downloads = (sticker.pack.total_downloads or 0) + 1

        db.commit()
        return sticker.total_downloads

