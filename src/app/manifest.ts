import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kivo',
    short_name: 'Kivo',
    description:
      'Premium mobile AI command center for analysis, automation, and proactive decision support.',
    start_url: '/',
    scope: '/',
    id: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f7f7f5',
    theme_color: '#f7f7f5',
    categories: ['productivity', 'utilities', 'business'],
    lang: 'en',
    icons: [
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
