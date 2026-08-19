import math
from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required, login_user, logout_user

from helpers import CURRENCY_OPTIONS, DECIMAL_SEPARATOR_OPTIONS, THEME_COLORS, find_user_by_username
from models import User, db, generate_share_token

LOGIN_MAX_ATTEMPTS = 5
LOGIN_LOCKOUT_MINUTES = 15

auth_bp = Blueprint("auth", __name__, url_prefix="/api")


def find_valid_setup_user(token):
    user = User.query.filter_by(setup_token=token).first()
    if user is None:
        return None
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if user.setup_token_expires_at is None or user.setup_token_expires_at < now:
        return None
    return user


@auth_bp.route("/account", methods=["PUT"])
@login_required
def update_account():
    data = request.get_json()

    new_username = data.get("username", current_user.username).strip()
    if not new_username:
        return jsonify({"error": "Username can't be empty"}), 400
    if new_username.lower() != current_user.username.lower() and find_user_by_username(new_username):
        return jsonify({"error": "Username already taken"}), 409

    currency = data.get("currency", current_user.currency)
    if currency not in CURRENCY_OPTIONS:
        return jsonify({"error": "Invalid currency"}), 400

    decimal_separator = data.get("decimal_separator", current_user.decimal_separator)
    if decimal_separator not in DECIMAL_SEPARATOR_OPTIONS:
        return jsonify({"error": "Invalid decimal separator"}), 400

    theme_color = data.get("theme_color", current_user.theme_color)
    if theme_color is not None and theme_color not in THEME_COLORS:
        return jsonify({"error": "Invalid theme color"}), 400

    current_user.username = new_username
    current_user.list_name = data.get("list_name", current_user.list_name)
    current_user.currency = currency
    current_user.decimal_separator = decimal_separator
    current_user.theme_color = theme_color
    current_user.show_image_placeholder = data.get(
        "show_image_placeholder", current_user.show_image_placeholder
    )
    current_user.show_background_pattern = data.get(
        "show_background_pattern", current_user.show_background_pattern
    )
    current_user.show_in_directory = data.get("show_in_directory", current_user.show_in_directory)
    current_user.guest_sort_by_price_enabled = data.get(
        "guest_sort_by_price_enabled", current_user.guest_sort_by_price_enabled
    )
    current_user.guest_filter_by_label_enabled = data.get(
        "guest_filter_by_label_enabled", current_user.guest_filter_by_label_enabled
    )
    current_user.guest_filter_by_brand_enabled = data.get(
        "guest_filter_by_brand_enabled", current_user.guest_filter_by_brand_enabled
    )
    current_user.claim_management_enabled = data.get(
        "claim_management_enabled", current_user.claim_management_enabled
    )
    current_user.lock_icon_claimed_only = data.get(
        "lock_icon_claimed_only", current_user.lock_icon_claimed_only
    )
    db.session.commit()
    return jsonify(current_user.to_dict())


@auth_bp.route("/account/setup/<token>")
def get_account_setup(token):
    user = find_valid_setup_user(token)
    if user is None:
        return jsonify({"error": "This setup link is invalid or has expired"}), 404
    return jsonify({"username": user.username})


@auth_bp.route("/account/setup/<token>", methods=["POST"])
def complete_account_setup(token):
    user = find_valid_setup_user(token)
    if user is None:
        return jsonify({"error": "This setup link is invalid or has expired"}), 404

    data = request.get_json()

    new_username = data.get("new_username", user.username).strip()
    if not new_username:
        return jsonify({"error": "Username can't be empty"}), 400
    if new_username.lower() != user.username.lower() and find_user_by_username(new_username):
        return jsonify({"error": "Username already taken"}), 409

    new_password = data.get("new_password", "")
    if len(new_password) < 8:
        return jsonify({"error": "New password must be at least 8 characters"}), 400

    user.username = new_username
    user.set_password(new_password)
    user.must_change_password = False
    user.allow_passwordless_setup = False
    user.setup_token = None
    user.setup_token_expires_at = None
    db.session.commit()
    # possession of the (now consumed) setup token is the proof of identity
    login_user(user)
    return jsonify(user.to_dict())


@auth_bp.route("/account/first-login", methods=["PUT"])
@login_required
def first_login_setup():
    # only reachable for an account the admin explicitly opted into the passwordless
    # flow (see allow_passwordless_setup) -- @login_required already proved they got in
    # via that flow, which is proof enough of identity without asking for a password here
    if not current_user.must_change_password or not current_user.allow_passwordless_setup:
        return jsonify({"error": "Nothing to do"}), 400

    data = request.get_json()

    new_username = data.get("new_username", current_user.username).strip()
    if not new_username:
        return jsonify({"error": "Username can't be empty"}), 400
    if new_username.lower() != current_user.username.lower() and find_user_by_username(new_username):
        return jsonify({"error": "Username already taken"}), 409

    new_password = data.get("new_password", "")
    if len(new_password) < 8:
        return jsonify({"error": "New password must be at least 8 characters"}), 400

    current_user.username = new_username
    current_user.set_password(new_password)
    current_user.must_change_password = False
    current_user.allow_passwordless_setup = False
    db.session.commit()
    return jsonify(current_user.to_dict())


@auth_bp.route("/account/password", methods=["PUT"])
@login_required
def update_password():
    # already logged in, so that's proof enough of identity; no need to also ask
    # for the current password before replacing it
    data = request.get_json()
    new_password = data.get("new_password", "")
    if len(new_password) < 8:
        return jsonify({"error": "New password must be at least 8 characters"}), 400
    current_user.set_password(new_password)
    db.session.commit()
    return "", 204


@auth_bp.route("/account/share-token", methods=["POST"])
@login_required
def regenerate_share_token():
    current_user.share_token = generate_share_token()
    db.session.commit()
    return jsonify(current_user.to_dict())


@auth_bp.route("/login/lookup", methods=["POST"])
def login_lookup():
    # lets the login form ask for a username first, then show the right next
    # step: a password field, or straight to account setup if none is set yet
    data = request.get_json()
    user = find_user_by_username(data.get("username"))
    if user is None:
        return jsonify({"error": "User not found"}), 404
    needs_setup = user.password_hash is None or user.must_change_password
    return jsonify(
        {
            "needs_password_setup": needs_setup,
            # only true when an admin explicitly opted this account into skipping the
            # setup link -- lets the login form fall back to the old auto-login flow
            "passwordless_allowed": needs_setup and user.allow_passwordless_setup,
        }
    )


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    user = find_user_by_username(data.get("username"))
    if user is None:
        return jsonify({"error": "Invalid username or password"}), 401

    now = datetime.now(timezone.utc).replace(tzinfo=None)  # naive UTC, matching the DateTime column
    if user.locked_until is not None:
        if user.locked_until > now:
            minutes_left = math.ceil((user.locked_until - now).total_seconds() / 60)
            return jsonify({"error": f"Too many failed attempts. Try again in {minutes_left} minute(s)."}), 429
        # lock has expired -- clear it so a good password below can succeed
        user.locked_until = None
        user.failed_login_attempts = 0

    needs_setup = user.password_hash is None or user.must_change_password
    # skips password verification only when an admin explicitly opted this account into
    # that (allow_passwordless_setup) -- otherwise a pending account simply can't log in
    # via password at all and must use its one-time setup link instead
    passwordless_ok = needs_setup and user.allow_passwordless_setup
    if not passwordless_ok and not user.check_password(data.get("password", "")):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= LOGIN_MAX_ATTEMPTS:
            user.locked_until = now + timedelta(minutes=LOGIN_LOCKOUT_MINUTES)
            user.failed_login_attempts = 0
        db.session.commit()
        return jsonify({"error": "Invalid username or password"}), 401

    user.failed_login_attempts = 0
    user.locked_until = None
    db.session.commit()
    login_user(user)
    return jsonify(user.to_dict())


@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return "", 204


@auth_bp.route("/me")
def me():
    if not current_user.is_authenticated:
        return jsonify({"error": "Not logged in"}), 401
    return jsonify(current_user.to_dict())
