export default function WikiLoading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8 animate-pulse space-y-6">
      <div className="h-7 w-32 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
      <div className="h-4 w-72 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg p-5 space-y-3"
            style={{ border: "1px solid var(--ds-border)", backgroundColor: "var(--ds-bg-surface)" }}
          >
            <div className="h-5 w-1/2 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
            <div className="space-y-1.5">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-3 rounded" style={{ backgroundColor: "var(--ds-bg-raised)", width: `${60 + j * 10}%` }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
