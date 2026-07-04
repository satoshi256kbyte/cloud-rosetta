# Tasks: 基盤インフラ

**Input**: Design documents from `/specs/001-foundation-infra/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: CDK プロジェクトの初期化と基本構造の作成

- [ ] T001 CDK プロジェクトを `infra/` ディレクトリに初期化する（`cdk init app --language typescript`）
- [ ] T002 `infra/package.json` に依存関係を追加する
  （aws-cdk-lib, constructs, cdk-nag, vitest, @types/node, typescript, eslint, prettier）
- [ ] T003 [P] `infra/tsconfig.json` を strict モードで設定する
- [ ] T004 [P] `infra/vitest.config.ts` を作成する
- [ ] T005 [P] `infra/cdk.json` の app エントリーポイントを `npx tsx bin/app.ts` に設定する
- [ ] T006 [P] `.markdownlint.json` をリポジトリルートに確認・修正する
  （120文字制限、consistent テーブルスタイル）
- [ ] T007 [P] `infra/.eslintrc.json` と `infra/.prettierrc` を作成する

---

## Phase 2: Foundational（Blocking Prerequisites）

**Purpose**: 全ユーザーストーリーに必要な CDK App 基盤と cdk-nag 設定

**⚠️ CRITICAL**: User Story の作業はこのフェーズ完了後に開始する

- [ ] T008 CDK App エントリーポイント `infra/bin/app.ts` を作成する。
  環境ごとのスタックインスタンス化、cdk-nag AwsSolutions Aspects 適用を含む
- [ ] T009 dev ステージ定義 `infra/lib/stages/dev.ts` を作成する。
  stage プロパティを各スタックに渡す構成とする
- [ ] T010 [P] 必須タグ付与の共通関数を `infra/lib/utils/tagging.ts` に作成する（FR-019）。
  Tags: Project=cloud-rosetta, Stage={stage}, ManagedBy=cdk

**Checkpoint**: `cdk synth` が成功し、空のスタック構成が生成される

---

## Phase 3: User Story 1 - CDKプロジェクト初期化とデプロイ基盤 (Priority: P1) 🎯 MVP

**Goal**: CDK プロジェクトが cdk-nag パスの状態でデプロイ可能になること

**Independent Test**: `cdk synth --strict` が成功し、`cdk deploy` でスタックが作成される

### Implementation for User Story 1

- [ ] T011 [US1] Storage Stack の骨格 `infra/lib/stacks/storage-stack.ts` を作成する。
  StorageStackProps に stage プロパティを定義する
- [ ] T012 [US1] `infra/lib/stages/dev.ts` に StorageStack のインスタンス化を追加する
- [ ] T013 [P] [US1] Storage Stack のユニットテスト
  `infra/test/stacks/storage-stack.test.ts` を作成する。
  スタックが正常に synth できることを検証する
- [ ] T014 [US1] `cdk synth --strict` を実行し、cdk-nag エラーが 0 件であることを確認する

**Checkpoint**: User Story 1 完了 — `cdk deploy` でスタックがデプロイ可能

---

## Phase 4: User Story 2 - データストア（S3 + DynamoDB）の構築 (Priority: P2)

**Goal**: S3 バケットと DynamoDB テーブルが cdk-nag 準拠でデプロイされること

**Independent Test**: デプロイ後、テストデータの読み書きが成功する

### Implementation for User Story 2

- [ ] T015 [P] [US2] S3 バケット Construct `infra/lib/constructs/comparison-bucket.ts` を作成する。
  SSE-S3 暗号化、Block Public Access 4項目有効、バージョニング有効、
  アクセスログ出力（ログバケット作成含む）、環境別削除ポリシーを設定する
- [ ] T016 [P] [US2] DynamoDB テーブル Construct
  `infra/lib/constructs/comparison-table.ts` を作成する。
  PK=themeId, SK=axisId, GSI ByStatus（PK=status, SK=updatedAt）、
  オンデマンドキャパシティ、PITR 有効、AWS managed key 暗号化、
  環境別 DeletionProtection を設定する
- [ ] T017 [US2] Storage Stack に comparison-bucket と comparison-table を組み込み、
  CfnOutput（BucketName, BucketArn, TableName, TableArn）を追加する
- [ ] T018 [P] [US2] comparison-bucket のユニットテスト
  `infra/test/constructs/comparison-bucket.test.ts` を作成する。
  暗号化、Block Public Access、バージョニング、ログ設定を検証する
- [ ] T019 [P] [US2] comparison-table のユニットテスト
  `infra/test/constructs/comparison-table.test.ts` を作成する。
  キースキーマ、GSI、PITR、キャパシティモードを検証する
- [ ] T020 [US2] `cdk synth --strict` を実行し、cdk-nag エラーが 0 件であることを確認する。
  必要に応じて NagSuppressions を理由付きで追加する
- [ ] T021 [US2] `cdk deploy --method=direct` で dev 環境にデプロイし、
  quickstart.md のシナリオ 3〜5（リソース確認・読み書き・クリーンアップ）を実行する

**Checkpoint**: User Story 2 完了 — S3 + DynamoDB が利用可能

---

## Phase 5: User Story 3 - CI/CDパイプライン（GitHub Actions）の構築 (Priority: P3)

**Goal**: PR 作成時に CI が自動実行され、main マージ時に CD が実行されること

**Independent Test**: PR を作成して CI パス、マージして CD デプロイ成功

### Implementation for User Story 3

- [ ] T022 [P] [US3] CI ワークフロー `.github/workflows/ci.yml` を作成する。
  Trigger: pull_request (branches: main)。
  Steps: checkout, setup-node (LTS固定), npm cache, install, lint, tsc --noEmit,
  vitest run, cdk synth --strict。
  timeout-minutes をジョブレベルで設定する
- [ ] T023 [P] [US3] CD ワークフロー `.github/workflows/cd.yml` を作成する。
  Trigger: push (branches: main)。
  Steps: checkout, setup-node, npm cache, install,
  configure-aws-credentials (OIDC), cdk deploy --method=direct。
  concurrency グループ設定（cancel-in-progress: false）。
  timeout-minutes をジョブレベルで設定する
- [ ] T024 [US3] GitHub リポジトリの Settings > Secrets に `AWS_ROLE_ARN` を、
  Variables に `AWS_REGION` (ap-northeast-1) を設定する
- [ ] T025 [US3] テスト用ブランチを作成し PR を出して CI が正常完了することを確認する
- [ ] T026 [US3] PR をマージし、CD ワークフローで dev 環境デプロイが成功することを確認する

**Checkpoint**: User Story 3 完了 — CI/CD パイプラインが稼働

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: ドキュメント整備とコード品質向上

- [ ] T027 [P] `infra/README.md` を作成する。
  セットアップ手順、コマンド一覧（synth/deploy/destroy/test）、
  命名規約、cdk-nag 抑制ルールの追加手順を記載する
- [ ] T028 [P] `.gitignore` に `infra/cdk.out/`、`infra/node_modules/` を追加する
- [ ] T029 quickstart.md のシナリオ 6（CI ワークフロー検証）を実行し、
  全シナリオの通過を確認する
- [ ] T030 全タスク完了後、`cdk diff` で意図しない差分がないことを最終確認する

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — 即座に開始可能
- **Foundational (Phase 2)**: Setup 完了に依存 — 全 User Story をブロック
- **User Story 1 (Phase 3)**: Foundational 完了に依存
- **User Story 2 (Phase 4)**: User Story 1 完了に依存（Storage Stack の骨格が必要）
- **User Story 3 (Phase 5)**: User Story 2 完了に依存（デプロイ対象が必要）
- **Polish (Phase 6)**: 全 User Story 完了に依存

### Within Each User Story

- Construct 実装（T015, T016）は並列実行可能
- テスト（T018, T019）は対応する Construct 完了後に並列実行可能
- cdk-nag チェック → デプロイの順序は厳守

### Parallel Opportunities

```bash
# Phase 1: Setup 内の並列タスク
T003, T004, T005, T006, T007 (all [P])

# Phase 4: データストア Construct の並列作成
T015 (comparison-bucket) | T016 (comparison-table)

# Phase 4: テストの並列実行
T018 (bucket test) | T019 (table test)

# Phase 5: CI/CD ワークフローの並列作成
T022 (ci.yml) | T023 (cd.yml)

# Phase 6: ドキュメントの並列作成
T027 (README) | T028 (.gitignore)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup 完了
2. Phase 2: Foundational 完了
3. Phase 3: User Story 1 完了
4. **STOP and VALIDATE**: `cdk synth` + `cdk deploy` が成功
5. MVP 達成 — CDK プロジェクトがデプロイ可能

### Incremental Delivery

1. Setup + Foundational → CDK 基盤構築完了
2. User Story 1 → cdk-nag パス確認 → Deploy/Demo (MVP!)
3. User Story 2 → データストア構築 → 読み書きテスト成功
4. User Story 3 → CI/CD 稼働 → 自動デプロイ確認
5. Polish → ドキュメント整備 → 最終検証

---

## Notes

- [P] tasks = different files, no dependencies
- [US#] label maps task to specific user story for traceability
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- cdk-nag チェックはデプロイ前に必ず実行する
- Express mode（--method=direct）を当面すべての環境で使用する
- FR-023（DynamoDB→S3 書き込み順序）は後続のアプリケーション層で対応する
- FR-025（SSM 経由クロススタック参照）は将来のスタック追加時に対応する
