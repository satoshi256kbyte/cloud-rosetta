import type { Provider } from '@/lib/s3';

interface ComparisonTableProps {
  providers: Provider[];
}

export function ComparisonTable({ providers }: ComparisonTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left font-semibold text-gray-700">プロバイダー</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">サービス名</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">概要</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">参照元</th>
          </tr>
        </thead>
        <tbody>
          {providers.map((provider) => (
            <tr key={provider.name} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{provider.name}</td>
              <td className="px-4 py-3 text-gray-700">{provider.serviceName}</td>
              <td className="px-4 py-3 text-gray-600">{provider.summary}</td>
              <td className="px-4 py-3">
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
