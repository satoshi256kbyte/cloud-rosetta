import * as cdk from 'aws-cdk-lib';
import * as amplify from 'aws-cdk-lib/aws-amplify';
import * as iam from 'aws-cdk-lib/aws-iam';
import { NagSuppressions } from 'cdk-nag';
import { Construct } from 'constructs';

export interface AmplifyStackProps extends cdk.StackProps {
  stage: string;
  repositoryOwner: string;
  repositoryName: string;
}

export class AmplifyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AmplifyStackProps) {
    super(scope, id, {
      ...props,
      stackName: `cloud-rosetta-${props.stage}-stack-amplify`,
    });

    const { stage, repositoryOwner, repositoryName } = props;

    // Amplify SSR 用 IAM ロール（DynamoDB/S3 読み取り権限）
    const amplifyRole = new iam.Role(this, 'AmplifySSRRole', {
      roleName: `cloud-rosetta-${stage}-iam-amplify-ssr`,
      assumedBy: new iam.ServicePrincipal('amplify.amazonaws.com'),
    });

    // DynamoDB 読み取り権限（Query on GSI 含む）
    amplifyRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:GetItem', 'dynamodb:Query'],
        resources: [
          `arn:aws:dynamodb:${this.region}:${this.account}:table/cloud-rosetta-${stage}-ddb-comparison-metadata`,
          `arn:aws:dynamodb:${this.region}:${this.account}:table/cloud-rosetta-${stage}-ddb-comparison-metadata/index/ByStatus`,
        ],
      }),
    );

    // S3 読み取り権限
    amplifyRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [
          `arn:aws:s3:::cloud-rosetta-${stage}-s3-comparison-data/comparisons/*`,
        ],
      }),
    );

    // cdk-nag 抑制: S3 プレフィックスワイルドカードは比較結果ディレクトリ配下の読み取りに必要
    NagSuppressions.addResourceSuppressions(
      amplifyRole,
      [
        {
          id: 'AwsSolutions-IAM5',
          reason:
            'S3 comparisons/* は比較結果ディレクトリ配下の全オブジェクト読み取りに必要。' +
            '特定リソースパス配下に限定されたワイルドカードであり最小権限の原則に準拠。',
          appliesTo: [
            'Resource::arn:aws:s3:::cloud-rosetta-dev-s3-comparison-data/comparisons/*',
          ],
        },
      ],
      true,
    );

    // Amplify App
    const app = new amplify.CfnApp(this, 'AmplifyApp', {
      name: `cloud-rosetta-${stage}`,
      repository: `https://github.com/${repositoryOwner}/${repositoryName}`,
      platform: 'WEB_COMPUTE',
      iamServiceRole: amplifyRole.roleArn,
      environmentVariables: [
        { name: 'STAGE', value: stage },
        { name: '_CUSTOM_IMAGE', value: 'amplify:al2023' },
      ],
      buildSpec: cdk.Fn.sub(`version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/.next
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
      - frontend/.next/cache/**/*
`),
    });

    // main ブランチ
    new amplify.CfnBranch(this, 'MainBranch', {
      appId: app.attrAppId,
      branchName: 'main',
      enableAutoBuild: true,
      framework: 'Next.js - SSR',
      stage: 'PRODUCTION',
      environmentVariables: [{ name: 'STAGE', value: stage }],
    });

    // Outputs
    new cdk.CfnOutput(this, 'AmplifyAppId', {
      value: app.attrAppId,
      description: 'Amplify App ID',
    });

    new cdk.CfnOutput(this, 'AmplifyDefaultDomain', {
      value: app.attrDefaultDomain,
      description: 'Amplify Default Domain',
    });
  }
}
