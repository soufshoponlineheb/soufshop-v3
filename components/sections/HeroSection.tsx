'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpLeft, Search, X } from 'lucide-react';
import type { Category, Locale, Product } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import { getDictionary } from '@/i18n';
import { formatProductPrice } from '@/lib/format';
import { searchAndRankProducts } from '@/lib/productSearch';
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
  categories = [],
  searchQuery,
  onSearchChange,
  activeChip,
  onChipSelect,
  pageLocale,
}: HeroSectionProps) {
  const { locale: contextLocale, t } = useI18n();
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

  // Live instant results from the very first letter or any word in the product
  const liveMatches = useMemo(() => {
    if (!trimmedQuery || products.length === 0) return [];
    return searchAndRankProducts(products, trimmedQuery).slice(0, 6);
  }, [products, trimmedQuery]);

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
      router.push(`/products?q=${encodeURIComponent(trimmedQuery)}`);
    } else {
      router.push('/products');
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
            <span className={styles.headlineLine}>{messages.hero.titleLine1}</span>
            <span className={styles.headlineAccent}>{messages.hero.titleLine2}</span>
          </h1>

          {/* 3. Subtitle (16px, white 85% opacity) */}
          <p className={styles.heroDescription}>{messages.hero.subtitle}</p>

          {/* Primary CTA Button */}
          <div className={styles.heroCtaWrap}>
            <Link href="/products" className={styles.heroPrimaryCta}>
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
                placeholder={isAr ? 'ابحث عن منتج...' : 'Search for a product...'}
                className={styles.searchInput}
                aria-label={isAr ? 'ابحث عن منتج' : 'Search for a product'}
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

            {/* Instant Live Search Results Dropdown (from 1st character or any word) */}
            {isDropdownOpen && trimmedQuery.length > 0 && (
              <div
                className={styles.liveDropdown}
                role="listbox"
                aria-label={isAr ? 'نتائج البحث المباشرة' : 'Live search results'}
              >
                {liveMatches.length > 0 ? (
                  <>
                    <div className={styles.liveDropdownHeader}>
                      <span>
                        {isAr
                          ? `نتائج فورية (${liveMatches.length})`
                          : `Instant Results (${liveMatches.length})`}
                      </span>
                    </div>

                    <ul className={styles.liveList}>
                      {liveMatches.map((item) => {
                        const itemTitle = t(item.title);
                        const itemSource = t(item.sourceName);
                        const itemImage = item.images?.[0]?.url || '';
                        const itemPrice =
                          item.priceAmount !== null && item.priceAmount > 0
                            ? formatProductPrice(
                                item.priceAmount,
                                item.priceCurrency,
                                locale
                              )
                            : null;

                        return (
                          <li key={item.id} className={styles.liveListItem}>
                            <Link
                              href={`/products/${encodeURIComponent(item.slug)}`}
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
                      ? `لا توجد منتجات مطابقة لـ "${trimmedQuery}"`
                      : `No matching products for "${trimmedQuery}"`}
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
                  href={`/categories/${encodeURIComponent(chip.slug || chip.query)}`}
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
