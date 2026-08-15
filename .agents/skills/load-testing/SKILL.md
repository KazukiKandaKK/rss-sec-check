---
name: load-testing
description: k6 を使って rss-sec-check の負荷許容度を測定し、拡張性/スループット/レイテンシの限界をレポートにまとめる手順。
---

# 負荷テストと拡張性限界の判断

## 適用場面

以下のような指示を受けたときに読む。

- 「k6 でどこまで負荷に耐えられるか計測して」
- 「拡張性の限界をレポートして」
- 「この機能のスループット / 遅延の上限を知りたい」

## テスト対象

rss-sec-check で動的に処理を行う箇所は主に以下の2つ。

1. **Cloud Function `fetchRssOnSchedule`**
   - RSS 取得 + `rss-parser` + Firestore batch write を1リクエストで行う。
   - 負荷のボトルネックになりやすいため、優先して測定する。
   - エミュレーター起動時のエンドポイント: `POST http://127.0.0.1:5001/<project>/<region>/fetchRssOnSchedule-0`
2. **Hosting (静的 SPA)**
   - `npm --prefix web run preview` などで立ち上げたサーバーに対して k6 で GET 負荷。
   - フロントエンド配信層の基礎スループットを把握する。

## 事前準備

1. k6 が `/home/ubuntu/bin/k6` または PATH 上にあることを確認。
2. Node 22 を有効化し、依存関係をインストール。
3. `.env` に Firebase エミュレーター用のダミー値を設定。
4. `firebase.json` に `pubsub` emulator が設定されていることを確認（scheduled function がエミュレーターで初期化されないとテスト対象が現れない）。
5. 既知のワークアラウンド:
   - `firebase-functions` v7 では `functions.config()` が削除されており、エミュレーターが function をロードできない。
   - ローカルテストの間だけ `node_modules/firebase-functions/lib/v1/config.js` を `{}` を返すよう修正する（本番には影響しない）。

## 起動手順

```bash
# 1. モック RSS サーバーを起動
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 22
node /tmp/mock-rss-server.js &

# 2. Firebase emulators を起動
npx firebase emulators:start --only functions,firestore,pubsub --project rss-sec-check &

# 3. Firestore に owner と feed を seed
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 VITE_FIREBASE_PROJECT_ID=rss-sec-check node load-tests/seedMock.js
```

## 負荷シナリオ

`load-tests/` 以下の k6 スクリプトを使う。

| スクリプト | 目的 | 最大 VU | 判定基準 |
|---|---:|---:|---|
| `function-load.js` | 平常時の性能 | 50 | p95 < 5s, エラー率 < 5% |
| `function-stress.js` | 中負荷 | 100 | p95 < 10s, エラー率 < 10% |
| `function-stress-200.js` | 限界探索 | 200 | p95 < 15s, エラー率 < 20% |
| `static-hosting.js` | 静的ホスティング | 500 | p95 < 500ms, エラー率 < 1% |

実行例:

```bash
/home/ubuntu/bin/k6 run load-tests/function-load.js
/home/ubuntu/bin/k6 run load-tests/function-stress-200.js
/home/ubuntu/bin/k6 run load-tests/static-hosting.js
```

## 限界の判断基準

以下の指標を使って「耐えられる上限」を判断する。

1. **エラー率**
   - `http_req_failed` が 0% を超え始めた時点で、システムの限界に近づいている。
   - エラーが出ていなくても、レイテンシの急増はボトルネックの兆候。
2. **p95 レイテンシ**
   - Cloud Functions のデフォルトタイムアウト（60s 〜 120s）を下回っている必要がある。
   - p95 が 5s を超えると、ユーザ体験 / 下流ジョブに影響し始める。
3. **スループット（req/s）**
   - VU を増やしても req/s が頭打ち・減少していれば、ボトルネックが出現している。
   - 頭打ちになった req/s を「1インスタンスあたりの上限」とみなす。
4. **レイテンシの線形増加**
   - VU が倍になったときにレイテンシがほぼ倍になれば、キューイング待ちが支配的（リソース不足）。
   - その場合、同時実行数を抑えるか、Cloud Functions `maxInstances` / リソース割り当てを見直す。

## レポート作成の指針

結果は `load-tests/REPORT.md`（または日付付きファイル）にまとめる。

必須項目:

- テスト環境（マシン、Node/k6/Firebase Emulator バージョン、パッチの有無）
- シナリオ一覧としきい値
- 指標テーブル（VU、iterations、throughput、error rate、avg、med、p95、max）
- 限界の判定理由（どの指標でボトルネックを捉えたか）
- 推奨上限とその根拠
- エミュレーター結果を本番に外挿する際の注意点

## 注意点

- ローカルエミュレーターは **単一プロセス** で動作する。Cloud Functions 本番では複数インスタンスに分散するため、スループットは異なる。
- Firestore エミュレーターの書き込み性能は本番 Firestore とは異なる。書き込みがボトルネックの場合、本番では別の制限（1秒あたり書き込み数）に当たる可能性がある。
- RSS 取得先はモックサーバーを使い、外部サイトに負荷をかけない。
- `firebase-functions` v7 の `functions.config()` 削除は、エミュレーター互換性の既知問題。本番デプロイには影響しないが、ローカルテスト時はパッチが必要。
