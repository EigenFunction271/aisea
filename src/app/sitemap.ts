import { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://aisea.builders';

// All pages across all locales
const pages = [
  '',
  'events',
  'manifesto',
  'work-with-us',
  'residency',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Generate entries for each locale and page
  routing.locales.forEach((locale) => {
    pages.forEach((page) => {
      const path = page === '' ? '' : `/${page}`;
      const url = locale === 'en' 
        ? `${baseUrl}${path}`
        : `${baseUrl}/${locale}${path}`;
      
      // Homepage gets higher priority
      const priority = page === '' ? 1.0 : 0.8;
      const changeFrequency = page === '' ? 'weekly' : 'monthly' as const;

      sitemapEntries.push({
        url,
        lastModified: new Date(),
        changeFrequency,
        priority,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((loc) => [
              loc,
              loc === 'en' 
                ? `${baseUrl}${path}`
                : `${baseUrl}/${loc}${path}`
            ])
          ),
        },
      });
    });
  });

  return sitemapEntries;
}
