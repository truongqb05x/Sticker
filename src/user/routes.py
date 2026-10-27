"""
User Routes Blueprint
Quản lý toàn bộ các tuyến đường (routes) dành cho người dùng công khai (Public Portal)
"""

from flask import Blueprint, render_template

user_bp = Blueprint("user", __name__)


@user_bp.route("/")
def home():
    return render_template("index.html")

@user_bp.route("/collections")
@user_bp.route("/bosuutap")
def collections():
    return render_template("user/bosuutap.html")


@user_bp.route("/top-downloaded")
@user_bp.route("/top-tai-nhieu")
def top_downloaded():
    return render_template("user/toptainhieu.html")


@user_bp.route("/pack/<slug>")
@user_bp.route("/collection/<slug>")
def pack_detail(slug=None):
    return render_template("user/sticker_chitiet.html")


@user_bp.route("/about")
@user_bp.route("/gioi-thieu")
def about():
    return render_template("user/gioithieu.html")


@user_bp.route("/terms")
@user_bp.route("/dieu-khoan-su-dung")
def terms():
    return render_template("user/dieukhoansudung.html")
