import { Navbar1 } from "@/components/ui/navbar";

export default function AdminChallengesLoading() {
  return (
    <main className="min-h-screen bg-black">
      <Navbar1 />
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-24">
        <div className="h-7 w-56 animate-pulse rounded bg-white/15" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-white/10" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="h-5 w-44 animate-pulse rounded bg-white/15" />
              <div className="mt-2 h-3 w-52 animate-pulse rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
