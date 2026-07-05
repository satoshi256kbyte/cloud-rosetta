import Link from 'next/link';
import type { PaginationState } from '@/lib/types';

interface PaginationProps {
  pagination: PaginationState;
  basePath?: string;
}

export function Pagination({ pagination, basePath = '/' }: PaginationProps) {
  const { currentPage, totalPages } = pagination;

  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <nav aria-label="ページネーション" className="mt-8 flex items-center justify-center gap-1">
      {currentPage > 1 && (
        <Link
          href={`${basePath}?page=${currentPage - 1}`}
          className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
          aria-label="前のページ"
        >
          ← 前へ
        </Link>
      )}

      {pages.map((page, i) =>
        page === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 py-2 text-sm text-gray-400">
            …
          </span>
        ) : (
          <Link
            key={page}
            href={`${basePath}?page=${page}`}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              page === currentPage
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </Link>
        ),
      )}

      {currentPage < totalPages && (
        <Link
          href={`${basePath}?page=${currentPage + 1}`}
          className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
          aria-label="次のページ"
        >
          次へ →
        </Link>
      )}
    </nav>
  );
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push('...');

  pages.push(total);

  return pages;
}
