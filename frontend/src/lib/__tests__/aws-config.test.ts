import { describe, it, expect } from 'vitest';

describe('AWS_CONFIG', () => {
  it('STAGE 環境変数からリソース名が導出されること', async () => {
    process.env.STAGE = 'dev';
    // モジュールを再読み込み
    const { AWS_CONFIG } = await import('../aws-config');
    expect(AWS_CONFIG.tableName).toBe('cloud-rosetta-dev-ddb-comparison-metadata');
    expect(AWS_CONFIG.bucketName).toBe('cloud-rosetta-dev-s3-comparison-data');
    expect(AWS_CONFIG.region).toBe('ap-northeast-1');
  });
});
