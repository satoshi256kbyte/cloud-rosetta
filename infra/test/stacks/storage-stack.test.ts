import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { describe, it, expect } from 'vitest';
import { StorageStack } from '../../lib/stacks/storage-stack';

describe('StorageStack', () => {
  it('スタックが正常にシンセサイズできること', () => {
    const app = new cdk.App();
    const stack = new StorageStack(app, 'TestStorageStack', {
      stage: 'dev',
      env: { account: '123456789012', region: 'ap-northeast-1' },
    });

    const template = Template.fromStack(stack);
    expect(template.toJSON()).toBeDefined();
  });

  it('スタック名が命名規約に従っていること', () => {
    const app = new cdk.App();
    const stack = new StorageStack(app, 'TestStorageStack', {
      stage: 'dev',
      env: { account: '123456789012', region: 'ap-northeast-1' },
    });

    expect(stack.stackName).toBe('cloud-rosetta-dev-stack-storage');
  });
});
