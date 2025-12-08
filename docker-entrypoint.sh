#!/bin/sh
set -e

echo "Waiting for postgres..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "PostgreSQL started"

echo "Running migrations..."
npx prisma migrate deploy || npx prisma db push

echo "Starting application..."
exec "$@"
