# CI/CD Requirements Quality Checklist: 基盤インフラ

**Purpose**: CI/CD パイプライン要件の品質・完全性を検証する
**Created**: 2026-07-04
**Feature**: [spec.md](../spec.md)
**Depth**: Standard

## Requirement Completeness

- [x] CHK001 - CI ワークフローのタイムアウト値は定義されているか？
  SC-003 で「3分以内」と定めているが、ジョブレベル・ステップレベルの
  `timeout-minutes` 要件が未指定 [Completeness] [Spec §SC-003]
- [ ] CHK002 - CD ワークフローの失敗時リトライ戦略は定義されているか？
  CDK デプロイ失敗時に自動リトライするか手動再実行かが未規定
  [Completeness] [Gap] [contracts/cdk-stacks.md §CD Workflow]
- [x] CHK003 - CI/CD ワークフローの Node.js バージョン要件は明記されているか？
  Setup Node.js ステップのバージョン指定ポリシー（固定 or マトリクス）が未定義
  [Completeness] [contracts/cdk-stacks.md §CI Workflow]
- [x] CHK004 - 依存関係キャッシュ戦略（npm/pnpm キャッシュ）の要件は定義されているか？
  CI 3分以内の達成に影響するが、キャッシュ有無・方式が未規定
  [Completeness] [Gap] [Spec §SC-003]
- [ ] CHK005 - CD デプロイ失敗時のロールバック方針は要件として記述されているか？
  Edge Cases に「復旧手順」の言及はあるが、自動ロールバック/手動判断の基準が未定義
  [Completeness] [Spec §Edge Cases]

## Requirement Clarity

- [x] CHK006 - FR-007 の「Lint・型チェック・テスト」と
  contracts の Step 一覧は一致しているか？
  contracts では CDK synth + cdk-nag を含む 7 ステップだが、
  FR-007 は 3 項目のみ記載しており差分の意図が不明確
  [Clarity] [Consistency] [Spec §FR-007] [contracts/cdk-stacks.md §CI Workflow]
- [ ] CHK007 - FR-009 の Express mode 使用条件は明確に定義されているか？
  「dev 環境で Express mode」とあるが、CI の synth 時やドリフト検出時の
  モード選択基準が未規定 [Clarity] [Spec §FR-009]
- [ ] CHK008 - OIDC トークン有効期限切れ時のエラーハンドリング要件は
  具体化されているか？
  Edge Cases に言及があるが、リトライ回数・待機時間・通知先が未定義
  [Clarity] [Measurability] [Spec §Edge Cases]

## Requirement Consistency

- [ ] CHK009 - CI ワークフローの AWS 認証要否は spec と contracts で一貫しているか？
  contracts では「CI は AWS 認証不要（synth のみ）」とあるが、
  FR-003 の cdk-nag チェックにアカウント依存の context 値が必要な場合の扱いが未整理
  [Consistency] [Spec §FR-003] [contracts/cdk-stacks.md §CI Workflow]
- [ ] CHK010 - SC-004 の「10分以内」と Express mode の整合性は取れているか？
  Express mode は通常デプロイより高速だが、10分は標準モード前提の値に見える。
  目標値の根拠が不明確 [Consistency] [Measurability] [Spec §SC-004]
- [x] CHK011 - CD ワークフローのトリガー定義は spec と contracts で統一されているか？
  FR-007 は「main マージ時」、contracts は `push (branches: main)` と記載。
  直接 push と PR マージの区別が曖昧 [Consistency] [Spec §FR-007]
  [contracts/cdk-stacks.md §CD Workflow]

## Scenario Coverage

- [x] CHK012 - CI と CD が同時実行される場合の振る舞い要件は定義されているか？
  main への push で CD が走る最中に新 PR の CI が起動するケースの
  concurrency 制御が未規定 [Coverage] [Gap]
- [ ] CHK013 - CD デプロイ成功・失敗時の通知要件は定義されているか？
  Slack・GitHub Status・メール等の通知チャネルや条件が未規定
  [Coverage] [Gap] [contracts/cdk-stacks.md §CD Workflow]
- [ ] CHK014 - OIDC ロールの信頼ポリシーが main ブランチ限定である前提は
  テストシナリオで検証対象になっているか？
  Assumptions に記載はあるが、feature ブランチからの誤デプロイ防止が
  シナリオとして未定義 [Coverage] [Spec §Assumptions]
- [ ] CHK015 - 複数スタック間のデプロイ順序要件は定義されているか？
  StorageStack のみの現状だが、後続スタック追加時の依存関係解決方針が未規定
  [Coverage] [Gap] [contracts/cdk-stacks.md §StorageStack]

## Edge Case Coverage

- [ ] CHK016 - GitHub Actions ランナーの一時的な障害（ネットワーク断等）発生時の
  要件は定義されているか？Install dependencies 失敗時のリトライポリシーが未規定
  [Gap] [contracts/cdk-stacks.md §CI Workflow]
- [ ] CHK017 - CDK Express mode 固有の制約（サポート外リソースタイプ等）に対する
  フォールバック要件は定義されているか？
  Express mode 非対応リソース追加時の切り替え基準が未規定
  [Gap] [Spec §FR-009]
- [x] CHK018 - CD ワークフロー実行中に新たな main push が発生した場合の
  concurrency 制御（cancel-in-progress 等）要件は定義されているか？
  デプロイ競合によるスタック不整合リスクへの対処が未規定
  [Gap] [contracts/cdk-stacks.md §CD Workflow]
