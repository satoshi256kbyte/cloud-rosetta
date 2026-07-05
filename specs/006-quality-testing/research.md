# Research: 品質・テスト基盤の強化

**Date**: 2026-07-05

## 1. E2E テストのモック方式

**Decision**: Next.js の `next/navigation` モックと
Playwright の `page.route()` で API レスポンスをインターセプトする。

**Rationale**:

- `page.route()` で fetch リクエストをインターセプトし固定 JSON を返す
- AWS SDK の呼び出し自体をモックせず、HTTP レベルでインターセプト
- テストデータは `e2e/fixtures/test-data.ts` に集約
- CI で AWS 認証情報が不要になり、テストが安定する

**Alternatives considered**:

- MSW（Mock Service Worker）→ Playwright との統合が複雑
- 環境変数で切り替え → 本番コードにテスト用分岐が入る
- LocalStack → CI のセットアップが重い

## 2. プロパティベーステストライブラリ

**Decision**: fast-check を使用する。

**Rationale**:

- Vitest とネイティブ統合（`@fast-check/vitest` パッケージ）
- TypeScript ファーストで型安全な Arbitrary 定義が可能
- 活発にメンテナンスされている（2024-2026 年も継続的リリース）
- 学習コストが低く、既存 describe/it 構文に自然に組み込める

**Alternatives considered**:

- jsverify → メンテナンスが停滞
- hypothesis（Python）→ 言語が異なる

## 3. Lighthouse CI の実行方式

**Decision**: `@lhci/cli` を GitHub Actions で実行し、
アクセシビリティスコアのみをゲートとする。

**Rationale**:

- パフォーマンススコアは CI 環境で揺れやすいためゲートに含めない
- アクセシビリティは環境に依存せず安定（SC-004: 90 以上）
- `lhci autorun` で headless Chrome を使用
- 結果は CI アーティファクトとして HTML レポートを保存

**Alternatives considered**:

- pa11y → Lighthouse ほど包括的でない
- axe-core 単体 → Playwright テスト内に組み込む案もあるが、
  Lighthouse CI の方がスコアとして明確

## 4. E2E テストの並列実行

**Decision**: Playwright の `workers` 設定でテストを並列実行する。

**Rationale**:

- Playwright はデフォルトでワーカーベースの並列実行をサポート
- CI では `workers: 2`（GitHub Actions の 2vCPU に合わせる）
- ローカルでは `workers: '50%'`（CPU コア数の半分）
- テスト間でステートを共有しない設計にする

**Alternatives considered**:

- シリアル実行 → 3 分以内に収まらない可能性
- シャーディング（複数ジョブ分割）→ 初期フェーズではオーバースペック
