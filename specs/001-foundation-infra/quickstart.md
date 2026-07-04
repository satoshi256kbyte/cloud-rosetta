# Quickstart: 基盤インフラ検証ガイド

**Date**: 2026-07-04

## Prerequisites

- Node.js 20+ がインストールされていること
- AWS CLI v2 が設定済みで、`ap-northeast-1` に対する認証情報があること
- CDK Bootstrap が完了していること（`cdk bootstrap aws://{ACCOUNT}/ap-northeast-1`）

## Setup

```bash
cd infra
npm install
```

## Validation Scenarios

### 1. CDK Synth + cdk-nag チェック

CDK プロジェクトが正常に合成でき、セキュリティチェックをパスすることを確認する。

```bash
cd infra
npx cdk synth --strict
```

**Expected**:

- CloudFormation テンプレートが `cdk.out/` に生成される
- cdk-nag の AwsSolutions チェックでエラーが 0 件
- 抑制されたルールがある場合は、理由が `NagSuppressions` に記載されている

### 2. CDK Deploy（dev 環境）

dev 環境にスタックをデプロイし、リソースが作成されることを確認する。

```bash
cd infra
npx cdk deploy --all --method=direct
```

**Expected**:

- `cloud-rosetta-dev-stack-storage` スタックが作成される
- デプロイが 5 分以内に完了する
- エラーやロールバックが発生しない

### 3. リソース存在確認

デプロイ後、S3 バケットと DynamoDB テーブルが存在することを確認する。

```bash
# S3 バケットの確認
aws s3api head-bucket --bucket cloud-rosetta-dev-s3-comparison-data

# DynamoDB テーブルの確認
aws dynamodb describe-table \
  --table-name cloud-rosetta-dev-ddb-comparison-metadata \
  --query "Table.TableStatus"
```

**Expected**:

- S3: コマンドが正常終了（exit code 0）
- DynamoDB: `"ACTIVE"` が返る

### 4. データ読み書きテスト

テストデータを書き込み、読み取りが成功することを確認する。

```bash
# S3 にテストデータを書き込み
echo '{"test": true}' | aws s3 cp - \
  s3://cloud-rosetta-dev-s3-comparison-data/comparisons/test-theme/test-axis/v1/result.json

# S3 から読み取り
aws s3 cp \
  s3://cloud-rosetta-dev-s3-comparison-data/comparisons/test-theme/test-axis/v1/result.json -

# DynamoDB にテストアイテムを書き込み
aws dynamodb put-item \
  --table-name cloud-rosetta-dev-ddb-comparison-metadata \
  --item '{
    "themeId": {"S": "test-theme"},
    "axisId": {"S": "test-axis"},
    "status": {"S": "draft"},
    "updatedAt": {"S": "2026-07-04T00:00:00Z"},
    "version": {"N": "1"}
  }'

# DynamoDB から読み取り
aws dynamodb get-item \
  --table-name cloud-rosetta-dev-ddb-comparison-metadata \
  --key '{"themeId": {"S": "test-theme"}, "axisId": {"S": "test-axis"}}'
```

**Expected**:

- S3: テストデータが書き込まれ、読み取ったデータが一致する
- DynamoDB: アイテムが登録され、get-item で取得できる
- いずれも 1 秒以内に完了する

### 5. テストデータのクリーンアップ

検証後にテストデータを削除する。

```bash
aws s3 rm s3://cloud-rosetta-dev-s3-comparison-data/comparisons/test-theme/ --recursive

aws dynamodb delete-item \
  --table-name cloud-rosetta-dev-ddb-comparison-metadata \
  --key '{"themeId": {"S": "test-theme"}, "axisId": {"S": "test-axis"}}'
```

### 6. CI ワークフロー検証

GitHub に Push し、CI が正常に動作することを確認する。

```bash
git checkout -b test/ci-validation
git commit --allow-empty -m "ci: ワークフローの動作確認"
git push -u origin test/ci-validation
# GitHub で PR を作成し、CI ジョブの完了を確認
```

**Expected**:

- GitHub Actions の CI ワークフローが起動する
- Lint・型チェック・テストがすべてパスする
- 3 分以内に結果がフィードバックされる

## Teardown

dev 環境のスタックを削除する場合:

```bash
cd infra
npx cdk destroy --all
```

**Note**: S3 バケットにオブジェクトが残っている場合は、
`autoDeleteObjects: true` + `removalPolicy: DESTROY` が設定されていれば
自動で削除される。設定がない場合は手動でバケットを空にしてから destroy する。
