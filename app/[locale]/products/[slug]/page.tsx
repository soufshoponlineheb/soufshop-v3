import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Locale, Product } from '@/types';
import { getDictionary, pickLocalizedText } from '@/i18n';
import {
  getProductBySlug,
  listSimilarProductsByCategory,
} from '@/server/repositories/products.repo';
import { getCategoryBySlug } from '@/server/repositories/categories.repo';
import { listPublishedArticles } from '@/server/repositories/articles.repo';
import { formatNumber, formatProductPrice } from '@/lib/format';
import { SiteHeader } from '@/components/sections/SiteHeader';
import { SiteFooter } from '@/components/sections/SiteFooter';
import { ProductGallery } from './ProductGallery';
import { ProductPriceRow } from './ProductPriceRow';
import { ProductDescription } from './ProductDescription';
import { BuyNowButton } from './BuyNowButton';
import { ProductReviews } from '@/components/ProductReviews/ProductReviews';
import { ReportModal } from '@/components/ReportModal/ReportModal';
import { SmartToolPulse } from '@/components/SmartToolPulse/SmartToolPulse';
import { EditorialGuideIcon } from '@/components/ui/AqurivoContextIcons';
import { getReviewsByProductSlug } from '@/server/repositories/reviews.repo';
import styles from './ProductPage.module.css';

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://aqurivo.store';

function resolveLocalizedField(
  val1: unknown,
  val2: unknown,
  locale: Locale
): string {
  const val = (val1 || val2) as Record<string, string> | string | undefined;
  if (!val) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object' && val !== null) {
    const direct = val[locale];
    if (typeof direct === 'string' && direct.trim()) return direct.trim();
    const fallback = val.ar || val.en || '';
    if (typeof fallback === 'string') return fallback.trim();
  }
  return '';
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const product =
    (await getProductBySlug(decodedSlug)) ?? (await getProductBySlug(slug));

  if (!product) return {};

  const isAr = locale === 'ar';
  const name =
    product.name?.[locale as Locale] ||
    product.name?.en ||
    product.title?.[locale as Locale] ||
    product.title?.en ||
    '';

  const seoTitle =
    name.length > 0 && name.length <= 36
      ? isAr
        ? `${name} — المواصفات والمميزات وأفضل سعر | AQURIVO`
        : `${name} — Specs, Pros & Cons & Best Price | AQURIVO`
      : `${name} | AQURIVO`;

  const description =
    product.shortSummary?.[locale as Locale] ||
    product.description?.[locale as Locale] ||
    product.shortSummary?.en ||
    product.description?.en ||
    product.name?.[locale as Locale] ||
    '';

  const dnaSpecs =
    (isAr
      ? product.comparisonDna?.keySpecs?.ar
      : product.comparisonDna?.keySpecs?.en) || [];
  const keywords = Array.from(
    new Set(
      [
        name,
        ...(product.tags || []),
        ...dnaSpecs,
        isAr ? `سعر ${name}` : `${name} price`,
        isAr ? `مراجعة ${name}` : `${name} review`,
        'AQURIVO',
      ].filter(Boolean)
    )
  ).slice(0, 12);

  const image = product.images?.[0]?.url || '';
  const imageAlt =
    pickLocalizedText(product.images?.[0]?.alt, locale as Locale) || name;
  const canonicalSlug = encodeURIComponent(product.slug || decodedSlug);

  return {
    title: seoTitle,
    description: description.slice(0, 155),
    keywords,
    alternates: {
      canonical: `${BASE_URL}/${locale}/products/${canonicalSlug}`,
      languages: {
        en: `${BASE_URL}/en/products/${canonicalSlug}`,
        ar: `${BASE_URL}/ar/products/${canonicalSlug}`,
        'x-default': `${BASE_URL}/en/products/${canonicalSlug}`,
      },
    },
    openGraph: {
      title: seoTitle,
      description: description.slice(0, 155),
      url: `${BASE_URL}/${locale}/products/${canonicalSlug}`,
      siteName: 'AQURIVO',
      locale: isAr ? 'ar_SA' : 'en_US',
      type: 'website',
      images: image
        ? [
            {
              url: image,
              width: 800,
              height: 800,
              alt: imageAlt,
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: description.slice(0, 155),
      images: image ? [image] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  if (rawLocale !== 'ar' && rawLocale !== 'en') {
    notFound();
  }

  const locale: Locale = rawLocale;
  const isAr = locale === 'ar';
  const decodedSlug = decodeURIComponent(slug);
  const product =
    (await getProductBySlug(decodedSlug)) ?? (await getProductBySlug(slug));

  if (!product) {
    notFound();
  }

  // 1. Fetch similar products, category metadata, reviews, and related editorial buying guides
  const [similarProducts, categoryDoc, reviewsSummary, allArticles] = await Promise.all([
    product.categorySlug
      ? listSimilarProductsByCategory(
          product.categorySlug,
          product.slug,
          product.id,
          4
        )
      : Promise.resolve([]),
    product.categorySlug ? getCategoryBySlug(product.categorySlug) : null,
    getReviewsByProductSlug(product.slug),
    listPublishedArticles(),
  ]);

  // Find guides matching this product or its category
  const relatedGuides = allArticles
    .filter(
      (a) =>
        (a.relatedProductIds && (a.relatedProductIds.includes(product.id) || a.relatedProductIds.includes(product.slug))) ||
        (product.categorySlug && a.categorySlug === product.categorySlug)
    )
    .slice(0, 2);

  // 2. Resolve all Firestore product fields cleanly with fallbacks
  const name =
    resolveLocalizedField(product.name, product.title, locale) ||
    product.slug;

  const shortSummary = resolveLocalizedField(
    product.shortSummary,
    undefined,
    locale
  );

  const whyWeChoseIt = resolveLocalizedField(
    product.whyWeChoseIt,
    product.whyWePickedIt,
    locale
  );

  const thingsToNotice = resolveLocalizedField(
    product.thingsToNotice,
    product.whatToConsider,
    locale
  );

  const detailedDescription = resolveLocalizedField(
    product.detailedDescription,
    product.description,
    locale
  );

  const images =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [];

  const priceAmount =
    typeof product.priceAmount === 'number' && !Number.isNaN(product.priceAmount)
      ? product.priceAmount
      : null;

  const oldPrice =
    typeof product.oldPrice === 'number' && !Number.isNaN(product.oldPrice)
      ? product.oldPrice
      : null;

  const priceCurrency = product.priceCurrency || 'USD';

  const discount =
    typeof product.discount === 'number' && !Number.isNaN(product.discount)
      ? product.discount
      : typeof product.discountPercent === 'number' &&
          !Number.isNaN(product.discountPercent)
        ? product.discountPercent
        : null;

  const rating =
    typeof product.rating === 'number' && !Number.isNaN(product.rating)
      ? product.rating
      : typeof product.stars === 'number' && !Number.isNaN(product.stars)
        ? product.stars
        : null;

  const effectiveRating =
    reviewsSummary.totalCount > 0
      ? reviewsSummary.averageRating
      : rating;

  const effectiveReviewCount =
    reviewsSummary.totalCount > 0
      ? reviewsSummary.totalCount
      : typeof product.reviewCount === 'number'
        ? product.reviewCount
        : null;

  const salesCount =
    typeof product.salesCount === 'number' &&
    !Number.isNaN(product.salesCount)
      ? product.salesCount
      : typeof product.soldCount === 'number' && !Number.isNaN(product.soldCount)
        ? product.soldCount
        : null;

  const inStock =
    typeof product.inStock === 'boolean'
      ? product.inStock
      : product.status === 'published';

  const affiliateUrl = product.affiliateUrl || `/go/${product.slug}`;
  const categorySlug = product.categorySlug || '';
  const productSlug = product.slug || slug;

  // Formatting helpers
  const formattedPrice =
    priceAmount !== null
      ? formatProductPrice(priceAmount, priceCurrency, locale)
      : isAr
        ? 'تحقق من السعر'
        : 'Check Price';

  const formattedOldPrice =
    oldPrice !== null && priceAmount !== null && oldPrice > priceAmount
      ? formatProductPrice(oldPrice, priceCurrency, locale)
      : null;

  const dictionary = getDictionary(locale);
  const homeLabel = dictionary.nav.home || (isAr ? 'الرئيسية' : 'Home');
  const productsLabel =
    dictionary.nav.products || (isAr ? 'المنتجات' : 'Products');

  const categoryName =
    categoryDoc && categoryDoc.name
      ? pickLocalizedText(categoryDoc.name, locale)
      : product.categoryName
        ? pickLocalizedText(product.categoryName, locale)
        : categorySlug || productsLabel;

  const productUrl = `${BASE_URL}/${locale}/products/${encodeURIComponent(
    productSlug
  )}`;
  const allImageUrls = images.map((img) => img.url).filter(Boolean);

  const sourceRaw = (product.sourceSlug || product.sourceId || 'Amazon').trim();
  const sourceBrandName =
    sourceRaw.charAt(0).toUpperCase() + sourceRaw.slice(1);

  // Extract positiveNotes (Pros / Key Specs) and negativeNotes (Cons / Things to Notice) for Google Rich Snippets
  const positiveNotesList: string[] = [];
  if (Array.isArray(product.pros) && product.pros.length > 0) {
    for (const p of product.pros) {
      const txt = pickLocalizedText(p, locale);
      if (txt) positiveNotesList.push(txt);
    }
  }
  const dnaKeySpecs =
    (isAr
      ? product.comparisonDna?.keySpecs?.ar
      : product.comparisonDna?.keySpecs?.en) || [];
  for (const sp of dnaKeySpecs) {
    if (sp && !positiveNotesList.includes(sp)) {
      positiveNotesList.push(sp);
    }
  }
  if (positiveNotesList.length === 0 && whyWeChoseIt) {
    positiveNotesList.push(whyWeChoseIt.slice(0, 120));
  }

  const negativeNotesList: string[] = [];
  if (Array.isArray(product.cons) && product.cons.length > 0) {
    for (const c of product.cons) {
      const txt = pickLocalizedText(c, locale);
      if (txt) negativeNotesList.push(txt);
    }
  }
  if (negativeNotesList.length === 0 && thingsToNotice) {
    negativeNotesList.push(thingsToNotice.slice(0, 120));
  }

  const editorialReviewNode: Record<string, unknown> = {
    '@type': 'Review',
    author: {
      '@type': 'Organization',
      name: 'AQURIVO Editorial Team',
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: effectiveRating || 4.7,
      bestRating: 5,
      worstRating: 1,
    },
    ...(positiveNotesList.length > 0
      ? {
          positiveNotes: {
            '@type': 'ItemList',
            itemListElement: positiveNotesList.slice(0, 5).map((note, idx) => ({
              '@type': 'ListItem',
              position: idx + 1,
              name: note,
            })),
          },
        }
      : {}),
    ...(negativeNotesList.length > 0
      ? {
          negativeNotes: {
            '@type': 'ItemList',
            itemListElement: negativeNotesList.slice(0, 4).map((note, idx) => ({
              '@type': 'ListItem',
              position: idx + 1,
              name: note,
            })),
          },
        }
      : {}),
  };

  // JSON-LD structured data with all real product image URLs, brand, SKU, and Pros/Cons review
  const productSchemaNode: Record<string, unknown> = {
    '@type': 'Product',
    name,
    sku: product.id || productSlug,
    mpn: productSlug,
    category: categoryName,
    brand: {
      '@type': 'Brand',
      name: sourceBrandName,
    },
    description: (shortSummary || detailedDescription || name).slice(0, 155),
    ...(allImageUrls.length > 0 ? { image: allImageUrls } : {}),
    url: productUrl,
    review: editorialReviewNode,
    ...(priceAmount !== null && priceAmount > 0
      ? {
          offers: {
            '@type': 'Offer',
            price: priceAmount,
            priceCurrency,
            itemCondition: 'https://schema.org/NewCondition',
            availability: inStock
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
            url: productUrl,
            seller: {
              '@type': 'Organization',
              name: sourceBrandName,
            },
          },
        }
      : {}),
    ...(effectiveReviewCount !== null &&
    effectiveReviewCount > 0 &&
    effectiveRating !== null &&
    effectiveRating > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: effectiveRating,
            reviewCount: effectiveReviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  // VideoObject structured data nodes when the product has videos
  const allVideoUrls = Array.from(
    new Set(
      [
        ...(Array.isArray(product.videoUrls) ? product.videoUrls : []),
        ...(product.videoUrl ? [product.videoUrl] : []),
      ]
        .map((u) => (typeof u === 'string' ? u.trim() : ''))
        .filter(Boolean)
    )
  );

  const videoSchemaNodes = allVideoUrls.map((vUrl, idx) => ({
    '@type': 'VideoObject',
    name:
      allVideoUrls.length > 1
        ? `${name} — Video ${idx + 1}`
        : `${name} — Product Video`,
    description: (shortSummary || detailedDescription || name).slice(0, 155),
    thumbnailUrl:
      allImageUrls.length > 0
        ? allImageUrls
        : [`${BASE_URL}/images/hero-bg.jpg`],
    uploadDate: product.updatedAt || product.createdAt || new Date().toISOString(),
    contentUrl: vUrl,
    embedUrl: vUrl,
  }));

  const breadcrumbSchemaNode = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: homeLabel,
        item: `${BASE_URL}/${locale}`,
      },
      ...(categorySlug
        ? [
            {
              '@type': 'ListItem',
              position: 2,
              name: categoryName,
              item: `${BASE_URL}/${locale}/categories/${encodeURIComponent(
                categorySlug
              )}`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name,
              item: productUrl,
            },
          ]
        : [
            {
              '@type': 'ListItem',
              position: 2,
              name,
              item: productUrl,
            },
          ]),
    ],
  };

  const structuredDataJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [productSchemaNode, breadcrumbSchemaNode, ...videoSchemaNodes],
  };

  return (
    <div
      className={styles.pageWrapper}
      dir={isAr ? 'rtl' : 'ltr'}
      lang={locale}
    >
      {/* Schema.org JSON-LD with real product images */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredDataJsonLd),
        }}
      />

      <SiteHeader />

      <main className={styles.container}>
        {/* Breadcrumb Trail */}
        <nav aria-label="Breadcrumb" className={styles.breadcrumbsNav}>
          <ol className={styles.breadcrumbsList}>
            <li className={styles.breadcrumbItem}>
              <Link href={`/${locale}`} className={styles.breadcrumbLink}>
                {homeLabel}
              </Link>
              <span className={styles.breadcrumbSeparator} aria-hidden="true">
                /
              </span>
            </li>
            {categorySlug && (
              <li className={styles.breadcrumbItem}>
                <Link
                  href={`/${locale}/categories/${categorySlug}`}
                  className={styles.breadcrumbLink}
                >
                  {categoryName}
                </Link>
                <span
                  className={styles.breadcrumbSeparator}
                  aria-hidden="true"
                >
                  /
                </span>
              </li>
            )}
            <li className={styles.breadcrumbItem}>
              <span className={styles.breadcrumbCurrent} aria-current="page">
                {name}
              </span>
            </li>
          </ol>
        </nav>

        {/* Top Product Layout: Single column on mobile, 50/50 on desktop */}
        <div className={styles.productLayout}>
          {/* Section 1: Gallery (images: [{ url, alt }]) */}
          <div className={styles.imageSection}>
            <ProductGallery
              images={images}
              videoUrl={product.videoUrl}
              videoUrls={product.videoUrls}
              productTitle={name}
              locale={locale}
            />
          </div>

          {/* Section 2: Info & Purchase directly under image on mobile */}
          <div className={styles.infoSection}>
            <h1 className={styles.productTitle}>{name}</h1>

            {shortSummary && shortSummary !== name && (
              <p className={styles.shortSummary}>{shortSummary}</p>
            )}

            {((effectiveRating !== null && effectiveRating > 0) ||
              (salesCount !== null && salesCount > 0)) && (
              <div className={styles.ratingRow}>
                {effectiveRating !== null && effectiveRating > 0 && (
                  <>
                    <div
                      className={styles.starsGroup}
                      aria-label={`${effectiveRating} out of 5 stars`}
                    >
                      {'★'.repeat(
                        Math.min(5, Math.max(1, Math.round(effectiveRating)))
                      )}
                      {'☆'.repeat(
                        Math.max(
                          0,
                          5 - Math.min(5, Math.max(1, Math.round(effectiveRating)))
                        )
                      )}
                    </div>
                    <span className={styles.ratingScore}>
                      {effectiveRating.toFixed(1)}
                    </span>
                  </>
                )}

                {effectiveReviewCount !== null && effectiveReviewCount > 0 && (
                  <span className={styles.reviewCount}>
                    ({formatNumber(effectiveReviewCount, locale as Locale)}{' '}
                    {isAr ? 'تقييم' : 'reviews'})
                  </span>
                )}

                {salesCount !== null && salesCount > 0 && (
                  <span className={styles.salesCount}>
                    <span className={styles.metaSeparator} aria-hidden="true">
                      •
                    </span>
                    {isAr
                      ? `تم بيع +${formatNumber(salesCount, locale as Locale)} قطعة`
                      : `${formatNumber(salesCount, locale as Locale)}+ sold`}
                  </span>
                )}
              </div>
            )}

            <ProductPriceRow
              priceAmount={priceAmount}
              oldPrice={oldPrice}
              priceCurrency={priceCurrency}
              discount={discount}
              inStock={inStock}
              locale={locale}
              productMeta={{
                id: product.id || productSlug,
                slug: productSlug,
                titleAr:
                  resolveLocalizedField(product.name, product.title, 'ar') ||
                  name,
                titleEn:
                  resolveLocalizedField(product.name, product.title, 'en') ||
                  name,
                categorySlug: categorySlug.toLowerCase(),
                imageUrl: allImageUrls[0] || '',
              }}
            />

            <div className={styles.purchaseActions}>
              <BuyNowButton
                href={affiliateUrl}
                label={isAr ? 'اشتري الآن' : 'Buy Now'}
                variant="primary"
              />

              <p className={styles.redirectNotice}>
                {isAr
                  ? 'سيتم توجيهك للمتجر الرسمي'
                  : "You'll be redirected to the official store"}
              </p>

              <div className={styles.trustBadge}>
                <span className={styles.trustBadgeIcon} aria-hidden="true">
                  ✓
                </span>
                <span>{isAr ? 'شراء آمن ومضمون' : 'Safe & Secure'}</span>
              </div>

              <div className={styles.secondaryActionsRow}>
                <SmartToolPulse
                  productSlug={productSlug}
                  productName={name}
                  priceAmount={priceAmount}
                  priceCurrency={priceCurrency}
                  formattedPrice={priceAmount !== null ? formattedPrice : undefined}
                  categorySlug={categorySlug}
                  categoryName={categoryName}
                  discount={discount}
                  shortSummary={shortSummary}
                  locale={locale}
                />

                <ReportModal
                  productSlug={productSlug}
                  productName={name}
                  locale={locale}
                  variant="product"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Editorial Highlights: whyWeChoseIt and thingsToNotice */}
        {(whyWeChoseIt || thingsToNotice) && (
          <div className={styles.editorialSection}>
            {whyWeChoseIt && (
              <div className={styles.editorialCard}>
                <h2 className={styles.editorialHeader}>
                  <span className={styles.editorialIconTeal} aria-hidden="true">
                    ★
                  </span>
                  <span>
                    {isAr ? 'لماذا اخترنا هذا المنتج؟' : 'Why We Chose It'}
                  </span>
                </h2>
                <p className={styles.editorialText}>{whyWeChoseIt}</p>
              </div>
            )}

            {thingsToNotice && (
              <div
                className={`${styles.editorialCard} ${styles.editorialCardNotice}`}
              >
                <h2 className={styles.editorialHeader}>
                  <span
                    className={styles.editorialIconNotice}
                    aria-hidden="true"
                  >
                    ℹ
                  </span>
                  <span>
                    {isAr ? 'نقاط يجب الانتباه لها' : 'Things to Notice'}
                  </span>
                </h2>
                <p className={styles.editorialText}>{thingsToNotice}</p>
              </div>
            )}
          </div>
        )}

        {/* detailedDescription */}
        {detailedDescription && (
          <ProductDescription
            description={detailedDescription}
            locale={locale}
          />
        )}

        {/* Product Reviews & Rating System */}
        <ProductReviews
          productSlug={product.slug}
          locale={locale}
          initialReviews={reviewsSummary.reviews}
          initialAverageRating={reviewsSummary.averageRating}
          initialTotalCount={reviewsSummary.totalCount}
          initialDistribution={reviewsSummary.distribution}
        />

        {/* Related Buying Guides (أدلة شراء ذات صلة بالمنتج) */}
        {relatedGuides.length > 0 && (
          <section className={styles.relatedGuidesSection} aria-labelledby="related-guides-heading">
            <h2 id="related-guides-heading" className={styles.relatedGuidesHeading}>
              <EditorialGuideIcon size={20} />
              <span>
                {isAr ? 'أدلة ومراجعات ذات صلة' : 'Related Buying Guides & Reviews'}
              </span>
            </h2>
            <div className={styles.relatedGuidesGrid}>
              {relatedGuides.map((guide) => (
                <Link
                  key={guide.id}
                  href={`/${locale}/guides/${encodeURIComponent(guide.slug)}`}
                  className={styles.guideMiniCard}
                >
                  <span className={styles.guideMiniCategory}>
                    {isAr ? guide.categoryName.ar : guide.categoryName.en}
                  </span>
                  <h3 className={styles.guideMiniTitle}>
                    {isAr ? guide.title.ar : guide.title.en}
                  </h3>
                  <p className={styles.guideMiniExcerpt}>
                    {isAr ? guide.excerpt.ar : guide.excerpt.en}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <section
            className={styles.similarSection}
            aria-labelledby="similar-products-heading"
          >
            <h2 id="similar-products-heading" className={styles.similarHeading}>
              {isAr ? 'منتجات مشابهة' : 'Similar Products'}
            </h2>

            <div className={styles.similarGrid}>
              {similarProducts.map((similar) => {
                const simName =
                  resolveLocalizedField(
                    similar.name,
                    similar.title,
                    locale
                  ) || similar.slug;

                const simPrice =
                  typeof similar.priceAmount === 'number' &&
                  !Number.isNaN(similar.priceAmount)
                    ? formatProductPrice(
                        similar.priceAmount,
                        similar.priceCurrency,
                        locale
                      )
                    : isAr
                      ? 'عرض السعر'
                      : 'Check Price';

                const simImage = similar.images?.[0]?.url || '';

                return (
                  <div key={similar.id} className={styles.similarCard}>
                    <Link
                      href={`/${locale}/products/${similar.slug}`}
                      className={styles.similarImageLink}
                      tabIndex={-1}
                    >
                      {simImage ? (
                        <Image
                          src={simImage}
                          alt={simName}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className={styles.similarImage}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className={styles.imageFallback}>
                          <span>{simName.slice(0, 1)}</span>
                        </div>
                      )}
                    </Link>

                    <div className={styles.similarCardBody}>
                      <Link
                        href={`/${locale}/products/${similar.slug}`}
                        className={styles.similarTitleLink}
                      >
                        <h3 className={styles.similarTitle}>{simName}</h3>
                      </Link>

                      <div className={styles.similarPriceRow}>
                        <span className={`${styles.similarPrice} tabularNums`}>
                          {simPrice}
                        </span>
                      </div>

                      <Link
                        href={`/${locale}/products/${similar.slug}`}
                        className={styles.similarViewButton}
                      >
                        {isAr ? 'عرض المنتج' : 'View Product'}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* Sticky Buy Button for Mobile */}
      <div className={styles.stickyMobileBar} aria-label="Quick Purchase Bar">
        <div className={styles.stickyInfo}>
          <div className={styles.stickyTitle}>{name}</div>
          {priceAmount !== null && (
            <div className={`${styles.stickyPrice} tabularNums`}>
              {formattedPrice}
            </div>
          )}
        </div>
        <BuyNowButton
          href={affiliateUrl}
          label={isAr ? 'اشتري الآن' : 'Buy Now'}
          variant="sticky"
        />
      </div>

      <SiteFooter />
    </div>
  );
}
