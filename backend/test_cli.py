import unittest

from flask import Flask

from cli import setup_link_command
from models import User, db


class SetupLinkCommandTestCase(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config.update(SQLALCHEMY_DATABASE_URI="sqlite:///:memory:", TESTING=True)
        db.init_app(self.app)
        self.app.cli.add_command(setup_link_command)
        with self.app.app_context():
            db.create_all()
            db.session.add_all(
                [
                    User(username="Admin", is_admin=True, must_change_password=True),
                    User(username="second-admin", is_admin=True),
                    User(username="Member"),
                ]
            )
            db.session.commit()
        self.runner = self.app.test_cli_runner()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def token_of(self, username):
        with self.app.app_context():
            return User.query.filter_by(username=username).one().setup_token

    def test_defaults_to_oldest_admin(self):
        result = self.runner.invoke(args=["setup-link"])
        self.assertEqual(result.exit_code, 0, result.output)
        token = self.token_of("Admin")
        self.assertIsNotNone(token)
        self.assertIn(f"/setup/{token}", result.output)
        self.assertIsNone(self.token_of("second-admin"))

    def test_named_user_is_case_insensitive(self):
        result = self.runner.invoke(args=["setup-link", "member"])
        self.assertEqual(result.exit_code, 0, result.output)
        self.assertIn(f"/setup/{self.token_of('Member')}", result.output)

    def test_replaces_earlier_link(self):
        self.runner.invoke(args=["setup-link"])
        first = self.token_of("Admin")
        self.runner.invoke(args=["setup-link"])
        self.assertNotEqual(first, self.token_of("Admin"))

    def test_unknown_user_fails(self):
        result = self.runner.invoke(args=["setup-link", "nobody"])
        self.assertNotEqual(result.exit_code, 0)
        self.assertIn("No account named 'nobody'", result.output)


if __name__ == "__main__":
    unittest.main()
