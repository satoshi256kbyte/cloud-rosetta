import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const schemaPath = join(__dirname, 'schema.json');
const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);

interface ValidationResult {
  file: string;
  valid: boolean;
  errors?: string[];
}

function findResultJsonFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string): void {
    const entries = readdirSync(currentDir);
    for (const entry of entries) {
      if (entry.startsWith('.') || entry.startsWith('_')) continue;
      const fullPath = join(currentDir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (entry === 'result.json') {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

export function validateFiles(comparisonsDir: string): ValidationResult[] {
  const files = findResultJsonFiles(comparisonsDir);
  const results: ValidationResult[] = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    let data: unknown;
    try {
      data = JSON.parse(content);
    } catch {
      results.push({
        file,
        valid: false,
        errors: ['Invalid JSON: parse error'],
      });
      continue;
    }

    const valid = validate(data);
    if (valid) {
      results.push({ file, valid: true });
    } else {
      const errors = validate.errors?.map(
        (e) => `${e.instancePath || '/'}: ${e.message}`,
      ) ?? [];
      results.push({ file, valid: false, errors });
    }
  }

  return results;
}

// CLI エントリーポイント
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const comparisonsDir = resolve(__dirname, '../../comparisons');
  const results = validateFiles(comparisonsDir);

  let hasErrors = false;
  for (const result of results) {
    if (result.valid) {
      console.log(`✅ ${result.file}`);
    } else {
      hasErrors = true;
      console.error(`❌ ${result.file}`);
      for (const error of result.errors ?? []) {
        console.error(`   ${error}`);
      }
    }
  }

  if (results.length === 0) {
    console.log('No result.json files found in comparisons/');
  }

  process.exit(hasErrors ? 1 : 0);
}
