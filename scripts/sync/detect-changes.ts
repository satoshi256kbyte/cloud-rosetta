import { execSync } from 'node:child_process';

export interface ChangeEntry {
  themeId: string;
  axisId: string;
}

/**
 * git diff で comparisons/ 配下の変更された result.json を検出し、
 * themeId/axisId のリストを返す。
 */
export function detectChanges(beforeSha: string, afterSha: string): ChangeEntry[] {
  const diff = execSync(
    `git diff --name-only --diff-filter=ACMR ${beforeSha}..${afterSha} -- comparisons/`,
    { encoding: 'utf-8' },
  );

  const entries: ChangeEntry[] = [];
  const seen = new Set<string>();

  for (const line of diff.split('\n').filter(Boolean)) {
    // comparisons/{themeId}/{axisId}/result.json
    const match = line.match(/^comparisons\/([^/]+)\/([^/]+)\/result\.json$/);
    if (!match) continue;

    const [, themeId, axisId] = match;
    const key = `${themeId}/${axisId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    entries.push({ themeId, axisId });
  }

  return entries;
}

// CLI エントリーポイント
const isMain = process.argv[1]?.endsWith('detect-changes.ts');
if (isMain) {
  const beforeSha = process.env.GITHUB_EVENT_BEFORE || 'HEAD~1';
  const afterSha = process.env.GITHUB_SHA || 'HEAD';

  const changes = detectChanges(beforeSha, afterSha);
  console.log(JSON.stringify(changes));
}
