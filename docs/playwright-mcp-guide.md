# Playwright MCP 操作ガイド

AI エージェントや開発者が Playwright MCP を使って
フロントエンドの画面操作を行い、結果を目視確認する手順。

## 概要

Playwright MCP は、AI エージェント（Kiro CLI / Claude Code 等）が
ブラウザを操作し、画面の状態をスナップショットとして取得するための
MCP（Model Context Protocol）ツールです。

用途:

- デプロイ後の画面確認
- AI エージェントが生成した比較結果の表示確認
- デモ・レビュー用の操作記録

## セットアップ

Playwright MCP は Kiro CLI に組み込まれています。
追加のインストールは不要です。

## 操作例

### テーマ一覧ページの確認

```
1. browser_navigate: http://localhost:3000
2. browser_snapshot: ページ全体のアクセシビリティツリーを取得
3. browser_take_screenshot: 画面キャプチャ
4. browser_click: テーマカードをクリック
5. browser_snapshot: 遷移先の確認
```

### 比較テーブルページの確認

```
1. browser_navigate: http://localhost:3000/comparisons/{themeId}/{axisId}
2. browser_snapshot: テーブル構造の確認
3. browser_take_screenshot: テーブル全体のキャプチャ
4. browser_click: 参照元リンクの確認（target="_blank"）
```

### プロバイダーフィルタの操作確認

```
1. browser_navigate: http://localhost:3000/comparisons/{themeId}/{axisId}
2. browser_snapshot: フィルタ UI の確認
3. browser_click: プロバイダーボタンをクリック
4. browser_snapshot: フィルタ適用後のテーブル確認
5. URL にクエリパラメータが反映されていることを確認
```

### モバイル表示の確認

```
1. browser_resize: width=375, height=667
2. browser_navigate: http://localhost:3000/comparisons/{themeId}/{axisId}
3. browser_snapshot: モバイルレイアウトの確認
4. browser_take_screenshot: モバイル表示のキャプチャ
```

## AI エージェントからの利用パターン

### パターン1: デプロイ後の自動確認

AI エージェントがデプロイ後に自動的に主要ページを巡回し、
表示崩れがないか確認する。

```text
手順:
1. トップページにアクセスし snapshot を取得
2. テーマカードが表示されていることを確認
3. 比較テーブルページに遷移
4. テーブルにプロバイダー列が表示されていることを確認
5. 結果を人間に報告（スクリーンショット付き）
```

### パターン2: 比較結果 PR のレビュー支援

AI エージェントが PR で追加された比較結果を実際に画面で表示し、
レビュアーが確認しやすい形で報告する。

```text
手順:
1. PR のブランチをチェックアウトし dev サーバーを起動
2. 追加された比較結果のページにアクセス
3. テーブルの表示内容をスクリーンショットで記録
4. 参照元リンクが正しいことを確認
5. PR コメントにスクリーンショットを添付
```

## 注意事項

- Playwright MCP はヘッドレスブラウザで動作するため、
  実際のブラウザウィンドウは表示されません
- `browser_snapshot` はアクセシビリティツリーを返すため、
  視覚的な確認には `browser_take_screenshot` を使用してください
- 開発サーバー（`npm run dev`）が起動している必要があります
- 本番環境の URL に対しても操作可能ですが、
  書き込み操作は行わないよう注意してください
