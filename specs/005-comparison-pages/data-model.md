# Data Model: 比較結果ページの本実装

**Date**: 2026-07-05

## Overview

本フェーズで新規テーブル・バケットは作成しない。
001-foundation-infra で定義済みのデータストアを読み取り専用で使用する。

## 使用するデータソース

### DynamoDB: comparison-metadata テーブル

テーマ一覧の取得に使用する。

```typescript
interface ThemeMetadata {
  themeId: string;          // PK
  axisId: string;           // SK
  status: 'proposed' | 'approved' | 'in-progress' | 'review' | 'published';
  version: number;
  providers: string[];
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
}
```

**アクセスパターン**:

- テーマ一覧取得: GSI `ByStatus` で `status=published` を Query
- テーマ別軸一覧: PK=`{themeId}` で Query（status=published のみ表示）

### S3: comparison-data バケット

比較結果 JSON の取得に使用する。

```typescript
interface ComparisonResult {
  themeId: string;
  axisId: string;
  providers: Provider[];
  comparedAt: string;       // ISO 8601
  comparedBy: string;       // "agent" | "human"
}

interface Provider {
  name: string;             // "AWS" | "GCP" | "Azure" | "Akamai" | "Cloudflare"
  serviceName: string;
  summary: string;
  details?: string;
  sources: string[];        // 公式ドキュメント URL
}
```

**アクセスパターン**:

- 比較結果取得: `s3://bucket/comparisons/{themeId}/{axisId}/result.json`

## フロントエンド固有の型定義

```typescript
/** テーマカード表示用（DynamoDB 集約結果） */
interface ThemeCardData {
  themeId: string;
  axisCount: number;        // そのテーマに属する published な軸の数
  providers: string[];      // 全軸を通じて含まれるプロバイダーの union
  latestUpdate: string;     // 最も新しい updatedAt
}

/** フィルタ状態 */
interface FilterState {
  providers: string[];      // 選択中のプロバイダー（空 = 全表示）
}

/** ページネーション */
interface PaginationState {
  currentPage: number;
  totalPages: number;
  itemsPerPage: 12;
}
```
