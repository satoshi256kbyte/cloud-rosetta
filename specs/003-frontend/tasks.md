# Tasks: フロントエンド（比較結果表示）

**Input**: Design documents from `/specs/003-frontend/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Next.js プロジェクトの初期化と基本設定

- [ ] T001 Next.js プロジェクトを `frontend/` に作成する
  （`npx create-next-app@latest --typescript --tailwind --app --src-dir`）
- [ ] T002 `frontend/package.json` に AWS SDK 依存関係を追加する
  （@aws-sdk/client-dynamodb, @aws-sdk/lib-dynamodb, @aws-sdk/client-s3）
- [ ] T003 [P] `frontend/src/lib/aws-config.ts` を作成する。
  `STAGE` 環境変数からテーブル名・バケット名を導出する関数を定義する
- [ ] T004 [P] `frontend/.env.local` にローカル開発用の `STAGE=dev` を設定する

---

## Phase 2: Foundational（Blocking Prerequisites）

**Purpose**: AWS データアクセス層の実装（全ページの前提）

**⚠️ CRITICAL**: User Story の作業はこのフェーズ完了後に開始する

- [ ] T005 `frontend/src/lib/dynamodb.ts` を作成する。
  DynamoDB クライアント初期化 + テーマ一覧取得関数（GSI ByStatus, status=published）
- [ ] T006 `frontend/src/lib/s3.ts` を作成する。
  S3 クライアント初期化 + 比較結果 JSON 取得関数（themeId, axisId, version）
- [ ] T007 [P] データアクセス層のユニットテストを作成する
  `frontend/src/lib/__tests__/aws-config.test.ts`（リソース名導出のテスト）

**Checkpoint**: AWS データアクセス関数が TypeScript コンパイル可能

---

## Phase 3: User Story 1 - 比較テーマ一覧ページ (Priority: P1) 🎯 MVP

**Goal**: トップページに公開済みテーマがカード形式で一覧表示されること

**Independent Test**: `npm run dev` でトップページにテーマ一覧が表示される

### Implementation for User Story 1

- [ ] T008 [P] [US1] `frontend/src/components/Header.tsx` を作成する。
  サイト名「cloud-rosetta」+ トップページリンク
- [ ] T009 [P] [US1] `frontend/src/components/Sidebar.tsx` を作成する。
  DynamoDB からテーマ一覧を取得しリスト表示。各テーマへのリンク
- [ ] T010 [P] [US1] `frontend/src/components/ThemeCard.tsx` を作成する。
  テーマ名・軸名・更新日時を表示するカードコンポーネント
- [ ] T011 [US1] `frontend/src/app/layout.tsx` を作成する。
  Header + Sidebar + main エリアのレイアウト。レスポンシブ対応
- [ ] T012 [US1] `frontend/src/app/page.tsx` を作成する。
  DynamoDB GSI ByStatus から published テーマを取得し、ThemeCard 一覧を表示。
  0 件時のフォールバックメッセージを含む
- [ ] T013 [US1] ローカルで `STAGE=dev npm run dev` を実行し、
  トップページにテーマ一覧が表示されることを確認する

**Checkpoint**: User Story 1 完了 — トップページが動作

---

## Phase 4: User Story 2 - 比較結果詳細ページ (Priority: P2)

**Goal**: 特定テーマ・軸の比較結果がテーブル形式で表示されること

**Independent Test**: `/comparisons/{themeId}/{axisId}` にアクセスし比較テーブルが表示される

### Implementation for User Story 2

- [ ] T014 [P] [US2] `frontend/src/components/ComparisonTable.tsx` を作成する。
  プロバイダー名・サービス名・概要・参照元リンクをテーブル表示。
  レスポンシブ時は横スクロール対応
- [ ] T015 [US2] `frontend/src/app/comparisons/[themeId]/[axisId]/page.tsx` を作成する。
  S3 から比較結果 JSON を取得し ComparisonTable に渡す。
  データ取得失敗時のエラー UI を含む。404 対応（notFound()）
- [ ] T016 [US2] ローカルで詳細ページの表示を確認する。
  テーマカードクリック → 詳細ページ遷移を検証

**Checkpoint**: User Story 2 完了 — 詳細ページが動作

---

## Phase 5: User Story 3 - Amplify Hosting デプロイ (Priority: P3)

**Goal**: Amplify Hosting でアプリケーションがインターネット公開されること

**Independent Test**: Amplify の URL でテーマ一覧・詳細ページが表示される

### Implementation for User Story 3

- [ ] T017 [US3] `infra/lib/stacks/amplify-stack.ts` を作成する。
  Amplify App（GitHub 連携）+ Branch（main）+ 環境変数（STAGE=dev）+
  IAM ロール（DynamoDB/S3 読み取り権限）を定義する
- [ ] T018 [US3] `infra/bin/app.ts` に AmplifyStack を追加する
- [ ] T019 [P] [US3] `infra/test/stacks/amplify-stack.test.ts` を作成する
- [ ] T020 [US3] `cdk synth --strict` で cdk-nag パスを確認する
- [ ] T021 [US3] `cdk deploy --all --method=direct` で Amplify スタックをデプロイする
- [ ] T022 [US3] Amplify の URL にアクセスし、ビルド・デプロイが成功し
  アプリケーションが表示されることを確認する

**Checkpoint**: User Story 3 完了 — Amplify で公開

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: CI 更新とドキュメント整備

- [ ] T023 [P] `.github/workflows/ci.yml` にフロントエンドの Lint・型チェックを追加する。
  working-directory: frontend。paths フィルタで frontend/ 変更時のみ実行
- [ ] T024 [P] `frontend/README.md` を作成する。
  セットアップ手順・開発サーバー起動・ビルドコマンドを記載
- [ ] T025 quickstart.md の全シナリオ（1〜5）を実行し最終検証する

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — 即座に開始可能
- **Foundational (Phase 2)**: Setup 完了に依存
- **User Story 1 (Phase 3)**: Foundational 完了に依存
- **User Story 2 (Phase 4)**: User Story 1 完了に依存（レイアウトが必要）
- **User Story 3 (Phase 5)**: User Story 2 完了に依存（デプロイ対象が必要）
- **Polish (Phase 6)**: 全 User Story 完了に依存

### Parallel Opportunities

```bash
# Phase 1:
T003 (aws-config) | T004 (.env.local)

# Phase 3: コンポーネントの並列作成
T008 (Header) | T009 (Sidebar) | T010 (ThemeCard)

# Phase 4:
T014 (ComparisonTable) は US1 完了前でも着手可能

# Phase 6:
T023 (CI) | T024 (README)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + 2 完了 → AWS アクセス層準備
2. Phase 3 完了 → テーマ一覧が表示可能
3. **STOP and VALIDATE**: ローカルでトップページ動作確認

### Incremental Delivery

1. Setup + Foundational → Next.js + AWS SDK 準備
2. User Story 1 → テーマ一覧ページ → ローカル確認
3. User Story 2 → 詳細ページ → ローカル確認
4. User Story 3 → Amplify デプロイ → 公開確認
5. Polish → CI + ドキュメント

---

## Notes

- [P] tasks = different files, no dependencies
- [US#] label maps task to specific user story for traceability
- STAGE 環境変数でリソース名を導出する（aws-config.ts）
- Amplify Hosting の CDK 管理は `@aws-cdk/aws-amplify-alpha` が不安定な場合、
  L1 Construct（CfnApp, CfnBranch）を使用する
- レスポンシブ対応は Tailwind のブレークポイント（sm/md/lg）で実装する
