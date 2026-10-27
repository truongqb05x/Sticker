"""
Model: User
Bảng lưu trữ tài khoản quản trị viên (Admin Login)
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from werkzeug.security import generate_password_hash, check_password_hash
from .config import Base


class User(Base):
    """
    Bảng: users
    Mục đích: Xác thực đăng nhập quản trị viên (templates/admin/login.html)
    """
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def set_password(self, password: str) -> None:
        """Băm và lưu mật khẩu an toàn"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Kiểm tra mật khẩu nhập vào có khớp với mật khẩu băm"""
        return check_password_hash(self.password_hash, password)

    def __repr__(self) -> str:
        return f"<User id={self.id} username='{self.username}'>"
