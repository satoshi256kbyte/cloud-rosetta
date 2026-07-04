# Data Model: 比較結果コンテンツ管理

**Date**: 2026-07-04

## Overview

本フェーズで扱うデータモデルは 001-foundation-infra で定義済みの
ComparisonMetadata（DynamoDB）と ComparisonData（S3）をそのまま使用する。
追加のテーブル・バケットは作成しない。

データモデルの詳細は `specs/001-foundation-infra/data-model.md` を参照。

## リポジトリ内データ構造

PR レビュー用にリポジトリ内に比較結果を配置する。

```text
comparisons/
└── {themeId}/
    └── {axisId}/
        ├── result.json     # 構造化データ（スキーマバリデーション対象）
        └── result.md       # 人間可読版（同期時に生成 or 手動作成）
```

## result.json Schema（概要）

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["themeId", "axisId", "providers", "comparedAt", "comparedBy"],
  "properties": {
    "themeId": { "type": "string", "pattern": "^[a-z][a-z0-9-]{0,62}[a-z0-9]$" },
    "axisId": { "type": "string", "pattern": "^[a-z][a-z0-9-]{0,62}[a-z0-9]$" },
    "providers": {
      "type": "array",
      "minItems": 2,
      "items": {
        "type": "object",
        "required": ["name", "serviceName", "summary", "sources"],
        "properties": {
          "name": { "type": "string" },
          "serviceName": { "type": "string" },
          "summary": { "type": "string" },
          "details": { "type": "string" },
          "sources": {
            "type": "array",
            "minItems": 1,
            "items": { "type": "string", "format": "uri" }
          }
        }
      }
    },
    "comparedAt": { "type": "string", "format": "date-time" },
    "comparedBy": { "type": "string" }
  }
}
```

## 状態遷移（Issue ラベル）

```text
proposed → approved → in-progress → review → done
```

- `proposed`: Issue 作成時（デフォルト）
- `approved`: 管理者が着手承認
- `in-progress`: 比較作業中（PR 作成前）
- `review`: PR が作成されレビュー中
- `done`: マージ完了・同期済み
