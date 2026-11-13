import secrets
from datetime import datetime, timedelta, timezone

from models import User, db

CURRENCY_OPTIONS = ["€", "$", "£", ""]
DECIMAL_SEPARATOR_OPTIONS = [",", ".", "round"]
THEME_COLORS = ["#5b5fef", "#d4a017", "#d2601a", "#e83b75"]
COLOR_SCHEME_OPTIONS = ["dark", "light", "auto"]
# "system" follows the browser's language; keep in sync with languages in frontend/src/I18nProvider.jsx
LANGUAGE_OPTIONS = ["system", "en", "nl"]

SETUP_TOKEN_VALID_DAYS = 7


def find_user_by_username(username):
    return User.query.filter(db.func.lower(User.username) == (username or "").lower()).first()


def issue_setup_token(user):
    """Gives the user a fresh one-time setup token, replacing any existing one."""
    user.setup_token = secrets.token_urlsafe(32)
    user.setup_token_expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(
        days=SETUP_TOKEN_VALID_DAYS
    )
    return user.setup_token
