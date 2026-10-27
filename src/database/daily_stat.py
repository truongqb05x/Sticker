"""
Model: DailyStat
Bảng tổng hợp chỉ số KPI thống kê theo ngày (Cache Analytics)
"""

from datetime import date
from typing import Optional
from sqlalchemy import BigInteger, Integer, Date
from sqlalchemy.orm import Mapped, mapped_column
from .config import Base


class DailyStat(Base):
    """
    Bảng: daily_stats
    Mục đích: Vẽ biểu đồ xu hướng tải và lưu lượng truy cập trên admin/thongke.html
    """
    __tablename__ = "daily_stats"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    stat_date: Mapped[date] = mapped_column(Date, unique=True, index=True, nullable=False)
    total_downloads: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_page_views: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    new_packs_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    new_stickers_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    top_pack_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)

    def __repr__(self) -> str:
        return f"<DailyStat date={self.stat_date} downloads={self.total_downloads}>"
