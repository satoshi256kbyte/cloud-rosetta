# Security Requirements Quality Checklist: 基盤インフラ

**Purpose**: 仕様に含まれるべきセキュリティ要件の品質・完全性を検証する

**Created**: 2026-07-04

**Feature**: [spec.md](../spec.md)

**Depth**: Standard（IAM・暗号化・OIDC・データ保護・監査ログ + リカバリ）

**Audience**: 仕様レビュー段階での品質確認

## Requirement Completeness

- [x] CHK001 - S3 バケットの暗号化方式（SSE-S3 / SSE-KMS）の選定理由は文書化されているか？
  [Completeness, Spec §FR-004]
- [x] CHK002 - DynamoDB テーブルの暗号化要件は明記されているか？
  （デフォルト暗号化 or CMK 指定）[Completeness, Spec §FR-011]
- [x] CHK003 - S3 バケットのバージョニング有効化要件は定義されているか？
  [Completeness, Spec §FR-013]
- [x] CHK004 - IAM ポリシーの最小権限原則に関する要件は文書化されているか？
  [Completeness, Spec §FR-014]
- [x] CHK005 - CloudTrail / S3 アクセスログの有効化要件は定義されているか？
  [Completeness, Spec §FR-015]
- [x] CHK006 - GitHub Actions OIDC ロールの権限スコープ（どのリソースに何を許可するか）は
  仕様に明記されているか？[Completeness, Spec §Assumptions]

## Requirement Clarity

- [x] CHK007 - 「SSE-S3 以上の暗号化」の「以上」が具体的に何を指すか明確か？
  （SSE-S3 / SSE-KMS / DSSE-KMS のどれまで許容するか）[Clarity, Spec §FR-004]
- [x] CHK008 - 「パブリックアクセスをブロック」の具体的な設定内容
  （Block Public Access の4項目すべてか）は明確か？[Clarity, Spec §FR-012]
- [x] CHK009 - cdk-nag の抑制ルールを設定する際の承認プロセスは定義されているか？
  [Clarity, Spec §FR-016]
- [ ] CHK010 - 「サーバーレス・マネージドサービスのみ」のセキュリティ上の境界
  （共有責任モデルの範囲）は明確か？[Clarity, Spec §FR-010]

## Requirement Consistency

- [ ] CHK011 - DynamoDB のポイントインタイムリカバリ要件と、
  S3 のデータ保護要件（バージョニング / レプリケーション）の保護レベルは一貫しているか？
  [Consistency, Spec §FR-005]
- [ ] CHK012 - CI（AWS認証不要）と CD（OIDC認証あり）で、
  セキュリティ境界の分離方針は一貫して記述されているか？
  [Consistency, contracts/cdk-stacks.md]
- [ ] CHK013 - dev 環境の Express mode（ロールバック無効）のリスクと、
  データ保護要件（PITR）の方針は矛盾していないか？
  [Consistency, Spec §FR-009 vs §FR-005]

## Acceptance Criteria Quality

- [ ] CHK014 - 「cdk-nag チェックが 0 件の未対処エラーでパス」の定義に、
  抑制ルールの上限や監査要件は含まれているか？[Measurability, Spec §SC-002]
- [ ] CHK015 - セキュリティ要件に対する成功基準（合格条件）は
  客観的に計測可能な形で記述されているか？[Measurability, Gap]

## Scenario Coverage

- [ ] CHK016 - OIDC トークンの有効期限切れ・失効時の要件は定義されているか？
  [Coverage, Edge Case]
- [x] CHK017 - S3 バケット名のグローバル衝突時に作成されるバケット
  （アカウントID付き）にも同じセキュリティ要件が適用される旨が明記されているか？
  [Coverage, Spec §Edge Cases]
- [x] CHK018 - CDK デプロイが途中で失敗した場合に、
  中間状態のリソースがセキュリティ要件を満たす（暗号化有効・パブリックアクセスなし）ことは
  保証されているか？[Coverage, Spec §Edge Cases]

## Edge Case & Recovery Coverage

- [x] CHK019 - CloudFormation スタックのロールバック時に、
  DynamoDB のデータ損失が発生しないための保護要件は定義されているか？
  [Edge Case, Recovery, Spec §Edge Cases]
- [x] CHK020 - S3 バケットの削除保護（Deletion Policy）に関する要件は
  環境ごとに明記されているか？（dev: DESTROY 可 / prod: RETAIN）
  [Completeness, Spec §FR-017]
- [ ] CHK021 - GitHub Secrets（OIDC ロール ARN）のローテーション・更新手順に
  関する要件は定義されているか？[Gap, Recovery]

## Dependencies & Assumptions

- [x] CHK022 - 「OIDC IAM ロールは作成済み」という前提の
  権限スコープ・信頼ポリシーの内容は仕様から参照可能か？
  [Assumption, Spec §Assumptions]
- [x] CHK023 - CDK Bootstrap で作成される IAM ロール・S3 バケットの
  セキュリティ設定に関する前提条件は文書化されているか？
  [Dependency, Spec §Assumptions]

## Notes

- constitution 原則IV（サーバーレス優先）により VPC セキュリティは対象外
- constitution 原則V（品質の自動保証）により cdk-nag は自動実行される前提
- 初期フェーズは社内向け（100人）のため、WAF/DDoS対策は対象外
