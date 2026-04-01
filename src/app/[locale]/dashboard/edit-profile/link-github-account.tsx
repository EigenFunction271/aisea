"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function LinkGitHubAccount({ locale }: { locale: string }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onClick() {
    setErr(null);
    setLoading(true);
    const supabase = createClient();
    const origin = window.location.origin;
    const next = `/${locale}/dashboard/edit-profile`;
    const { error } = await supabase.auth.linkIdentity({
      provider: "github",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setLoading(false);
    if (error) setErr(error.message);
  }

  return (
    <div className="mt-2 rounded-lg border border-white/15 bg-white/[0.03] p-3">
      <p className="mb-2 text-xs text-white/60">
        Link GitHub so your contribution heatmap uses GitHub’s own totals (including private activity if
        you enable that on GitHub).
      </p>
      <Button
        type="button"
        variant="outline"
        disabled={loading}
        onClick={onClick}
        className="rounded-full border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
      >
        {loading ? "…" : "Link GitHub account"}
      </Button>
      {err ? (
        <p className="mt-2 text-xs text-red-400" role="alert">
          {err}
        </p>
      ) : null}
    </div>
  );
}
