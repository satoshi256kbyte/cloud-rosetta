# scripts/agent/

AIエージェント比較自動実行のスクリプト群。

## フロー

```text
Issue (approved ラベル)
  → GitHub Actions (agent.yml)
    → parse-issue.ts: Issue 本文パース + バリデーション
    → run-workflow.ts: Step Functions 起動 + 完了待ち
      → Step Functions → AgentCore InvokeHarness
    → create-pr.ts: 結果コミット + PR 作成
    → handle-error.ts: エラー時のラベル復帰 + コメント
```

## ファイル構成

| ファイル | 役割 |
|---------|------|
| `run-workflow.ts` | メイン: パース → SFn起動 → 完了待ち → 結果保存 |
| `parse-issue.ts` | Issue 本文から themeId/axisId/providers を抽出 |
| `update-labels.ts` | Issue ラベル操作 + エラーコメント投稿 |
| `create-pr.ts` | feature ブランチ作成 → コミット → PR 作成 |
| `handle-error.ts` | ワークフロー失敗時のクリーンアップ |
| `prompts/comparison.txt` | エージェントのシステムプロンプト |

## ローカル実行

```bash
cd scripts/agent
npm install

# 型チェック
npx tsc --noEmit

# テスト
npx vitest run
```

## プロンプト編集

`prompts/comparison.txt` を編集し、PR でレビューを受けてください。
プロンプトの変更はエージェントの出力品質に直接影響します。

## 環境変数

| 変数 | 説明 | 設定場所 |
|------|------|---------|
| GITHUB_TOKEN | GitHub API トークン | Actions 自動 |
| AWS_ROLE_ARN | OIDC IAM ロール | Secrets |
| AWS_REGION | ap-northeast-1 | Variables |
| STATE_MACHINE_ARN | Step Functions ARN | Variables |
| ISSUE_NUMBER | Issue 番号 | Actions 自動 |
| ISSUE_BODY | Issue 本文 | Actions 自動 |
