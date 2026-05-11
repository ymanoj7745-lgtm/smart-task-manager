from flask import Blueprint, request, jsonify, render_template, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from models import db, User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    if current_user.is_authenticated:
        return redirect(url_for("tasks.dashboard"))

    if request.method == "POST":
        # Support both JSON (API) and form submissions
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form

        username = data.get("username", "").strip()
        email = data.get("email", "").strip()
        password = data.get("password", "")

        # Validation
        if not username or not email or not password:
            error = "All fields are required."
            if request.is_json:
                return jsonify({"success": False, "message": error}), 400
            flash(error, "error")
            return render_template("register.html")

        if User.query.filter_by(username=username).first():
            error = "Username already exists."
            if request.is_json:
                return jsonify({"success": False, "message": error}), 409
            flash(error, "error")
            return render_template("register.html")

        if User.query.filter_by(email=email).first():
            error = "Email already registered."
            if request.is_json:
                return jsonify({"success": False, "message": error}), 409
            flash(error, "error")
            return render_template("register.html")

        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        if request.is_json:
            return jsonify({"success": True, "message": "User registered successfully.", "user": user.to_dict()}), 201

        flash("Registration successful! Please log in.", "success")
        return redirect(url_for("auth.login"))

    return render_template("register.html")


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("tasks.dashboard"))

    if request.method == "POST":
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form

        username = data.get("username", "").strip()
        password = data.get("password", "")

        user = User.query.filter_by(username=username).first()

        if user and user.check_password(password):
            login_user(user)
            if request.is_json:
                return jsonify({"success": True, "message": "Login successful.", "user": user.to_dict()})
            return redirect(url_for("tasks.dashboard"))

        error = "Invalid username or password."
        if request.is_json:
            return jsonify({"success": False, "message": error}), 401
        flash(error, "error")

    return render_template("login.html")


@auth_bp.route("/logout")
@login_required
def logout():
    logout_user()
    flash("You have been logged out.", "info")
    return redirect(url_for("auth.login"))
