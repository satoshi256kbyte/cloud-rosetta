import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import { NagSuppressions } from 'cdk-nag';
import { Construct } from 'constructs';

export interface AgentStackProps extends cdk.StackProps {
  stage: string;
}

/**
 * AIエージェント比較実行基盤スタック。
 *
 * AgentCore Harness は CDK で直接作成できないため、
 * CLI/Console で事前に作成し、ARN を環境変数で渡す。
 * Step Functions ステートマシンは CDK で管理する。
 */
export class AgentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AgentStackProps) {
    super(scope, id, {
      ...props,
      stackName: `cloud-rosetta-${props.stage}-stack-agent`,
    });

    const { stage } = props;

    // AgentCore Harness ARN（事前に CLI/Console で作成）
    const harnessArn = new cdk.CfnParameter(this, 'HarnessArn', {
      type: 'String',
      description: 'AgentCore Harness ARN（事前作成済み）',
      default: `arn:aws:bedrock-agentcore:ap-northeast-1:${this.account}:runtime/cloud-rosetta-${stage}-comparison-agent`,
    });

    // Step Functions 実行ロール
    const sfnRole = new iam.Role(this, 'StepFunctionsRole', {
      roleName: `cloud-rosetta-${stage}-iam-sfn-agent`,
      assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
    });

    // AgentCore InvokeHarness 権限
    sfnRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'InvokeAgentCore',
        actions: ['bedrock-agentcore:InvokeHarness'],
        resources: [harnessArn.valueAsString],
      }),
    );

    // Guardrails 権限（アカウントレベルの強制 Guardrail がある場合に必要）
    sfnRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'ApplyGuardrail',
        actions: ['bedrock:ApplyGuardrail'],
        resources: ['*'],
      }),
    );

    // Step Functions ログ出力先
    const logGroup = new logs.LogGroup(this, 'SfnLogGroup', {
      logGroupName: `/aws/stepfunctions/cloud-rosetta-${stage}-sfn-comparison-agent`,
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Step Functions ステートマシン定義
    const definition = {
      Comment: 'cloud-rosetta 比較エージェント実行ワークフロー',
      StartAt: 'InvokeComparisonAgent',
      States: {
        InvokeComparisonAgent: {
          Type: 'Task',
          Resource: 'arn:aws:states:::bedrock-agentcore:invokeHarness',
          Parameters: {
            'HarnessIdentifier': harnessArn.valueAsString,
            'Input': {
              'Messages': [
                {
                  'Role': 'user',
                  'Content': [
                    {
                      'Text.$': '$.prompt',
                    },
                  ],
                },
              ],
            },
          },
          TimeoutSeconds: 900,
          ResultPath: '$.agentResult',
          Next: 'Done',
          Catch: [
            {
              ErrorEquals: ['States.ALL'],
              Next: 'Failed',
              ResultPath: '$.error',
            },
          ],
        },
        Done: {
          Type: 'Succeed',
        },
        Failed: {
          Type: 'Fail',
          Cause: 'AgentCore invocation failed',
          Error: 'AgentInvocationError',
        },
      },
    };

    const stateMachine = new sfn.CfnStateMachine(this, 'ComparisonAgentSfn', {
      stateMachineName: `cloud-rosetta-${stage}-sfn-comparison-agent`,
      definitionString: JSON.stringify(definition),
      roleArn: sfnRole.roleArn,
      tracingConfiguration: { enabled: true },
      loggingConfiguration: {
        destinations: [
          {
            cloudWatchLogsLogGroup: {
              logGroupArn: logGroup.logGroupArn,
            },
          },
        ],
        includeExecutionData: true,
        level: 'ALL',
      },
    });

    // CloudWatch Logs 権限を Step Functions ロールに追加
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

    // X-Ray 権限
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

    // cdk-nag 抑制: Guardrail の * リソースは AWS 要件
    NagSuppressions.addResourceSuppressions(
      sfnRole,
      [
        {
          id: 'AwsSolutions-IAM5',
          reason:
            'bedrock:ApplyGuardrail はアカウントレベルの強制 Guardrail 対応に必要。' +
            '特定リソース指定が不可能な権限。',
        },
      ],
      true,
    );

    // Outputs
    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: stateMachine.attrArn,
      description: 'Step Functions ステートマシン ARN',
    });

    new cdk.CfnOutput(this, 'StateMachineName', {
      value: `cloud-rosetta-${stage}-sfn-comparison-agent`,
      description: 'Step Functions ステートマシン名',
    });
  }
}
