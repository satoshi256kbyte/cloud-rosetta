import { notFound } from 'next/navigation';
import { getComparisonMetadata } from '@/lib/dynamodb';
import { getComparisonResult } from '@/lib/s3';
import { ComparisonTable } from '@/components/ComparisonTable';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ themeId: string; axisId: string }>;
}

export default async function ComparisonDetailPage({ params }: PageProps) {
  const { themeId, axisId } = await params;

  // メタデータ取得
  const metadata = await getComparisonMetadata(themeId, axisId);
  if (!metadata) {
    notFound();
  }

  // 比較結果取得
  let result;
  try {
    result = await getComparisonResult(themeId, axisId, metadata.version);
  } catch {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-800">データ取得エラー</h2>
        <p className="mt-2 text-sm text-red-600">
          比較結果の取得に失敗しました。しばらくしてから再度お試しください。
        </p>
      </div>
    );
  }

  if (!result) {
    notFound();
  }

  const formattedDate = new Date(result.comparedAt).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">{themeId}</h1>
      <p className="mb-1 text-lg text-gray-600">{axisId}</p>
      <p className="mb-6 text-sm text-gray-400">
        比較日: {formattedDate} / 比較者: {result.comparedBy}
      </p>
      <ComparisonTable providers={result.providers} />
    </div>
  );
}
