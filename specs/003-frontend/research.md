# Research: フロントエンド（比較結果表示）

**Date**: 2026-07-04

## 1. Next.js 15 App Router での SSR データ取得

**Decision**: Server Components のデフォルト動作（`async` コンポーネント）で
DynamoDB/S3 からデータを取得する。`fetch` ではなく AWS SDK を直接呼び出す。

**Rationale**:

- App Router の Server Components はデフォルトでサーバーサイド実行
- AWS SDK v3 を直接使用することで、API Gateway を介さずに DynamoDB/S3 にアクセス
- `cache: 'no-store'` 相当の動作で常に最新データを表示（SC-004）

**Alternatives considered**:

- API Routes 経由 → 不要なレイヤー追加、レイテンシ増加
- ISR（Incremental Static Regeneration） → データ更新頻度が低いため将来検討

## 2. AWS Amplify Hosting + Next.js SSR

**Decision**: Amplify Hosting の Next.js SSR サポートを使用する。
Amplify は内部で Lambda を使って SSR を実行する。

**Rationale**:

- VPC 不要（constitution 原則IV、VPC BPA 回避）
- GitHub リポジトリ連携で自動ビルド・デプロイ
- Next.js 15 の App Router を公式サポート
- CloudFront が自動的に前段に配置される

**Alternatives considered**:

- ECS Fargate → VPC 必要、BPA 除外設定が必要
- Lambda@Edge + S3 → Next.js SSR の複雑さに対応困難
- Vercel → AWS 統一の方針に反する

## 3. リソース名の導出方法

**Decision**: 環境変数 `STAGE` のみを受け取り、
コード内で命名規約からリソース名を構築する。

```typescript
const stage = process.env.STAGE || 'dev';
const TABLE_NAME = `cloud-rosetta-${stage}-ddb-comparison-metadata`;
const BUCKET_NAME = `cloud-rosetta-${stage}-s3-comparison-data`;
```

**Rationale**:

- 環境変数を最小限に抑え、設定漏れのリスクを低減
- 命名規約が constitution で確定しているため、導出が一意に決まる
- Amplify の環境変数設定が `STAGE` 1つで済む

**Alternatives considered**:

- 全リソース名を個別の環境変数で渡す → 管理が煩雑
- SSM Parameter Store → Lambda コールドスタート時のレイテンシ追加

## 4. CSS フレームワーク

**Decision**: Tailwind CSS を使用する。

**Rationale**:

- ユーティリティファーストで高速にレスポンシブ UI を構築可能
- Next.js との統合が公式にサポートされている
- バンドルサイズが PurgeCSS で最小化される
- コンポーネントライブラリ（shadcn/ui 等）との相性が良い

**Alternatives considered**:

- CSS Modules → スケーラビリティに課題
- Chakra UI → バンドルサイズが大きい
- Styled Components → Server Components と相性が悪い

## 5. Amplify Hosting の CDK 管理

**Decision**: `infra/` に AmplifyStack を追加し、
CDK で Amplify App + Branch を管理する。

**Rationale**:

- インフラ全体を CDK で統一管理（constitution 技術スタック制約）
- GitHub 連携の設定を IaC で再現可能にする
- 環境変数（STAGE）の設定も CDK で管理

**Alternatives considered**:

- Amplify CLI → CDK との二重管理になる
- AWS Console 手動設定 → 再現性がない
