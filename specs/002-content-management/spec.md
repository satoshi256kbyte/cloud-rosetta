# Feature Specification: 比較結果コンテンツ管理

**Feature Branch**: `002-content-management`

**Created**: 2026-07-04

**Status**: Draft

**Input**: User description: "GitHub Issue で比較テーマを提案し、
マージ後に S3/DynamoDB へ同期するワークフローを構築する"

## User Scenarios & Testing

### User Story 1 - 比較テーマの提案と管理 (Priority: P1)

社内メンバーが GitHub Issue で比較テーマ・比較軸を提案し、
管理者がレビュー・承認してAIエージェントによる比較作業への着手を判断できる。

**Why this priority**: 比較テーマの提案はワークフロー全体の起点であり、
これが確立しないと後続の比較作業・公開フローが開始できない。

**Independent Test**: Issue テンプレートで比較テーマを作成し、
ラベル操作で状態遷移ができることを確認する。

**Acceptance Scenarios**:

1. **Given** GitHub リポジトリに Issue テンプレートが設定されている,
   **When** メンバーが比較テーマの Issue を作成する,
   **Then** テンプレートに従った構造化された提案が作成される
2. **Given** 比較テーマの Issue が作成されている,
   **When** 管理者が「着手承認」ラベルを付与する,
   **Then** AIエージェントによる比較作業のトリガーとなる状態になる
3. **Given** 比較テーマの Issue が存在する,
   **When** Issue のステータスを確認する,
   **Then** 「提案中」「着手承認済み」「比較作業中」「レビュー待ち」「完了」の
   いずれかの状態が識別できる

---

### User Story 2 - 比較結果の Pull Request 作成 (Priority: P2)

AIエージェント（または人間）が比較結果を Markdown/JSON で作成し、
Pull Request として提出する。レビュアーが内容を確認し、
承認・マージできる。

**Why this priority**: コンテンツの品質ゲート（constitution 原則II）を実現する
中核フローであり、データストアへの同期のトリガーとなる。

**Independent Test**: 比較結果ファイルを含む PR を作成し、
マージできることを確認する。

**Acceptance Scenarios**:

1. **Given** 着手承認済みの比較テーマがある,
   **When** 比較結果ファイル（JSON + Markdown）を含む PR を作成する,
   **Then** PR のテンプレートに従った構造で比較結果がレビュー可能になる
2. **Given** 比較結果の PR が作成されている,
   **When** CI が実行される,
   **Then** 比較結果ファイルのスキーマバリデーションが実行される
3. **Given** 比較結果の PR がレビュー承認された,
   **When** PR を main にマージする,
   **Then** マージ完了が S3/DynamoDB 同期のトリガーとなる

---

### User Story 3 - S3/DynamoDB への同期 (Priority: P3)

PR がマージされたとき、比較結果を S3 に、メタデータを DynamoDB に
自動同期する。同期完了後、フロントエンドから最新データを取得できる。

**Why this priority**: データの永続化と公開を自動化する最終ステップ。
US1・US2 が確立した後に構築する。

**Independent Test**: 比較結果 PR をマージし、S3 と DynamoDB に
正しいデータが格納されることを確認する。

**Acceptance Scenarios**:

1. **Given** 比較結果の PR が main にマージされた,
   **When** GitHub Actions の同期ワークフローが起動する,
   **Then** 比較結果 JSON が S3 の所定のキーに書き込まれる
2. **Given** S3 への書き込みが成功した,
   **When** DynamoDB のメタデータを確認する,
   **Then** テーマ・軸・ステータス（published）・更新日時が登録されている
3. **Given** 同期が完了した,
   **When** S3 のオブジェクトキーを確認する,
   **Then** `comparisons/{テーマID}/{軸ID}/v{N}/result.json` に
   正しいバージョン番号で格納されている
4. **Given** 同期ワークフローで S3 書き込みが失敗した,
   **When** エラーハンドリングが実行される,
   **Then** DynamoDB のステータスは `draft` のまま維持され、
   GitHub Actions がエラーステータスで終了する

---

### Edge Cases

- 同一テーマ・軸に対して複数の PR が同時にマージされた場合のバージョン競合
- 比較結果 JSON がスキーマに違反している場合の CI でのブロック
- S3/DynamoDB 同期中に部分的に失敗した場合のデータ整合性維持
- 比較テーマの Issue が削除された場合、関連 PR の取り扱い
- 既に published 状態のテーマに対する更新（バージョンインクリメント）

## Requirements

### Functional Requirements

- **FR-001**: GitHub Issue テンプレートを提供し、比較テーマの提案に必要な情報
  （テーマ名、比較対象プロバイダー、比較軸、提案理由）を構造化して収集しなければならない（MUST）
- **FR-002**: 比較テーマの Issue は、ラベルによる状態管理
  （proposed / approved / in-progress / review / done）を行わなければならない（MUST）
- **FR-003**: Pull Request テンプレートを提供し、比較結果の PR に
  関連 Issue 番号・変更概要を含めなければならない（MUST）
- **FR-004**: 比較結果ファイルは `comparisons/{テーマID}/{軸ID}/` ディレクトリに
  `result.json` と `result.md` として配置しなければならない（MUST）
- **FR-005**: CI ワークフローで比較結果 JSON のスキーマバリデーションを
  実行しなければならない（MUST）。スキーマ違反の場合は CI を失敗させる
- **FR-006**: main ブランチへのマージをトリガーに、`comparisons/` ディレクトリ配下の
  変更を検知する専用ワークフロー（`sync.yml`）で S3/DynamoDB 同期を実行しなければならない（MUST）。
  CDK デプロイ（`cd.yml`）とは独立したワークフローとする
- **FR-007**: 同期ワークフローは、DynamoDB にメタデータを書き込み後、
  S3 に比較結果データを書き込む順序で実行しなければならない（MUST）。
  S3 書き込み失敗時は DynamoDB のステータスを `draft` に維持する
- **FR-008**: 比較結果のバージョン番号は、DynamoDB の既存レコードの
  version 値 + 1 で自動採番しなければならない（MUST）。
  新規テーマの場合は version = 1 とする
- **FR-009**: 同期ワークフローは OIDC 認証で AWS にアクセスし、
  S3/DynamoDB への書き込み権限のみを持つ IAM ポリシーを使用しなければならない（MUST）
- **FR-010**: 比較結果 JSON のスキーマを JSON Schema として
  リポジトリに管理しなければならない（MUST）
- **FR-011**: 同期ワークフローは冪等でなければならない（MUST）。
  同一コミットに対して再実行した場合、既に同期済みのデータを二重書き込みしない。
  DynamoDB の ConditionExpression（version 一致チェック）で重複を防止する
- **FR-012**: DynamoDB への書き込みでバージョン競合
  （ConditionalCheckFailedException）が発生した場合、
  同期ワークフローはリトライせずエラー終了しなければならない（MUST）。
  手動での再実行判断を待つ
- **FR-013**: 同期ワークフローのタイムアウトは、ジョブレベルで 5 分、
  個別の AWS API コール（S3 PutObject, DynamoDB PutItem）は 30 秒とする（MUST）
- **FR-014**: 同期スクリプトの入力データ（result.json）は、
  同期前に再度スキーマバリデーションを実行しなければならない（MUST）。
  CI と同期で二重チェックし、不正データの書き込みを防止する
- **FR-015**: 複数のテーマ・軸が同一 PR で同時に変更された場合、
  各エントリは独立して同期し、一部失敗しても他のエントリの同期を継続しなければならない（MUST）。
  最終結果として部分成功・部分失敗をレポートする
- **FR-016**: result.md は result.json から同期ワークフロー内で自動生成する（MUST）。
  テンプレートは比較テーマ名・各プロバイダーのサマリー・ソースリンクを
  テーブル形式で出力する
- **FR-017**: JSON Schema に `additionalProperties: false` を設定し、
  未定義フィールドの混入を防止しなければならない（MUST）
- **FR-018**: themeId / axisId は S3 キーパスに直接使用されるため、
  パストラバーサル攻撃を防止するバリデーション（`..` や `/` を含まない）を
  同期スクリプト内で実行しなければならない（MUST）
- **FR-019**: 同期ワークフローの実行ログに AWS 認証情報やセッショントークンが
  出力されないよう、ログマスキングを設定しなければならない（MUST）
- **FR-020**: Issue ラベルの状態遷移（proposed → done）のうち、
  `proposed` の自動付与は Issue テンプレートのデフォルトラベル機能で実現する（MUST）。
  その他のラベル変更（approved, in-progress, review, done）は手動操作とする

### Key Entities

- **Comparison Theme Issue**: 比較テーマの提案を管理する GitHub Issue
- **Comparison Result PR**: 比較結果を含む Pull Request
- **result.json**: 比較結果の構造化データ（providers, sources 等）
- **result.md**: 比較結果の人間可読な Markdown 版
- **Sync Workflow**: main マージ後に S3/DynamoDB へ同期する GitHub Actions ワークフロー
- **JSON Schema**: result.json のバリデーション定義

## Success Criteria

### Measurable Outcomes

- **SC-001**: Issue テンプレートから比較テーマを提案し、
  ラベル操作で状態遷移が完了するまで 2 分以内
- **SC-002**: 比較結果 JSON のスキーマバリデーションが CI で 30 秒以内に完了する
- **SC-003**: PR マージから S3/DynamoDB 同期完了まで 2 分以内
- **SC-004**: 同期後、S3 と DynamoDB のデータが data-model.md の定義と 100% 一致する
- **SC-005**: S3 書き込み失敗時、DynamoDB のステータスが
  draft のまま維持される（データ整合性保証）

## Assumptions

- 基盤インフラ（001-foundation-infra）が完了しており、
  S3 バケットと DynamoDB テーブルが存在する
- GitHub Actions の OIDC 認証 IAM ロールは既に設定済み。
  S3/DynamoDB への書き込み権限は既存ロールに追加するか、
  専用ロールを新規作成する（実装計画フェーズで決定）
- AIエージェントによる自動的な比較結果生成は後続フェーズ（003）で実装する。
  本フェーズでは人間またはエージェントが手動で PR を作成する前提
- 比較結果の Markdown（result.md）は JSON から生成する方式とし、
  生成ロジックは同期ワークフロー内で実行する
- Issue テンプレートと PR テンプレートは GitHub の標準機能
  （`.github/ISSUE_TEMPLATE/` と `.github/pull_request_template.md`）を使用する

## Clarifications

### Session 2026-07-04

- Q: 同期ワークフローと既存 CD ワークフローの関係は？
  → A: 新規 `sync.yml` を作成し、`comparisons/` 配下の変更時のみ実行する。
  CDK デプロイ（cd.yml）とは独立。paths フィルタで対象を限定する
- Q: 同期失敗時の通知方法は？
  → A: GitHub Actions の標準機能のみ（失敗ステータス + メール通知）。
  初期フェーズでは Slack 連携等は不要
