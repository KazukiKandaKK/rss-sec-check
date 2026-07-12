# RSS Security News Aggregator

個人用のセキュリティニュース・アグリゲーターです。複数のRSSフィードから記事を取得してFirestoreに保存し、Googleサインインで認証された所有者だけが閲覧できるSPAです。

## 技術スタック

- フロントエンド: React + Vite + TypeScript + Tailwind CSS
- 認証: Firebase Authentication（Googleサインイン）
- DB: Cloud Firestore
- バックエンド: Firebase Cloud Functions (2nd gen, TypeScript)
- RSS取得: [`rss-parser`](https://www.npmjs.com/package/rss-parser)
- スケジューリング: `onSchedule`（Cloud Scheduler）
- ホスティング: Firebase Hosting
- ローカル検証: Firebase Emulator Suite

## 前提

- Node.js 22
- Firebase CLI (`npm install -g firebase-tools`)

## プロジェクト構成

```
/
  firebase.json           # Firebase プロジェクト設定
  .firebaserc             # プレースホルダーのプロジェクトID
  firestore.rules         # Firestore セキュリティルール
  firestore.indexes.json  # Firestore インデックス
  .env.example            # 環境変数テンプレート
  /functions              # Cloud Functions (2nd gen)
  /web                    # React + Vite SPA
  /scripts                # seedFeeds.ts / fetchFeeds.ts など
```

## 設定

1. ルートに `.env` を作成し、`.env.example` を参考に設定します。

```bash
cp .env.example .env
```

2. 以下の値を設定してください。

| 環境変数 | 説明 |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Web API キー |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth ドメイン |
| `VITE_FIREBASE_PROJECT_ID` | Firebase プロジェクトID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Cloud Storage バケット |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase メッセージングID |
| `VITE_FIREBASE_APP_ID` | Firebase アプリID |
| `VITE_OWNER_EMAIL` | 所有者のGoogleアカウントメールアドレス |
| `OWNER_EMAIL` | 所有者メール（Functions / seed 用） |
| `GOOGLE_APPLICATION_CREDENTIALS` | 本番Functions用サービスアカウントキーのパス（ローカルでは不要） |

3. `firestore.rules` は `config/owner` ドキュメントの `email` フィールドを参照して所有者判定を行います。`npm run seed` 実行時に `.env` の `OWNER_EMAIL` が `config/owner` ドキュメントに書き込まれます。

## ローカル実行（Firebase Emulator Suite）

1. 依存関係をインストールします。

```bash
npm install
```

2. Functionsをビルドします。

```bash
npm run build:functions
```

3. 初期フィードと所有者情報をFirestoreエミュレータに投入します。

```bash
FIRESTORE_EMULATOR_HOST=localhost:8080 npm run seed
```

4. Webをビルドします。

```bash
npm run build:web
```

5. エミュレータを起動します。

```bash
firebase emulators:start
```

6. ブラウザで `http://localhost:5000` を開き、Google サインインします。エミュレータでは `OWNER_EMAIL` に設定したアカウントでサインインしてください。

7. 記事を取得するには、Functionsの定期関数を手動実行するか、CLIスクリプトを使います。

```bash
FIRESTORE_EMULATOR_HOST=localhost:8080 npm run fetch
```

または、Emulator UI (`http://localhost:4000`) から `fetchRssOnSchedule` を実行できます。

### 備考

- `VITE_USE_EMULATOR=true` を `.env` に設定すると、Webアプリがエミュレータに接続します。
- エミュレータ用に `VITE_FIREBASE_*` はダミー値でも構いません。
- `.firebaserc` はプレースホルダーの `rss-sec-check-placeholder` になっています。本番デプロイ時に実際のプロジェクトIDに変更してください。

## デプロイ手順

本番プロジェクトは `rss-sec-check`（Firestore ロケーション: `asia-northeast1`、Hosting: https://rss-sec-check.web.app）です。

1. Firebase プロジェクトを作成し、`.firebaserc` の `projects.default` を実際のプロジェクトIDに更新します。

```bash
firebase projects:create <project-id>
firebase apps:create WEB <app-name> --project <project-id>
firebase apps:sdkconfig WEB <app-id> --project <project-id>   # .env の VITE_FIREBASE_* に転記
gcloud firestore databases create --database="(default)" --location=asia-northeast1 --project=<project-id>
```

2. プロジェクトを **Blaze プラン**にアップグレードします（Cloud Functions 2nd gen + Cloud Scheduler に必須）。[Google Cloud Console の課金設定](https://console.cloud.google.com/billing) で有効な課金アカウントをプロジェクトに紐付けてください。

3. Firebase Console → Authentication で「始める」を押し、**Google プロバイダ**を有効化してサポートメールを設定します（コンソールから有効化すると OAuth クライアントは自動プロビジョニングされます）。

4. ルート `.env` に Firebase 構成情報と所有者メール（`VITE_OWNER_EMAIL` / `OWNER_EMAIL`）を設定します。

5. 初期フィードと `config/owner` ドキュメントを本番 Firestore に投入します。ローカルの Application Default Credentials（`gcloud auth application-default login`）があればサービスアカウントキーは不要です。

```bash
npm --prefix scripts run seed
```

6. デプロイします（`firestore:rules` / `firestore:indexes` / `functions` / `hosting`）。

```bash
npm --prefix web run lint && npm --prefix web run typecheck && npm --prefix functions run build
firebase deploy
```

`fetchRssOnSchedule`（30分間隔、`FETCH_SCHEDULE_INTERVAL` で変更可）の Cloud Scheduler ジョブは `firebase deploy --only functions` 時に自動作成されます。実行状況は `firebase functions:log` か GCP コンソールで確認できます。

## 著作権上の制約

- 記事本文の全文は保存・表示しません。タイトル、フィード提供の短縮スニペット、原文リンクのみを使用します。
- 常に原典サイトへのリンクを表示します。

## 備考：定期関数のプラン

Cloud Functions の `onSchedule` トリガーと Cloud Scheduler を使用するため、**Blaze プラン（従量課金）が必要**です。無料のSparkプランを維持したい場合は、取得処理を `functions/src/lib/fetchFeeds.ts` を呼び出す GitHub Actions の定期ワークフロー（`firebase-admin` + サービスアカウント）に切り替えられます。

## スクリプト

| スクリプト | 説明 |
|---|---|
| `npm run build:functions` | Cloud Functions を TypeScript からビルド |
| `npm run build:web` | Vite で SPA をビルド |
| `npm run seed` | 初期フィードと所有者情報を Firestore に投入 |
| `npm run fetch` | 有効なフィードを取得して記事を保存 |
| `npm run emulators` | Firebase Emulator Suite を起動 |
