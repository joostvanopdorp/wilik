import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from flask import Flask, jsonify
from flask_login import LoginManager
from flask_migrate import Migrate, downgrade, upgrade
from sqlalchemy import inspect

from models import AppSettings, Claim, Gift, User, db
from routes.items import items_bp


class ClaimManagementTestCase(unittest.TestCase):
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

        self.app.register_blueprint(items_bp)

        with self.app.app_context():
            db.create_all()
            db.session.add(AppSettings(id=1, app_name="Wilik", claim_management_site_enabled=True))
            owner = User(username="owner", claim_management_enabled=False)
            other = User(username="other", claim_management_enabled=True)
            db.session.add_all([owner, other])
            db.session.flush()
            gift = Gift(owner_id=owner.id, title="Claimed gift", quantity=1)
            db.session.add(gift)
            db.session.flush()
            db.session.add(Claim(gift_id=gift.id, claimed_by="Alice", claim_token="secret-token"))
            db.session.commit()
            self.owner_id = owner.id
            self.other_id = other.id
            self.gift_id = gift.id

        self.client = self.app.test_client()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def login_as(self, user_id):
        with self.client.session_transaction() as session:
            session["_user_id"] = str(user_id)
            session["_fresh"] = True

    def set_claim_management(self, enabled):
        with self.app.app_context():
            owner = db.session.get(User, self.owner_id)
            owner.claim_management_enabled = enabled
            db.session.commit()

    def set_site_claim_management(self, enabled):
        with self.app.app_context():
            settings = db.session.get(AppSettings, 1)
            settings.claim_management_site_enabled = enabled
            db.session.commit()

    def test_disabled_wishlist_hides_claimed_count_but_allows_one_off_reveal(self):
        self.login_as(self.owner_id)

        items_response = self.client.get("/api/items")
        self.assertEqual(items_response.status_code, 200)
        self.assertNotIn("claimed_count", items_response.get_json()[0])

        summary_response = self.client.get(f"/api/items/{self.gift_id}/claim-info")
        self.assertEqual(summary_response.get_json(), {"claimed_count": 1})

        # opting out of the always-on toggle only turns off the passive lock icon --
        # the owner can still deliberately reveal a name once, e.g. right before deleting
        reveal_response = self.client.get(f"/api/items/{self.gift_id}/claims")
        self.assertEqual(reveal_response.status_code, 200)
        self.assertEqual(reveal_response.get_json(), {"claimed_by": ["Alice"]})

        # resetting claims still requires the full per-wishlist opt-in
        reset_response = self.client.delete(f"/api/items/{self.gift_id}/claims")
        self.assertEqual(reset_response.status_code, 403)

    def test_enabled_owner_can_reveal_and_reset_claims(self):
        self.set_claim_management(True)
        self.login_as(self.owner_id)

        items_response = self.client.get("/api/items")
        self.assertEqual(items_response.get_json()[0]["claimed_count"], 1)

        reveal_response = self.client.get(f"/api/items/{self.gift_id}/claims")
        self.assertEqual(reveal_response.status_code, 200)
        self.assertEqual(reveal_response.get_json(), {"claimed_by": ["Alice"]})
        self.assertNotIn("secret-token", reveal_response.get_data(as_text=True))

        reset_response = self.client.delete(f"/api/items/{self.gift_id}/claims")
        self.assertEqual(reset_response.status_code, 200)
        self.assertEqual(reset_response.get_json()["claimed_count"], 0)

        with self.app.app_context():
            self.assertEqual(Claim.query.filter_by(gift_id=self.gift_id).count(), 0)

    def test_non_owner_cannot_reveal_or_reset_claims(self):
        self.login_as(self.other_id)

        reveal_response = self.client.get(f"/api/items/{self.gift_id}/claims")
        self.assertEqual(reveal_response.status_code, 403)

        reset_response = self.client.delete(f"/api/items/{self.gift_id}/claims")
        self.assertEqual(reset_response.status_code, 403)

    def test_site_wide_disable_still_allows_one_off_reveal_but_blocks_reset(self):
        self.set_claim_management(True)
        self.set_site_claim_management(False)
        self.login_as(self.owner_id)

        items_response = self.client.get("/api/items")
        self.assertEqual(items_response.status_code, 200)
        self.assertNotIn("claimed_count", items_response.get_json()[0])

        # a one-off reveal (e.g. right before deleting) is never blocked, even with
        # claim management fully off site-wide -- only the passive surface is gated
        reveal_response = self.client.get(f"/api/items/{self.gift_id}/claims")
        self.assertEqual(reveal_response.status_code, 200)
        self.assertEqual(reveal_response.get_json(), {"claimed_by": ["Alice"]})

        reset_response = self.client.delete(f"/api/items/{self.gift_id}/claims")
        self.assertEqual(reset_response.status_code, 403)


class ClaimManagementMigrationTestCase(unittest.TestCase):
    def test_upgrade_adds_default_off_column_and_downgrade_removes_it(self):
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
                upgrade(directory=migrations_directory, revision="d4e5f6a7b8c9")
                columns_before = {column["name"] for column in inspect(db.engine).get_columns("user")}
                self.assertNotIn("claim_management_enabled", columns_before)

                upgrade(directory=migrations_directory, revision="head")
                columns_after = {
                    column["name"]: column for column in inspect(db.engine).get_columns("user")
                }
                self.assertIn("claim_management_enabled", columns_after)
                self.assertFalse(columns_after["claim_management_enabled"]["nullable"])

                downgrade(directory=migrations_directory, revision="d4e5f6a7b8c9")
                columns_downgraded = {column["name"] for column in inspect(db.engine).get_columns("user")}
                self.assertNotIn("claim_management_enabled", columns_downgraded)
                db.session.remove()
                db.engine.dispose()


class ClaimManagementSiteToggleMigrationTestCase(unittest.TestCase):
    def test_upgrade_adds_default_on_column_and_downgrade_removes_it(self):
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
                upgrade(directory=migrations_directory, revision="e5f6a7b8c9d0")
                columns_before = {column["name"] for column in inspect(db.engine).get_columns("app_settings")}
                self.assertNotIn("claim_management_site_enabled", columns_before)

                upgrade(directory=migrations_directory, revision="head")
                columns_after = {
                    column["name"]: column for column in inspect(db.engine).get_columns("app_settings")
                }
                self.assertIn("claim_management_site_enabled", columns_after)
                self.assertFalse(columns_after["claim_management_site_enabled"]["nullable"])

                downgrade(directory=migrations_directory, revision="e5f6a7b8c9d0")
                columns_downgraded = {column["name"] for column in inspect(db.engine).get_columns("app_settings")}
                self.assertNotIn("claim_management_site_enabled", columns_downgraded)
                db.session.remove()
                db.engine.dispose()


if __name__ == "__main__":
    unittest.main()
