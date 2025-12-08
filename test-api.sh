#!/bin/bash

echo "=== 院内チャットツール API テスト ==="
echo ""

# 1. セッション確認
echo "1. セッション確認"
curl -s http://localhost:3000/api/auth/session | jq .
echo ""

# 2. チャンネル一覧取得（認証なし - エラーになるはず）
echo "2. チャンネル一覧取得（認証なし）"
curl -s http://localhost:3000/api/channels | jq .
echo ""

echo "=== テスト完了 ==="
echo ""
echo "ブラウザでテストするには："
echo "1. http://localhost:3000/login にアクセス"
echo "2. doctor@tokyo001.com / password123 でログイン"
echo "3. チャット画面で動作確認"
