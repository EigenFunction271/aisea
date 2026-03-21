export default function DashboardBuildersLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8 animate-pulse">
      <div className="h-7 w-48 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
      <div className="mt-2 h-4 w-80 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg p-5 space-y-3"
            style={{ border: "1px solid var(--ds-border)", backgroundColor: "var(--ds-bg-surface)" }}
          >
            <div className="h-5 w-3/4 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
            <div className="h-3 w-1/2 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
            <div className="h-3 w-full rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
