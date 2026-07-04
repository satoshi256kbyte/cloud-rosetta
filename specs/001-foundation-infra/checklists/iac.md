# IaC Requirements Quality Checklist: 基盤インフラ

**Purpose**: IaC（AWS CDK）要件の品質・完全性を検証する
**Created**: 2026-07-04
**Feature**: [spec.md](../spec.md)
**Depth**: Standard

## Requirement Completeness

- [ ] CHK001 - スタック分割の粒度と責務境界が定義されているか？
  Storage Stack のみ記載されているが、将来のスタック追加時の分割基準が不明
  [Completeness] [Spec §FR-002] [plan.md §Project Structure]
- [x] CHK002 - クロススタック参照の方針（SSM Parameter / CfnOutput / direct ref）が
  要件として定義されているか？
  複数スタック間のデータ共有手法が未記載 [Gap] [plan.md §Project Structure]
- [ ] CHK003 - CDK テストの種類（スナップショット / ファイングレイン / インテグレーション）と
  カバレッジ基準が要件として定義されているか？
  plan.md にテストツール記載はあるがカバレッジ目標が未定義
  [Completeness] [Measurability] [plan.md §Technical Context]
- [ ] CHK004 - デプロイ順序の依存関係（スタック間・リソース間）が要件として明記されているか？
  特にログバケット → データバケットの依存が定義されていない
  [Completeness] [Spec §FR-015]
- [x] CHK005 - タグ付け戦略（必須タグキー・値の形式・付与対象）が要件として定義されているか？
  命名規約は FR-006 にあるがリソースタグの要件が存在しない
  [Gap] [Spec §FR-006]

## Requirement Clarity

- [ ] CHK006 - 命名規約 `{サービス名}-{ステージ名}-{リソース種類}-{用途}` の各要素に
  許容値のリスト・文字種制限が明示されているか？
  S3 バケット名の文字数制限（63文字）との整合が不明
  [Clarity] [Spec §FR-006] [Spec §SC-006]
- [ ] CHK007 - cdk-nag 抑制ルールの管理場所（インライン vs 集約ファイル）と
  許容される抑制理由の基準が具体的に定義されているか？
  「PR レビューで承認」のみでは判断基準が曖昧
  [Clarity] [Spec §FR-016]
- [ ] CHK008 - Express mode（`--express`）の適用条件が dev 環境のみと明記されているが、
  stg 環境が追加された場合のモード選択基準が定義されているか？
  [Clarity] [Spec §FR-009]
- [ ] CHK009 - 「最小権限の原則」の具体的な検証方法・合否基準が定量的に定義されているか？
  `grant*()` 優先は記載あるが、カスタムポリシーが必要な場合の許容範囲が不明
  [Clarity] [Measurability] [Spec §FR-014]

## Requirement Consistency

- [x] CHK010 - FR-004（SSE-S3 以上）と FR-015（ログバケット）の暗号化要件は
  ログバケット側にも同じ暗号化基準が適用されると読めるか？
  ログバケット固有の要件が未分離で矛盾の余地がある
  [Consistency] [Spec §FR-004] [Spec §FR-015]
- [ ] CHK011 - FR-017 の削除ポリシー定義に stg 環境の記載がないが、
  FR-002 の環境分離要件（dev/stg/prod）との間に欠落はないか？
  [Consistency] [Spec §FR-002] [Spec §FR-017]
- [ ] CHK012 - plan.md のディレクトリ構造に `stages/dev.ts` があるが、
  spec.md の FR-002 で言及される「スタック分離」との対応関係は明確か？
  Stage パターンと Stack パターンの使い分けが不整合に見える
  [Consistency] [Spec §FR-002] [plan.md §Project Structure]

## Scenario Coverage

- [ ] CHK013 - ドリフト検出（CloudFormation Drift Detection）の運用要件が
  定義されているか？ 手動変更時の検知・復旧シナリオが未記載
  [Coverage] [Gap]
- [ ] CHK014 - CDK Bootstrap バージョンの更新シナリオが要件に含まれているか？
  Assumptions に「Bootstrap 完了済み」とあるが、バージョン不一致時の対処が未定義
  [Coverage] [Spec §Assumptions]
- [ ] CHK015 - GitHub Actions OIDC ロールの信頼ポリシーが
  「main ブランチのみ許可」と記載されているが、
  feature ブランチからの `cdk diff` 実行可否が要件として定義されているか？
  [Coverage] [Spec §FR-008] [Spec §Assumptions]

## Edge Case Coverage

- [ ] CHK016 - S3 バケット名衝突時のフォールバック（アカウント ID 付与）が
  Edge Cases に記載されているが、命名規約 FR-006 との整合ルールが定義されているか？
  フォールバック後の名前が規約に収まるか不明
  [Consistency] [Spec §FR-006] [Spec §Edge Cases]
- [x] CHK017 - DynamoDB の DeletionProtection 有効化が prod 環境のみと
  Edge Cases に記載されているが、FR-005 や FR-017 の本文で
  正式な要件として定義されているか？ Edge Cases のみだと実装漏れのリスクがある
  [Completeness] [Spec §FR-005] [Spec §Edge Cases]
- [x] CHK018 - cdk-nag チェック失敗時の CI ワークフローの振る舞い
  （エラー終了 vs 警告レポート）が要件として定義されているか？
  SC-002 は「0 件の未対処エラー」だが CI での扱いが未記載
  [Coverage] [Spec §FR-003] [Spec §SC-002]
