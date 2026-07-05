# Implementation Plan: AIエージェント比較自動実行

**Branch**: `004-ai-agent` | **Date**: 2026-07-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-ai-agent/spec.md`

## Summary

GitHub Issue の `approved` ラベル付与をトリガーに、
Bedrock AgentCore 上の AIエージェントが比較作業を実行し、
結果を PR として自動作成するワークフローを構築する。
エージェントは NVIDIA Nemotron 3 Super 120B A12B をモデルとし、
AWS Knowledge MCP Server と Web 検索ツールを使って一次情報を参照する。

## Technical Context

**Language/Version**: TypeScript 5.x（ワークフロースクリプト）

**Primary Dependencies**: @aws-sdk/client-bedrock-agent-runtime,
@aws-sdk/client-bedrock-runtime, @octokit/rest（GitHub API）

**Storage**: DynamoDB（メタデータ参照）、S3（比較結果書き込み）— 既存

**Testing**: Vitest（スクリプトのユニットテスト）

**Target Platform**: GitHub Actions + Amazon Bedrock AgentCore（ap-northeast-1）

**Project Type**: ワークフロー自動化 + AIエージェント構成

**Performance Goals**: `approved` ラベルから PR 作成まで 15 分以内（SC-001）

**Constraints**: OIDC 認証、AgentCore API クォータ、
NVIDIA Nemotron 3 Super 120B A12B のトークン制限

**Scale/Scope**: 初期は月数件の比較実行を想定

## Constitution Check

| 原則 | 準拠状況 | 備考 |
|------|----------|------|
| I. 仕様駆動開発 | ✅ | spec → plan の順序 |
| II. 人間レビュー必須 | ✅ | エージェント出力は PR レビュー必須 |
| III. 一次情報参照 | ✅ | MCP Server + Web検索で公式ドキュメント参照 |
| IV. サーバーレス優先 | ✅ | AgentCore + GitHub Actions（VPC 不要） |
| V. 品質の自動保証 | ✅ | JSON Schema バリデーション CI |
| VI. コミットメッセージ規約 | ✅ | エージェントのコミットも規約準拠 |

ゲート判定: **PASS**

## Project Structure

### Documentation (this feature)

```text
specs/004-ai-agent/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── tasks.md
└── contracts/
    └── agent-workflow.md
```

### Source Code (repository root)

```text
scripts/
└── agent/
    ├── package.json
    ├── tsconfig.json
    ├── invoke-agent.ts          # AgentCore 呼び出しメイン
    ├── parse-issue.ts           # Issue 本文からパラメータ抽出
    ├── create-pr.ts             # 結果コミット + PR 作成
    ├── update-labels.ts         # Issue ラベル操作
    └── prompts/
        └── comparison.txt       # エージェントのシステムプロンプト

infra/lib/
└── stacks/
    └── agent-stack.ts           # AgentCore エージェント + IAM 定義

.github/workflows/
└── agent.yml                    # Issue ラベルトリガーワークフロー
```

**Structure Decision**: エージェント呼び出しスクリプトを `scripts/agent/` に配置。
AgentCore のリソース定義（エージェント、アクショングループ、ツール設定）は
CDK で `agent-stack.ts` として管理する。
プロンプトはコードと分離してバージョン管理しやすくする。

## Complexity Tracking

Constitution Check に違反なし。記入不要。

## Post-Design Constitution Check

| 原則 | 準拠状況 | 設計での対応 |
|------|----------|-------------|
| I. 仕様駆動開発 | ✅ | spec → plan → tasks の順序で進行中 |
| II. 人間レビュー必須 | ✅ | エージェント出力は PR として作成、人間レビュー必須 |
| III. 一次情報参照 | ✅ | AWS Knowledge MCP Server + Web検索で公式ドキュメント参照 |
| IV. サーバーレス優先 | ✅ | AgentCore + GitHub Actions で VPC 不要 |
| V. 品質の自動保証 | ✅ | JSON Schema バリデーション CI、Vitest でスクリプトテスト |
| VI. コミットメッセージ規約 | ✅ | PR タイトルを `feat(comparison):` 形式に規定 |

ゲート判定: **PASS** — 設計後も全原則に準拠。
