'use client';

import React from 'react';
import Link from 'next/link';
import type { Article, Category, Product } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import { useSaved } from '@/features/saved/SavedProvider';
import { SiteHeader } from '@/components/sections/SiteHeader';
import { SiteFooter } from '@/components/sections/SiteFooter';
import { SignatureMotif } from '@/components/ui/SignatureMotif';
import { ProductCard } from '@/components/ui/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import styles from './CategoryView.module.css';

interface CategoryViewProps {
  category: Category;
  products: Product[];
  articles: Article[];
}

export function CategoryView({ category, products, articles }: CategoryViewProps) {
  const { locale, messages, t } = useI18n();
  const { isSaved, toggleSave } = useSaved();

  return (
    <div className={styles.pageShell}>
      <SiteHeader />

      <main id="main-content" className={`siteContainer ${styles.main}`}>
        <header className={styles.header}>
          <SignatureMotif index="01" label={messages.nav.collections} />
          <h1 className={styles.title}>{t(category.name)}</h1>
          <p className={styles.description}>{t(category.description)}</p>
        </header>

        <section className={styles.section}>
          <SignatureMotif index="02" label={messages.nav.products} />
          {products.length > 0 ? (
            <div className={styles.productGrid}>
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isSaved={isSaved(product.id)}
                  onToggleSave={toggleSave}
                  refContext={`category_${category.slug}`}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={messages.empty.catalogTitle}
              description={messages.empty.catalogDescription}
              primaryActionLabel={messages.nav.products}
              primaryActionHref="/products"
            />
          )}
        </section>

        {articles.length > 0 && (
          <section className={styles.section}>
            <SignatureMotif index="03" label={messages.nav.guides} />
            <div className={styles.articlesGrid}>
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/blog/${encodeURIComponent(article.slug)}`}
                  className={`${styles.articleCard} hoverLift`}
                >
                  <h3 className={styles.articleTitle}>{t(article.title)}</h3>
                  <p className={styles.articleExcerpt}>{t(article.excerpt)}</p>
                  <span className={`${styles.readingTime} tabularNums`}>
                    {article.readingTimeMinutes}{' '}
                    {locale === 'ar' ? 'دقائق قراءة' : 'min read'}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
