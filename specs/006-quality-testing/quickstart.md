# Quickstart: 品質・テスト基盤の強化 検証ガイド

**Date**: 2026-07-05

## Prerequisites

- 005-comparison-pages が実装済み
- Node.js 22 がインストール済み
- `frontend/` で `npm install` 済み

## Validation Scenarios

### 1. E2E テストの実行

```bash
cd frontend
npx playwright install chromium
npm run test:e2e
```

**Expected**:

- テーマ一覧・比較テーブル・フィルタのテストが実行される
- HTML レポートが `frontend/playwright-report/` に生成される
- 全テストがパスする

### 2. プロパティベーステストの実行

```bash
cd scripts/agent
npm run test
```

**Expected**:

- 通常のユニットテストに加え、`.property.test.ts` が実行される
- ランダム入力に対して parse-issue のバリデーションが正しく動作する

### 3. スキーマバリデーションのプロパティベーステスト

```bash
cd scripts/validate
npm run test
```

**Expected**:

- ランダム JSON に対してスキーマ準拠/違反が正しく判定される

### 4. CI での全テスト実行

PR を作成し、GitHub Actions が実行されることを確認する。

**Expected**:

- E2E テスト・プロパティベーステスト・Lighthouse CI が実行される
- 結果がステータスチェックとして表示される
- テストレポートがアーティファクトとして保存される
- 全体で 5 分以内に完了する

### 5. Lighthouse CI アクセシビリティチェック

```bash
cd frontend
npm run build
npx lhci autorun
```

**Expected**:

- アクセシビリティスコアが 90 以上
- HTML レポートが生成される
