from flask import Blueprint, render_template


pages_bp = Blueprint("pages", __name__)


@pages_bp.route("/", methods=["GET"])
def index():
    return render_template("index.html")

@pages_bp.route("/login_dash", methods=["GET"])
def login_dash():
    return render_template("login_dash.html")