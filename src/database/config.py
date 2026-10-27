"""
Database Configuration Module
Cấu hình kết nối CSDL, khởi tạo Engine, Session Factory và Base Model
"""

import os
import urllib.parse
from contextlib import contextmanager
from datetime import datetime
from typing import Generator
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

# Nạp biến môi trường từ file .env
load_dotenv()

# Thông số kết nối CSDL MySQL
DB_HOST = os.getenv("DB_HOST", "103.82.24.7")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "mmddllg_huehub")
DB_PASSWORD = os.getenv("DB_PASSWORD", "Ngoctruong123@")
DB_NAME = os.getenv("DB_NAME", "mmddllg_sticker")
DB_CHARSET = os.getenv("DB_CHARSET", "utf8mb4")

# Mã hóa mật khẩu an toàn (xử lý ký tự đặc biệt @, #, %)
encoded_password = urllib.parse.quote_plus(DB_PASSWORD)

# Tạo chuỗi kết nối MySQL chuẩn
DEFAULT_MYSQL_URL = f"mysql+pymysql://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset={DB_CHARSET}"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_MYSQL_URL)

# Cấu hình engine tối ưu cho Remote MySQL
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_recycle=3600,
        pool_pre_ping=True,  # Tự động kiểm tra và kết nối lại khi rớt mạng
        connect_args={"connect_timeout": 15},
        echo=False
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


class Base(DeclarativeBase):
    """Lớp nền tảng cho tất cả các Model bảng dữ liệu"""
    
    def to_dict(self) -> dict:
        """Chuyển đổi thực thể Model sang dictionary JSON-friendly"""
        result = {}
        for column in self.__table__.columns:
            val = getattr(self, column.name)
            if isinstance(val, datetime):
                result[column.name] = val.isoformat()
            else:
                result[column.name] = val
        return result


@contextmanager
def get_db() -> Generator[Session, None, None]:
    """Context manager để lấy database session an toàn"""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
