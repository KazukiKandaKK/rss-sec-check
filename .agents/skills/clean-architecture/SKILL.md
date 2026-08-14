---
name: clean-architecture
description: 何らかの実装(関数・API・モジュールなど)を書く、または既存コードをどの層に置くべきか判断するときに読む。Presentation・Application・Domain・Infrastructureの4層構造と、依存が常にDomain層に向かうという原則を規定する。具体的な依存性逆転の仕組み(インターフェースと実装の繋ぎ方)は diパートに譲り、このskillでは層の定義と依存の向きのルールのみを扱う。
---

# クリーンアーキテクチャ:4層構造と依存の向き

## 適用場面

新しいコードをどの層に置くべきか判断するとき、または既存コードが正しい層に置かれているか確認するときに、このskillを読む。実装タスクである時点で基本的に適用対象になる。

## 4層構造

- **Presentation**:UI・Controller。ユーザーやクライアントからの入出力を受け付け、Applicationを呼び出す。
- **Application**:UseCase。ユースケースの手順を組み立て、Domainを操作する。複数のDomain操作を調整する役割を持つ。
- **Domain**:Entity・ビジネスロジック。最も内側の層で、他のどの層にも依存しない。
- **Infrastructure**:DB・外部API。実装詳細を担う層。Domainが定義したインターフェースに従って実装する(繋ぎ方の詳細は diスキル を参照)。

## 依存の向き

矢印は常にDomain層に向かう。

- Presentation → Application:依存してよい
- Application → Domain:依存してよい
- Infrastructure → Domain:依存してよい(InfrastructureはDomainが定義したインターフェースを実装する側)
- **Domain は Application・Presentation・Infrastructure のいずれにも依存しない**

この向きが逆転していないか(例えばDomain層のコードがInfrastructure層の具体的な実装をimportしていないか)を、実装のたびに確認する。

## Presentation から Domain への直接呼び出し

原則としてPresentationはApplicationを経由してDomainを操作するが、以下の条件を両方満たす場合に限り、Presentationから直接Domainを呼び出すことを許容する。

- Domainの操作が1つだけで完結する(複数の操作を組み合わせる必要がない)
- トランザクションを跨ぐ、または他のユースケースの手順を呼び出す必要がない

上記に当てはまらない場合(複数のDomain操作の調整が必要、トランザクション管理が必要、など)は、必ずApplicationを経由する。この線引きに迷う場合は、複数の操作が今後増える可能性を考慮し、Applicationを経由する側を選ぶ。

## Infrastructure の扱い

InfrastructureはDomainより外側の層であり、DBや外部APIといった実装詳細を担う。DomainがInfrastructureの機能(データの永続化など)を必要とする場合でも、DomainがInfrastructureの具体的な実装を直接知ることは許されない。Domain側にインターフェースを定義し、Infrastructure側がそれを実装する形を取る。この依存性逆転の具体的な仕組み(インターフェースの定義場所、実装の注入方法)は diスキル を参照する。
