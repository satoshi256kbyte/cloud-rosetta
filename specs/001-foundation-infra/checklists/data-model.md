# Data Model Requirements Quality Checklist: 基盤インフラ

**Purpose**: データモデル要件の品質・完全性を検証する
**Created**: 2026-07-04
**Feature**: [spec.md](../spec.md)
**Depth**: Standard

## Requirement Completeness

- [ ] CHK001 - DynamoDB テーブルの TTL 属性に関する要件が定義されているか？
  archived 状態のアイテムに対する自動削除・有効期限ポリシーが未規定
  [Completeness] [data-model.md §Entity]
- [ ] CHK002 - S3 オブジェクトのライフサイクルポリシーが要件として定義されているか？
  Assumptions で「後続で検討」と記載されているが、初期要件としての判断基準が未定義
  [Completeness] [Spec §Assumptions]
- [ ] CHK003 - `result.md` ファイルのスキーマ・生成条件が定義されているか？
  S3 キー構造に `result.md` が含まれるが、生成タイミング・内容仕様が未規定
  [Completeness] [data-model.md §Key Structure]
- [ ] CHK004 - GSI ByStatus の射影（Projection: ALL）を選択した根拠・
  コスト影響が要件として明記されているか？
  [Completeness] [data-model.md §GSI: ByStatus]
- [x] CHK005 - DynamoDB テーブルの削除保護（DeletionProtection）の
  環境別設定が data-model.md 内で明示されているか？
  spec.md Edge Cases には prod での有効化が言及されているが、
  データモデル側の要件定義が不足している
  [Completeness] [Spec §Edge Cases] [Gap]

## Requirement Clarity

- [ ] CHK006 - `themeId` と `axisId` のフォーマット例が十分に示されており、
  命名規則（英小文字・ハイフンのみ、1〜64文字）の境界値が明確か？
  空文字列やハイフン連続（`--`）の許可・禁止が曖昧
  [Clarity] [data-model.md §Validation Rules]
- [x] CHK007 - ステート遷移図の「republish: new version」において、
  version 番号の採番ルール（既存 max+1 か、別のロジックか）が明確に定義されているか？
  [Clarity] [data-model.md §State Transitions]
- [ ] CHK008 - `createdBy` 属性の値形式（GitHub ユーザー名 or エージェント ID）が
  一意に識別可能な形式として定義されているか？
  プレフィックスや名前空間による区別ルールが未定義
  [Clarity] [data-model.md §Entity]

## Requirement Consistency

- [x] CHK009 - spec.md の命名規約 `{サービス名}-{ステージ名}-{リソース種類}-{用途}` と
  data-model.md のテーブル名 `cloud-rosetta-{stage}-ddb-comparison-metadata` が
  整合しているか？「cloud-rosetta」がサービス名に該当するか明示されているか
  [Consistency] [Spec §FR-006] [data-model.md §Entity]
- [x] CHK010 - DynamoDB の `version` 属性（Number 型）と S3 キーの `v{N}` が
  常に同期される前提条件・整合性保証の方法が定義されているか？
  書き込み失敗時の不整合シナリオが未考慮
  [Consistency] [data-model.md §Relationships]
- [x] CHK011 - spec.md §FR-013 の S3 バージョニングと、
  data-model.md のアプリケーションレベル `v{N}` バージョニングの
  責務分担が矛盾なく記述されているか？
  [Consistency] [Spec §FR-013] [data-model.md §Key Structure]

## Scenario Coverage

- [ ] CHK012 - 「テーマ単位取得」アクセスパターンの具体的なクエリ条件
  （PK 指定のみ or PK + SK プレフィックス）が要件として記述されているか？
  [Coverage] [Spec §Clarifications]
- [x] CHK013 - 同一 themeId + axisId に対する同時書き込み（楽観的ロック等）の
  排他制御要件が定義されているか？
  [Coverage] [data-model.md §Entity] [Gap]
- [ ] CHK014 - GSI ByStatus で `status=published` のアイテムが大量になった場合の
  ホットパーティション対策に関する要件・制約値が記述されているか？
  [Coverage] [Measurability] [data-model.md §GSI: ByStatus]

## Edge Case Coverage

- [x] CHK015 - S3 キーの `v{N}` が欠番となるケース
  （バージョン 3 の書き込みに失敗し、次が v4 になる等）の
  許容可否が要件として定義されているか？
  [Gap] [data-model.md §Key Structure]
- [x] CHK016 - DynamoDB と S3 間のトランザクション整合性が保証されない場合の
  リカバリ要件（孤立した S3 オブジェクト、メタデータのみ存在）が定義されているか？
  [Gap] [data-model.md §Relationships]
- [ ] CHK017 - `providers` 配列内のプロバイダー数上限や、
  `sources` 配列のURL数上限など、result.json の
  サイズ制約に関する要件が定量的に定義されているか？
  [Measurability] [data-model.md §result.json Schema]
- [x] CHK018 - ステータスが `archived` から `draft` への直接遷移が
  禁止されているか許可されているか、遷移図と矛盾なく記述されているか？
  現在の図では `published → draft`（republish）のみ記載
  [Gap] [Clarity] [data-model.md §State Transitions]
