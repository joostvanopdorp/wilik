#!/bin/sh
set -e

if [ -f /app/instance/wilik.db ]; then
  cp /app/instance/wilik.db "/app/instance/wilik.db.bak.$(date +%Y%m%d%H%M%S)"
fi
# keep only the 10 most recent copies, so restarts don't pile them up forever
# (names sort by timestamp)
ls -1 /app/instance/wilik.db.bak.* 2>/dev/null | sort -r | tail -n +11 | xargs -r rm -f

flask db upgrade
flask bootstrap-db

exec gunicorn --preload --bind 0.0.0.0:5000 --workers 2 app:app
