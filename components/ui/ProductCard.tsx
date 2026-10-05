'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart } from 'lucide-react';
import type { LocalizedText, Product, PromoBadgeType } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import { formatNumber, formatProductPrice } from '@/lib/format';
import { ProductArtwork } from './ProductArtwork';
import styles from './ProductCard.module.css';

export type PartnerSourceSlug = 'amazon' | 'noon' | 'temu' | 'clickbank' | string;

export interface ProductCardProps {
  /** Optional full Product object for existing catalog views */
  product?: Product;
  /** Direct props as specified for Temu/Noon mobile card */
  title?: LocalizedText | string;
  price?: number | null;
  oldPrice?: number | null;
  currency?: string;
  discount?: number | null;
  stars?: number | null;
  soldCount?: number | null;
  source?: PartnerSourceSlug;
  imageUrl?: string;
  affiliateUrl?: string;
  badge?: PromoBadgeType;
  /** Interactive wishlist state */
  isSaved?: boolean;
  onToggleSave?: (productId: string) => void;
  refContext?: string;
}

const SOURCE_LABELS: Record<string, { ar: string; en: string }> = {
  amazon: { ar: 'Amazon', en: 'Amazon' },
  noon: { ar: 'Noon', en: 'Noon' },
  temu: { ar: 'Temu', en: 'Temu' },
  clickbank: { ar: 'ClickBank', en: 'ClickBank' },
};

function renderStarString(rating: number): string {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  return '★'.repeat(clamped) + '☆'.repeat(5 - clamped);
}

export function ProductCard({
  product,
  title: propTitle,
  price: propPrice,
  oldPrice: propOldPrice,
  currency: propCurrency,
  discount: propDiscount,
  stars: propStars,
  soldCount: propSoldCount,
  source: propSource,
  imageUrl: propImageUrl,
  affiliateUrl: propAffiliateUrl,
  badge: propBadge,
  isSaved = false,
  onToggleSave,
  refContext = 'catalog_card',
}: ProductCardProps) {
  const { locale, messages, t } = useI18n();
  const isAr = locale === 'ar';

  const resolvedTitle =
    typeof propTitle === 'string'
      ? propTitle
      : propTitle
        ? t(propTitle)
        : product
          ? t(product.title)
          : '';

  const resolvedPrice =
    propPrice !== undefined ? propPrice : product ? product.priceAmount : null;

  const explicitOldPrice =
    propOldPrice !== undefined ? propOldPrice : product?.oldPrice ?? null;

  const explicitDiscount =
    propDiscount !== undefined && propDiscount !== null
      ? propDiscount
      : product?.discount !== undefined && product?.discount !== null
        ? product.discount
        : null;

  const resolvedOldPrice =
    explicitOldPrice !== null && explicitOldPrice > 0
      ? explicitOldPrice
      : resolvedPrice !== null && resolvedPrice > 0
        ? Math.round((resolvedPrice / (1 - (explicitDiscount || 30) / 100)) * 100) / 100
        : null;

  const resolvedCurrency = propCurrency || product?.priceCurrency || 'DH';

  const computedDiscount =
    explicitDiscount !== null && explicitDiscount > 0
      ? explicitDiscount
      : resolvedOldPrice &&
          resolvedPrice &&
          resolvedOldPrice > resolvedPrice &&
          resolvedOldPrice > 0
        ? Math.round(((resolvedOldPrice - resolvedPrice) / resolvedOldPrice) * 100)
        : 30;

  const resolvedStars =
    propStars !== undefined && propStars !== null
      ? propStars
      : product?.stars !== undefined && product?.stars !== null
        ? product.stars
        : 4.3;

  const resolvedSoldCount =
    propSoldCount !== undefined && propSoldCount !== null
      ? propSoldCount
      : product?.soldCount !== undefined && product?.soldCount !== null
        ? product.soldCount
        : 120;

  const rawSource = (
    propSource ||
    product?.sourceSlug ||
    product?.sourceId ||
    'amazon'
  )
    .toLowerCase()
    .trim();

  const sourceLabel = SOURCE_LABELS[rawSource]
    ? isAr
      ? SOURCE_LABELS[rawSource].ar
      : SOURCE_LABELS[rawSource].en
    : product?.sourceName
      ? t(product.sourceName)
      : rawSource.toUpperCase();

  const resolvedImageUrl =
    propImageUrl || product?.images?.[0]?.url || '';
  const resolvedImageAlt =
    product?.images?.[0]?.alt ? t(product.images[0].alt) : resolvedTitle;

  const resolvedBadge: PromoBadgeType =
    propBadge !== undefined ? propBadge : product?.badge ?? null;

  const detailHref = product?.slug
    ? `/${locale}/products/${encodeURIComponent(product.slug)}`
    : undefined;

  const outboundHref =
    product?.affiliateUrl ||
    (product?.slug
      ? `/go/${encodeURIComponent(product.slug)}?ref=${encodeURIComponent(refContext)}`
      : propAffiliateUrl || '#');

  const formattedPrice =
    resolvedPrice !== null && resolvedPrice !== undefined && resolvedPrice > 0
      ? formatProductPrice(resolvedPrice, resolvedCurrency, locale)
      : '';

  const formattedOldPrice =
    resolvedOldPrice !== null &&
    resolvedOldPrice !== undefined &&
    resolvedOldPrice > 0
      ? formatProductPrice(resolvedOldPrice, resolvedCurrency, locale)
      : '';

  const productId = product?.id || product?.slug || resolvedTitle;

  return (
    <article className={styles.card}>
      {/* 1. Image Area (55% of card height) */}
      <div className={styles.mediaZone}>
        {detailHref ? (
          <Link href={detailHref} className={styles.mediaLink} aria-label={resolvedTitle}>
            {resolvedImageUrl ? (
              <img
                src={resolvedImageUrl}
                alt={resolvedImageAlt || resolvedTitle}
                className={styles.productImage}
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            ) : (
              <div className={styles.artworkWrap}>
                <ProductArtwork
                  title={resolvedTitle}
                  categoryLabel={product ? t(product.categoryName) : sourceLabel}
                  noteText={messages.product.temporaryArtworkNote}
                />
              </div>
            )}
          </Link>
        ) : (
          <a
            href={outboundHref}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className={styles.mediaLink}
            aria-label={resolvedTitle}
          >
            {resolvedImageUrl ? (
              <img
                src={resolvedImageUrl}
                alt={resolvedImageAlt || resolvedTitle}
                className={styles.productImage}
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            ) : (
              <div className={styles.artworkWrap}>
                <ProductArtwork
                  title={resolvedTitle}
                  categoryLabel={sourceLabel}
                  noteText={messages.product.temporaryArtworkNote}
                />
              </div>
            )}
          </a>
        )}

        {/* Badge — Top Start (shows category in product_related context to avoid external store names) */}
        {(refContext === 'product_related'
          ? Boolean(product?.categoryName && t(product.categoryName))
          : Boolean(sourceLabel)) && (
          <span
            className={`${styles.sourceBadge} ${styles[`source_${rawSource}`] || ''}`}
          >
            {refContext === 'product_related' && product?.categoryName
              ? t(product.categoryName)
              : sourceLabel}
          </span>
        )}

        {/* Wishlist Heart Icon ♡ — Top End */}
        {onToggleSave && (
          <button
            type="button"
            onClick={() => onToggleSave(productId)}
            className={`${styles.heartBtn} ${styles.heartTop} ${
              isSaved ? styles.heartActive : ''
            }`}
            aria-pressed={isSaved}
            aria-label={isSaved ? messages.product.savedItem : messages.product.saveItem}
          >
            <Heart
              size={15}
              fill={isSaved ? 'currentColor' : 'none'}
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      {/* 2. Info Section (flex-direction: column + justify-content: space-between) */}
      <div className={styles.infoZone}>
        <div className={styles.topInfoGroup}>
          <h3 className={styles.title}>
            {detailHref ? (
              <Link href={detailHref} className={styles.titleLink}>
                {resolvedTitle}
              </Link>
            ) : (
              <a
                href={outboundHref}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className={styles.titleLink}
              >
                {resolvedTitle}
              </a>
            )}
          </h3>

          {/* 2. Stars Rating directly below product name: ★★★★☆ 4.3 (120 تقييم) */}
          <div className={styles.ratingRow}>
            <span className={styles.starsText} aria-label={`${resolvedStars} / 5`}>
              {renderStarString(resolvedStars)}
            </span>
            <span className={`${styles.ratingScore} tabularNums`}>
              {resolvedStars.toFixed(1)}
            </span>
            <span className={`${styles.soldText} tabularNums`}>
              {isAr
                ? `(${formatNumber(resolvedSoldCount, locale)} تقييم)`
                : `(${formatNumber(resolvedSoldCount, locale)} reviews)`}
            </span>
          </div>
        </div>

        {/* 3, 4 & 5. Single-line Price + Inline Discount Badge + Full-width Buy Now Button */}
        <div className={styles.bottomActionArea}>
          <div className={styles.priceLine}>
            {formattedPrice ? (
              <>
                {formattedOldPrice && (
                  <span dir="ltr" className={`${styles.oldPrice} tabularNums`}>
                    {formattedOldPrice}
                  </span>
                )}
                <span dir="ltr" className={`${styles.currentPrice} tabularNums`}>
                  {formattedPrice}
                </span>
                {computedDiscount !== null && computedDiscount > 0 && (
                  <span dir="ltr" className={`${styles.inlineDiscountBadge} tabularNums`}>
                    -{computedDiscount}%
                  </span>
                )}
              </>
            ) : (
              <span className={styles.checkStoreLabel}>
                {messages.product.priceMayVary}
              </span>
            )}
          </div>

          <a
            href={outboundHref}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className={styles.fullBuyBtn}
          >
            <ShoppingCart size={15} aria-hidden="true" />
            <span>{messages.product.buyNow}</span>
          </a>
        </div>
      </div>
    </article>
  );
}
