"""
Database Auto-Migrator
Tự động đồng bộ cấu trúc bảng: thêm cột mới hoặc xóa cột thừa khi có thay đổi trong Model
"""

from typing import List, Dict, Any
from sqlalchemy import inspect, text, Engine
from sqlalchemy.orm import DeclarativeBase


def auto_migrate(engine: Engine, base_cls: type[DeclarativeBase], drop_columns: bool = True) -> None:
    """
    Tự động kiểm tra và đồng bộ cấu trúc cơ sở dữ liệu với các Model SQLAlchemy:
    1. Tạo mới bảng nếu chưa có trong DB.
    2. Tự động THÊM CỘT mới (ALTER TABLE ADD COLUMN) nếu Model có thêm trường mới.
    3. Tự động XÓA CỘT cũ (ALTER TABLE DROP COLUMN) nếu Model đã xóa trường (khi drop_columns=True).
    """
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    with engine.connect() as conn:
        for table_name, table in base_cls.metadata.tables.items():
            # 1. Nếu bảng chưa có trong DB -> Tạo mới bảng
            if table_name not in existing_tables:
                table.create(conn)
                print(f"[MIGRATE] Tao moi bang '{table_name}' thanh cong.")
                continue

            # 2. Lấy danh sách các cột hiện có trong DB
            db_columns: Dict[str, Dict[str, Any]] = {
                col["name"]: col for col in inspector.get_columns(table_name)
            }
            # Lấy danh sách các cột được khai báo trong Model
            model_columns = {col.name: col for col in table.columns}

            # 3. KIỂM TRA THÊM CỘT MỚI (Model có nhưng DB chưa có)
            for col_name, model_col in model_columns.items():
                if col_name not in db_columns:
                    col_type = model_col.type.compile(engine.dialect)
                    
                    # Cấu hình cú pháp ADD COLUMN
                    sql = f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type}"
                    
                    # Nếu có giá trị mặc định dạng chuỗi/số
                    if model_col.default is not None and model_col.default.is_scalar:
                        default_val = model_col.default.arg
                        if isinstance(default_val, str):
                            sql += f" DEFAULT '{default_val}'"
                        elif isinstance(default_val, (int, float)):
                            sql += f" DEFAULT {default_val}"
                    elif not model_col.nullable:
                        # Với SQLite khi thêm cột NOT NULL cần có DEFAULT tạm thời
                        if "INT" in str(col_type).upper() or "DECIMAL" in str(col_type).upper():
                            sql += " DEFAULT 0"
                        elif "CHAR" in str(col_type).upper() or "TEXT" in str(col_type).upper():
                            sql += " DEFAULT ''"

                    try:
                        conn.execute(text(sql))
                        conn.commit()
                        print(f"[MIGRATE] Da tu dong THEM cot '{col_name}' ({col_type}) vao bang '{table_name}'.")
                    except Exception as err:
                        print(f"[MIGRATE ERROR] Khong the them cot '{col_name}' vao '{table_name}': {err}")

            # 4. KIỂM TRA XÓA CỘT CŨ (DB có nhưng Model đã xóa)
            if drop_columns:
                for db_col_name in db_columns.keys():
                    if db_col_name not in model_columns:
                        # Tránh xóa các trường đặc biệt hoặc khóa chính
                        if db_col_name.lower() in ("id", "rowid"):
                            continue
                        
                        sql = f"ALTER TABLE {table_name} DROP COLUMN {db_col_name}"
                        try:
                            conn.execute(text(sql))
                            conn.commit()
                            print(f"[MIGRATE] Da tu dong XOA cot '{db_col_name}' khoi bang '{table_name}'.")
                        except Exception as err:
                            # Một số hệ CSDL cũ có thể hạn chế DROP COLUMN
                            print(f"[MIGRATE NOTICE] Khong the xoa cot '{db_col_name}' khoi '{table_name}': {err}")
