# k6 負荷テストレポート

## 目的

`rss-sec-check` の動的処理部分、特に Cloud Function `fetchRssOnSchedule` がどこまでの同時実行に耐えられるかを測定し、拡張性の限界を判断する。

## テスト環境

| 項目 | 値 |
|---|---|
| OS | Ubuntu (Devin VM) |
| Node | v22.12.0 |
| k6 | v0.52.0 |
| firebase-tools | v13.x |
| firebase-functions | v7.2.5 |
| Firebase Emulator | Functions (5001), Firestore (8080), Pub/Sub (8085) |
| Mock RSS | `node /tmp/mock-rss-server.js` on port 9999 |
| Feed | 1 件、50 記事を返す RSS 2.0 |
| 備考 | `node_modules/firebase-functions/lib/v1/config.js` を `{}` を返すよう一時パッチ |

## 測定シナリオと結果

### Cloud Function `fetchRssOnSchedule`

| シナリオ | 最大 VU | iterations | スループット (req/s) | エラー率 | avg | med | p90 | p95 | max |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| function-load | 50 | 9,668 | ~32.2 | 0% | 967ms | 230ms | 2.06s | 4.07s | 26.45s |
| function-stress | 100 | 5,807 | ~27.65 | 0% | 2.86s | 3.65s | 3.94s | 4.01s | 6.16s |
| function-stress-200 | 200 | 3,450 | ~23.0 | 0% | 6.23s | 7.26s | 9.12s | 9.72s | 27.9s |

### 静的ホスティング（Vite preview）

| シナリオ | 最大 VU | iterations | スループット (req/s) | エラー率 | avg | med | p90 | p95 | max |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| static-hosting | 500 | 495,379 | ~6,600 | 0% | 48.4ms | 52.4ms | 89.0ms | 105.5ms | 188.6ms |

## 限界の判断

### 1. エラー率

すべてのシナリオで `http_req_failed = 0%` だった。したがって、エミュレーター上では「リクエストが失敗するまでの限界」は 200 VU 以上に達しなかった。

### 2. レイテンシ

VU を上げるとレイテンシは線形に伸長している。

| VU | med (s) | p95 (s) |
|---:|---:|---:|
| 50 | 0.23 | 4.07 |
| 100 | 3.65 | 4.01 |
| 200 | 7.26 | 9.72 |

50 VU から 100 VU にかけて med が 15 倍に跳ね上がっている。これは、同時 Firestore batch write や `rss-parser` の CPU 処理がシングルプロセスでキューイングされていることを示唆している。

### 3. スループット

VU を倍にしても req/s は増えず、逆に減少傾向にある。

- 50 VU → ~32 req/s
- 100 VU → ~28 req/s
- 200 VU → ~23 req/s

1 インスタンスあたりの処理能力はおおむね **25〜35 req/s** に頭打ちしている。

## 推奨上限

- **日常運用目安**: 同時実行数 **50 以下**
  - p95 が約 4s 以内、avg が 1s 未満に保てる。
- **許容可能な上限**: 同時実行数 **100 まで**
  - エラーは出ないが、median 遅延が 3〜4s に達する。タイムアウトに十分余裕がある場合のみ。
- **避けるべき領域**: **200 以上**
  - p95 が 10s 近くに達し、Cloud Functions タイムアウト（60s〜120s）に近づく。さらにスループットが落ちるため、リソースの無駄になる。

## ボトルネック仮説

- `fetchRssOnSchedule` は 1 リクエストあたり最大 50 件の記事を `rss-parser` でパースし、`db.getAll()` + `batch.commit()` で Firestore に書き込む。
- 同時実行数が増えると、CPU（XML パース）と Firestore 書き込み待ちの両方でキューイングが発生。
- 本番では Cloud Functions のインスタンス数や、Firestore の書き込みレート制限（1 秒あたり）が別のボトルネックになる可能性がある。

## 静的ホスティング

Vite preview に対して 500 VU で 6,600 req/s、105ms p95 を達成。配信層はアプリの処理でない限り、負荷の心配は小さい。

## 注意点

- 本レポートは **Firebase Emulator 上の単一プロセス** での測定結果。
- Cloud Functions 本番では複数インスタンスにスケールするため、同じ数値は出ない。
- Firestore エミュレーターの書き込み性能は本番と異なる。本番での Firestore 書き込み制限を別途確認する必要がある。
- `firebase-functions` v7 での `functions.config()` 削除はエミュレーター互換性の既知の問題。ローカル負荷テスト時のみ `node_modules` をパッチしている。
