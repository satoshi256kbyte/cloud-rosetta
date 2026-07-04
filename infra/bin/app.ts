#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';
import { DevStage } from '../lib/stages/dev';

const app = new cdk.App();

// cdk-nag AwsSolutions パックを全スタックに適用
cdk.Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));

// dev 環境
new DevStage(app, 'Dev', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-northeast-1',
  },
});

app.synth();
