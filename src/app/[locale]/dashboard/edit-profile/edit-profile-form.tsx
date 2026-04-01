"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/routing";
import { LinkGitHubAccount } from "./link-github-account";

type Skill = { slug: string; label: string; sort_order: number | null };
type Builder = {
  id: string;
  username: string;
  name: string;
  city: string;
  bio: string | null;
  skills: string[];
  github_handle: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  personal_url: string | null;
};

export function EditProfileForm({
  builder,
  skills,
  locale,
  hasGithubLinked,
}: {
  builder: Builder;
  skills: Skill[];
  locale: string;
  hasGithubLinked: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(builder.name);
  const [city, setCity] = useState(builder.city);
  const [bio, setBio] = useState(builder.bio ?? "");
  const [githubHandle, setGithubHandle] = useState(builder.github_handle ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(builder.linkedin_url ?? "");
  const [instagramUrl, setInstagramUrl] = useState(builder.instagram_url ?? "");
  const [twitterUrl, setTwitterUrl] = useState(builder.twitter_url ?? "");
  const [personalUrl, setPersonalUrl] = useState(builder.personal_url ?? "");
  const [selectedSkills, setSelectedSkills] = useState<string[]>(builder.skills ?? []);

  const sortedSkills = [...skills].sort(
    (a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99)
  );

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
    const { error: updateError } = await supabase
      .from("builders")
      .update({
        name: name.trim(),
        city: city.trim(),
        bio: bio.trim().slice(0, 160) || null,
        skills: selectedSkills,
        github_handle: githubHandle.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        instagram_url: instagramUrl.trim() || null,
        twitter_url: twitterUrl.trim() || null,
        personal_url: personalUrl.trim() || null,
      })
      .eq("id", builder.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }
    router.replace("/dashboard");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <Label className="text-white/80">Handle (username)</Label>
        <p className="mt-1 text-sm text-white/50">@{builder.username}</p>
        <p className="text-xs text-white/40">Username cannot be changed here.</p>
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
          required
          className="mt-1 bg-white/5 border-white/20 text-white"
        />
      </div>
      <div>
        <Label className="text-white/80">Skills</Label>
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
          GitHub handle
        </Label>
        <Input
          id="github"
          value={githubHandle}
          onChange={(e) => setGithubHandle(e.target.value)}
          className="mt-1 bg-white/5 border-white/20 text-white"
        />
        {!hasGithubLinked ? <LinkGitHubAccount locale={locale} /> : null}
      </div>
      <div className="rounded-lg border border-white/10 p-4">
        <p className="mb-3 text-sm font-medium text-white/80">Social links</p>
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
          {loading ? "Saving…" : "Save changes"}
        </Button>
        <Button asChild variant="outline" className="rounded-full border-white/20 text-white/90">
          <Link href="/dashboard">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
