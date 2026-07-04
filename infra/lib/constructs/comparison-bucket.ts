import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface ComparisonBucketProps {
  /** 環境ステージ名 */
  stage: string;
}

export class ComparisonBucket extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly logBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: ComparisonBucketProps) {
    super(scope, id);

    const { stage } = props;
    const isProd = stage === 'prod';

    // アクセスログ用バケット（FR-015）
    this.logBucket = new s3.Bucket(this, 'LogBucket', {
      bucketName: `cloud-rosetta-${stage}-s3-comparison-logs`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: !isProd,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
    });

    // 比較結果データバケット
    this.bucket = new s3.Bucket(this, 'DataBucket', {
      bucketName: `cloud-rosetta-${stage}-s3-comparison-data`,
      // FR-004: SSE-S3 暗号化
      encryption: s3.BucketEncryption.S3_MANAGED,
      // FR-012: Block Public Access 4項目すべて有効
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      // FR-013: バージョニング有効
      versioned: true,
      // FR-015: アクセスログ
      serverAccessLogsBucket: this.logBucket,
      serverAccessLogsPrefix: 'access-logs/',
      // FR-017: 環境別削除ポリシー
      removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: !isProd,
      // SSL 必須
      enforceSSL: true,
    });
  }
}
