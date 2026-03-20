export default function PublicProfileLoading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10 animate-pulse">
      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
        <div className="space-y-2">
          <div className="h-6 w-40 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
          <div className="h-4 w-24 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
        </div>
      </div>

      {/* Bio */}
      <div className="mt-6 space-y-2">
        <div className="h-4 w-full rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
        <div className="h-4 w-5/6 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
        <div className="h-4 w-4/6 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
      </div>

      {/* Skills */}
      <div className="mt-6 flex flex-wrap gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-6 w-20 rounded-full" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
        ))}
      </div>

      {/* Submissions */}
      <div className="mt-8 space-y-3">
        <div className="h-5 w-28 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg p-4 space-y-2"
            style={{ border: "1px solid var(--ds-border)", backgroundColor: "var(--ds-bg-surface)" }}
          >
            <div className="h-4 w-1/2 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
            <div className="h-3 w-1/4 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
