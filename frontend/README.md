# cloud-rosetta Frontend

Next.js 15（App Router）による比較結果表示サイト。

## セットアップ

```bash
cd frontend
npm install
```

## 開発

```bash
STAGE=dev npm run dev
```

`http://localhost:3000` でアクセス可能。

## ビルド

```bash
npm run build
```

## 環境変数

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| STAGE | 環境ステージ（dev/stg/prod） | dev |

リソース名は `STAGE` から命名規約で自動導出される（`src/lib/aws-config.ts`）。

## ページ構成

| パス | 内容 |
|------|------|
| `/` | 比較テーマ一覧（DynamoDB GSI ByStatus） |
| `/comparisons/[themeId]/[axisId]` | 比較結果詳細（S3 から取得） |

## デプロイ

AWS Amplify Hosting にデプロイ。手順は
[docs/amplify-deploy.md](../docs/amplify-deploy.md) を参照。
