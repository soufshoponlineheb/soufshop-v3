import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://soufshop.store/sitemap.xml',
    host: 'https://soufshop.store',
  };
}
