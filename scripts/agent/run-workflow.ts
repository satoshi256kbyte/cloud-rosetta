import { BedrockAgentCoreClient, InvokeHarnessCommand } from '@aws-sdk/client-bedrock-agentcore';
import { parseIssueBody } from './parse-issue.js';
import { addLabel, removeLabel, getLabels, postErrorComment } from './update-labels.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const REGION = process.env.AWS_REGION || 'ap-northeast-1';
const HARNESS_IDENTIFIER = process.env.HARNESS_ARN!;
const ISSUE_NUMBER = parseInt(process.env.ISSUE_NUMBER!, 10);
const ISSUE_BODY = process.env.ISSUE_BODY!;

const client = new BedrockAgentCoreClient({ region: REGION });

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
    const userPrompt = `以下の比較を実行してください。

テーマID: ${params.themeId}
比較軸ID: ${params.axisId}
比較対象プロバイダー: ${params.providers.join(', ')}

JSON形式で結果を出力してください。`;

    // InvokeHarness API 呼び出し（リトライ付き: FR-022）
    let response;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`InvokeHarness attempt ${attempt}...`);
        response = await client.send(
          new InvokeHarnessCommand({
            harnessIdentifier: HARNESS_IDENTIFIER,
            input: {
              messages: [
                {
                  role: 'user',
                  content: [{ text: userPrompt }],
                },
              ],
            },
          }),
        );
        break;
      } catch (err) {
        if (attempt === 3) throw err;
        const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
        console.log(`Retrying in ${backoff}ms...`);
        await new Promise((r) => setTimeout(r, backoff));
      }
    }

    if (!response) {
      throw new Error('InvokeHarness returned no response');
    }

    // レスポンスからテキストを抽出
    const outputMessage = response.output?.message;
    const agentResponse = outputMessage?.content?.[0]?.text;

    if (!agentResponse) {
      throw new Error('AgentCore returned empty response');
    }

    console.log('Agent response received, parsing JSON...');

    // JSON パース
    const resultJson = JSON.parse(agentResponse);

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
