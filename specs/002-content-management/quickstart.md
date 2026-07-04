# Quickstart: 比較結果コンテンツ管理 検証ガイド

**Date**: 2026-07-04

## Prerequisites

- 001-foundation-infra がデプロイ済み（S3 + DynamoDB が存在すること）
- GitHub リポジトリに OIDC 認証設定が完了していること
- Node.js 22+ がインストールされていること

## Validation Scenarios

### 1. Issue テンプレート動作確認

GitHub で比較テーマの Issue を作成し、テンプレートが正しく表示されることを確認する。

1. GitHub リポジトリで「New Issue」をクリック
2. 「比較テーマの提案」テンプレートを選択
3. フォームに入力して Issue を作成

**Expected**:

- テンプレートのフォームフィールド（テーマ名、プロバイダー、軸、理由）が表示される
- 作成された Issue に `proposed` ラベルが自動付与される

### 2. スキーマバリデーション確認

不正な JSON で PR を作成し、CI がブロックすることを確認する。

```bash
git checkout -b test/schema-validation
mkdir -p comparisons/test-theme/test-axis
echo '{"invalid": true}' > comparisons/test-theme/test-axis/result.json
git add . && git commit -m "test: スキーマバリデーション確認"
git push -u origin test/schema-validation
# PR を作成
```

**Expected**:

- CI の「Validate comparison schemas」ステップが失敗する
- スキーマ違反の詳細がログに出力される

### 3. 正常な比較結果の同期確認

正しい形式の比較結果で PR を作成し、マージ後に同期されることを確認する。

```bash
git checkout -b test/sync-validation
mkdir -p comparisons/test-theme/test-axis
cat > comparisons/test-theme/test-axis/result.json << 'EOF'
{
  "themeId": "test-theme",
  "axisId": "test-axis",
  "providers": [
    {
      "name": "AWS",
      "serviceName": "AWS Lambda",
      "summary": "サーバーレスコンピューティング",
      "sources": ["https://docs.aws.amazon.com/lambda/"]
    },
    {
      "name": "GCP",
      "serviceName": "Cloud Functions",
      "summary": "サーバーレスコンピューティング",
      "sources": ["https://cloud.google.com/functions/docs"]
    }
  ],
  "comparedAt": "2026-07-04T00:00:00Z",
  "comparedBy": "satoshi256kbyte"
}
EOF
git add . && git commit -m "feat(comparison): テスト比較結果を追加"
git push -u origin test/sync-validation
# PR を作成 → レビュー → マージ
```

**Expected**:

- CI が成功（スキーマバリデーションパス）
- マージ後、sync.yml が起動する
- S3 に `comparisons/test-theme/test-axis/v1/result.json` が書き込まれる
- DynamoDB に themeId=test-theme, axisId=test-axis, version=1 が登録される

### 4. データ確認

```bash
# S3 確認
aws s3 cp s3://cloud-rosetta-dev-s3-comparison-data/comparisons/test-theme/test-axis/v1/result.json -

# DynamoDB 確認
aws dynamodb get-item \
  --table-name cloud-rosetta-dev-ddb-comparison-metadata \
  --key '{"themeId": {"S": "test-theme"}, "axisId": {"S": "test-axis"}}'
```

**Expected**:

- S3: PR で作成した JSON と同一の内容
- DynamoDB: status=published, version=1, updatedAt が現在時刻付近

### 5. クリーンアップ

```bash
aws s3 rm s3://cloud-rosetta-dev-s3-comparison-data/comparisons/test-theme/ --recursive
aws dynamodb delete-item \
  --table-name cloud-rosetta-dev-ddb-comparison-metadata \
  --key '{"themeId": {"S": "test-theme"}, "axisId": {"S": "test-axis"}}'
```
