# Implementation Plan: 比較結果ページの本実装

**Branch**: `005-comparison-pages` | **Date**: 2026-07-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-comparison-pages/spec.md`

## Summary

003-frontend の歩くスケルトンを拡張し、比較テーマ一覧・比較軸一覧・
比較結果テーブル・プロバイダーフィルタを本実装する。
ISR（1 時間再生成）でデータ鮮度を確保し、
モバイル対応・SEO・アクセシビリティを組み込む。

## Technical Context

**Language/Version**: TypeScript 5.x、Next.js 15（App Router）

**Primary Dependencies**: next, react, tailwindcss, @aws-sdk/client-dynamodb,
@aws-sdk/lib-dynamodb, @aws-sdk/client-s3

**Storage**: DynamoDB（テーマメタデータ読み取り）、S3（比較結果 JSON 読み取り）— 既存

**Testing**: Vitest + React Testing Library（コンポーネント）、Playwright（E2E）

**Target Platform**: AWS Amplify Hosting（SSR + ISR）、ブラウザ（モバイル + デスクトップ）

**Project Type**: Web アプリケーション（SSR + ISR）

**Performance Goals**: 初回表示 2 秒以内（SC-002）、
Lighthouse アクセシビリティ 90 以上（SC-004）

**Constraints**: VPC 不使用（Amplify Hosting）、認証なし、日本語のみ、
ISR revalidate 3600 秒

**Scale/Scope**: 社内 100 人、テーマ数十件、比較結果数百件規模

## Constitution Check

| 原則 | 準拠状況 | 備考 |
|------|----------|------|
| I. 仕様駆動開発 | ✅ | spec → clarify → plan の順序 |
| II. 人間レビュー必須 | ✅ | PR レビュー経由 |
| III. 一次情報参照 | ✅ | Next.js / Amplify 公式ドキュメント参照 |
| IV. サーバーレス優先 | ✅ | Amplify Hosting（VPC 不要） |
| V. 品質の自動保証 | ✅ | Lint + テスト + Playwright E2E + CI |
| VI. コミットメッセージ規約 | ✅ | Conventional Commits + 日本語 |

ゲート判定: **PASS**

## Project Structure

### Documentation (this feature)

```text
specs/005-comparison-pages/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── checklists/
    └── requirements.md
```

### Source Code (既存の frontend/ を拡張)

```text
frontend/src/
├── app/
│   ├── layout.tsx                        # ルートレイアウト（更新: SEO メタデータ）
│   ├── page.tsx                          # トップページ（更新: テーマ一覧本実装）
│   ├── not-found.tsx                     # 404 ページ（新規）
│   └── comparisons/
│       └── [themeId]/
│           ├── page.tsx                  # テーマ別比較軸一覧（新規）
│           └── [axisId]/
│               └── page.tsx             # 比較結果テーブル（更新: 本実装）
├── components/
│   ├── Header.tsx                        # 更新
│   ├── ThemeCard.tsx                     # 更新: メタ情報追加
│   ├── ComparisonTable.tsx              # 更新: 本実装
│   ├── ProviderFilter.tsx               # 新規: プロバイダーフィルタ
│   ├── Pagination.tsx                   # 新規: ページネーション
│   ├── DataFreshnessWarning.tsx         # 新規: 90日超警告
│   └── ErrorPage.tsx                    # 新規: エラー表示
└── lib/
    ├── aws-config.ts                     # 既存
    ├── dynamodb.ts                       # 更新: 軸一覧取得関数追加
    ├── s3.ts                             # 既存
    └── types.ts                          # 新規: 型定義
```

**Structure Decision**: 003 の既存構造をそのまま拡張する。
新規コンポーネントは components/ に追加し、
ページコンポーネントは App Router の規約に従う。
Client Component はフィルタのみ（`"use client"`）、
それ以外は Server Component として ISR を活用する。

## Complexity Tracking

Constitution Check に違反なし。記入不要。

## Post-Design Constitution Check

| 原則 | 準拠状況 | 設計での対応 |
|------|----------|-------------|
| I. 仕様駆動開発 | ✅ | spec → clarify → plan の順序で進行中 |
| II. 人間レビュー必須 | ✅ | PR レビュー経由 |
| III. 一次情報参照 | ✅ | Next.js ISR 公式ドキュメントに基づく設計 |
| IV. サーバーレス優先 | ✅ | Amplify Hosting（VPC 不要） |
| V. 品質の自動保証 | ✅ | コンポーネントテスト + E2E + Lighthouse CI |
| VI. コミットメッセージ規約 | ✅ | Conventional Commits + 日本語 |

ゲート判定: **PASS** — 設計後も全原則に準拠。
