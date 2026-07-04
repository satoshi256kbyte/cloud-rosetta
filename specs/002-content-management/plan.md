# Implementation Plan: 比較結果コンテンツ管理

**Branch**: `002-content-management` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-content-management/spec.md`

## Summary

GitHub Issue による比較テーマ提案 → PR での比較結果レビュー → main マージ時の
S3/DynamoDB 自動同期のワークフローを構築する。
Issue/PR テンプレート、JSON Schema バリデーション CI、同期ワークフロー（sync.yml）を実装する。

## Technical Context

**Language/Version**: TypeScript 5.x（同期スクリプト）、YAML（ワークフロー定義）

**Primary Dependencies**: @aws-sdk/client-s3, @aws-sdk/client-dynamodb,
ajv（JSON Schema バリデーション）

**Storage**: Amazon S3（比較結果データ）、Amazon DynamoDB（比較メタデータ）— 既存

**Testing**: Vitest（同期スクリプトのユニットテスト）

**Target Platform**: GitHub Actions（CI/CD）、AWS（ap-northeast-1）

**Project Type**: ワークフロー自動化 + バリデーションスクリプト

**Performance Goals**: 同期完了 2 分以内、スキーマバリデーション 30 秒以内

**Constraints**: OIDC 認証、S3/DynamoDB への最小権限、data-model.md の書き込み順序遵守

**Scale/Scope**: 初期は手動 PR のみ、AIエージェント自動生成は後続フェーズ

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原則 | 準拠状況 | 備考 |
|------|----------|------|
| I. 仕様駆動開発 | ✅ | spec.md → plan.md の順序で進行中 |
| II. 人間レビュー必須 | ✅ | PR レビューを経由してからマージ・同期 |
| III. 一次情報参照 | ✅ | AWS SDK / GitHub Actions 公式ドキュメント参照 |
| IV. サーバーレス優先 | ✅ | GitHub Actions + S3 + DynamoDB（VPC 不要） |
| V. 品質の自動保証 | ✅ | JSON Schema バリデーション CI で品質ゲート |
| VI. コミットメッセージ規約 | ✅ | Conventional Commits + 日本語 |

ゲート判定: **PASS**

## Project Structure

### Documentation (this feature)

```text
specs/002-content-management/
├── plan.md
├── research.md
├── data-model.md
├── contracts/
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
.github/
├── ISSUE_TEMPLATE/
│   └── comparison-theme.yml        # 比較テーマ提案 Issue テンプレート
├── workflows/
│   ├── ci.yml                      # 既存 CI（スキーマバリデーション追加）
│   └── sync.yml                    # S3/DynamoDB 同期ワークフロー
└── pull_request_template.md        # PR テンプレート

comparisons/                        # 比較結果データ（リポジトリ内）
└── {themeId}/
    └── {axisId}/
        ├── result.json
        └── result.md

scripts/
├── sync/
│   ├── index.ts                    # 同期メインスクリプト
│   ├── detect-changes.ts           # 変更された comparisons を検出
│   ├── sync-to-aws.ts              # S3/DynamoDB 書き込み
│   └── package.json                # 同期スクリプト依存関係
└── validate/
    ├── schema.json                 # result.json の JSON Schema
    └── validate.ts                 # バリデーションスクリプト
```

**Structure Decision**: 同期スクリプトと バリデーションスクリプトを `scripts/` 配下に配置する。
`infra/` は CDK 専用、`scripts/` はランタイムスクリプト用として分離する。
比較結果データは `comparisons/` ディレクトリに配置し、
PR レビュー時に差分が分かりやすい構造とする。

## Complexity Tracking

Constitution Check に違反なし。記入不要。
