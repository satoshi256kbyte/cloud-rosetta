# Feature Specification: フロントエンド（比較結果表示）

**Feature Branch**: `003-frontend`

**Created**: 2026-07-04

**Status**: Draft

**Input**: User description: "Next.js SSR で比較結果ページを表示するフロントエンドを構築する"

## User Scenarios & Testing

### User Story 1 - 比較テーマ一覧ページ (Priority: P1)

ユーザーがトップページにアクセスすると、公開済みの比較テーマ一覧が表示される。
各テーマをクリックすると詳細ページに遷移できる。

**Why this priority**: 一覧がないと個別ページへの導線がなく、
サイトとして成立しない。最初に構築すべき画面。

**Independent Test**: トップページにアクセスし、
DynamoDB から取得した比較テーマが一覧表示される。

**Acceptance Scenarios**:

1. **Given** DynamoDB に published 状態のテーマが存在する,
   **When** ユーザーがトップページにアクセスする,
   **Then** 公開済みテーマの一覧がカード形式で表示される
2. **Given** テーマ一覧が表示されている,
   **When** ユーザーがテーマカードをクリックする,
   **Then** そのテーマの詳細ページに遷移する
3. **Given** DynamoDB に published 状態のテーマが存在しない,
   **When** ユーザーがトップページにアクセスする,
   **Then** 「比較データがまだありません」のメッセージが表示される

---

### User Story 2 - 比較結果詳細ページ (Priority: P2)

ユーザーが特定の比較テーマ・軸の詳細ページにアクセスすると、
プロバイダー間の比較結果がテーブル形式で表示される。
各プロバイダーの詳細情報と参照元リンクが確認できる。

**Why this priority**: 比較結果の閲覧はプロダクトの中核価値であり、
一覧から遷移する先のメインコンテンツ。

**Independent Test**: 特定テーマ・軸の URL にアクセスし、
S3 から取得した比較結果が表示される。

**Acceptance Scenarios**:

1. **Given** S3 に比較結果データが存在する,
   **When** ユーザーが `/comparisons/{themeId}/{axisId}` にアクセスする,
   **Then** プロバイダー比較テーブルが SSR で表示される
2. **Given** 比較結果詳細ページが表示されている,
   **When** テーブルの内容を確認する,
   **Then** 各プロバイダーの名前・サービス名・概要・参照元が表示される
3. **Given** 存在しないテーマ・軸の URL にアクセスした,
   **When** ページが読み込まれる,
   **Then** 404 ページが表示される

---

### User Story 3 - AWS Amplify Hosting へのデプロイ (Priority: P3)

Next.js アプリケーションが AWS Amplify Hosting にデプロイされ、
インターネット経由でアクセス可能になる。

**Why this priority**: US1・US2 が動作する状態でデプロイし、
実際のユーザーがアクセスできるようにする最終ステップ。

**Independent Test**: Amplify Hosting の URL にアクセスし、
比較テーマ一覧と詳細ページが表示される。

**Acceptance Scenarios**:

1. **Given** Next.js アプリケーションが実装されている,
   **When** Amplify Hosting にデプロイする,
   **Then** 提供された URL でアプリケーションにアクセスできる
2. **Given** Amplify Hosting にデプロイされている,
   **When** 比較結果が S3/DynamoDB に追加される,
   **Then** ページをリロードすると最新データが表示される（SSR）
3. **Given** Amplify Hosting にデプロイされている,
   **When** main ブランチにフロントエンドの変更がマージされる,
   **Then** Amplify Hosting が自動的に再デプロイする

---

### Edge Cases

- DynamoDB/S3 への接続がタイムアウトした場合のエラーページ表示
- 比較結果データが不完全（providers が空等）な場合のフォールバック表示
- 同時多数アクセス時の SSR パフォーマンス（初期は 100 人規模のため考慮不要）
- Amplify Hosting のビルド失敗時のロールバック

## Requirements

### Functional Requirements

- **FR-001**: Next.js（App Router）で SSR を使用し、
  比較結果ページをサーバーサイドでレンダリングしなければならない（MUST）
- **FR-002**: トップページ（`/`）で DynamoDB の GSI ByStatus から
  `status=published` のテーマ一覧を取得し表示しなければならない（MUST）
- **FR-003**: 詳細ページ（`/comparisons/[themeId]/[axisId]`）で
  S3 から比較結果 JSON を取得し表示しなければならない（MUST）
- **FR-004**: AWS SDK v3 を使用して DynamoDB/S3 にアクセスしなければならない（MUST）
- **FR-005**: AWS Amplify Hosting にデプロイし、
  VPC を必要としない構成としなければならない（MUST）
- **FR-006**: Amplify Hosting は main ブランチへの push で
  自動ビルド・デプロイを行わなければならない（MUST）
- **FR-007**: SSR のデータ取得でエラーが発生した場合、
  ユーザーにエラーメッセージを表示しなければならない（MUST）。
  500 エラーページではなく、適切なフォールバック UI を提供する
- **FR-008**: ページは日本語で表示し、
  レスポンシブデザイン（モバイル・デスクトップ対応）としなければならない（MUST）
- **FR-009**: Amplify Hosting のランタイムから DynamoDB/S3 にアクセスするための
  IAM ロールを設定しなければならない（MUST）。読み取り権限のみとする
- **FR-010**: Next.js プロジェクトは `frontend/` ディレクトリに配置し、
  `infra/`・`scripts/` とは独立した構成としなければならない（MUST）

### Key Entities

- **トップページ（/）**: 比較テーマ一覧（DynamoDB GSI ByStatus から取得）
- **詳細ページ（/comparisons/[themeId]/[axisId]）**: 比較結果テーブル（S3 から取得）
- **Amplify Hosting**: Next.js SSR のホスティング環境
- **IAM ロール**: Amplify から DynamoDB/S3 への読み取りアクセス用

## Success Criteria

### Measurable Outcomes

- **SC-001**: トップページの初回表示が 2 秒以内に完了する
- **SC-002**: 詳細ページの初回表示が 2 秒以内に完了する
- **SC-003**: main ブランチへの push から Amplify デプロイ完了まで 5 分以内
- **SC-004**: 比較結果追加後、ページリロードで最新データが表示される（キャッシュなし SSR）
- **SC-005**: モバイル・デスクトップの両方で比較テーブルが可読な状態で表示される

## Assumptions

- 001-foundation-infra と 002-content-management が完了しており、
  DynamoDB テーブルと S3 バケットにデータが存在する
- AWS Amplify Hosting はアカウントで利用可能であり、
  VPC BPA の影響を受けない（マネージドサービスのため）
- 初期フェーズは社内向け（100 人）のため、認証は不要。
  将来の外部公開時に認証を追加する
- CSS フレームワークは軽量なもの（Tailwind CSS）を使用する
- Next.js のバージョンは 15 系（App Router）を使用する
- Amplify Hosting の設定は CDK（`@aws-cdk/aws-amplify-alpha` または L1）で管理する
