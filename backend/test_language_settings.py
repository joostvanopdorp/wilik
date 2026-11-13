import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from flask import Flask, jsonify
from flask_login import LoginManager
from flask_migrate import Migrate, downgrade, upgrade
from sqlalchemy import inspect

from models import AppSettings, User, db
from routes.admin import admin_bp


class LanguageSettingsTestCase(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config.update(
            SECRET_KEY="test-secret",
            SQLALCHEMY_DATABASE_URI="sqlite:///:memory:",
            TESTING=True,
        )
        db.init_app(self.app)
        login_manager = LoginManager(self.app)

        @login_manager.user_loader
        def load_user(user_id):
            return db.session.get(User, int(user_id))

        @login_manager.unauthorized_handler
        def unauthorized():
            return jsonify({"error": "Login required"}), 401

        self.app.register_blueprint(admin_bp)

        with self.app.app_context():
            db.create_all()
            db.session.add(AppSettings(id=1, app_name="Wilik"))
            admin = User(username="admin", is_admin=True)
            member = User(username="member", is_admin=False)
            db.session.add_all([admin, member])
            db.session.commit()
            self.admin_id = admin.id
            self.member_id = member.id

        self.client = self.app.test_client()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def login_as(self, user_id):
        with self.client.session_transaction() as session:
            session["_user_id"] = str(user_id)
            session["_fresh"] = True

    def test_defaults_follow_browser_and_hide_public_button(self):
        data = self.client.get("/api/settings").get_json()
        self.assertEqual(data["default_language"], "system")
        self.assertFalse(data["public_language_button_enabled"])

    def test_admin_can_update_language_settings(self):
        self.login_as(self.admin_id)
        response = self.client.put(
            "/api/settings",
            json={"default_language": "nl", "public_language_button_enabled": True},
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["default_language"], "nl")
        self.assertTrue(data["public_language_button_enabled"])

    def test_rejects_unknown_language(self):
        self.login_as(self.admin_id)
        response = self.client.put("/api/settings", json={"default_language": "fr"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.client.get("/api/settings").get_json()["default_language"], "system")

    def test_non_admin_cannot_update_language_settings(self):
        self.login_as(self.member_id)
        response = self.client.put("/api/settings", json={"default_language": "nl"})
        self.assertEqual(response.status_code, 403)


class LoginLockoutMessageTestCase(unittest.TestCase):
    """The lockout error has a number in it, so it also sends minutes_left for Login.jsx to translate."""

    def setUp(self):
        from datetime import datetime, timedelta, timezone

        from routes.auth import auth_bp

        self.app = Flask(__name__)
        self.app.config.update(
            SECRET_KEY="test-secret",
            SQLALCHEMY_DATABASE_URI="sqlite:///:memory:",
            TESTING=True,
        )
        db.init_app(self.app)
        LoginManager(self.app)
        self.app.register_blueprint(auth_bp)

        with self.app.app_context():
            db.create_all()
            db.session.add(AppSettings(id=1, app_name="Wilik"))
            locked_until = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=4, seconds=30)
            db.session.add(User(username="locked", locked_until=locked_until))
            db.session.commit()

        self.client = self.app.test_client()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_lockout_sends_minutes_left_next_to_english_message(self):
        response = self.client.post("/api/login", json={"username": "locked", "password": "whatever"})
        self.assertEqual(response.status_code, 429)
        data = response.get_json()
        self.assertEqual(data["minutes_left"], 5)
        self.assertEqual(data["error"], "Too many failed attempts. Try again in 5 minute(s).")


class LanguageSettingsMigrationTestCase(unittest.TestCase):
    def test_upgrade_adds_columns_with_defaults_and_downgrade_removes_them(self):
        migrations_directory = str(Path(__file__).parent / "migrations")

        with TemporaryDirectory() as temporary_directory:
            database_path = Path(temporary_directory) / "migration-test.db"
            app = Flask(__name__)
            app.config.update(
                SQLALCHEMY_DATABASE_URI=f"sqlite:///{database_path.as_posix()}",
                TESTING=True,
            )
            db.init_app(app)
            Migrate(app, db, directory=migrations_directory)

            with app.app_context():
                upgrade(directory=migrations_directory, revision="b2c3d4e5f6a7")
                # an existing settings row, so we can check the new columns get backfilled;
                # older NOT NULL columns have no server default, so fill those in explicitly
                existing_columns = inspect(db.engine).get_columns("app_settings")
                values = {"id": 1, "app_name": "Wilik"}
                for column in existing_columns:
                    if column["name"] not in values and not column["nullable"] and column["default"] is None:
                        values[column["name"]] = "dark" if column["name"] == "default_color_scheme" else 0
                with db.engine.begin() as connection:
                    connection.exec_driver_sql(
                        f"INSERT INTO app_settings ({', '.join(values)}) VALUES ({', '.join('?' for _ in values)})",
                        tuple(values.values()),
                    )

                upgrade(directory=migrations_directory, revision="head")
                columns = {column["name"]: column for column in inspect(db.engine).get_columns("app_settings")}
                self.assertFalse(columns["default_language"]["nullable"])
                self.assertFalse(columns["public_language_button_enabled"]["nullable"])
                with db.engine.connect() as connection:
                    row = connection.exec_driver_sql(
                        "SELECT default_language, public_language_button_enabled FROM app_settings WHERE id = 1"
                    ).one()
                self.assertEqual(row[0], "system")
                self.assertEqual(row[1], 0)

                downgrade(directory=migrations_directory, revision="b2c3d4e5f6a7")
                columns_downgraded = {column["name"] for column in inspect(db.engine).get_columns("app_settings")}
                self.assertNotIn("default_language", columns_downgraded)
                self.assertNotIn("public_language_button_enabled", columns_downgraded)
                db.session.remove()
                db.engine.dispose()


if __name__ == "__main__":
    unittest.main()
