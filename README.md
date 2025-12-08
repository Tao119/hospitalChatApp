# 院内チャットツール

Discord 風の UI を持つ院内用リアルタイムチャットアプリケーション

## 🎯 MVP（Ver.0.1）完成！

すべての必須機能が実装され、デモ実行の準備が整っています。

## ✨ 実装済み機能

### 基本機能

- ✅ 患者ごとのチャンネル
- ✅ スレッド機能（タイトル、タグ、優先度）
- ✅ リアルタイムメッセージング（WebSocket）
- ✅ メンション機能（@ユーザー名）
- ✅ 既読/未読管理
- ✅ 通知機能（未読バッジ）
- ✅ ファイル・画像アップロード
- ✅ 検索機能（Ctrl/Cmd + K）
- ✅ タイピングインジケーター

### マルチテナント機能

- ✅ 組織管理（複数病院対応）
- ✅ 病棟管理
- ✅ ユーザー管理
- ✅ 役割ベースのアクセス制御

### 管理機能

- ✅ スーパー管理者画面
- ✅ 病院管理者画面
- ✅ ユーザー設定

### 技術スタック

- **Frontend**: Next.js 14, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma
- **Real-time**: WebSocket (ws)
- **Authentication**: NextAuth.js
- **AI**: Claude API（実装予定）

## 🚀 クイックスタート

### 方法 1: Docker（推奨）

すべてのサービスを Docker で起動：

\`\`\`bash

# 一括起動

./docker-start.sh

# または手動で

docker compose up -d

# シードデータを投入

docker compose exec app npx tsx scripts/seed-multi-tenant.ts
\`\`\`

詳細は `DOCKER_GUIDE.md` を参照してください。

### 方法 2: ローカル開発

#### 1. 依存関係のインストール

\`\`\`bash
npm install
\`\`\`

#### 2. データベースの起動

\`\`\`bash
docker compose up -d postgres
\`\`\`

#### 3. データベースのセットアップ

\`\`\`bash
npx prisma migrate dev --name init
npx tsx scripts/seed-multi-tenant.ts
\`\`\`

#### 4. アプリケーションの起動

2 つのターミナルで以下を実行：

**ターミナル 1: Next.js サーバー**
\`\`\`bash
npm run dev
\`\`\`

**ターミナル 2: WebSocket サーバー**
\`\`\`bash
npm run ws:dev
\`\`\`

#### 5. システムチェック

\`\`\`bash
./check-system.sh
\`\`\`

### アクセス

http://localhost:3000/login にアクセス

## 👥 テストアカウント

### 東京病院

- **医師**: doctor@tokyo001.com / password123
- **看護師**: nurse@tokyo001.com / password123
- **薬剤師**: pharmacist@tokyo001.com / password123
- **管理者**: admin@tokyo001.com / password123

### スーパー管理者

- **スーパー管理者**: super@provider.com / password123

詳細は `TEST_ACCOUNTS.md` を参照してください。

## プロジェクト構造

\`\`\`
hospital-chat/
├── prisma/ # Prisma スキーマ
├── scripts/ # セットアップスクリプト
├── src/
│ ├── app/ # Next.js App Router
│ │ ├── api/ # API ルート
│ │ ├── chat/ # チャットページ
│ │ └── login/ # ログインページ
│ ├── components/ # React コンポーネント
│ ├── hooks/ # カスタムフック
│ ├── lib/ # ユーティリティ
│ ├── server/ # WebSocket サーバー
│ └── types/ # TypeScript 型定義
└── docker-compose.yml # Docker 設定
\`\`\`

## 📖 ドキュメント

- **START_DEMO.md** - デモ開始手順（最初に読むべき）
- **QUICK_TEST.md** - クイックテストガイド
- **DEMO_GUIDE.md** - 詳細なデモシナリオ
- **TEST_ACCOUNTS.md** - テストアカウント情報
- **IMPLEMENTATION_STATUS.md** - 実装状況の詳細

## 🎬 デモ実行

### 1 台の PC でテスト

1. http://localhost:3000/login にアクセス
2. `doctor@tokyo001.com` / `password123` でログイン
3. チャット画面でメッセージを送信

### 2 台の PC でリアルタイムテスト

1. **PC1**: 通常のブラウザで `doctor@tokyo001.com` でログイン
2. **PC2**: シークレットモードで `nurse@tokyo001.com` でログイン
3. 同じ患者チャンネル・スレッドを開く
4. メッセージを送信してリアルタイム同期を確認

詳細は `START_DEMO.md` を参照してください。

## 🔮 今後の実装予定

### Phase 2: AI 機能

- [ ] ToDo リスト自動生成（Claude API）
- [ ] メッセージ要約

### Phase 3: 電子カルテ連携

- [ ] 自動メンバー登録
- [ ] 自動アーカイブ機能

### Phase 4: モバイル対応

- [ ] PWA 化
- [ ] React Native アプリ

### Phase 5: 追加機能

- [ ] 音声・ビデオ通話
- [ ] メッセージ編集・削除
- [ ] リアクション機能
