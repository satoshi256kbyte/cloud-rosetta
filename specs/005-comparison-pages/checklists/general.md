# Checklist: 比較結果ページの本実装 — 全般

**Purpose**: UX・アクセシビリティ・データ表示の要件品質を検証する

**Created**: 2026-07-05

**Feature**: [spec.md](../spec.md)

**Depth**: Standard | **Audience**: Reviewer (PR)

## Requirement Completeness

- [x] CHK001 - テーマカードに表示する「説明文」のデータソースは定義されているか？
  DynamoDB に title + description を追加（Clarify で解決）[Gap, Spec §US1]
- [ ] CHK002 - テーマ一覧のソート順（更新日時降順等）は明示されているか [Clarity, Spec §FR-001]
- [x] CHK003 - 比較テーブルの「詳細」フィールド（details）の表示方式は定義されているか
  （常時展開で全文表示と明記）[Gap, Spec §FR-003]
- [ ] CHK004 - ページネーションの URL パラメータ名（`?page=N`）は仕様に明記されているか
  [Clarity, Spec §FR-014]
- [ ] CHK005 - 「情報取得不可」プロバイダーの視覚的な区別方法は定義されているか
  [Gap, Spec §US2 Scenario 4]
- [ ] CHK006 - エラーページ（FR-013）に表示する内容（メッセージ・再試行ボタン・
  トップへの導線）は要件として定義されているか [Completeness, Spec §FR-013]

## Requirement Clarity

- [ ] CHK007 - SC-002「初回表示 2 秒以内」の計測条件（ネットワーク速度・デバイス・
  キャッシュ状態）は明確か [Measurability, Spec §SC-002]
- [x] CHK008 - FR-011「90 日以上前」の基準は comparedAt と現在時刻の差分か、
  それとも updatedAt か（comparedAt と明記）[Ambiguity, Spec §FR-011]
- [ ] CHK009 - 「カード形式」の具体的な情報配置（何が上・何が下）は定義されているか
  [Clarity, Spec §FR-001]
- [ ] CHK010 - FR-006「比較軸が 1 つのみの場合リダイレクト」の判定タイミングは
  サーバーサイドか（SEO への影響）[Clarity, Spec §FR-006]
- [ ] CHK011 - フィルタリセット時の動作（全プロバイダー再表示）のトリガーUI は
  明確に定義されているか [Clarity, Spec §US4 Scenario 2]

## Requirement Consistency

- [ ] CHK012 - テーマカードのリンク先が `/comparisons/{themeId}` と
  `/comparisons/{themeId}/{axisId}` のどちらかで仕様内で一貫しているか
  [Consistency, Spec §US1 vs §US3]
- [ ] CHK013 - ISR revalidate=3600 と FR-011 の「90 日超警告」の関係は整合しているか
  （キャッシュされた古いページでの警告表示タイミング）[Consistency]
- [ ] CHK014 - 404 表示条件がテーマ不存在・軸不存在・データ未取得の全ケースで
  一貫して定義されているか [Consistency, Spec §FR-007]

## Acceptance Criteria Quality

- [ ] CHK015 - SC-001「3 クリック以内」の起点は必ずトップページか、
  任意のページからの計測か [Measurability, Spec §SC-001]
- [ ] CHK016 - SC-004「Lighthouse アクセシビリティ 90 以上」の計測対象ページは
  全ページか代表ページか [Measurability, Spec §SC-004]
- [ ] CHK017 - SC-005「フィルタ状態の再現が 100% 正確」の検証方法は定義されているか
  [Measurability, Spec §SC-005]

## Scenario Coverage

- [ ] CHK018 - テーマ一覧でテーマが 1 件のみの場合の表示要件は定義されているか
  [Coverage, Edge Case]
- [ ] CHK019 - 比較結果テーブルでプロバイダーが 2 社のみの場合と 5 社の場合の
  レイアウト差異は要件として記述されているか [Coverage, Spec §Edge Cases]
- [ ] CHK020 - フィルタで全プロバイダーをチェック解除した場合の動作は定義されているか
  [Coverage, Edge Case]
- [ ] CHK021 - ブラウザの戻る/進むボタン操作時のフィルタ状態復元要件は
  定義されているか [Coverage, Gap]

## Accessibility Requirements

- [ ] CHK022 - 比較テーブルの横スクロール領域に対するスクリーンリーダー向け
  アクセシビリティ要件は定義されているか [Gap, a11y]
- [ ] CHK023 - フィルタ UI のキーボード操作要件（Tab移動・Space選択等）は
  定義されているか [Gap, a11y]
- [ ] CHK024 - 色のみに依存しない情報伝達（「情報取得不可」等）の要件は
  定義されているか [Gap, a11y]
- [ ] CHK025 - ページネーションの現在ページ状態がスクリーンリーダーに
  伝わる要件（aria-current 等）は定義されているか [Gap, a11y]

## Non-Functional Requirements

- [ ] CHK026 - データ取得タイムアウトの閾値と発生時の動作は仕様に含まれているか
  [Gap, Spec §Edge Cases]
- [ ] CHK027 - SEO メタデータの description に何を含めるかの仕様は定義されているか
  （動的テキストの生成ルール）[Clarity, Spec §FR-012]
- [ ] CHK028 - ISR revalidate 中にデータソースがダウンしている場合の動作
  （stale content 表示 or エラー）は定義されているか [Gap, NFR]
- [ ] CHK029 - URL 構造（`/comparisons/{themeId}/{axisId}`）の不変性・
  永続性に関する要件は記述されているか [Gap, SEO]

## Dependencies & Assumptions

- [ ] CHK030 - DynamoDB のテーマメタデータに「テーマ表示名」「説明文」フィールドが
  存在する前提は検証されているか [Assumption, Spec §Assumptions]
- [ ] CHK031 - 003-frontend からの破壊的変更の有無・影響範囲は明記されているか
  [Dependency, Gap]
