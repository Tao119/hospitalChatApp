#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting WebSocket server in background..."
npx tsx src/server/websocket.ts &

echo "Starting Next.js application..."
npm start
