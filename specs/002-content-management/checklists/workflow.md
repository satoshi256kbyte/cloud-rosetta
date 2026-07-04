# Workflow Requirements Quality Checklist: 比較結果コンテンツ管理

**Purpose**: ワークフロー要件の品質・完全性を検証する
**Created**: 2026-07-04
**Feature**: [spec.md](../spec.md)
**Depth**: Standard

## Trigger Conditions

- [ ] CHK001 - `sync.yml` の paths フィルタ `comparisons/**` は、
  ネストしたディレクトリ変更（例: `comparisons/theme/axis/result.json`）を
  すべて捕捉するパターンとして十分に定義されているか [Completeness] [Spec §FR-006]
- [ ] CHK002 - `push` to `main` 以外のトリガー条件（手動実行 `workflow_dispatch`、
  リラン時の挙動）は考慮されているか [Gap] [Workflows §sync.yml]
- [ ] CHK003 - `comparisons/` 配下のファイル削除（ファイル追加ではなく削除）が
  トリガーされた場合の想定動作は定義されているか [Coverage] [Spec §FR-006]

## Timeout & Retry

- [x] CHK004 - 同期ワークフロー全体および個別ステップ（S3 PutObject、
  DynamoDB PutItem）のタイムアウト値は定量的に規定されているか
  [Completeness] [Spec §SC-003]
- [x] CHK005 - S3/DynamoDB への API コールが一時的エラー（throttle, 5xx）で
  失敗した場合のリトライ回数・バックオフ戦略は定義されているか
  [Gap] [Workflows §sync-to-aws.ts]
- [x] CHK006 - DynamoDB の ConditionExpression 失敗（バージョン競合）時の
  リトライまたはスキップのポリシーは明記されているか
  [Completeness] [Spec §FR-008, Edge Cases]

## Concurrency

- [ ] CHK007 - `cancel-in-progress: false` の設計判断に対して、
  キュー上限（同時待機数）やデッドロックの考慮は記述されているか
  [Clarity] [Workflows §Concurrency]
- [ ] CHK008 - 同一テーマ・軸に対する複数コミットが短時間に連続した場合の
  順序保証（FIFO）は要件として定義されているか
  [Gap] [Spec Edge Cases]

## Label Automation

- [x] CHK009 - Issue ラベル状態遷移（proposed → approved → in-progress →
  review → done）のうち、どのステップが自動化され、どのステップが手動かは
  明確に区別されているか [Clarity] [Spec §FR-002]
- [ ] CHK010 - PR マージ後に関連 Issue のラベルを `done` へ自動変更する
  要件は定義されているか、それとも意図的にスコープ外か
  [Coverage] [Spec §FR-002, US3]

## Workflow Dependencies & Error Handling

- [ ] CHK011 - `sync.yml` と `ci.yml`（スキーマバリデーション）の実行順序・
  依存関係は明示されているか。CI が未完了のまま sync が走る可能性は
  考慮されているか [Consistency] [Spec §FR-005, §FR-006]
- [ ] CHK012 - 同期失敗時の通知方法について「GitHub Actions 標準機能のみ」と
  あるが、通知先（リポジトリ管理者、PR 作成者等）は特定されているか
  [Clarity] [Spec §Clarifications]
- [x] CHK013 - 部分失敗（複数エントリのうち一部のみ同期成功）の場合、
  成功分のロールバック要否は要件として定義されているか
  [Gap] [Workflows §sync-to-aws.ts, Spec Edge Cases]

## Paths Filter & Scope

- [ ] CHK014 - `comparisons/**` 以外のファイル変更（例: スキーマ定義ファイル、
  同期スクリプト自体の変更）が同時にマージされた場合の
  ワークフロー挙動は定義されているか [Coverage] [Spec §FR-006]
- [ ] CHK015 - detect-changes スクリプトが `GITHUB_EVENT_BEFORE` を参照するが、
  force-push や squash merge で before SHA が無効になるケースの
  要件定義はあるか [Completeness] [Workflows §detect-changes.ts]
