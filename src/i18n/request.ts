import { getRequestConfig } from 'next-intl/server';
import { routing } from '@/i18n/routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  // Ensure locale is always a string
  const finalLocale = locale as string;

  let messages;
  try {
    // Use explicit imports that can be statically analyzed
    switch (finalLocale) {
      case 'en':
        messages = (await import('../messages/en.json')).default;
        break;
      case 'id':
        messages = (await import('../messages/id.json')).default;
        break;
      case 'zh':
        messages = (await import('../messages/zh.json')).default;
        break;
      case 'vi':
        messages = (await import('../messages/vi.json')).default;
        break;
      default:
        messages = (await import('../messages/en.json')).default;
    }
  } catch (error) {
    // Fallback to default locale if import fails
    messages = (await import('../messages/en.json')).default;
  }

  return {
    locale: finalLocale,
    messages
  };
});
