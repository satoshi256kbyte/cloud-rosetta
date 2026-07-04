# scripts/

比較結果のバリデーション・同期スクリプト。

## validate/

比較結果 JSON のスキーマバリデーション。CI で自動実行される。

```bash
cd scripts/validate
npm install
npx tsx validate.ts
```

- スキーマ定義: `schema.json`
- バリデーションルール: `validate.ts`
- テスト: `npx vitest run`

## sync/

S3/DynamoDB への同期スクリプト。main マージ時に `sync.yml` から呼び出される。

```bash
cd scripts/sync
npm install
# ローカル実行（AWS 認証情報が必要）
echo '[{"themeId":"test","axisId":"test"}]' | npx tsx sync-to-aws.ts
```

### モジュール構成

| ファイル | 役割 |
|---------|------|
| `index.ts` | エントリーポイント（detect → sync パイプライン） |
| `detect-changes.ts` | git diff で変更された比較結果を検出 |
| `sync-to-aws.ts` | DynamoDB/S3 への書き込み |
| `generate-markdown.ts` | result.json → result.md 変換 |

### テスト

```bash
cd scripts/sync
npx vitest run
```
