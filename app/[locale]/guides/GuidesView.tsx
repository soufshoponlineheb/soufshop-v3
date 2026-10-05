'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Clock, Search, Sparkles, X } from 'lucide-react';
import type { Article, Category } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import { formatCalendarDate } from '@/lib/format';
import { SiteHeader } from '@/components/sections/SiteHeader';
import { SiteFooter } from '@/components/sections/SiteFooter';
import { SignatureMotif } from '@/components/ui/SignatureMotif';
import { EmptyState } from '@/components/ui/EmptyState';
import styles from './GuidesView.module.css';

interface GuidesViewProps {
  articles: Article[];
  categories: Category[];
}

export function GuidesView({ articles, categories }: GuidesViewProps) {
  const { locale, messages, t } = useI18n();
  const isAr = locale === 'ar';
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredArticles = useMemo(() => {
    let list = articles;
    if (selectedCategory !== 'all') {
      list = list.filter(
        (a) =>
          a.categorySlug === selectedCategory || a.categoryId === selectedCategory
      );
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((a) => {
        const haystack = [
          a.title.ar,
          a.title.en,
          a.excerpt.ar,
          a.excerpt.en,
          a.contentHtml.ar,
          a.contentHtml.en,
          ...(a.seoKeywords || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      });
    }
    return list;
  }, [articles, selectedCategory, searchQuery]);

  const featuredArticle = filteredArticles[0];
  const restArticles = filteredArticles.slice(1);

  return (
    <div className={styles.pageShell}>
      <SiteHeader />

      <main id="main-content" className={`siteContainer ${styles.main}`}>
        <header className={styles.header}>
          <SignatureMotif index="01" label={messages.nav.guides} />
          <h1 className={styles.title}>
            {isAr
              ? 'أدلة الشراء والمراجعات التحريرية'
              : 'Editorial Buying Guides & Deep Dives'}
          </h1>
          <p className={styles.subtitle}>
            {isAr
              ? 'مقارنات عملية ومراجعات متأنية تساعدك على اختيار المنتج الأنسب لاحتياجك الفعلي بأفضل سعر وقبل الشراء.'
              : 'Practical comparisons, specs breakdowns, and thoughtful evaluations to help you make confident buying decisions.'}
          </p>

          <div className={styles.controlsToolbar}>
            {/* Real-time Article Search Bar */}
            <div className={styles.searchWrap}>
              <Search size={16} className={styles.searchIcon} aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isAr
                    ? 'ابحث في دلائل الشراء والمقارنات...'
                    : 'Search buying guides & comparisons...'
                }
                aria-label={
                  isAr ? 'البحث في دلائل الشراء' : 'Search buying guides'
                }
                className={styles.searchInput}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className={styles.clearSearchBtn}
                  aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {categories.length > 0 && (
              <div
                className={styles.filterBar}
                role="group"
                aria-label={
                  isAr ? 'تصفية الأدلة حسب الفئة' : 'Filter guides by category'
                }
              >
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`${styles.filterBtn} ${
                    selectedCategory === 'all' ? styles.filterBtnActive : ''
                  }`}
                >
                  {messages.filters.allCategories}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`${styles.filterBtn} ${
                      selectedCategory === cat.slug ? styles.filterBtnActive : ''
                    }`}
                  >
                    {t(cat.name)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Featured Hero Guide (if available) */}
        {featuredArticle && (
          <article className={styles.featuredHeroCard}>
            <div className={styles.featuredContentZone}>
              <span className={styles.featuredHeroBadge}>
                <Sparkles size={13} aria-hidden="true" />
                <span>{isAr ? 'دليل مميز' : 'Featured Guide'}</span>
              </span>

              <div className={styles.metaRow}>
                <span className={styles.categoryTag}>{t(featuredArticle.categoryName)}</span>
                <span aria-hidden="true">·</span>
                <span className={`${styles.readTime} tabularNums`}>
                  <Clock size={13} aria-hidden="true" />
                  <span>
                    {featuredArticle.readingTimeMinutes}{' '}
                    {isAr ? 'دقائق قراءة' : 'min read'}
                  </span>
                </span>
                {featuredArticle.publishedAt && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="tabularNums">
                      {formatCalendarDate(featuredArticle.publishedAt, locale)}
                    </span>
                  </>
                )}
              </div>

              <h2 className={styles.featuredTitle}>
                <Link
                  href={`/${locale}/guides/${encodeURIComponent(featuredArticle.slug)}`}
                  className={styles.featuredTitleLink}
                >
                  {t(featuredArticle.title)}
                </Link>
              </h2>

              <p className={styles.featuredExcerpt}>{t(featuredArticle.excerpt)}</p>

              <Link
                href={`/${locale}/guides/${encodeURIComponent(featuredArticle.slug)}`}
                className={styles.readMoreLink}
              >
                <span>{isAr ? 'قراءة الدليل بالكامل' : 'Read Full Guide'}</span>
                {isAr ? (
                  <ArrowLeft size={16} aria-hidden="true" />
                ) : (
                  <ArrowRight size={16} aria-hidden="true" />
                )}
              </Link>
            </div>

            <div className={styles.featuredImageWrap}>
              {featuredArticle.coverImage ? (
                <Image
                  src={featuredArticle.coverImage}
                  alt={t(featuredArticle.title)}
                  fill
                  className={styles.featuredImage}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'var(--color-surface-hover)',
                    color: 'var(--color-primary)',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                  }}
                >
                  SoufShop Guide
                </div>
              )}
            </div>
          </article>
        )}

        {/* All Guides Grid */}
        <section className={styles.articlesSection} aria-live="polite">
          <SignatureMotif
            index="02"
            label={isAr ? 'جميع الأدلة والمراجعات' : 'All Buying Guides'}
          />

          {articles.length === 0 ? (
            <EmptyState
              title={
                isAr
                  ? 'نعمل حالياً على إعداد أولى أدلة الشراء'
                  : 'Our editorial team is preparing the first buying guides'
              }
              description={
                isAr
                  ? 'نكتب مراجعاتنا بناءً على بحث وتدقيق حقيقي في مواصفات المنتجات وتجارب الاستخدام. تصفح دليل المنتجات المنتقاة أو تعرف على منهجيتنا.'
                  : 'Every guide is written after thorough research into product specifications and real-world reliability. Explore our product directory or read about our method.'
              }
              primaryActionLabel={messages.nav.products}
              primaryActionHref={`/${locale}/products`}
              secondaryActionLabel={messages.nav.ourMethod}
              secondaryActionHref={`/${locale}/about`}
            />
          ) : restArticles.length === 0 && !featuredArticle ? (
            <EmptyState
              title={
                isAr
                  ? 'لم نجد أدلة شراء تطابق بحثك أو هذه الفئة'
                  : 'No buying guides match your search or category'
              }
              description={
                isAr
                  ? 'جرب كلمة بحث أخرى أو اعرض جميع الأدلة المنشورة.'
                  : 'Try another search term or view all published guides.'
              }
              primaryActionLabel={messages.filters.allCategories}
              onPrimaryAction={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
            />
          ) : (
            <div className={styles.grid}>
              {restArticles.map((article) => {
                const formattedDate = formatCalendarDate(article.publishedAt, locale);
                return (
                  <article key={article.id} className={styles.card}>
                    <Link
                      href={`/${locale}/guides/${encodeURIComponent(article.slug)}`}
                      className={styles.cardCoverWrap}
                      tabIndex={-1}
                    >
                      <Image
                        src={article.coverImage || '/images/hero-bg.jpg'}
                        alt={t(article.title)}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className={styles.cardCoverImage}
                        referrerPolicy="no-referrer"
                      />
                    </Link>

                    <div className={styles.cardBody}>
                      <div className={styles.metaRow}>
                        <span className={styles.categoryTag}>{t(article.categoryName)}</span>
                        <span aria-hidden="true">·</span>
                        <span className={`${styles.readTime} tabularNums`}>
                          <Clock size={13} aria-hidden="true" />
                          <span>
                            {article.readingTimeMinutes}{' '}
                            {isAr ? 'دقائق قراءة' : 'min read'}
                          </span>
                        </span>
                        {formattedDate && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="tabularNums">{formattedDate}</span>
                          </>
                        )}
                      </div>

                      <h2 className={styles.cardTitle}>
                        <Link
                          href={`/${locale}/guides/${encodeURIComponent(article.slug)}`}
                          className={styles.cardTitleLink}
                        >
                          {t(article.title)}
                        </Link>
                      </h2>

                      <p className={styles.cardExcerpt}>{t(article.excerpt)}</p>

                      <div className={styles.cardFooter}>
                        <Link
                          href={`/${locale}/guides/${encodeURIComponent(article.slug)}`}
                          className={styles.readMoreLink}
                        >
                          <span>{isAr ? 'اقرأ الدليل الكامل' : 'Read full guide'}</span>
                          {isAr ? (
                            <ArrowLeft size={15} aria-hidden="true" />
                          ) : (
                            <ArrowRight size={15} aria-hidden="true" />
                          )}
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
