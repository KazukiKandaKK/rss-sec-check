---
name: frontend-nextjs
description: Next.jsでフロントエンドの実装を行うとき、特にディレクトリ構成を判断するときに読む。clean-architectureの4層とdddの業務領域分割をNext.jsのディレクトリ構成としてどう表現するか、app/ディレクトリとその他の層の関係を規定する。
---

# フロントエンド(Next.js)の実装方針

## 適用場面

Next.jsでフロントエンドの実装を行うとき、新しいディレクトリやコンポーネントを作成するときに、このskillを読む。

## ディレクトリ構成

`app/`はNext.jsのApp Routerの規約にそのまま従う。ルーティングとPresentationのロジック(コンポーネントなど)を一体で`app/`配下に置く。URLパスの構造が結果的に業務領域の区切りと一致することが多いため、`app/`の中でさらに業務領域ごとのサブディレクトリを強制することはしない。

`application/`・`domain/`・`infrastructure/`の3層は、バックエンド(Go)と同じく業務領域ごとにトップレベルディレクトリを分ける。

```
app/                    (Next.jsのルーティング規約に従う。Presentation)
  orders/
  users/
<業務領域>/              (例: orders/, users/)
  application/           (状態管理、データ取得の呼び出し、画面表示用のデータ整形)
  domain/                (純粋なビジネスルール、Value Object等)
  infrastructure/        (API呼び出しの実装)
shared/                  (技術的な共通処理のみ)
```

## 層の役割

- **Presentation(`app/`)**:ルーティングとコンポーネント。ユーザーの入出力を受け付ける。
- **Application**:状態管理、データ取得の呼び出し、画面表示用のデータ整形。
- **Domain**:純粋なビジネスルール、Value Object。他のどの層にも依存しない。
- **Infrastructure**:バックエンドAPIへの呼び出しの実装。

4層はフルセットで意識する。フロントエンドではDomain層が薄くなりがちだが、Application層とInfrastructure層の区別(状態管理・データ整形の責務と、通信の実装の責務を分ける)は明確に保つ。

## shared/ に置いてよいもの

backend-goスキル と同じ基準を用いる。技術的な共通処理(共通コンポーネント、汎用フック、エラー型など)のみを置き、業務ロジックやドメイン概念は置かない。
