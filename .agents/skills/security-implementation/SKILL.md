---
name: security-implementation
description: rss-watchでDB操作を実装するとき、シークレットを扱うコードを書くとき、またはインフラのネットワーク構成を設計するときに読む。GORMを前提としたインジェクション対策、AWS SSM Parameter Store / .env によるシークレット管理、RDS/ECS(Fargate)のネットワーク構成という、このプロダクト固有の実装手段を規定する。ACL・バリデーションの原則・PIIの判断基準といった技術non-specificな判断基準は common の security-principles スキルを参照する。
---

# セキュリティ実装方針(rss-watch)

## 適用場面

このプロダクトでDB操作を実装するとき、シークレットを扱うコードを書くとき、またはインフラのネットワーク構成を設計するときに、このskillを読む。ACL・バリデーションの原則・PIIの判断基準など、技術non-specificな判断基準は security-principles スキル を参照する。

## インジェクション対策

DB操作はGORMを前提とし(backend-goスキル 参照)、生のSQL文字列結合は行わない。ORM経由のクエリ構築によってSQLインジェクションを防ぐ。

## シークレット管理

- 本番・ステージング環境:AWS SSM Parameter Storeを用いる。
- ローカル開発環境:`.env`ファイル(gitignore対象)を用い、ローカル独自の値を持つ。
- コードにシークレットを直接埋め込むことはしない。

## PII保存時の暗号化

RDS全体の保存時暗号化を基本とする。加えて、特に機微な項目については、カラム単位でも暗号化する。「特に機微な項目」かどうかの判断基準は security-principles スキル を参照する。

## ネットワーク構成

- RDSはプライベートサブネットに配置し、パブリックからの直接アクセスを禁止する。
- ECS(Fargate)はALB経由で外部公開する。

インフラ全体のサービス構成(ECS/RDSの分割方針)は infrastructure-awsスキル を参照する。
