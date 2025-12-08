# Render へのデプロイガイド

## 前提条件

- Render アカウント（https://render.com）
- GitHub リポジトリ（https://github.com/Tao119/hospitalChatApp）

## デプロイ手順

### 方法 1: render.yaml を使用（推奨）

1. **Render ダッシュボードにアクセス**

   - https://dashboard.render.com にログイン

2. **New → Blueprint**を選択

3. **GitHub リポジトリを接続**

   - `Tao119/hospitalChatApp` を選択
   - `render.yaml` が自動検出される

4. **環境変数を設定**

   - `NEXTAUTH_URL`: デプロイ後の URL（例: `https://hospital-chat-app.onrender.com`）
   - `NEXT_PUBLIC_WS_URL`: WebSocket サービスの URL（例: `wss://hospital-chat-websocket.onrender.com`）

5. **デプロイ**
   - "Apply" をクリック
   - データベース、アプリ、WebSocket サーバーが自動的にデプロイされる

### 方法 2: 手動デプロイ

#### 1. PostgreSQL データベースを作成

1. **New → PostgreSQL**を選択
2. 設定:
   - Name: `hospital-chat-db`
   - Region: `Oregon (US West)`
   - Plan: `Free`
3. "Create Database"をクリック
4. 接続情報（Internal Database URL）をコピー

#### 2. Next.js アプリをデプロイ

1. **New → Web Service**を選択
2. GitHub リポジトリを接続: `Tao119/hospitalChatApp`
3. 設定:

   - Name: `hospital-chat-app`
   - Region: `Oregon (US West)`
   - Branch: `main`
   - Runtime: `Docker`
   - Dockerfile Path: `./Dockerfile.render`
   - Plan: `Free`

4. 環境変数を設定:

   ```
   DATABASE_URL=<PostgreSQLのInternal Database URL>
   NEXTAUTH_URL=https://hospital-chat-app.onrender.com
   NEXTAUTH_SECRET=<ランダムな文字列>
   NEXT_PUBLIC_WS_URL=wss://hospital-chat-websocket.onrender.com
   NODE_ENV=production
   ```

5. "Create Web Service"をクリック

#### 3. WebSocket サーバーをデプロイ

1. **New → Web Service**を選択
2. 同じリポジトリを接続
3. 設定:

   - Name: `hospital-chat-websocket`
   - Region: `Oregon (US West)`
   - Branch: `main`
   - Runtime: `Docker`
   - Dockerfile Path: `./Dockerfile.websocket`
   - Plan: `Free`

4. 環境変数を設定:

   ```
   DATABASE_URL=<PostgreSQLのInternal Database URL>
   WS_PORT=3001
   NODE_ENV=production
   ```

5. "Create Web Service"をクリック

#### 4. シードデータを投入（オプション）

デプロイ後、Render のシェルから実行:

```bash
npx tsx scripts/seed-multi-tenant.ts
```

## 環境変数の生成

### NEXTAUTH_SECRET

ランダムな文字列を生成:

```bash
openssl rand -base64 32
```

## トラブルシューティング

### データベース接続エラー

- `DATABASE_URL`が正しく設定されているか確認
- Render の PostgreSQL の"Internal Database URL"を使用（External URL ではない）

### WebSocket 接続エラー

- `NEXT_PUBLIC_WS_URL`が正しい WebSocket サービスの URL を指しているか確認
- `wss://`プロトコルを使用（`ws://`ではない）

### マイグレーションエラー

Render のシェルから手動でマイグレーション:

```bash
npx prisma migrate deploy
```

## 無料プランの制限

Render の無料プランには以下の制限があります:

- **スリープ**: 15 分間アクセスがないとサービスがスリープ
- **起動時間**: スリープから復帰に 30 秒〜1 分かかる
- **データベース**: 90 日後に削除される
- **帯域幅**: 月 100GB

## 本番環境への移行

本番環境では以下を推奨:

1. **有料プラン**に変更（スリープなし）
2. **カスタムドメイン**の設定
3. **環境変数の適切な管理**
4. **バックアップ**の設定
5. **モニタリング**の設定

## 参考リンク

- [Render Documentation](https://render.com/docs)
- [Render Blueprint Spec](https://render.com/docs/blueprint-spec)
- [Next.js on Render](https://render.com/docs/deploy-nextjs-app)
