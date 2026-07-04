import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ComparisonBucket } from '../constructs/comparison-bucket';
import { ComparisonTable } from '../constructs/comparison-table';

export interface StorageStackProps extends cdk.StackProps {
  /** 環境ステージ名（dev / stg / prod） */
  stage: string;
}

export class StorageStack extends cdk.Stack {
  public readonly comparisonBucket: ComparisonBucket;
  public readonly comparisonTable: ComparisonTable;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, {
      ...props,
      stackName: `cloud-rosetta-${props.stage}-stack-storage`,
    });

    const { stage } = props;

    this.comparisonBucket = new ComparisonBucket(this, 'ComparisonBucket', { stage });
    this.comparisonTable = new ComparisonTable(this, 'ComparisonTable', { stage });

    // CfnOutput
    new cdk.CfnOutput(this, 'ComparisonBucketName', {
      value: this.comparisonBucket.bucket.bucketName,
      description: '比較結果データ S3 バケット名',
    });

    new cdk.CfnOutput(this, 'ComparisonBucketArn', {
      value: this.comparisonBucket.bucket.bucketArn,
      description: '比較結果データ S3 バケット ARN',
    });

    new cdk.CfnOutput(this, 'ComparisonTableName', {
      value: this.comparisonTable.table.tableName,
      description: '比較メタデータ DynamoDB テーブル名',
    });

    new cdk.CfnOutput(this, 'ComparisonTableArn', {
      value: this.comparisonTable.table.tableArn,
      description: '比較メタデータ DynamoDB テーブル ARN',
    });
  }
}
