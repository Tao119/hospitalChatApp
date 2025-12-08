#!/bin/bash

echo "======================================"
echo "  院内チャットツール Docker起動"
echo "======================================"
echo ""

# カラー定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 既存のコンテナを停止
echo "既存のコンテナを停止中..."
docker compose down

# イメージをビルド
echo ""
echo -e "${YELLOW}Dockerイメージをビルド中...${NC}"
echo "（初回は数分かかる場合があります）"
docker compose build

# コンテナを起動
echo ""
echo -e "${YELLOW}コンテナを起動中...${NC}"
docker compose up -d

# 起動を待つ
echo ""
echo "サービスの起動を待っています..."
sleep 5

# ステータス確認
echo ""
echo "======================================"
echo "  起動状況"
echo "======================================"
docker compose ps

# ログの確認方法を表示
echo ""
echo "======================================"
echo "  起動完了"
echo "======================================"
echo ""
echo -e "${GREEN}✓ すべてのサービスが起動しました！${NC}"
echo ""
echo "アクセス方法："
echo "  - アプリケーション: http://localhost:3000"
echo "  - ログイン: http://localhost:3000/login"
echo ""
echo "テストアカウント："
echo "  - 医師: doctor@tokyo001.com / password123"
echo "  - 看護師: nurse@tokyo001.com / password123"
echo ""
echo "ログの確認："
echo "  - すべて: docker compose logs -f"
echo "  - アプリ: docker compose logs -f app"
echo "  - WebSocket: docker compose logs -f websocket"
echo "  - DB: docker compose logs -f postgres"
echo ""
echo "停止方法："
echo "  docker compose down"
echo ""
