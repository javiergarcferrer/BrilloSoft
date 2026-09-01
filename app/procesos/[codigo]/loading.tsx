export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="h-4 w-40 shimmer rounded-lg border border-hairline" />
      <div className="h-56 shimmer rounded-lg bg-surface border border-hairline" />
      <div className="h-64 shimmer rounded-lg bg-surface border border-hairline" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-72 shimmer rounded-lg bg-surface border border-hairline" />
        <div className="h-72 shimmer rounded-lg bg-surface border border-hairline" />
      </div>
    </div>
  );
}
