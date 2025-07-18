# MoteTalk - AI恋愛会話アシスタント

マッチングアプリ専用のAI会話アシスタント。相手のメッセージに最適な返信を3つ提案します。

## 🚀 機能

- **AI返信生成**: Gemini-2.0-Flash-001を使用した自然な返信提案
- **連続対話サポート**: 会話履歴を記憶した文脈理解
- **テンプレート集**: シーン別の効果的なメッセージテンプレート
- **サブスクリプション**: Stripe決済による月額プラン
- **買い切りテンプレート**: 一度購入すれば永続利用可能

## 🔧 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env`ファイルを作成し、以下のAPIキーを設定してください：

```env
# Gemini API設定
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Stripe設定
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here

# Firebase設定
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
# アプリケーション設定
VITE_APP_URL=http://localhost:5173
```

### 3. APIキーの取得方法

#### Gemini API キー
1. [Google AI Studio](https://makersuite.google.com/app/apikey)にアクセス
2. 「Create API Key」をクリック
3. 生成されたキーを`VITE_GEMINI_API_KEY`に設定

#### Stripe API キー
1. [Stripe Dashboard](https://dashboard.stripe.com/apikeys)にアクセス
2. 「Publishable key」を`VITE_STRIPE_PUBLISHABLE_KEY`に設定
3. 「Secret key」を`STRIPE_SECRET_KEY`に設定

#### Firebase設定
1. [Firebase Console](https://console.firebase.google.com/)でプロジェクト作成
2. **Authentication機能を有効化**
   - 左メニュー > Authentication をクリック
   - 「始める」ボタンをクリック
3. **Googleサインインを有効化**
   - Authentication > Sign-in method タブ
   - 「Google」をクリック
   - 「有効にする」をオンにする
   - プロジェクトのサポートメール（あなたのGmailアドレス）を入力
   - 「保存」をクリック
4. **承認済みドメインを追加**
   - Authentication > Settings > 承認済みドメイン
   - `localhost` が含まれていることを確認
   - **開発環境**: WebContainer環境の場合、表示されるドメインを追加
     - 例: `*.webcontainer-api.io` または具体的なドメイン
5. プロジェクト設定 > 全般 > マイアプリ > Firebase SDK snippet > 構成
6. 表示された設定値を上記の環境変数に設定

### 4. 開発サーバーの起動

```bash
npm run dev
```

## 🧪 開発環境でのテスト

### Stripe決済テスト
```bash
# 1. Stripe決済機能のテスト
npm run test:payments

# 2. Webhookリスニング開始（別ターミナル）
npm run test:stripe

# 3. フルスタック開発サーバー起動（別ターミナル）
npm run dev:full
```

### テスト手順
1. `npm run test:payments` でテスト用決済URLを生成
2. `npm run test:stripe` でWebhookリスニングを開始
3. 生成されたURLで実際の決済テストを実行
4. Webhookイベントの受信を確認

## 📁 ファイル構成

### APIサービス
- `src/services/geminiService.ts` - Gemini API統合
- `src/services/stripeService.ts` - Stripe決済統合

### 主要コンポーネント
- `src/components/Dashboard.tsx` - AI返信生成画面
- `src/components/Templates.tsx` - テンプレート管理
- `src/components/Pricing.tsx` - 料金プラン
- `src/components/MyPage.tsx` - ユーザー設定
- `src/components/AuthModal.tsx` - 認証モーダル

### 設定ファイル
- `.env` - 環境変数（要作成）
- `.env.example` - 環境変数のテンプレート

## 🔑 必要なAPIキー設定箇所

### 1. Gemini API キー
**ファイル**: `.env`
**変数名**: `VITE_GEMINI_API_KEY`
**使用箇所**: `src/services/geminiService.ts`

### 2. Stripe Publishable キー
**ファイル**: `.env`
**変数名**: `VITE_STRIPE_PUBLISHABLE_KEY`
**使用箇所**: `src/services/stripeService.ts`

### 3. Stripe Secret キー
**ファイル**: `.env`
**変数名**: `STRIPE_SECRET_KEY`
**使用箇所**: バックエンドAPI（要実装）

## 🛠️ 次のステップ

1. **バックエンドAPI実装**
   - Stripe Webhook処理
   - ユーザー認証システム
   - 購入履歴管理

2. **Google OAuth統合**
   - Firebase Authenticationの設定
   - ユーザー情報の永続化

3. **データベース設計**
   - ユーザー情報
   - 購入履歴
   - 会話履歴

## 📞 サポート

ご不明な点がございましたら、開発チームまでお気軽にお問い合わせください。