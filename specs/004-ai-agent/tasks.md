# Tasks: AIエージェント比較自動実行

**Input**: Design documents from `/specs/004-ai-agent/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: エージェントスクリプトの基盤構築

- [x] T001 `scripts/agent/package.json` を作成する。
  依存関係: @aws-sdk/client-bedrock-agentcore, @octokit/rest, tsx, typescript, vitest
- [x] T002 [P] `scripts/agent/tsconfig.json` を strict モードで作成する
- [x] T003 [P] `scripts/agent/prompts/comparison.txt` にシステムプロンプトの
  初期版を作成する（FR-019: 出力形式・情報源優先順位・日本語指示）。
  JSON Schema（`scripts/validate/schema.json`）の内容をプロンプト内に埋め込み、
  エージェントが準拠すべき出力形式を明示する

---

## Phase 2: Foundational（Blocking Prerequisites）

**Purpose**: AgentCore エージェントの CDK 定義とデプロイ

**⚠️ CRITICAL**: User Story の作業はこのフェーズ完了後に開始する

- [x] T004 `infra/lib/stacks/agent-stack.ts` を作成する。
  Bedrock AgentCore エージェント定義（モデル: コンテキスト変数で切り替え可能、
  デフォルト Mistral Large 3）+ IAM ロール + CloudWatch Logs（FR-023）
- [x] T005 `infra/bin/app.ts` に AgentStack を追加する
- [x] T006 OIDC IAM ロールに必要な権限があることを確認する（FR-018）
  — OIDC ロールは手動管理（AdministratorAccess 付与済みのため追加不要）
- [x] T007 `cdk synth --strict` で cdk-nag パスを確認する
- [x] T008 `cdk deploy AgentStack` でエージェントをデプロイする

**Checkpoint**: AgentCore にエージェントがデプロイされ、API で呼び出し可能

---

## Phase 3: User Story 1 - Issue ラベルによるエージェント起動 (Priority: P1) 🎯 MVP

**Goal**: `approved` ラベルでワークフローが起動し、ラベルが `in-progress` に変わること

**Independent Test**: Issue に `approved` ラベルを付け、ワークフローが起動する

### Implementation for User Story 1

- [x] T009 [P] [US1] `scripts/agent/parse-issue.ts` を作成する。
  Issue 本文から themeId・axisId・providers をパースし、
  バリデーション（FR-012）を実行する
- [x] T010 [P] [US1] `scripts/agent/update-labels.ts` を作成する。
  Issue のラベルを操作する関数（add/remove）を実装する
- [x] T011 [US1] `.github/workflows/agent.yml` を作成する。
  トリガー: `issues` イベント `labeled` タイプ、`approved` ラベル検知。
  パーミッション: issues:write, contents:write, pull-requests:write, id-token:write（FR-013）。
  タイムアウト: 15分（FR-010）。concurrency 設定あり。
  起動時に `in-progress` ラベル付与 + 二重実行チェック（FR-002）
- [ ] T012 [US1] テスト Issue を作成し `approved` ラベルを付与して
  ワークフローが起動・ラベルが変更されることを確認する

**Checkpoint**: User Story 1 完了 — ラベルトリガーが動作

---

## Phase 4: User Story 2 - AIエージェントによる比較作業 (Priority: P2)

**Goal**: エージェントが比較結果 JSON を生成すること

**Independent Test**: テスト用テーマでエージェントを呼び出し result.json が出力される

### Implementation for User Story 2

- [x] T013 [US2] `scripts/agent/run-workflow.ts` を作成する（invoke-agent 相当）。
  AgentCore InvokeHarness API を呼び出し、結果を受け取る。
  レート制限リトライ（FR-022: 指数バックオフ 1s/最大30s/3回）。
  情報取得不可時の処理（FR-015）
- [x] T014 [P] [US2] `scripts/agent/parse-issue.test.ts` を作成する。
  パース・バリデーションのユニットテスト（10テスト全パス）
- [x] T015 [US2] エージェント単体テストを実行する。
  デプロイ後に `npx tsx test-invoke.ts` で result.json が
  生成されることを確認する

**Checkpoint**: User Story 2 完了 — エージェントが JSON を生成

---

## Phase 5: User Story 3 - 比較結果の PR 自動作成 (Priority: P3)

**Goal**: 生成した結果で PR が自動作成され、Issue ラベルが `review` に変わること

**Independent Test**: エージェント実行後に PR が作成され CI がパスする

### Implementation for User Story 3

- [x] T016 [P] [US3] `scripts/agent/create-pr.ts` を作成する。
  feature ブランチ作成（`agent/{themeId}-{axisId}`、FR-017）、
  result.json コミット、PR 作成（`closes #N`）。
  既存 PR チェック（FR-014）
- [x] T017 [US3] `agent.yml` にエージェント呼び出し + PR 作成ステップを追加する。
  成功時: ラベル `review` に変更（FR-008）。
  失敗時: エラーコメント投稿 + ラベル `proposed` に復帰（FR-009, FR-016）
- [ ] T018 [US3] E2E テスト: テスト Issue に `approved` ラベルを付与し、
  ワークフロー完了後に PR が作成され CI がパスすることを確認する

**Checkpoint**: User Story 3 完了 — 全フロー（ラベル → エージェント → PR）が動作

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: ドキュメントとエラーハンドリングの仕上げ

- [x] T019 [P] `scripts/agent/README.md` を作成する。
  スクリプト構成、ローカル実行方法、プロンプト編集手順を記載
- [x] T020 [P] `.github/workflows/ci.yml` に `scripts/agent/` の
  型チェック・テストを追加する
- [ ] T021 quickstart.md の全シナリオ（1〜5）を実行し最終検証する

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Setup 完了に依存 — AgentCore デプロイ
- **User Story 1 (Phase 3)**: Foundational 完了に依存（エージェント存在が前提）
- **User Story 2 (Phase 4)**: User Story 1 完了に依存（ワークフローから呼び出し）
- **User Story 3 (Phase 5)**: User Story 2 完了に依存（結果がないと PR 作れない）
- **Polish (Phase 6)**: 全 User Story 完了に依存

### Parallel Opportunities

```bash
# Phase 1:
T002 (tsconfig) | T003 (prompt)

# Phase 3:
T009 (parse-issue) | T010 (update-labels)

# Phase 5:
T016 (create-pr) は US2 完了前でも先行着手可能

# Phase 6:
T019 (README) | T020 (CI)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + 2 → AgentCore デプロイ
2. Phase 3 → ラベルトリガー動作確認
3. **STOP and VALIDATE**

### Incremental Delivery

1. Setup + Foundational → AgentCore 準備完了
2. User Story 1 → ラベルトリガー稼働
3. User Story 2 → エージェント JSON 生成確認
4. User Story 3 → PR 自動作成 → 全フロー動作
5. Polish → CI + ドキュメント

---

## Notes

- [P] tasks = different files, no dependencies
- [US#] label maps task to specific user story for traceability
- AgentCore の API 仕様は実装時に最新ドキュメントを確認する
- プロンプト（comparison.txt）は Git 管理し、変更は PR レビュー対象とする。
  初回実装後にイテレーティブに改善する
- モデルは CDK コンテキスト変数 `agentModelId` で切り替え可能
  （デフォルト: mistral.mistral-large-3-675b-instruct）
