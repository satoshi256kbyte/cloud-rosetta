import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

interface Provider {
  name: string;
  serviceName: string;
  summary: string;
  details?: string;
  sources: string[];
}

interface ComparisonResult {
  themeId: string;
  axisId: string;
  providers: Provider[];
  comparedAt: string;
  comparedBy: string;
}

/**
 * result.json から result.md を生成する（FR-016）
 */
export function generateMarkdown(data: ComparisonResult): string {
  const lines: string[] = [];

  lines.push(`# ${data.themeId} / ${data.axisId}`);
  lines.push('');
  lines.push(`比較日時: ${data.comparedAt}`);
  lines.push(`比較者: ${data.comparedBy}`);
  lines.push('');
  lines.push('## 比較結果');
  lines.push('');
  lines.push('| プロバイダー | サービス名 | 概要 |');
  lines.push('|------------|-----------|------|');

  for (const provider of data.providers) {
    lines.push(`| ${provider.name} | ${provider.serviceName} | ${provider.summary} |`);
  }

  lines.push('');
  lines.push('## 詳細');
  lines.push('');

  for (const provider of data.providers) {
    lines.push(`### ${provider.name} - ${provider.serviceName}`);
    lines.push('');
    if (provider.details) {
      lines.push(provider.details);
      lines.push('');
    }
    lines.push('**参照元**:');
    lines.push('');
    for (const source of provider.sources) {
      lines.push(`- ${source}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * result.json ファイルパスから result.md を生成して書き込む
 */
export function generateMarkdownFile(resultJsonPath: string): void {
  const content = readFileSync(resultJsonPath, 'utf-8');
  const data: ComparisonResult = JSON.parse(content);
  const markdown = generateMarkdown(data);
  const mdPath = resolve(dirname(resultJsonPath), 'result.md');
  writeFileSync(mdPath, markdown, 'utf-8');
}
