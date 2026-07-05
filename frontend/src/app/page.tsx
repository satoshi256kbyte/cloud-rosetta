import type { Metadata } from 'next';
import { getPublishedThemesPaginated } from '@/lib/dynamodb';
import { ThemeCard } from '@/components/ThemeCard';
import { Pagination } from '@/components/Pagination';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'cloud-rosetta — クラウドサービス比較',
  description:
    'AWS・GCP・Azure・Akamai・Cloudflare などクラウドサービスをテーマ別・比較軸別に横断比較するサイトです。',
};

interface HomePageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);

  let result: Awaited<ReturnType<typeof getPublishedThemesPaginated>> | null = null;
  let error = false;

  try {
    result = await getPublishedThemesPaginated(page);
  } catch {
    error = true;
  }

  if (error || !result) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-800">データ取得エラー</h2>
        <p className="mt-2 text-sm text-red-600">
          比較データの取得に失敗しました。しばらくしてから再度お試しください。
        </p>
      </div>
    );
  }

  if (result.themes.length === 0 && page === 1) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h2 className="text-lg font-semibold text-gray-700">比較データはまだありません</h2>
        <p className="mt-2 text-sm text-gray-500">
          比較テーマが追加されると、ここに一覧が表示されます。
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">クラウドサービス比較</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {result.themes.map((theme) => (
          <ThemeCard key={theme.themeId} theme={theme} />
        ))}
      </div>
      <Pagination pagination={result.pagination} />
    </div>
  );
}
