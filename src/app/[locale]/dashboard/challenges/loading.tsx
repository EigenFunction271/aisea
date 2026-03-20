export default function ChallengesLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8 animate-pulse">
      <div className="h-7 w-36 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
      <div className="mt-2 h-4 w-80 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />

      {/* Filter tabs */}
      <div className="mt-6 flex gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-8 w-24 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
        ))}
      </div>

      {/* Challenge grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg p-4 space-y-3"
            style={{ border: "1px solid var(--ds-border)", backgroundColor: "var(--ds-bg-surface)" }}
          >
            <div className="h-32 w-full rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
            <div className="h-4 w-3/4 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
            <div className="h-3 w-1/2 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
            <div className="flex gap-2">
              <div className="h-5 w-16 rounded-full" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
              <div className="h-5 w-16 rounded-full" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
