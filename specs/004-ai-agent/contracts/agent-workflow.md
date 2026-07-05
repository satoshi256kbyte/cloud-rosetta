# Workflow Contracts: AIエージェント比較自動実行

**Date**: 2026-07-05

## agent.yml ワークフロー

**Trigger**: `issues` イベント、`types: [labeled]`、ラベル名 `approved`

**Permissions**:

```yaml
permissions:
  issues: write
  contents: write
  pull-requests: write
  id-token: write
```

**Steps**:

1. ラベル名が `approved` であることを確認（それ以外は即時終了）
2. `in-progress` ラベルが既に存在する場合はスキップ（二重実行防止）
3. Issue のラベルを `approved` → `in-progress` に変更
4. Issue 本文をパースし `AgentInput` を生成（`parse-issue.ts`）
5. バリデーション失敗時: エラーコメント投稿 + ラベルを `proposed` に戻す
6. 同一テーマ・軸の未マージ PR 存在チェック（重複防止）
7. AWS 認証（OIDC）
8. AgentCore API でエージェントを呼び出す（`invoke-agent.ts`）
9. エージェント出力の JSON Schema バリデーション
10. feature ブランチ作成 + result.json コミット + PR 作成（`create-pr.ts`）
11. Issue のラベルを `in-progress` → `review` に変更

**Timeout**: ジョブレベルで 15 分（`timeout-minutes: 15`）

**Error Handling**: ステップ 4〜10 でエラー発生時:

- Issue にエラーコメントを投稿（`update-labels.ts`）
- ラベルを `proposed` に戻す
- ワークフローは failure で終了

**Required Secrets/Variables**:

| Name | Type | Description |
|------|------|-------------|
| AWS_ROLE_ARN | Secret | OIDC 認証用 IAM ロール ARN（既存） |
| AWS_REGION | Variable | `ap-northeast-1`（既存） |
| AGENT_ID | Variable | AgentCore のエージェント ID |
| AGENT_ALIAS_ID | Variable | AgentCore のエージェントエイリアス ID |

**Concurrency**:

- Group: `agent-${{ github.event.issue.number }}`
- cancel-in-progress: false（実行中のエージェントを中断しない）

## スクリプトインターフェース

### parse-issue.ts

**Input**: 環境変数 `ISSUE_BODY`（Issue 本文）、`ISSUE_NUMBER`

**Output**: stdout に JSON

```json
{
  "themeId": "serverless-compute",
  "axisId": "cold-start",
  "providers": ["AWS", "GCP", "Azure"],
  "issueNumber": 42
}
```

**Exit code**: 0（成功）、1（パース失敗 or バリデーションエラー）

### invoke-agent.ts

**Input**: 環境変数 `AGENT_ID`、`AGENT_ALIAS_ID`、stdin から `AgentInput` JSON

**Processing**:

1. AgentCore `InvokeAgent` API を呼び出す
2. セッション ID を生成（`agent-{issueNumber}-{timestamp}`）
3. レスポンスストリームを受信し、最終出力を取得
4. レート制限時: エクスポネンシャルバックオフ（1s → 2s → 4s、最大 3 回）

**Output**: stdout に `result.json` の内容（JSON）

**Exit code**: 0（成功）、1（API エラー or タイムアウト）

### create-pr.ts

**Input**: stdin から `result.json` の内容、環境変数 `THEME_ID`、
`AXIS_ID`、`ISSUE_NUMBER`

**Processing**:

1. ブランチ `agent/{themeId}-{axisId}` を作成（既存なら末尾にタイムスタンプ付与）
2. `comparisons/{themeId}/{axisId}/result.json` をコミット
3. PR を作成（タイトル: `feat(comparison): {themeId}/{axisId} の比較結果を追加`）
4. PR 本文に `closes #{issueNumber}` を含める

**Output**: stdout に作成された PR の URL

**Exit code**: 0（成功）、1（Git/GitHub API エラー）

### update-labels.ts

**Input**: 環境変数 `ISSUE_NUMBER`、`ADD_LABEL`、`REMOVE_LABEL`

**Processing**:

1. `REMOVE_LABEL` を Issue から削除
2. `ADD_LABEL` を Issue に追加

**Exit code**: 0（成功）、1（GitHub API エラー）

## AgentCore エージェント設定

### エージェント構成

| 項目 | 値 |
|------|-----|
| Agent Name | `cloud-rosetta-comparison-agent` |
| Model | NVIDIA Nemotron 3 Super 120B A12B |
| Region | ap-northeast-1 |
| Idle Timeout | 60 秒 |

### ツール定義

| ツール名 | 種類 | 用途 |
|----------|------|------|
| aws-knowledge | MCP Server | AWS 公式ドキュメント検索 |
| web-search | Built-in | AWS 以外の公式ドキュメント検索 |

### システムプロンプト概要

エージェントのシステムプロンプト（`scripts/agent/prompts/comparison.txt`）に
含める指示の要点:

- 出力は `result.json` の JSON Schema に厳密に準拠すること
- 情報源の優先順位: 公式ドキュメント > 公式ブログ > その他
- すべての出力は日本語で記述すること
- 各プロバイダーの `sources` に最低 1 つの公式 URL を含めること
- 情報が取得できない場合は `summary` に「情報取得不可」と記載すること

## CDK スタック: AgentStack

### 作成リソース

| リソース | 種類 | 備考 |
|----------|------|------|
| Agent | Bedrock AgentCore Agent | 比較実行エージェント |
| Agent Alias | Bedrock AgentCore Alias | エージェントの公開エイリアス |
| IAM Role (Agent) | IAM Role | エージェント用実行ロール |
| IAM Policy (OIDC追加) | IAM Policy | 既存ロールに Bedrock 権限追加 |

### IAM 権限（エージェント実行ロール）

```json
{
  "Effect": "Allow",
  "Action": [
    "bedrock:InvokeModel"
  ],
  "Resource": "arn:aws:bedrock:ap-northeast-1::foundation-model/*"
}
```

### IAM 権限（GitHub Actions OIDC ロール追加分）

```json
{
  "Effect": "Allow",
  "Action": [
    "bedrock:InvokeAgent"
  ],
  "Resource": "arn:aws:bedrock:ap-northeast-1:{account}:agent/{agentId}"
}
```
