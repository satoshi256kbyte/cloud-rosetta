const stage = process.env.STAGE || 'dev';

export const AWS_CONFIG = {
  region: 'ap-northeast-1',
  stage,
  tableName: `cloud-rosetta-${stage}-ddb-comparison-metadata`,
  bucketName: `cloud-rosetta-${stage}-s3-comparison-data`,
  gsiByStatus: 'ByStatus',
} as const;
