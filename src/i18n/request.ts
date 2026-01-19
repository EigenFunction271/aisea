import { getRequestConfig } from 'next-intl/server';
import { routing } from '@/i18n/routing';

// Type guard for locale validation
const isValidLocale = (loc: string | undefined): loc is typeof routing.locales[number] => {
  if (!loc) return false;
  return routing.locales.includes(loc as typeof routing.locales[number]);
};

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!isValidLocale(locale)) {
    locale = routing.defaultLocale;
  }

  // Ensure locale is always a string (now type-safe)
  const finalLocale = locale;

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
    // Log error in development for debugging
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to load messages for locale:", finalLocale, error);
    }
    messages = (await import('../messages/en.json')).default;
  }

  return {
    locale: finalLocale,
    messages
  };
});
