# Feature Specification: 基盤インフラ

**Feature Branch**: `001-foundation-infra`

**Created**: 2026-07-04

**Status**: Draft

**Input**: User description: "基盤インフラを作ってください"

## User Scenarios & Testing

### User Story 1 - CDKプロジェクト初期化とデプロイ基盤 (Priority: P1)

開発者がローカル環境から `cdk deploy` を実行し、
AWS上に空のスタック構成が正常にデプロイされることを確認できる。
cdk-nag によるセキュリティチェックが組み込まれた状態で、
今後の全機能開発の土台となる。

**Why this priority**: すべての後続機能（データストア、ホスティング、AIエージェント基盤）は
このCDKプロジェクト構造の上に構築されるため、最初に完成させる必要がある。

**Independent Test**: `cdk synth` が成功し、cdk-nag チェックがパスし、
`cdk deploy` で CloudFormation スタックが作成される。

**Acceptance Scenarios**:

1. **Given** CDKプロジェクトが初期化されている,
   **When** 開発者が `cdk synth` を実行する,
   **Then** CloudFormation テンプレートがエラーなく生成される
2. **Given** CDKプロジェクトに cdk-nag が設定されている,
   **When** `cdk synth` を実行する,
   **Then** cdk-nag のチェックがすべてパスする（または抑制理由が明記されている）
3. **Given** 有効なAWS認証情報がある,
   **When** 開発者が `cdk deploy` を実行する,
   **Then** dev環境のスタックがAWS上に作成される

---

### User Story 2 - データストア（S3 + DynamoDB）の構築 (Priority: P2)

比較結果の保存先となる S3 バケットと、
メタデータ管理用の DynamoDB テーブルが作成され、
アプリケーションからアクセス可能な状態になる。

**Why this priority**: 比較結果の保存・取得はプロダクトの中核機能であり、
フロントエンドやAIエージェントが依存するデータ基盤である。

**Independent Test**: デプロイ後、S3バケットとDynamoDBテーブルが存在し、
テストデータの読み書きが成功する。

**Acceptance Scenarios**:

1. **Given** データストアスタックがデプロイされている,
   **When** S3バケットの存在を確認する,
   **Then** 命名規約に従ったバケットが存在し、暗号化が有効になっている
2. **Given** データストアスタックがデプロイされている,
   **When** DynamoDBテーブルの存在を確認する,
   **Then** 命名規約に従ったテーブルが存在し、オンデマンドキャパシティモードで設定されている
3. **Given** データストアが構築されている,
   **When** テストデータをS3に書き込み、DynamoDBにメタデータを登録する,
   **Then** 書き込み・読み取りが成功する

---

### User Story 3 - CI/CDパイプライン（GitHub Actions）の構築 (Priority: P3)

Pull Request が作成されたときに Lint・型チェック・テストが自動実行され、
main ブランチへのマージ時に dev 環境へ自動デプロイされる。

**Why this priority**: 品質の自動保証（constitution 原則V）を実現し、
開発フローを確立するために必要。ただしデータストアが先に存在しないと
デプロイ対象がないため P3 とする。

**Independent Test**: テストが含まれる Pull Request を作成し、
GitHub Actions のワークフローが正常に完了する。

**Acceptance Scenarios**:

1. **Given** GitHub Actions ワークフローが設定されている,
   **When** Pull Request を作成する,
   **Then** Lint・型チェック・ユニットテストが自動実行される
2. **Given** CI が全てパスした Pull Request がある,
   **When** main ブランチにマージする,
   **Then** dev 環境への CDK デプロイが自動実行される
3. **Given** CI ワークフローが実行される,
   **When** Lint エラーまたはテスト失敗がある,
   **Then** ワークフローが失敗ステータスで終了し、PR にフィードバックされる

---

### Edge Cases

- CDK デプロイ中に CloudFormation スタックがロールバックした場合の復旧手順。
  ロールバック中もリソースのセキュリティ設定（暗号化・パブリックアクセスブロック）は
  維持されなければならない
- S3 バケット名がグローバルで衝突した場合のフォールバック（アカウントID付与）。
  フォールバックバケットにも同一のセキュリティ設定を適用する
- GitHub Actions の AWS 認証情報（OIDC トークン）が有効期限切れの場合のエラーハンドリング
- cdk-nag で想定外の違反が検出された場合の抑制ルール管理（PR レビュー必須）
- DynamoDB テーブルのスタック削除時にデータ損失が発生しないための保護
  （prod 環境では DeletionProtection を有効化する）

## Requirements

### Functional Requirements

- **FR-001**: CDKプロジェクトは TypeScript で構成し、
  strict モードを有効にしなければならない（MUST）
- **FR-002**: CDK スタックは環境（dev/stg/prod）ごとに分離できる構成としなければならない（MUST）
- **FR-003**: すべての CDK スタックに cdk-nag（AwsSolutions パック）を適用しなければならない（MUST）
- **FR-004**: S3 バケットは SSE-S3 による暗号化を有効にし、
  パブリックアクセスをブロックしなければならない（MUST）
- **FR-005**: DynamoDB テーブルはオンデマンドキャパシティモードで作成し、
  ポイントインタイムリカバリを有効にしなければならない（MUST）
- **FR-006**: すべてのリソースは命名規約
  `{サービス名}-{ステージ名}-{リソース種類}-{用途}` に従わなければならない（MUST）
- **FR-007**: GitHub Actions ワークフローは、PR 作成時に
  Lint・型チェック・ユニットテスト・cdk synth（cdk-nag チェック含む）を実行し、
  main マージ時に CDK デプロイを実行しなければならない（MUST）
- **FR-008**: GitHub Actions から AWS への認証は
  OIDC（OpenID Connect）を使用しなければならない（MUST）
- **FR-009**: CDK デプロイは当面すべての環境で Express mode（`--method=direct`）を使用する（MUST）。
  prod 環境を追加する段階で、標準モード（安定化チェックあり）への切り替えを再検討する
- **FR-010**: VPC は作成しない。
  すべてのリソースはサーバーレス・マネージドサービスで構成する（MUST）
- **FR-011**: DynamoDB テーブルは AWS マネージドキー（AWS owned key）による
  保存時暗号化を有効にしなければならない（MUST）
- **FR-012**: S3 バケットは Block Public Access の4項目すべて
  （BlockPublicAcls, IgnorePublicAcls, BlockPublicPolicy, RestrictPublicBuckets）を
  有効にしなければならない（MUST）
- **FR-013**: S3 バケットはバージョニングを有効にしなければならない（MUST）。
  オブジェクトキーの `v{N}` はアプリケーションレベルのバージョン管理であり、
  S3 バージョニングは誤削除・誤上書きからの保護を目的とする
- **FR-014**: CDK で作成するすべての IAM ポリシーは最小権限の原則に従い、
  `*` リソース指定を避けなければならない（MUST）。
  CDK の `grant*()` メソッドを優先的に使用する
- **FR-015**: S3 バケットのアクセスログを有効にし、
  ログ専用バケットに出力しなければならない（MUST）
- **FR-016**: cdk-nag の抑制ルールを追加する場合は、
  `NagSuppressions` に抑制理由を記載し、PR レビューで承認を得なければならない（MUST）
- **FR-017**: S3 バケットの削除ポリシーは環境ごとに設定しなければならない（MUST）。
  dev 環境: `RemovalPolicy.DESTROY`（autoDeleteObjects 有効）、
  prod 環境: `RemovalPolicy.RETAIN`
- **FR-018**: DynamoDB テーブルは prod 環境で DeletionProtection を
  有効にしなければならない（MUST）
- **FR-019**: すべての CDK リソースに以下の必須タグを付与しなければならない（MUST）:
  `Project`（`cloud-rosetta`）、`Stage`（`dev`/`stg`/`prod`）、
  `ManagedBy`（`cdk`）
- **FR-020**: CI ワークフローの各ジョブには `timeout-minutes` を設定し、
  全体で 3 分以内に収まるようにしなければならない（MUST）
- **FR-021**: CD ワークフローは `concurrency` グループを設定し、
  同一環境への同時デプロイを防止しなければならない（MUST）。
  `cancel-in-progress: false`（先行デプロイを完了させる）とする
- **FR-022**: CI ワークフローの cdk synth ステップで cdk-nag エラーが検出された場合、
  ワークフローはエラー終了しなければならない（MUST）
- **FR-023**: DynamoDB と S3 への書き込みは、DynamoDB を先に更新し、
  成功後に S3 へ書き込む順序としなければならない（MUST）。
  S3 書き込み失敗時は DynamoDB のステータスを `draft` に戻す
- **FR-024**: CI/CD ワークフローは Node.js バージョンを固定（LTS）で指定し、
  npm キャッシュを有効にしなければならない（MUST）
- **FR-025**: 将来のスタック追加時のクロススタック参照は
  SSM Parameter Store 経由とし、直接の Stack 間参照は避けなければならない（MUST）

### Key Entities

- **CDK App**: エントリーポイント。環境ごとのスタックをインスタンス化する
- **Storage Stack**: S3 バケットと DynamoDB テーブルを管理するスタック
- **S3 Bucket（比較結果データ）**: 比較結果の JSON/Markdown を保存。
  キー構造: `comparisons/{テーマID}/{軸ID}/v{N}/result.json`
- **DynamoDB Table（比較メタデータ）**: ステータス・テーマ・軸・更新日時を管理。
  PK=テーマID, SK=比較軸ID。GSI（ByStatus）: PK=ステータス, SK=更新日時
- **GitHub Actions Workflow**: CI（PR時）とCD（マージ時）の2つのワークフロー

## Success Criteria

### Measurable Outcomes

- **SC-001**: 開発者がローカルから CDK デプロイを実行し、5分以内にスタックが作成完了する
- **SC-002**: cdk-nag チェックが 0 件の未対処エラーでパスする
- **SC-003**: Pull Request 作成から CI 完了まで 3 分以内に結果がフィードバックされる
- **SC-004**: main マージから dev 環境デプロイ完了まで 10 分以内に完了する
- **SC-005**: データストアへのテストデータ読み書きが 1 秒以内に完了する
- **SC-006**: すべてのリソースが命名規約に準拠しており、
  AWS コンソールで用途が即座に識別できる

## Assumptions

- AWS アカウントは既に存在し、CDK Bootstrap（`cdk bootstrap`）が完了している。
  Bootstrap で作成される IAM ロール・S3 バケットはデフォルト設定を使用する
- GitHub リポジトリは既に存在し、Actions が有効化されている
- GitHub Actions 用の OIDC 認証 IAM ロールは既に作成済みである。
  GitHub リポジトリの Secrets/Variables に ARN を設定するだけで利用可能。
  ロールの権限スコープは CDK デプロイに必要な CloudFormation・S3・DynamoDB・IAM の
  操作に限定されており、信頼ポリシーは本リポジトリの main ブランチのみを許可する
- 開発者のローカル環境に Node.js と AWS CLI が設定されている
- 初期フェーズでは dev 環境のみをデプロイ対象とし、stg/prod は後続で追加する
- DynamoDB のテーブル設計（パーティションキー・ソートキー）は、
  比較テーマをパーティションキー、比較軸をソートキーとする基本設計を採用する。
  GSI（ByStatus）を1つ追加し、PK=ステータス・SK=更新日時とすることで、
  ステータス絞り込み＋更新日時ソートを単独テーブルで実現する
- S3 バケットのオブジェクトキーは階層＋バージョン構造とする:
  `comparisons/{テーマID}/{軸ID}/v{N}/result.json`
- S3 バケットのライフサイクルポリシーは初期フェーズでは設定せず、後続で検討する

## Clarifications

### Session 2026-07-04

- Q: DynamoDB のアクセスパターンは？
  → A: テーマ単位取得 + ステータス絞り込み + 更新日時ソート。
  単独テーブル + GSI（ByStatus: PK=ステータス, SK=更新日時）で対応
- Q: S3 バケットのオブジェクトキー設計は？
  → A: 階層 + バージョン: `comparisons/{テーマID}/{軸ID}/v{N}/result.json`
