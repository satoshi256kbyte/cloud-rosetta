import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as bedrockagentcore from 'aws-cdk-lib/aws-bedrockagentcore';
import { NagSuppressions } from 'cdk-nag';
import { Construct } from 'constructs';

export interface AgentStackProps extends cdk.StackProps {
  stage: string;
}

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

    // Step Functions 実行ロール
    const sfnRole = new iam.Role(this, 'StepFunctionsRole', {
      roleName: `cloud-rosetta-${stage}-iam-sfn-agent`,
      assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
    });

    sfnRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'InvokeHarness',
        actions: ['bedrock-agentcore:InvokeHarness'],
        resources: [harnessArn],
      }),
    );

    sfnRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'ApplyGuardrail',
        actions: ['bedrock:ApplyGuardrail'],
        resources: ['*'],
      }),
    );

    // ログ
    const logGroup = new logs.LogGroup(this, 'SfnLogGroup', {
      logGroupName: `/aws/stepfunctions/cloud-rosetta-${stage}-sfn-comparison-agent`,
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    sfnRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'CloudWatchLogs',
        actions: [
          'logs:CreateLogDelivery',
          'logs:GetLogDelivery',
          'logs:UpdateLogDelivery',
          'logs:DeleteLogDelivery',
          'logs:ListLogDeliveries',
          'logs:PutResourcePolicy',
          'logs:DescribeResourcePolicies',
          'logs:DescribeLogGroups',
        ],
        resources: ['*'],
      }),
    );

    sfnRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'XRay',
        actions: [
          'xray:PutTraceSegments',
          'xray:PutTelemetryRecords',
          'xray:GetSamplingRules',
          'xray:GetSamplingTargets',
        ],
        resources: ['*'],
      }),
    );

    // Step Functions ステートマシン
    const definition = {
      Comment: 'cloud-rosetta 比較エージェント実行ワークフロー',
      StartAt: 'InvokeComparisonAgent',
      States: {
        InvokeComparisonAgent: {
          Type: 'Task',
          Resource: 'arn:aws:states:::bedrock-agentcore:invokeHarness',
          Parameters: {
            'HarnessIdentifier': harnessArn,
            'Input': {
              'Messages': [
                {
                  'Role': 'user',
                  'Content': [{ 'Text.$': '$.prompt' }],
                },
              ],
            },
          },
          TimeoutSeconds: 900,
          ResultPath: '$.agentResult',
          Next: 'Done',
          Catch: [{ ErrorEquals: ['States.ALL'], Next: 'Failed', ResultPath: '$.error' }],
        },
        Done: { Type: 'Succeed' },
        Failed: { Type: 'Fail', Cause: 'AgentCore invocation failed', Error: 'AgentInvocationError' },
      },
    };

    const stateMachine = new sfn.CfnStateMachine(this, 'ComparisonAgentSfn', {
      stateMachineName: `cloud-rosetta-${stage}-sfn-comparison-agent`,
      definitionString: JSON.stringify(definition),
      roleArn: sfnRole.roleArn,
      tracingConfiguration: { enabled: true },
      loggingConfiguration: {
        destinations: [{ cloudWatchLogsLogGroup: { logGroupArn: logGroup.logGroupArn } }],
        includeExecutionData: true,
        level: 'ALL',
      },
    });

    // cdk-nag 抑制
    NagSuppressions.addResourceSuppressions(
      sfnRole,
      [
        {
          id: 'AwsSolutions-IAM5',
          reason:
            'bedrock:ApplyGuardrail, CloudWatch Logs, X-Ray はリソース指定不可のワイルドカード権限。' +
            'AWS 公式パターンに準拠。',
        },
      ],
      true,
    );

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
    new cdk.CfnOutput(this, 'HarnessArn', {
      value: harnessArn,
      description: 'AgentCore Harness ARN',
    });

    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: stateMachine.attrArn,
      description: 'Step Functions ステートマシン ARN',
    });
  }
}
