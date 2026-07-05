# Output Quality Requirements Checklist: AIエージェント比較自動実行

**Purpose**: JSON 出力品質・スキーマ準拠・ソース検証・プロバイダーごとの
一次情報参照ルール・正確性に関する要件の品質を評価する
**Created**: 2026-07-05
**Feature**: [spec.md](../spec.md)
**Depth**: Standard

## Requirement Completeness

- [ ] CHK001 - 参照すべき JSON Schema（`data-model.md`）の場所とバージョン管理方法は
  明示されているか。スキーマ変更時のエージェント側への反映手順は定義されているか
  [Completeness] [Spec §FR-004]
- [x] CHK002 - `sources` フィールドに含めるべき URL の品質基準（公式ドキュメントの
  定義、ブログ記事は可か不可か、バージョン付き URL が必要か）は定義されているか
  [Completeness] [Spec §FR-006, §SC-003]
- [x] CHK003 - 各プロバイダーにつき最低 1 つの公式 URL（SC-003）とあるが、
  「公式 URL」の判定基準（ドメインのホワイトリスト等）は明示されているか
  [Completeness] [Spec §SC-003]
- [ ] CHK004 - result.json のファイルパス規則 `comparisons/{テーマID}/{軸ID}/result.json`
  において、テーマID・軸ID の命名規約（ケバブケース等）は定義されているか
  [Completeness] [Spec §FR-007]

## Requirement Clarity

- [x] CHK005 - 「JSON Schema に準拠した result.json」の準拠レベルは明確か。
  追加プロパティの許容（`additionalProperties`）、null 値の許容、
  空配列の許容などのルールは定義されているか [Clarity] [Spec §FR-004]
- [ ] CHK006 - AWS Knowledge MCP Server からの情報と Web 検索からの情報を
  どのように sources に区別して記録するか（ソースタイプの属性等）は
  定義されているか [Clarity] [Spec §FR-005, §FR-006]
- [ ] CHK007 - 比較結果の各項目に対して「根拠となるソースが紐づく」構造なのか、
  ファイル全体で sources をまとめる構造なのか、
  データモデル上のソース紐付け粒度は明確か [Clarity] [Spec §FR-004]

## Requirement Consistency

- [ ] CHK008 - SC-002「JSON Schema バリデーションに 100% パス」と
  エラー時のフローの関係は整合しているか。バリデーション失敗時は FR-009 の
  エラーフローに入る旨が明記されているか [Consistency] [Spec §SC-002, §FR-009]
- [x] CHK009 - SC-003「各プロバイダーの公式 URL が最低 1 つ」と FR-006 の
  「sources に公式 URL を含める」の粒度は一致しているか。
  1プロバイダーあたり複数軸の場合、軸ごとに 1 URL か全体で 1 URL か
  [Consistency] [Spec §SC-003, §FR-006]

## Scenario Coverage

- [x] CHK010 - 比較対象プロバイダーが 2 社の場合と 3 社以上の場合で、
  出力 JSON の構造に差異が生じるかどうかは定義されているか
  [Coverage] [Spec §FR-004]
- [ ] CHK011 - エージェントが生成した JSON に対する CI バリデーション
  （スキーマチェック）の具体的なツール・コマンド・実行タイミングは
  定義されているか [Coverage] [Spec §US3-Scenario3]
- [x] CHK012 - 比較項目の値が「該当なし」「情報なし」の場合の表現方法
  （null、空文字、特定の文字列）は JSON Schema 上で定義されているか
  [Coverage] [Spec §FR-004]

## Edge Case Coverage

- [ ] CHK013 - プロバイダー公式ドキュメントの URL がリンク切れ（404）だった場合、
  sources に含めてよいか、代替 URL を探すべきかのルールは定義されているか
  [Gap] [Spec §Edge Cases]
- [ ] CHK014 - エージェントが生成した JSON が部分的にスキーマ違反の場合
  （一部フィールドのみ不正）、全体をリジェクトするか部分修正を試みるかの
  方針は定義されているか [Gap] [Spec §SC-002]
- [ ] CHK015 - 同一プロバイダーの情報が MCP Server と Web 検索の両方から
  取得され矛盾する場合の優先順位（一次情報の信頼度）は定義されているか
  [Gap] [Spec §FR-005, §FR-006]
