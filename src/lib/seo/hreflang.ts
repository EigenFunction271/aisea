import { routing } from "@/i18n/routing";

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "https://aisea.builders";

const normalizePath = (path: string) => {
  if (path === "") return "";
  return path.startsWith("/") ? path : `/${path}`;
};

export function getHrefLangAlternates({
  locale,
  path,
}: {
  locale: string;
  path: string;
}) {
  const normalizedPath = normalizePath(path);

  const canonical =
    locale === "en"
      ? `${baseUrl}${normalizedPath}`
      : `${baseUrl}/${locale}${normalizedPath}`;

  const languages = Object.fromEntries(
    routing.locales.map((loc) => [
      loc,
      loc === "en"
        ? `${baseUrl}${normalizedPath}`
        : `${baseUrl}/${loc}${normalizedPath}`,
    ]),
  );

  return { canonical, languages };
}

