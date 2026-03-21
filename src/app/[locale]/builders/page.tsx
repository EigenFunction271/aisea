import { redirect, notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

/** Legacy URL: directory lives at `/dashboard/builders` (login required). */
export default async function BuildersLegacyRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isValidLocale = (loc: string): loc is (typeof routing.locales)[number] =>
    routing.locales.includes(loc as (typeof routing.locales)[number]);
  if (!isValidLocale(locale)) notFound();

  redirect(`/${locale}/dashboard/builders`);
}
