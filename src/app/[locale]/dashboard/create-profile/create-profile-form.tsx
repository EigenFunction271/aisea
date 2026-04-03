"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { createBuilderProfile } from "@/lib/builders/edge-functions";
import { githubLoginFromUser } from "@/lib/builders/github-identity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/routing";

type Skill = { slug: string; label: string; sort_order: number | null };

export function CreateProfileForm({ skills }: { skills: Skill[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [githubHandle, setGithubHandle] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [personalUrl, setPersonalUrl] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const sortedSkills = [...skills].sort(
    (a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99)
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const login = githubLoginFromUser(user);
      if (!cancelled && login) {
        setGithubHandle((prev) => (prev.trim() ? prev : login));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSkill = (slug: string) => {
    setSelectedSkills((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    try {
      const { builder } = await createBuilderProfile(supabase, {
        username: username.trim(),
        name: name.trim(),
        city: city.trim(),
        bio: bio.trim() || undefined,
        skills: selectedSkills,
        github_handle: githubHandle.trim() || undefined,
        linkedin_url: linkedinUrl.trim() || undefined,
        instagram_url: instagramUrl.trim() || undefined,
        twitter_url: twitterUrl.trim() || undefined,
        personal_url: personalUrl.trim() || undefined,
      });
      if (githubHandle.trim()) {
        void fetch("/api/builders/enrich", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ builder_id: builder.id }),
        }).catch(() => {});
      }
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <Label htmlFor="username" className="text-white/80">
          Handle (username)
        </Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. jane-builds"
          required
          className="mt-1 bg-white/5 border-white/20 text-white"
        />
        <p className="mt-1 text-xs text-white/50">
          Lowercase letters, numbers, hyphens. Used in your profile URL.
        </p>
      </div>
      <div>
        <Label htmlFor="name" className="text-white/80">
          Name
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 bg-white/5 border-white/20 text-white"
        />
      </div>
      <div>
        <Label htmlFor="city" className="text-white/80">
          City
        </Label>
        <Input
          id="city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="e.g. Singapore"
          required
          className="mt-1 bg-white/5 border-white/20 text-white"
        />
      </div>
      <div>
        <Label className="text-white/80">Skills (optional)</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {sortedSkills.map((s) => (
            <label
              key={s.slug}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
            >
              <input
                type="checkbox"
                checked={selectedSkills.includes(s.slug)}
                onChange={() => toggleSkill(s.slug)}
                className="rounded border-white/30 bg-white/5"
              />
              {s.label}
            </label>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="bio" className="text-white/80">
          Bio (max 160 chars)
        </Label>
        <Input
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={160}
          className="mt-1 bg-white/5 border-white/20 text-white"
        />
        <p className="mt-1 text-xs text-white/50">{bio.length}/160</p>
      </div>
      <div>
        <Label htmlFor="github" className="text-white/80">
          GitHub handle (optional)
        </Label>
        <Input
          id="github"
          value={githubHandle}
          onChange={(e) => setGithubHandle(e.target.value)}
          placeholder="e.g. janedoe"
          className="mt-1 bg-white/5 border-white/20 text-white"
        />
      </div>
      <div className="rounded-lg border border-white/10 p-4">
        <p className="mb-3 text-sm font-medium text-white/80">Social links (optional)</p>
        <div className="space-y-3">
          <div>
            <Label htmlFor="linkedin" className="text-white/70 text-xs">
              LinkedIn
            </Label>
            <Input
              id="linkedin"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/..."
              className="mt-1 bg-white/5 border-white/20 text-white"
            />
          </div>
          <div>
            <Label htmlFor="instagram" className="text-white/70 text-xs">
              Instagram
            </Label>
            <Input
              id="instagram"
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/..."
              className="mt-1 bg-white/5 border-white/20 text-white"
            />
          </div>
          <div>
            <Label htmlFor="twitter" className="text-white/70 text-xs">
              Twitter / X
            </Label>
            <Input
              id="twitter"
              type="url"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              placeholder="https://x.com/..."
              className="mt-1 bg-white/5 border-white/20 text-white"
            />
          </div>
          <div>
            <Label htmlFor="personal" className="text-white/70 text-xs">
              Personal / portfolio
            </Label>
            <Input
              id="personal"
              type="url"
              value={personalUrl}
              onChange={(e) => setPersonalUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1 bg-white/5 border-white/20 text-white"
            />
          </div>
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={loading}
          className="rounded-full font-[family-name:var(--font-geist-mono)] bg-white text-black hover:bg-white/90"
        >
          {loading ? "Creating…" : "Create profile"}
        </Button>
        <Button asChild variant="outline" className="rounded-full border-white/20 text-white/90">
          <Link href="/dashboard">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
