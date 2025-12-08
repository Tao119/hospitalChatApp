#!/bin/bash

echo "=== ログインテスト ==="
echo ""

# セッションクッキーを保存するファイル
COOKIE_FILE="/tmp/hospital_chat_cookie.txt"

# ログイン
echo "1. ログイン試行..."
LOGIN_RESPONSE=$(curl -s -c $COOKIE_FILE -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=doctor@tokyo001.com&password=password123&redirect=false&json=true")

echo "レスポンス: $LOGIN_RESPONSE"
echo ""

# セッション確認
echo "2. セッション確認..."
SESSION_RESPONSE=$(curl -s -b $COOKIE_FILE http://localhost:3000/api/auth/session)
echo "セッション: $SESSION_RESPONSE"
echo ""

# チャンネル一覧取得
echo "3. チャンネル一覧取得..."
CHANNELS_RESPONSE=$(curl -s -b $COOKIE_FILE http://localhost:3000/api/channels)
echo "チャンネル数: $(echo $CHANNELS_RESPONSE | jq '. | length')"
echo ""

# クリーンアップ
rm -f $COOKIE_FILE

echo "=== テスト完了 ==="
