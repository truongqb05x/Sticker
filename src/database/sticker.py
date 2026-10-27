"""
Model: Sticker
Bảng lưu trữ từng sticker đơn lẻ trong kho
"""

from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import BigInteger, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .config import Base

if TYPE_CHECKING:
    from .sticker_pack import StickerPack


class Sticker(Base):
    """
    Bảng: stickers
    Mục đích: Quản lý kho sticker đơn lẻ (templates/admin/khosticker.html, preview lightbox)
    """
    __tablename__ = "stickers"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    pack_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("sticker_packs.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    file_name: Mapped[str] = mapped_column(String(100), nullable=False)
    file_path: Mapped[str] = mapped_column(String(255), nullable=False)
    format: Mapped[str] = mapped_column(String(10), default="svg", nullable=False)
    dimensions: Mapped[str] = mapped_column(String(20), default="512x512", nullable=False)
    file_size_kb: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    tags: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    total_downloads: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Quan hệ với Bộ sưu tập cha
    pack: Mapped["StickerPack"] = relationship("StickerPack", back_populates="stickers")

    def __repr__(self) -> str:
        return f"<Sticker id={self.id} title='{self.title}' format='{self.format}'>"
