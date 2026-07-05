import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <h2 className="mt-4 text-xl font-semibold text-gray-700">
        ページが見つかりません
      </h2>
      <p className="mt-2 text-sm text-gray-500">
        お探しの比較データは存在しないか、まだ公開されていません。
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
      >
        トップページに戻る
      </Link>
    </div>
  );
}
