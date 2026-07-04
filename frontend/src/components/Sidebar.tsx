import Link from 'next/link';
import { getPublishedThemes } from '@/lib/dynamodb';

export async function Sidebar() {
  let themes: { themeId: string; axisId: string }[] = [];

  try {
    themes = await getPublishedThemes();
  } catch {
    // SSR 時に DynamoDB 接続エラーが発生した場合は空リストで表示
  }

  // テーマごとにグループ化
  const themeGroups = themes.reduce(
    (acc, item) => {
      if (!acc[item.themeId]) acc[item.themeId] = [];
      acc[item.themeId].push(item.axisId);
      return acc;
    },
    {} as Record<string, string[]>,
  );

  return (
    <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-gray-50 p-4 md:block">
      <nav>
        <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">テーマ一覧</h2>
        {Object.keys(themeGroups).length === 0 ? (
          <p className="text-sm text-gray-400">テーマがありません</p>
        ) : (
          <ul className="space-y-2">
            {Object.entries(themeGroups).map(([themeId, axes]) => (
              <li key={themeId}>
                <span className="text-sm font-medium text-gray-700">{themeId}</span>
                <ul className="ml-3 mt-1 space-y-1">
                  {axes.map((axisId) => (
                    <li key={axisId}>
                      <Link
                        href={`/comparisons/${themeId}/${axisId}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {axisId}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </aside>
  );
}
