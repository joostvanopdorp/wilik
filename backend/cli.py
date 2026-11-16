import click
from flask.cli import with_appcontext

from helpers import SETUP_TOKEN_VALID_DAYS, find_user_by_username, issue_setup_token
from models import User, db


def print_setup_link(user, token):
    print("=" * 50)
    print(f"Setup link for '{user.username}': /setup/{token}")
    print("Open it on this server's address, e.g. http://localhost:8090/setup/<token>")
    print(f"This link expires in {SETUP_TOKEN_VALID_DAYS} days.")
    print("=" * 50)


@click.command("setup-link")
@click.argument("username", required=False)
@with_appcontext
def setup_link_command(username):
    """Prints a fresh one-time setup link for USERNAME (default: the oldest admin).

    For when the first admin's link from bootstrap-db expired, or an admin is locked out.
    Replaces any earlier link for that account; an existing password keeps working until
    the link is used to set a new one."""
    if username:
        user = find_user_by_username(username)
    else:
        user = User.query.filter_by(is_admin=True).order_by(User.id).first()
    if user is None:
        raise click.ClickException(f"No account named '{username}'" if username else "No admin account exists")
    token = issue_setup_token(user)
    db.session.commit()
    print_setup_link(user, token)
