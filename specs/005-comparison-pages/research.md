# Research: 比較結果ページの本実装

**Date**: 2026-07-05

## 1. ISR（Incremental Static Regeneration）の実装方式

**Decision**: Next.js App Router の `revalidate` オプションを使用し、
1 時間（3600 秒）ごとにページを再生成する。

**Rationale**:

- App Router では `export const revalidate = 3600` をページに設定するだけで ISR が有効化される
- Amplify Hosting は Next.js の ISR をネイティブサポートしている
- 月数件の更新頻度に対して 1 時間は十分な鮮度
- キャッシュ無効化 API を呼ばなくても自動的に再生成される

**Alternatives considered**:

- On-demand Revalidation（`revalidatePath`）→ S3 へのデータ同期時にトリガーが必要で初期フェーズでは複雑
- SSR のみ（キャッシュなし）→ 毎回 DynamoDB/S3 にアクセスするためレイテンシが増加
- SSG（Static Generation）→ ビルド時に全ページ生成が必要、テーマ追加時に再ビルド

## 2. プロバイダーフィルタの実装方式

**Decision**: Client Component + URL クエリパラメータで実装する。

**Rationale**:

- フィルタは即座に UI に反映する必要があり、Client Component が適切
- URL クエリパラメータ（`?providers=AWS,GCP`）に状態を保持することで
  URL 共有による再現が可能（FR-009）
- Next.js の `useSearchParams` + `useRouter` で実装
- Server Component（テーブル本体）はフィルタ結果を props で受け取る

**Alternatives considered**:

- Server-side フィルタ（URL パスで切り替え）→ フィルタ変更のたびにサーバーリクエストが発生
- localStorage のみ→ URL 共有で再現できない
- 状態管理ライブラリ（Zustand 等）→ URL 同期が追加実装必要、オーバースペック

## 3. 比較テーブルのレスポンシブ対応

**Decision**: デスクトップはテーブルレイアウト、モバイルは横スクロールで対応する。

**Rationale**:

- プロバイダーが列のテーブルは横幅が広くなるためモバイルでは収まらない
- `overflow-x-auto` で横スクロール可能にする（Tailwind CSS）
- テーブルの最小幅を設定し、列が潰れないようにする
- スクロールインジケーター（影やフェード）で横スクロール可能なことを示す

**Alternatives considered**:

- モバイルではカード型表示に切り替え → 実装コスト高く、情報の一覧性が低下
- プロバイダー 2 社ずつのタブ切り替え → 比較しにくい

## 4. ページネーション方式

**Decision**: ページ番号ベースのページネーション（12 件/ページ）。

**Rationale**:

- テーマ数が数十件規模では無限スクロールはオーバースペック
- ページ番号ベースは URL に `?page=2` として共有可能
- DynamoDB Query の Limit + ExclusiveStartKey で効率的に取得可能
- SEO 的にも各ページが独立した URL を持つ方が有利

**Alternatives considered**:

- 無限スクロール → SEO 不利、実装が複雑
- Load More ボタン → ページ共有が困難

## 5. SEO メタデータの方針

**Decision**: 各ページに動的な title / description を設定する。

**Rationale**:

- Next.js App Router の `generateMetadata` 関数でページごとに動的生成
- トップページ: 「cloud-rosetta - クラウドサービス比較」
- テーマ一覧: 「{テーマ名} の比較 | cloud-rosetta」
- 比較結果: 「{テーマ名} - {軸名} | cloud-rosetta」
- OGP（Open Graph Protocol）は将来フェーズとする

**Alternatives considered**:

- 静的メタデータのみ → 各ページの内容を反映できない
- SEO プラグイン → Next.js 組み込みの generateMetadata で十分
