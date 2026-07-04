import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { describe, it } from 'vitest';
import { ComparisonTable } from '../../lib/constructs/comparison-table';

function createTemplate(stage: string): Template {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'TestStack');
  new ComparisonTable(stack, 'TestTable', { stage });
  return Template.fromStack(stack);
}

describe('ComparisonTable', () => {
  const template = createTemplate('dev');

  it('パーティションキーが themeId であること', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      KeySchema: Match.arrayWith([
        Match.objectLike({ AttributeName: 'themeId', KeyType: 'HASH' }),
      ]),
    });
  });

  it('ソートキーが axisId であること', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      KeySchema: Match.arrayWith([
        Match.objectLike({ AttributeName: 'axisId', KeyType: 'RANGE' }),
      ]),
    });
  });

  it('オンデマンドキャパシティモードであること（FR-005）', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      BillingMode: 'PAY_PER_REQUEST',
    });
  });

  it('ポイントインタイムリカバリが有効であること（FR-005）', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true,
      },
    });
  });

  it('GSI ByStatus が定義されていること', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      GlobalSecondaryIndexes: Match.arrayWith([
        Match.objectLike({
          IndexName: 'ByStatus',
          KeySchema: Match.arrayWith([
            Match.objectLike({ AttributeName: 'status', KeyType: 'HASH' }),
            Match.objectLike({ AttributeName: 'updatedAt', KeyType: 'RANGE' }),
          ]),
          Projection: { ProjectionType: 'ALL' },
        }),
      ]),
    });
  });

  it('命名規約に従っていること（FR-006）', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'cloud-rosetta-dev-ddb-comparison-metadata',
    });
  });
});
