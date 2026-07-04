# Amplify Hosting デプロイ手順

## 概要

Amplify App は GitHub OAuth 連携が必要なため CDK（IaC）管轄外とし、
AWS Console または CLI で作成する。
IAM ロールは CDK で管理し、CLI で Amplify App に紐づける。

## 前提条件

- 001-foundation-infra がデプロイ済み（S3 + DynamoDB が存在）
- CDK で `AmplifyRoleStack` がデプロイ済み
- GitHub リポジトリへのアクセス権限がある AWS アカウント

## 手順

### 1. CDK で IAM ロールをデプロイ

```bash
cd infra
CDK_DEFAULT_ACCOUNT=202633084296 npx cdk deploy AmplifyRoleStack --method=direct --require-approval never
```

出力される `AmplifySSRRoleArn` を控える。

### 2. Amplify App を作成（初回のみ）

AWS Console で作成する場合:

1. Amplify Console を開く:
   <https://ap-northeast-1.console.aws.amazon.com/amplify/home?region=ap-northeast-1>
1. 「Create new app」→ 「GitHub」→ 認可
1. リポジトリ: `satoshi256kbyte/cloud-rosetta`、ブランチ: `main`
1. Build settings を以下に設定:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/.next
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
      - frontend/.next/cache/**/*
```

1. Environment variables に `STAGE=dev` を追加
1. 「Save and deploy」

CLI で作成する場合（OAuth トークンが必要）:

```bash
aws amplify create-app \
  --name cloud-rosetta-dev \
  --repository https://github.com/satoshi256kbyte/cloud-rosetta \
  --platform WEB_COMPUTE \
  --environment-variables STAGE=dev \
  --region ap-northeast-1
```

### 3. IAM ロールを Amplify App に紐づけ

```bash
aws amplify update-app \
  --app-id <APP_ID> \
  --iam-service-role-arn arn:aws:iam::202633084296:role/cloud-rosetta-dev-iam-amplify-ssr \
  --region ap-northeast-1
```

`<APP_ID>` は以下で確認:

```bash
aws amplify list-apps --region ap-northeast-1 \
  --query "apps[?contains(name,'cloud-rosetta')].{name:name,appId:appId}" \
  --output table
```

### 4. 再デプロイ（ロール変更を反映）

Amplify Console で「Redeploy this version」を実行するか、
リポジトリに push して自動ビルドをトリガーする。

## IAM ロールの権限内容

CDK（`infra/lib/stacks/amplify-stack.ts`）で以下を管理:

- `amplify.amazonaws.com` への信頼ポリシー
- `AdministratorAccess-Amplify`（ビルド・デプロイ用マネージドポリシー）
- DynamoDB: GetItem, Query（テーブル + GSI ByStatus）
- S3: GetObject（`comparisons/*` プレフィックス）

## トラブルシューティング

### ページに「データ取得エラー」と表示される

- IAM ロールが正しく紐づいているか確認:
  `aws amplify get-app --app-id <APP_ID> --query "app.iamServiceRoleArn"`
- ロールに DynamoDB/S3 のポリシーがあるか確認:
  `aws iam list-role-policies --role-name cloud-rosetta-dev-iam-amplify-ssr`

### ビルドが失敗する

- Build settings の `baseDirectory` が `frontend/.next` であることを確認
- `STAGE` 環境変数が設定されているか確認
