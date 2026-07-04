# comparisons/

比較結果データの格納ディレクトリ。

## ディレクトリ構成

```text
comparisons/
└── {themeId}/
    └── {axisId}/
        └── result.json
```

## result.json の作成手順

1. 比較テーマの Issue が `approved` ラベルになっていることを確認
1. ブランチを作成する
1. `comparisons/{themeId}/{axisId}/result.json` を作成する
1. JSON Schema バリデーションをローカルで確認する:
   `cd scripts/validate && npx tsx validate.ts`
1. PR を作成する（テンプレートに従って記入）
1. レビュー・マージ後、自動的に S3/DynamoDB に同期される

## themeId / axisId のルール

- 英小文字・数字・ハイフンのみ
- 2〜64文字
- 先頭・末尾はハイフン不可
- ハイフン連続（`--`）不可
- 例: `serverless-compute`, `cold-start-latency`

## JSON Schema

スキーマ定義: `scripts/validate/schema.json`

必須フィールド:

- `themeId` — テーマ識別子
- `axisId` — 比較軸識別子
- `providers` — 比較対象（2つ以上）
- `comparedAt` — 比較日時（ISO 8601 UTC）
- `comparedBy` — 比較者
