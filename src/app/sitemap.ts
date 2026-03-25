import { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { seededCities } from '@/lib/seo/seeded-cities';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://aisea.builders';

// All pages across all locales
const pages = ['', 'events', 'manifesto', 'work-with-us', 'residency', 'cities'];
const cityDetailPaths = seededCities.map((c) => `cities/${c.slug}`);

export default function sitemap(): MetadataRoute.Sitemap {
  const sitemapEntries: MetadataRoute.Sitemap = [];

  const urlForLocale = (loc: string, path: string) =>
    loc === 'en' ? `${baseUrl}${path}` : `${baseUrl}/${loc}${path}`;

  // Generate entries for each locale and page
  routing.locales.forEach((locale) => {
    pages.forEach((page) => {
      const path = page === '' ? '' : `/${page}`;
      const url = urlForLocale(locale, path);
      
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
              urlForLocale(loc, path)
            ])
          ),
        },
      });
    });

    cityDetailPaths.forEach((detailPath) => {
      const path = `/${detailPath}`;
      const url = urlForLocale(locale, path);

      sitemapEntries.push({
        url,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((loc) => [loc, urlForLocale(loc, path)]),
          ),
        },
      });
    });
  });

  return sitemapEntries;
}
