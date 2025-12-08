# 技術アーキテクチャ設計書

## 1. システム構成

### 1.1 全体アーキテクチャ

```
┌─────────────────┐    ┌─────────────────┐
│   Client (PC)   │    │   Client (PC)   │
│   Web Browser   │    │   Web Browser   │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          └──────────┬───────────┘
                     │ HTTP/WebSocket
          ┌──────────▼───────────┐
          │    Next.js Server    │
          │  ┌─────────────────┐ │
          │  │  API Routes     │ │
          │  │  - /api/auth    │ │
          │  │  - /api/channels│ │
          │  │  - /api/messages│ │
          │  └─────────────────┘ │
          └──────────┬───────────┘
                     │
          ┌──────────▼───────────┐
          │  WebSocket Server    │
          │  (Port: 3001)        │
          └──────────┬───────────┘
                     │
          ┌──────────▼───────────┐
          │   PostgreSQL DB      │
          │   (Docker Container) │
          └──────────────────────┘
```

### 1.2 技術スタック

```yaml
Frontend:
  - Next.js 14 (App Router)
  - React 18
  - TypeScript
  - TailwindCSS
  - Lucide React (アイコン)

Backend:
  - Next.js API Routes
  - NextAuth.js (認証)
  - Prisma (ORM)
  - WebSocket (ws)

Database:
  - PostgreSQL 15
  - Docker Compose

Development:
  - Docker & Docker Compose
  - TSX (TypeScript実行)
  - ESLint & Prettier
```

## 2. データベース設計

### 2.1 ER 図

```
User ──┐
       │
       ├── ChannelMember ── Channel ── Patient
       │                      │
       ├── Message ────────── Thread
       │     │
       ├── ReadReceipt ──────┘
       │
       └── Mention ──────────┘
```

### 2.2 主要テーブル

#### Users（ユーザー）

```sql
id: String (CUID)
email: String (UNIQUE)
name: String
password: String (ハッシュ化)
role: UserRole (DOCTOR, NURSE, PHARMACIST, etc.)
createdAt: DateTime
updatedAt: DateTime
```

#### Patients（患者）

```sql
id: String (CUID)
patientId: String (UNIQUE) -- 病院の患者ID
name: String
isActive: Boolean
createdAt: DateTime
updatedAt: DateTime
```

#### Channels（チャンネル）

```sql
id: String (CUID)
patientId: String (FK to Patient)
isArchived: Boolean
createdAt: DateTime
updatedAt: DateTime
```

#### Threads（スレッド）

```sql
id: String (CUID)
channelId: String (FK to Channel)
title: String
isActive: Boolean
priority: Priority (LOW, NORMAL, HIGH, URGENT)
tags: String[] (配列)
createdAt: DateTime
updatedAt: DateTime
```

#### Messages（メッセージ）

```sql
id: String (CUID)
threadId: String (FK to Thread)
userId: String (FK to User)
content: String
type: MessageType (TEXT, FILE, IMAGE, TODO, PAGE)
fileUrl: String? (オプション)
isEdited: Boolean
isDeleted: Boolean
createdAt: DateTime
updatedAt: DateTime
```

## 3. API 設計

### 3.1 認証 API

```typescript
POST /api/auth/signin
Request: { email: string, password: string }
Response: { user: User, token: string }

GET /api/auth/session
Response: { user: User | null }

POST /api/auth/signout
Response: { success: boolean }
```

### 3.2 チャンネル API

```typescript
GET /api/channels
Response: Channel[]
- ユーザーが参加するチャンネル一覧
- 患者情報、スレッド情報を含む

GET /api/channels/{channelId}
Response: Channel
- 特定チャンネルの詳細情報

POST /api/channels
Request: { patientId: string, memberIds: string[] }
Response: Channel
- 新規チャンネル作成
```

### 3.3 スレッド API

```typescript
GET /api/threads/{threadId}
Response: Thread
- スレッド詳細情報

POST /api/threads
Request: {
  channelId: string,
  title: string,
  priority: Priority,
  tags: string[]
}
Response: Thread
- 新規スレッド作成

PUT /api/threads/{threadId}
Request: { title?: string, priority?: Priority, tags?: string[] }
Response: Thread
- スレッド更新
```

### 3.4 メッセージ API

```typescript
GET /api/threads/{threadId}/messages
Query: { page?: number, limit?: number }
Response: { messages: Message[], total: number }
- スレッドのメッセージ一覧（ページネーション）

POST /api/threads/{threadId}/messages
Request: { content: string, mentions?: string[] }
Response: Message
- 新規メッセージ送信

PUT /api/messages/{messageId}
Request: { content: string }
Response: Message
- メッセージ編集

DELETE /api/messages/{messageId}
Response: { success: boolean }
- メッセージ削除（論理削除）
```

## 4. WebSocket 設計

### 4.1 接続管理

```typescript
// 接続時
//localhost:3001?userId={userId}

// クライアント管理
ws: interface Client {
  ws: WebSocket;
  userId: string;
  channelIds: Set<string>;
}
```

### 4.2 メッセージ仕様

#### 送信メッセージ

```typescript
interface WSMessage {
  type: 'join_channel' | 'leave_channel' | 'message' | 'mention' | 'typing'
  channelId?: string
  threadId?: string
  data?: any
}

// チャンネル参加
{
  type: 'join_channel',
  channelId: 'channel_id'
}

// メッセージ送信
{
  type: 'message',
  channelId: 'channel_id',
  data: Message
}

// メンション
{
  type: 'mention',
  mentionedUserId: 'user_id',
  data: Message
}
```

#### 受信メッセージ

```typescript
interface WSResponse {
  type: 'message' | 'mention' | 'read' | 'typing'
  data: any
}

// 新規メッセージ
{
  type: 'message',
  data: Message
}

// メンション通知
{
  type: 'mention',
  data: Message
}
```

### 4.3 配信ロジック

```typescript
// チャンネル内配信
function broadcastToChannel(
  channelId: string,
  message: any,
  excludeUserId?: string
) {
  clients.forEach((client, userId) => {
    if (client.channelIds.has(channelId) && userId !== excludeUserId) {
      client.ws.send(JSON.stringify(message));
    }
  });
}

// 特定ユーザーへの配信
function sendToUser(userId: string, message: any) {
  const client = clients.get(userId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message));
  }
}
```

## 5. フロントエンド設計

### 5.1 コンポーネント構成

```
src/
├── app/
│   ├── layout.tsx (ルートレイアウト)
│   ├── page.tsx (ホーム)
│   ├── login/page.tsx (ログイン)
│   ├── chat/
│   │   ├── layout.tsx (チャットレイアウト)
│   │   └── page.tsx (チャットメイン)
│   └── api/ (APIルート)
├── components/
│   ├── ChannelSidebar.tsx (チャンネル一覧)
│   ├── ThreadList.tsx (スレッド一覧)
│   ├── ChatArea.tsx (メッセージエリア)
│   └── MessageInput.tsx (入力エリア)
├── hooks/
│   ├── useWebSocket.ts (WebSocket管理)
│   ├── useAuth.ts (認証管理)
│   └── useMessages.ts (メッセージ管理)
├── lib/
│   ├── auth.ts (NextAuth設定)
│   ├── prisma.ts (Prisma設定)
│   └── utils.ts (ユーティリティ)
└── types/
    └── index.ts (型定義)
```

### 5.2 状態管理

```typescript
// React Hooks + Context API
interface ChatState {
  channels: Channel[];
  selectedChannelId: string | null;
  selectedThreadId: string | null;
  messages: Message[];
  isConnected: boolean;
}

// カスタムフック
const useChat = () => {
  const [state, setState] = useState<ChatState>();
  // WebSocket接続、メッセージ管理
};
```

### 5.3 リアルタイム更新

```typescript
// WebSocketメッセージ受信時
useEffect(() => {
  if (lastMessage?.type === "message") {
    setMessages((prev) => [...prev, lastMessage.data]);
  }
  if (lastMessage?.type === "mention") {
    showNotification(lastMessage.data);
  }
}, [lastMessage]);
```

## 6. セキュリティ設計

### 6.1 認証・認可

```typescript
// NextAuth.js設定
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      authorize: async (credentials) => {
        // パスワード検証（bcrypt）
        // ユーザー情報返却
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) token.id = user.id;
      return token;
    },
    session: ({ session, token }) => {
      session.user.id = token.id;
      return session;
    },
  },
};
```

### 6.2 API 保護

```typescript
// ミドルウェア
export async function middleware(request: NextRequest) {
  const session = await getToken({ req: request });

  if (!session && request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
```

### 6.3 WebSocket 認証

```typescript
// 接続時認証
wss.on("connection", (ws, req) => {
  const { query } = parse(req.url || "", true);
  const userId = query.userId as string;

  // ユーザー検証
  if (!isValidUser(userId)) {
    ws.close();
    return;
  }
});
```

## 7. デプロイメント

### 7.1 開発環境

```yaml
# docker-compose.yml
version: "3.8"
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: hospital_chat
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 7.2 本番環境（将来）

```yaml
# VPN対応
- 院内ネットワーク限定アクセス
- HTTPS通信必須
- WebSocket Secure (WSS)
- 環境変数による設定管理

# スケーリング
- Next.js アプリケーションの複数インスタンス
- WebSocketサーバーのクラスタリング
- Redis による WebSocket セッション管理
- PostgreSQL の読み取りレプリカ
```

## 8. 監視・ログ

### 8.1 ログ設計

```typescript
// アプリケーションログ
- ユーザーログイン/ログアウト
- メッセージ送受信
- WebSocket接続/切断
- エラー発生

// パフォーマンスログ
- API レスポンス時間
- WebSocket メッセージ配信時間
- データベースクエリ時間
```

### 8.2 メトリクス

```yaml
監視項目:
  - 同時接続ユーザー数
  - メッセージ送信頻度
  - API エラー率
  - WebSocket 切断率
  - データベース接続数
```
