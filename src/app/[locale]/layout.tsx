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
  
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${perfectlyNineties.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
