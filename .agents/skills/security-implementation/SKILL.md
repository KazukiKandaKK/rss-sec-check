---
name: security-implementation
description: rss-sec-check（React + Vite + Firebase）で、Firestore/Cloud Functions/外部RSS取得におけるセキュリティ実装手段を規定する。ACL・バリデーション・PIIの判断基準そのものは security-principles スキルを参照する。
---

# セキュリティ実装方針(rss-sec-check)

## 適用場面

rss-sec-check において、以下を扱うときにこの skill を読む。

- Firestore セキュリティルールの実装・変更
- Cloud Functions から外部 URL（RSS feed）を取得する実装
- シークレット（Firebase API key、サービスアカウント、owner email など）の管理
- Cloud Functions のネットワーク制限（ingress・maxInstances など）

ACL・バリデーション・PII の原則は `security-principles` スキル で規定されている。ここでは Firebase 固有の実装手段を定める。

## インジェクション・SSRF 対策

- **生の文字列結合は行わない**: Cloud Functions 内で URL を組み立てる場合も、`URL` コンストラクタやホワイトリスト・正規表現を使う。
- **feed URL のスキーム検証**: `http:` / `https:` のみ許可する。`javascript:`, `file:`, `data:` などは reject。
- **プライベート/予約アドレス・ローカルホストのブロック**: 以下を fetch 対象から除外する。
  - `localhost`, `127.0.0.1`, `::1`
  - `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
  - `169.254.0.0/16`（リンクローカル、GCP メタデータサーバ `169.254.169.254` 含む）
  - `metadata.google.internal` など `.internal` ドメイン
- **外部からの入力は Firestore ルールでも検証する**: feed 作成時の `url` は `https?:` スキームを持つ文字列に制限し、許可しないホストは Cloud Functions 側でスキップする。

## シークレット管理

- コードに API key、サービスアカウント鍵、owner email などを直接埋め込まない。
- **Web**: Firebase 公開設定（apiKey など）は `import.meta.env` 経由で読み込む。これらはホスティング側で公開される設定なので、Secret Manager には置かない。
- **Cloud Functions**: 本番で必要な機密値は `firebase-functions` の `secrets` オプションを使うか、Google Cloud Secret Manager を参照する。ローカル・エミュレーターでは `.env`（gitignore 対象）を使う。
- **CI/CD**: GitHub Actions では `secrets` 経由で渡し、リポジトリにコミットしない。

## PII の扱い

- Cloud Functions のログに `ownerEmail` やユーザー ID を出力しない。feed 名・件数・エラーメッセージなど非 PII のみをログに残す。
- `seed` スクリプトなど管理用ツールでも、owner email をコンソールに表示しない。

## ネットワーク構成

- Cloud Functions は **内部からの呼び出しのみ許可** するようにする。
  - スケジューラーから起動する `onSchedule` には `ingressSettings: "ALLOW_INTERNAL_ONLY"` を基本設定とする。
  - HTTP トリガーが必要な場合のみ `ALLOW_INTERNAL_AND_GCLB` を検討する。
- リソース制限として `maxInstances` を設定し、コスト・同時実行の暴走を防ぐ。
- Firestore ルールで、外部クライアントからの `articles` 作成・削除を禁止し、書き込みは Cloud Functions 経由に限定する。

## Firestore セキュリティルール

- `request.auth` の存在、`email_verified`、owner 一致を確認する。
- `articles` の `update` は `read` / `starred` など安全なフィールドのみ許可する。
- `feeds` の作成・更新時は、スキーム・文字列長・ ownerEmail 一致をバリデーションする。
