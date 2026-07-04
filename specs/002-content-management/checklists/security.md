# Security Requirements Quality Checklist: 比較結果コンテンツ管理

**Purpose**: セキュリティ要件の品質・完全性を検証する
**Created**: 2026-07-04
**Feature**: [spec.md](../spec.md)
**Depth**: Standard

## Requirement Completeness

- [ ] CHK001 - [Completeness] OIDC 認証の信頼ポリシー条件（subject claim のフィルタ、
  リポジトリ・ブランチの制限等）が定義されているか？
  FR-009 は「OIDC 認証で AWS にアクセス」とのみ記述しており、
  トークンの検証条件が未指定 [Spec §FR-009]
- [ ] CHK002 - [Completeness] IAM ポリシーのリソース ARN スコープが具体的に
  定義されているか？ 「S3/DynamoDB への書き込み権限のみ」とあるが、
  対象バケット名・テーブル名・キープレフィックスの制限が未記載 [Spec §FR-009]
- [ ] CHK003 - [Gap] S3 に格納されるデータの保存時暗号化（encryption at rest）に
  関する要件が存在するか？ SSE-S3 / SSE-KMS 等の指定がない [Spec §FR-006]
- [ ] CHK004 - [Gap] DynamoDB テーブルの暗号化方式（AWS owned key / CMK）に
  関する要件が存在するか？ [Spec §FR-007]
- [x] CHK005 - [Coverage] 同期スクリプトが処理する入力データ（result.json）に対し、
  スキーマバリデーション以外のセキュリティ観点の入力検証
  （最大サイズ、禁止文字、パストラバーサル防止等）が定義されているか？
  [Spec §FR-005, §FR-010]
- [ ] CHK006 - [Gap] GitHub Actions ワークフロー内で使用する
  `AWS_ROLE_ARN` シークレットのローテーション要件・有効期限が
  定義されているか？ [Workflows §sync.yml]
- [ ] CHK007 - [Clarity] OIDC トークンのセッション有効期間（duration）が
  明示されているか？ 同期処理が長時間化した場合のトークン期限切れへの
  対処が不明確 [Spec §FR-009, Workflows §sync.yml]
- [x] CHK008 - [Completeness] S3 PutObject 時の通信経路の暗号化要件
  （TLS バージョン制限、バケットポリシーでの `aws:SecureTransport` 強制等）が
  定義されているか？ [Spec §FR-006]
- [ ] CHK009 - [Coverage] DynamoDB の ConditionExpression による排他制御で
  競合が発生した場合のリトライ上限・バックオフ戦略がセキュリティ観点
  （DoS 耐性）から定義されているか？ [Workflows §sync-to-aws.ts]
- [ ] CHK010 - [Consistency] FR-009 は「書き込み権限のみ」と記述するが、
  sync-to-aws.ts は DynamoDB GetItem（読み取り）も実行する。
  IAM ポリシーの権限範囲の記述に矛盾がないか？
  [Spec §FR-009, Workflows §sync-to-aws.ts]
- [x] CHK011 - [Gap] 同期ワークフローの実行ログに機密情報
  （AWS アカウント ID、ロール ARN 等）が露出しないための
  マスキング要件が定義されているか？ [Workflows §sync.yml]
- [x] CHK012 - [Coverage] `themeId` / `axisId` が S3 キーパスに直接使用されるが、
  これらの値に対するバリデーション要件（許可文字種、長さ制限）が
  インジェクション防止の観点で定義されているか？
  [Spec §FR-004, Workflows §detect-changes.ts]
- [ ] CHK013 - [Gap] 同期失敗時に DynamoDB レコードを削除する処理について、
  削除権限の必要性が IAM ポリシー要件に含まれているか？
  また、意図しない削除を防ぐ条件（ConditionExpression）の
  要件が定義されているか？ [Workflows §sync-to-aws.ts]
- [ ] CHK014 - [Completeness] GitHub Actions ワークフローの
  `permissions` ブロック（最小権限: `id-token: write`,
  `contents: read` 等）が要件として明示されているか？
  [Spec §FR-009, Workflows §sync.yml]
