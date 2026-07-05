# Tasks: 比較結果ページの本実装

**Input**: Design documents from `/specs/005-comparison-pages/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: 型定義と ISR 設定の基盤

- [ ] T001 `frontend/src/lib/types.ts` を作成する。
  ThemeCardData、FilterState、PaginationState の型定義を追加する
- [ ] T002 [P] `frontend/src/app/page.tsx` の `export const dynamic = 'force-dynamic'` を
  `export const revalidate = 3600` に変更する（ISR 有効化）

---

## Phase 2: Foundational（Blocking Prerequisites）

**Purpose**: データアクセス層の拡張（全 US の前提）

**⚠️ CRITICAL**: User Story の作業はこのフェーズ完了後に開始する

- [ ] T003 `frontend/src/lib/dynamodb.ts` にテーマ別軸一覧取得関数を追加する。
  `getAxesByTheme(themeId)`: PK=themeId で Query し status=published のみ返す
- [ ] T004 `frontend/src/lib/dynamodb.ts` にテーマ一覧のページネーション対応を追加する。
  `getPublishedThemesPaginated(page, limit)`: Limit + ExclusiveStartKey で取得
- [ ] T005 [P] `frontend/src/app/not-found.tsx` を作成する（FR-007）。
  トップページへのリンクを含む 404 ページ

**Checkpoint**: `npm run build` が成功する

---

## Phase 3: User Story 1 - テーマ一覧ページの本実装 (Priority: P1) 🎯 MVP

**Goal**: トップページに公開済みテーマがカード形式で一覧表示され、
ページネーションが動作すること

**Independent Test**: トップページにアクセスし、テーマカードとページネーションが表示される

### Implementation for User Story 1

- [ ] T006 [US1] `frontend/src/components/ThemeCard.tsx` を更新する。
  テーマ名・比較軸数・対象プロバイダー・最終更新日を表示。
  リンク先を `/comparisons/{themeId}` に変更する
- [ ] T007 [P] [US1] `frontend/src/components/Pagination.tsx` を新規作成する。
  ページ番号リンク、前へ/次へボタン。
  現在ページは `?page=N` クエリパラメータで管理
- [ ] T008 [US1] `frontend/src/app/page.tsx` を更新する。
  ページネーション対応（12 件/ページ、FR-014）。
  ISR revalidate=3600。SEO メタデータ（generateMetadata）を追加（FR-012）
- [ ] T009 [US1] テーマ一覧ページの動作確認。
  `npm run dev` でカード表示・ページネーション・空状態を確認する

**Checkpoint**: User Story 1 完了 — テーマ一覧が本実装

---

## Phase 4: User Story 2 - 比較結果テーブルページ (Priority: P1)

**Goal**: 比較結果がプロバイダー列テーブルで表示され、
参照元リンクが機能すること

**Independent Test**: 比較結果ページにアクセスし、テーブルと参照元リンクが表示される

### Implementation for User Story 2

- [ ] T010 [US2] `frontend/src/components/ComparisonTable.tsx` を更新する。
  プロバイダーを列方向に配置するレイアウトに変更。
  行: サービス名・要約・詳細・参照元。
  モバイル: `overflow-x-auto` + 最小幅設定（FR-003, FR-010）
- [ ] T011 [P] [US2] `frontend/src/components/DataFreshnessWarning.tsx` を新規作成する。
  comparedAt が 90 日以上前の場合に警告を表示（FR-011）
- [ ] T012 [US2] `frontend/src/app/comparisons/[themeId]/[axisId]/page.tsx` を更新する。
  ISR revalidate=3600。SEO メタデータ（FR-012）。
  DataFreshnessWarning を配置。参照元リンクを `target="_blank"`（FR-004）。
  データ未存在時は `notFound()` を呼び出す（FR-007）
- [ ] T013 [US2] 比較結果ページの動作確認。
  テーブル表示・リンク動作・90 日超警告・404 を確認する

**Checkpoint**: User Story 2 完了 — 比較テーブルが本実装

---

## Phase 5: User Story 3 - テーマ別比較軸一覧ページ (Priority: P2)

**Goal**: テーマ詳細ページに比較軸一覧が表示され、
軸が 1 つの場合はリダイレクトされること

**Independent Test**: `/comparisons/{themeId}` にアクセスし軸一覧が表示される

### Implementation for User Story 3

- [ ] T014 [US3] `frontend/src/app/comparisons/[themeId]/page.tsx` を新規作成する。
  テーマに属する比較軸の一覧を表示。
  軸が 1 つのみの場合は `redirect()` で比較結果ページへ（FR-006）。
  ISR revalidate=3600。SEO メタデータ
- [ ] T015 [US3] テーマ別軸一覧ページの動作確認。
  複数軸テーマと単一軸テーマで動作を確認する

**Checkpoint**: User Story 3 完了 — 軸一覧が実装

---

## Phase 6: User Story 4 - プロバイダーフィルタ (Priority: P3)

**Goal**: 比較テーブルでプロバイダーをフィルタでき、
URL クエリパラメータで状態が共有可能なこと

**Independent Test**: フィルタ操作後に URL が変わり、その URL で同じ状態が再現される

### Implementation for User Story 4

- [ ] T016 [US4] `frontend/src/components/ProviderFilter.tsx` を新規作成する。
  `"use client"` コンポーネント。
  チェックボックス形式でプロバイダーを選択/解除。
  `useSearchParams` + `useRouter` で URL クエリパラメータに反映（FR-009）
- [ ] T017 [US4] `frontend/src/app/comparisons/[themeId]/[axisId]/page.tsx` に
  ProviderFilter を統合する。
  `searchParams` から初期フィルタ状態を読み取り、
  フィルタ結果に応じてテーブル列を絞り込む（FR-008）
- [ ] T018 [US4] フィルタの動作確認。
  フィルタ操作・URL 反映・URL 共有再現を確認する

**Checkpoint**: User Story 4 完了 — フィルタが実装

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: エラーハンドリング、テスト、最終検証

- [ ] T019 [P] `frontend/src/components/ErrorPage.tsx` を新規作成する（FR-013）。
  汎用エラー表示コンポーネント（再試行ボタン付き）
- [ ] T020 [P] コンポーネントテストを作成する。
  `ComparisonTable.test.tsx`、`ProviderFilter.test.tsx`、
  `ThemeCard.test.tsx`、`Pagination.test.tsx`
- [ ] T021 `frontend/src/app/layout.tsx` を更新する。
  サイト全体のデフォルト SEO メタデータ（FR-012）。
  グローバルレイアウトの微調整
- [ ] T022 `npm run build` で本番ビルドが成功することを確認する
- [ ] T023 quickstart.md の全シナリオ（1〜7）を実行し最終検証する

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Setup 完了に依存
- **User Story 1 (Phase 3)**: Foundational 完了に依存
- **User Story 2 (Phase 4)**: Foundational 完了に依存（US1 と並行可能）
- **User Story 3 (Phase 5)**: Foundational 完了に依存（US1/US2 と並行可能）
- **User Story 4 (Phase 6)**: User Story 2 完了に依存（テーブルが必要）
- **Polish (Phase 7)**: 全 User Story 完了に依存

### Parallel Opportunities

```bash
# Phase 2:
T003 (dynamodb軸一覧) | T005 (404ページ)

# Phase 3:
T006 (ThemeCard) | T007 (Pagination)

# Phase 3-5 (Foundational完了後):
US1 (Phase 3) | US2 (Phase 4) | US3 (Phase 5) は並行着手可能

# Phase 7:
T019 (ErrorPage) | T020 (テスト) | T021 (layout)
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. Phase 1 + 2 → データ層拡張
2. Phase 3 + 4 → テーマ一覧 + 比較テーブル（P1 の 2 ストーリー）
3. **STOP and VALIDATE**

### Incremental Delivery

1. Setup + Foundational → 基盤整備
2. US1 + US2（並行）→ 一覧 + テーブルの本実装
3. US3 → 軸一覧ページ
4. US4 → フィルタ機能
5. Polish → テスト + エラー処理 + 検証

---

## Notes

- 003-frontend の既存コードを拡張するため、破壊的変更は最小限にする
- ISR の revalidate は全ページ統一で 3600 秒とする
- Client Component は ProviderFilter のみ。それ以外は Server Component
- テーマカードの表示内容は DynamoDB のデータ集約が必要
  （同一 themeId の軸数カウント、プロバイダー union）
