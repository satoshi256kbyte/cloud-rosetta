import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { AWS_CONFIG } from './aws-config';
import type { ComparisonMetadata, ThemeCardData, PaginatedThemes } from './types';

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: AWS_CONFIG.region }),
);

const ITEMS_PER_PAGE = 12;

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
 * 公開済みテーマをページネーション付きで取得する。
 * テーマ単位で集約し、各テーマの軸数・プロバイダー union を算出する。
 */
export async function getPublishedThemesPaginated(page: number = 1): Promise<PaginatedThemes> {
  const allItems = await getPublishedThemes();

  // themeId ごとに集約
  const themeMap = new Map<string, ComparisonMetadata[]>();
  for (const item of allItems) {
    const existing = themeMap.get(item.themeId) ?? [];
    existing.push(item);
    themeMap.set(item.themeId, existing);
  }

  // ThemeCardData に変換
  const themeCards: ThemeCardData[] = Array.from(themeMap.entries()).map(([themeId, items]) => {
    const providerSet = new Set<string>();
    let latestUpdate = '';
    for (const item of items) {
      if (item.providers) {
        for (const p of item.providers) providerSet.add(p);
      }
      if (!latestUpdate || item.updatedAt > latestUpdate) {
        latestUpdate = item.updatedAt;
      }
    }

    const first = items[0];
    return {
      themeId,
      title: first.title || themeId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      description: first.description || '',
      axisCount: items.length,
      providers: Array.from(providerSet),
      latestUpdate,
    };
  });

  // 最新更新日時で降順ソート
  themeCards.sort((a, b) => b.latestUpdate.localeCompare(a.latestUpdate));

  // ページネーション
  const totalItems = themeCards.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const themes = themeCards.slice(start, start + ITEMS_PER_PAGE);

  return {
    themes,
    pagination: { currentPage, totalPages, totalItems },
  };
}

/**
 * 特定テーマに属する公開済み比較軸の一覧を取得する
 */
export async function getAxesByTheme(themeId: string): Promise<ComparisonMetadata[]> {
  const result = await client.send(
    new QueryCommand({
      TableName: AWS_CONFIG.tableName,
      KeyConditionExpression: '#pk = :themeId',
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: { '#pk': 'themeId', '#status': 'status' },
      ExpressionAttributeValues: { ':themeId': themeId, ':status': 'published' },
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
  const result = await client.send(
    new GetCommand({
      TableName: AWS_CONFIG.tableName,
      Key: { themeId, axisId },
    }),
  );

  return (result.Item as ComparisonMetadata) ?? null;
}
