# Quickstart: AIエージェント比較自動実行 検証ガイド

**Date**: 2026-07-05

## Prerequisites

- 001-foundation-infra がデプロイ済み
- 002-content-management が動作済み（Issue テンプレート、スキーマバリデーション）
- Bedrock で NVIDIA Nemotron 3 Super 120B A12B へのアクセスが有効化済み
- GitHub Actions の OIDC IAM ロールに Bedrock AgentCore の権限が追加済み

## Validation Scenarios

### 1. AgentCore エージェントのデプロイ確認

```bash
cd infra
CDK_DEFAULT_ACCOUNT=202633084296 npx cdk deploy AgentStack \
  --method=direct --require-approval never
```

**Expected**: AgentCore にエージェントがデプロイされ、Agent ID が出力される

### 2. エージェント単体テスト

AgentCore API を直接呼び出してエージェントが応答することを確認する。

```bash
cd scripts/agent
npx tsx invoke-agent.ts --test \
  --theme-id "serverless-compute" \
  --axis-id "cold-start" \
  --providers "AWS,GCP"
```

**Expected**:

- エージェントが情報収集を実行する
- JSON Schema 準拠の result.json が stdout に出力される
- providers に AWS と GCP の情報が含まれる
- sources に公式ドキュメント URL が含まれる

### 3. Issue ラベルトリガーの動作確認

1. GitHub で比較テーマ Issue を作成する（テンプレート使用）
1. Issue に `approved` ラベルを付与する
1. GitHub Actions の `agent.yml` が起動することを確認する

**Expected**:

- ワークフローが起動する
- Issue のラベルが `in-progress` に変更される
- エージェントが実行される（ログで確認）

### 4. PR 自動作成の確認

シナリオ 3 の続きとして、エージェント実行完了後に PR が作成されることを確認する。

**Expected**:

- `agent/{themeId}-{axisId}-{timestamp}` ブランチが作成される
- `comparisons/{themeId}/{axisId}/result.json` がコミットされる
- PR が作成され、関連 Issue 番号（`closes #N`）が含まれる
- CI（スキーマバリデーション）がパスする
- Issue のラベルが `review` に変更される

### 5. エラー時の動作確認

不正な入力（存在しないプロバイダー等）で Issue を作成し、
エージェントがエラーハンドリングすることを確認する。

**Expected**:

- Issue にエラー内容がコメントされる
- Issue のラベルが `proposed` に戻る
- ワークフローがエラーステータスで終了する
