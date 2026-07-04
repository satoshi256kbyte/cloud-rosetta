import { describe, it, expect } from 'vitest';

// sync-to-aws の内部関数をテスト可能にするため、
// パストラバーサルチェックのロジックを直接テストする

function validatePathSafety(id: string): boolean {
  return !id.includes('..') && !id.includes('/') && !id.includes('\\');
}

describe('validatePathSafety（FR-018）', () => {
  it('正常な ID を許可すること', () => {
    expect(validatePathSafety('serverless-compute')).toBe(true);
    expect(validatePathSafety('cold-start')).toBe(true);
    expect(validatePathSafety('a1')).toBe(true);
  });

  it('パストラバーサルを含む ID を拒否すること', () => {
    expect(validatePathSafety('../etc/passwd')).toBe(false);
    expect(validatePathSafety('theme/../../secret')).toBe(false);
    expect(validatePathSafety('theme\\axis')).toBe(false);
  });

  it('ドット2つ連続を拒否すること', () => {
    expect(validatePathSafety('..theme')).toBe(false);
    expect(validatePathSafety('theme..')).toBe(false);
  });
});
