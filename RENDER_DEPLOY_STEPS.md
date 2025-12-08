# Render デプロイ手順（実行ガイド）

## 📋 デプロイ手順

### ステップ 1: Render ダッシュボードにアクセス

1. ブラウザで https://dashboard.render.com を開く
2. GitHub アカウントでログイン

### ステップ 2: Blueprint からデプロイ

1. **New +** ボタンをクリック
2. **Blueprint** を選択
3. **Connect a repository** をクリック
4. `Tao119/hospitalChatApp` を検索して選択
5. **Connect** をクリック

### ステップ 3: 環境変数を設定

Blueprint が検出されたら、以下の環境変数を設定:

#### hospital-chat-app サービス:

```
NEXTAUTH_URL = https://hospital-chat-app.onrender.com
NEXT_PUBLIC_WS_URL = wss://hospital-chat-websocket.onrender.com
```

※ NEXTAUTH_SECRET は自動生成されます

#### hospital-chat-websocket サービス:

環境変数は自動設定されます（変更不要）

### ステップ 4: デプロイを実行

1. **Apply** ボタンをクリック
2. デプロイが開始されます（5-10 分程度）

### ステップ 5: デプロイ状況を確認

以下のサービスが作成されます:

- ✅ **hospital-chat-db** (PostgreSQL)
- ✅ **hospital-chat-app** (Next.js)
- ✅ **hospital-chat-websocket** (WebSocket)

各サービスのログで進行状況を確認できます。

### ステップ 6: シードデータを投入（オプション）

デプロイ完了後、初期データを投入:

1. **hospital-chat-app** サービスを開く
2. **Shell** タブをクリック
3. 以下のコマンドを実行:

```bash
npx tsx scripts/seed-multi-tenant.ts
```

### ステップ 7: アクセス確認

デプロイ完了後、以下の URL にアクセス:

- **アプリ**: https://hospital-chat-app.onrender.com
- **WebSocket**: wss://hospital-chat-websocket.onrender.com

## 🔧 トラブルシューティング

### ビルドエラーが発生した場合

1. **Logs** タブでエラー内容を確認
2. 環境変数が正しく設定されているか確認
3. Dockerfile.render が存在するか確認

### データベース接続エラー

1. DATABASE_URL が正しく設定されているか確認
2. データベースサービスが起動しているか確認
3. Internal Database URL を使用しているか確認

### WebSocket 接続エラー

1. NEXT_PUBLIC_WS_URL が正しいか確認
2. `wss://`プロトコルを使用しているか確認
3. WebSocket サービスが起動しているか確認

## 📝 デプロイ後の確認事項

### テストアカウントでログイン

1. https://hospital-chat-app.onrender.com/login にアクセス
2. 以下のアカウントでログイン:
   - メール: `doctor@tokyo001.com`
   - パスワード: `password123`

### 動作確認

- ✅ ログインできる
- ✅ チャンネル一覧が表示される
- ✅ メッセージを送信できる
- ✅ WebSocket 接続が確立される

## ⚠️ 無料プランの制限

- **スリープ**: 15 分間アクセスがないとスリープ
- **起動時間**: スリープから復帰に 30 秒〜1 分
- **データベース**: 90 日後に削除
- **帯域幅**: 月 100GB

## 🔄 再デプロイ

コードを更新した場合:

1. GitHub に push
2. Render が自動的に再デプロイ
3. または、ダッシュボードから **Manual Deploy** をクリック

## 📊 モニタリング

Render ダッシュボードで以下を確認できます:

- **Logs**: アプリケーションログ
- **Metrics**: CPU、メモリ使用率
- **Events**: デプロイ履歴

## 🎉 デプロイ完了！

デプロイが成功したら、URL を共有してテストしてください！

---

**リポジトリ**: https://github.com/Tao119/hospitalChatApp
**Render ダッシュボード**: https://dashboard.render.com
