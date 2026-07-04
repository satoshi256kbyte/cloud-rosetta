import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export interface ComparisonTableProps {
  /** 環境ステージ名 */
  stage: string;
}

export class ComparisonTable extends Construct {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: ComparisonTableProps) {
    super(scope, id);

    const { stage } = props;
    const isProd = stage === 'prod';

    // FR-005: オンデマンドキャパシティ + PITR
    // FR-011: AWS managed key 暗号化
    // FR-018: prod で DeletionProtection
    this.table = new dynamodb.Table(this, 'Table', {
      tableName: `cloud-rosetta-${stage}-ddb-comparison-metadata`,
      partitionKey: { name: 'themeId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'axisId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.DEFAULT,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      deletionProtection: isProd,
    });

    // GSI: ByStatus（PK=status, SK=updatedAt）
    this.table.addGlobalSecondaryIndex({
      indexName: 'ByStatus',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'updatedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
  }
}
