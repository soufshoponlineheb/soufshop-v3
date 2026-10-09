'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpDown,
  ArrowUpLeft,
  BookOpen,
  Check,
  ChevronDown,
  Search,
  X,
} from 'lucide-react';
import type { Article, Product } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import { formatNumber, formatProductPrice } from '@/lib/format';
import {
  findMatchingProducts,
  searchAndRankArticles,
} from '@/lib/productSearch';
import styles from './FilterBar.module.css';

export interface FilterBarProps {
  onFilterChange: (filters: {
    query: string;
    sortBy: string;
    maxPrice: number | null;
    store: string;
  }) => void;
  totalProducts: number;
  filteredCount: number;
  initialQuery?: string;
  initialStore?: string;
  products?: Product[];
  articles?: Article[];
}

interface SortOptionItem {
  value: string;
  labelAr: string;
  labelEn: string;
}

const SORT_OPTIONS: SortOptionItem[] = [
  { value: 'newest', labelAr: 'الأحدث', labelEn: 'Newest' },
  { value: 'price_desc', labelAr: 'الأعلى سعراً', labelEn: 'Highest Price' },
  { value: 'price_asc', labelAr: 'الأقل سعراً', labelEn: 'Lowest Price' },
  { value: 'rating_desc', labelAr: 'الأعلى تقييماً', labelEn: 'Highest Rated' },
  { value: 'sold_desc', labelAr: 'الأكثر مبيعاً', labelEn: 'Best Selling' },
];

const MAX_SLIDER_PRICE = 5000;

export function FilterBar({
  onFilterChange,
  totalProducts,
  filteredCount,
  initialQuery = '',
  initialStore = 'all',
  products = [],
  articles = [],
}: FilterBarProps) {
  const { locale, t, currency } = useI18n();
  const isAr = locale === 'ar';
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [sortBy, setSortBy] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [activeStore, setActiveStore] = useState<string>(initialStore);
  const [openDropdown, setOpenDropdown] = useState<'sort' | 'price' | null>(null);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);

  const trimmedQuery = searchQuery.trim();

  const liveArticleMatches = useMemo(() => {
    if (!trimmedQuery || articles.length === 0) return [];
    return searchAndRankArticles(articles, trimmedQuery, products).slice(0, 4);
  }, [articles, products, trimmedQuery]);

  const liveProductMatches = useMemo(() => {
    if (!trimmedQuery || products.length === 0) return [];
    return findMatchingProducts(products, trimmedQuery, articles).slice(0, 5);
  }, [products, articles, trimmedQuery]);

  const totalLiveMatches = liveArticleMatches.length + liveProductMatches.length;

  // Close dropdowns when clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
        setIsSearchDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Single useEffect strictly for 300ms search debounce
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onFilterChange({
        query: searchQuery,
        sortBy: sortBy || 'newest',
        maxPrice,
        store: activeStore,
      });
    }, 200);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleSearchActionClick = () => {
    setIsSearchDropdownOpen(false);
    onFilterChange({
      query: searchQuery,
      sortBy: sortBy || 'newest',
      maxPrice,
      store: activeStore,
    });
  };

  const handleSortSelect = (nextSort: string) => {
    setSortBy(nextSort);
    setOpenDropdown(null);
    onFilterChange({
      query: searchQuery,
      sortBy: nextSort || 'newest',
      maxPrice,
      store: activeStore,
    });
  };

  const handlePriceChange = (nextMax: number | null) => {
    setMaxPrice(nextMax);
    onFilterChange({
      query: searchQuery,
      sortBy: sortBy || 'newest',
      maxPrice: nextMax,
      store: activeStore,
    });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    onFilterChange({
      query: '',
      sortBy: sortBy || 'newest',
      maxPrice,
      store: activeStore,
    });
    inputRef.current?.focus();
  };

  const selectedSortOption = SORT_OPTIONS.find((opt) => opt.value === sortBy);
  const sortButtonLabel = selectedSortOption
    ? isAr
      ? selectedSortOption.labelAr
      : selectedSortOption.labelEn
    : isAr
      ? 'الترتيب'
      : 'Sort by';

  const sliderValue = maxPrice !== null ? maxPrice : MAX_SLIDER_PRICE;
  const priceButtonLabel =
    maxPrice !== null
      ? isAr
        ? `السعر: 0 — ${maxPrice} ريال`
        : `Price: 0 — ${maxPrice} SAR`
      : isAr
        ? 'السعر'
        : 'Price';

  return (
    <div ref={containerRef} className={styles.filterBarContainer}>
      {/* 1. Prominent Search Bar with Solid Action Pill Button + Instant Live Dropdown */}
      <div className={styles.searchOuterWrap}>
        <div className={styles.searchRow}>
          <input
            ref={inputRef}
            type="search"
            value={searchQuery}
            onFocus={() => {
              if (trimmedQuery.length > 0) setIsSearchDropdownOpen(true);
            }}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              setIsSearchDropdownOpen(val.trim().length > 0);
            }}
            placeholder={
              isAr
                ? 'ابحث عن منتج، مقالة مراجعة، أو ماركة...'
                : 'Search products, buying guides, or brands...'
            }
            aria-label={
              isAr
                ? 'ابحث عن منتج، مقالة مراجعة، أو ماركة...'
                : 'Search products, buying guides, or brands...'
            }
            className={styles.searchInput}
          />

          {searchQuery.length > 0 && (
            <button
              type="button"
              onClick={() => {
                handleClearSearch();
                setIsSearchDropdownOpen(false);
              }}
              className={styles.clearBtn}
              aria-label={isAr ? 'مسح البحث' : 'Clear search'}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}

          <button
            type="button"
            onClick={handleSearchActionClick}
            className={styles.searchActionBtn}
            aria-label={isAr ? 'بحث' : 'Search'}
          >
            <Search size={16} aria-hidden="true" />
            <span>{isAr ? 'بحث' : 'Search'}</span>
          </button>
        </div>

        {isSearchDropdownOpen && trimmedQuery.length > 0 && totalLiveMatches > 0 && (
          <div
            className={styles.liveDropdown}
            role="listbox"
            aria-label={isAr ? 'نتائج البحث المباشرة' : 'Live search results'}
          >
            <div className={styles.liveScrollArea}>
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
                        <li key={`fbar-art-${art.id}`} className={styles.liveListItem}>
                          <Link
                            href={`/${locale}/guides/${encodeURIComponent(art.slug)}`}
                            onClick={() => setIsSearchDropdownOpen(false)}
                            className={styles.liveResultLink}
                          >
                            <div className={styles.liveThumbWrap}>
                              <img
                                src={artImg}
                                alt={artTitle}
                                width={40}
                                height={40}
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
                              <ArrowUpLeft size={14} className={styles.liveArrow} />
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

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
                        <li key={`fbar-prod-${item.id}`} className={styles.liveListItem}>
                          <Link
                            href={`/${locale}/products/${encodeURIComponent(item.slug)}`}
                            onClick={() => setIsSearchDropdownOpen(false)}
                            className={styles.liveResultLink}
                          >
                            <div className={styles.liveThumbWrap}>
                              {itemImage ? (
                                <img
                                  src={itemImage}
                                  alt={itemTitle}
                                  width={40}
                                  height={40}
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
                              <ArrowUpLeft size={14} className={styles.liveArrow} />
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Harmonized Filter Strip (Sort + Price) */}
      <div className={styles.controlsRow}>
        <div className={styles.dropdownsGroup}>
          {/* a) Custom Sort Pill Button + Dropdown */}
          <div className={styles.dropdownWrapper}>
            <button
              type="button"
              onClick={() =>
                setOpenDropdown((prev) => (prev === 'sort' ? null : 'sort'))
              }
              className={`${styles.pillButton} ${
                selectedSortOption ? styles.pillButtonActive : ''
              }`}
              aria-expanded={openDropdown === 'sort'}
              aria-haspopup="listbox"
            >
              <ArrowUpDown size={14} aria-hidden="true" />
              <span>{sortButtonLabel}</span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>

            {openDropdown === 'sort' && (
              <div className={styles.dropdownMenu} role="listbox">
                {SORT_OPTIONS.map((opt) => {
                  const isActive = sortBy === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onClick={() => handleSortSelect(opt.value)}
                      className={`${styles.dropdownOption} ${
                        isActive ? styles.dropdownOptionActive : ''
                      }`}
                    >
                      <span>{isAr ? opt.labelAr : opt.labelEn}</span>
                      {isActive && <Check size={14} aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* b) Price Filter Pill Button + Pure CSS Range Slider (Step = 1, Click Outside to Dismiss) */}
          <div className={styles.dropdownWrapper}>
            <button
              type="button"
              onClick={() =>
                setOpenDropdown((prev) => (prev === 'price' ? null : 'price'))
              }
              className={`${styles.pillButton} ${
                maxPrice !== null ? styles.pillButtonActive : ''
              }`}
              aria-expanded={openDropdown === 'price'}
            >
              <span className="tabularNums">{priceButtonLabel}</span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>

            {openDropdown === 'price' && (
              <div className={styles.priceDropdownPanel}>
                <div className={styles.priceHeaderRow}>
                  <span className={`${styles.priceLiveLabel} tabularNums`}>
                    {isAr
                      ? `السعر: 0 — ${sliderValue} ريال`
                      : `Price: 0 — ${sliderValue} SAR`}
                  </span>
                  {maxPrice !== null && (
                    <button
                      type="button"
                      onClick={() => handlePriceChange(null)}
                      className={styles.priceResetBtn}
                    >
                      {isAr ? 'إعادة ضبط' : 'Reset'}
                    </button>
                  )}
                </div>

                <input
                  type="range"
                  min={0}
                  max={MAX_SLIDER_PRICE}
                  step={1}
                  value={sliderValue}
                  onChange={(e) => {
                    const num = Number(e.target.value);
                    handlePriceChange(num >= MAX_SLIDER_PRICE ? null : num);
                  }}
                  className={styles.rangeSlider}
                  aria-label={isAr ? 'السعر الأقصى' : 'Maximum price'}
                />

                <div className={`${styles.priceTicks} tabularNums`}>
                  <span>0</span>
                  <span>2500</span>
                  <span>{isAr ? '5000 ريال' : '5000 SAR'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className={`${styles.resultsCountText} tabularNums`} aria-live="polite">
          {isAr
            ? `عرض ${filteredCount} منتج من أصل ${totalProducts}`
            : `Showing ${filteredCount} of ${totalProducts} products`}
        </p>
      </div>
    </div>
  );
}
