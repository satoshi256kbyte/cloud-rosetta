import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateFiles } from './validate.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const testDir = join(__dirname, '__test_comparisons__');

const validData = {
  themeId: 'serverless-compute',
  axisId: 'cold-start',
  providers: [
    {
      name: 'AWS',
      serviceName: 'AWS Lambda',
      summary: 'サーバーレスコンピューティング',
      sources: ['https://docs.aws.amazon.com/lambda/'],
    },
    {
      name: 'GCP',
      serviceName: 'Cloud Functions',
      summary: 'サーバーレスコンピューティング',
      sources: ['https://cloud.google.com/functions/docs'],
    },
  ],
  comparedAt: '2026-07-04T00:00:00Z',
  comparedBy: 'satoshi256kbyte',
};

beforeAll(() => {
  mkdirSync(join(testDir, 'valid-theme/valid-axis'), { recursive: true });
  mkdirSync(join(testDir, 'invalid-theme/invalid-axis'), { recursive: true });
  mkdirSync(join(testDir, 'extra-theme/extra-axis'), { recursive: true });
});

afterAll(() => {
  rmSync(testDir, { recursive: true, force: true });
});

describe('validateFiles', () => {
  it('正常なデータでバリデーションが通ること', () => {
    writeFileSync(
      join(testDir, 'valid-theme/valid-axis/result.json'),
      JSON.stringify(validData, null, 2),
    );

    const results = validateFiles(testDir);
    const valid = results.find((r) => r.file.includes('valid-theme'));
    expect(valid?.valid).toBe(true);
  });

  it('必須フィールド欠落でバリデーションが失敗すること', () => {
    const invalidData = { themeId: 'test' };
    writeFileSync(
      join(testDir, 'invalid-theme/invalid-axis/result.json'),
      JSON.stringify(invalidData),
    );

    const results = validateFiles(testDir);
    const invalid = results.find((r) => r.file.includes('invalid-theme'));
    expect(invalid?.valid).toBe(false);
    expect(invalid?.errors?.length).toBeGreaterThan(0);
  });

  it('additionalProperties でバリデーションが失敗すること（FR-017）', () => {
    const extraData = { ...validData, unknownField: 'should fail' };
    writeFileSync(
      join(testDir, 'extra-theme/extra-axis/result.json'),
      JSON.stringify(extraData),
    );

    const results = validateFiles(testDir);
    const extra = results.find((r) => r.file.includes('extra-theme'));
    expect(extra?.valid).toBe(false);
    expect(extra?.errors?.some((e) => e.includes('additional'))).toBe(true);
  });
});
