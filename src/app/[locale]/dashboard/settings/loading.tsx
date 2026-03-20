export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10 animate-pulse space-y-6">
      <div className="h-7 w-28 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />

      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="rounded-lg p-4 space-y-2"
          style={{ border: "1px solid var(--ds-border)", backgroundColor: "var(--ds-bg-surface)" }}
        >
          <div className="h-4 w-32 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
          <div className="h-3 w-64 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
        </div>
      ))}
    </div>
  );
}
