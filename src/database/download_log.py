"""
Model: DownloadLog
Bảng lưu vết chi tiết từng lượt tải về phục vụ báo cáo phân tích
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import BigInteger, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from .config import Base


class DownloadLog(Base):
    """
    Bảng: download_logs
    Mục đích: Lưu vết lượt tải trọn bộ ZIP và từng ảnh lẻ (templates/admin/thongke.html)
    """
    __tablename__ = "download_logs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    pack_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("sticker_packs.id", ondelete="SET NULL"), nullable=True, index=True)
    sticker_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("stickers.id", ondelete="SET NULL"), nullable=True)
    download_type: Mapped[str] = mapped_column(String(20), default="zip", nullable=False)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    platform: Mapped[Optional[str]] = mapped_column(String(30), default="web", nullable=True)
    downloaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True, nullable=False)

    def __repr__(self) -> str:
        return f"<DownloadLog id={self.id} pack_id={self.pack_id} type='{self.download_type}' at={self.downloaded_at}>"
