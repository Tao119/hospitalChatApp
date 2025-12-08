# デモ開始手順

## 現在の状態

✅ PostgreSQL データベース: 起動中
✅ Next.js サーバー: http://localhost:3000 で起動中
✅ WebSocket サーバー: ws://localhost:3001 で起動中
✅ テストデータ: 投入済み

## すぐに始める

### 1 台の PC でテスト

1. ブラウザを開く
2. http://localhost:3000/login にアクセス
3. 以下でログイン：
   ```
   メールアドレス: doctor@tokyo001.com
   パスワード: password123
   ```
4. チャット画面が表示される
5. 左サイドバーで「田中太郎 (P001)」を選択
6. 中央で「入院時対応」スレッドを選択
7. メッセージを送信してみる

### 2 台の PC でリアルタイムテスト

#### PC1（または通常のブラウザ）

1. http://localhost:3000/login にアクセス
2. `doctor@tokyo001.com` / `password123` でログイン
3. 「田中太郎 (P001)」→「入院時対応」を選択

#### PC2（または同じ PC のシークレットモード）

1. **シークレットモード/プライベートブラウジング**で http://localhost:3000/login にアクセス
2. `nurse@tokyo001.com` / `password123` でログイン
3. 「田中太郎 (P001)」→「入院時対応」を選択

#### リアルタイム確認

- PC1 からメッセージを送信 → PC2 で即座に表示される
- PC2 からメッセージを送信 → PC1 で即座に表示される

## 利用可能なアカウント

### 東京病院のユーザー

| 役割   | メールアドレス          | パスワード  | 名前       |
| ------ | ----------------------- | ----------- | ---------- |
| 医師   | doctor@tokyo001.com     | password123 | 山田太郎   |
| 看護師 | nurse@tokyo001.com      | password123 | 佐藤花子   |
| 薬剤師 | pharmacist@tokyo001.com | password123 | 鈴木一郎   |
| 管理者 | admin@tokyo001.com      | password123 | 病院管理者 |

### スーパー管理者

| 役割           | メールアドレス     | パスワード  | 名前           |
| -------------- | ------------------ | ----------- | -------------- |
| スーパー管理者 | super@provider.com | password123 | スーパー管理者 |

## テストデータ

### 患者

- 田中太郎 (P001)
  - スレッド: 入院時対応（優先度: HIGH）
  - スレッド: 薬剤管理（優先度: NORMAL）
- 佐藤花子 (P002)
- 鈴木次郎 (P003)

## 主要機能

### 基本機能

- ✅ リアルタイムメッセージング
- ✅ 患者ごとのチャンネル
- ✅ スレッド管理
- ✅ メンション機能（@ユーザー名）
- ✅ ファイル添付
- ✅ 画像プレビュー

### 拡張機能

- ✅ 検索機能（Ctrl/Cmd + K）
- ✅ 既読管理
- ✅ タイピングインジケーター
- ✅ 未読バッジ
- ✅ マルチテナント対応

### 管理機能

- ✅ ユーザー管理（管理者）
- ✅ 組織管理（スーパー管理者）
- ✅ 病棟管理（管理者）

## トラブルシューティング

### サーバーが起動していない

```bash
# Next.jsサーバーを起動
npm run dev

# WebSocketサーバーを起動（別ターミナル）
npm run ws:dev
```

### データベースが起動していない

```bash
# Dockerコンテナを起動
docker compose up -d
```

### データをリセットしたい

```bash
# データベースをリセット
npx prisma migrate reset --force

# シードデータを再投入
npx tsx scripts/seed-multi-tenant.ts
```

### ログインできない

```bash
# ユーザーが存在するか確認
psql postgresql://postgres:password@localhost:5432/hospital_chat -c "SELECT email, name FROM \"User\" WHERE email = 'doctor@tokyo001.com';"
```

### リアルタイム更新が動作しない

1. ブラウザの開発者ツール（F12）を開く
2. Console タブでエラーを確認
3. Network タブで WebSocket 接続を確認（WS フィルター）

## 次のステップ

基本的な動作確認ができたら：

1. `DEMO_GUIDE.md` - 詳細なデモシナリオ
2. `QUICK_TEST.md` - クイックテストガイド
3. `TEST_ACCOUNTS.md` - アカウント情報の詳細

## 開発者向け

### ログの確認

```bash
# Next.jsサーバーのログ
# ターミナル1を確認

# WebSocketサーバーのログ
# ターミナル2を確認

# データベースのログ
docker compose logs -f postgres
```

### API エンドポイント

- `GET /api/channels` - チャンネル一覧
- `GET /api/threads/{threadId}/messages` - メッセージ一覧
- `POST /api/threads/{threadId}/messages` - メッセージ送信
- `GET /api/search` - 検索
- `GET /api/admin/users` - ユーザー管理（管理者のみ）

### WebSocket イベント

- `join_channel` - チャンネルに参加
- `leave_channel` - チャンネルから退出
- `message` - メッセージ送信
- `typing` - タイピング中
- `read` - 既読通知

## 成功基準

- [ ] ログインできる
- [ ] チャンネル一覧が表示される
- [ ] メッセージを送受信できる
- [ ] 2 台の PC でリアルタイムに同期される
- [ ] メンション機能が動作する
- [ ] ファイル添付ができる
- [ ] 検索機能が動作する

すべてチェックできたら、デモの準備完了です！
