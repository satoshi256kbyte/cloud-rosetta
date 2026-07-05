interface DataFreshnessWarningProps {
  comparedAt: string;
}

export function DataFreshnessWarning({ comparedAt }: DataFreshnessWarningProps) {
  const comparedDate = new Date(comparedAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - comparedDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 90) return null;

  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4" role="alert">
      <p className="text-sm text-yellow-800">
        ⚠️ この比較情報は {diffDays} 日前に作成されたものです。
        情報が古い可能性があります。最新の公式ドキュメントもご確認ください。
      </p>
    </div>
  );
}
