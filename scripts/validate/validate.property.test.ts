import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const schemaPath = resolve(import.meta.dirname ?? '.', 'schema.json');
const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);

/** 有効な ID Arbitrary */
const validIdArb = fc.stringMatching(/^[a-z][a-z0-9-]{1,20}[a-z0-9]$/);

/** 有効な URL Arbitrary */
const validUrlArb = fc.oneof(
  fc.constant('https://docs.aws.amazon.com/lambda/latest/dg/welcome.html'),
  fc.constant('https://cloud.google.com/functions/docs'),
  fc.constant('https://learn.microsoft.com/azure/functions'),
);

/** 有効な Provider オブジェクト Arbitrary */
const validProviderArb = fc.record({
  name: fc.constantFrom('AWS', 'GCP', 'Azure', 'Akamai', 'Cloudflare'),
  serviceName: fc.string({ minLength: 1, maxLength: 50 }),
  summary: fc.string({ minLength: 1, maxLength: 200 }),
  sources: fc.array(validUrlArb, { minLength: 1, maxLength: 3 }),
});

/** 有効な result.json Arbitrary */
const validResultArb = fc.record({
  themeId: validIdArb,
  axisId: validIdArb,
  providers: fc.array(validProviderArb, { minLength: 2, maxLength: 5 }),
  comparedAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2027-01-01') })
    .map((d) => d.toISOString()),
  comparedBy: fc.constantFrom('agent', 'human'),
});

describe('JSON Schema バリデーション プロパティベーステスト', () => {
  it('スキーマ準拠 JSON は常にバリデーションを通過する', () => {
    fc.assert(
      fc.property(validResultArb, (result) => {
        const valid = validate(result);
        if (!valid) {
          console.log('Validation errors:', validate.errors);
          console.log('Input:', JSON.stringify(result, null, 2));
        }
        expect(valid).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('必須フィールド欠損は常にエラーになる', () => {
    const requiredFields = ['themeId', 'axisId', 'providers', 'comparedAt', 'comparedBy'];

    fc.assert(
      fc.property(
        validResultArb,
        fc.constantFrom(...requiredFields),
        (result, fieldToRemove) => {
          const incomplete = { ...result };
          delete (incomplete as Record<string, unknown>)[fieldToRemove];
          expect(validate(incomplete)).toBe(false);
        },
      ),
      { numRuns: 50 },
    );
  });

  it('providers が空配列はエラーになる', () => {
    fc.assert(
      fc.property(validResultArb, (result) => {
        const empty = { ...result, providers: [] };
        expect(validate(empty)).toBe(false);
      }),
      { numRuns: 20 },
    );
  });

  it('providers が 1 件のみはエラーになる', () => {
    fc.assert(
      fc.property(validResultArb, validProviderArb, (result, singleProvider) => {
        const single = { ...result, providers: [singleProvider] };
        expect(validate(single)).toBe(false);
      }),
      { numRuns: 20 },
    );
  });
});
