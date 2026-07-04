# Spec Kit セットアップ手順（Kiro CLI版）

## 概要

cloud-rosettaでは、[GitHub Spec Kit](https://github.com/github/spec-kit)による仕様駆動開発のメインAIエージェントとして
[Kiro CLI](https://kiro.dev/docs/cli/)を使用します。本ドキュメントは、このリポジトリで実施したセットアップ手順と、
新しく開発環境を用意するメンバー向けの再現手順をまとめたものです。

## 前提ツール

- [Homebrew](https://brew.sh/)
- [uv](https://docs.astral.sh/uv/)（`specify-cli`の実行に使用）
- Kiro CLI

## インストール手順

### 1. Kiro CLIのインストール

```bash
brew install --cask kiro-cli
```

インストール後、以下でエージェントの起動を確認します。

```bash
kiro-cli --version
```

### 2. specify-cli（Spec Kit CLI）のインストール

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@v0.12.4
```

バージョンは[Releases](https://github.com/github/spec-kit/releases)を確認し、必要に応じて最新版に読み替えてください。

## このリポジトリでのSpec Kit初期化

このリポジトリでは、最初にClaude Code統合でSpec Kitを初期化した後、Kiro CLI統合に切り替えました。

```bash
# 最初の初期化（Claude Code統合）
specify init --here --integration claude --force

# メインAIエージェントをKiro CLIに切り替え
specify integration switch kiro-cli
```

新しく別のリポジトリでセットアップする場合は、最初からKiro CLI統合で初期化して構いません。

```bash
specify init --here --integration kiro-cli --force
```

切り替え・初期化後は、以下のコマンドで状態を確認できます。

```bash
specify integration status
```

## セットアップ後のファイル構成

```text
.kiro/prompts/speckit.constitution.md   # プロジェクト原則の確立
.kiro/prompts/speckit.specify.md        # 機能仕様の作成
.kiro/prompts/speckit.clarify.md        # 仕様の曖昧さの整理（任意）
.kiro/prompts/speckit.plan.md           # 実装計画の作成
.kiro/prompts/speckit.checklist.md      # 品質チェックリスト生成（任意）
.kiro/prompts/speckit.tasks.md          # タスク分解
.kiro/prompts/speckit.analyze.md        # 仕様・計画・タスクの整合性確認（任意）
.kiro/prompts/speckit.implement.md      # 実装の実行
.kiro/prompts/speckit.converge.md       # 未実装分の洗い出し
.kiro/prompts/speckit.taskstoissues.md  # タスクのGitHub Issue化
.specify/memory/constitution.md         # プロジェクト原則（AIエージェント共通）
.specify/templates/                     # spec/plan/tasks等のテンプレート
.specify/scripts/                       # 各コマンドが利用するスクリプト
```

`.specify/`配下はAIエージェントに依存しない共通基盤です。統合を切り替えても内容は保持されます。

## Kiro CLIでの使い方

プロジェクトルートでKiro CLIのチャットを起動します。

```bash
kiro-cli chat
```

チャット内で、`.kiro/prompts/`に置かれたプロンプトを`@`に続けてプロンプト名（拡張子なし）を入力して呼び出します。

```text
@speckit.constitution
@speckit.specify
@speckit.plan
@speckit.tasks
@speckit.implement
```

実行順序・各コマンドの役割・cloud-rosettaでの機能単位への分割方針は
[spec-kit-plan.md](spec-kit-plan.md)を参照してください。

## 注意点

- `kiro-cli`統合は「Multi-install Safe: no」のため、他のAIエージェント統合（Claude Codeなど）と同時にはインストールできません。
  別のAIエージェントに切り替えたい場合は`specify integration switch <統合キー>`を使います。
- `.claude/settings.local.json`など、AIエージェントのローカル設定ファイルは`.gitignore`で除外しています。
  認証情報や個人設定を含む場合があるため、コミット対象に含めないよう注意してください。
