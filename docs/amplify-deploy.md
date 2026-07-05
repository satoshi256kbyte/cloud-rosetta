# Amplify Hosting デプロイ手順

## 概要

Amplify App は GitHub OAuth 連携が必要なため CDK（IaC）管轄外とし、
AWS Console または CLI で作成する。
IAM ロールは CDK で管理し、CLI で Amplify App に紐づける。

## 前提条件

- 001-foundation-infra がデプロイ済み（S3 + DynamoDB が存在）
- CDK で `AmplifyRoleStack` がデプロイ済み
- GitHub リポジトリへのアクセス権限がある AWS アカウント
- `frontend/next.config.ts` に `output: 'standalone'` が設定されていること

## 手順

### 1. CDK で IAM ロールをデプロイ

```bash
cd infra
CDK_DEFAULT_ACCOUNT=202633084296 npx cdk deploy AmplifyRoleStack \
  --method=direct --require-approval never
```

出力される `AmplifySSRRoleArn` を控える。

### 2. Amplify App を作成（初回のみ）

AWS Console で作成する場合:

1. Amplify Console を開く:
   <https://ap-northeast-1.console.aws.amazon.com/amplify/home?region=ap-northeast-1>
1. 「Create new app」→ 「GitHub」→ 認可
1. リポジトリ: `satoshi256kbyte/cloud-rosetta`、ブランチ: `main`
1. Build settings はデフォルトのまま「Save and deploy」

初回ビルドは失敗するが、後続の設定で修正する。

### 3. プラットフォームとモノレポ設定

Amplify App 作成後、以下の CLI コマンドで SSR + モノレポ設定を行う。

```bash
APP_ID=<作成された App ID>

# プラットフォームを WEB_COMPUTE（SSR）に設定
aws amplify update-app \
  --app-id $APP_ID \
  --platform WEB_COMPUTE \
  --region ap-northeast-1

# アプリレベルの環境変数（モノレポルート + ステージ）
aws amplify update-app \
  --app-id $APP_ID \
  --environment-variables "AMPLIFY_MONOREPO_APP_ROOT=frontend,STAGE=dev" \
  --region ap-northeast-1

# buildSpec（monorepo 用: applications キー必須）
aws amplify update-app \
  --app-id $APP_ID \
  --build-spec 'version: 1
applications:
  - appRoot: frontend
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - "**/*"
      cache:
        paths:
          - node_modules/**/*
          - .next/cache/**/*
' \
  --region ap-northeast-1

# ブランチのフレームワーク設定
aws amplify update-branch \
  --app-id $APP_ID \
  --branch-name main \
  --framework "Next.js - SSR" \
  --environment-variables "AMPLIFY_MONOREPO_APP_ROOT=frontend,STAGE=dev" \
  --region ap-northeast-1
```

### 4. IAM ロールを Amplify App に紐づけ

```bash
aws amplify update-app \
  --app-id $APP_ID \
  --iam-service-role-arn arn:aws:iam::202633084296:role/cloud-rosetta-dev-iam-amplify-ssr \
  --region ap-northeast-1
```

### 5. 再デプロイ

設定完了後、再デプロイをトリガーする。

```bash
aws amplify start-job \
  --app-id $APP_ID \
  --branch-name main \
  --job-type RELEASE \
  --region ap-northeast-1
```

### App ID の確認方法

```bash
aws amplify list-apps --region ap-northeast-1 \
  --query "apps[?contains(name,'cloud-rosetta')].{name:name,appId:appId}" \
  --output table
```

## 重要な設定ポイント

| 設定項目 | 値 | 理由 |
|---------|-----|------|
| platform | `WEB_COMPUTE` | Next.js SSR に必要 |
| AMPLIFY_MONOREPO_APP_ROOT | `frontend` | モノレポで frontend/ をアプリルートに指定 |
| buildSpec の `applications` キー | 必須 | モノレポ設定時は `applications` 形式が必要 |
| `appRoot` | `frontend` | buildSpec 内でもアプリルートを指定 |
| `baseDirectory` | `.next` | appRoot 相対パス（frontend/.next ではない） |
| `output: 'standalone'` | next.config.ts | Amplify SSR デプロイに必要 |
| framework | `Next.js - SSR` | ブランチレベルで明示指定 |

## IAM ロールの権限内容

CDK（`infra/lib/stacks/amplify-stack.ts`）で以下を管理:

- `amplify.amazonaws.com` への信頼ポリシー
- `AdministratorAccess-Amplify`（ビルド・デプロイ用マネージドポリシー）
- DynamoDB: GetItem, Query（テーブル + GSI ByStatus）
- S3: GetObject（`comparisons/*` プレフィックス）

## トラブルシューティング

### `Cannot read 'next' version in package.json`

- `AMPLIFY_MONOREPO_APP_ROOT=frontend` がアプリレベルの環境変数に設定されているか確認
- buildSpec に `applications` キーと `appRoot: frontend` があるか確認

### `Failed to find the deploy-manifest.json`

- `frontend/next.config.ts` に `output: 'standalone'` が設定されているか確認
- `platform` が `WEB_COMPUTE` になっているか確認:
  `aws amplify get-app --app-id $APP_ID --query "app.platform"`

### `Monorepo spec provided without "applications" key`

- buildSpec の最上位に `applications:` キーを追加する
- `version: 1` の直下に `applications:` → `- appRoot: frontend` の構造にする

### ページに「データ取得エラー」と表示される

- IAM ロールが正しく紐づいているか確認:
  `aws amplify get-app --app-id $APP_ID --query "app.iamServiceRoleArn"`
- ロールに DynamoDB/S3 のポリシーがあるか確認:
  `aws iam list-role-policies --role-name cloud-rosetta-dev-iam-amplify-ssr`
- `STAGE` 環境変数が設定されているか確認
