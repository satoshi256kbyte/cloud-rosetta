#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';
import { StorageStack } from '../lib/stacks/storage-stack';
import { AmplifyRoleStack } from '../lib/stacks/amplify-stack';
import { AgentStack } from '../lib/stacks/agent-stack';
import { applyTags } from '../lib/utils/tagging';

const app = new cdk.App();

// cdk-nag AwsSolutions パックを全スタックに適用
cdk.Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));

const stage = 'dev';

// Storage Stack
new StorageStack(app, 'StorageStack', {
  stage,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-northeast-1',
  },
});

// Amplify SSR 用 IAM ロール
new AmplifyRoleStack(app, 'AmplifyRoleStack', {
  stage,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-northeast-1',
  },
});

// AI エージェント実行基盤（AgentCore Harness: us-east-1）
new AgentStack(app, 'AgentStack', {
  stage,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
});

// 必須タグを全リソースに付与
applyTags(app, stage);

app.synth();
