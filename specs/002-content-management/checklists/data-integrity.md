# Data Integrity Requirements Quality Checklist: 比較結果コンテンツ管理

**Purpose**: データ整合性要件の品質・完全性を検証する
**Created**: 2026-07-04
**Feature**: [spec.md](../spec.md)
**Depth**: Standard

## Requirement Completeness

- [ ] CHK001 - 書き込み順序の根拠は明示されているか [Clarity] [Spec §FR-007]
  - FR-007 は「DynamoDB → S3」の順序を規定しているが、
    なぜこの順序なのか（S3 失敗時のロールバック容易性等）の根拠が記述されているか
- [ ] CHK002 - DynamoDB ロールバックの具体的手順は定義されているか [Completeness] [Spec §FR-007]
  - S3 書き込み失敗時に「ステータスを draft に維持する」とあるが、
    DynamoDB レコードを削除するのか・更新前の値に戻すのか・書き込まないのかが曖昧
- [x] CHK003 - バージョン採番の同時実行制御は規定されているか [Gap] [Spec §FR-008]
  - version = max + 1 の採番で、複数ワークフローが並行実行された場合の
    ConditionExpression やリトライ戦略が要件として定義されているか
- [x] CHK004 - DynamoDB ConditionExpression の条件は明文化されているか [Completeness] [Spec §FR-008]
  - 楽観的ロックに使う条件（attribute_not_exists / version = :expected 等）が
    要件レベルで規定されているか、実装判断に委ねられているか
- [x] CHK005 - 同期ワークフローの冪等性要件は定義されているか [Gap] [Spec §FR-006]
  - GitHub Actions のリトライや手動再実行時に、
    同じ PR のマージで二重書き込みが発生しない保証が要件として記述されているか
- [ ] CHK006 - S3 の結果整合性に対する考慮は記載されているか [Coverage] [Spec §FR-007]
  - S3 書き込み直後の読み取りで最新データが返らない可能性への対処
    （読み取り側のリトライ、整合性モデルの前提）が要件に含まれているか
- [ ] CHK007 - 孤立データの検知・回復方針は定義されているか [Gap] [Edge Cases]
  - DynamoDB にメタデータがあるが S3 にデータがない（またはその逆）状態の
    検知方法と回復手順が要件として規定されているか
- [ ] CHK008 - 同時マージ時の競合解決戦略は具体化されているか [Clarity] [Edge Cases]
  - 「同一テーマ・軸に複数 PR が同時マージされた場合」が Edge Case に
    挙げられているが、具体的な解決戦略（先勝ち／後勝ち／エラー）が
    未定義ではないか
- [x] CHK009 - 部分失敗時のデータ状態遷移は網羅されているか [Coverage] [Spec §FR-007]
  - DynamoDB 書き込み失敗・S3 書き込み失敗・ネットワークタイムアウト等、
    各失敗パターンでの期待されるデータ状態が一覧化されているか
- [ ] CHK010 - バージョン番号の一意性保証の範囲は明確か [Clarity] [Spec §FR-008]
  - themeId + axisId + version の組が一意であることの保証方法
    （DynamoDB のキー設計による自然な一意性 or アプリ側制御）が明示されているか
- [ ] CHK011 - 同期対象ファイルの変更検知ロジックは定義されているか
  [Completeness] [Spec §FR-006]
  - paths フィルタで `comparisons/` 配下を検知するが、
    削除・リネーム・複数ファイル同時変更時の挙動が要件として規定されているか
- [ ] CHK012 - DynamoDB ステータス遷移の許可パスは制約されているか [Consistency]
  - data-model.md の状態遷移（proposed → done）と FR-007 の
    `draft`/`published` が混在しており、
    Issue ステータスと同期ステータスの関係が整理されているか
- [x] CHK013 - 同期失敗後のリトライ回数・間隔は定量化されているか
  [Completeness] [Spec §FR-007]
  - S3 書き込み失敗時のリトライ上限・バックオフ戦略・
    最終的なエラー判定までの時間が数値で規定されているか
- [x] CHK014 - 既存バージョンへの上書き防止要件は明示されているか [Gap] [Spec §FR-008]
  - S3 の `v{N}/result.json` キーが既に存在する場合に上書きを禁止するか、
    または条件付き書き込み（If-None-Match 等）を使うかが未定義ではないか
