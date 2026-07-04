# Research: 基盤インフラ

**Date**: 2026-07-04

**Purpose**: Technical Context の検証と技術選定のベストプラクティス調査

## 1. CDK プロジェクト構造

**Decision**: `infra/` ディレクトリに CDK コードを分離配置する

**Rationale**:

- AWS 公式ベストプラクティスでは「論理単位ごとにディレクトリを分離」を推奨
- cloud-rosetta は将来 `frontend/`（Next.js）、`backend/`（Hono）を追加するため、
  CDK コードをルート直下に置くとディレクトリが混在する
- `infra/` 配下に独自の `package.json` と `tsconfig.json` を持たせ、
  CDK 依存関係を他のパッケージから分離する

**Alternatives considered**:

- ルート直下に `bin/` `lib/` を配置 → 将来の frontend/backend 追加時に混乱
- モノレポ（nx/turborepo） → 現時点ではオーバースペック

## 2. CDK Construct の設計方針

**Decision**: L2 Construct を基本とし、
カスタム Construct でドメイン固有のリソースをラップする

**Rationale**:

- AWS CDK ベストプラクティス: 「Model with constructs, deploy with stacks」
- Construct でカプセル化し、Stack は Construct の組み合わせのみとする
- L2 が不足する場合のみ L1（Cfn*）+ escape hatch を使用
- 論理 ID の安定性を維持するため、Construct ID の変更は禁止

**Alternatives considered**:

- L1 のみ使用 → 冗長で保守性が低い
- L3（patterns）使用 → 柔軟性が低く、cdk-nag 対応が困難な場合あり

## 3. cdk-nag の適用方法

**Decision**: App レベルで `AwsSolutionsChecks` を適用し、
Suppression は理由付きで個別に設定する

**Rationale**:

- `Aspects.of(app).add(new AwsSolutionsChecks())` で全スタックに一括適用
- 抑制は `NagSuppressions.addResourceSuppressions()` を使用し、
  必ず `reason` フィールドに抑制理由を記載する
- CI で `cdk synth --strict` を実行し、Annotation エラーを検出する

**Alternatives considered**:

- Stack レベルで個別適用 → 新規スタック追加時の漏れリスク
- cdk-nag を使わず手動チェック → スケールしない

## 4. GitHub Actions OIDC 認証

**Decision**: 既存の OIDC IAM ロール ARN を GitHub リポジトリの
Secrets に登録し、`aws-actions/configure-aws-credentials` で利用する

**Rationale**:

- OIDC は長期アクセスキーを不要にし、セキュリティベストプラクティスに準拠
- IAM ロールは作成済みのため、GitHub 側の設定のみ必要
- `aws-actions/configure-aws-credentials@v4` の
  `role-to-assume` パラメータで ARN を指定する

**Alternatives considered**:

- IAM ユーザー + アクセスキー → セキュリティリスク、ローテーション負荷
- AWS CodePipeline → GitHub Actions で完結する方がシンプル

## 5. CDK デプロイモード

**Decision**: 当面すべての環境で Express mode（`cdk deploy --method=direct`）を使用する。
prod 環境追加時に標準モードへの切り替えを再検討する。

**Rationale**:

- Express mode は CloudFormation のチェンジセット作成をスキップし、
  直接リソース変更を適用するためデプロイが最大4倍高速
  （参照: https://aws.amazon.com/jp/blogs/aws/accelerate-your-infrastructure-deployments-by-up-to-4x-with-aws-cloudformation-express-mode/ ）
- 初期フェーズは dev 環境のみで、反復的な開発が中心のためスピードを優先
- prod 環境が必要になった段階で、ロールバックの必要性を再評価する

**Alternatives considered**:

- dev のみ Express / prod は標準 → 現時点で prod がないため不要な区分
- hotswap → Lambda 等の特定リソースのみ対応、インフラ変更に不向き
- 全環境で標準モード → 反復速度が低下

## 6. DynamoDB テーブル設計

**Decision**: シングルテーブル設計。
PK=テーマID、SK=比較軸ID。GSI（ByStatus）PK=ステータス、SK=更新日時。

**Rationale**:

- エンティティが1種類（比較メタデータ）のため、マルチテーブルの動機がない
- テーマ単位クエリはメインテーブルの PK で対応
- ステータス絞り込み + 更新日時ソートは GSI 1つで対応
- オンデマンドキャパシティにより、初期の低トラフィック時のコストを最小化

**Alternatives considered**:

- テーブル分割（テーマテーブル + 軸テーブル） → 不要な複雑性
- シングルテーブル + 複合ソートキー（`STATUS#TIMESTAMP`）
  → GSI の方がクエリが明快

## 7. S3 オブジェクトキー設計

**Decision**: 階層 + バージョン構造:
`comparisons/{テーマID}/{軸ID}/v{N}/result.json`

**Rationale**:

- プレフィックスベースの一覧取得が可能（テーマ配下の全軸をリスト）
- 明示的なバージョン番号により、比較結果の履歴追跡が容易
- DynamoDB のメタデータと 1:1 で対応付けられる

**Alternatives considered**:

- S3 バージョニング機能のみ → バージョン間の比較が困難
- フラットキー → プレフィックスリストが使えない
