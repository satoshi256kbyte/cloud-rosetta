import Link from 'next/link';

interface ThemeCardProps {
  themeId: string;
  axisId: string;
  updatedAt: string;
}

export function ThemeCard({ themeId, axisId, updatedAt }: ThemeCardProps) {
  const formattedDate = new Date(updatedAt).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Link
      href={`/comparisons/${themeId}/${axisId}`}
      className="block rounded-lg border border-gray-200 p-4 transition hover:border-blue-300 hover:shadow-md"
    >
      <h3 className="text-lg font-semibold text-gray-900">{themeId}</h3>
      <p className="mt-1 text-sm text-gray-600">{axisId}</p>
      <p className="mt-2 text-xs text-gray-400">更新: {formattedDate}</p>
    </Link>
  );
}
