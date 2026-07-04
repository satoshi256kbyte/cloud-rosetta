# cloud-rosetta Infrastructure

AWS CDK による cloud-rosetta のインフラストラクチャ定義。

## セットアップ

```bash
cd infra
npm install
```

## コマンド一覧

| コマンド | 説明 |
|---------|------|
| `npx cdk synth --strict` | CloudFormation テンプレート生成 + cdk-nag チェック |
| `npx cdk deploy --all --method=direct` | dev 環境にデプロイ（Express mode） |
| `npx cdk diff` | デプロイ済みスタックとの差分表示 |
| `npx cdk destroy --all` | dev 環境のスタックを削除 |
| `npm run test` | ユニットテスト実行（Vitest） |
| `npm run lint` | ESLint 実行 |
| `npm run build` | TypeScript 型チェック |

## ディレクトリ構成

```text
infra/
├── bin/
│   └── app.ts                      # CDK App エントリーポイント
├── lib/
│   ├── constructs/
│   │   ├── comparison-bucket.ts    # S3 バケット Construct
│   │   └── comparison-table.ts     # DynamoDB テーブル Construct
│   ├── stacks/
│   │   └── storage-stack.ts        # データストアスタック
│   ├── stages/
│   │   └── dev.ts                  # dev 環境ステージ
│   └── utils/
│       └── tagging.ts              # 必須タグ付与
├── test/
│   ├── constructs/
│   │   ├── comparison-bucket.test.ts
│   │   └── comparison-table.test.ts
│   └── stacks/
│       └── storage-stack.test.ts
├── cdk.json
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## 命名規約

すべてのリソースは以下の形式で命名する。

```text
{サービス名}-{ステージ名}-{リソース種類}-{用途}
```

例:

- S3 バケット: `cloud-rosetta-dev-s3-comparison-data`
- DynamoDB テーブル: `cloud-rosetta-dev-ddb-comparison-metadata`
- スタック: `cloud-rosetta-dev-stack-storage`

## cdk-nag 抑制ルール

cdk-nag の違反を抑制する場合は、以下のルールに従う。

1. `NagSuppressions.addResourceSuppressions()` を使用する
2. `reason` フィールドに抑制理由を必ず記載する
3. Pull Request のレビューで承認を得る

```typescript
import { NagSuppressions } from 'cdk-nag';

NagSuppressions.addResourceSuppressions(resource, [
  {
    id: 'AwsSolutions-S1',
    reason: '理由をここに記載する',
  },
]);
```

## タグ付け

すべてのリソースに以下の必須タグが付与される（`lib/utils/tagging.ts`）。

| タグキー | 値 |
|---------|-----|
| Project | cloud-rosetta |
| Stage | dev / stg / prod |
| ManagedBy | cdk |
