"""
Model: Favorite
Bảng lưu trạng thái yêu thích / thả tim của người dùng
"""

from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import BigInteger, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .config import Base

if TYPE_CHECKING:
    from .sticker_pack import StickerPack


class Favorite(Base):
    """
    Bảng: favorites
    Mục đích: Quản lý danh sách thả tim (user/sticker_chitiet.html, tab Yêu thích)
    """
    __tablename__ = "favorites"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    pack_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("sticker_packs.id", ondelete="CASCADE"), nullable=False, index=True)
    session_token: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Quan hệ với Bộ sưu tập được thả tim
    pack: Mapped["StickerPack"] = relationship("StickerPack", back_populates="favorites")

    def __repr__(self) -> str:
        return f"<Favorite id={self.id} pack_id={self.pack_id} session='{self.session_token}'>"
