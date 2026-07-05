# Data Model: AIエージェント比較自動実行

**Date**: 2026-07-05

## Overview

本フェーズで新規テーブル・バケットは作成しない。
エージェントが出力する比較結果は 002-content-management で定義済みの
`result.json` スキーマに準拠する。

データストア設計の詳細は `specs/001-foundation-infra/data-model.md`、
`result.json` スキーマの詳細は `specs/002-content-management/data-model.md` を参照。

## エージェント入力（Issue 本文パース結果）

GitHub Issue テンプレートの本文から抽出するパラメータ。

```typescript
interface AgentInput {
  /** 比較テーマ ID（例: "serverless-compute"） */
  themeId: string;
  /** 比較軸 ID（例: "cold-start"） */
  axisId: string;
  /** 比較対象プロバイダー名の配列（2〜5社） */
  providers: string[];
  /** 元の Issue 番号 */
  issueNumber: number;
}
```

バリデーションルール:

- `themeId`: `/^[a-z][a-z0-9-]{0,62}[a-z0-9]$/`
- `axisId`: `/^[a-z][a-z0-9-]{0,62}[a-z0-9]$/`
- `providers`: 要素数 2〜5、各要素は非空文字列

## エージェント出力（result.json）

002-content-management の `result.json` Schema に準拠する。
エージェントが `comparedBy` に設定する値は `"ai-agent"` 固定。

```json
{
  "themeId": "serverless-compute",
  "axisId": "cold-start",
  "providers": [
    {
      "name": "AWS",
      "serviceName": "AWS Lambda",
      "summary": "比較サマリーテキスト",
      "details": "詳細説明（省略可）",
      "sources": ["https://docs.aws.amazon.com/..."]
    }
  ],
  "comparedAt": "2026-07-05T12:00:00Z",
  "comparedBy": "ai-agent"
}
```

## Issue ラベル状態遷移（本フェーズが管理する遷移）

```text
proposed → [管理者が approved 付与] → in-progress → [成功] → review
                                                  → [失敗] → proposed
```

本フェーズのワークフローが操作するのは以下の遷移:

- `approved` → `in-progress`（ワークフロー起動時）
- `in-progress` → `review`（PR 作成成功時）
- `in-progress` → `proposed`（エラー発生時）

## エラーコメントフォーマット

エラー時に Issue に投稿するコメントの構造:

```markdown
## ⚠️ エージェント実行エラー

**エラー種別**: {TIMEOUT | API_ERROR | VALIDATION_ERROR | DUPLICATE_PR}
**失敗段階**: {INPUT_PARSE | AGENT_INVOKE | RESULT_VALIDATE | PR_CREATE}
**詳細**: {エラーメッセージ}
**タイムスタンプ**: {ISO 8601}

---
ラベルを `proposed` に戻しました。修正後に再度 `approved` を付与してください。
```
