# AgentCore Requirements Quality Checklist: AIエージェント比較自動実行

**Purpose**: Bedrock AgentCore の構成・モデル選定・ツール統合・プロンプト設計・
タイムアウト・クォータに関する要件の品質を評価する
**Created**: 2026-07-05
**Feature**: [spec.md](../spec.md)
**Depth**: Standard

## Requirement Completeness

- [ ] CHK001 - AgentCore エージェントの作成パラメータ（エージェント名、説明、
  アイドルタイムアウト等）は定義されているか [Completeness] [Spec §FR-011]
- [ ] CHK002 - NVIDIA Nemotron 3 Super 120B A12B のトークン制限（入力・出力）が
  定量的に記載されているか。比較1件あたりの想定トークン消費量は明示されているか
  [Completeness] [Spec §FR-004]
- [ ] CHK003 - AWS Knowledge MCP Server の対象ナレッジベース ID や
  データソース範囲は特定されているか [Completeness] [Spec §FR-005]
- [ ] CHK004 - Web 検索ツールの具体的な実装手段（Bedrock 組込み or 外部 API）と
  利用制約（レート制限、1回あたりの検索回数上限）は定義されているか
  [Completeness] [Spec §FR-006]

## Requirement Clarity

- [ ] CHK005 - 「多段階処理（情報収集 → 整理 → 構造化出力）」の各段階で
  エージェントが実行する具体的なアクションと期待出力は明確か [Clarity] [Spec §FR-011]
- [ ] CHK006 - 「品質不足時は Nova Pro 等にフォールバック可能」のフォールバック条件
  （何をもって品質不足と判断するか）は定量的に定義されているか
  [Clarity] [Spec §Clarifications]
- [ ] CHK007 - モデルを「環境変数で切り替え可能」とあるが、切り替え時にプロンプトや
  ツール構成の調整が必要かどうかの影響範囲は記載されているか
  [Clarity] [Spec §FR-004]

## Requirement Consistency

- [ ] CHK008 - Assumptions に「Claude 等のアクセス権限が設定済み」とあるが、
  実際のモデルは Nemotron と明記されている。前提条件とモデル選定の記述に
  矛盾はないか [Consistency] [Spec §Assumptions vs §FR-004]
- [ ] CHK009 - タイムアウト 15 分（FR-010）と SC-001 の「PR 作成完了まで 15 分以内」は
  整合しているか。エージェント実行以外の処理時間（ラベル変更、PR 作成）を含めると
  SC-001 を満たせない可能性は検討されているか [Consistency] [Spec §FR-010, §SC-001]

## Scenario Coverage

- [ ] CHK010 - プロンプトに含めるべきコンテキスト（テーマ定義、軸定義、
  既存比較データの参照有無）の仕様は網羅されているか [Coverage] [Spec §FR-004]
- [ ] CHK011 - エージェントが参照すべき情報が見つからない場合（ナレッジベースに
  該当データなし、Web 検索結果なし）の振る舞いは定義されているか
  [Coverage] [Spec §FR-005, §FR-006]
- [ ] CHK012 - IAM ロールに必要な Bedrock AgentCore 関連の権限
  （bedrock:InvokeAgent 等）の一覧は明示されているか [Coverage] [Spec §Assumptions]

## Edge Case Coverage

- [ ] CHK013 - AgentCore API のレート制限超過時のリトライ戦略（バックオフ間隔、
  最大リトライ回数）は定義されているか [Gap] [Spec §Edge Cases]
- [ ] CHK014 - エージェント実行中に AgentCore 側で障害が発生した場合（5xx エラー、
  タイムアウト）の検知方法と復旧手順は記載されているか [Gap] [Spec §Edge Cases]
- [ ] CHK015 - 月次クォータ（トークン消費量、API コール数）の上限監視と
  アラート閾値は定義されているか [Gap] [Spec §Constraints]
