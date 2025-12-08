# MVP（Ver.0.1）詳細仕様書

## 1. MVP 概要

### 1.1 目標

営業プレゼンテーション用のデモとして、基本的なチャット機能が動作することを実証する

### 1.2 デモシナリオ

1. 2 台の PC で異なるユーザーとしてログイン
2. 同じ患者チャンネルでメッセージ送受信
3. サイドバーでチャンネル切り替え
4. リアルタイム通知の確認

## 2. 機能仕様

### 2.1 認証機能

```
ログイン画面
├── メールアドレス入力
├── パスワード入力
└── ログインボタン

テストアカウント
├── 医師: doctor@hospital.com / password123
├── 看護師: nurse@hospital.com / password123
└── 薬剤師: pharmacist@hospital.com / password123
```

### 2.2 チャット画面レイアウト

```
チャット画面
├── サイドバー（患者チャンネル一覧）
│   ├── アクティブチャンネル
│   │   ├── 患者名
│   │   ├── 患者ID
│   │   └── 未読件数バッジ
│   └── アーカイブチャンネル
├── スレッド一覧（中央）
│   ├── スレッドタイトル
│   ├── 最終更新時刻
│   ├── メッセージ数
│   └── 優先度表示
└── メッセージエリア（右側）
    ├── メッセージ履歴
    │   ├── 送信者名
    │   ├── 送信時刻
    │   ├── メッセージ内容
    │   └── メンション表示
    └── メッセージ入力欄
        ├── テキスト入力
        ├── メンション機能（@）
        └── 送信ボタン
```

### 2.3 リアルタイム機能

#### WebSocket 通信

- 接続確立時にユーザー ID を送信
- チャンネル参加/離脱の管理
- メッセージの即座配信

#### 通知機能

- 新規メッセージ受信時の画面更新
- 未読件数の自動更新
- メンション時の特別表示

### 2.4 データ構造

#### 患者チャンネル

```typescript
interface Channel {
  id: string;
  patientId: string;
  patient: {
    name: string;
    patientId: string;
  };
  isArchived: boolean;
  members: User[];
  threads: Thread[];
}
```

#### スレッド

```typescript
interface Thread {
  id: string;
  channelId: string;
  title: string;
  isActive: boolean;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  tags: string[];
  messageCount: number;
}
```

#### メッセージ

```typescript
interface Message {
  id: string;
  threadId: string;
  userId: string;
  user: User;
  content: string;
  mentions: User[];
  createdAt: string;
  isEdited: boolean;
}
```

## 3. 技術実装

### 3.1 必要な API

```
GET /api/channels
├── ユーザーが参加するチャンネル一覧を取得
└── スレッド情報も含む

GET /api/threads/{threadId}/messages
├── 指定スレッドのメッセージ履歴を取得
└── ページネーション対応

POST /api/threads/{threadId}/messages
├── 新規メッセージを送信
├── メンション処理
└── WebSocket配信
```

### 3.2 WebSocket 仕様

```typescript
// 送信メッセージ
interface WSMessage {
  type: "join_channel" | "leave_channel" | "message" | "mention";
  channelId?: string;
  threadId?: string;
  data?: any;
}

// 受信メッセージ
interface WSResponse {
  type: "message" | "mention" | "notification";
  data: Message | Notification;
}
```

### 3.3 データベース初期データ

#### テスト患者

```sql
患者1: 田中太郎 (ID: P001)
患者2: 佐藤花子 (ID: P002)
患者3: 鈴木次郎 (ID: P003)
```

#### テストスレッド

```sql
チャンネル1 (田中太郎)
├── 入院時対応 (優先度: HIGH)
├── 薬剤管理 (優先度: NORMAL)
└── 退院準備 (優先度: LOW)
```

## 4. デモ手順

### 4.1 事前準備

1. Docker Compose でデータベース起動
2. シードデータの投入
3. WebSocket サーバー起動
4. Next.js アプリケーション起動

### 4.2 デモ実行

1. **ログイン確認**

   - 2 台の PC で異なるアカウントでログイン
   - チャット画面の表示確認

2. **チャンネル切り替え**

   - サイドバーで患者チャンネルをクリック
   - 画面の切り替わりを確認

3. **メッセージ送受信**

   - 一方の PC からメッセージ送信
   - もう一方の PC でリアルタイム受信確認

4. **メンション機能**

   - @ユーザー名でメンション送信
   - 特別な表示・通知の確認

5. **通知機能**
   - 未読件数の表示
   - 新規メッセージ通知

## 5. 成功基準

### 5.1 必須動作

- [ ] 2 台の PC で同時ログイン可能
- [ ] リアルタイムメッセージ送受信
- [ ] チャンネル切り替え動作
- [ ] メンション機能動作
- [ ] 通知表示

### 5.2 品質基準

- [ ] レスポンス時間: 1 秒以内
- [ ] WebSocket 接続の安定性
- [ ] UI 操作の直感性
- [ ] エラーハンドリング

## 6. 今後の拡張ポイント

### 6.1 短期改善

- メッセージ編集・削除機能
- ファイル添付機能
- 既読・未読管理の詳細化

### 6.2 中期改善

- スレッド管理機能の強化
- 検索機能
- 通知設定のカスタマイズ

### 6.3 長期改善

- AI 機能統合
- 電子カルテ連携
- モバイルアプリ対応
