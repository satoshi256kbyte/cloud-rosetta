import { getPublishedThemes } from '@/lib/dynamodb';
import { ThemeCard } from '@/components/ThemeCard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let themes: Awaited<ReturnType<typeof getPublishedThemes>> = [];
  let error = false;

  try {
    themes = await getPublishedThemes();
  } catch {
    error = true;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-800">データ取得エラー</h2>
        <p className="mt-2 text-sm text-red-600">
          比較データの取得に失敗しました。しばらくしてから再度お試しください。
        </p>
      </div>
    );
  }

  if (themes.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h2 className="text-lg font-semibold text-gray-700">比較データがまだありません</h2>
        <p className="mt-2 text-sm text-gray-500">
          比較テーマが追加されると、ここに一覧が表示されます。
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">クラウドサービス比較</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((theme) => (
          <ThemeCard
            key={`${theme.themeId}-${theme.axisId}`}
            themeId={theme.themeId}
            axisId={theme.axisId}
            updatedAt={theme.updatedAt}
          />
        ))}
      </div>
    </div>
  );
}
