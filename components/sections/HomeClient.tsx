'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import type { Article, Category, Locale, PartnerSource, Product } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import { useSaved } from '@/features/saved/SavedProvider';
import { SiteHeader } from '@/components/sections/SiteHeader';
import { SiteFooter } from '@/components/sections/SiteFooter';
import { HeroSection } from '@/components/sections/HeroSection';
import { SignatureMotif } from '@/components/ui/SignatureMotif';
import { ProductCard } from '@/components/ui/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Testimonials } from '@/components/Testimonials/Testimonials';
import type { Testimonial } from '@/lib/testimonials';
import { searchAndRankProducts } from '@/lib/productSearch';
import styles from '@/app/page.module.css';

interface HomeClientProps {
  products: Product[];
  categories: Category[];
  articles?: Article[];
  sources?: PartnerSource[];
  testimonials?: Testimonial[];
  heroBackgroundImageUrl?: string;
  pageLocale?: Locale;
}

export function HomeClient({
  products,
  categories,
  articles = [],
  testimonials,
  heroBackgroundImageUrl,
}: HomeClientProps) {
  const { locale, messages, t } = useI18n();
  const { isSaved, toggleSave } = useSaved();
  const isAr = locale === 'ar';
  const [heroSearch, setHeroSearch] = useState('');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('');

  const handleChipSelect = (query: string, slug?: string) => {
    const targetSlug = slug || query;
    if (selectedCategorySlug === targetSlug) {
      setSelectedCategorySlug('');
      setHeroSearch('');
    } else {
      setSelectedCategorySlug(targetSlug);
      setHeroSearch('');
    }
  };

  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCategorySlug) {
      list = list.filter(
        (p) =>
          p.categorySlug === selectedCategorySlug ||
          p.categoryId === selectedCategorySlug
      );
    }
    if (heroSearch.trim()) {
      list = searchAndRankProducts(list, heroSearch);
    }
    return list;
  }, [products, heroSearch, selectedCategorySlug]);

  const featuredProducts = useMemo(
    () => filteredProducts.filter((p) => p.isFeatured),
    [filteredProducts]
  );

  const displayProducts = useMemo(() => {
    if (heroSearch.trim() || selectedCategorySlug) {
      return filteredProducts;
    }
    return featuredProducts.length > 0
      ? featuredProducts.slice(0, 16)
      : filteredProducts.slice(0, 16);
  }, [filteredProducts, featuredProducts, heroSearch, selectedCategorySlug]);

  return (
    <div className={styles.pageShell}>
      <SiteHeader />

      {/* Hero with Search Bar and Dynamic Category Chips */}
      <HeroSection
        backgroundImageUrl={heroBackgroundImageUrl}
        products={products}
        categories={categories}
        searchQuery={heroSearch}
        onSearchChange={(q) => {
          setHeroSearch(q);
          if (q.trim()) setSelectedCategorySlug('');
        }}
        activeChip={selectedCategorySlug}
        onChipSelect={handleChipSelect}
        pageLocale={locale}
      />

      <main id="main-content" className={`siteContainer ${styles.main}`}>
        {/* Section 01: Curated Featured Products (Directly below Hero) */}
        <section id="home-products-section" className={styles.catalogSection}>
          <SignatureMotif
            index="01"
            label={
              selectedCategorySlug
                ? categories.find((c) => c.slug === selectedCategorySlug)?.name?.[locale] ||
                  messages.filters.sortFeatured
                : messages.filters.sortFeatured
            }
            subtleText={
              products.length > 0
                ? isAr
                  ? 'مراجعات مستقلة وروابط مباشرة للمتجر الأصلي'
                  : 'Independent notes & direct store links'
                : undefined
            }
          />

          {displayProducts.length > 0 ? (
            <div className={styles.productGrid}>
              {displayProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isSaved={isSaved(product.id)}
                  onToggleSave={toggleSave}
                  refContext="home_featured"
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={messages.empty.catalogTitle}
              description={messages.empty.catalogDescription}
              primaryActionLabel={messages.nav.ourMethod}
              primaryActionHref={`/${locale}/about`}
              secondaryActionLabel={messages.nav.contact}
              secondaryActionHref={`/${locale}/contact`}
            />
          )}
        </section>

        {/* Section 02: Latest Editorial Buying Guides ("أحدث أدلة الشراء والمقارنات") */}
        {articles.length > 0 && (
          <section className={styles.guidesSection} aria-labelledby="home-guides-heading">
            <div className={styles.sectionHeaderRow}>
              <SignatureMotif
                index="02"
                label={isAr ? 'أدلة الشراء والمقارنات' : 'Buying Guides & Reviews'}
                subtleText={isAr ? 'مراجعات متأنية قبل الشراء' : 'In-depth product deep dives'}
              />
              <Link href={`/${locale}/guides`} className={styles.viewAllLink}>
                <span>{isAr ? 'عرض جميع الأدلة' : 'View All Guides'}</span>
                {isAr ? <ArrowLeft size={14} aria-hidden="true" /> : <ArrowRight size={14} aria-hidden="true" />}
              </Link>
            </div>

            <div className={styles.guidesGrid}>
              {articles.slice(0, 3).map((article) => (
                <article key={article.id} className={styles.guideCard}>
                  <Link
                    href={`/${locale}/guides/${encodeURIComponent(article.slug)}`}
                    className={styles.guideCoverWrap}
                    tabIndex={-1}
                  >
                    <Image
                      src={article.coverImage || '/images/hero-bg.jpg'}
                      alt={t(article.title)}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className={styles.guideCoverImage}
                      referrerPolicy="no-referrer"
                    />
                  </Link>

                  <div className={styles.guideBody}>
                    <div className={styles.guideMeta}>
                      <span className={styles.guideCategory}>{t(article.categoryName)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabularNums" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} aria-hidden="true" />
                        <span>{article.readingTimeMinutes} {isAr ? 'دقائق' : 'min'}</span>
                      </span>
                    </div>

                    <h3 className={styles.guideTitle}>
                      <Link
                        href={`/${locale}/guides/${encodeURIComponent(article.slug)}`}
                        className={styles.guideTitleLink}
                      >
                        {t(article.title)}
                      </Link>
                    </h3>

                    <p className={styles.guideExcerpt}>{t(article.excerpt)}</p>

                    <Link
                      href={`/${locale}/guides/${encodeURIComponent(article.slug)}`}
                      className={styles.viewAllLink}
                      style={{ fontSize: '0.8rem', marginTop: 'auto' }}
                    >
                      <span>{isAr ? 'اقرأ الدليل' : 'Read Guide'}</span>
                      {isAr ? <ArrowLeft size={13} aria-hidden="true" /> : <ArrowRight size={13} aria-hidden="true" />}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Section 03: Interactive Visitor Testimonials ("ماذا يقول زوارنا") */}
        <Testimonials
          initialTestimonials={testimonials}
          sectionIndex={articles.length > 0 ? '03' : '02'}
        />
      </main>

      <SiteFooter productsCount={products.length} />
    </div>
  );
}
