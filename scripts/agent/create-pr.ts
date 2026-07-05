import { Octokit } from '@octokit/rest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { addLabel, removeLabel } from './update-labels.js';
import type { ComparisonParams } from './parse-issue.js';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = process.env.GITHUB_REPOSITORY_OWNER || 'satoshi256kbyte';
const REPO = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'cloud-rosetta';
const ISSUE_NUMBER = parseInt(process.env.ISSUE_NUMBER!, 10);

async function main() {
  // パラメータ読み込み
  const params: ComparisonParams = JSON.parse(
    readFileSync(resolve(import.meta.dirname ?? '.', '.agent-params.json'), 'utf-8'),
  );

  const { themeId, axisId } = params;
  const branchName = `agent/${themeId}-${axisId}`;
  const filePath = `comparisons/${themeId}/${axisId}/result.json`;

  // 既存PR チェック（FR-014）
  const { data: existingPrs } = await octokit.pulls.list({
    owner: OWNER,
    repo: REPO,
    state: 'open',
    head: `${OWNER}:${branchName}`,
  });

  if (existingPrs.length > 0) {
    console.log(`既存 PR が存在します: #${existingPrs[0].number}. スキップ。`);
    process.exit(0);
  }

  // main ブランチの最新 SHA を取得
  const { data: mainRef } = await octokit.git.getRef({
    owner: OWNER,
    repo: REPO,
    ref: 'heads/main',
  });
  const baseSha = mainRef.object.sha;

  // feature ブランチ作成
  await octokit.git.createRef({
    owner: OWNER,
    repo: REPO,
    ref: `refs/heads/${branchName}`,
    sha: baseSha,
  });

  // result.json の内容を読み込み
  const resultContent = readFileSync(
    resolve(import.meta.dirname ?? '.', `../../comparisons/${themeId}/${axisId}/result.json`),
    'utf-8',
  );

  // ファイルをコミット
  const { data: blob } = await octokit.git.createBlob({
    owner: OWNER,
    repo: REPO,
    content: Buffer.from(resultContent).toString('base64'),
    encoding: 'base64',
  });

  const { data: baseCommit } = await octokit.git.getCommit({
    owner: OWNER,
    repo: REPO,
    commit_sha: baseSha,
  });

  const { data: tree } = await octokit.git.createTree({
    owner: OWNER,
    repo: REPO,
    base_tree: baseCommit.tree.sha,
    tree: [
      {
        path: filePath,
        mode: '100644',
        type: 'blob',
        sha: blob.sha,
      },
    ],
  });

  const { data: commit } = await octokit.git.createCommit({
    owner: OWNER,
    repo: REPO,
    message: `feat(comparison): ${themeId}/${axisId} の比較結果を追加`,
    tree: tree.sha,
    parents: [baseSha],
  });

  await octokit.git.updateRef({
    owner: OWNER,
    repo: REPO,
    ref: `heads/${branchName}`,
    sha: commit.sha,
  });

  // PR 作成（FR-017）
  const { data: pr } = await octokit.pulls.create({
    owner: OWNER,
    repo: REPO,
    title: `feat(comparison): ${themeId}/${axisId} の比較結果を追加`,
    head: branchName,
    base: 'main',
    body: `## 関連 Issue\n\ncloses #${ISSUE_NUMBER}\n\n## 変更概要\n\n- テーマID: \`${themeId}\`\n- 軸ID: \`${axisId}\`\n- プロバイダー: ${params.providers.join(', ')}\n\nAIエージェントによる自動生成結果です。`,
  });

  console.log(`✅ PR created: #${pr.number} - ${pr.html_url}`);

  // ラベルを review に変更（FR-008）
  await removeLabel(ISSUE_NUMBER, 'in-progress');
  await addLabel(ISSUE_NUMBER, 'review');

  console.log(`✅ Issue #${ISSUE_NUMBER} label changed to 'review'`);
}

main();
