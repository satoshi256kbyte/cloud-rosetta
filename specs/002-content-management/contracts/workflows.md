# Workflow Contracts: 比較結果コンテンツ管理

**Date**: 2026-07-04

## sync.yml ワークフロー

**Trigger**: `push` to `main`, paths: `comparisons/**`

**Steps**:

1. Checkout
2. Setup Node.js (LTS固定)
3. Install dependencies (`scripts/sync/`)
4. Configure AWS credentials (OIDC)
5. Detect changes (`scripts/sync/detect-changes.ts`)
6. Sync to AWS (`scripts/sync/sync-to-aws.ts`)

**Required Secrets/Variables**:

| Name | Type | Description |
|------|------|-------------|
| AWS_ROLE_ARN | Secret | OIDC 認証用 IAM ロール ARN（既存） |
| AWS_REGION | Variable | `ap-northeast-1`（既存） |

**Concurrency**:

- Group: `sync-comparisons`
- cancel-in-progress: false（先行同期を完了させる）

## CI スキーマバリデーション（ci.yml への追加）

**追加ステップ**: `comparisons/` 配下に変更がある場合のみ実行

```yaml
- name: Validate comparison schemas
  if: steps.changes.outputs.comparisons == 'true'
  run: npx tsx scripts/validate/validate.ts
```

## 同期スクリプト インターフェース

### detect-changes.ts

**Input**: 環境変数 `GITHUB_SHA`、`GITHUB_EVENT_BEFORE`

**Output**: stdout に JSON 配列

```json
[
  { "themeId": "serverless-compute", "axisId": "cold-start" },
  { "themeId": "cdn-comparison", "axisId": "latency" }
]
```

### sync-to-aws.ts

**Input**: stdin から detect-changes の出力を受け取る

**Processing**:

1. 各エントリに対して:
   - DynamoDB から現在の version を取得（GetItem）
   - version + 1 で DynamoDB に PutItem（ConditionExpression で排他制御）
   - S3 に result.json をアップロード（PutObject）
   - 失敗時: DynamoDB のレコードを削除して整合性を維持

**Output**: stdout に同期結果サマリー

```json
{
  "synced": [
    { "themeId": "serverless-compute", "axisId": "cold-start", "version": 3 }
  ],
  "failed": []
}
```

**Exit code**: 0（全件成功）、1（1件以上失敗）
