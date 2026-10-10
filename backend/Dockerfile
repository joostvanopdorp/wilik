FROM python:3.13-slim

WORKDIR /app

ENV FLASK_APP=app.py

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chmod +x entrypoint.sh

# instance/ holds the SQLite database -- mount a volume here to persist data
RUN mkdir -p /app/instance
VOLUME /app/instance

EXPOSE 5000

# Commit this image was built from (CI passes it in); shown in the admin panel.
# Last, so a new commit doesn't invalidate the layers above.
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION

ENTRYPOINT ["./entrypoint.sh"]
