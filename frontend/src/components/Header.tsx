import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white px-6 py-4">
      <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600">
        cloud-rosetta
      </Link>
    </header>
  );
}
