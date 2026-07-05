# Research: AIエージェント比較自動実行

**Date**: 2026-07-05

## 1. Bedrock AgentCore の構成

**Decision**: Bedrock AgentCore にエージェントをデプロイし、
GitHub Actions から InvokeAgent API で呼び出す。

**Rationale**:

- AgentCore はエージェントのライフサイクル管理（デプロイ・バージョニング・スケーリング）を提供
- ツール（MCP Server、Web検索）の組み込みが宣言的に設定可能
- 多段階処理（情報収集 → 整理 → JSON 生成）をエージェントのオーケストレーションに任せられる
- GitHub Actions は「トリガー + 結果受け取り + PR 作成」に専念し、AI 処理は AgentCore に委譲

**Alternatives considered**:

- GitHub Actions 内で Converse API を直接呼び出す → ツール管理が煩雑、多段階処理の実装が複雑
- Lambda 経由 → 15 分のタイムアウト制限あり、AgentCore で不要

## 2. モデル選定

**Decision**: NVIDIA Nemotron 3 Super 120B A12B（MoE）

**Rationale**:

- Input $0.18 / Output $0.78 per 1M tokens（東京リージョン）
- MoE アーキテクチャで 120B パラメータのうち 12B のみアクティブ → コスト効率が高い
- 構造化出力（JSON）の精度が十分
- 米国 NVIDIA 製で地政学リスクなし
- 1回の比較実行コスト: 約 $0.003〜$0.005（0.5円以下）

**Alternatives considered**:

- Nova Micro/Lite → 最安だが構造化出力の信頼性に不安
- Nova Pro → 高品質だが $0.80/$3.20 で 5 倍以上高い
- Mistral Large 3 → 品質は高いが $0.61/$1.82 でコスト高め
- DeepSeek → 中国製のため地政学リスク

## 3. GitHub Actions ワークフロートリガー

**Decision**: `issues` イベントの `labeled` アクションで
`approved` ラベルを検知してワークフローを起動する。

**Rationale**:

- `on: issues: types: [labeled]` で特定ラベルをフィルタ可能
- ラベル操作は GitHub UI で簡単に行える（管理者の承認操作として自然）
- 二重実行防止は `in-progress` ラベルの存在チェックで実装

**Alternatives considered**:

- workflow_dispatch（手動トリガー）→ Issue との紐づけが弱い
- コメントトリガー（/approve コマンド）→ パース処理が複雑

## 4. エージェントのツール構成

**Decision**: AgentCore エージェントに以下のツールを設定する

1. **AWS Knowledge MCP Server**: AWS 公式ドキュメントの検索・参照
2. **Web Search Tool**: AWS 以外のプロバイダーの公式ドキュメント検索
3. **Output Formatter**: JSON Schema に準拠した出力を生成するツール

**Rationale**:

- constitution 原則III（一次情報参照）に準拠
- AWS の情報は MCP Server 経由で最新の公式ドキュメントを取得
- GCP/Azure/Akamai/Cloudflare は Web 検索で公式ページを参照
- 出力フォーマッタでスキーマ準拠を保証

**Alternatives considered**:

- Web 検索のみ → AWS 情報の精度が低下
- RAG（Knowledge Base）→ 公式ドキュメントの鮮度管理が必要、初期フェーズではオーバースペック

## 5. エラーハンドリングとラベル管理

**Decision**: エージェント実行の各段階でエラーを検知し、
Issue にコメント + ラベル復帰で通知する。

**Rationale**:

- エラー時に Issue コメントで何が失敗したかを可視化
- ラベルを `proposed` に戻すことで再実行可能な状態に復帰
- タイムアウト（15分）は GitHub Actions のジョブレベルで設定

**状態遷移**:

```text
proposed → [approved ラベル付与] → in-progress → [成功] → review
                                              → [失敗] → proposed（コメント付き）
```

## 6. PR 自動作成の方式

**Decision**: GitHub Actions 内で `@octokit/rest` を使用し、
feature ブランチ作成 → コミット → PR 作成を行う。

**Rationale**:

- `actions/github-script` より型安全で テスト可能
- ブランチ名: `agent/{themeId}-{axisId}-{timestamp}`
- PR テンプレートに関連 Issue 番号を自動挿入（`closes #N`）
- PR 作成後に Issue ラベルを `review` に変更

**Alternatives considered**:

- `gh` CLI → TypeScript プロジェクトとの統合性が低い
- GitHub App → 初期フェーズではオーバースペック
