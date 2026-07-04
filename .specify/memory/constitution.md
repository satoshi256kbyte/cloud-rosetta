<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0 (原則追加)
- Modified principles: なし
- Added sections:
  - Core Principles: VI. コミットメッセージ規約（Conventional Commits + 日本語）
- Removed sections: なし
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ 整合性確認済み（変更不要）
  - .specify/templates/spec-template.md ✅ 整合性確認済み（変更不要）
  - .specify/templates/tasks-template.md ✅ 整合性確認済み（変更不要）
- Follow-up TODOs: なし
-->

# cloud-rosetta Constitution

## Core Principles

### I. 仕様駆動開発（Spec-Driven Development）

すべての機能開発は、仕様（Spec）の作成から始めなければならない（MUST）。
仕様が承認されるまで実装に着手してはならない。

- Spec Kit のワークフロー（constitution → specify → plan → tasks → implement）に従う
- 仕様には、ユーザーストーリー・受け入れ条件・機能要件を含める
- 仕様の曖昧さは実装前に解消する（speckit.clarify を活用する）

理由: AIエージェントと人間の協業において、
仕様が意思決定の共通基盤となり、手戻りを防ぐ。

### II. AIエージェント協業における人間レビュー必須

AIエージェントが生成したすべての成果物は、
人間のレビューと承認を経てから公開・マージしなければならない（MUST）。

- 比較結果: AIエージェントがPull Requestとして作成し、人間がレビューする
- コード変更: Pull Requestベースのレビューフローを経由する
- 比較テーマ・比較軸の提案から着手判断は人間が行う

理由: AIエージェントの出力は正確性が保証されないため、
品質ゲートとして人間の判断を介在させる。

### III. 一次情報参照の原則

比較結果およびすべての技術的判断は、
一次情報（公式ドキュメント・公式ブログ）に基づかなければならない（MUST）。

- AWSサービスの調査にはAWS Knowledge MCP Serverを活用する
- GCP・Azure・Akamai・Cloudflareは各社の公式ドキュメントをWeb検索で参照する
- 二次情報のみに基づく比較結果は公開してはならない
- 技術選定・設計判断は最新の公式ドキュメントで裏付けを取る

理由: クラウドサービスは頻繁に更新されるため、
古い情報や不正確な情報に基づく比較は利用者の意思決定を誤らせる。

### IV. サーバーレス・マネージド優先

インフラ設計では、サーバーレスおよびマネージドサービスを優先的に採用しなければならない（MUST）。
VPCやセルフマネージドなインフラは、明確な技術的理由がない限り避ける。

- AWS Amplify Hosting（Next.js SSR）、DynamoDB、S3、Lambda を基本とする
- VPC Block Public Access（VPC BPA）の制約を考慮し、
  VPCが不要なアーキテクチャを第一選択とする
- VPCが必要な場合は、CfnVPCBlockPublicAccessExclusion による除外設定を必須とする
- cdk-nag によるセキュリティチェックをCDKスタックに組み込む

理由: 運用負荷の低減とVPC BPA制約への適応。
少人数チームで持続的に運用できるアーキテクチャとする。

### V. 品質の自動保証

コード品質はLint・テスト・型チェックによって自動的に保証しなければならない（MUST）。

- TypeScript の strict モードを有効にする
- Lint（ESLint）・Format（Prettier）を全ファイルに適用する
- ユニットテストに加え、プロパティベーステストを実施する
- E2EテストにはPlaywrightを使用する
- Markdownファイルには markdownlint を適用する（1行120文字以内）
- CI（GitHub Actions）で上記チェックを自動実行する

理由: AIエージェントが生成するコードの品質を機械的に担保し、
レビュー負荷を削減する。

### VI. コミットメッセージ規約（Conventional Commits + 日本語）

コミットメッセージは Conventional Commits 形式かつ日本語で記述しなければならない（MUST）。

- 形式: `<type>(<scope>): <日本語の説明>`
- type は英語（feat, fix, docs, style, refactor, test, chore, ci, perf, build）
- scope は任意（英語、省略可）
- description（説明部分）は日本語で書く
- body・footer も日本語で記述する

例:

- `feat(comparison): CDN比較ページを追加`
- `fix(agent): Web検索結果のパースエラーを修正`
- `docs: constitution v1.1.0 に原則を追加`
- `chore(deps): Next.js を15.1.0に更新`

理由: 変更履歴の可読性とリリースノート自動生成への対応。
日本語とすることで、チームメンバー全員が変更内容を即座に把握できる。

## 技術スタック制約

本プロジェクトで使用する技術スタックは以下に固定する。
新しい技術の導入は、constitution の改定を経て行う。

- 言語: TypeScript（strict モード）
- フロントエンド/SSR: Next.js
- バックエンド: Hono
- IaC: AWS CDK（cdk-nag 必須）
- クラウド: AWS（ap-northeast-1）
- ホスティング: AWS Amplify Hosting
- データストア: Amazon S3 + Amazon DynamoDB
- AIエージェント基盤: Amazon Bedrock / Amazon Bedrock AgentCore
- CI/CD: GitHub Actions
- テスト: Vitest（ユニット）、Playwright（E2E）
- リソース命名規約: `{サービス名}-{ステージ名}-{リソース種類}-{用途}`
  （小文字・ハイフン区切り、例: `cloud-rosetta-prod-s3-comparison-data`）

## 開発ワークフロー

本プロジェクトの開発は以下のフローに従う。

- GitHub Issue で比較テーマ・比較軸・機能を提案する
- Spec Kit のワークフローで仕様・計画・タスクを定義する
- 機能ブランチで実装し、Pull Request を作成する
- CI（Lint・テスト・型チェック・cdk-nag）がすべてパスすることを確認する
- 人間がレビューし、承認後にマージする
- マージをトリガーにデプロイ・データ同期が実行される

main ブランチへの直接プッシュは禁止する。

## Governance

本 constitution はプロジェクトのすべての開発行為に優先する。
AIエージェントを含むすべての開発者は、本文書の原則に従わなければならない。

- 改定手続き: constitution の変更は Pull Request で提案し、レビュー・承認を経てマージする
- バージョニング: セマンティックバージョニングに従う
  - MAJOR: 原則の削除・非互換な再定義
  - MINOR: 原則の追加・重要な拡張
  - PATCH: 文言修正・明確化
- 準拠確認: すべての Pull Request レビューにおいて、constitution への準拠を確認する
- ランタイムガイダンス: 開発時の詳細な手順は docs/ 配下のドキュメントを参照する

**Version**: 1.1.0 | **Ratified**: 2026-07-04 | **Last Amended**: 2026-07-04
