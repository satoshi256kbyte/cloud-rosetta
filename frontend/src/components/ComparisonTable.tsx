import type { Provider } from '@/lib/types';

interface ComparisonTableProps {
  providers: Provider[];
  visibleProviders?: string[];
}

export function ComparisonTable({ providers, visibleProviders }: ComparisonTableProps) {
  const filtered = visibleProviders?.length
    ? providers.filter((p) => visibleProviders.includes(p.name))
    : providers;

  if (filtered.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        表示するプロバイダーがありません。フィルタを変更してください。
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full min-w-[600px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left font-semibold text-gray-700">
              属性
            </th>
            {filtered.map((provider) => (
              <th
                key={provider.name}
                className="px-4 py-3 text-left font-semibold text-gray-700"
              >
                {provider.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-100">
            <td className="sticky left-0 bg-white px-4 py-3 font-medium text-gray-700">
              サービス名
            </td>
            {filtered.map((provider) => (
              <td key={provider.name} className="px-4 py-3 text-gray-900">
                {provider.serviceName}
              </td>
            ))}
          </tr>
          <tr className="border-b border-gray-100 bg-gray-50/50">
            <td className="sticky left-0 bg-gray-50/50 px-4 py-3 font-medium text-gray-700">
              要約
            </td>
            {filtered.map((provider) => (
              <td key={provider.name} className="px-4 py-3 text-gray-700">
                {provider.summary}
              </td>
            ))}
          </tr>
          <tr className="border-b border-gray-100">
            <td className="sticky left-0 bg-white px-4 py-3 font-medium text-gray-700">
              詳細
            </td>
            {filtered.map((provider) => (
              <td key={provider.name} className="px-4 py-3 text-gray-600">
                {provider.details || '—'}
              </td>
            ))}
          </tr>
          <tr>
            <td className="sticky left-0 bg-gray-50/50 px-4 py-3 font-medium text-gray-700">
              参照元
            </td>
            {filtered.map((provider) => (
              <td key={provider.name} className="px-4 py-3">
                <ul className="space-y-1">
                  {provider.sources.map((source) => (
                    <li key={source}>
                      <a
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {new URL(source).hostname}
                      </a>
                    </li>
                  ))}
                </ul>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
