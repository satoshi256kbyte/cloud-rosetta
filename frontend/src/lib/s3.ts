import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { AWS_CONFIG } from './aws-config';
import type { ComparisonResult } from './types';

export type { ComparisonResult, Provider } from './types';

const client = new S3Client({ region: AWS_CONFIG.region });

/**
 * S3 から比較結果 JSON を取得する
 */
export async function getComparisonResult(
  themeId: string,
  axisId: string,
  version: number,
): Promise<ComparisonResult | null> {
  const key = `comparisons/${themeId}/${axisId}/v${version}/result.json`;

  try {
    const result = await client.send(
      new GetObjectCommand({
        Bucket: AWS_CONFIG.bucketName,
        Key: key,
      }),
    );

    const body = await result.Body?.transformToString();
    if (!body) return null;

    return JSON.parse(body) as ComparisonResult;
  } catch (error) {
    if ((error as { name?: string }).name === 'NoSuchKey') {
      return null;
    }
    throw error;
  }
}
