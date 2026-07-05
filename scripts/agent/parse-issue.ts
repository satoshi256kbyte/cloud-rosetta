export interface ComparisonParams {
  themeId: string;
  axisId: string;
  providers: string[];
  issueNumber: number;
}

const THEME_ID_PATTERN = /^[a-z][a-z0-9-]{0,62}[a-z0-9]$/;

/**
 * Issue 本文からテーマID・軸ID・プロバイダーをパースする。
 * Issue テンプレート（comparison-theme.yml）のフォーム出力形式に対応。
 */
export function parseIssueBody(body: string, issueNumber: number): ComparisonParams {
  const lines = body.split('\n');

  let themeId = '';
  let axisId = '';
  const providers: string[] = [];

  let currentSection = '';

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('### テーマID')) {
      currentSection = 'themeId';
      continue;
    }
    if (trimmed.startsWith('### 比較軸ID') || trimmed.startsWith('### 比較対象')) {
      if (currentSection === 'themeId' && !themeId) {
        // セクション内のテキストを取得
      }
      currentSection = trimmed.includes('比較軸') ? 'axisId' : 'providers';
      continue;
    }
    if (trimmed.startsWith('### 提案理由') || trimmed.startsWith('### 補足')) {
      currentSection = '';
      continue;
    }

    if (!trimmed || trimmed === '_No response_') continue;

    switch (currentSection) {
      case 'themeId':
        if (!themeId) themeId = trimmed;
        break;
      case 'axisId':
        if (!axisId) axisId = trimmed;
        break;
      case 'providers':
        if (trimmed.startsWith('- [X]') || trimmed.startsWith('- [x]')) {
          const provider = trimmed.replace(/^- \[[xX]\]\s*/, '').trim();
          if (provider) providers.push(provider);
        }
        break;
    }
  }

  // バリデーション（FR-012）
  const errors: string[] = [];

  if (!themeId) {
    errors.push('テーマID が未入力です');
  } else if (!THEME_ID_PATTERN.test(themeId)) {
    errors.push(`テーマID "${themeId}" が不正なフォーマットです（英小文字・数字・ハイフン、2-64文字）`);
  }

  if (!axisId) {
    errors.push('比較軸ID が未入力です');
  } else if (!THEME_ID_PATTERN.test(axisId)) {
    errors.push(`比較軸ID "${axisId}" が不正なフォーマットです（英小文字・数字・ハイフン、2-64文字）`);
  }

  if (providers.length < 2) {
    errors.push(`比較対象プロバイダーが ${providers.length} 件です（最低2件必要）`);
  }

  if (errors.length > 0) {
    throw new Error(`Issue 入力バリデーションエラー:\n${errors.join('\n')}`);
  }

  return { themeId, axisId, providers, issueNumber };
}
