import { redirect } from '@/i18n/routing';
import { routing } from '@/i18n/routing';

// This page redirects to the default locale
export default function RootPage() {
  redirect({ href: '/', locale: routing.defaultLocale });
}
