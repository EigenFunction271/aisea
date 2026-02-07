import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "../globals.css";
import { Analytics } from "@vercel/analytics/next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { ThemeProvider } from 'next-themes';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const perfectlyNineties = localFont({
  src: "../../../public/fonts/perfectly-nineties-regular.otf",
  variable: "--font-perfectly-nineties",
});

// Base URL - update this to your production domain
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://aisea.builders';

// Generate metadata with locale support
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  
  const localeNames: Record<string, string> = {
    en: 'English',
    id: 'Indonesian',
    zh: 'Chinese',
    vi: 'Vietnamese',
  };
  
  const localeDescriptions: Record<string, string> = {
    en: "Join AISEA (24-30 Nov 2025) - Southeast Asia's largest grassroots builder movement bringing together builders, startups, corporates, and VCs.",
    id: "Bergabunglah dengan AISEA (24-30 Nov 2025) - gerakan builder terbesar di Asia Tenggara yang menghubungkan builder, startup, korporat, dan VC.",
    zh: "加入 AISEA (2025年11月24-30日) - 东南亚最大的草根建设者运动，汇聚建设者、初创企业、企业和风险投资。",
    vi: "Tham gia AISEA (24-30 Tháng 11 2025) - phong trào builder lớn nhất Đông Nam Á kết nối các builder, startup, doanh nghiệp và VC.",
  };
  
  const currentUrl = `${baseUrl}/${locale === 'en' ? '' : locale}`;
  const siteName = 'AISEA';
  const title = "AISEA | Southeast Asia's Largest AI Builder Movement";
  const description = localeDescriptions[locale] || localeDescriptions.en;
  
  // Generate hreflang alternates
  const languages: Record<string, string> = {};
  routing.locales.forEach((loc) => {
    languages[loc] = loc === 'en' ? baseUrl : `${baseUrl}/${loc}`;
  });
  
  const alternates = {
    canonical: locale === 'en' ? baseUrl : `${baseUrl}/${locale}`,
    languages,
  };
  
  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    keywords: [
      "AISEA",
      "AI",
      "Southeast Asia",
      "builder movement",
      "hackathon",
      "AI week",
      "tech event",
      "Malaysia",
      "Indonesia",
      "Singapore",
      "Vietnam",
      "Thailand",
      "Philippines",
      "artificial intelligence",
      "startup",
      "venture capital",
    ],
    authors: [{ name: "AISEA" }],
    creator: "AISEA",
    publisher: "AISEA",
    alternates,
    openGraph: {
      type: 'website',
      locale: locale === 'en' ? 'en_US' : locale === 'id' ? 'id_ID' : locale === 'zh' ? 'zh_CN' : 'vi_VN',
      url: currentUrl,
      siteName,
      title,
      description,
      images: [
        {
          url: `${baseUrl}/web-app-manifest-512x512.png`,
          width: 512,
          height: 512,
          alt: 'AISEA Logo',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/web-app-manifest-512x512.png`],
      creator: '@AI__SEA',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    // Geo-targeting for Southeast Asia
    other: {
      'geo.region': 'ID-MY-SG-TH-VN-PH',
      'geo.placename': 'Southeast Asia',
      'ICBM': '3.1390, 101.6869', // Kuala Lumpur coordinates
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Type guard for locale validation
  const isValidLocale = (loc: string): loc is typeof routing.locales[number] => {
    return routing.locales.includes(loc as typeof routing.locales[number]);
  };

  if (!isValidLocale(locale)) {
    notFound();
  }

  let messages;
  try {
    messages = await getMessages();
  } catch (error) {
    // Fallback to empty messages if getMessages fails
    // This prevents the entire layout from crashing
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to load messages:", error);
    }
    messages = {};
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${perfectlyNineties.variable} antialiased`}
      >
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <NextIntlClientProvider messages={messages}>
              {children}
            </NextIntlClientProvider>
          </ThemeProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  );
}
