---
name: engineering-thinking
description: 新しい実装タスクを受けたとき、どのスキルを読むか・どの順で適用するかを判断する入口スキル。clean-architecture/ddd/dependency-injection/single-responsibility/testing などをタスク種別に応じて回す順序を規定する。
---

# 実装タスクへのスキル適用フロー

## 適用場面

何かを実装する / 変更する / リファクタする指示を受けたとき、まずこのスキルを読む。個別スキルに飛びつく前に「このタスクはどの領域に触れているか」を自問し、読む順序を決める。

## 基本の問い

タスクを受けたら以下を自問する。

1. タスクは UI / フロントエンドに触れるか？
2. バックエンド / API / Cloud Function に触れるか？
3. データ構造 / DB / Firestore に触れるか？
4. 認証・認可 / 入力検証 / PII に触れるか？
5. 性能・負荷・将来の増加に関わるか？
6. インフラ / デプロイ / ネットワークに触れるか？

上記に該当する領域だけを対象にする。全スキルを常に読む必要はない。

## 基本の順序

ほとんどの実装タスクで共通して読むスキル：

1. `clean-architecture` — どの層に置くか、依存の向きを確認
2. `single-responsibility` — クラス / 関数の変更理由が 1 つか確認
3. `ddd` — Domain 概念（Entity / Value Object / Aggregate）が必要か確認
4. `dependency-injection` — Infrastructure への依存を逆転できているか確認
5. `testing` — テスト先行、境界値分析を実施

その後、タスク種別に応じて個別スキルを読む。

## タスク種別別のマッピング

| タスクの性質 | 追加で読むスキル | 主に判断すること |
|---|---|---|
| 新しい画面 / コンポーネント / フック | `frontend-nextjs`（Next.js 使用時） | Presentation / Application の責務、状態管理の場所 |
| 新しい API / Cloud Function | `backend-go`（Go 使用時） | 層分離、GORM、エラーハンドリング |
| Firestore / テーブル設計 | `database-design` | 正規化 / 非正規化のトレードオフ |
| 認証・認可 / 入力検証 / シークレット | `security-principles` → `security-implementation` | 原則とプロダクト固有の実装手段 |
| ループ / 集計 / 大量データ処理 | `computational-complexity` | O(n²) 許容範囲、N+1、バッチ、ページネーション |
| スケール / ユーザー増加 / キャッシュ | `scalability` | YAGNI と先取り例外の使い分け |
| 負荷限界を測定したい | `load-testing` | k6 シナリオと限界の判断基準 |
| エミュレーターで E2E 検証 | `local-e2e` | 環境構築からクリーンアップまで |
| AWS インフラ変更 | `infrastructure-aws` | ECS / Fargate / RDS の分割方針 |

## 使い方

- 実装タスクの最初にこのスキルを開き、上記マッピングで読む順序を決める。
- 各スキルは独立しているが、順序を守ることで「層 → ドメイン → DI → テスト → 横断的関心事」という自然な流れになる。
- スキルの中でさらに別スキルを参照されたら、そのスキルを読む。
- 判断に迷ったら、基本スキル（`clean-architecture` / `single-responsibility` / `ddd` / `dependency-injection` / `testing`）に立ち返る。

## 注意点

- このスキルは「どのスキルを読むか」のメタ判断だけを行う。具体的な実装方針は各個別スキルに従う。
- タスクが「ドキュメントを読むだけ」「調査」など実装を伴わない場合は、個別スキルの適用は必須ではない。
- 新しいスキルが追加されたら、このマッピングテーブルも更新する。