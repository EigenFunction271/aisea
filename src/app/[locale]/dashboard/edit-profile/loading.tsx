export default function EditProfileLoading() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10 animate-pulse space-y-6">
      <div className="h-7 w-40 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />

      {[...Array(5)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
          <div className="h-10 w-full rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
        </div>
      ))}

      <div className="h-10 w-32 rounded" style={{ backgroundColor: "var(--ds-bg-raised)" }} />
    </div>
  );
}
