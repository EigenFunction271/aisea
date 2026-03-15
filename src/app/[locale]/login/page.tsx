"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/routing";
import { Navbar1 } from "@/components/ui/navbar";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

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
        router.replace("/");
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
