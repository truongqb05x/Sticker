"""
Model: Category
Bảng lưu trữ danh mục chủ đề phân loại sticker
"""

from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .config import Base

if TYPE_CHECKING:
    from .sticker_pack import StickerPack


class Category(Base):
    """
    Bảng: categories
    Mục đích: Quản lý danh mục chủ đề (templates/admin/danhmuc.html, menu sidebar)
    """
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    icon_name: Mapped[str] = mapped_column(String(50), default="tag", nullable=False)
    badge_bg_class: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Quan hệ 1-N với các bộ sưu tập thuộc danh mục
    sticker_packs: Mapped[List["StickerPack"]] = relationship(
        "StickerPack",
        back_populates="category",
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Category id={self.id} name='{self.name}' slug='{self.slug}'>"
