import {
  BedrockAgentCoreClient,
  InvokeHarnessCommand,
} from '@aws-sdk/client-bedrock-agentcore';
import { randomUUID } from 'node:crypto';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseIssueBody } from './parse-issue.js';
import { addLabel, removeLabel, getLabels, postErrorComment } from './update-labels.js';

const REGION = process.env.AWS_REGION || 'ap-northeast-1';
const HARNESS_ARN = process.env.HARNESS_ARN!;
const ISSUE_NUMBER = parseInt(process.env.ISSUE_NUMBER!, 10);
const ISSUE_BODY = process.env.ISSUE_BODY!;

// Harness ARN からリージョンを抽出（クロスリージョン対応）
const harnessRegion = HARNESS_ARN.split(':')[3] || REGION;
const client = new BedrockAgentCoreClient({ region: harnessRegion });

/**
 * ストリーミングレスポンスからテキストを収集する
 */
async function collectStreamText(
  stream: AsyncIterable<import('@aws-sdk/client-bedrock-agentcore').InvokeHarnessStreamOutput>,
): Promise<string> {
  let text = '';
  for await (const event of stream) {
    if ('contentBlockDelta' in event && event.contentBlockDelta) {
      const delta = event.contentBlockDelta.delta;
      if (delta && 'text' in delta && delta.text) {
        text += delta.text;
      }
    }
  }
  return text;
}

async function main() {
  // 二重実行チェック（FR-002）
  const labels = await getLabels(ISSUE_NUMBER);
  if (labels.includes('in-progress')) {
    console.log('Issue is already in-progress. Skipping.');
    process.exit(0);
  }

  // ラベルを in-progress に変更
  await removeLabel(ISSUE_NUMBER, 'approved');
  await addLabel(ISSUE_NUMBER, 'in-progress');

  try {
    // Issue パース + バリデーション（FR-012）
    const params = parseIssueBody(ISSUE_BODY, ISSUE_NUMBER);
    console.log('Parsed params:', JSON.stringify(params));

    // プロンプト構築
    const userPrompt = `以下の比較を実行し、結果をJSONのみで出力してください。説明文やマークダウンは不要です。

テーマID: ${params.themeId}
比較軸ID: ${params.axisId}
比較対象プロバイダー: ${params.providers.join(', ')}

出力形式（これ以外のテキストを一切含めないでください）:
{"themeId":"${params.themeId}","axisId":"${params.axisId}","providers":[{"name":"プロバイダー名","serviceName":"サービス名","summary":"日本語要約","details":"詳細","sources":["公式URL"]}],"comparedAt":"2026-07-05T00:00:00Z","comparedBy":"agent"}

JSONのみ出力してください。`;

    // InvokeHarness API 呼び出し（リトライ付き: FR-022）
    let agentResponse = '';
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`InvokeHarness attempt ${attempt}...`);
        const response = await client.send(
          new InvokeHarnessCommand({
            harnessArn: HARNESS_ARN,
            runtimeSessionId: randomUUID(),
            messages: [
              {
                role: 'user',
                content: [{ text: userPrompt }],
              },
            ],
          }),
        );

        if (!response.stream) {
          throw new Error('InvokeHarness returned no stream');
        }

        agentResponse = await collectStreamText(response.stream);
        break;
      } catch (err) {
        if (attempt === 3) throw err;
        const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
        console.log(`Retrying in ${backoff}ms...`);
        await new Promise((r) => setTimeout(r, backoff));
      }
    }

    if (!agentResponse) {
      throw new Error('AgentCore returned empty response');
    }

    console.log('Agent response received, parsing JSON...');
    console.log('Raw response (first 500 chars):', agentResponse.substring(0, 500));

    // JSON を抽出（レスポンスにテキストが混ざる場合を考慮）
    const jsonMatch = agentResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Agent response does not contain valid JSON');
    }
    const resultJson = JSON.parse(jsonMatch[0]);

    // 結果をファイルに書き込み（create-pr.ts で使用）
    const comparisonsDir = resolve(
      import.meta.dirname ?? '.',
      `../../comparisons/${params.themeId}/${params.axisId}`,
    );
    mkdirSync(comparisonsDir, { recursive: true });
    writeFileSync(
      resolve(comparisonsDir, 'result.json'),
      JSON.stringify(resultJson, null, 2),
    );

    // パラメータを一時ファイルに保存（create-pr.ts で使用）
    writeFileSync(
      resolve(import.meta.dirname ?? '.', '.agent-params.json'),
      JSON.stringify(params),
    );

    console.log('✅ Agent execution completed successfully');
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Error: ${errMsg}`);

    // エラー時: ラベルを proposed に戻し、コメント投稿（FR-009, FR-016）
    await removeLabel(ISSUE_NUMBER, 'in-progress');
    await addLabel(ISSUE_NUMBER, 'proposed');
    await postErrorComment(
      ISSUE_NUMBER,
      error instanceof Error ? error.constructor.name : 'UnknownError',
      'エージェント実行',
      errMsg,
    );

    process.exit(1);
  }
}

main();
