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
import { formatProductPrice } from '@/lib/format';
import { SiteHeader } from '@/components/sections/SiteHeader';
import { SiteFooter } from '@/components/sections/SiteFooter';
import { ProductGallery } from './ProductGallery';
import { ProductDescription } from './ProductDescription';
import { ProductReviews } from '@/components/ProductReviews/ProductReviews';
import { getReviewsByProductSlug } from '@/server/repositories/reviews.repo';
import styles from './ProductPage.module.css';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://soufshop.store';

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

  const name =
    product.name?.[locale as Locale] ||
    product.name?.en ||
    product.title?.[locale as Locale] ||
    product.title?.en ||
    '';

  const description =
    product.shortSummary?.[locale as Locale] ||
    product.description?.[locale as Locale] ||
    product.shortSummary?.en ||
    product.description?.en ||
    product.name?.[locale as Locale] ||
    '';

  const image = product.images?.[0]?.url || '';

  return {
    title: `${name} | SoufShop`,
    description: description.slice(0, 155),
    alternates: {
      canonical: `https://soufshop.store/${locale}/products/${slug}`,
      languages: {
        en: `https://soufshop.store/en/products/${slug}`,
        ar: `https://soufshop.store/ar/products/${slug}`,
        'x-default': `https://soufshop.store/en/products/${slug}`,
      },
    },
    openGraph: {
      title: name,
      description: description.slice(0, 155),
      url: `https://soufshop.store/${locale}/products/${slug}`,
      images: image
        ? [
            {
              url: image,
              width: 800,
              height: 800,
              alt: name,
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} | SoufShop`,
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

  const productUrl = `${BASE_URL}/${locale}/products/${productSlug}`;
  const primaryImageUrl = images[0]?.url || '';

  // JSON-LD structured data with real image URL
  const productSchemaNode: Record<string, unknown> = {
    '@type': 'Product',
    name,
    description: (shortSummary || detailedDescription || name).slice(0, 155),
    ...(primaryImageUrl ? { image: [primaryImageUrl] } : {}),
    url: productUrl,
    ...(priceAmount !== null && priceAmount > 0
      ? {
          offers: {
            '@type': 'Offer',
            price: priceAmount,
            priceCurrency,
            availability: inStock
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
            url: productUrl,
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
              item: `${BASE_URL}/${locale}/categories/${categorySlug}`,
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
    '@graph': [productSchemaNode, breadcrumbSchemaNode],
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
          {/* Section 1: Gallery (images: [{ url }]) */}
          <div className={styles.imageSection}>
            <ProductGallery
              images={images}
              videoUrl={product.videoUrl}
              productTitle={name}
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
                    ({effectiveReviewCount.toLocaleString(locale)}{' '}
                    {isAr ? 'تقييم' : 'reviews'})
                  </span>
                )}

                {salesCount !== null && salesCount > 0 && (
                  <span className={styles.salesCount}>
                    <span className={styles.metaSeparator} aria-hidden="true">
                      •
                    </span>
                    {isAr
                      ? `تم بيع +${salesCount.toLocaleString(locale)} قطعة`
                      : `${salesCount.toLocaleString(locale)}+ sold`}
                  </span>
                )}
              </div>
            )}

            <div className={styles.priceRow}>
              {priceAmount !== null && (
                <span className={`${styles.price} tabularNums`}>
                  {formattedPrice}
                </span>
              )}

              {formattedOldPrice && (
                <span className={`${styles.priceOriginal} tabularNums`}>
                  {formattedOldPrice}
                </span>
              )}

              {discount !== null && discount > 0 && (
                <span className={styles.discountBadge}>
                  -{discount}%
                </span>
              )}

              <span className={styles.inStockBadge}>
                <span className={styles.inStockDot} aria-hidden="true" />
                {inStock
                  ? isAr
                    ? 'متوفر بالمخزون'
                    : 'In Stock'
                  : isAr
                    ? 'نفذت الكمية'
                    : 'Out of Stock'}
              </span>
            </div>

            <div className={styles.purchaseActions}>
              <a
                href={affiliateUrl}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className={styles.buyNowBtn}
              >
                <span>{isAr ? 'اشتري الآن' : 'Buy Now'}</span>
              </a>

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
              {isAr ? '📖 أدلة ومراجعات ذات صلة' : '📖 Related Buying Guides & Reviews'}
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
        <a
          href={affiliateUrl}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className={styles.stickyButton}
        >
          {isAr ? 'اشتري الآن' : 'Buy Now'}
        </a>
      </div>

      <SiteFooter />
    </div>
  );
}
