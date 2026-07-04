# Schema Requirements Quality Checklist: 比較結果コンテンツ管理

**Purpose**: JSON Schemaバリデーション要件の品質・完全性を検証する
**Created**: 2026-07-04
**Feature**: [spec.md](../spec.md)
**Depth**: Standard

## Requirement Completeness

- [ ] CHK001 - スキーマバージョニングポリシーは定義されているか？
  schema.json 自体のバージョン管理方法（ファイル内バージョン番号、
  Git タグ連動等）が spec.md に記載されていない [Gap]
  [Spec §FR-010] [data-model.md §Schema]
- [ ] CHK002 - スキーマの破壊的変更（breaking change）の判断基準と
  移行ポリシーは明文化されているか？
  既存 result.json との後方互換性をどう扱うか未定義 [Gap]
  [Spec §FR-010]
- [ ] CHK003 - CI バリデーション失敗時のエラーメッセージ要件は
  具体的に規定されているか？
  「CI を失敗させる」のみで、開発者が修正可能な情報量の基準がない [Clarity]
  [Spec §FR-005]
- [ ] CHK004 - `providers` 配列の上限（maxItems）は定義されているか？
  minItems: 2 のみで上限なし。意図的な無制限か制約漏れか不明 [Completeness]
  [data-model.md §Schema]
- [ ] CHK005 - `sources` 配列内 URL のフォーマット制約は十分に規定されているか？
  `format: "uri"` のみで、許可スキーム（https のみ等）や
  ドメイン制限の要否が未記載 [Completeness]
  [data-model.md §Schema]
- [ ] CHK006 - `themeId` / `axisId` のパターン制約と
  ディレクトリパスの整合性は明示されているか？
  パターン `^[a-z][a-z0-9-]{0,62}[a-z0-9]$` は最小2文字だが、
  FR-004 のパス規約との整合チェック要件が未定義 [Consistency]
  [Spec §FR-004] [data-model.md §Schema]
- [ ] CHK007 - `required` フィールドと `optional` フィールドの
  選定根拠は文書化されているか？
  `details` が optional である理由や、将来 required 化の条件が不明 [Clarity]
  [data-model.md §Schema]
- [x] CHK008 - `result.md` の生成ルール（テンプレート構造、
  必須セクション、JSON との対応関係）は定義されているか？
  「JSON から生成する方式」のみで、生成仕様が未規定 [Gap]
  [Spec §Assumptions]
- [ ] CHK009 - `comparedBy` フィールドの値フォーマット制約は
  規定されているか？
  `type: "string"` のみで、GitHub ユーザー名・bot ID 等の
  書式ルールが未定義 [Completeness]
  [data-model.md §Schema]
- [ ] CHK010 - `comparedAt` の `date-time` フォーマットで
  タイムゾーン表記（UTC 必須等）は規定されているか？
  ISO 8601 の範囲内でも UTC/ローカル混在の可能性がある [Clarity]
  [data-model.md §Schema]
- [ ] CHK011 - スキーマファイルの格納パス `scripts/validate/schema.json` と
  CI ワークフローでの参照方法は FR-010 で明記されているか？
  スキーマの物理配置と CI からの解決パスが spec.md に未記載 [Coverage]
  [Spec §FR-005] [Spec §FR-010]
- [ ] CHK012 - `providers[].name` に許容される値の制約
  （enum リスト、パターン、自由文字列）は定義されているか？
  AWS / Azure / GCP 等の正規名称ルールが不明 [Completeness]
  [data-model.md §Schema]
- [x] CHK013 - スキーマに `additionalProperties` ポリシーは
  明記されているか？
  未知フィールドの許可/拒否が未定義で、拡張性と厳密性のトレードオフが不明 [Gap]
  [data-model.md §Schema]
- [ ] CHK014 - バリデーション対象外ファイル（result.md）への
  品質基準・lint ルールは定義されているか？
  JSON のみバリデーション対象で Markdown 側の整合性担保が未規定 [Coverage]
  [Spec §FR-005] [data-model.md §リポジトリ内データ構造]

## Notes

- CHK001・CHK002 はコンテンツ蓄積後に初めて顕在化するリスクだが、
  初期設計段階で方針を決定しておくことで後方互換性の問題を予防できる
- CHK008 は Assumptions に記載があるが、要件レベルの仕様が不足している
- CHK011 はコンテキスト情報（schema.json の物理パス）が
  spec.md/data-model.md のいずれにも正式に記載されていない
