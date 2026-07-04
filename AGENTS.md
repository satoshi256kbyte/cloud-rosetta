# AGENTS.md

このリポジトリで AI エージェントが作業する際の参照ドキュメント。

## プロジェクト概要

- [docs/product-overview.md](docs/product-overview.md) — プロダクト概要・ワークフロー
- [docs/tech-stack.md](docs/tech-stack.md) — 技術スタック・設計方針

## 開発ガイド

- [docs/amplify-deploy.md](docs/amplify-deploy.md) — Amplify Hosting デプロイ手順
- [infra/README.md](infra/README.md) — CDK インフラ（コマンド・命名規約・cdk-nag）
- [comparisons/README.md](comparisons/README.md) — 比較結果データの配置ルール
- [scripts/README.md](scripts/README.md) — 同期・バリデーションスクリプト

## 仕様・設計

- [.specify/memory/constitution.md](.specify/memory/constitution.md) — プロジェクト原則（constitution）
- `specs/` — 各機能の仕様・計画・タスク（Spec Kit）

## コミットメッセージ

Conventional Commits + 日本語。type は英語、説明は日本語。

```text
feat(infra): S3バケットを追加
fix(sync): 差分検出のエラーを修正
docs: constitution を更新
```
