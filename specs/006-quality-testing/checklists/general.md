# Checklist: 品質・テスト基盤の強化 — 全般

**Purpose**: テスト設計・CI パイプラインの要件品質を検証する

**Created**: 2026-07-05

**Feature**: [spec.md](../spec.md)

**Depth**: Standard | **Audience**: Reviewer (PR)

## Requirement Completeness

- [ ] CHK001 - E2E テストがカバーすべき「主要フロー」の具体的な操作手順は
  仕様に列挙されているか [Completeness, Spec §FR-002]
- [ ] CHK002 - プロパティベーステストの対象関数が parse-issue と
  JSON Schema バリデーション以外にも必要か明記されているか [Completeness, Spec §FR-003]
- [ ] CHK003 - Lighthouse CI の計測対象ページ（全ページ or 代表ページ）は
  定義されているか [Gap, Spec §FR-005]
- [ ] CHK004 - E2E テストのモックデータに含めるべきパターン
  （正常・空・エラー・多数件）は定義されているか [Gap, Spec §FR-006]
- [ ] CHK005 - Playwright MCP ドキュメントに含める操作手順の範囲
  （どのページのどの操作を記録するか）は定義されているか [Gap, Spec §FR-007]

## Requirement Clarity

- [ ] CHK006 - FR-009「1テストあたり5秒以内」のカウント方法（1プロパティ? 1ファイル?）は
  明確か [Ambiguity, Spec §FR-009]
- [ ] CHK007 - FR-010「E2E 3分以内」はローカル実行か CI 環境かが
  明示されているか [Ambiguity, Spec §FR-010]
- [ ] CHK008 - FR-005「90未満で警告」は CI をブロック（failure）するのか
  警告のみ（warning）なのか [Clarity, Spec §FR-005]

## Requirement Consistency

- [ ] CHK009 - SC-003「全テスト5分以内」と FR-010「E2E 3分以内」の
  関係は整合しているか（残り2分でPBT+Lint+型チェック） [Consistency]
- [ ] CHK010 - FR-004「PR ごとに E2E 自動実行」と既存 ci.yml の
  ジョブ構成は矛盾しないか [Consistency]

## Scenario Coverage

- [ ] CHK011 - E2E テストで 404 ページの表示が検証対象に含まれているか
  [Coverage, Gap]
- [ ] CHK012 - E2E テストでモバイル viewport での動作が
  検証対象に含まれているか [Coverage, Gap]
- [ ] CHK013 - プロパティベーステストで「providers が 5 社すべて含まれる」
  「providers が空」等の境界ケースが要件に含まれているか [Coverage, Edge Case]
- [ ] CHK014 - Lighthouse CI がフロントエンド変更以外の PR でも
  実行されるべきか否かが定義されているか [Coverage, Gap]

## Non-Functional Requirements

- [ ] CHK015 - CI で Playwright ブラウザのキャッシュ方式は
  定義されているか（実行時間短縮） [Gap, NFR]
- [ ] CHK016 - テストレポートの保持期間（アーティファクト TTL）は
  定義されているか [Gap, Spec §FR-008]
- [ ] CHK017 - E2E テスト失敗時のスクリーンショット・トレース保存の
  要件は定義されているか [Gap, NFR]

## Dependencies & Assumptions

- [ ] CHK018 - Playwright のバージョン固定方針（メジャーバージョンのみ or 完全固定）は
  明記されているか [Assumption]
- [ ] CHK019 - fast-check の Vitest 統合（@fast-check/vitest）の
  互換性前提は検証されているか [Dependency]
