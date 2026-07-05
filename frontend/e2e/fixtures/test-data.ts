/** E2E テスト用モックデータ */

export const MOCK_THEMES_RESPONSE = [
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

export const MOCK_COMPARISON_RESULT = {
  themeId: 'serverless-compute',
  axisId: 'cold-start',
  providers: [
    {
      name: 'AWS',
      serviceName: 'AWS Lambda',
      summary: 'コールドスタートは実行環境初期化時に発生。プロビジョンドコンcurrencyで軽減可能。',
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
};

export const MOCK_COMPARISON_RESULT_STALE = {
  ...MOCK_COMPARISON_RESULT,
  comparedAt: '2026-01-01T00:00:00Z', // 90日以上前
};

export const MOCK_EMPTY_THEMES: never[] = [];
