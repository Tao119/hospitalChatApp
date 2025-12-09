# Render デプロイガイド（統合版）

## 概要

このアプリは Next.js と WebSocket を**同じサーバー**で実行する統合アーキテクチャを採用しています。

## アーキテクチャ

```
クライアント
  ↓
  ├─ HTTPS → Next.js (ポート 10000)
  └─ WSS → WebSocket (/ws パス、同じポート)
```

## デプロイ手順

### 1. Render でプロジェクトを作成

1. [Render Dashboard](https://dashboard.render.com/) にログイン
2. "New +" → "Blueprint" を選択
3. GitHub リポジトリを接続
4. `render.yaml` が自動検出される

### 2. 環境変数を設定

Render のダッシュボードで以下を設定：

```bash
# 必須
NEXTAUTH_URL=https://your-app-name.onrender.com
NEXTAUTH_SECRET=<自動生成される>
DATABASE_URL=<自動設定される>

# 自動設定
NODE_ENV=production
PORT=10000
HOSTNAME=0.0.0.0
```

**重要**: `NEXT_PUBLIC_WS_URL` は**不要**です。クライアントが自動的に同じドメインの `/ws` に接続します。

### 3. デプロイ

```bash
git add .
git commit -m "Configure integrated deployment"
git push origin main
```

Render が自動的に：

1. Docker イメージをビルド
2. データベースマイグレーションを実行
3. サーバーを起動

## 動作確認

### ヘルスチェック

```bash
curl https://your-app-name.onrender.com/api/health
```

期待される応答：

```json
{
  "status": "ok",
  "timestamp": "2024-12-09T...",
  "service": "hospital-chat-app"
}
```

### WebSocket 接続

ブラウザの開発者ツールで確認：

```
Connecting to WebSocket: wss://your-app-name.onrender.com/ws
WebSocket connected
```

## トラブルシューティング

### サーバーが起動しない

**ログを確認**:

```
Starting server in production mode
Hostname: 0.0.0.0, Port: 10000
> Ready on http://0.0.0.0:10000
> WebSocket server ready on ws://0.0.0.0:10000/ws
```

### WebSocket 接続エラー

1. **ブラウザコンソールを確認**

   ```
   Connecting to WebSocket: wss://...
   ```

   - `wss://` プロトコルを使用しているか
   - ドメインが正しいか

2. **サーバーログを確認**
   ```
   Client connected: user-id-123
   ```

### データベース接続エラー

```bash
# Render ダッシュボードで確認
# Database → Connections → Internal Database URL
```

## ローカル開発との違い

| 環境     | WebSocket URL         | 動作                        |
| -------- | --------------------- | --------------------------- |
| ローカル | `ws://localhost:3001` | 独立した WebSocket サーバー |
| 本番     | `wss://domain.com/ws` | Next.js と統合              |

ローカル開発：

```bash
# ターミナル1: WebSocket サーバー
npm run ws:dev

# ターミナル2: Next.js
npm run dev
```

本番環境：

```bash
# 統合サーバー（自動起動）
node server.js
```

## パフォーマンス最適化

### 1. Docker イメージサイズ削減

- マルチステージビルドは使用していません（カスタムサーバーのため）
- 不要なファイルを削除（.git, docs など）
- npm cache をクリーン

### 2. 接続管理

- WebSocket 接続は自動再接続（3 秒後）
- クライアント切断時に自動クリーンアップ

### 3. ログ出力

本番環境では重要なイベントのみログ出力：

- クライアント接続/切断
- メッセージブロードキャスト
- エラー

## セキュリティ

1. **認証**: NextAuth.js で保護
2. **WebSocket**: userId パラメータで識別
3. **HTTPS/WSS**: Render が自動的に SSL 証明書を提供

## スケーリング

現在の構成：

- 無料プラン: 1 インスタンス
- 有料プラン: 複数インスタンス可能

**注意**: 複数インスタンスの場合、Redis などの共有ストアが必要です（現在は未実装）。

## まとめ

✅ シンプルな統合アーキテクチャ
✅ 追加の WebSocket サービス不要
✅ CORS 設定不要
✅ 環境変数の管理が簡単
