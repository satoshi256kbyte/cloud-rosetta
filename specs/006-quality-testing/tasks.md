# Tasks: 品質・テスト基盤の強化

**Input**: Design documents from `/specs/006-quality-testing/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: テストライブラリのインストールと設定ファイル作成

- [ ] T001 `frontend/package.json` に Playwright を追加する。
  `npm init playwright@latest` で初期化し、`playwright.config.ts` を作成。
  Chromium のみ、baseURL: `http://localhost:3000`、
  workers: CI では 2、ローカルでは 50%
- [ ] T002 [P] `scripts/agent/package.json` に fast-check を追加する。
  `npm install -D fast-check @fast-check/vitest`
- [ ] T003 [P] `scripts/validate/package.json` に fast-check を追加する。
  `npm install -D fast-check @fast-check/vitest`
- [ ] T004 [P] `frontend/e2e/fixtures/test-data.ts` を作成する。
  テーマ一覧（正常3件）、比較結果（2プロバイダー）、
  空データ、90日超データのモックを定義する

---

## Phase 2: User Story 1 - E2E テスト基盤（Playwright） (Priority: P1) 🎯 MVP

**Goal**: `npm run test:e2e` で主要 3 ページの E2E テストが実行できること

**Independent Test**: E2E テストを実行し全テストがパスする

### Implementation for User Story 1

- [ ] T005 [US1] `frontend/e2e/theme-list.spec.ts` を作成する。
  テーマ一覧ページの表示確認・カードクリック・空状態・ページネーション
- [ ] T006 [US1] `frontend/e2e/comparison-table.spec.ts` を作成する。
  比較テーブル表示・参照元リンク・90日超警告・404表示
- [ ] T007 [US1] `frontend/e2e/provider-filter.spec.ts` を作成する。
  フィルタ選択・URL反映・リセット・URL共有再現
- [ ] T008 [US1] `frontend/package.json` の scripts に `"test:e2e": "playwright test"` を追加。
  全テストを実行し、パスすることを確認する

**Checkpoint**: `npm run test:e2e` が成功し、レポートが生成される

---

## Phase 3: User Story 2 - プロパティベーステスト (Priority: P2)

**Goal**: ランダム入力に対してバリデーション関数の不変条件が保持されること

**Independent Test**: `npm run test` でプロパティベーステストがパスする

### Implementation for User Story 2

- [ ] T009 [US2] `scripts/agent/parse-issue.property.test.ts` を作成する。
  - 有効な themeId/axisId は常にバリデーションを通過する
  - 無効なフォーマットは常にエラーを投げる
  - providers が 2〜5 件なら通過、1 件以下ならエラー
- [ ] T010 [P] [US2] `scripts/validate/validate.property.test.ts` を作成する。
  - スキーマ準拠 JSON は常にバリデーション通過
  - 必須フィールド欠損は常にエラー
  - additionalProperties は常に拒否

**Checkpoint**: `npm run test` でプロパティベーステストがパスする

---

## Phase 4: User Story 3 - CI チェック強化 (Priority: P2)

**Goal**: PR で E2E + PBT + Lighthouse CI が自動実行されること

**Independent Test**: PR 作成時に全チェックが実行される

### Implementation for User Story 3

- [ ] T011 [US3] `.github/workflows/ci.yml` に E2E テストジョブを追加する。
  Playwright ブラウザのキャッシュ設定、テストレポートのアーティファクト保存（7日間）。
  フロントエンド変更時のみ実行（`paths` フィルタ）
- [ ] T012 [P] [US3] `.github/workflows/ci.yml` に Lighthouse CI ジョブを追加する。
  `npm run build` → `lhci autorun`。アクセシビリティ 90 未満で warning。
  レポートをアーティファクト保存
- [ ] T013 [US3] PR を作成し、全 CI ジョブが実行されることを確認する

**Checkpoint**: CI で全ジョブが実行され、結果がステータスチェックに表示される

---

## Phase 5: User Story 4 - Playwright MCP ドキュメント (Priority: P3)

**Goal**: Playwright MCP の操作手順ドキュメントが作成されること

**Independent Test**: ドキュメントの手順に従って操作ができる

### Implementation for User Story 4

- [ ] T014 [US4] `docs/playwright-mcp-guide.md` を作成する。
  - Playwright MCP の概要・用途
  - セットアップ手順
  - 画面操作例（テーマ一覧 → テーブル → フィルタ操作）
  - スクリーンショット取得手順
  - AI エージェントからの利用パターン

**Checkpoint**: ドキュメントが完成し、手順に従って操作可能

---

## Phase 6: Polish

**Purpose**: 最終確認とドキュメント整備

- [ ] T015 [P] `frontend/package.json` に `"test:e2e:report": "playwright show-report"` を追加
- [ ] T016 ローカルで全テスト（ユニット + PBT + E2E）を実行し成功を確認する
- [ ] T017 quickstart.md の全シナリオを実行し最終検証する

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **US1 (Phase 2)**: Setup 完了に依存
- **US2 (Phase 3)**: Setup 完了に依存（US1 と並行可能）
- **US3 (Phase 4)**: US1 + US2 完了に依存（CI に含めるため）
- **US4 (Phase 5)**: No dependencies（他と並行可能）
- **Polish (Phase 6)**: 全 US 完了に依存

### Parallel Opportunities

```bash
# Phase 1:
T002 (fast-check agent) | T003 (fast-check validate) | T004 (fixtures)

# Phase 2-3 (Setup完了後):
US1 (Phase 2) | US2 (Phase 3) | US4 (Phase 5)

# Phase 4:
T011 (E2E CI) | T012 (Lighthouse CI)
```

---

## Notes

- E2E テストは `page.route()` で fetch をインターセプトしてモック
- fast-check は `@fast-check/vitest` で Vitest に統合
- Lighthouse CI はアクセシビリティのみゲート（パフォーマンスは CI 環境で不安定）
- Playwright ブラウザは CI でキャッシュして実行時間を短縮
