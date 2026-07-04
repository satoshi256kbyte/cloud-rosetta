# Tasks: 比較結果コンテンツ管理

**Input**: Design documents from `/specs/002-content-management/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: プロジェクト構造とスキーマ定義の作成

- [ ] T001 `comparisons/` ディレクトリをリポジトリルートに作成し、
  `.gitkeep` を配置する
- [ ] T002 [P] `scripts/sync/package.json` を作成する。
  依存関係: @aws-sdk/client-s3, @aws-sdk/client-dynamodb, tsx, typescript, vitest
- [ ] T003 [P] `scripts/validate/package.json` を作成する。
  依存関係: ajv, ajv-formats, tsx, typescript
- [ ] T004 [P] `scripts/sync/tsconfig.json` を strict モードで作成する
- [ ] T005 [P] `scripts/validate/tsconfig.json` を strict モードで作成する

---

## Phase 2: Foundational（Blocking Prerequisites）

**Purpose**: JSON Schema 定義と バリデーションスクリプト（全 US の前提）

**⚠️ CRITICAL**: User Story の作業はこのフェーズ完了後に開始する

- [ ] T006 `scripts/validate/schema.json` を作成する。
  data-model.md の result.json Schema に基づき、additionalProperties: false を設定する（FR-017）
- [ ] T007 `scripts/validate/validate.ts` を作成する。
  ajv で comparisons/ 配下の全 result.json をバリデーションし、
  エラー時は詳細メッセージを stdout に出力して exit code 1 で終了する（FR-005）
- [ ] T008 [P] `scripts/validate/validate.test.ts` を作成する。
  正常データ・スキーマ違反データ・additionalProperties 違反のテストケース

**Checkpoint**: `npx tsx scripts/validate/validate.ts` が正常動作する

---

## Phase 3: User Story 1 - 比較テーマの提案と管理 (Priority: P1) 🎯 MVP

**Goal**: Issue テンプレートでテーマ提案ができ、ラベルで状態管理できること

**Independent Test**: Issue を作成し、ラベルが正しく付与される

### Implementation for User Story 1

- [ ] T009 [P] [US1] `.github/ISSUE_TEMPLATE/comparison-theme.yml` を作成する。
  フィールド: テーマ名（themeId）、比較対象プロバイダー（複数選択）、
  比較軸（axisId）、提案理由。デフォルトラベル: `proposed`（FR-001, FR-020）
- [ ] T010 [P] [US1] GitHub リポジトリに Issue ラベルを作成する:
  `proposed`, `approved`, `in-progress`, `review`, `done`（FR-002）

**Checkpoint**: User Story 1 完了 — テーマ提案 Issue が作成可能

---

## Phase 4: User Story 2 - 比較結果の PR 作成 (Priority: P2)

**Goal**: PR テンプレートと CI スキーマバリデーションが動作すること

**Independent Test**: 不正 JSON の PR で CI が失敗し、正常 JSON で CI がパスする

### Implementation for User Story 2

- [ ] T011 [P] [US2] `.github/pull_request_template.md` を作成する。
  セクション: 関連 Issue、変更概要、テーマID、軸ID、チェックリスト（FR-003）
- [ ] T012 [US2] `.github/workflows/ci.yml` にスキーマバリデーションステップを追加する。
  `comparisons/` 配下に変更がある場合のみ実行。
  `npx tsx scripts/validate/validate.ts` を呼び出す（FR-005）
- [ ] T013 [US2] サンプル比較結果 `comparisons/_example/sample-axis/result.json` を
  作成し、CI でバリデーションが通ることを確認する

**Checkpoint**: User Story 2 完了 — スキーマバリデーション CI が動作

---

## Phase 5: User Story 3 - S3/DynamoDB への同期 (Priority: P3)

**Goal**: PR マージ後に比較結果が S3/DynamoDB に自動同期されること

**Independent Test**: 比較結果 PR をマージし、AWS にデータが書き込まれる

### Implementation for User Story 3

- [ ] T014 [P] [US3] `scripts/sync/detect-changes.ts` を作成する。
  git diff で comparisons/ 配下の変更ファイルを検出し、
  themeId/axisId のリストを JSON で stdout に出力する
- [ ] T015 [P] [US3] `scripts/sync/sync-to-aws.ts` を作成する。
  stdin から対象リストを受け取り、各エントリに対して:
  (1) スキーマ再バリデーション（FR-014）
  (2) themeId/axisId のパストラバーサルチェック（FR-018）
  (3) DynamoDB GetItem で現在 version 取得
  (4) DynamoDB PutItem（ConditionExpression で冪等性保証、FR-011）
  (5) S3 PutObject
  失敗時は DynamoDB ロールバック。部分成功対応（FR-015）
- [ ] T016 [P] [US3] `scripts/sync/generate-markdown.ts` を作成する。
  result.json からテーブル形式の result.md を生成する（FR-016）
- [ ] T017 [US3] `scripts/sync/index.ts` を作成する。
  detect-changes → sync-to-aws をパイプラインで実行するエントリーポイント
- [ ] T018 [P] [US3] `scripts/sync/detect-changes.test.ts` を作成する
- [ ] T019 [P] [US3] `scripts/sync/sync-to-aws.test.ts` を作成する。
  DynamoDB/S3 モックを使用したユニットテスト
- [ ] T020 [US3] `.github/workflows/sync.yml` を作成する。
  Trigger: push to main, paths: comparisons/**。
  OIDC 認証、concurrency: sync-comparisons、timeout: 5分。
  ログマスキング設定（FR-019）
- [ ] T021 [US3] 既存 OIDC IAM ロールに S3 PutObject / DynamoDB の
  GetItem・PutItem・DeleteItem 権限を追加する（FR-009）

**Checkpoint**: User Story 3 完了 — PR マージで自動同期が動作

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: ドキュメント整備と最終検証

- [ ] T022 [P] `comparisons/README.md` を作成する。
  比較結果ファイルの配置ルール、JSON Schema の構造、PR 作成手順を記載する
- [ ] T023 [P] `scripts/README.md` を作成する。
  同期スクリプト・バリデーションスクリプトの使い方を記載する
- [ ] T024 quickstart.md のシナリオ 1〜5 を実行し、全シナリオの通過を確認する

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — 即座に開始可能
- **Foundational (Phase 2)**: Setup 完了に依存 — 全 User Story をブロック
- **User Story 1 (Phase 3)**: Foundational 完了に依存（ただし実際には独立実行可能）
- **User Story 2 (Phase 4)**: Foundational 完了に依存（バリデーションスクリプトが必要）
- **User Story 3 (Phase 5)**: User Story 2 完了に依存（CI が動作する前提）
- **Polish (Phase 6)**: 全 User Story 完了に依存

### Parallel Opportunities

```bash
# Phase 1: 全タスク並列可能
T002, T003, T004, T005 (all [P])

# Phase 3 & 4: Issue/PR テンプレートは並列作成可能
T009, T010, T011 (all [P])

# Phase 5: 同期スクリプトの各モジュール
T014 (detect-changes) | T015 (sync-to-aws) | T016 (generate-markdown)
T018 (detect test) | T019 (sync test)

# Phase 6: ドキュメント
T022 | T023
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + 2 完了 → スキーマ定義・バリデーション準備完了
2. Phase 3 完了 → Issue テンプレートで比較テーマ提案が可能
3. **STOP and VALIDATE**: テンプレートから Issue を作成

### Incremental Delivery

1. Setup + Foundational → JSON Schema + バリデーション準備
2. User Story 1 → Issue テンプレート稼働
3. User Story 2 → PR テンプレート + CI バリデーション稼働
4. User Story 3 → 自動同期稼働
5. Polish → ドキュメント整備

---

## Notes

- [P] tasks = different files, no dependencies
- [US#] label maps task to specific user story for traceability
- Commit after each task or logical group
- FR-011（冪等性）は sync-to-aws.ts の ConditionExpression で実装する
- FR-018（パストラバーサル防止）は sync-to-aws.ts の入力チェックで実装する
- FR-023, FR-025（001-foundation-infra の後続対応項目）は本フェーズのスコープ外
