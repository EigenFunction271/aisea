import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  redirect(`/${routing.defaultLocale}`);
}
