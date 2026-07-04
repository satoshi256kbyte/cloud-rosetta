#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';
import { StorageStack } from '../lib/stacks/storage-stack';
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

// 必須タグを全リソースに付与
applyTags(app, stage);

app.synth();
