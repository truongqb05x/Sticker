"""
Model: Tag & pack_tags Association Table
Quản lý từ khóa và quan hệ Nhiều-Nhiều với bộ sưu tập
"""

from typing import List, TYPE_CHECKING
from sqlalchemy import Table, Column, BigInteger, Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .config import Base

if TYPE_CHECKING:
    from .sticker_pack import StickerPack


# Bảng trung gian Many-to-Many giữa sticker_packs và tags
pack_tags = Table(
    "pack_tags",
    Base.metadata,
    Column("pack_id", BigInteger, ForeignKey("sticker_packs.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", BigInteger, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
)


class Tag(Base):
    """
    Bảng: tags
    Mục đích: Quản lý từ khóa tìm kiếm và gợi ý tìm kiếm realtime trên header
    """
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(60), unique=True, nullable=False, index=True)
    usage_count: Mapped[int] = mapped_column(Integer, default=0, index=True, nullable=False)

    # Quan hệ Nhiều-Nhiều với các bộ sưu tập
    sticker_packs: Mapped[List["StickerPack"]] = relationship(
        "StickerPack",
        secondary=pack_tags,
        back_populates="tags",
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Tag id={self.id} name='{self.name}'>"
