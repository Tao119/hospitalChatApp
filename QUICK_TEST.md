# クイックテストガイド

## 1. サーバー起動確認

```bash
# すべてのサービスが起動しているか確認
echo "=== サービス起動状況 ==="
echo ""

# Docker
echo "1. Docker (PostgreSQL):"
docker compose ps | grep postgres

# Next.js
echo ""
echo "2. Next.js (http://localhost:3000):"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000

# WebSocket
echo ""
echo "3. WebSocket (ws://localhost:3001):"
# WebSocketは接続テストが難しいので、プロセスを確認
ps aux | grep "npm run ws:dev" | grep -v grep

echo ""
echo "=== すべて起動していればOK ==="
```

## 2. 最小限の動作確認（1 台の PC で）

### ステップ 1: ログイン

1. ブラウザで http://localhost:3000/login を開く
2. 以下の情報でログイン：
   ```
   メールアドレス: doctor@tokyo001.com
   パスワード: password123
   ```
3. チャット画面が表示されることを確認

### ステップ 2: チャンネル確認

1. 左サイドバーに患者一覧が表示されることを確認
2. 「田中太郎 (P001)」などの患者が表示されているか確認

### ステップ 3: スレッド確認

1. 患者をクリック
2. 中央にスレッド一覧が表示されることを確認
3. 「入院時対応」「薬剤管理」などのスレッドが表示されているか確認

### ステップ 4: メッセージ確認

1. スレッドをクリック
2. 右側にメッセージエリアが表示されることを確認
3. 既存のメッセージが表示されているか確認

### ステップ 5: メッセージ送信

1. 下部の入力欄に「テストメッセージ」と入力
2. 送信ボタンをクリック
3. メッセージが表示されることを確認

## 3. リアルタイム機能の確認（2 台の PC で）

### PC1 の準備

1. ブラウザで http://localhost:3000/login を開く
2. `doctor@tokyo001.com` / `password123` でログイン
3. 「田中太郎 (P001)」→「入院時対応」を選択

### PC2 の準備

1. **別のブラウザまたはシークレットモード**で http://localhost:3000/login を開く
2. `nurse@tokyo001.com` / `password123` でログイン
3. 「田中太郎 (P001)」→「入院時対応」を選択

### リアルタイムテスト

1. PC1 からメッセージを送信
2. **PC2 で即座にメッセージが表示されることを確認**
3. PC2 からメッセージを送信
4. **PC1 で即座にメッセージが表示されることを確認**

## 4. トラブルシューティング

### ログインできない

```bash
# ユーザーが存在するか確認
psql postgresql://postgres:password@localhost:5432/hospital_chat -c "SELECT email, name FROM \"User\" WHERE email = 'doctor@tokyo001.com';"
```

### チャンネルが表示されない

```bash
# チャンネルが存在するか確認
psql postgresql://postgres:password@localhost:5432/hospital_chat -c "SELECT COUNT(*) FROM \"Channel\";"
```

### メッセージが送信できない

1. ブラウザの開発者ツール（F12）を開く
2. Console タブでエラーを確認
3. Network タブで API リクエストを確認

### リアルタイム更新が動作しない

1. ブラウザの開発者ツール（F12）を開く
2. Network タブで「WS」フィルターを選択
3. WebSocket 接続が確立されているか確認
4. WebSocket サーバーのログを確認

### データをリセット

```bash
# データベースをリセットして再シード
npx prisma migrate reset --force
npx tsx scripts/seed-multi-tenant.ts
```

## 5. 成功基準

- [ ] ログインできる
- [ ] チャンネル一覧が表示される
- [ ] スレッド一覧が表示される
- [ ] メッセージが表示される
- [ ] メッセージを送信できる
- [ ] 2 台の PC でリアルタイムにメッセージが同期される

## 6. 次のステップ

すべての基本機能が動作したら、以下の追加機能をテスト：

1. メンション機能（@ユーザー名）
2. ファイル添付
3. 検索機能（Ctrl/Cmd + K）
4. 既読管理
5. 管理者機能

詳細は `DEMO_GUIDE.md` を参照してください。
