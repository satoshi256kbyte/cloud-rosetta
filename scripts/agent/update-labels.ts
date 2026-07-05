import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const OWNER = process.env.GITHUB_REPOSITORY_OWNER || 'satoshi256kbyte';
const REPO = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'cloud-rosetta';

/**
 * Issue にラベルを追加する
 */
export async function addLabel(issueNumber: number, label: string): Promise<void> {
  await octokit.issues.addLabels({
    owner: OWNER,
    repo: REPO,
    issue_number: issueNumber,
    labels: [label],
  });
}

/**
 * Issue からラベルを削除する
 */
export async function removeLabel(issueNumber: number, label: string): Promise<void> {
  try {
    await octokit.issues.removeLabel({
      owner: OWNER,
      repo: REPO,
      issue_number: issueNumber,
      name: label,
    });
  } catch {
    // ラベルが存在しない場合は無視
  }
}

/**
 * Issue のラベル一覧を取得する
 */
export async function getLabels(issueNumber: number): Promise<string[]> {
  const { data } = await octokit.issues.listLabelsOnIssue({
    owner: OWNER,
    repo: REPO,
    issue_number: issueNumber,
  });
  return data.map((l) => l.name);
}

/**
 * Issue にコメントを投稿する
 */
export async function postComment(issueNumber: number, body: string): Promise<void> {
  await octokit.issues.createComment({
    owner: OWNER,
    repo: REPO,
    issue_number: issueNumber,
    body,
  });
}

/**
 * エラーコメントを構造化フォーマットで投稿する（FR-016）
 */
export async function postErrorComment(
  issueNumber: number,
  errorType: string,
  stage: string,
  detail: string,
): Promise<void> {
  const body = `## ❌ エージェント実行エラー

| 項目 | 値 |
|------|-----|
| エラー種類 | ${errorType} |
| 失敗段階 | ${stage} |
| 詳細 | ${detail} |

ラベルを \`proposed\` に戻しました。内容を修正して再度 \`approved\` ラベルを付与してください。`;

  await postComment(issueNumber, body);
}
