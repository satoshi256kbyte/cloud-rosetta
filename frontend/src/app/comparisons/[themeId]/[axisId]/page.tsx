import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getComparisonMetadata } from '@/lib/dynamodb';
import { getComparisonResult } from '@/lib/s3';
import { ComparisonTable } from '@/components/ComparisonTable';
import { DataFreshnessWarning } from '@/components/DataFreshnessWarning';
import { ProviderFilter } from '@/components/ProviderFilter';

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ themeId: string; axisId: string }>;
  searchParams: Promise<{ providers?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { themeId, axisId } = await params;
  const title = `${themeId.replace(/-/g, ' ')} — ${axisId.replace(/-/g, ' ')}`;
  return {
    title: `${title} | cloud-rosetta`,
    description: `${themeId} の ${axisId} に関するクラウドサービス比較結果`,
  };
}

export default async function ComparisonPage({ params, searchParams }: PageProps) {
  const { themeId, axisId } = await params;
  const query = await searchParams;

  const metadata = await getComparisonMetadata(themeId, axisId);
  if (!metadata || metadata.status !== 'published') {
    notFound();
  }

  const result = await getComparisonResult(themeId, axisId, metadata.version);
  if (!result) {
    notFound();
  }

  const visibleProviders = query.providers
    ? query.providers.split(',').filter(Boolean)
    : undefined;

  const formattedDate = new Date(result.comparedAt).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div>
      <nav className="mb-4 text-sm text-gray-500">
        <a href="/" className="hover:text-blue-600">トップ</a>
        <span className="mx-2">›</span>
        <a href={`/comparisons/${themeId}`} className="hover:text-blue-600">{themeId}</a>
        <span className="mx-2">›</span>
        <span className="text-gray-700">{axisId}</span>
      </nav>

      <h1 className="mb-2 text-2xl font-bold text-gray-900">
        {axisId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
      </h1>
      <p className="mb-4 text-sm text-gray-500">比較日: {formattedDate}</p>

      <DataFreshnessWarning comparedAt={result.comparedAt} />

      <div className="mt-4">
        <ProviderFilter allProviders={result.providers.map((p) => p.name)} />
        <ComparisonTable providers={result.providers} visibleProviders={visibleProviders} />
      </div>
    </div>
  );
}
