'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

interface ProviderFilterProps {
  allProviders: string[];
}

const PROVIDER_COLORS: Record<string, string> = {
  AWS: 'border-orange-300 bg-orange-50 text-orange-800',
  GCP: 'border-blue-300 bg-blue-50 text-blue-800',
  Azure: 'border-sky-300 bg-sky-50 text-sky-800',
  Akamai: 'border-cyan-300 bg-cyan-50 text-cyan-800',
  Cloudflare: 'border-amber-300 bg-amber-50 text-amber-800',
};

const PROVIDER_COLORS_ACTIVE: Record<string, string> = {
  AWS: 'border-orange-500 bg-orange-100 text-orange-900 ring-2 ring-orange-300',
  GCP: 'border-blue-500 bg-blue-100 text-blue-900 ring-2 ring-blue-300',
  Azure: 'border-sky-500 bg-sky-100 text-sky-900 ring-2 ring-sky-300',
  Akamai: 'border-cyan-500 bg-cyan-100 text-cyan-900 ring-2 ring-cyan-300',
  Cloudflare: 'border-amber-500 bg-amber-100 text-amber-900 ring-2 ring-amber-300',
};

export function ProviderFilter({ allProviders }: ProviderFilterProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentFilter = searchParams.get('providers')?.split(',').filter(Boolean) ?? [];
  const hasFilter = currentFilter.length > 0;

  const toggleProvider = useCallback(
    (provider: string) => {
      const params = new URLSearchParams(searchParams.toString());
      let newFilter: string[];

      if (currentFilter.includes(provider)) {
        newFilter = currentFilter.filter((p) => p !== provider);
      } else {
        newFilter = [...currentFilter, provider];
      }

      if (newFilter.length === 0 || newFilter.length === allProviders.length) {
        params.delete('providers');
      } else {
        params.set('providers', newFilter.join(','));
      }

      const query = params.toString();
      router.push(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
    },
    [searchParams, currentFilter, allProviders, router, pathname],
  );

  const resetFilter = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('providers');
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
  }, [searchParams, router, pathname]);

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-600">フィルタ:</span>
        {allProviders.map((provider) => {
          const isActive = !hasFilter || currentFilter.includes(provider);
          const colorClass = isActive
            ? PROVIDER_COLORS_ACTIVE[provider] || 'border-gray-500 bg-gray-100 text-gray-900 ring-2 ring-gray-300'
            : PROVIDER_COLORS[provider] || 'border-gray-200 bg-gray-50 text-gray-600';

          return (
            <button
              key={provider}
              type="button"
              onClick={() => toggleProvider(provider)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${colorClass}`}
              aria-pressed={isActive}
              aria-label={`${provider} を${isActive ? '非表示' : '表示'}にする`}
            >
              {provider}
            </button>
          );
        })}
        {hasFilter && (
          <button
            type="button"
            onClick={resetFilter}
            className="ml-2 text-xs text-gray-500 underline hover:text-gray-700"
          >
            リセット
          </button>
        )}
      </div>
    </div>
  );
}
