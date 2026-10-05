'use client';

import React, { useCallback, useMemo, useState } from 'react';
import type { Category, PartnerSource, Product } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import { useSaved } from '@/features/saved/SavedProvider';
import { SiteHeader } from '@/components/sections/SiteHeader';
import { SiteFooter } from '@/components/sections/SiteFooter';
import { SignatureMotif } from '@/components/ui/SignatureMotif';
import { ProductCard } from '@/components/ui/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterBar } from '@/components/FilterBar/FilterBar';
import { searchAndRankProducts } from '@/lib/productSearch';
import styles from './CatalogView.module.css';

interface CatalogViewProps {
  initialProducts: Product[];
  categories: Category[];
  sources: PartnerSource[];
  initialCategorySlug?: string;
  initialSourceSlug?: string;
  initialSearchQuery?: string;
}

export function CatalogView({
  initialProducts,
  categories,
  initialCategorySlug = 'all',
  initialSourceSlug = 'all',
  initialSearchQuery = '',
}: CatalogViewProps) {
  const { locale, messages, t } = useI18n();
  const { isSaved, toggleSave } = useSaved();

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategorySlug);
  const [selectedSource, setSelectedSource] = useState(initialSourceSlug);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [filterBarKey, setFilterBarKey] = useState(0);

  const handleFilterChange = useCallback(
    (filters: {
      query: string;
      sortBy: string;
      maxPrice: number | null;
      store: string;
    }) => {
      setSearchQuery(filters.query);
      setSortBy(filters.sortBy);
      setMaxPrice(filters.maxPrice);
      setSelectedSource(filters.store);
    },
    []
  );

  const filteredProducts = useMemo(() => {
    const baseList = initialProducts.filter((product) => {
      if (selectedCategory !== 'all' && product.categorySlug !== selectedCategory) {
        return false;
      }
      if (selectedSource !== 'all' && product.sourceSlug !== selectedSource) {
        return false;
      }
      if (
        maxPrice !== null &&
        !Number.isNaN(maxPrice) &&
        maxPrice >= 0 &&
        product.priceAmount !== null &&
        product.priceAmount > maxPrice
      ) {
        return false;
      }
      return true;
    });

    const searchedList = searchAndRankProducts(baseList, searchQuery);

    return [...searchedList].sort((a, b) => {
      if (sortBy === 'newest') {
        return b.createdAt.localeCompare(a.createdAt);
      }
      if (sortBy === 'price_asc') {
        const pa = a.priceAmount ?? Number.MAX_SAFE_INTEGER;
        const pb = b.priceAmount ?? Number.MAX_SAFE_INTEGER;
        return pa - pb;
      }
      if (sortBy === 'price_desc') {
        const pa = a.priceAmount ?? -1;
        const pb = b.priceAmount ?? -1;
        return pb - pa;
      }
      if (sortBy === 'rating_desc') {
        const ra = a.stars ?? 4.3;
        const rb = b.stars ?? 4.3;
        return rb - ra;
      }
      if (sortBy === 'sold_desc') {
        const sa = a.soldCount ?? 120;
        const sb = b.soldCount ?? 120;
        return sb - sa;
      }
      return 0;
    });
  }, [initialProducts, maxPrice, searchQuery, selectedCategory, selectedSource, sortBy]);

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedSource('all');
    setMaxPrice(null);
    setSortBy('newest');
    setFilterBarKey((k) => k + 1);
  };

  return (
    <div className={styles.pageShell}>
      <SiteHeader />

      <main id="main-content" className={`siteContainer ${styles.main}`}>
        <header className={styles.pageHeader}>
          <SignatureMotif index="01" label={messages.nav.products} />
          <h1 className={styles.pageTitle}>
            {locale === 'ar'
              ? 'دليل المنتجات المنتقاة'
              : 'Curated Product Directory'}
          </h1>
          <p className={styles.pageSubtitle}>{messages.meta.defaultDescription}</p>
        </header>

        {/* Redesigned Noon/Temu-style Search & Filter Bar */}
        <section className={styles.filterPanel} aria-label="Product Filters">
          <FilterBar
            key={filterBarKey}
            onFilterChange={handleFilterChange}
            totalProducts={initialProducts.length}
            filteredCount={filteredProducts.length}
            initialQuery={initialSearchQuery}
            initialStore={initialSourceSlug}
          />

          {categories.length > 0 && (
            <div className={styles.filterSegmentsRow}>
              <div className={styles.segmentedGroup} role="group" aria-label="Filter by category">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`${styles.segmentBtn} ${
                    selectedCategory === 'all' ? styles.segmentBtnActive : ''
                  }`}
                >
                  {messages.filters.allCategories}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`${styles.segmentBtn} ${
                      selectedCategory === cat.slug ? styles.segmentBtnActive : ''
                    }`}
                  >
                    {t(cat.name)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Results Grid or Empty State */}
        <section className={styles.resultsSection} aria-live="polite">
          {initialProducts.length === 0 ? (
            <EmptyState
              title={messages.empty.catalogTitle}
              description={messages.empty.catalogDescription}
              primaryActionLabel={messages.nav.ourMethod}
              primaryActionHref="/about"
              secondaryActionLabel={messages.nav.contact}
              secondaryActionHref="/contact"
            />
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              title={messages.empty.noSearchMatchTitle}
              description={messages.empty.noSearchMatchDescription}
              primaryActionLabel={messages.filters.resetFilters}
              onPrimaryAction={resetAllFilters}
            />
          ) : (
            <div className={styles.productGrid}>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isSaved={isSaved(product.id)}
                  onToggleSave={toggleSave}
                  refContext="catalog_directory"
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter productsCount={initialProducts.length} />
    </div>
  );
}
