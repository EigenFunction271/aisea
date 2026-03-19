export default function AdminChallengeDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="h-7 w-64 animate-pulse rounded bg-white/15" />
      <div className="mt-2 h-4 w-96 animate-pulse rounded bg-white/10" />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="mt-3 h-10 animate-pulse rounded bg-white/10 first:mt-0" />
          ))}
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="mt-3 h-12 animate-pulse rounded bg-white/10 first:mt-0" />
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="h-6 w-48 animate-pulse rounded bg-white/15" />
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded bg-white/10" />
          ))}
        </div>
      </div>
    </div>
  );
}
