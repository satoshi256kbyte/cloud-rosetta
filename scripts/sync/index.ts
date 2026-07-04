import { resolve } from 'node:path';
import { detectChanges } from './detect-changes.js';
import { syncToAws } from './sync-to-aws.js';

const beforeSha = process.env.GITHUB_EVENT_BEFORE || 'HEAD~1';
const afterSha = process.env.GITHUB_SHA || 'HEAD';
const comparisonsDir = resolve(import.meta.dirname ?? '.', '../../comparisons');

console.log(`Detecting changes between ${beforeSha}..${afterSha}`);

const changes = detectChanges(beforeSha, afterSha);

if (changes.length === 0) {
  console.log('No comparison changes detected. Skipping sync.');
  process.exit(0);
}

console.log(`Found ${changes.length} change(s):`);
for (const change of changes) {
  console.log(`  - ${change.themeId}/${change.axisId}`);
}

console.log('\nStarting sync to AWS...');
const result = await syncToAws(changes, comparisonsDir);

console.log('\n=== Sync Result ===');
console.log(JSON.stringify(result, null, 2));

if (result.failed.length > 0) {
  console.error(`\n❌ ${result.failed.length} sync(s) failed`);
  process.exit(1);
}

console.log(`\n✅ ${result.synced.length} sync(s) completed successfully`);
