# Feature Specification: AIエージェント比較自動実行

**Feature Branch**: `004-ai-agent`

**Created**: 2026-07-05

**Status**: Draft

**Input**: User description: "GitHub Issue のラベル `approved` をトリガーに、
AIエージェントが比較作業を実行し、比較結果を PR として自動作成する"

## User Scenarios & Testing

### User Story 1 - Issue ラベルによるエージェント起動 (Priority: P1)

管理者が比較テーマ Issue に `approved` ラベルを付与すると、
GitHub Actions が起動し、AIエージェントに比較作業を指示する。

**Why this priority**: ワークフロー全体の起点であり、
人間の判断（承認）からエージェント実行への橋渡しとなる自動化。

**Independent Test**: Issue に `approved` ラベルを付与し、
GitHub Actions ワークフローが起動することを確認する。

**Acceptance Scenarios**:

1. **Given** 比較テーマ Issue が `proposed` 状態で存在する,
   **When** 管理者が `approved` ラベルを付与する,
   **Then** エージェント起動ワークフローがトリガーされ、
   Issue のラベルが `in-progress` に変更される
2. **Given** エージェント起動ワークフローが実行される,
   **When** Issue の内容（テーマID、軸ID、プロバイダー）を読み取る,
   **Then** AIエージェントに必要なパラメータが正しく渡される
3. **Given** 既に `in-progress` のラベルが付いた Issue がある,
   **When** 再度 `approved` ラベルが付与される,
   **Then** 二重実行を防止し、ワークフローはスキップする

---

### User Story 2 - AIエージェントによる比較作業実行 (Priority: P2)

AIエージェントが公式ドキュメント・Web検索を参照し、
比較結果を JSON 形式で生成する。
AWSサービスの比較には AWS Knowledge MCP Server を活用する。

**Why this priority**: プロダクトの中核的価値であり、
人間の作業を自動化する最も重要な機能。

**Independent Test**: テスト用テーマ・軸を指定し、
エージェントが result.json を生成できることを確認する。

**Acceptance Scenarios**:

1. **Given** テーマID・軸ID・比較対象プロバイダーが指定されている,
   **When** AIエージェントが比較作業を実行する,
   **Then** data-model.md の JSON Schema に準拠した result.json が生成される
2. **Given** AWS サービスが比較対象に含まれる,
   **When** エージェントが情報収集する,
   **Then** AWS Knowledge MCP Server を使用して一次情報を取得する
3. **Given** AWS 以外のサービスが比較対象に含まれる,
   **When** エージェントが情報収集する,
   **Then** 各社公式ドキュメントを Web 検索で参照し、
   sources に公式 URL を含める
4. **Given** エージェントが比較作業中にエラーが発生する,
   **When** 情報取得に失敗する,
   **Then** エラー内容を Issue にコメントし、ラベルを `proposed` に戻す

---

### User Story 3 - 比較結果の PR 自動作成 (Priority: P3)

AIエージェントが生成した比較結果を、feature ブランチにコミットし、
Pull Request を自動作成する。PR は人間のレビューを待つ状態になる。

**Why this priority**: US2 で生成した結果を PR として提出し、
人間レビューフロー（constitution 原則II）に接続する最終ステップ。

**Independent Test**: エージェント実行後に PR が作成され、
CI（スキーマバリデーション）がパスすることを確認する。

**Acceptance Scenarios**:

1. **Given** AIエージェントが比較結果を生成済みである,
   **When** 結果をリポジトリにコミットする,
   **Then** `comparisons/{テーマID}/{軸ID}/result.json` に配置され、
   feature ブランチに push される
2. **Given** feature ブランチに push された,
   **When** PR が自動作成される,
   **Then** PR テンプレートに従い、関連 Issue 番号・テーマ・軸が記載される
3. **Given** PR が作成された,
   **When** CI が実行される,
   **Then** JSON スキーマバリデーションがパスする
4. **Given** PR が作成された,
   **When** Issue のラベルを確認する,
   **Then** `review` ラベルに変更されている

---

### Edge Cases

- AIエージェントの実行時間が長時間（10分超）になった場合のタイムアウト処理
- 比較対象プロバイダーの公式ドキュメントが一時的にアクセスできない場合のリトライ
- 同一テーマ・軸に対して既に PR が存在する場合の重複防止
- Issue テンプレートの入力内容が不正（テーマID のフォーマット違反等）の場合の事前バリデーション
- AgentCore の API レート制限やクォータ超過時のエラーハンドリング

## Requirements

### Functional Requirements

- **FR-001**: GitHub Actions ワークフロー（`agent.yml`）は、
  Issue への `approved` ラベル付与をトリガーに実行しなければならない（MUST）
- **FR-002**: ワークフロー起動時に Issue のラベルを `in-progress` に変更し、
  二重実行を防止しなければならない（MUST）
- **FR-003**: Issue 本文からテーマID・軸ID・比較対象プロバイダーを
  パースし、エージェントへのインプットとしなければならない（MUST）
- **FR-004**: AIエージェントは Amazon Bedrock を使用し、
  比較結果を JSON Schema 準拠の形式で生成しなければならない（MUST）
- **FR-005**: AWS サービスの比較では AWS Knowledge MCP Server を活用し、
  一次情報に基づく比較を行わなければならない（MUST）
- **FR-006**: AWS 以外のサービスでは Web 検索で各社公式ドキュメントを参照し、
  sources フィールドに公式 URL を含めなければならない（MUST）
- **FR-007**: 生成された比較結果は feature ブランチに commit & push し、
  PR を自動作成しなければならない（MUST）。PR には関連 Issue 番号を含める
- **FR-008**: PR 作成後、Issue のラベルを `review` に変更しなければならない（MUST）
- **FR-009**: エージェント実行中にエラーが発生した場合、
  Issue にエラー内容をコメントし、ラベルを `proposed` に戻さなければならない（MUST）
- **FR-010**: エージェント実行のタイムアウトは 15 分とし、
  超過した場合はエラーとして処理しなければならない（MUST）
- **FR-011**: AIエージェントの実行基盤は Amazon Bedrock AgentCore を使用し、
  GitHub Actions から API 経由で呼び出す構成としなければならない（MUST）

### Key Entities

- **agent.yml**: Issue ラベルトリガーの GitHub Actions ワークフロー
- **AIエージェント**: Bedrock AgentCore 上で動作する比較実行エージェント
- **比較結果（result.json）**: エージェントが生成する構造化データ
- **Feature Branch**: エージェントが結果をコミットするブランチ
- **Pull Request**: エージェントが自動作成する PR

## Success Criteria

### Measurable Outcomes

- **SC-001**: `approved` ラベル付与から PR 作成完了まで 15 分以内
- **SC-002**: 生成された result.json が JSON Schema バリデーションに 100% パスする
- **SC-003**: 生成された比較結果の sources に各プロバイダーの公式 URL が
  最低 1 つ含まれる
- **SC-004**: エラー発生時、Issue への通知が 1 分以内に行われる
- **SC-005**: 同一テーマ・軸に対する二重実行が 100% 防止される

## Assumptions

- Amazon Bedrock が ap-northeast-1 で利用可能であり、
  使用するモデル（Claude 等）のアクセス権限が設定済みである
- Amazon Bedrock AgentCore が GA（一般利用可能）であり、
  API 経由でエージェントを呼び出せる状態である
- GitHub Actions から Bedrock AgentCore へのアクセスは
  既存の OIDC IAM ロールに Bedrock 関連権限を追加して実現する
- AWS Knowledge MCP Server は Bedrock AgentCore のツールとして
  エージェントに組み込む
- Web 検索機能は Bedrock AgentCore のツール（Web Search tool）として利用する
- エージェントのプロンプト設計・チューニングは本フェーズのスコープに含む。
  ただし、精度改善の継続的な取り組みは後続フェーズとする
