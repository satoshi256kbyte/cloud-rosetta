import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { AWS_CONFIG } from './aws-config';

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: AWS_CONFIG.region }),
);

export interface ComparisonMetadata {
  themeId: string;
  axisId: string;
  status: string;
  version: number;
  updatedAt: string;
  title?: string;
  axisTitle?: string;
  createdBy?: string;
}

/**
 * 公開済み（published）のテーマ一覧を更新日時の降順で取得する
 */
export async function getPublishedThemes(): Promise<ComparisonMetadata[]> {
  const result = await client.send(
    new QueryCommand({
      TableName: AWS_CONFIG.tableName,
      IndexName: AWS_CONFIG.gsiByStatus,
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': 'published' },
      ScanIndexForward: false,
    }),
  );

  return (result.Items as ComparisonMetadata[]) ?? [];
}

/**
 * 特定テーマ・軸のメタデータを取得する
 */
export async function getComparisonMetadata(
  themeId: string,
  axisId: string,
): Promise<ComparisonMetadata | null> {
  const { GetCommand } = await import('@aws-sdk/lib-dynamodb');
  const result = await client.send(
    new GetCommand({
      TableName: AWS_CONFIG.tableName,
      Key: { themeId, axisId },
    }),
  );

  return (result.Item as ComparisonMetadata) ?? null;
}
