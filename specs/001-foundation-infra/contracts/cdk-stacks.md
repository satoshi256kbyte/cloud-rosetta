# CDK Stack Contracts: 基盤インフラ

**Date**: 2026-07-04

## Overview

本ドキュメントは CDK スタックが外部に公開するインターフェース（出力値、Props）を定義する。
他のスタックやアプリケーションがこれらの値を参照してリソースにアクセスする。

## StorageStack

### Props（入力）

```typescript
interface StorageStackProps extends cdk.StackProps {
  /** 環境ステージ名（dev / stg / prod） */
  stage: string;
}
```

### Outputs（CloudFormation 出力値）

| Output Key | Description | Example Value |
|------------|-------------|---------------|
| ComparisonBucketName | S3 バケット名 | `cloud-rosetta-dev-s3-comparison-data` |
| ComparisonBucketArn | S3 バケット ARN | `arn:aws:s3:::cloud-rosetta-dev-s3-comparison-data` |
| ComparisonTableName | DynamoDB テーブル名 | `cloud-rosetta-dev-ddb-comparison-metadata` |
| ComparisonTableArn | DynamoDB テーブル ARN | `arn:aws:dynamodb:ap-northeast-1:...` |

### Exported Constructs

他のスタックが `StorageStack` のリソースを参照する場合は、
Stack 間の直接参照（`stack.bucket`）ではなく、
SSM Parameter Store 経由の late-binding を推奨する（CDK ベストプラクティス）。

## GitHub Actions Workflow Contracts

### CI Workflow（`.github/workflows/ci.yml`）

**Trigger**: `pull_request` (branches: `main`)

**Steps**:

1. Checkout
2. Setup Node.js
3. Install dependencies（`infra/`）
4. Lint（ESLint）
5. Type check（`tsc --noEmit`）
6. Unit test（Vitest）
7. CDK synth + cdk-nag check

**Required Secrets**:

| Secret Name | Description |
|-------------|-------------|
| （なし） | CI は AWS 認証不要（synth のみ） |

### CD Workflow（`.github/workflows/cd.yml`）

**Trigger**: `push` (branches: `main`)

**Steps**:

1. Checkout
2. Setup Node.js
3. Install dependencies（`infra/`）
4. Configure AWS credentials（OIDC）
5. CDK deploy（Express mode）

**Required Secrets/Variables**:

| Name | Type | Description |
|------|------|-------------|
| AWS_ROLE_ARN | Secret | OIDC 認証用 IAM ロール ARN |
| AWS_REGION | Variable | デプロイ先リージョン（`ap-northeast-1`） |
