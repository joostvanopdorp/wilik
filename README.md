<p align="center">
  <img src="frontend/public/favicon-readme.svg" width="80" alt="Wilik logo">
</p>

# Wilik

A self-hosted wishlist app, named after the Dutch "wil ik" ("I want that"). Each user keeps a list of things they want, shares it via a link that works for anyone who has it (or opts into the browsable directory so people can find it without one), and visitors can claim items or mark them as purchased without needing an account.

<p align="center">
  <img src="docs/screenshots/screenshot_login.png" width="230" alt="Login screen">
  <img src="docs/screenshots/screenshot_wishlist_edit.png" width="230" alt="Wishlist, owner view">
  <img src="docs/screenshots/screenshot_wishlist_claim.png" width="230" alt="Wishlist, shared link view">
</p>

## What it does

- 📝 **Personal wishlists** with price, brand, and notes per item. Paste a product URL and it'll try to auto-fill title, image, and price.
- 🔗 **Share via a link** that works for anyone who has it (not published or searchable anywhere), or add it to the **browsable directory** so people can find it without one. No login required either way, opt out per user or switch off site-wide.
- 🤫 **Claiming**: visitors can claim an item so others know it's taken, without revealing it to the list owner. The surprise stays intact by default. Wishlist owners can explicitly opt into claim management, where claimant names remain hidden until deliberately revealed and stale claims can be reset.
- 🛠️ **Admin panel** for managing users and resetting passwords.
- 🌓 **Light/dark theme**, with dark as the default (as it should be).

Wilik is meant to be self-hosted: your data stays on your server, not on someone else's registry quietly logging what everyone wants for their birthday.

## Quick start

```
cp .env.example .env   # set a real SECRET_KEY
docker compose up -d
```

The app is served on port 8090 (change it with `WILIK_PORT` in `.env`). On first start, the backend creates an admin account and prints a one-time setup link for it. Find it with `docker compose logs backend`, open it on your server's address (e.g. `http://localhost:8090/setup/<token>`) and choose your own username and password. The link is valid for 7 days; if it expired, or you ever lock yourself out, get a fresh one with `docker compose exec backend flask setup-link`.

That's it for a plain, single-machine setup, no reverse proxy, no backups.

To update, pull the new images and restart: `docker compose pull && docker compose up -d`. Database migrations run on their own when the backend starts. Wilik doesn't update itself; to have that happen automatically (cron, Watchtower, or your own tooling), see [Keeping Wilik up to date](DEPLOY.md#keeping-wilik-up-to-date).

For HTTPS/reverse proxies, off-site backups, rolling back, running your own fork with your own CI/registry, or moving an older install onto this setup, see [DEPLOY.md](DEPLOY.md).

## Development

Backend is Flask + SQLAlchemy + SQLite, with Flask-Migrate handling schema changes. Frontend is React + Vite. You'll need Python 3.13+ and Node 22+.

Install dependencies, once:
```
cd backend
python -m venv .venv
```
Then install the backend requirements using that venv's own Python:
- Windows: `.venv\Scripts\python.exe -m pip install -r requirements.txt`
- macOS/Linux: `.venv/bin/python -m pip install -r requirements.txt`

```
cd ../frontend
npm install
cd ..
npm install   # root install, only needed for the combined dev command below
```

Set up the database, once, run from `backend/`:
- Windows: `.venv\Scripts\python.exe -m flask db upgrade` then `.venv\Scripts\python.exe -m flask bootstrap-db`
- macOS/Linux: `.venv/bin/python -m flask db upgrade` then `.venv/bin/python -m flask bootstrap-db`

This creates the schema and a first admin account, and prints a one-time setup link for it. Open it on the frontend's address (`http://localhost:5173/setup/<token>`) to choose your username and password. Need a new link later? Run `flask setup-link` from `backend/` the same way.

Then, from the repo root:
```
npm run dev
```
This runs backend and frontend together in one terminal, cross-platform. To work on just one side instead: `npm run dev:backend` or `npm run dev:frontend`.

## License

MIT, see [LICENSE](LICENSE).
