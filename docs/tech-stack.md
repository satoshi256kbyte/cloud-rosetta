# cloud-rosetta 技術スタック

## 概要

cloud-rosettaは、TypeScriptをベース言語とし、AWS上にサーバーレス・マネージドサービス中心で構築します。
IaCはAWS CDKで管理し、cdk-nagによるセキュリティ・ベストプラクティスチェックを組み込みます。

## 技術選定の方針

- 技術選定・設計判断は、AWS公式ドキュメントおよび各言語・フレームワークの最新ドキュメントに基づいて行います。
- AWSのサービス仕様を調査する際は、AWS Knowledge MCP Serverを積極的に利用します。
- AWS以外（Next.js、Hono、TypeScriptなど）の最新動向を調査する際は、Web検索や公式ドキュメントを参照します。
- 本ドキュメントに記載の内容も、実装時には都度最新の公式情報で裏付けを取り直します。

## 言語・フレームワーク

- 言語: TypeScript
- フロントエンド・BFF・SSR: Next.js（比較ページはSSRで提供）
- バックエンド: Hono

## インフラ・IaC

- クラウド: AWS（東京リージョン: ap-northeast-1）
- IaC: AWS CDK
- セキュリティチェック: cdk-nag
- ホスティング（Next.js SSR）: AWS Amplify Hosting

Amplify Hostingを採用しているのは、VPCやALBを必要としないマネージドサービスであるためです。
本アカウントでデフォルト有効になっているVPC Block Public Access（VPC BPA）の制約を回避できます。
詳細は「アカウント制約・注意事項」を参照してください。

## AWSリソースの命名規約

CDKのスタック名・リソースの物理名は、CDKが自動生成する名前（ランダムな文字列を含む名前）を使わず、
以下の形式で明示的に指定します。

```text
{サービス名}-{ステージ名}-{リソース種類}-{用途}
```

- サービス名: `cloud-rosetta` で固定します。
- ステージ名: `dev` / `stg` / `prod` などを使います。
- リソース種類: `s3` `ddb`（DynamoDB） `lambda` `apigw` `stack` など、リソースの種類が分かる短い識別子を使います。
- 用途: そのリソースが何のためのものかを表す名前を使います。

全体を小文字とハイフン区切りで表記し、キャメルケースやスネークケースは使いません。

例:

- S3バケット（比較結果データ）: `cloud-rosetta-prod-s3-comparison-data`
- DynamoDBテーブル（比較結果メタデータ）: `cloud-rosetta-prod-ddb-comparison-metadata`
- Lambda関数（比較結果のフォーマット変換）: `cloud-rosetta-prod-lambda-format-comparison`
- CDKスタック（データストア関連リソースをまとめるスタック）: `cloud-rosetta-prod-stack-storage`

S3バケット名はグローバルで一意である必要があるため、衝突する場合は末尾にAWSアカウントIDを付与し、
以下の形式とします。

```text
{サービス名}-{ステージ名}-{リソース種類}-{用途}-{アカウントID}
```

例: `cloud-rosetta-prod-s3-comparison-data-123456789012`

ランダムな文字列ではなく、アカウントIDのような一意性が保証された識別子を使う点に注意します。

## データストア

- 比較結果はJSON・Markdown形式で生成し、Amazon S3に保存します。
- 比較結果のメタデータ（ステータス、比較テーマ、比較軸、更新日時など）はAmazon DynamoDBで管理します。
- GitHubリポジトリは、比較テーマ・比較軸の提案とAIエージェントによる比較結果のレビューの場であり、
  正（source of truth）ではありません。マージ後、内容はS3・DynamoDBへ同期され、以降のアプリケーションは
  GitHubリポジトリを参照しません。
- RDB（Aurora Serverless v2）は、現時点では不要と判断しています。

## AIエージェント実行基盤

- 実行基盤: Amazon Bedrock、Amazon Bedrock AgentCore
- 比較作業の中で、公式サイトやエンジニアブログをWeb検索して参照します。
- AWSサービスの比較を行う際は、Web検索だけでなくAWS Knowledge MCP Serverも活用し、
  一次情報に基づいた比較結果を作成します。GCP・Azure・Akamai・Cloudflareなど、AWS以外のサービスを比較する際は、
  各社の公式ドキュメントに対するWeb検索を利用します。

## CI/CD・自動化

GitHub ActionsをCI/CDおよびAIエージェント起動のトリガーとして利用します。

- 比較テーマ・比較軸のIssueに着手用タグが付けられたことをトリガーに、GitHub Actions経由でAIエージェントが起動し、
  比較結果をMarkdownのPull Requestとして作成します。
- Pull Requestがマージされたことをトリガーに、GitHub Actionsが内容をS3へ書き込み、
  DynamoDBのメタデータ（ステータスなど）を更新します。

インフラのデプロイも、初期はGitHub Actionsで行います。

- 開発時のCDKデプロイには、AWS CloudFormation Express mode（`cdk deploy --express`）を使用し、
  デプロイの反復にかかる時間を短縮します。
- Express modeはデフォルトでロールバックが無効になるため、本番環境へのデプロイでは使用せず、
  標準モード（安定化チェックあり）を使用します。

## 品質保証

- Lint・Formatを徹底します。
- ユニットテストに加え、プロパティベーステストを実施します。
- E2EテストにはPlaywrightを使用します。
- AIエージェントによる画面操作・動作確認・デモを行う際は、Playwright MCP・Chrome DevTools MCPを使い、
  実際のブラウザ操作を人が目視で確認できる形にします。

## アカウント制約・注意事項

- 本プロダクトを構築するAWSアカウントは、VPC Block Public Access（VPC BPA）が`block-bidirectional`で
  アカウント全体に有効になっています。
- Internet Gateway経由の通信がデフォルトで双方向ブロックされるため、インターネット疎通が必要なVPCリソース
  （ALB、NAT経由のegressなど）を構築する場合は、`CfnVPCBlockPublicAccessExclusion`による除外設定が必須です。
- Next.jsのホスティングにAWS Amplify Hostingを採用しているのは、この制約を回避する狙いもあります。

## 未決定事項

- 認証方式（社内向けフェーズと外部公開フェーズで異なる可能性がある）

## 決定済み事項

- CDN: AWS Amplify Hosting 内包の CloudFront を使用（追加の CDN 導入は不要）
