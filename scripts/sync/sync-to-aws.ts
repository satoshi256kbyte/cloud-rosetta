import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { ChangeEntry } from './detect-changes.js';

const REGION = process.env.AWS_REGION || 'ap-northeast-1';
const STAGE = process.env.STAGE || 'dev';
const TABLE_NAME = `cloud-rosetta-${STAGE}-ddb-comparison-metadata`;
const BUCKET_NAME = `cloud-rosetta-${STAGE}-s3-comparison-data`;

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
const s3Client = new S3Client({ region: REGION });

// スキーマバリデーション（FR-014: 同期前に再度バリデーション）
const schemaPath = resolve(import.meta.dirname ?? '.', '../validate/schema.json');
const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validateSchema = ajv.compile(schema);

export interface SyncResult {
  synced: Array<{ themeId: string; axisId: string; version: number }>;
  failed: Array<{ themeId: string; axisId: string; error: string }>;
}

/**
 * パストラバーサル防止チェック（FR-018）
 */
function validatePathSafety(id: string): boolean {
  return !id.includes('..') && !id.includes('/') && !id.includes('\\');
}

export async function syncToAws(
  entries: ChangeEntry[],
  comparisonsDir: string,
): Promise<SyncResult> {
  const result: SyncResult = { synced: [], failed: [] };

  for (const entry of entries) {
    const { themeId, axisId } = entry;

    try {
      // パストラバーサルチェック（FR-018）
      if (!validatePathSafety(themeId) || !validatePathSafety(axisId)) {
        result.failed.push({ themeId, axisId, error: 'Invalid path characters detected' });
        continue;
      }

      // result.json 読み込み
      const filePath = resolve(comparisonsDir, themeId, axisId, 'result.json');
      const content = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      // スキーマ再バリデーション（FR-014）
      if (!validateSchema(data)) {
        const errors = validateSchema.errors?.map((e) => e.message).join('; ') ?? 'Unknown error';
        result.failed.push({ themeId, axisId, error: `Schema validation failed: ${errors}` });
        continue;
      }

      // DynamoDB から現在の version を取得
      const getResult = await dynamoClient.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: { themeId, axisId },
          ProjectionExpression: 'version',
        }),
      );
      const currentVersion = (getResult.Item?.version as number) ?? 0;
      const newVersion = currentVersion + 1;

      // DynamoDB PutItem（冪等性保証: FR-011）
      const now = new Date().toISOString();
      await dynamoClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            themeId,
            axisId,
            status: 'published',
            version: newVersion,
            updatedAt: now,
            createdAt: currentVersion === 0 ? now : undefined,
            createdBy: data.comparedBy,
          },
          ConditionExpression:
            currentVersion === 0
              ? 'attribute_not_exists(themeId)'
              : 'version = :expectedVersion',
          ExpressionAttributeValues:
            currentVersion === 0 ? undefined : { ':expectedVersion': currentVersion },
        }),
      );

      // S3 PutObject
      try {
        const s3Key = `comparisons/${themeId}/${axisId}/v${newVersion}/result.json`;
        await s3Client.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: content,
            ContentType: 'application/json',
          }),
        );
      } catch (s3Error) {
        // S3 失敗時は DynamoDB をロールバック（FR-007）
        if (currentVersion === 0) {
          await dynamoClient.send(
            new DeleteCommand({ TableName: TABLE_NAME, Key: { themeId, axisId } }),
          );
        } else {
          await dynamoClient.send(
            new PutCommand({
              TableName: TABLE_NAME,
              Item: {
                themeId,
                axisId,
                status: 'draft',
                version: currentVersion,
                updatedAt: now,
              },
            }),
          );
        }
        const errMsg = s3Error instanceof Error ? s3Error.message : 'S3 PutObject failed';
        result.failed.push({ themeId, axisId, error: errMsg });
        continue;
      }

      result.synced.push({ themeId, axisId, version: newVersion });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      result.failed.push({ themeId, axisId, error: errMsg });
    }
  }

  return result;
}

// CLI エントリーポイント
const isMain = process.argv[1]?.endsWith('sync-to-aws.ts');
if (isMain) {
  const input = readFileSync('/dev/stdin', 'utf-8');
  const entries: ChangeEntry[] = JSON.parse(input);
  const comparisonsDir = resolve(import.meta.dirname ?? '.', '../../comparisons');
  const result = await syncToAws(entries, comparisonsDir);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.failed.length > 0 ? 1 : 0);
}
