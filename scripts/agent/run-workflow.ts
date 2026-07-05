import { SFNClient, StartExecutionCommand, DescribeExecutionCommand } from '@aws-sdk/client-sfn';
import { parseIssueBody } from './parse-issue.js';
import { addLabel, removeLabel, getLabels, postErrorComment } from './update-labels.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const REGION = process.env.AWS_REGION || 'ap-northeast-1';
const STATE_MACHINE_ARN = process.env.STATE_MACHINE_ARN!;
const ISSUE_NUMBER = parseInt(process.env.ISSUE_NUMBER!, 10);
const ISSUE_BODY = process.env.ISSUE_BODY!;

const sfnClient = new SFNClient({ region: REGION });

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
    const systemPrompt = readFileSync(
      resolve(import.meta.dirname ?? '.', 'prompts/comparison.txt'),
      'utf-8',
    );
    const userPrompt = `以下の比較を実行してください。

テーマID: ${params.themeId}
比較軸ID: ${params.axisId}
比較対象プロバイダー: ${params.providers.join(', ')}

${systemPrompt}`;

    // Step Functions 起動
    console.log('Starting Step Functions execution...');
    const execution = await sfnClient.send(
      new StartExecutionCommand({
        stateMachineArn: STATE_MACHINE_ARN,
        input: JSON.stringify({ prompt: userPrompt }),
        name: `comparison-${params.themeId}-${params.axisId}-${Date.now()}`,
      }),
    );

    const executionArn = execution.executionArn!;
    console.log(`Execution started: ${executionArn}`);

    // 完了待ち（ポーリング）
    let status = 'RUNNING';
    while (status === 'RUNNING') {
      await new Promise((r) => setTimeout(r, 10000)); // 10秒間隔
      const desc = await sfnClient.send(
        new DescribeExecutionCommand({ executionArn }),
      );
      status = desc.status!;
      console.log(`Status: ${status}`);
    }

    if (status !== 'SUCCEEDED') {
      throw new Error(`Step Functions execution failed with status: ${status}`);
    }

    // 結果取得
    const desc = await sfnClient.send(
      new DescribeExecutionCommand({ executionArn }),
    );
    const output = JSON.parse(desc.output!);
    const agentResponse = output.agentResult?.Output?.Message?.Content?.[0]?.Text;

    if (!agentResponse) {
      throw new Error('AgentCore returned empty response');
    }

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
