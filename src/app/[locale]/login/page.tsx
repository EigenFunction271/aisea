"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/routing";
import { Navbar1 } from "@/components/ui/navbar";
import {
  dedupeLeadingLocalePath,
  stripLeadingLocalePath,
} from "@/lib/i18n/dedupe-locale-path";

export default function LoginPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const next = dedupeLeadingLocalePath(
    nextParam?.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : `/${locale}/dashboard`
  );
  const nextForRouter = stripLeadingLocalePath(next);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function oauthRedirect(provider: "google" | "github") {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (oauthError) {
        setError(oauthError.message);
        setLoading(false);
      }
      // On success the browser redirects to the provider, then back to /auth/callback.
    } catch {
      setError(t("error"));
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          setError(signInError.message);
          setLoading(false);
          return;
        }
        router.replace(nextForRouter);
        return;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      setMessage(t("checkEmail"));
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black">
      <Navbar1 />
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-24 pb-12">
        <div className="w-full max-w-sm space-y-6">
          <h1 className="font-[family-name:var(--font-perfectly-nineties)] text-3xl text-center text-white">
            {mode === "login" ? t("loginTitle") : t("signUpTitle")}
          </h1>

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => oauthRedirect("google")}
              className="w-full rounded-full font-[family-name:var(--font-geist-mono)] border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              {loading ? "…" : t("continueWithGoogle")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => oauthRedirect("github")}
              className="w-full rounded-full font-[family-name:var(--font-geist-mono)] border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              {loading ? "…" : t("continueWithGitHub")}
            </Button>
            <p className="text-center text-xs text-white/50 font-[family-name:var(--font-geist-mono)]">
              {t("orContinueWithEmail")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">
                {t("email")}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80">
                {t("password")}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="text-sm text-green-400" role="status">
                {message}
              </p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full font-[family-name:var(--font-geist-mono)] bg-white text-black hover:bg-white/90"
            >
              {loading
                ? "..."
                : mode === "login"
                  ? t("submitLogin")
                  : t("submitSignUp")}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError(null);
                setMessage(null);
              }}
              className="text-sm text-white/70 hover:text-white underline"
            >
              {mode === "login" ? t("switchToSignUp") : t("switchToLogin")}
            </button>
          </div>

          <p className="text-center">
            <Link
              href="/"
              className="text-sm text-white/60 hover:text-white/80"
            >
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
