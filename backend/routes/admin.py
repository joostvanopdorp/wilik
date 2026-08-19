from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from helpers import (
    COLOR_SCHEME_OPTIONS,
    CURRENCY_OPTIONS,
    DECIMAL_SEPARATOR_OPTIONS,
    THEME_COLORS,
    find_user_by_username,
    issue_setup_token,
)
from models import AppSettings, User, db

admin_bp = Blueprint("admin", __name__, url_prefix="/api")


@admin_bp.route("/settings")
def get_settings():
    settings = AppSettings.query.get(1)
    return jsonify(settings.to_dict())


@admin_bp.route("/settings", methods=["PUT"])
@login_required
def update_settings():
    if not current_user.is_admin:
        return jsonify({"error": "Admin only"}), 403
    settings = AppSettings.query.get(1)
    data = request.get_json()
    if "app_name" in data:
        app_name = data.get("app_name", "").strip()
        if not app_name:
            return jsonify({"error": "App name can't be empty"}), 400
        settings.app_name = app_name
    if "public_directory_enabled" in data:
        settings.public_directory_enabled = bool(data["public_directory_enabled"])
    if "default_color_scheme" in data:
        if data["default_color_scheme"] not in COLOR_SCHEME_OPTIONS:
            return jsonify({"error": "Invalid color scheme"}), 400
        settings.default_color_scheme = data["default_color_scheme"]
    if "claim_management_site_enabled" in data:
        settings.claim_management_site_enabled = bool(data["claim_management_site_enabled"])
    if "claim_delete_warning_skipped" in data:
        settings.claim_delete_warning_skipped = bool(data["claim_delete_warning_skipped"])
    db.session.commit()
    return jsonify(settings.to_dict())


@admin_bp.route("/users")
@login_required
def get_users():
    if not current_user.is_admin:
        return jsonify({"error": "Admin only"}), 403
    return jsonify([user.to_dict() for user in User.query.all()])


@admin_bp.route("/users", methods=["POST"])
@login_required
def create_user():
    if not current_user.is_admin:
        return jsonify({"error": "Admin only"}), 403
    data = request.get_json()
    if find_user_by_username(data.get("username")):
        return jsonify({"error": "Username already taken"}), 409
    # no password yet: normally they can't log in at all until they use the one-time setup
    # link below -- unless the admin explicitly opts this account into the old, weaker
    # "just know the username" flow via passwordless
    passwordless = bool(data.get("passwordless", False))
    user = User(
        username=data["username"],
        is_admin=data.get("is_admin", False),
        must_change_password=True,
        allow_passwordless_setup=passwordless,
    )
    token = None if passwordless else issue_setup_token(user)
    db.session.add(user)
    db.session.commit()
    response = user.to_dict()
    if token:
        response["setup_token"] = token
    return jsonify(response), 201


@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@login_required
def delete_user(user_id):
    if not current_user.is_admin:
        return jsonify({"error": "Admin only"}), 403
    if user_id == current_user.id:
        return jsonify({"error": "You can't delete your own account"}), 400
    user = db.get_or_404(User, user_id)
    db.session.delete(user)
    db.session.commit()
    return "", 204


@admin_bp.route("/users/<int:user_id>/reset-password", methods=["POST"])
@login_required
def reset_password(user_id):
    if not current_user.is_admin:
        return jsonify({"error": "Admin only"}), 403
    if user_id == current_user.id:
        return jsonify({"error": "Use account settings to change your own password"}), 400
    user = db.get_or_404(User, user_id)
    data = request.get_json(silent=True) or {}
    passwordless = bool(data.get("passwordless", False))
    user.password_hash = None
    user.must_change_password = True
    user.allow_passwordless_setup = passwordless
    if passwordless:
        user.setup_token = None
        user.setup_token_expires_at = None
        token = None
    else:
        token = issue_setup_token(user)
    db.session.commit()
    response = user.to_dict()
    if token:
        response["setup_token"] = token
    return jsonify(response)


@admin_bp.route("/users/<int:user_id>", methods=["PUT"])
@login_required
def update_user(user_id):
    if not current_user.is_admin:
        return jsonify({"error": "Admin only"}), 403
    user = db.get_or_404(User, user_id)
    data = request.get_json()

    new_username = data.get("username", user.username).strip()
    if not new_username:
        return jsonify({"error": "Username can't be empty"}), 400
    if new_username.lower() != user.username.lower() and find_user_by_username(new_username):
        return jsonify({"error": "Username already taken"}), 409

    new_list_name = data.get("list_name", user.list_name).strip()
    if not new_list_name:
        return jsonify({"error": "Wishlist name can't be empty"}), 400

    theme_color = data.get("theme_color", user.theme_color)
    if theme_color is not None and theme_color not in THEME_COLORS:
        return jsonify({"error": "Invalid theme color"}), 400

    currency = data.get("currency", user.currency)
    if currency not in CURRENCY_OPTIONS:
        return jsonify({"error": "Invalid currency"}), 400

    decimal_separator = data.get("decimal_separator", user.decimal_separator)
    if decimal_separator not in DECIMAL_SEPARATOR_OPTIONS:
        return jsonify({"error": "Invalid decimal separator"}), 400

    user.username = new_username
    user.list_name = new_list_name
    user.show_in_directory = data.get("show_in_directory", user.show_in_directory)
    user.theme_color = theme_color
    user.currency = currency
    user.decimal_separator = decimal_separator
    user.show_image_placeholder = data.get("show_image_placeholder", user.show_image_placeholder)
    user.show_background_pattern = data.get("show_background_pattern", user.show_background_pattern)
    user.guest_sort_by_price_enabled = data.get(
        "guest_sort_by_price_enabled", user.guest_sort_by_price_enabled
    )
    user.guest_filter_by_label_enabled = data.get(
        "guest_filter_by_label_enabled", user.guest_filter_by_label_enabled
    )
    user.guest_filter_by_brand_enabled = data.get(
        "guest_filter_by_brand_enabled", user.guest_filter_by_brand_enabled
    )
    user.claim_management_enabled = data.get("claim_management_enabled", user.claim_management_enabled)
    user.lock_icon_claimed_only = data.get("lock_icon_claimed_only", user.lock_icon_claimed_only)
    db.session.commit()
    return jsonify(user.to_dict())
