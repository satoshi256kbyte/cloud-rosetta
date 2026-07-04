# Implementation Plan: フロントエンド（比較結果表示）

**Branch**: `003-frontend` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-frontend/spec.md`

## Summary

Next.js 15（App Router）で比較結果表示サイトを構築する。
DynamoDB からテーマ一覧、S3 から比較結果 JSON を SSR で取得し表示する。
AWS Amplify Hosting にデプロイし、VPC BPA の制約を回避する。

## Technical Context

**Language/Version**: TypeScript 5.x、Next.js 15（App Router）

**Primary Dependencies**: next, react, tailwindcss, @aws-sdk/client-dynamodb,
@aws-sdk/lib-dynamodb, @aws-sdk/client-s3

**Storage**: DynamoDB（読み取り）、S3（読み取り）— 既存リソース

**Testing**: Vitest + React Testing Library（コンポーネント）、Playwright（E2E、後続）

**Target Platform**: AWS Amplify Hosting（SSR）、ブラウザ（モバイル + デスクトップ）

**Project Type**: Web アプリケーション（SSR）

**Performance Goals**: 初回表示 2 秒以内（SC-001, SC-002）

**Constraints**: VPC 不使用（Amplify Hosting）、認証なし（初期フェーズ）、
リソース名は命名規約から STAGE 環境変数で導出

**Scale/Scope**: 社内 100 人、比較テーマ数十件規模

## Constitution Check

| 原則 | 準拠状況 | 備考 |
|------|----------|------|
| I. 仕様駆動開発 | ✅ | spec → plan の順序 |
| II. 人間レビュー必須 | ✅ | PR レビュー経由 |
| III. 一次情報参照 | ✅ | Next.js / Amplify 公式ドキュメント参照 |
| IV. サーバーレス優先 | ✅ | Amplify Hosting（VPC 不要） |
| V. 品質の自動保証 | ✅ | Lint + テスト + CI |
| VI. コミットメッセージ規約 | ✅ | Conventional Commits + 日本語 |

ゲート判定: **PASS**

## Project Structure

### Documentation (this feature)

```text
specs/003-frontend/
├── plan.md
├── research.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # ルートレイアウト（ヘッダー + サイドバー）
│   │   ├── page.tsx                # トップページ（テーマ一覧）
│   │   └── comparisons/
│   │       └── [themeId]/
│   │           └── [axisId]/
│   │               └── page.tsx    # 詳細ページ（比較結果テーブル）
│   ├── components/
│   │   ├── Header.tsx              # ヘッダー
│   │   ├── Sidebar.tsx             # サイドバー（テーマ一覧ナビ）
│   │   ├── ThemeCard.tsx           # テーマカード（一覧用）
│   │   └── ComparisonTable.tsx     # 比較結果テーブル
│   └── lib/
│       ├── aws-config.ts           # リソース名導出（STAGE → テーブル名/バケット名）
│       ├── dynamodb.ts             # DynamoDB アクセス関数
│       └── s3.ts                   # S3 アクセス関数
├── public/
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
├── package.json
└── vitest.config.ts

infra/lib/
├── stacks/
│   └── amplify-stack.ts            # Amplify Hosting スタック（新規）
```

**Structure Decision**: `frontend/` ディレクトリに Next.js プロジェクトを配置。
`infra/` に Amplify Hosting の CDK スタックを追加。
サイドバーはレイアウトコンポーネントで全ページ共通とする。

## Complexity Tracking

Constitution Check に違反なし。記入不要。
