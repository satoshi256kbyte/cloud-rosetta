import Link from 'next/link';
import type { ThemeCardData } from '@/lib/types';

interface ThemeCardProps {
  theme: ThemeCardData;
}

const PROVIDER_COLORS: Record<string, string> = {
  AWS: 'bg-orange-100 text-orange-800',
  GCP: 'bg-blue-100 text-blue-800',
  Azure: 'bg-sky-100 text-sky-800',
  Akamai: 'bg-cyan-100 text-cyan-800',
  Cloudflare: 'bg-amber-100 text-amber-800',
};

export function ThemeCard({ theme }: ThemeCardProps) {
  const formattedDate = new Date(theme.latestUpdate).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Link
      href={`/comparisons/${theme.themeId}`}
      className="block rounded-lg border border-gray-200 p-5 transition hover:border-blue-300 hover:shadow-md"
    >
      <h3 className="text-lg font-semibold text-gray-900">{theme.title}</h3>
      {theme.description && (
        <p className="mt-1 line-clamp-2 text-sm text-gray-600">{theme.description}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {theme.providers.map((provider) => (
          <span
            key={provider}
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${PROVIDER_COLORS[provider] || 'bg-gray-100 text-gray-700'}`}
          >
            {provider}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
        <span>{theme.axisCount} 比較軸</span>
        <span>更新: {formattedDate}</span>
      </div>
    </Link>
  );
}
