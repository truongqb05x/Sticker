"""
Model: StickerPack
Bảng lưu trữ các bộ sưu tập sticker
"""

from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from decimal import Decimal
from sqlalchemy import BigInteger, Integer, String, Text, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .config import Base
from .tag import pack_tags

if TYPE_CHECKING:
    from .category import Category
    from .sticker import Sticker
    from .tag import Tag
    from .favorite import Favorite


class StickerPack(Base):
    """
    Bảng: sticker_packs
    Mục đích: Quản lý bộ sưu tập sticker (templates/admin/bosuutap.html, user/sticker_chitiet.html)
    """
    __tablename__ = "sticker_packs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    category_id: Mapped[int] = mapped_column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True)
    code: Mapped[Optional[str]] = mapped_column(String(30), unique=True, nullable=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(150), unique=True, nullable=False, index=True)
    author_name: Mapped[str] = mapped_column(String(100), default="StickerHub Team", nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cover_image: Mapped[str] = mapped_column(String(255), nullable=False)
    zip_file_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    total_stickers: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    file_size_mb: Mapped[Decimal] = mapped_column(Numeric(6, 2), default=Decimal("0.00"), nullable=False)
    total_downloads: Mapped[int] = mapped_column(BigInteger, default=0, index=True, nullable=False)
    total_favorites: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_views: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    
    rating_avg: Mapped[Decimal] = mapped_column(Numeric(3, 2), default=Decimal("5.00"), nullable=False)
    rating_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    is_featured: Mapped[int] = mapped_column(Integer, default=0, index=True, nullable=False)
    featured_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", index=True, nullable=False)
    
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Quan hệ với Danh mục cha
    category: Mapped["Category"] = relationship("Category", back_populates="sticker_packs")

    # Quan hệ 1-N với danh sách sticker con
    stickers: Mapped[List["Sticker"]] = relationship(
        "Sticker",
        back_populates="pack",
        cascade="all, delete-orphan",
        order_by="Sticker.sort_order"
    )

    # Quan hệ N-N với Tags từ khóa tìm kiếm
    tags: Mapped[List["Tag"]] = relationship(
        "Tag",
        secondary=pack_tags,
        back_populates="sticker_packs"
    )

    # Quan hệ 1-N với lượt yêu thích
    favorites: Mapped[List["Favorite"]] = relationship(
        "Favorite",
        back_populates="pack",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<StickerPack id={self.id} title='{self.title}' slug='{self.slug}'>"
