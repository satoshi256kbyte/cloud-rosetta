# Workflow Requirements Quality Checklist: AIエージェント比較自動実行

**Purpose**: GitHub Actions トリガー・ラベル自動化・並行制御・エラーハンドリング・
Issue パース・PR 作成に関する要件の品質を評価する
**Created**: 2026-07-05
**Feature**: [spec.md](../spec.md)
**Depth**: Standard

## Requirement Completeness

- [ ] CHK001 - `agent.yml` ワークフローの `on` トリガー条件（`issues` イベント、
  `labeled` アクション、ラベル名フィルタ）は具体的に定義されているか
  [Completeness] [Spec §FR-001]
- [x] CHK002 - Issue 本文のパース対象フォーマット（テーマID・軸ID・プロバイダーの
  記述形式、Issue テンプレートの構造）は明示されているか [Completeness] [Spec §FR-003]
- [x] CHK003 - PR 自動作成時のブランチ命名規則（`agent/{テーマID}/{軸ID}` 等）、
  コミットメッセージフォーマット、PR テンプレートの内容は定義されているか
  [Completeness] [Spec §FR-007]
- [x] CHK004 - GitHub Actions の OIDC IAM ロールに追加すべき Bedrock 権限の
  ポリシー内容は具体的に列挙されているか [Completeness] [Spec §Assumptions]

## Requirement Clarity

- [x] CHK005 - 「二重実行を防止」の具体的な実装手段は明確か。ラベルチェックのみか、
  GitHub Actions の `concurrency` グループも併用するか、
  あるいはロックメカニズムを使うか [Clarity] [Spec §FR-002]
- [ ] CHK006 - ラベル遷移フロー（`proposed` → `approved` → `in-progress` →
  `review` / `proposed`（エラー時））の状態遷移図は定義されているか。
  各遷移の責任主体（人間 or ワークフロー）は明確か [Clarity] [Spec §FR-001, §FR-008, §FR-009]
- [x] CHK007 - エラー発生時の「Issue にエラー内容をコメント」のコメント形式
  （構造化フォーマット、含めるべき情報の項目）は定義されているか
  [Clarity] [Spec §FR-009]

## Requirement Consistency

- [ ] CHK008 - SC-004「エラー発生時、Issue への通知が 1 分以内」と
  FR-010「タイムアウト 15 分」の関係は整合しているか。タイムアウト検知後
  1 分以内に通知できるアーキテクチャになっているか
  [Consistency] [Spec §SC-004, §FR-010]
- [ ] CHK009 - FR-009 でエラー時にラベルを `proposed` に戻すとあるが、
  `proposed` は元のラベルか。`approved` が付与された時点で `proposed` は
  除去されている前提か、併存する前提か [Consistency] [Spec §FR-009, §US1]

## Scenario Coverage

- [ ] CHK010 - ワークフロー実行中に Issue が手動で閉じられた場合、
  またはラベルが手動で変更された場合の振る舞いは定義されているか
  [Coverage] [Spec §Edge Cases]
- [x] CHK011 - GitHub Actions の実行権限（`issues: write`, `contents: write`,
  `pull-requests: write` 等）の必要なパーミッション一覧は明示されているか
  [Coverage] [Spec §FR-007]
- [x] CHK012 - 同一テーマ・軸に対して既存 PR がある場合の処理（更新 or スキップ or
  エラー）は明確に定義されているか [Coverage] [Spec §Edge Cases]

## Edge Case Coverage

- [x] CHK013 - Issue テンプレートの入力内容が不正な場合（テーマID 未記入、
  存在しない軸ID、プロバイダー名のタイポ等）のバリデーションルールと
  エラーメッセージは定義されているか [Gap] [Spec §Edge Cases]
- [ ] CHK014 - GitHub API のレート制限（ラベル操作、コメント投稿、PR 作成）に
  到達した場合のリトライ戦略は記載されているか [Gap] [Spec §Edge Cases]
- [ ] CHK015 - ワークフローの secrets/環境変数（AWS ロール ARN、リージョン、
  エージェント ID 等）の一覧と設定場所は定義されているか [Gap] [Spec §Assumptions]
