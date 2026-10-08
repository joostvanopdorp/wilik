# Deploying Wilik

This assumes you've already done the Quick start in [README.md](README.md#quick-start) (clone, `.env`, `docker compose up -d`) and have it running. This doc covers everything that comes after: how updates ship, HTTPS/reverse proxies, backups, rolling back, and (if this applies to you) migrating an older deployment onto this setup.

## How updates ship

This describes the pipeline that produces the default images in `docker-compose.yml` (`ghcr.io/joostvanopdorp/wilik-*`). If you're just running Wilik as-is, there's nothing to do here: it runs on the upstream repo, and updates reach your host automatically via Watchtower. It's only actionable for you directly if you're running your own fork with your own CI and registry, since then `main` refers to your fork.

1. Push to `main`.
2. GitHub Actions (`.github/workflows/build-and-push.yml`) builds the backend and frontend images and pushes them to GHCR, tagged `latest` and with the commit SHA.
3. Watchtower on your host polls GHCR every 5 minutes (`WATCHTOWER_POLL_INTERVAL`). When it sees a new `latest` image for `backend` or `frontend`, it pulls it and restarts that container. Watchtower also updates itself and the optional `backup` container (within `v2`). With `WATCHTOWER_REPLICAS=0` in `.env` (Docker Compose 2.24+) the bundled Watchtower doesn't run; then updates only arrive when you (or your own tooling) pull and restart.
4. On every backend start, `entrypoint.sh` backs up the SQLite file, runs `flask db upgrade` (applies any new migrations), then runs `flask bootstrap-db` (a no-op unless the database is empty) before starting gunicorn.

No local Docker build and no manual steps for schema changes: push to `main`, wait a few minutes, done.

If you don't want to wait for Watchtower's next poll, pull and restart by hand:
```
docker compose pull
docker compose up -d
```
(`docker compose up -d` on its own does **not** pull new images, it only recreates containers whose config changed. You need the `pull` first.)

## HTTPS and reverse proxies

`docker-compose.yml` is kept generic on purpose, so you can pull future updates to it without fighting merge conflicts with your own setup. If you route Wilik through a reverse proxy (Traefik, Caddy, nginx-proxy, ...), put that config in `docker-compose.override.yml` instead: Compose loads it automatically alongside `docker-compose.yml`, no extra flags needed. It's gitignored, so it's entirely yours, git never touches it. See `docker-compose.override.yml.example` for a Traefik-based template.

If that proxy or tunnel terminates HTTPS for you, set `SESSION_COOKIE_SECURE=true` in `.env` so the session cookie is never sent over plain HTTP. It's off by default since LAN-only or plain-http setups would otherwise get silently locked out of login.

## Backups

Off-site backups are **optional**: the `backup` service sits behind a Compose profile and is skipped entirely by a plain `docker compose up -d`. When enabled, it makes an automatic off-site backup. It stops the `backend` container briefly (for a consistent snapshot, see the `docker-volume-backup.stop-during-backup` label on `backend`), archives the `wilik-data` volume, and uploads it to an S3-compatible bucket using [offen/docker-volume-backup](https://github.com/offen/docker-volume-backup). This uses static credentials (access key + secret key), not an OAuth login, so setup is just filling in `.env`, no browser flow, no expiring tokens to manage.

Setup:

1. Create (or reuse) an S3-compatible bucket. Any provider works (AWS S3, Backblaze B2, MinIO, ...). A distinct `AWS_S3_PATH` (see below) keeps it separate from anything else already in that bucket.
2. In `.env`, set:
   ```
   BACKUP_S3_BUCKET=your-bucket-name
   BACKUP_S3_ACCESS_KEY_ID=your-access-key-id
   BACKUP_S3_SECRET_ACCESS_KEY=your-secret-access-key
   ```
   The default `BACKUP_S3_ENDPOINT` (`s3.amazonaws.com`) only works for some AWS regions. If your bucket is in e.g. `eu-west-1`, set `BACKUP_S3_ENDPOINT=s3.eu-west-1.amazonaws.com` instead (AWS returns a `PermanentRedirect` error otherwise). Non-AWS providers should set their own S3 endpoint here too.
3. Optionally set `BACKUP_NOTIFICATION_URL` to get notified if a backup fails, e.g. for [ntfy](https://ntfy.sh): `ntfy://ntfy.sh/your-topic-name?title=Wilik` (or `ntfy://user:pass@your-host/topic?title=Wilik` if self-hosted). Add `?title=Wilik` to tell it apart from notifications for other apps. Any [shoutrrr](https://containrrr.dev/shoutrrr/) service works the same way.
4. Start it with the `backup` profile enabled:
   ```
   docker compose --profile backup up -d
   ```
   (A plain `docker compose up -d`, without `--profile backup`, leaves it out entirely, e.g. if you set up backups later, or never want them.)

Runs daily at 03:00 by default (`BACKUP_CRON_EXPRESSION`) and keeps 30 days of backups (`BACKUP_RETENTION_DAYS`), both configurable via `.env`. Backups land under the `wilik/` path in your bucket.

## Rolling back

Old images stay in GHCR tagged by commit SHA. To roll back:
```
docker compose pull backend  # or manually retag an older SHA as :latest in GHCR
docker compose up -d
```
Note: rolling back the *app* does not roll back the *database schema*. If the bad release included a migration, rolling back the image alone won't undo it. Restore from a `wilik-data` backup instead if that happens.

## Migrating an older deployment onto this setup

Historical, one-time step. Skip this section entirely unless you're moving an *existing* Wilik install (one that predates this Docker/Watchtower/CI setup) onto it. A fresh install never needs this.

1. **Back up the `wilik-data` volume** before touching anything.
2. Make sure the GHCR packages (`wilik-backend`, `wilik-frontend`) are set to **Public** in GitHub's package settings, so your host can pull them without registry credentials.
3. Copy the updated `docker-compose.yml` and your `.env` (with `SECRET_KEY`) to your host.
4. Run the initial migration **stamp**, once, before starting the stack normally:
   ```
   docker compose run --rm backend flask db stamp head
   ```
   This tells Alembic "the database already matches this migration" without trying to re-create tables that already exist from the old `db.create_all()` setup. Skipping this step and letting the normal entrypoint run `flask db upgrade` first would fail, since it would try to `CREATE TABLE` on tables that are already there.
5. Start everything normally: `docker compose up -d`. This brings up `backend`, `frontend`, and `watchtower`.
6. Verify the app loads and existing data (users, wishlists) is intact.
7. Check Watchtower is watching the right containers: `docker logs watchtower`.
