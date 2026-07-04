import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { NagSuppressions } from 'cdk-nag';
import { Construct } from 'constructs';

export interface AmplifyRoleStackProps extends cdk.StackProps {
  stage: string;
}

/**
 * Amplify Hosting の SSR ランタイム用 IAM ロールを管理するスタック。
 *
 * Amplify App 自体は GitHub OAuth 連携が必要なため IaC 管轄外とし、
 * Console または CLI で作成する。このスタックで作成したロールを
 * `aws amplify update-app --iam-service-role-arn` で App に紐づける。
 */
export class AmplifyRoleStack extends cdk.Stack {
  public readonly role: iam.Role;

  constructor(scope: Construct, id: string, props: AmplifyRoleStackProps) {
    super(scope, id, {
      ...props,
      stackName: `cloud-rosetta-${props.stage}-stack-amplify-role`,
    });

    const { stage } = props;

    this.role = new iam.Role(this, 'AmplifySSRRole', {
      roleName: `cloud-rosetta-${stage}-iam-amplify-ssr`,
      assumedBy: new iam.ServicePrincipal('amplify.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess-Amplify'),
      ],
    });

    // DynamoDB 読み取り権限（テーブル + GSI）
    this.role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'DynamoDBRead',
        actions: ['dynamodb:GetItem', 'dynamodb:Query'],
        resources: [
          `arn:aws:dynamodb:${this.region}:${this.account}:table/cloud-rosetta-${stage}-ddb-comparison-metadata`,
          `arn:aws:dynamodb:${this.region}:${this.account}:table/cloud-rosetta-${stage}-ddb-comparison-metadata/index/ByStatus`,
        ],
      }),
    );

    // S3 読み取り権限
    this.role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'S3Read',
        actions: ['s3:GetObject'],
        resources: [
          `arn:aws:s3:::cloud-rosetta-${stage}-s3-comparison-data/comparisons/*`,
        ],
      }),
    );

    // Output: CLI で Amplify App に紐づける際に使用
    new cdk.CfnOutput(this, 'AmplifySSRRoleArn', {
      value: this.role.roleArn,
      description: 'Amplify SSR 用 IAM ロール ARN。aws amplify update-app --iam-service-role-arn に渡す',
    });

    // cdk-nag 抑制
    NagSuppressions.addResourceSuppressions(
      this.role,
      [
        {
          id: 'AwsSolutions-IAM4',
          reason:
            'AdministratorAccess-Amplify は Amplify Hosting のビルド・デプロイに必要な AWS マネージドポリシー。' +
            'Amplify 公式ドキュメントで推奨されている。',
          appliesTo: [
            'Policy::arn:<AWS::Partition>:iam::aws:policy/AdministratorAccess-Amplify',
          ],
        },
        {
          id: 'AwsSolutions-IAM5',
          reason:
            'S3 comparisons/* は比較結果ディレクトリ配下の全オブジェクト読み取りに必要。' +
            '特定プレフィックスに限定されたワイルドカードであり最小権限の原則に準拠。',
          appliesTo: [
            'Resource::arn:aws:s3:::cloud-rosetta-dev-s3-comparison-data/comparisons/*',
          ],
        },
      ],
      true,
    );
  }
}
