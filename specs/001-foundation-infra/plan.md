# Implementation Plan: 基盤インフラ

**Branch**: `001-foundation-infra` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-foundation-infra/spec.md`

## Summary

cloud-rosetta の全機能開発の土台となる AWS インフラ基盤を構築する。
CDK プロジェクトの初期化（cdk-nag 組み込み）、データストア（S3 + DynamoDB）の構築、
および GitHub Actions による CI/CD パイプラインを整備する。
VPC は作成せず、サーバーレス・マネージドサービスのみで構成する。

## Technical Context

**Language/Version**: TypeScript 5.x（strict モード）

**Primary Dependencies**: AWS CDK v2、cdk-nag、constructs

**Storage**: Amazon S3（比較結果データ）、Amazon DynamoDB（比較メタデータ）

**Testing**: Vitest（ユニットテスト）、CDK assertions ライブラリ（スナップショット/ファイングレイン）

**Target Platform**: AWS（ap-northeast-1）、GitHub Actions（CI/CD）

**Project Type**: IaC（Infrastructure as Code）+ CI/CD パイプライン

**Performance Goals**: CDK デプロイ 5 分以内、CI 完了 3 分以内

**Constraints**: VPC 不使用（VPC BPA 制約）、サーバーレスのみ、cdk-nag AwsSolutions パス必須

**Scale/Scope**: dev 環境のみ（初期フェーズ）、100 ユーザー規模

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原則 | 準拠状況 | 備考 |
|------|----------|------|
| I. 仕様駆動開発 | ✅ | spec.md → plan.md の順序で進行中 |
| II. 人間レビュー必須 | ✅ | PR ベースのデプロイフローを構築 |
| III. 一次情報参照 | ✅ | AWS CDK/cdk-nag 公式ドキュメントを参照して設計 |
| IV. サーバーレス優先 | ✅ | VPC 不使用、S3/DynamoDB/GitHub Actions のみ |
| V. 品質の自動保証 | ✅ | CI で Lint・型チェック・テスト・cdk-nag を自動実行 |
| VI. コミットメッセージ規約 | ✅ | Conventional Commits + 日本語で運用 |

ゲート判定: **PASS** — 全原則に準拠。Phase 0 に進行可能。

## Project Structure

### Documentation (this feature)

```text
specs/001-foundation-infra/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (speckit.tasks)
```

### Source Code (repository root)

```text
infra/
├── bin/
│   └── app.ts                  # CDK App エントリーポイント
├── lib/
│   ├── stages/
│   │   └── dev.ts              # dev 環境のステージ定義
│   ├── stacks/
│   │   └── storage-stack.ts    # S3 + DynamoDB スタック
│   └── constructs/
│       ├── comparison-bucket.ts    # S3 バケット Construct
│       └── comparison-table.ts     # DynamoDB テーブル Construct
├── test/
│   ├── stacks/
│   │   └── storage-stack.test.ts
│   └── constructs/
│       ├── comparison-bucket.test.ts
│       └── comparison-table.test.ts
├── cdk.json
├── tsconfig.json
├── vitest.config.ts
└── package.json

.github/
└── workflows/
    ├── ci.yml              # PR 時: Lint・型チェック・テスト
    └── cd.yml              # main マージ時: CDK デプロイ
```

**Structure Decision**: IaC 専用の `infra/` ディレクトリに CDK コードを配置する。
将来的にフロントエンド（`frontend/`）やバックエンド（`backend/`）が追加されるため、
リポジトリルート直下に `src/` を置かず、用途別にトップレベルを分離する。
CI/CD ワークフローは `.github/workflows/` に配置する。

## Complexity Tracking

Constitution Check に違反なし。記入不要。
