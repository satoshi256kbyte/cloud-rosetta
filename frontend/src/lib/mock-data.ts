/**
 * E2E テスト・CI 用モックデータ
 * USE_MOCK_DATA=true 設定時に DynamoDB/S3 の代わりに使用される
 */
import type { ComparisonMetadata, ComparisonResult } from './types';

export const MOCK_THEMES: ComparisonMetadata[] = [
  {
    themeId: 'serverless-compute',
    axisId: 'cold-start',
    status: 'published',
    version: 1,
    title: 'Serverless Compute',
    description: 'サーバーレスコンピューティングサービスの比較',
    updatedAt: '2026-07-01T00:00:00Z',
    providers: ['AWS', 'GCP'],
  },
  {
    themeId: 'serverless-compute',
    axisId: 'pricing',
    status: 'published',
    version: 1,
    title: 'Serverless Compute',
    description: 'サーバーレスコンピューティングサービスの比較',
    updatedAt: '2026-06-15T00:00:00Z',
    providers: ['AWS', 'GCP', 'Azure'],
  },
  {
    themeId: 'cdn-comparison',
    axisId: 'edge-functions',
    status: 'published',
    version: 1,
    title: 'CDN Comparison',
    description: 'CDNサービスの比較',
    updatedAt: '2026-07-03T00:00:00Z',
    providers: ['AWS', 'Cloudflare', 'Akamai'],
  },
];

export const MOCK_COMPARISON_RESULTS: Record<string, ComparisonResult> = {
  'serverless-compute/cold-start': {
    themeId: 'serverless-compute',
    axisId: 'cold-start',
    providers: [
      {
        name: 'AWS',
        serviceName: 'AWS Lambda',
        summary: 'コールドスタートは実行環境初期化時に発生。',
        details: 'AWS Lambdaでは関数呼び出し時に実行環境が存在しない場合、コールドスタートが発生します。',
        sources: ['https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html'],
      },
      {
        name: 'GCP',
        serviceName: 'Cloud Functions',
        summary: 'GCP Cloud Functionsのコールドスタートは初期化フェーズで発生。',
        details: 'Cloud Functionsでは関数の初回起動時にコールドスタートが発生する可能性があります。',
        sources: ['https://cloud.google.com/functions/docs/concepts/exec'],
      },
    ],
    comparedAt: '2026-07-01T12:00:00Z',
    comparedBy: 'agent',
  },
};
