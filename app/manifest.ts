import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SoufShop — Discover Top Curated Products',
    short_name: 'SoufShop',
    description:
      'Independent product curation and price comparison across trusted global stores.',
    start_url: '/en',
    display: 'standalone',
    background_color: '#F7F6F2',
    theme_color: '#115E49',
    icons: [
      {
        src: '/icon',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: '/api/logo?size=48',
        sizes: '48x48',
        type: 'image/png',
      },
      {
        src: '/api/logo?size=192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/api/logo?size=512',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
