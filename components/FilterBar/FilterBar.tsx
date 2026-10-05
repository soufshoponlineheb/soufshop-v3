'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpDown, Check, ChevronDown, Search, X } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
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
}: FilterBarProps) {
  const { locale } = useI18n();
  const isAr = locale === 'ar';
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [sortBy, setSortBy] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [activeStore, setActiveStore] = useState<string>(initialStore);
  const [openDropdown, setOpenDropdown] = useState<'sort' | 'price' | null>(null);

  // Close dropdowns when clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
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
    }, 300);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleSearchActionClick = () => {
    onFilterChange({
      query: searchQuery,
      sortBy: sortBy || 'newest',
      maxPrice,
      store: activeStore,
    });
    inputRef.current?.focus();
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
      {/* 1. Prominent Search Bar with Solid Action Pill Button */}
      <div className={styles.searchRow}>
        <input
          ref={inputRef}
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            isAr ? 'ابحث عن منتجات، ماركات...' : 'Search products, brands...'
          }
          aria-label={
            isAr ? 'ابحث عن منتجات، ماركات...' : 'Search products, brands...'
          }
          className={styles.searchInput}
        />

        {searchQuery.length > 0 && (
          <button
            type="button"
            onClick={handleClearSearch}
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
      </div>

      {/* 3. Results Count directly below filters */}
      <div className={styles.resultsMetaRow}>
        <p className={`${styles.resultsCountText} tabularNums`} aria-live="polite">
          {isAr
            ? `عرض ${filteredCount} منتج من أصل ${totalProducts}`
            : `Showing ${filteredCount} of ${totalProducts} products`}
        </p>
      </div>
    </div>
  );
}
