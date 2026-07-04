# cloud-rosetta Spec Kit 投入計画

## 概要

このドキュメントは、[GitHub Spec Kit](https://github.com/github/spec-kit)を使って
cloud-rosettaを仕様駆動開発（Spec-Driven Development）で進める際に、どういう単位で・どういう順序で
仕様を投入するかをまとめたものです。

Spec Kitのセットアップは完了しており、`.kiro/prompts/speckit.*.md`にKiro CLI向けのプロンプトが、
`.specify/`にテンプレート・スクリプトが配置されています。セットアップ手順の詳細は
[spec-kit-setup.md](spec-kit-setup.md)を参照してください。

## Spec Kitのコマンドフロー（おさらい）

1つの仕様は、以下のコマンドを順に実行して進めます。

| 順序 | コマンド | 役割 |
|------|---------|------|
| 1 | `/speckit-constitution` | プロジェクト原則を確立する（プロジェクトで1回） |
| 2 | `/speckit-specify` | 機能仕様（何を・なぜ作るか）を定義する |
| 3 | `/speckit-clarify`（任意） | 仕様の曖昧な部分を計画前に整理する |
| 4 | `/speckit-plan` | 技術スタック・実装方針を計画する |
| 5 | `/speckit-checklist`（任意） | 要件の網羅性・明確さをチェックリストで検証する |
| 6 | `/speckit-tasks` | 実行可能なタスクに分解する |
| 7 | `/speckit-analyze`（任意） | 仕様・計画・タスク間の整合性を確認する |
| 8 | `/speckit-implement` | タスクを実行し実装する |

`/speckit-constitution`はプロジェクトに対して最初に1回実行し、以降は`/speckit-specify`以降の
サイクルを機能単位で繰り返します。

## 単位の考え方（何を1つの仕様にするか）

1つの`/speckit-specify`は、以下を満たす単位にします。

- それ単体でデプロイ・動作確認ができる（歩くスケルトンとして積み上げられる）
- 依存する前段の仕様が実装済みである（想像のインフラの上に機能を作らない）
- 「プロダクト全体」のような大きすぎる単位にしない
- 単一のCRUDエンドポイントのような、小さすぎて単体で価値検証できない単位にもしない

この基準で、[product-overview.md](product-overview.md)と[tech-stack.md](tech-stack.md)の内容を
以下のフェーズに分割します。

## 投入順序

### フェーズ0: Constitution（プロジェクト原則）

`/speckit-specify`より前に、`/speckit-constitution`でプロジェクト全体の原則を確立します。
[tech-stack.md](tech-stack.md)の「技術選定の方針」「AWSリソースの命名規約」「品質保証」を踏まえ、
以下を原則として盛り込むことを想定しています。

- 言語はTypeScriptを使う
- AWSリソースは命名規約（`{サービス名}-{ステージ名}-{リソース種類}-{用途}`）に従う
- CDKスタックにはcdk-nagを必須で適用する
- Lint・Format・ユニットテスト・プロパティベーステスト・E2E（Playwright）を徹底する
- AIエージェントによる画面操作・確認は、Playwright MCP・Chrome DevTools MCPで人が目視できる形にする
- AWSサービスの調査はAWS Knowledge MCP Serverを使い、公式情報を根拠に判断する
- CDKスタック名・リソースの物理名にランダムな文字列を使わない

### フェーズ1: 基盤インフラ

CDKプロジェクトの雛形、命名規約の適用、cdk-nagの導入、東京リージョンの設定、
Lint・Format・ユニットテストを回すGitHub Actionsの基盤を作ります。
まだアプリケーション機能はありませんが、以降のすべての仕様がこの上に乗ります。

### フェーズ2: 比較データストア

比較結果を保存するAmazon S3バケットと、メタデータを管理するAmazon DynamoDBテーブルを
CDKスタックとして構築します。テーブル設計・命名規約の適用範囲はここで確定させます。

### フェーズ3: フロントエンドの歩くスケルトン

Next.jsアプリをAWS Amplify Hostingへデプロイするパイプラインを確立し、
フェーズ2のS3・DynamoDBからダミーデータを読み込んでSSRで一覧表示する最小画面を作ります。
インフラからフロントエンドまでが一本通ることを、この時点で確認します。

### フェーズ4: 比較提案ワークフロー（Issue駆動）

比較テーマ・比較軸をGitHub Issueで提案するテンプレート、着手用タグ付けをトリガーに
GitHub Actionsが起動する仕組み、Pull Requestマージ時にS3・DynamoDBへ同期する処理を実装します。
この段階ではAIエージェントを使わず、人間が比較結果のMarkdownを書いてPull Requestを出す運用でも構いません。
公開までの一連のフロー（Issue提案 → レビュー → タグ付け → 起動 → PR → レビュー → マージ → 公開）を
先に完成させることを優先します。

### フェーズ5: AI比較エージェント

Amazon Bedrock AgentCoreを使い、公式サイト・エンジニアブログのWeb検索、
AWSサービス比較時はAWS Knowledge MCP Serverを用いて比較を実行し、
比較結果のMarkdownをPull Requestとして自動作成するエージェントを実装します。
フェーズ4で確立したワークフローに、人間の代わりに接続する形になります。

### フェーズ6: 比較結果ページの本実装

フェーズ3のダミー表示を、実際の比較データ・UI（比較表、比較テーマ一覧、フィルタなど）として磨き込みます。

### フェーズ7: 品質・テスト基盤の強化

プロパティベーステスト・Playwrightを用いたE2Eテストの整備、CIチェックの強化など、
[tech-stack.md](tech-stack.md)の品質保証方針を実運用レベルまで引き上げます。
また、Playwright MCP・Chrome DevTools MCPによる画面操作の目視確認手順もこの段階で整備します。

### フェーズ8: 将来フェーズ（未着手）

以下は[product-overview.md](product-overview.md)・[tech-stack.md](tech-stack.md)で未決定事項として
扱っている項目です。決まり次第、個別の仕様として投入します。

- 外部公開対応（認証方式の確定を含む）
- CDNの選定確定
- 比較テーマ・比較軸の運用ルール詳細化

## 各フェーズの依存関係

```text
フェーズ0（Constitution）
  └─ フェーズ1（基盤インフラ）
       └─ フェーズ2（データストア）
            └─ フェーズ3（フロントエンドの歩くスケルトン）
                 └─ フェーズ4（比較提案ワークフロー）
                      └─ フェーズ5（AI比較エージェント）
                 └─ フェーズ6（比較結果ページの本実装）
       └─ フェーズ7（品質・テスト基盤の強化、フェーズ1以降いつでも着手可）
フェーズ8（将来フェーズ、未決定事項が確定してから着手）
```

フェーズ6とフェーズ7は、それぞれフェーズ3・フェーズ1が完了していれば並行して進められます。

## 運用ルール

- 1フェーズ = 1つの`specs/NNN-feature-name/`ディレクトリとして`/speckit-specify`から開始します。
- 各フェーズの`/speckit-plan`では、[tech-stack.md](tech-stack.md)の内容を技術的前提として参照します。
- 仕様・計画・タスクの内容が[product-overview.md](product-overview.md)・[tech-stack.md](tech-stack.md)と
  矛盾する場合は、まずこの2つのドキュメントを更新してから`/speckit-specify`または`/speckit-plan`を
  やり直します。
