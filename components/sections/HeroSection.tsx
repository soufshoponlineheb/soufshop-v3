'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpLeft, BookOpen, Search, X } from 'lucide-react';
import type { Article, Category, Locale, Product } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import { getDictionary } from '@/i18n';
import { formatNumber, formatProductPrice } from '@/lib/format';
import {
  findMatchingProducts,
  searchAndRankArticles,
} from '@/lib/productSearch';
import { searchTools } from '@/lib/tools-data';
import styles from './HeroSection.module.css';

export interface HeroQuickChip {
  labelAr: string;
  labelEn: string;
  query: string;
  slug?: string;
  icon?: string;
}

export interface HeroSectionProps {
  /** Optional custom background image URL (can also be overridden via --hero-bg-image CSS variable) */
  backgroundImageUrl?: string;
  /** Products list for instant single-letter live search results dropdown */
  products?: Product[];
  /** Articles / buying guides list for instant live search results dropdown */
  articles?: Article[];
  /** Categories list from Firestore */
  categories?: Category[];
  /** Optional controlled search & chip callback to filter products directly on the Home page */
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  activeChip?: string;
  onChipSelect?: (chipQuery: string, slug?: string) => void;
  /** Explicit route locale ('ar' | 'en') to guarantee SSR H1 matches page language */
  pageLocale?: Locale;
}

const DEFAULT_QUICK_CHIPS: HeroQuickChip[] = [
  { labelAr: 'إلكترونيات', labelEn: 'Electronics', query: 'إلكترونيات', slug: 'electronics' },
  { labelAr: 'المنزل والمطبخ', labelEn: 'Home & Kitchen', query: 'منزل', slug: 'home' },
  { labelAr: 'الصحة والعناية', labelEn: 'Health', query: 'صحة', slug: 'health' },
  { labelAr: 'الرياضة واللياقة', labelEn: 'Sports', query: 'رياضة', slug: 'sports' },
  { labelAr: 'الموضة والأزياء', labelEn: 'Fashion', query: 'موضة', slug: 'fashion' },
];

export function HeroSection({
  backgroundImageUrl,
  products = [],
  articles = [],
  categories = [],
  searchQuery,
  onSearchChange,
  activeChip,
  onChipSelect,
  pageLocale,
}: HeroSectionProps) {
  const { locale: contextLocale, t, currency } = useI18n();
  const locale: Locale = pageLocale || contextLocale;
  const messages = getDictionary(locale);
  const router = useRouter();
  const isAr = locale === 'ar';
  const [internalQuery, setInternalQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  const currentQuery = searchQuery !== undefined ? searchQuery : internalQuery;
  const trimmedQuery = currentQuery.trim();

  // Compute chips to render from Firestore categories if available
  const chipsToRender = useMemo<HeroQuickChip[]>(() => {
    if (categories && categories.length > 0) {
      return categories
        .filter((c) => c.isActive !== false)
        .map((c) => ({
          labelAr: c.name?.ar || c.name?.en || c.slug,
          labelEn: c.name?.en || c.name?.ar || c.slug,
          query: c.slug,
          slug: c.slug,
          icon: c.icon || '',
        }));
    }
    return DEFAULT_QUICK_CHIPS;
  }, [categories]);

  // Live instant results for both Products and Articles/Buying Guides
  const liveProductMatches = useMemo(() => {
    if (!trimmedQuery || products.length === 0) return [];
    return findMatchingProducts(products, trimmedQuery, articles).slice(0, 5);
  }, [products, articles, trimmedQuery]);

  const liveArticleMatches = useMemo(() => {
    if (!trimmedQuery || articles.length === 0) return [];
    return searchAndRankArticles(articles, trimmedQuery, products).slice(0, 4);
  }, [articles, products, trimmedQuery]);

  const liveToolMatches = useMemo(() => {
    if (!trimmedQuery) return [];
    return searchTools(trimmedQuery).slice(0, 3);
  }, [trimmedQuery]);

  const totalLiveMatches =
    liveProductMatches.length + liveArticleMatches.length + liveToolMatches.length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (val: string) => {
    setIsDropdownOpen(val.trim().length > 0);
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setInternalQuery(val);
    }
  };

  const handleClearSearch = () => {
    handleInputChange('');
    setIsDropdownOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDropdownOpen(false);
    if (onSearchChange) {
      onSearchChange(trimmedQuery);
      const catalogEl = document.getElementById('home-products-section');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    if (trimmedQuery) {
      router.push(`/${locale}/products?q=${encodeURIComponent(trimmedQuery)}`);
    } else {
      router.push(`/${locale}/products`);
    }
  };

  return (
    <section
      className={styles.heroWrapper}
      dir={isAr ? 'rtl' : 'ltr'}
      aria-label={isAr ? 'القسم الرئيسي' : 'Hero Section'}
    >
      {/* 1. Full-width Hero with Background Image & Dark Overlay */}
      <div className={`${styles.hero} ${styles.heroBanner}`}>
        <div className={`siteContainer ${styles.heroContent} ${styles.heroInner}`}>
          {/* 2. Massive Centered White Title (2-line structure) */}
          <h1 className={styles.heroHeadline}>
            <span className={styles.headlineLine}>{messages.hero.titleLine1}</span>{' '}
            <span className={styles.headlineAccent}>{messages.hero.titleLine2}</span>
          </h1>

          {/* 3. Subtitle (16px, white 85% opacity) */}
          <p className={styles.heroDescription}>{messages.hero.subtitle}</p>

          {/* Primary CTA Button */}
          <div className={styles.heroCtaWrap}>
            <Link href={`/${locale}/products`} className={styles.heroPrimaryCta}>
              {messages.hero.primaryCta}
            </Link>
          </div>

          {/* 4. Centered Search Bar + Instant Live Results Dropdown */}
          <div ref={searchBoxRef} className={styles.searchContainer}>
            <form
              onSubmit={handleSearchSubmit}
              className={styles.searchForm}
              role="search"
              autoComplete="off"
            >
              <button type="submit" className={styles.searchSubmitBtn}>
                {isAr ? 'بحث' : 'Search'}
              </button>

              <input
                type="search"
                value={currentQuery}
                onFocus={() => {
                  if (trimmedQuery.length > 0) setIsDropdownOpen(true);
                }}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={
                  isAr
                    ? 'ابحث عن منتج أو مقالة مراجعة...'
                    : 'Search products or buying guides...'
                }
                className={styles.searchInput}
                aria-label={
                  isAr
                    ? 'ابحث عن منتج أو مقالة مراجعة'
                    : 'Search products or buying guides'
                }
              />

              {trimmedQuery.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className={styles.clearSearchBtn}
                  aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                >
                  <X size={15} />
                </button>
              )}

              <span className={styles.searchIconLeft} aria-hidden="true">
                <Search size={19} />
              </span>
            </form>

            {/* Instant Live Search Results Dropdown (Products + Articles/Buying Guides) */}
            {isDropdownOpen && trimmedQuery.length > 0 && (
              <div
                className={styles.liveDropdown}
                role="listbox"
                aria-label={isAr ? 'نتائج البحث المباشرة' : 'Live search results'}
              >
                {totalLiveMatches > 0 ? (
                  <>
                    <div className={styles.liveDropdownHeader}>
                      <span>
                        {isAr
                          ? `نتائج فورية (${formatNumber(totalLiveMatches, locale)})`
                          : `Instant Results (${formatNumber(totalLiveMatches, locale)})`}
                      </span>
                    </div>

                    <div className={styles.liveScrollArea}>
                      {/* A. Matching Articles / Buying Guides */}
                      {liveArticleMatches.length > 0 && (
                        <div className={styles.liveGroupBlock}>
                          <div className={styles.liveGroupTitle}>
                            <BookOpen size={13} aria-hidden="true" />
                            <span>
                              {isAr
                                ? `أدلة الشراء والمقالات (${formatNumber(liveArticleMatches.length, locale)})`
                                : `Buying Guides & Reviews (${formatNumber(liveArticleMatches.length, locale)})`}
                            </span>
                          </div>
                          <ul className={styles.liveList}>
                            {liveArticleMatches.map((art) => {
                              const artTitle = t(art.title);
                              const artCat = t(art.categoryName);
                              const artImg = art.coverImage || '/images/hero-bg.jpg';

                              return (
                                <li key={`art-${art.id}`} className={styles.liveListItem}>
                                  <Link
                                    href={`/${locale}/guides/${encodeURIComponent(art.slug)}`}
                                    onClick={() => setIsDropdownOpen(false)}
                                    className={styles.liveResultLink}
                                  >
                                    <div className={styles.liveThumbWrap}>
                                      <img
                                        src={artImg}
                                        alt={artTitle}
                                        width={44}
                                        height={44}
                                        className={styles.liveThumbCover}
                                        referrerPolicy="no-referrer"
                                      />
                                    </div>

                                    <div className={styles.liveInfoCol}>
                                      <span className={styles.liveItemTitle}>{artTitle}</span>
                                      <span className={styles.liveItemMeta}>
                                        {artCat} · {formatNumber(art.readingTimeMinutes || 5, locale)}{' '}
                                        {isAr ? 'دقائق قراءة' : 'min read'}
                                      </span>
                                    </div>

                                    <div className={styles.livePriceCol}>
                                      <span className={styles.liveGuideTag}>
                                        {isAr ? 'مقالة ومقارنة' : 'Guide'}
                                      </span>
                                      <ArrowUpLeft size={15} className={styles.liveArrow} />
                                    </div>
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      {/* B. Matching Products */}
                      {liveProductMatches.length > 0 && (
                        <div className={styles.liveGroupBlock}>
                          {liveArticleMatches.length > 0 && (
                            <div className={styles.liveGroupTitle}>
                              <span>
                                {isAr
                                  ? `المنتجات (${formatNumber(liveProductMatches.length, locale)})`
                                  : `Products (${formatNumber(liveProductMatches.length, locale)})`}
                              </span>
                            </div>
                          )}
                          <ul className={styles.liveList}>
                            {liveProductMatches.map((item) => {
                              const itemTitle = t(item.title);
                              const itemSource = t(item.sourceName) || item.sourceSlug || 'Amazon';
                              const itemImage = item.images?.[0]?.url || '';
                              const itemPrice =
                                item.priceAmount !== null && item.priceAmount > 0
                                  ? formatProductPrice(
                                      item.priceAmount,
                                      item.priceCurrency,
                                      locale,
                                      currency
                                    )
                                  : null;

                              return (
                                <li key={`prod-${item.id}`} className={styles.liveListItem}>
                                  <Link
                                    href={`/${locale}/products/${encodeURIComponent(item.slug)}`}
                                    onClick={() => setIsDropdownOpen(false)}
                                    className={styles.liveResultLink}
                                  >
                                    <div className={styles.liveThumbWrap}>
                                      {itemImage ? (
                                        <img
                                          src={itemImage}
                                          alt={itemTitle}
                                          width={44}
                                          height={44}
                                          className={styles.liveThumb}
                                          referrerPolicy="no-referrer"
                                        />
                                      ) : (
                                        <span className={styles.liveThumbFallback}>
                                          {itemTitle.slice(0, 1)}
                                        </span>
                                      )}
                                    </div>

                                    <div className={styles.liveInfoCol}>
                                      <span className={styles.liveItemTitle}>{itemTitle}</span>
                                      <span className={styles.liveItemMeta}>
                                        {itemSource} · {t(item.categoryName)}
                                      </span>
                                    </div>

                                    <div className={styles.livePriceCol}>
                                      {itemPrice && (
                                        <span
                                          dir="ltr"
                                          className={`${styles.livePriceBadge} tabularNums`}
                                        >
                                          {itemPrice}
                                        </span>
                                      )}
                                      <ArrowUpLeft size={15} className={styles.liveArrow} />
                                    </div>
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      {/* C. Matching Free Tools */}
                      {liveToolMatches.length > 0 && (
                        <div className={styles.liveGroupBlock}>
                          <div className={styles.liveGroupTitle}>
                            <span>
                              {isAr
                                ? `أدوات ذكية مجانية (${formatNumber(liveToolMatches.length, locale)})`
                                : `Free Smart Tools (${formatNumber(liveToolMatches.length, locale)})`}
                            </span>
                          </div>
                          <ul className={styles.liveList}>
                            {liveToolMatches.map((tool) => (
                              <li key={`tool-${tool.slug}`} className={styles.liveListItem}>
                                <Link
                                  href={`/${locale}/tools/${tool.slug}`}
                                  onClick={() => setIsDropdownOpen(false)}
                                  className={styles.liveResultLink}
                                >
                                  <div className={styles.liveInfoCol}>
                                    <span className={styles.liveItemTitle}>
                                      {isAr ? tool.nameAr : tool.nameEn}
                                    </span>
                                    <span className={styles.liveItemMeta}>
                                      {isAr ? tool.descriptionAr : tool.descriptionEn}
                                    </span>
                                  </div>
                                  <div className={styles.livePriceCol}>
                                    <span className={styles.liveGuideTag}>
                                      {isAr ? 'أداة مجانية' : 'Free Tool'}
                                    </span>
                                    <ArrowUpLeft size={15} className={styles.liveArrow} />
                                  </div>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className={styles.viewAllMatchesBtn}
                    >
                      {isAr
                        ? `عرض كل النتائج المطابقة لـ "${trimmedQuery}" ↓`
                        : `View all results for "${trimmedQuery}" ↓`}
                    </button>
                  </>
                ) : (
                  <div className={styles.noLiveMatch}>
                    {isAr
                      ? `لا توجد نتائج مطابقة لـ "${trimmedQuery}"`
                      : `No matching results for "${trimmedQuery}"`}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 5. Quick Category Chips below search */}
          <div
            className={styles.chipsRow}
            aria-label={isAr ? 'تصنيفات سريعة' : 'Quick Categories'}
          >
            {chipsToRender.map((chip) => {
              const label = isAr ? chip.labelAr : chip.labelEn;
              const isSelected =
                activeChip === chip.slug ||
                activeChip === chip.query ||
                activeChip === label;

              if (onChipSelect) {
                return (
                  <button
                    key={chip.slug || chip.labelAr}
                    type="button"
                    onClick={() => {
                      onChipSelect(isSelected ? '' : chip.query, chip.slug);
                      setIsDropdownOpen(false);
                      const catalogEl = document.getElementById('home-products-section');
                      if (catalogEl) {
                        catalogEl.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className={`${styles.quickChip} ${
                      isSelected ? styles.quickChipActive : ''
                    }`}
                  >
                    {chip.icon && <span style={{ marginInlineEnd: '4px' }}>{chip.icon}</span>}
                    {label}
                  </button>
                );
              }

              return (
                <Link
                  key={chip.slug || chip.labelAr}
                  href={`/${locale}/categories/${encodeURIComponent(chip.slug || chip.query)}`}
                  className={styles.quickChip}
                >
                  {chip.icon && <span style={{ marginInlineEnd: '4px' }}>{chip.icon}</span>}
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6. Bottom Horizontal Stats Bar (4 metrics on dark background) */}
      <div className={styles.statsBar}>
        <div className={`siteContainer ${styles.statsGrid}`}>
          <div className={styles.statItem}>
            <strong className={styles.statHighlight}>{messages.hero.stats.products}</strong>
          </div>
          <div className={styles.statItem}>
            <strong className={styles.statHighlight}>{messages.hero.stats.stores}</strong>
          </div>
          <div className={styles.statItem}>
            <strong className={styles.statHighlight}>{messages.hero.stats.updates}</strong>
          </div>
          <div className={styles.statItem}>
            <strong className={styles.statHighlight}>{messages.hero.stats.safeBuy}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
