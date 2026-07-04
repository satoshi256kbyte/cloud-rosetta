import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { describe, it } from 'vitest';
import { ComparisonBucket } from '../../lib/constructs/comparison-bucket';

function createTemplate(stage: string): Template {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'TestStack');
  new ComparisonBucket(stack, 'TestBucket', { stage });
  return Template.fromStack(stack);
}

describe('ComparisonBucket', () => {
  const template = createTemplate('dev');

  it('SSE-S3 暗号化が有効であること（FR-004）', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: Match.arrayWith([
          Match.objectLike({
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          }),
        ]),
      },
    });
  });

  it('バージョニングが有効であること（FR-013）', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled',
      },
    });
  });

  it('パブリックアクセスがブロックされていること（FR-012）', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  it('アクセスログが設定されていること（FR-015）', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      LoggingConfiguration: Match.objectLike({
        LogFilePrefix: 'access-logs/',
      }),
    });
  });

  it('命名規約に従っていること（FR-006）', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'cloud-rosetta-dev-s3-comparison-data',
    });
  });

  it('ログバケットも作成されること', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'cloud-rosetta-dev-s3-comparison-logs',
    });
  });
});
