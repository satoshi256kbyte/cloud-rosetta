# Data Model: 基盤インフラ

**Date**: 2026-07-04

## Entities

### ComparisonMetadata（DynamoDB）

比較結果のメタデータを管理するテーブル。

**Table Name**: `cloud-rosetta-{stage}-ddb-comparison-metadata`

| Attribute | Type | Key | Description |
|-----------|------|-----|-------------|
| themeId | String | PK | 比較テーマの一意識別子（例: `serverless-compute`） |
| axisId | String | SK | 比較軸の一意識別子（例: `cold-start-latency`） |
| status | String | GSI-PK | `draft` / `published` / `archived` |
| updatedAt | String (ISO 8601) | GSI-SK | 最終更新日時 |
| title | String | - | 比較テーマの表示名 |
| axisTitle | String | - | 比較軸の表示名 |
| version | Number | - | 現在のバージョン番号（S3 キーの `v{N}` と対応） |
| createdAt | String (ISO 8601) | - | 作成日時 |
| createdBy | String | - | 作成者（GitHub ユーザー名またはエージェント ID） |

#### GSI: ByStatus

| Attribute | Key Role |
|-----------|----------|
| status | Partition Key |
| updatedAt | Sort Key |

**Projection**: ALL（全属性を射影）

#### State Transitions

```text
draft → published → archived
  ↑         |
  └─────────┘ (republish: new version)
```

- `draft`: AIエージェントが作成、レビュー待ち
- `published`: 人間がレビュー承認済み、公開中
- `archived`: 古いバージョンまたは非公開にされたもの

### ComparisonData（S3）

比較結果の本体データを保存するバケット。

**Bucket Name**: `cloud-rosetta-{stage}-s3-comparison-data`
（グローバル衝突時: `cloud-rosetta-{stage}-s3-comparison-data-{accountId}`）

#### Key Structure

```text
comparisons/{themeId}/{axisId}/v{version}/result.json
comparisons/{themeId}/{axisId}/v{version}/result.md
```

#### result.json Schema（概要）

```json
{
  "themeId": "string",
  "axisId": "string",
  "version": 1,
  "providers": [
    {
      "name": "AWS",
      "serviceName": "AWS Lambda",
      "summary": "string",
      "details": "string",
      "sources": ["https://..."]
    }
  ],
  "comparedAt": "2026-07-04T00:00:00Z",
  "comparedBy": "string"
}
```

## Relationships

```text
ComparisonMetadata (1) ──── references ────→ ComparisonData (1..N versions)
  PK: themeId                                  Key: comparisons/{themeId}/{axisId}/v{version}/
  SK: axisId
  version: N                                   → Latest version in S3
```

## Validation Rules

- `themeId`: 英小文字・ハイフンのみ、1〜64文字。
  先頭と末尾はハイフン不可、ハイフン連続（`--`）は不可
- `axisId`: 英小文字・ハイフンのみ、1〜64文字。
  先頭と末尾はハイフン不可、ハイフン連続（`--`）は不可
- `status`: `draft` | `published` | `archived` のいずれか
- `version`: 1 以上の整数、単調増加。
  採番ルール: 現在の DynamoDB レコードの `version` 値 + 1。
  書き込み失敗による欠番は許容する
- `updatedAt` / `createdAt`: ISO 8601 形式（UTC）

## Concurrency Control

同一 `themeId` + `axisId` に対する同時書き込みは、
DynamoDB の条件付き書き込み（ConditionExpression）で排他制御する。

- 書き込み時: `attribute_exists(themeId) AND version = :expectedVersion`
- 条件不一致の場合は `ConditionalCheckFailedException` を返し、
  呼び出し側がリトライまたはエラーとして処理する

## Write Order & Consistency

DynamoDB と S3 間のトランザクション整合性は保証されないため、
以下の書き込み順序を遵守する。

1. DynamoDB にメタデータを書き込み（version をインクリメント、status=draft）
2. S3 に比較結果データを書き込み
3. 成功後、DynamoDB のステータスを更新（draft → published は人間レビュー後）

S3 書き込み失敗時は、DynamoDB の当該レコードを削除または
version をデクリメントし、孤立データを防止する。
