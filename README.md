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

2. Firebase Console → Authentication で「始める」を押し、**Google プロバイダ**を有効化してサポートメールを設定します（コンソールから有効化すると OAuth クライアントは自動プロビジョニングされます）。Authentication は Spark プランのまま無料で利用できます。

3. ルート `.env` に Firebase 構成情報と所有者メール（`VITE_OWNER_EMAIL` / `OWNER_EMAIL`）を設定します。

4. 初期フィードと `config/owner` ドキュメントを本番 Firestore に投入します。ローカルの Application Default Credentials（`gcloud auth application-default login`）があればサービスアカウントキーは不要です。

```bash
GOOGLE_CLOUD_QUOTA_PROJECT=<project-id> npm --prefix scripts run seed
```

5. デプロイします（`firestore:rules` / `firestore:indexes` / `hosting`。Spark プランでは `functions` はデプロイできないため除外します）。

```bash
npm --prefix web run lint && npm --prefix web run typecheck && npm --prefix functions run build
firebase deploy --only firestore,hosting
```

## 定期取得（GitHub Actions・無料）

本番の記事取得は Cloud Functions ではなく **GitHub Actions**（`.github/workflows/fetch-feeds.yml`、毎日 JST 6:00 実行）で行います。Spark プラン（無料）のままで動作します。

セットアップ:

1. Firestore 書き込み権限（`roles/datastore.user`）を持つサービスアカウントを作成し、JSON キーを発行します。

```bash
gcloud iam service-accounts create rss-fetch-bot --project=<project-id>
gcloud projects add-iam-policy-binding <project-id> \
  --member="serviceAccount:rss-fetch-bot@<project-id>.iam.gserviceaccount.com" \
  --role="roles/datastore.user"
gcloud iam service-accounts keys create ./service-account-rss-fetch.json \
  --iam-account=rss-fetch-bot@<project-id>.iam.gserviceaccount.com
```

2. キー JSON の中身全体を GitHub リポジトリの Secret **`FIREBASE_SERVICE_ACCOUNT`** に登録します（Settings → Secrets and variables → Actions）。キーファイル自体はコミットしないでください（`.gitignore` 済み）。

3. ワークフローは毎日 JST 6:00（UTC 21:07）に実行されます。手動実行は Actions タブの「Fetch RSS feeds」→ Run workflow から行えます。

### Blaze プランに移行する場合

課金を有効化（Blaze）すれば、同梱の Cloud Functions `fetchRssOnSchedule`（30分間隔、`FETCH_SCHEDULE_INTERVAL` で変更可）に切り替えられます。`firebase deploy --only functions` で Cloud Scheduler ジョブが自動作成されます。その場合は GitHub Actions ワークフローを無効化してください。

## 著作権上の制約

- 記事本文の全文は保存・表示しません。タイトル、フィード提供の短縮スニペット、原文リンクのみを使用します。
- 常に原典サイトへのリンクを表示します。

## 備考：定期関数のプラン

Cloud Functions の `onSchedule` トリガーと Cloud Scheduler は **Blaze プラン（従量課金）が必要**なため、本番では Spark プランのまま GitHub Actions で定期取得しています（上記「定期取得（GitHub Actions・無料）」参照）。

## スクリプト

| スクリプト | 説明 |
|---|---|
| `npm run build:functions` | Cloud Functions を TypeScript からビルド |
| `npm run build:web` | Vite で SPA をビルド |
| `npm run seed` | 初期フィードと所有者情報を Firestore に投入 |
| `npm run fetch` | 有効なフィードを取得して記事を保存 |
| `npm run emulators` | Firebase Emulator Suite を起動 |
