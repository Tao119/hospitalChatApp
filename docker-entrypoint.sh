#!/bin/sh
set -e

# DATABASE_URLが設定されているか確認
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

# データベース接続を待つ（Render環境では不要な場合もある）
if [ -n "$WAIT_FOR_DB" ]; then
  echo "Waiting for database..."
  # DATABASE_URLからホストとポートを抽出
  DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
  DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  
  if [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ]; then
    echo "Checking connection to $DB_HOST:$DB_PORT..."
    while ! nc -z $DB_HOST $DB_PORT 2>/dev/null; do
      sleep 1
    done
    echo "Database is ready"
  fi
fi

echo "Running migrations..."
npx prisma migrate deploy || npx prisma db push

echo "Starting application..."
exec "$@"
