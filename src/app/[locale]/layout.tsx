import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "AISEA | Southeast Asia's Largest AI Builder Movement",
  description:
    "Join AISEA (24-30 Nov 2025) - Southeast Asia's largest grassroots builder movement bringing together builders, startups, corporates, and VCs.",
  keywords: [
    "AISEA",
    "AI",
    "Southeast Asia",
    "builder movement",
    "hackathon",
    "AI week",
    "tech event",
  ],
  authors: [{ name: "AISEA" }],
  creator: "AISEA",
};

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
