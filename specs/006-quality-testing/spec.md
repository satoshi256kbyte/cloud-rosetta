# Feature Specification: 品質・テスト基盤の強化

**Feature Branch**: `006-quality-testing`

**Created**: 2026-07-05

**Status**: Draft

**Input**: User description: "プロパティベーステスト・Playwright E2Eテストの整備、
CIチェックの強化、Playwright MCPによる画面操作の目視確認手順の整備"

## User Scenarios & Testing

### User Story 1 - E2E テスト基盤（Playwright）の構築 (Priority: P1)

開発者が `npm run test:e2e` を実行すると、
フロントエンドの主要ページ（テーマ一覧、比較テーブル、フィルタ）に対して
ブラウザベースの E2E テストが自動実行され、
結果がレポートとして出力される。

**Why this priority**: ユーザーが実際に触れるフロントエンドの品質を
ブラウザレベルで保証する最も重要なテスト手段。

**Independent Test**: Playwright テストを実行し、
全テストがパスしてレポートが生成されることを確認する。

**Acceptance Scenarios**:

1. **Given** Playwright がインストール済みである,
   **When** `npm run test:e2e` を実行する,
   **Then** 全 E2E テストが実行され、パス/失敗結果が表示される
2. **Given** テーマ一覧ページが表示可能である,
   **When** E2E テストが実行される,
   **Then** ページ表示・カードクリック・ページネーション操作が検証される
3. **Given** 比較結果テーブルページが表示可能である,
   **When** E2E テストが実行される,
   **Then** テーブル表示・参照元リンク・フィルタ操作が検証される
4. **Given** E2E テストが CI で実行される,
   **When** Pull Request が作成される,
   **Then** E2E テスト結果がステータスチェックとして報告される

---

### User Story 2 - プロパティベーステストの導入 (Priority: P2)

開発者がデータ変換・バリデーション関数に対して
プロパティベーステストを記述し、
ランダムな入力に対しても関数の不変条件が保持されることを確認できる。

**Why this priority**: ユニットテストでは見逃しやすい
エッジケースをランダム入力で発見できる。
特にデータパース（parse-issue）やスキーマバリデーションに有効。

**Independent Test**: `npm run test` で通常のユニットテストに加え、
プロパティベーステストが実行されることを確認する。

**Acceptance Scenarios**:

1. **Given** プロパティベーステストライブラリがインストール済みである,
   **When** `npm run test` を実行する,
   **Then** プロパティベーステストが既存ユニットテストと共に実行される
2. **Given** parse-issue のプロパティベーステストが存在する,
   **When** テストが実行される,
   **Then** ランダムな Issue 本文入力に対してバリデーションが
   正しくエラーを検出するか通過することが検証される
3. **Given** JSON Schema バリデーションのプロパティベーステストが存在する,
   **When** テストが実行される,
   **Then** ランダムな JSON に対してスキーマ準拠/違反が正しく判定される

---

### User Story 3 - CI チェックの強化 (Priority: P2)

Pull Request 作成時に、E2E テスト・プロパティベーステスト・
Lighthouse CI（アクセシビリティスコア）が自動実行され、
品質ゲートとして機能する。

**Why this priority**: 人間レビュー前に機械的な品質保証を行い、
レビュー負荷を削減する（constitution 原則V）。

**Independent Test**: テスト失敗する PR を作成し、
CI がブロックすることを確認する。

**Acceptance Scenarios**:

1. **Given** PR が作成される,
   **When** CI が実行される,
   **Then** E2E テスト・プロパティベーステスト・型チェック・Lint が
   すべて自動実行される
2. **Given** E2E テストが失敗する PR がある,
   **When** CI 結果を確認する,
   **Then** ステータスチェックが失敗しマージがブロックされる
3. **Given** Lighthouse CI が設定されている,
   **When** フロントエンドに変更を含む PR が作成される,
   **Then** アクセシビリティスコアが計測され 90 未満で警告される

---

### User Story 4 - Playwright MCP による目視確認手順 (Priority: P3)

AI エージェントや開発者が Playwright MCP を使って
フロントエンドの画面操作を行い、
操作内容と結果を人間が目視確認できるようにする。

**Why this priority**: AI エージェントの成果物確認や
デモを人間が視覚的に追跡できる手段の整備。

**Independent Test**: Playwright MCP でページ操作を行い、
操作手順と結果のスクリーンショットが記録されることを確認する。

**Acceptance Scenarios**:

1. **Given** Playwright MCP が設定済みである,
   **When** AI エージェントがフロントエンドを操作する,
   **Then** 操作手順と各ステップのスクリーンショットが記録される
2. **Given** 記録された操作手順がある,
   **When** 人間が確認する,
   **Then** どのページで何を操作し何が表示されたかが追跡可能である

---

### Edge Cases

- E2E テストでの外部依存（DynamoDB/S3）のモック方式
- CI 環境でのブラウザインストールとキャッシュ
- Lighthouse CI のスコア揺れ（パフォーマンスは除外しアクセシビリティのみ）
- プロパティベーステストの実行時間制御（タイムアウト設定）
- テスト環境と本番環境のデータ差異への対応

## Requirements

### Functional Requirements

- **FR-001**: Playwright をフロントエンドプロジェクトに導入し、
  E2E テストを `npm run test:e2e` で実行できなければならない（MUST）
- **FR-002**: E2E テストはテーマ一覧ページ・比較結果テーブルページ・
  プロバイダーフィルタの主要フローをカバーしなければならない（MUST）
- **FR-003**: プロパティベーステストライブラリ（fast-check）を導入し、
  データ変換・バリデーション関数に適用しなければならない（MUST）
- **FR-004**: CI（GitHub Actions）で E2E テストを PR ごとに
  自動実行しなければならない（MUST）
- **FR-005**: CI で Lighthouse CI をトップページ（/）に対して実行し、
  アクセシビリティスコアが 90 未満の場合に警告（CI はパスするが
  PR コメントで通知）を出さなければならない（MUST）。
  計測対象ページは将来的に拡張可能とする
- **FR-006**: E2E テストで使用するテストデータは
  Next.js のデータ取得関数をモックし固定テストデータを返す方式で
  外部依存（AWS）を排除しなければならない（MUST）
- **FR-007**: Playwright MCP による画面操作手順のドキュメントを
  作成しなければならない（MUST）
- **FR-008**: テスト結果のレポート（HTML）を CI アーティファクトとして
  7 日間保存しなければならない（MUST）
- **FR-009**: プロパティベーステストの実行時間は 1 テストあたり
  5 秒以内に制限しなければならない（MUST）
- **FR-010**: E2E テストは並列実行に対応し、
  CI での実行時間を 3 分以内に抑えなければならない（MUST）

### Key Entities

- **E2E テストスイート**: Playwright で記述されたブラウザテスト群
- **プロパティベーステスト**: fast-check で記述されたランダムテスト群
- **CI ワークフロー**: GitHub Actions の品質チェックジョブ
- **Lighthouse CI**: アクセシビリティスコア計測ジョブ
- **操作手順ドキュメント**: Playwright MCP の使い方ガイド

## Success Criteria

### Measurable Outcomes

- **SC-001**: E2E テストが主要 3 ページ（一覧・テーブル・フィルタ）の
  ハッピーパスをカバーしている
- **SC-002**: プロパティベーステストが parse-issue と
  JSON Schema バリデーションに適用されている
- **SC-003**: CI で全テスト実行が 5 分以内に完了する
- **SC-004**: Lighthouse アクセシビリティスコアが 90 以上で安定する
- **SC-005**: Playwright MCP の操作手順ドキュメントが作成され、
  AI エージェントが参照可能である

## Assumptions

- フロントエンド（005-comparison-pages）が実装済みで、
  ローカルで `npm run dev` が動作する
- E2E テストは開発サーバー（localhost:3000）に対して実行する
- Playwright のブラウザは Chromium のみで十分
  （社内ユーザー向け、クロスブラウザは将来フェーズ）
- Lighthouse CI は GitHub Actions 上で headless Chrome で実行する
- プロパティベーステストには fast-check を使用する
  （Vitest との統合がスムーズ）
- Playwright MCP は Kiro CLI / Claude Code 環境で利用する前提

## Clarifications

### Session 2026-07-05

- Q: E2E テストのデータ方式は？
  → A: Next.js のデータ取得関数をモックし、固定テストデータを使う。
  実 AWS アクセス不要で CI でも安定動作する
