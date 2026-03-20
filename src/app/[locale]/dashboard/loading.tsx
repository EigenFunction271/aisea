export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8 animate-pulse">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
          <div className="h-4 w-64 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
        </div>
        <div className="h-9 w-32 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
      </div>

      {/* Stats row */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg p-4 space-y-2"
            style={{ border: "1px solid var(--ds-border)", backgroundColor: "var(--ds-bg-surface)" }}
          >
            <div className="h-4 w-20 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
            <div className="h-8 w-12 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
          </div>
        ))}
      </div>

      {/* Challenge cards */}
      <div className="mt-8 space-y-3">
        <div className="h-5 w-32 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-lg p-4 space-y-3"
              style={{ border: "1px solid var(--ds-border)", backgroundColor: "var(--ds-bg-surface)" }}
            >
              <div className="h-24 w-full rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
              <div className="h-4 w-3/4 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
              <div className="h-3 w-1/2 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
