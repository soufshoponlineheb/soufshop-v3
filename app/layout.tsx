import type { Metadata } from 'next';
import { Fraunces, Inter, Cairo } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { SavedProvider } from '@/features/saved/SavedProvider';
import { CookieBanner } from '@/components/sections/CookieBanner';
import { Analytics } from '@vercel/analytics/next';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['600'],
  variable: '--font-fraunces',
  display: 'swap',
});

const interFont = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const cairoFont = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '700'],
  variable: '--font-cairo',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aqurivo.store';
const siteUrlCom = process.env.NEXT_PUBLIC_SITE_URL_COM || 'https://aqurivo.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'AQURIVO | مراجعات المنتجات ومقارنة الأسعار قبل الشراء',
  authors: [{ name: 'AQURIVO Editorial Team' }],
  publisher: 'AQURIVO',
  other: {
    author: 'AQURIVO Editorial Team',
    thumbnail: `${siteUrl}/images/hero-desktop.jpg`,
    'og:image:secure_url': `${siteUrl}/images/hero-desktop.jpg`,
    'og:image:type': 'image/jpeg',
  },
  description:
    'اكتشف مراجعات المنتجات وأدلة الشراء، وقارن الأسعار والمميزات والعيوب قبل اتخاذ قرارك. يساعدك AQURIVO على اختيار ما يناسب احتياجاتك وميزانيتك.',
  keywords:
    'AQURIVO، مراجعات المنتجات، مقارنة الأسعار، أدلة الشراء، تسوق ذكي، المميزات والعيوب، أفضل أسعار',
  openGraph: {
    title: 'AQURIVO | مراجعات المنتجات ومقارنة الأسعار قبل الشراء',
    description:
      'اكتشف مراجعات المنتجات وأدلة الشراء، وقارن الأسعار والمميزات والعيوب قبل اتخاذ قرارك. يساعدك AQURIVO على اختيار ما يناسب احتياجاتك وميزانيتك.',
    url: siteUrl,
    siteName: 'AQURIVO',
    images: [
      {
        url: `${siteUrl}/images/hero-desktop.jpg`,
        secureUrl: `${siteUrl}/images/hero-desktop.jpg`,
        width: 1200,
        height: 675,
        type: 'image/jpeg',
        alt: 'AQURIVO | مراجعات المنتجات ومقارنة الأسعار قبل الشراء',
      },
    ],
    locale: 'ar_SA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AQURIVO | مراجعات المنتجات ومقارنة الأسعار قبل الشراء',
    description:
      'اكتشف مراجعات المنتجات وأدلة الشراء، وقارن الأسعار والمميزات والعيوب قبل اتخاذ قرارك. يساعدك AQURIVO على اختيار ما يناسب احتياجاتك وميزانيتك.',
    images: [`${siteUrl}/images/hero-desktop.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon.svg', type: 'image/svg+xml', sizes: 'any' },
      { url: '/icon', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [{ url: '/apple-icon', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.webmanifest',
  verification: {
    google: 'oS_3HRPs49irqAH5Ey9SwCB9vrNxeshh61SYJSfZP2E',
  },
};

const organizationAndWebsiteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'AQURIVO',
      alternateName: ['أكوريفو', 'AQURIVO Online'],
      url: siteUrl,
      email: 'soufshop.online@gmail.com',
      telephone: '+212684063908',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+212684063908',
        email: 'soufshop.online@gmail.com',
        contactType: 'customer service',
        availableLanguage: ['English', 'Arabic'],
      },
      sameAs: [],
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/icon`,
        contentUrl: `${siteUrl}/icon.svg`,
        width: 192,
        height: 192,
      },
      image: `${siteUrl}/images/hero-desktop.jpg`,
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'AQURIVO',
      alternateName: ['أكوريفو', 'AQURIVO'],
      image: `${siteUrl}/images/hero-desktop.jpg`,
      thumbnailUrl: `${siteUrl}/images/hero-desktop.jpg`,
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: `${siteUrl}/images/hero-desktop.jpg`,
        contentUrl: `${siteUrl}/images/hero-desktop.jpg`,
        width: 1200,
        height: 675,
      },
      publisher: {
        '@id': `${siteUrl}/#organization`,
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/en/products?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      dir="ltr"
      data-theme="light"
      className={`${fraunces.variable} ${interFont.variable} ${cairoFont.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('soufshop_theme');var d=s==='dark'||(!s&&window.matchMedia('(prefers-color-scheme: dark)').matches);var c=d?'dark':'light';document.documentElement.classList.add(c);document.documentElement.setAttribute('data-theme',c);}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(window.__soufSafeJsonInstalled)return;window.__soufSafeJsonInstalled=true;var o=JSON.stringify.bind(JSON);JSON.stringify=function(v,r,s){try{return o(v,r,s)}catch(e){var w=new WeakSet();return o(v,function(k,val){if(k&&(k.indexOf('__reactFiber$')===0||k.indexOf('__reactProps$')===0||k.indexOf('__reactEvents$')===0||k==='_owner'||k==='stateNode'))return undefined;if(typeof val==='object'&&val!==null){if(typeof Node!=='undefined'&&val instanceof Node)return '[DOM:'+val.nodeName+']';if(typeof Window!=='undefined'&&val instanceof Window)return '[Window]';if(w.has(val))return undefined;w.add(val)}return typeof r==='function'?r.call(this,k,val):val},s)}}}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationAndWebsiteJsonLd),
          }}
        />
        <ThemeProvider>
          <I18nProvider>
            <ToastProvider>
              <SavedProvider>
                {children}
                <CookieBanner />
                <Analytics />
              </SavedProvider>
            </ToastProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
