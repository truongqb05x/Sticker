"""
Database Package Initialization
Tập trung toàn bộ Model, Engine, Session và hàm khởi tạo cơ sở dữ liệu
"""

from .config import Base, engine, SessionLocal, get_db
from .user import User
from .category import Category
from .sticker_pack import StickerPack
from .sticker import Sticker
from .tag import Tag, pack_tags
from .hero_banner import HeroBanner
from .download_log import DownloadLog
from .favorite import Favorite
from .daily_stat import DailyStat
from .migrator import auto_migrate


def init_db(seed: bool = True, auto_sync: bool = True) -> None:
    """
    Khởi tạo và đồng bộ toàn bộ cơ sở dữ liệu:
    1. Tạo mới các bảng chưa tồn tại.
    2. Tự động thêm cột mới hoặc xóa cột thừa nếu Model có thay đổi (auto_sync=True).
    3. Tự động nạp dữ liệu banner mẫu nếu bảng trống (seed=True).
    """
    # 1. Tạo tất cả các bảng
    Base.metadata.create_all(bind=engine)
    
    # 2. Tự động đồng bộ các cột nếu có thay đổi trong Model
    if auto_sync:
        auto_migrate(engine, Base, drop_columns=True)
    
    if not seed:
        return

    # 2. Khởi tạo dữ liệu mẫu nếu chưa có
    with get_db() as db:
        # Tạo Banner mặc định nếu bảng hero_banners trống
        if db.query(HeroBanner).count() == 0:
            default_banners = [
                HeroBanner(title="Khám phá thế giới Sticker", subtitle="Hàng ngàn bộ sticker đẹp, độc đáo, miễn phí!", image_url="../assets/hero_banner.jpg", sort_order=0),
                HeroBanner(title="Sticker Mèo Cưng Siêu Kawaii", subtitle="Bộ sưu tập mèo con cute với biểu cảm độc lạ!", image_url="../assets/pack_cats.jpg", sort_order=1),
                HeroBanner(title="Manga Chibi Hải Tặc One Piece", subtitle="Luffy, Zoro, Sanji tái xuất cực vui nhộn!", image_url="../assets/pack_onepiece.svg", sort_order=2),
                HeroBanner(title="Sticker Trà Sữa & Đồ Ăn Vặt", subtitle="Ngập tràn vị ngọt ngào cho khung chat của bạn!", image_url="../assets/pack_food.svg", sort_order=3),
            ]
            db.add_all(default_banners)
            print("[INFO] Da khoi tao 4 banner trang chu chuan.")


__all__ = [
    "Base",
    "engine",
    "SessionLocal",
    "get_db",
    "init_db",
    "auto_migrate",
    "User",
    "Category",
    "StickerPack",
    "Sticker",
    "Tag",
    "pack_tags",
    "HeroBanner",
    "DownloadLog",
    "Favorite",
    "DailyStat",
]
