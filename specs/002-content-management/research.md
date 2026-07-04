# Research: 比較結果コンテンツ管理

**Date**: 2026-07-04

**Purpose**: 同期ワークフロー・バリデーション・テンプレート設計の技術調査

## 1. GitHub Actions paths フィルタによる同期トリガー

**Decision**: `sync.yml` は `paths: ['comparisons/**']` フィルタで
比較結果ファイルの変更時のみ起動する

**Rationale**:

- CDK デプロイ（cd.yml）と完全に独立し、インフラ変更時に不要な同期が走らない
- `comparisons/` 配下の変更のみに反応するため、実行コストを最小化
- push + paths フィルタの組み合わせは GitHub Actions の標準パターン

**Alternatives considered**:

- workflow_run トリガー → cd.yml の成功に依存する不要な結合
- 全 push で起動し内部で判定 → ワークフロー起動コストが無駄

## 2. 同期スクリプトの実装言語

**Decision**: TypeScript（tsx で実行）

**Rationale**:

- プロジェクト全体が TypeScript で統一されている（constitution 技術スタック制約）
- AWS SDK v3 の TypeScript サポートが充実
- `infra/` の CDK コードと同じ言語でチーム学習コストが低い
- GitHub Actions 上で `npx tsx` により直接実行可能

**Alternatives considered**:

- Python → 言語統一の原則に反する
- Shell script → 複雑なエラーハンドリングが困難

## 3. JSON Schema バリデーション

**Decision**: ajv（JSON Schema validator）を使用し、
CI ワークフロー内でバリデーションを実行する

**Rationale**:

- ajv は最も広く使われる JSON Schema バリデータ（高速・仕様準拠）
- JSON Schema ファイルをリポジトリに管理することで、
  スキーマ変更もPRレビューの対象にできる
- CI で自動実行し、不正なデータの PR マージを防止する

**Alternatives considered**:

- zod → TypeScript 型との連携は良いが、JSON Schema 標準形式で管理できない
- 手動レビューのみ → スケールしない、人的エラーのリスク

## 4. 変更検出の方法

**Decision**: `git diff` で前回コミットとの差分から
`comparisons/` 配下の変更ファイルを検出する

**Rationale**:

- GitHub Actions では `${{ github.event.before }}` と `${{ github.sha }}` で
  差分を取得可能
- マージコミットの差分から変更されたテーマ・軸を特定できる
- 複数テーマ・軸の同時変更にも対応可能

**Alternatives considered**:

- 全 comparisons/ を毎回スキャン → 不要な書き込みが発生
- GitHub webhook payload の files_changed → PR テンプレート依存で不安定

## 5. IAM ポリシー設計

**Decision**: 既存の OIDC IAM ロールに S3 PutObject / DynamoDB PutItem の
インラインポリシーを追加する

**Rationale**:

- 既にデプロイ用の OIDC ロールが存在するため、
  同期に必要な最小権限を追加する方がシンプル
- CDK デプロイ権限と同期権限は同一ロールで管理（main ブランチ限定の信頼ポリシー）
- 権限分離が必要になった場合は後続で専用ロールに分離可能

**Alternatives considered**:

- 専用 IAM ロールを新規作成 → 現時点ではオーバースペック
- CDK で IAM ポリシーを管理 → 同期スクリプトは CDK 外のため複雑化

## 6. Issue テンプレート形式

**Decision**: YAML 形式の Issue テンプレート（`.github/ISSUE_TEMPLATE/comparison-theme.yml`）
を使用する

**Rationale**:

- YAML テンプレートは入力フォームを提供し、構造化されたデータを収集できる
- Markdown テンプレートより入力ミスが少ない
- テーマID、比較対象プロバイダー、比較軸をドロップダウン・テキスト入力で収集

**Alternatives considered**:

- Markdown テンプレート → 自由記述で構造化が困難
- GitHub Projects のカスタムフィールド → Issue 単体で完結しない
