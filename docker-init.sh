#!/bin/bash

echo "======================================"
echo "  データベース初期化"
echo "======================================"
echo ""

# データベースが起動するまで待つ
echo "データベースの起動を待っています..."
sleep 5

# マイグレーションを実行
echo "マイグレーションを実行中..."
docker compose exec app npx prisma migrate deploy

# シードデータを投入
echo "シードデータを投入中..."
docker compose exec app npx tsx scripts/seed-multi-tenant.ts

echo ""
echo "======================================"
echo "  初期化完了"
echo "======================================"
echo ""
echo "アプリケーションにアクセスできます："
echo "  http://localhost:3000/login"
echo ""
