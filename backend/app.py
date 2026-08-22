import os
from datetime import timedelta

from flask import Flask, jsonify
from flask_cors import CORS
from flask_login import LoginManager
from flask_migrate import Migrate
from sqlalchemy import event

from helpers import SETUP_TOKEN_VALID_DAYS, issue_setup_token
from models import AppSettings, User, db
from routes import admin_bp, auth_bp, items_bp, public_bp, scrape_bp

app = Flask(__name__)
# signs the session cookie -- override via env in any real deployment
DEFAULT_DEV_SECRET_KEY = "dev-secret-change-me"
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", DEFAULT_DEV_SECRET_KEY)
if app.config["SECRET_KEY"] == DEFAULT_DEV_SECRET_KEY:
    print(
        "WARNING: SECRET_KEY is not set (using the public dev default) -- anyone can forge "
        "login sessions. Set a real SECRET_KEY in .env before exposing this outside your own machine.",
        flush=True,
    )
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///wilik.db"

# not everyone self-hosting this puts it behind HTTPS (LAN-only setups, plain http://,
# reverse proxies without TLS...) -- SESSION_COOKIE_SECURE would silently break login
# for them since browsers refuse to send a Secure cookie back over plain HTTP. Off by
# default to keep that working out of the box; opt in via .env once you're sure every
# request reaches this app over HTTPS.
app.config["SESSION_COOKIE_SECURE"] = os.environ.get("SESSION_COOKIE_SECURE", "false").lower() == "true"
# no legitimate flow here needs the cookie sent cross-site, so this is safe to always enable
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

# keeps users logged in across browser restarts instead of only for the current session
app.config["REMEMBER_COOKIE_DURATION"] = timedelta(days=30)
app.config["REMEMBER_COOKIE_SECURE"] = app.config["SESSION_COOKIE_SECURE"]
app.config["REMEMBER_COOKIE_SAMESITE"] = "Lax"

# allows the React app (different port) to send/receive the session cookie
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

db.init_app(app)
migrate = Migrate(app, db)

login_manager = LoginManager()
login_manager.init_app(app)


@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))


@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({"error": "Login required"}), 401


with app.app_context():
    # WAL mode lets readers and writers work concurrently instead of blocking
    # each other, which matters now that multiple users share this database.
    @event.listens_for(db.engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=5000")
        cursor.close()


app.register_blueprint(auth_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(items_bp)
app.register_blueprint(scrape_bp)
app.register_blueprint(public_bp)


@app.cli.command("bootstrap-db")
def bootstrap_db():
    """Creates the first admin account and the AppSettings row if missing.
    Run after 'flask db upgrade' -- assumes the schema already exists."""
    with app.app_context():
        if User.query.count() == 0:
            admin = User(username="Admin", is_admin=True, must_change_password=True)
            token = issue_setup_token(admin)
            db.session.add(admin)
            db.session.commit()
            print("=" * 50)
            print("Created first admin account: username='Admin'")
            print(f"Finish setting it up at: /setup/{token}")
            print(f"This link expires in {SETUP_TOKEN_VALID_DAYS} days.")
            print("=" * 50)

        if AppSettings.query.count() == 0:
            db.session.add(AppSettings(id=1, app_name="Wilik"))
            db.session.commit()


if __name__ == "__main__":
    app.run(debug=True, port=5000)
