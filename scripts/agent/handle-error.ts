import { addLabel, removeLabel, postErrorComment } from './update-labels.js';

const ISSUE_NUMBER = parseInt(process.env.ISSUE_NUMBER!, 10);

async function main() {
  // エラー時: ラベルを proposed に戻し、コメント投稿
  await removeLabel(ISSUE_NUMBER, 'in-progress');
  await removeLabel(ISSUE_NUMBER, 'approved');
  await addLabel(ISSUE_NUMBER, 'proposed');
  await postErrorComment(
    ISSUE_NUMBER,
    'WorkflowFailure',
    'GitHub Actions ワークフロー',
    'ワークフローが失敗しました。Actions のログを確認してください。',
  );
}

main();
