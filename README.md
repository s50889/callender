# 🗓️ Awesome Company Calendar

最高でかっこいい社内カレンダーアプリ！チームの予定を共有して効率的なコラボレーションを実現しましょう。

## ✨ 特徴

- 📅 **3つのビューモード**: 月表示、週表示、日表示
- 👥 **チーム管理**: メンバー追加・編集・削除
- 🎨 **カテゴリ別色分け**: 会議、個人、プロジェクトなど
- 🔍 **フィルタリング**: ユーザーやカテゴリで絞り込み
- 🔄 **リアルタイム同期**: Firebase Firestoreによる即座な更新
- 🔐 **認証機能**: Firebase Authによる安全なログイン
- 📱 **レスポンシブ**: モバイル・デスクトップ対応
- 🎯 **ドラッグ&ドロップ**: 直感的なイベント操作

## 🚀 技術スタック

- **フロントエンド**: React 18 + TypeScript + Vite
- **状態管理**: Zustand
- **バックエンド**: Firebase (Auth + Firestore)
- **スタイリング**: Tailwind CSS
- **アイコン**: Lucide React
- **日付操作**: date-fns

## 📦 セットアップ

### 1. プロジェクトのクローン

```bash
git clone <repository-url>
cd awesome-company-calendar
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. Firebase プロジェクトの設定

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 新しいプロジェクトを作成
3. **Authentication** を有効化
   - 「Sign-in method」でメール/パスワード認証を有効化
4. **Firestore Database** を作成
   - テストモードで開始（後でセキュリティルールを設定）

### 4. Firebase 設定の取得

1. Firebase Console の「プロジェクト設定」→「全般」タブ
2. 「ウェブアプリを追加」をクリック
3. 設定情報をコピー

### 5. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成：

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 6. Firestore セキュリティルールの設定

Firebase Console の Firestore で以下のルールを設定：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 認証済みユーザーのみアクセス可能
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // 組織レベルでのデータ分離
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.authId;
    }
    
    match /events/{eventId} {
      allow read, write: if request.auth != null &&
        exists(/databases/$(database)/documents/users/$(request.auth.uid));
    }
    
    match /organizations/{orgId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.ownerAuthId;
    }
  }
}
```

### 7. アプリケーションの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` にアクセス

## 🎯 使い方

### 初回セットアップ

1. アプリにアクセスしてアカウントを作成
2. 組織が自動的に作成されます
3. チームメンバーを追加
4. イベントを作成開始！

### デモアカウント

すぐに試したい場合は、以下のデモアカウントを使用：

- **Email**: demo@company.com
- **Password**: demo123

### 基本操作

- **イベント作成**: 「新規イベント」ボタンまたは日付セルをクリック
- **イベント編集**: イベントをクリックして編集
- **ビュー切り替え**: ヘッダーの「月/週/日」ボタン
- **フィルタリング**: サイドバーでユーザーやカテゴリを選択
- **チーム管理**: サイドバーの「+」アイコンでメンバー追加

## 🏗️ データベース構造

### Collections

#### `users`
```typescript
{
  id: string,
  name: string,
  email: string,
  department: string,
  position: string,
  color: string,
  organizationId: string,
  authId: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `events`
```typescript
{
  id: string,
  title: string,
  description?: string,
  startDate: Timestamp,
  endDate: Timestamp,
  allDay: boolean,
  userId: string,
  attendees: string[],
  location?: string,
  color: string,
  category: EventCategory,
  organizationId: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `organizations`
```typescript
{
  id: string,
  name: string,
  ownerAuthId: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 🔧 開発

### 利用可能なスクリプト

```bash
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド
npm run preview  # 本番ビルドのプレビュー
npm run lint     # ESLintによる静的解析
```

### ディレクトリ構造

```
src/
├── components/          # Reactコンポーネント
│   ├── views/          # カレンダービュー
│   ├── CalendarHeader.tsx
│   ├── Sidebar.tsx
│   ├── EventModal.tsx
│   ├── UserModal.tsx
│   └── LoginPage.tsx
├── config/             # 設定ファイル
│   └── firebase.ts
├── services/           # ビジネスロジック
│   ├── authService.ts
│   └── firestoreService.ts
├── store/              # 状態管理
│   └── calendarStore.ts
├── types/              # TypeScript型定義
│   └── index.ts
├── utils/              # ユーティリティ
│   └── dateUtils.ts
└── App.tsx
```

## 🚀 デプロイ

### Firebase Hosting へのデプロイ

1. Firebase CLI のインストール
```bash
npm install -g firebase-tools
```

2. Firebase にログイン
```bash
firebase login
```

3. プロジェクトの初期化
```bash
firebase init hosting
```

4. ビルドとデプロイ
```bash
npm run build
firebase deploy
```

## 🤝 コントリビューション

1. フォークする
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. コミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🙏 謝辞

- [React](https://reactjs.org/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [date-fns](https://date-fns.org/)

---

作成者: Your Name  
バージョン: 1.0.0  
最終更新: 2024年12月 