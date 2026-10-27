"""
Model: HeroBanner
Bảng lưu trữ các slide banner quảng bá trên trang chủ
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from .config import Base


class HeroBanner(Base):
    """
    Bảng: hero_banners
    Mục đích: Quản lý banner slider xoay tự động 6 giây trên templates/index.html
    """
    __tablename__ = "hero_banners"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    subtitle: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    image_url: Mapped[str] = mapped_column(String(255), nullable=False)
    target_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<HeroBanner id={self.id} title='{self.title}' sort_order={self.sort_order}>"
