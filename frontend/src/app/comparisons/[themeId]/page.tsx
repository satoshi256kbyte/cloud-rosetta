import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getAxesByTheme } from '@/lib/dynamodb';

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ themeId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { themeId } = await params;
  const title = themeId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return {
    title: `${title} の比較 | cloud-rosetta`,
    description: `${title} に関するクラウドサービス比較軸の一覧`,
  };
}

export default async function ThemeAxesPage({ params }: PageProps) {
  const { themeId } = await params;

  const axes = await getAxesByTheme(themeId);

  if (axes.length === 0) {
    notFound();
  }

  // 軸が 1 つのみの場合は比較結果ページに直接リダイレクト（FR-006）
  if (axes.length === 1) {
    redirect(`/comparisons/${themeId}/${axes[0].axisId}`);
  }

  const themeTitle = axes[0].title || themeId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div>
      <nav className="mb-4 text-sm text-gray-500">
        <a href="/" className="hover:text-blue-600">トップ</a>
        <span className="mx-2">›</span>
        <span className="text-gray-700">{themeTitle}</span>
      </nav>

      <h1 className="mb-6 text-2xl font-bold text-gray-900">{themeTitle}</h1>

      <div className="space-y-3">
        {axes.map((axis) => {
          const axisTitle = axis.axisTitle || axis.axisId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          const formattedDate = new Date(axis.updatedAt).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

          return (
            <Link
              key={axis.axisId}
              href={`/comparisons/${themeId}/${axis.axisId}`}
              className="block rounded-lg border border-gray-200 p-4 transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">{axisTitle}</h3>
                <span className="text-xs text-gray-400">{formattedDate}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
