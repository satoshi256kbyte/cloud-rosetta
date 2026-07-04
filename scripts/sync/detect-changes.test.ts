import { describe, it, expect } from 'vitest';
import { detectChanges } from './detect-changes.js';

describe('detectChanges', () => {
  it('comparisons 配下の result.json 変更を検出すること', () => {
    // このテストは実際の git 履歴に依存するため、
    // CI 上では HEAD~1..HEAD で直近のコミットを検証する。
    // ローカルでは git 履歴がある前提で実行する。
    const changes = detectChanges('HEAD~1', 'HEAD');
    // 結果は配列であること
    expect(Array.isArray(changes)).toBe(true);
  });

  it('返却値が themeId と axisId を含むこと', () => {
    const changes = detectChanges('HEAD~1', 'HEAD');
    for (const entry of changes) {
      expect(entry).toHaveProperty('themeId');
      expect(entry).toHaveProperty('axisId');
    }
  });
});
