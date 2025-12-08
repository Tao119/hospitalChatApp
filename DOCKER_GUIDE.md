# Docker 起動ガイド

## 🐳 Docker で全てを起動

すべてのサービス（PostgreSQL、Next.js、WebSocket）を Docker で起動できます。

## クイックスタート

### 1. 一括起動（推奨）

```bash
./docker-start.sh
```

このスクリプトは以下を自動で実行します：

- 既存のコンテナを停止
- Docker イメージをビルド
- すべてのコンテナを起動
- 起動状況を表示

### 2. 手動起動

```bash
# イメージをビルド
docker compose build

# コンテナを起動
docker compose up -d

# ログを確認
docker compose logs -f
```

### 3. データベース初期化

初回起動時、またはデータをリセットしたい場合：

```bash
# シードデータを投入
docker compose exec app npx tsx scripts/seed-multi-tenant.ts
```

## サービス構成

### 起動されるコンテナ

| サービス  | ポート | 説明                     |
| --------- | ------ | ------------------------ |
| app       | 3000   | Next.js アプリケーション |
| websocket | 3001   | WebSocket サーバー       |
| postgres  | 5432   | PostgreSQL データベース  |

### アクセス方法

- **アプリケーション**: http://localhost:3000
- **ログイン**: http://localhost:3000/login
- **データベース**: postgresql://postgres:postgres@localhost:5432/hospital_chat

## 基本操作

### コンテナの起動

```bash
docker compose up -d
```

### コンテナの停止

```bash
docker compose down
```

### コンテナの再起動

```bash
docker compose restart
```

### ログの確認

```bash
# すべてのログ
docker compose logs -f

# 特定のサービスのログ
docker compose logs -f app
docker compose logs -f websocket
docker compose logs -f postgres
```

### コンテナの状態確認

```bash
docker compose ps
```

### コンテナ内でコマンド実行

```bash
# アプリコンテナ内でコマンド実行
docker compose exec app npm run build

# データベースに接続
docker compose exec postgres psql -U postgres -d hospital_chat
```

## データ管理

### データベースのリセット

```bash
# コンテナとボリュームを削除
docker compose down -v

# 再起動
docker compose up -d

# シードデータを投入
docker compose exec app npx tsx scripts/seed-multi-tenant.ts
```

### マイグレーション

```bash
# マイグレーションを実行
docker compose exec app npx prisma migrate deploy

# 新しいマイグレーションを作成
docker compose exec app npx prisma migrate dev --name migration_name
```

### バックアップ

```bash
# データベースをバックアップ
docker compose exec postgres pg_dump -U postgres hospital_chat > backup.sql

# バックアップから復元
docker compose exec -T postgres psql -U postgres hospital_chat < backup.sql
```

## トラブルシューティング

### ポートが既に使用されている

```bash
# ポート3000を使用しているプロセスを確認
lsof -i :3000

# プロセスを停止
kill <PID>
```

### コンテナが起動しない

```bash
# ログを確認
docker compose logs

# コンテナを再ビルド
docker compose build --no-cache
docker compose up -d
```

### データベース接続エラー

```bash
# データベースコンテナの状態を確認
docker compose ps postgres

# データベースログを確認
docker compose logs postgres

# データベースコンテナを再起動
docker compose restart postgres
```

### ディスク容量不足

```bash
# 未使用のDockerリソースをクリーンアップ
docker system prune -af --volumes

# ディスク使用状況を確認
docker system df
```

### コンテナ内でエラーが発生

```bash
# コンテナ内に入る
docker compose exec app sh

# 依存関係を再インストール
docker compose exec app npm ci

# Prisma Clientを再生成
docker compose exec app npx prisma generate
```

## 開発時のヒント

### ホットリロード

Docker コンテナ内でもホットリロードが動作します。
ソースコードを変更すると自動的に反映されます。

### 環境変数の変更

`.env`ファイルを変更した場合は、コンテナを再起動してください：

```bash
docker compose restart
```

### パッケージの追加

```bash
# パッケージを追加
docker compose exec app npm install <package-name>

# イメージを再ビルド
docker compose build app
docker compose up -d
```

## 本番環境への移行

### 本番用 Dockerfile の作成

現在の Dockerfile は開発環境用です。本番環境では以下の変更が必要です：

1. `next.config.js`で`output: 'standalone'`を有効化
2. マルチステージビルドで最適化
3. 環境変数の適切な管理
4. ヘルスチェックの追加

### Docker Compose の本番設定

```yaml
# docker-compose.prod.yml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
    restart: always
```

## テストアカウント

### 東京病院

- **医師**: doctor@tokyo001.com / password123
- **看護師**: nurse@tokyo001.com / password123
- **薬剤師**: pharmacist@tokyo001.com / password123
- **管理者**: admin@tokyo001.com / password123

### スーパー管理者

- **スーパー管理者**: super@provider.com / password123

## 参考リンク

- [Docker Compose ドキュメント](https://docs.docker.com/compose/)
- [Next.js Docker デプロイ](https://nextjs.org/docs/deployment#docker-image)
- [Prisma Docker ガイド](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker)

## サポート

問題が発生した場合は、以下を確認してください：

1. Docker が正常に動作しているか
2. ポートが他のプロセスで使用されていないか
3. ディスク容量が十分にあるか
4. ログにエラーメッセージがないか

それでも解決しない場合は、`docker compose logs`の出力を共有してください。
