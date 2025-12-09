# デプロイチェックリスト

## 修正内容

### ✅ 1. WebSocket URL の自動検出を改善

**ファイル**: `src/hooks/useWebSocket.ts`

- 開発環境: `ws://localhost:3001` （独立サーバー）
- 本番環境: `wss://domain.com/ws` （統合サーバー）
- 環境変数 `NEXT_PUBLIC_WS_URL` は不要

### ✅ 2. server.js にログ追加

**ファイル**: `server.js`

- 起動時の環境情報を出力
- WebSocket 接続状況を追跡
- デバッグが容易に

### ✅ 3. Dockerfile.render を最適化

**ファイル**: `Dockerfile.render`

- 本番用依存関係のみインストール
- キャッシュクリーン
- ヘルスチェック追加
- 不要なファイル削除

### ✅ 4. render.yaml を簡素化

**ファイル**: `render.yaml`

- Docker 環境では buildCommand/startCommand 不要
- PORT を 10000 に設定（Render のデフォルト）
- HOSTNAME を明示的に設定

### ✅ 5. ヘルスチェック API 追加

**ファイル**: `src/app/api/health/route.ts`

- サーバーの稼働状況を確認
- Docker ヘルスチェックで使用

## デプロイ前の確認

### ローカルテスト

```bash
# 1. Docker ビルドテスト
docker build -f Dockerfile.render -t hospital-chat-test .

# 2. Docker 実行テスト
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e NEXTAUTH_SECRET="test-secret" \
  hospital-chat-test

# 3. ヘルスチェック
curl http://localhost:3000/api/health

# 4. WebSocket 接続テスト（ブラウザで）
# http://localhost:3000 にアクセスしてログイン
```

### Render デプロイ

```bash
# 1. 変更をコミット
git add .
git commit -m "Fix WebSocket deployment configuration"
git push origin main

# 2. Render ダッシュボードで確認
# - ビルドログを監視
# - デプロイが成功したか確認

# 3. 環境変数を設定
# NEXTAUTH_URL: https://your-app.onrender.com
# NEXTAUTH_SECRET: （自動生成）
# DATABASE_URL: （自動設定）

# 4. 動作確認
curl https://your-app.onrender.com/api/health
```

## トラブルシューティング

### 問題: ビルドが失敗する

**確認事項**:

```bash
# ローカルでビルドテスト
docker build -f Dockerfile.render .
```

### 問題: サーバーが起動しない

**ログを確認**:

```
Starting server in production mode
Hostname: 0.0.0.0, Port: 10000
```

**原因**:

- PORT 環境変数が正しく設定されていない
- データベース接続エラー

### 問題: WebSocket 接続できない

**ブラウザコンソールを確認**:

```javascript
// 期待される出力
Connecting to WebSocket: wss://your-app.onrender.com/ws
WebSocket connected
```

**サーバーログを確認**:

```
Client connected: user-id-123
```

**原因**:

- クライアントが間違った URL に接続している
- サーバーが WebSocket をリッスンしていない

### 問題: データベースマイグレーションエラー

**解決策**:

```bash
# Render Shell で手動実行
npx prisma migrate deploy
npx prisma db seed
```

## 成功の確認

### ✅ チェックポイント

1. **ビルド成功**

   - Docker イメージが正常にビルドされる
   - エラーログがない

2. **サーバー起動**

   ```
   > Ready on http://0.0.0.0:10000
   > WebSocket server ready on ws://0.0.0.0:10000/ws
   ```

3. **ヘルスチェック**

   ```bash
   curl https://your-app.onrender.com/api/health
   # {"status":"ok",...}
   ```

4. **WebSocket 接続**

   - ブラウザコンソールに "WebSocket connected" が表示
   - リアルタイムメッセージが送受信できる

5. **認証**
   - ログインできる
   - セッションが維持される

## 次のステップ

デプロイ成功後：

1. **シードデータ投入**

   ```bash
   # Render Shell で実行
   npm run db:seed
   ```

2. **テストアカウントでログイン**

   - スーパー管理者: `super@example.com` / `password123`
   - 管理者: `admin@hospital1.com` / `password123`

3. **機能テスト**

   - チャンネル作成
   - メッセージ送信
   - リアルタイム更新の確認

4. **パフォーマンス監視**
   - Render のメトリクスを確認
   - レスポンスタイムを監視
