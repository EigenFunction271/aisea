import { redirect, notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

/** Legacy URL: profiles live at `/dashboard/u/[handle]` (dashboard shell). */
export default async function BuildersProfileLegacyRedirect({
  params,
}: {
  params: Promise<{ locale: string; username: string }>;
}) {
  const { locale, username } = await params;
  const isValidLocale = (loc: string): loc is (typeof routing.locales)[number] =>
    routing.locales.includes(loc as (typeof routing.locales)[number]);
  if (!isValidLocale(locale)) notFound();

  const handle = username.trim();
  if (!handle) notFound();

  redirect(`/${locale}/dashboard/u/${encodeURIComponent(handle)}`);
}
