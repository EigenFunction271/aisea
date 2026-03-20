export default function ChallengeDetailLoading() {
  return (
    <div className="flex h-[calc(100dvh-3rem)] animate-pulse overflow-hidden">
      {/* Left panel */}
      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6">
        <div className="h-8 w-2/3 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
        <div className="h-4 w-1/2 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
        <div className="h-48 w-full rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-4 rounded" style={{ backgroundColor: "var(--ds-bg-raised)", width: `${70 + (i % 3) * 10}%` }} />
          ))}
        </div>
      </div>
      {/* Right panel */}
      <div
        className="hidden w-[320px] shrink-0 overflow-y-auto lg:block"
        style={{ borderLeft: "1px solid var(--ds-border)" }}
      >
        <div className="px-6 py-8 space-y-4">
          <div className="h-10 w-full rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-20 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
              <div className="h-4 w-32 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
