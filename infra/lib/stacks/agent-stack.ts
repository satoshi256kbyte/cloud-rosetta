import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as bedrockagentcore from 'aws-cdk-lib/aws-bedrockagentcore';
import { NagSuppressions } from 'cdk-nag';
import { Construct } from 'constructs';

export interface AgentStackProps extends cdk.StackProps {
  stage: string;
}

/**
 * AIエージェント比較実行基盤スタック。
 *
 * AgentCore Harness を CDK で管理し、GitHub Actions から
 * InvokeHarness API を直接呼び出す構成。
 * Step Functions の InvokeHarness 統合は東京リージョン未対応のため不使用。
 */
export class AgentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AgentStackProps) {
    super(scope, id, {
      ...props,
      stackName: `cloud-rosetta-${props.stage}-stack-agent`,
    });

    const { stage } = props;

    // Harness 実行ロール
    const harnessRole = new iam.Role(this, 'HarnessRole', {
      roleName: `cloud-rosetta-${stage}-iam-harness`,
      assumedBy: new iam.ServicePrincipal('bedrock-agentcore.amazonaws.com'),
    });

    harnessRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'InvokeModel',
        actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
        resources: [`arn:aws:bedrock:${this.region}::foundation-model/*`],
      }),
    );

    // AgentCore 内部操作（Memory, Events 等）
    harnessRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AgentCoreOperations',
        actions: [
          'bedrock-agentcore:ListEvents',
          'bedrock-agentcore:CreateEvent',
          'bedrock-agentcore:*Memory*',
        ],
        resources: ['*'],
      }),
    );

    // AgentCore Harness（CfnHarness L1）
    const harness = new bedrockagentcore.CfnHarness(this, 'ComparisonHarness', {
      harnessName: `cloudRosetta${stage}Agent`,
      executionRoleArn: harnessRole.roleArn,
      model: {
        bedrockModelConfig: {
          modelId: 'nvidia.nemotron-super-3-120b',
          maxTokens: 4096,
          temperature: 0.3,
          topP: 0.9,
        },
      },
      systemPrompt: [
        {
          text:
            'あなたはクラウドサービスの比較を行うAIエージェントです。' +
            '指定された比較テーマ・比較軸・対象プロバイダーに基づいて、' +
            '各プロバイダーのサービスを比較し、構造化されたJSON形式で結果を出力してください。' +
            '\n\n情報源の優先順位: 1. AWS: 公式ドキュメント 2. GCP: cloud.google.com/docs ' +
            '3. Azure: learn.microsoft.com 4. Akamai: techdocs.akamai.com ' +
            '5. Cloudflare: developers.cloudflare.com' +
            '\n\n出力は以下のJSON形式に厳密に従ってください: ' +
            '{"themeId":"テーマID","axisId":"軸ID","providers":[{"name":"プロバイダー名",' +
            '"serviceName":"サービス名","summary":"100文字以内の日本語要約",' +
            '"details":"詳細（省略可）","sources":["公式URL"]}],' +
            '"comparedAt":"ISO8601 UTC","comparedBy":"agent"}' +
            '\n\nルール: providers配列に全プロバイダーを含める。' +
            '各providerのsourcesに最低1つの公式URL。' +
            '情報取得不可の場合summaryに明記。日本語で記述。JSON以外出力しない。',
        },
      ],
      timeoutSeconds: 900,
      maxIterations: 10,
    });

    // Harness ARN を構築
    const harnessArn = cdk.Arn.format(
      { service: 'bedrock-agentcore', resource: 'harness', resourceName: harness.attrHarnessId },
      this,
    );

    // cdk-nag 抑制
    NagSuppressions.addResourceSuppressions(
      harnessRole,
      [
        {
          id: 'AwsSolutions-IAM5',
          reason: 'InvokeModel は全 foundation-model に対して許可。モデル切り替え対応のため。',
        },
      ],
      true,
    );

    // Outputs
    new cdk.CfnOutput(this, 'HarnessId', {
      value: harness.attrHarnessId,
      description: 'AgentCore Harness ID',
    });

    new cdk.CfnOutput(this, 'HarnessArn', {
      value: harnessArn,
      description: 'AgentCore Harness ARN（GitHub Actions で InvokeHarness に使用）',
    });
  }
}
