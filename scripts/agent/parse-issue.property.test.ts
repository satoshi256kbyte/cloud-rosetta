import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { parseIssueBody } from './parse-issue.js';

/** 有効な themeId/axisId を生成する Arbitrary */
const validIdArb = fc.stringMatching(/^[a-z][a-z0-9-]{0,62}[a-z0-9]$/);

/** 無効な ID（大文字・記号・空文字等） */
const invalidIdArb = fc.oneof(
  fc.constant(''),
  fc.constant('A'),
  fc.constant('has_underscore'),
  fc.constant('-starts-with-dash'),
  fc.constant('ends-with-dash-'),
  fc.stringMatching(/^[A-Z][A-Z0-9]{2,10}$/),
);

/** プロバイダーリスト（2〜5件、重複なし）を生成 */
const validProvidersArb = fc.uniqueArray(
  fc.constantFrom('AWS', 'GCP', 'Azure', 'Akamai', 'Cloudflare'),
  { minLength: 2, maxLength: 5 },
);

/** Issue テンプレート形式の本文を生成するヘルパー */
function buildIssueBody(themeId: string, axisId: string, providers: string[]): string {
  const checks = ['AWS', 'GCP', 'Azure', 'Akamai', 'Cloudflare']
    .map((p) => `- [${providers.includes(p) ? 'X' : ' '}] ${p}`)
    .join('\n');

  return `### テーマID\n\n${themeId}\n\n### 比較軸ID\n\n${axisId}\n\n### 比較対象プロバイダー（2つ以上選択）\n\n${checks}\n\n### 提案理由\n\nテスト`;
}

describe('parseIssueBody プロパティベーステスト', () => {
  it('有効な入力は常にバリデーションを通過する', () => {
    fc.assert(
      fc.property(validIdArb, validIdArb, validProvidersArb, (themeId, axisId, providers) => {
        const body = buildIssueBody(themeId, axisId, providers);
        const result = parseIssueBody(body, 1);
        expect(result.themeId).toBe(themeId);
        expect(result.axisId).toBe(axisId);
        expect(result.providers.length).toBeGreaterThanOrEqual(2);
      }),
      { numRuns: 100 },
    );
  });

  it('無効な themeId は常にエラーを投げる', () => {
    fc.assert(
      fc.property(invalidIdArb, validIdArb, validProvidersArb, (themeId, axisId, providers) => {
        const body = buildIssueBody(themeId, axisId, providers);
        expect(() => parseIssueBody(body, 1)).toThrow();
      }),
      { numRuns: 50 },
    );
  });

  it('無効な axisId は常にエラーを投げる', () => {
    fc.assert(
      fc.property(validIdArb, invalidIdArb, validProvidersArb, (themeId, axisId, providers) => {
        const body = buildIssueBody(themeId, axisId, providers);
        expect(() => parseIssueBody(body, 1)).toThrow();
      }),
      { numRuns: 50 },
    );
  });

  it('プロバイダーが1件以下は常にエラーを投げる', () => {
    fc.assert(
      fc.property(
        validIdArb,
        validIdArb,
        fc.array(fc.constantFrom('AWS', 'GCP', 'Azure'), { minLength: 0, maxLength: 1 }),
        (themeId, axisId, providers) => {
          const body = buildIssueBody(themeId, axisId, providers);
          expect(() => parseIssueBody(body, 1)).toThrow();
        },
      ),
      { numRuns: 50 },
    );
  });
});
