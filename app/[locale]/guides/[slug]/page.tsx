import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Product } from '@/types';
import { getPublishedArticleBySlug } from '@/server/repositories/articles.repo';
import { getProductBySlug } from '@/server/repositories/products.repo';
import { GuideDetailView } from './GuideDetailView';

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://aqurivo.store';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const article =
    (await getPublishedArticleBySlug(decodedSlug)) ??
    (await getPublishedArticleBySlug(slug));

  if (!article) {
    return { title: 'Guide Not Found | AQURIVO' };
  }

  const isAr = locale === 'ar';
  const seoTitle = isAr ? article.seoTitle?.ar : article.seoTitle?.en;
  const rawTitle =
    seoTitle ||
    (isAr ? article.title.ar : article.title.en) ||
    article.title.ar ||
    article.title.en ||
    'Guide';

  const seoDescription = isAr
    ? article.seoDescription?.ar
    : article.seoDescription?.en;
  const description =
    seoDescription ||
    (isAr ? article.excerpt.ar : article.excerpt.en) ||
    article.excerpt.ar ||
    article.excerpt.en ||
    '';

  const canonicalUrl = `${BASE_URL}/${locale}/guides/${encodeURIComponent(
    article.slug || slug
  )}`;
  const coverImage = article.coverImage
    ? article.coverImage.startsWith('http')
      ? article.coverImage
      : `${BASE_URL}${article.coverImage}`
    : `${BASE_URL}/images/hero-bg.jpg`;

  const authorName = article.authorName || 'AQURIVO Editorial Team';

  return {
    title: rawTitle.includes('AQURIVO') ? rawTitle : `${rawTitle} | AQURIVO`,
    description: description.slice(0, 155),
    ...(article.seoKeywords && article.seoKeywords.length > 0
      ? { keywords: article.seoKeywords.join(', ') }
      : {}),
    authors: [{ name: authorName }],
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ar: `${BASE_URL}/ar/guides/${encodeURIComponent(article.slug || slug)}`,
        en: `${BASE_URL}/en/guides/${encodeURIComponent(article.slug || slug)}`,
        'x-default': `${BASE_URL}/en/guides/${encodeURIComponent(
          article.slug || slug
        )}`,
      },
    },
    openGraph: {
      title: rawTitle,
      description: description.slice(0, 155),
      url: canonicalUrl,
      siteName: 'AQURIVO',
      type: 'article',
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [authorName],
      images: [
        {
          url: coverImage,
          width: 1200,
          height: 630,
          alt: rawTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: rawTitle,
      description: description.slice(0, 155),
      images: [coverImage],
    },
  };
}

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (locale !== 'ar' && locale !== 'en') {
    notFound();
  }

  const decodedSlug = decodeURIComponent(slug);
  const article =
    (await getPublishedArticleBySlug(decodedSlug)) ??
    (await getPublishedArticleBySlug(slug));

  if (!article) {
    notFound();
  }

  // Fetch all related products server-side
  const relatedProductPromises = (article.relatedProductIds || []).map(
    (idOrSlug) => getProductBySlug(idOrSlug)
  );
  const resolvedProducts = (await Promise.all(relatedProductPromises)).filter(
    (p): p is Product => p !== null
  );

  const isAr = locale === 'ar';
  const articleTitle = isAr ? article.title.ar : article.title.en;
  const articleExcerpt =
    (isAr ? article.seoDescription?.ar : article.seoDescription?.en) ||
    (isAr ? article.excerpt.ar : article.excerpt.en);
  const articleUrl = `${BASE_URL}/${locale}/guides/${encodeURIComponent(
    article.slug
  )}`;
  const coverImage = article.coverImage
    ? article.coverImage.startsWith('http')
      ? article.coverImage
      : `${BASE_URL}${article.coverImage}`
    : `${BASE_URL}/images/hero-bg.jpg`;
  const authorName = article.authorName || 'AQURIVO Editorial Team';

  const faqItems = article.faqItems || [];
  const faqSchemaNode =
    faqItems.length > 0
      ? {
          '@type': 'FAQPage',
          mainEntity: faqItems.map((faq) => ({
            '@type': 'Question',
            name: isAr
              ? faq.question.ar || faq.question.en
              : faq.question.en || faq.question.ar,
            acceptedAnswer: {
              '@type': 'Answer',
              text: isAr
                ? faq.answer.ar || faq.answer.en
                : faq.answer.en || faq.answer.ar,
            },
          })),
        }
      : null;

  const structuredDataJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: articleTitle,
        description: articleExcerpt.slice(0, 155),
        image: [coverImage],
        datePublished: article.publishedAt,
        dateModified: article.updatedAt || article.publishedAt,
        ...(article.seoKeywords && article.seoKeywords.length > 0
          ? { keywords: article.seoKeywords.join(', ') }
          : {}),
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': articleUrl,
        },
        author: {
          '@type': 'Organization',
          name: authorName,
          url: BASE_URL,
        },
        publisher: {
          '@type': 'Organization',
          name: 'AQURIVO',
          logo: {
            '@type': 'ImageObject',
            url: `${BASE_URL}/api/logo?size=512`,
          },
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: isAr ? 'الرئيسية' : 'Home',
            item: `${BASE_URL}/${locale}`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: isAr ? 'أدلة الشراء' : 'Buying Guides',
            item: `${BASE_URL}/${locale}/guides`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: articleTitle,
            item: articleUrl,
          },
        ],
      },
      ...(faqSchemaNode ? [faqSchemaNode] : []),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredDataJsonLd),
        }}
      />
      <GuideDetailView article={article} relatedProducts={resolvedProducts} />
    </>
  );
}
