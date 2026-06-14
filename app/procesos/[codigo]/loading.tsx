export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
      <div className="h-56 animate-pulse rounded-2xl bg-surface shadow-soft ring-1 ring-hairline" />
      <div className="h-64 animate-pulse rounded-2xl bg-surface shadow-soft ring-1 ring-hairline" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl bg-surface shadow-soft ring-1 ring-hairline" />
        <div className="h-72 animate-pulse rounded-2xl bg-surface shadow-soft ring-1 ring-hairline" />
      </div>
    </div>
  );
}
