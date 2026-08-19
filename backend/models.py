import secrets

from flask_login import UserMixin
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash

db = SQLAlchemy()


SHARE_TOKEN_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"


def generate_share_token():
    return "".join(secrets.choice(SHARE_TOKEN_ALPHABET) for _ in range(8))


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=True)  # null = no password set yet, first login sets one
    is_admin = db.Column(db.Boolean, nullable=False, default=False)
    email = db.Column(db.String(255), nullable=True)
    list_name = db.Column(db.String(100), nullable=True)  # null = use the computed default below
    currency = db.Column(db.String(4), nullable=False, default="€")
    decimal_separator = db.Column(db.String(10), nullable=False, default=",")
    theme_color = db.Column(db.String(7), nullable=True)  # hex code, e.g. "#0d9488"; null = default theme
    must_change_password = db.Column(db.Boolean, nullable=False, default=False)
    # one-time credential for /setup/<token>: proves identity in place of a password when
    # the account has none yet (new account) or had its password cleared (admin reset)
    setup_token = db.Column(db.String(64), unique=True, nullable=True)
    setup_token_expires_at = db.Column(db.DateTime, nullable=True)
    # admin's explicit, per-account opt-out of the setup-link flow above: lets this account
    # log in with just its username while must_change_password is set, no token required.
    # Off by default -- only ever turned on by an admin knowingly accepting that trade-off.
    allow_passwordless_setup = db.Column(db.Boolean, nullable=False, default=False)
    show_image_placeholder = db.Column(db.Boolean, nullable=False, default=True)
    show_background_pattern = db.Column(db.Boolean, nullable=False, default=True)
    # per-owner guest sort/filter controls on their public wishlist page, off by default.
    # Sorting by rating isn't one of these: it's the app's baseline order (see sortGifts.js)
    # and always preserves the owner's manual drag order within a star tier, so there's no
    # separate "highest rated" mode to gate -- only the price override needs a toggle.
    guest_sort_by_price_enabled = db.Column(db.Boolean, nullable=False, default=False)
    guest_filter_by_label_enabled = db.Column(db.Boolean, nullable=False, default=False)
    guest_filter_by_brand_enabled = db.Column(db.Boolean, nullable=False, default=False)
    # Per-wishlist opt-in for owner claim management. This lives on User because
    # Wilik currently has a strict one-user-to-one-wishlist data model.
    claim_management_enabled = db.Column(db.Boolean, nullable=False, default=False)
    # when true, the lock icon only shows on already-claimed items -- convenient (see at a
    # glance what's taken) but leaks claim status just by browsing your own list without
    # clicking anything, which is exactly what showing it on every item avoids. Off by
    # default, only meaningful while claim_management_enabled is also on.
    lock_icon_claimed_only = db.Column(db.Boolean, nullable=False, default=False)
    # unguessable token for the public, no-login wishlist link; anyone with it can view + claim items
    share_token = db.Column(db.String(64), unique=True, nullable=False, default=generate_share_token)
    # opt-out of the public directory (see AppSettings.public_directory_enabled) -- the
    # share link still works either way, this only controls the browsable listing
    show_in_directory = db.Column(db.Boolean, nullable=False, default=True)
    # brute-force login lockout (see login() in app.py) -- stored on the row, not in
    # memory, so it holds up across gunicorn's multiple worker processes
    failed_login_attempts = db.Column(db.Integer, nullable=False, default=0)
    locked_until = db.Column(db.DateTime, nullable=True)

    gifts = db.relationship("Gift", backref="owner", cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        if self.password_hash is None:
            return False
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "is_admin": self.is_admin,
            "list_name": self.list_name or f"{self.username}'s wishlist",
            "currency": self.currency,
            "decimal_separator": self.decimal_separator,
            "theme_color": self.theme_color,
            "must_change_password": self.must_change_password,
            "allow_passwordless_setup": self.allow_passwordless_setup,
            "has_password": self.password_hash is not None,
            "show_image_placeholder": self.show_image_placeholder,
            "show_background_pattern": self.show_background_pattern,
            "share_token": self.share_token,
            "show_in_directory": self.show_in_directory,
            "guest_sort_by_price_enabled": self.guest_sort_by_price_enabled,
            "guest_filter_by_label_enabled": self.guest_filter_by_label_enabled,
            "guest_filter_by_brand_enabled": self.guest_filter_by_brand_enabled,
            "claim_management_enabled": self.claim_management_enabled,
            "lock_icon_claimed_only": self.lock_icon_claimed_only,
        }

    def public_dict(self):
        return {
            "list_name": self.list_name or f"{self.username}'s wishlist",
            "currency": self.currency,
            "decimal_separator": self.decimal_separator,
            "theme_color": self.theme_color,
            "show_background_pattern": self.show_background_pattern,
            "guest_sort_by_price_enabled": self.guest_sort_by_price_enabled,
            "guest_filter_by_label_enabled": self.guest_filter_by_label_enabled,
            "guest_filter_by_brand_enabled": self.guest_filter_by_brand_enabled,
        }


class AppSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    app_name = db.Column(db.String(80), nullable=False, default="Wilik")
    # shows a directory of every wishlist on the login page, so visitors can find one without a share link
    public_directory_enabled = db.Column(db.Boolean, nullable=False, default=True)
    # fallback dark/light/auto for anyone who hasn't picked their own in Settings yet (stored
    # per-browser in localStorage, see colorScheme.js) -- "dark" matches the app's historical default
    default_color_scheme = db.Column(db.String(10), nullable=False, default="dark")
    # site-wide kill switch for claim management: even if a user has User.claim_management_enabled
    # set, the feature stays fully inert (backend blocks it, not just hidden in the UI) while this
    # is off -- see routes/items.py's claim_management_active(). Defaults off, matching the
    # per-user opt-in it gates, which also defaults off.
    claim_management_site_enabled = db.Column(db.Boolean, nullable=False, default=False)
    # skips the "this item has been claimed" confirmation (and its one-off name reveal)
    # when deleting a claimed item, going straight to a plain delete confirm instead --
    # off by default since it's the only thing standing between an owner and silently
    # deleting something someone already claimed
    claim_delete_warning_skipped = db.Column(db.Boolean, nullable=False, default=False)

    def to_dict(self):
        return {
            "app_name": self.app_name,
            "public_directory_enabled": self.public_directory_enabled,
            "default_color_scheme": self.default_color_scheme,
            "claim_management_site_enabled": self.claim_management_site_enabled,
            "claim_delete_warning_skipped": self.claim_delete_warning_skipped,
        }


class Gift(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    label = db.Column(db.String(50), nullable=True)
    brand = db.Column(db.String(80), nullable=True)
    options = db.Column(db.String(200), nullable=True)  # e.g. "Eau de parfum, 50ml" / "Small" / "Black or yellow"
    url = db.Column(db.String(500), nullable=True)
    image_url = db.Column(db.String(500), nullable=True)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Float, nullable=True)
    currency = db.Column(db.String(4), nullable=True)  # null = use the owner's account default currency
    rating = db.Column(db.Integer, nullable=True, default=None)
    # null = unlimited/infinite simultaneous claims. No column-level default: a Python-side
    # default fires on INSERT whenever the value is None, which would silently turn an
    # explicit "unlimited" (quantity=None) into quantity=1 on creation. create_item already
    # defaults to 1 itself when the key is absent from the request.
    quantity = db.Column(db.Integer, nullable=True)
    sort_order = db.Column(db.Integer, nullable=True, default=None)
    # owner-controlled "I got this" flag: pulls the item off their own active list into the received archive
    received = db.Column(db.Boolean, nullable=False, default=False)

    # one row per visitor who has claimed a "copy" of this gift. Owner responses only
    # include claim status when that wishlist explicitly enables claim management.
    claims = db.relationship("Claim", backref="gift", cascade="all, delete-orphan", lazy="selectin")

    def to_dict(self, include_claim_status=False):
        data = {
            "id": self.id,
            "title": self.title,
            "label": self.label,
            "brand": self.brand,
            "options": self.options,
            "url": self.url,
            "image_url": self.image_url,
            "description": self.description,
            "price": self.price,
            "currency": self.currency,
            "rating": self.rating,
            "received": self.received,
            "quantity": self.quantity,
            "sort_order": self.sort_order,
        }
        if include_claim_status:
            claimed_count = len(self.claims)
            data["claimed_count"] = claimed_count
            data["fully_claimed"] = self.quantity is not None and claimed_count >= self.quantity
        return data


class Claim(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    gift_id = db.Column(db.Integer, db.ForeignKey("gift.id"), nullable=False)
    # never sent to public visitors. It is returned to an authenticated item owner only
    # after they explicitly reveal it and their wishlist has enabled claim management.
    claimed_by = db.Column(db.String(100), nullable=False)
    # secret handed to the claimer's own browser so they can unclaim silently, without retyping their name
    claim_token = db.Column(db.String(64), nullable=False, unique=True)
    purchased = db.Column(db.Boolean, nullable=False, default=False)
