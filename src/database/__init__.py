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
    3. Tự động nạp tài khoản admin và danh mục chuẩn nếu bảng trống (seed=True).
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
        # 2.1. Tạo tài khoản admin mặc định nếu bảng users trống
        admin_user = db.query(User).filter_by(username="admin").first()
        if not admin_user:
            default_admin = User(username="admin")
            default_admin.set_password("admin123")
            db.add(default_admin)
            print("[INFO] Da tao tai khoan quan tri mac dinh: username='admin', password='admin123'")

        # 2.2. Tạo 8 danh mục chuẩn nếu bảng categories trống
        if db.query(Category).count() == 0:
            default_categories = [
                Category(name="Động vật", slug="animals", icon_name="paw-print", badge_bg_class="badge-bg-1", description="Chó mèo dễ thương, thú cưng hài hước", sort_order=1),
                Category(name="Anime & Manga", slug="anime", icon_name="sparkles", badge_bg_class="badge-bg-2", description="Nhân vật anime, manga nổi tiếng", sort_order=2),
                Category(name="Chibi", slug="chibi", icon_name="smile", badge_bg_class="badge-bg-3", description="Nét vẽ tròn trĩnh, đáng yêu", sort_order=3),
                Category(name="Phong cảnh", slug="nature", icon_name="mountain", badge_bg_class="badge-bg-4", description="Núi non, thiên nhiên tươi đẹp", sort_order=4),
                Category(name="Tình yêu", slug="love", icon_name="heart", badge_bg_class="badge-bg-5", description="Lãng mạn, trái tim, đôi lứa", sort_order=5),
                Category(name="Hoạt hình", slug="animation", icon_name="film", badge_bg_class="badge-bg-6", description="Phim hoạt hình vui nhộn", sort_order=6),
                Category(name="Biểu cảm", slug="expressions", icon_name="laugh", badge_bg_class="badge-bg-7", description="Cảm xúc vui, buồn, ngầu, dỗi hờn", sort_order=7),
                Category(name="Lễ hội & Khác", slug="others", icon_name="gift", badge_bg_class="badge-bg-8", description="Halloween, Giáng sinh, Tết, chủ đề hỗn hợp", sort_order=8),
            ]
            db.add_all(default_categories)
            print("[INFO] Da khoi tao 8 danh muc chu de chuan.")

        # 2.3. Tạo Banner mặc định nếu bảng hero_banners trống
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
