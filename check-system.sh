#!/bin/bash

echo "======================================"
echo "  院内チャットツール システムチェック"
echo "======================================"
echo ""

# カラー定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# チェック関数
check_service() {
    local name=$1
    local command=$2
    
    if eval $command > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name: 起動中"
        return 0
    else
        echo -e "${RED}✗${NC} $name: 停止中"
        return 1
    fi
}

# 1. Docker (PostgreSQL)
echo "1. データベース (PostgreSQL)"
check_service "Docker PostgreSQL" "docker compose ps | grep postgres | grep Up"
echo ""

# 2. Next.js
echo "2. Next.jsサーバー (http://localhost:3000)"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|307\|302"; then
    echo -e "${GREEN}✓${NC} Next.js: 起動中"
else
    echo -e "${RED}✗${NC} Next.js: 停止中"
fi
echo ""

# 3. WebSocket
echo "3. WebSocketサーバー (ws://localhost:3001)"
if lsof -i :3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} WebSocket: 起動中"
else
    echo -e "${RED}✗${NC} WebSocket: 停止中"
fi
echo ""

# 4. データベース接続
echo "4. データベース接続"
if psql postgresql://postgres:password@localhost:5432/hospital_chat -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} データベース接続: OK"
    
    # データ確認
    USER_COUNT=$(psql postgresql://postgres:password@localhost:5432/hospital_chat -t -c "SELECT COUNT(*) FROM \"User\";" 2>/dev/null | tr -d ' ')
    CHANNEL_COUNT=$(psql postgresql://postgres:password@localhost:5432/hospital_chat -t -c "SELECT COUNT(*) FROM \"Channel\";" 2>/dev/null | tr -d ' ')
    
    echo "   - ユーザー数: $USER_COUNT"
    echo "   - チャンネル数: $CHANNEL_COUNT"
else
    echo -e "${RED}✗${NC} データベース接続: NG"
fi
echo ""

# 5. 環境変数
echo "5. 環境変数"
if [ -f .env ]; then
    echo -e "${GREEN}✓${NC} .env ファイル: 存在"
else
    echo -e "${RED}✗${NC} .env ファイル: 不在"
fi
echo ""

# まとめ
echo "======================================"
echo "  チェック完了"
echo "======================================"
echo ""

# すべて起動している場合
if docker compose ps | grep postgres | grep -q Up && \
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|307\|302" && \
   lsof -i :3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ すべてのサービスが起動しています！${NC}"
    echo ""
    echo "デモを開始できます："
    echo "  1. ブラウザで http://localhost:3000/login を開く"
    echo "  2. doctor@tokyo001.com / password123 でログイン"
    echo ""
    echo "詳細は START_DEMO.md を参照してください。"
else
    echo -e "${YELLOW}⚠ 一部のサービスが停止しています${NC}"
    echo ""
    echo "起動方法："
    echo "  Docker: docker compose up -d"
    echo "  Next.js: npm run dev"
    echo "  WebSocket: npm run ws:dev (別ターミナル)"
fi

echo ""
