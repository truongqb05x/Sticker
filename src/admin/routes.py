"""
Admin Routes Blueprint
Quản lý toàn bộ các tuyến đường (routes) dành cho giao diện quản trị (Admin Portal)
"""

from flask import Blueprint, render_template

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


@admin_bp.route("/login")
def login():
    return render_template("admin/login.html")


@admin_bp.route("/")
@admin_bp.route("/dashboard")
def dashboard():
    return render_template("admin/dashboard.html")


@admin_bp.route("/categories")
@admin_bp.route("/danhmuc")
def categories():
    return render_template("admin/danhmuc.html")


@admin_bp.route("/collections")
@admin_bp.route("/bosuutap")
def collections():
    return render_template("admin/bosuutap.html")


@admin_bp.route("/stickers")
@admin_bp.route("/khosticker")
def stickers():
    return render_template("admin/khosticker.html")


@admin_bp.route("/collection-detail")
@admin_bp.route("/chitietsticker")
def collection_detail():
    return render_template("admin/chitietsticker.html")
    
    
@admin_bp.route("/stats")
@admin_bp.route("/thongke")
def stats():
    return render_template("admin/thongke.html")
