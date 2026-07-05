# Implementation Plan: 品質・テスト基盤の強化

**Branch**: `006-quality-testing` | **Date**: 2026-07-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-quality-testing/spec.md`

## Summary

Playwright E2E テスト・fast-check プロパティベーステスト・Lighthouse CI を導入し、
CI の品質ゲートを実運用レベルに引き上げる。
E2E テストはデータ取得関数をモックし AWS 依存なしで実行する。

## Technical Context

**Language/Version**: TypeScript 5.x

**Primary Dependencies**: @playwright/test, fast-check, @lhci/cli

**Testing**: Playwright（E2E）、fast-check（プロパティベース）、Vitest（ユニット）

**Target Platform**: GitHub Actions（CI）、ローカル開発環境

**Project Type**: テスト基盤・CI パイプライン

**Performance Goals**: CI 全テスト 5 分以内（SC-003）、E2E 3 分以内（FR-010）

**Constraints**: AWS アクセス不要（モック）、Chromium のみ

**Scale/Scope**: フロントエンド 3 ページ + scripts/agent のバリデーション関数

## Constitution Check

| 原則 | 準拠状況 | 備考 |
|------|----------|------|
| I. 仕様駆動開発 | ✅ | spec → plan の順序 |
| II. 人間レビュー必須 | ✅ | PR レビュー経由 |
| III. 一次情報参照 | ✅ | Playwright / fast-check 公式ドキュメント参照 |
| IV. サーバーレス優先 | ✅ | テスト基盤のみ、インフラ追加なし |
| V. 品質の自動保証 | ✅ | まさにこのフェーズの目的 |
| VI. コミットメッセージ規約 | ✅ | Conventional Commits + 日本語 |

ゲート判定: **PASS**

## Project Structure

### Documentation (this feature)

```text
specs/006-quality-testing/
├── spec.md
├── plan.md
├── research.md
├── quickstart.md
└── checklists/
    └── requirements.md
```

### Source Code

```text
frontend/
├── e2e/
│   ├── fixtures/
│   │   └── test-data.ts          # モック用テストデータ
│   ├── theme-list.spec.ts        # テーマ一覧 E2E
│   ├── comparison-table.spec.ts  # 比較テーブル E2E
│   └── provider-filter.spec.ts   # フィルタ E2E
├── playwright.config.ts
└── package.json                  # playwright 追加

scripts/agent/
├── parse-issue.property.test.ts  # プロパティベーステスト
└── package.json                  # fast-check 追加

scripts/validate/
└── validate.property.test.ts     # スキーマバリデーション PBT

.github/workflows/
└── ci.yml                        # E2E + Lighthouse ジョブ追加

docs/
└── playwright-mcp-guide.md       # Playwright MCP 操作手順
```

**Structure Decision**: E2E テストは `frontend/e2e/` に配置（Playwright 推奨構造）。
プロパティベーステストは既存テストと同じディレクトリに `.property.test.ts` サフィックスで配置。
Playwright MCP のドキュメントは `docs/` に配置。

## Complexity Tracking

Constitution Check に違反なし。記入不要。

## Post-Design Constitution Check

| 原則 | 準拠状況 | 設計での対応 |
|------|----------|-------------|
| I. 仕様駆動開発 | ✅ | spec → plan の順序で進行 |
| II. 人間レビュー必須 | ✅ | PR レビュー経由 |
| III. 一次情報参照 | ✅ | Playwright / fast-check 公式ドキュメント参照 |
| IV. サーバーレス優先 | ✅ | インフラ追加なし |
| V. 品質の自動保証 | ✅ | E2E + PBT + Lighthouse CI で自動保証 |
| VI. コミットメッセージ規約 | ✅ | Conventional Commits + 日本語 |

ゲート判定: **PASS**
