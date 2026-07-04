# Quickstart: フロントエンド検証ガイド

**Date**: 2026-07-04

## Prerequisites

- Node.js 22+ がインストールされていること
- 001-foundation-infra がデプロイ済み（DynamoDB + S3 が存在）
- 002-content-management で比較データが少なくとも 1 件同期済みであること

## Setup

```bash
cd frontend
npm install
```

## Validation Scenarios

### 1. ローカル開発サーバーの起動

```bash
cd frontend
STAGE=dev npm run dev
```

**Expected**: `http://localhost:3000` でアプリケーションが起動する

### 2. トップページ（テーマ一覧）の確認

ブラウザで `http://localhost:3000` にアクセスする。

**Expected**:

- ヘッダーにサイト名が表示される
- サイドバーにテーマ一覧が表示される
- メインエリアに公開済みテーマがカード形式で表示される
- テーマが 0 件の場合は「比較データがまだありません」と表示される

### 3. 詳細ページ（比較結果テーブル）の確認

テーマカードをクリックし、詳細ページに遷移する。

**Expected**:

- URL が `/comparisons/{themeId}/{axisId}` になる
- プロバイダー比較テーブルが表示される
- 各プロバイダーの名前・サービス名・概要・参照元リンクが表示される

### 4. レスポンシブ表示の確認

ブラウザの DevTools でモバイルビューに切り替える。

**Expected**:

- サイドバーが折りたたまれる（ハンバーガーメニュー等）
- テーブルが横スクロール可能になる
- テキストが読みやすいサイズで表示される

### 5. Amplify Hosting デプロイ確認

CDK で Amplify スタックをデプロイし、提供された URL にアクセスする。

```bash
cd infra
npx cdk deploy --all --method=direct --require-approval never
```

**Expected**:

- Amplify の URL でアプリケーションにアクセスできる
- ローカルと同じ表示結果が得られる
- SSR でデータが表示される（ページソースに比較結果が含まれる）
