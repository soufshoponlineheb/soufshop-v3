'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Plus, Sparkles, Trash2 } from 'lucide-react';
import type { Article, ArticleFaqItem, Category, Product } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import { useSaved } from '@/features/saved/SavedProvider';
import { useToast } from '@/components/ui/Toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  MAGIC_ARTICLE_AI_PROMPT_TEMPLATE,
  parseMagicArticleContent,
} from '@/lib/magicContentParser';
import styles from './AdminShell.module.css';

interface AdminArticleFormViewProps {
  existingArticle?: Article | null;
  categories: Category[];
  products: Product[];
}

export function AdminArticleFormView({
  existingArticle,
  categories,
  products,
}: AdminArticleFormViewProps) {
  const { locale, t } = useI18n();
  const { csrfToken } = useSaved();
  const { showToast } = useToast();
  const router = useRouter();
  const isAr = locale === 'ar';

  const [magicRawText, setMagicRawText] = useState('');
  const [slug, setSlug] = useState(existingArticle?.slug || '');
  const [titleEn, setTitleEn] = useState(existingArticle?.title.en || '');
  const [titleAr, setTitleAr] = useState(existingArticle?.title.ar || '');
  const [excerptEn, setExcerptEn] = useState(existingArticle?.excerpt.en || '');
  const [excerptAr, setExcerptAr] = useState(existingArticle?.excerpt.ar || '');
  const [contentEn, setContentEn] = useState(existingArticle?.contentHtml.en || '');
  const [contentAr, setContentAr] = useState(existingArticle?.contentHtml.ar || '');
  const [editorVerdictAr, setEditorVerdictAr] = useState(
    existingArticle?.editorVerdict?.ar || ''
  );
  const [editorVerdictEn, setEditorVerdictEn] = useState(
    existingArticle?.editorVerdict?.en || ''
  );
  const [authorName, setAuthorName] = useState(
    existingArticle?.authorName || 'SoufShop Editorial Team'
  );
  const [seoTitleAr, setSeoTitleAr] = useState(existingArticle?.seoTitle?.ar || '');
  const [seoTitleEn, setSeoTitleEn] = useState(existingArticle?.seoTitle?.en || '');
  const [seoDescriptionAr, setSeoDescriptionAr] = useState(
    existingArticle?.seoDescription?.ar || ''
  );
  const [seoDescriptionEn, setSeoDescriptionEn] = useState(
    existingArticle?.seoDescription?.en || ''
  );
  const [seoKeywords, setSeoKeywords] = useState(
    (existingArticle?.seoKeywords || []).join(', ')
  );
  const [faqItems, setFaqItems] = useState<ArticleFaqItem[]>(
    existingArticle?.faqItems || []
  );

  const [coverImage, setCoverImage] = useState(existingArticle?.coverImage || '');
  const [topPickProductId, setTopPickProductId] = useState(
    existingArticle?.topPickProductId || ''
  );
  const [categoryId, setCategoryId] = useState(
    existingArticle?.categoryId || categories[0]?.id || 'general'
  );
  const [readingTimeMinutes, setReadingTimeMinutes] = useState(
    String(existingArticle?.readingTimeMinutes || 5)
  );
  const [status, setStatus] = useState<'published' | 'draft'>(
    existingArticle?.status || 'published'
  );
  const [relatedProductIds, setRelatedProductIds] = useState<string[]>(
    existingArticle?.relatedProductIds || []
  );

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCopyAiPrompt = async () => {
    try {
      await navigator.clipboard.writeText(MAGIC_ARTICLE_AI_PROMPT_TEMPLATE);
      showToast(
        isAr
          ? 'تم نسخ قالب الذكاء الاصطناعي للمقالات بنجاح.'
          : 'AI article prompt template copied.',
        'success'
      );
    } catch {
      showToast(
        isAr ? 'تعذر النسخ التلقائي.' : 'Unable to copy automatically.',
        'error'
      );
    }
  };

  const handleMagicParse = () => {
    const { draft, fieldsFoundCount } = parseMagicArticleContent(magicRawText);
    if (fieldsFoundCount === 0) {
      showToast(
        isAr
          ? 'لم يتم العثور على حقول مطابقة في النص الملصق.'
          : 'No matching fields found in pasted text.',
        'error'
      );
      return;
    }

    if (draft.slug) setSlug(draft.slug);
    if (draft.titleAr) setTitleAr(draft.titleAr);
    if (draft.titleEn) setTitleEn(draft.titleEn);
    if (draft.excerptAr) setExcerptAr(draft.excerptAr);
    if (draft.excerptEn) setExcerptEn(draft.excerptEn);
    if (draft.contentAr) setContentAr(draft.contentAr);
    if (draft.contentEn) setContentEn(draft.contentEn);
    if (draft.editorVerdictAr) setEditorVerdictAr(draft.editorVerdictAr);
    if (draft.editorVerdictEn) setEditorVerdictEn(draft.editorVerdictEn);
    if (draft.seoTitleAr) setSeoTitleAr(draft.seoTitleAr);
    if (draft.seoTitleEn) setSeoTitleEn(draft.seoTitleEn);
    if (draft.seoDescriptionAr) setSeoDescriptionAr(draft.seoDescriptionAr);
    if (draft.seoDescriptionEn) setSeoDescriptionEn(draft.seoDescriptionEn);
    if (draft.seoKeywords) setSeoKeywords(draft.seoKeywords);
    if (draft.authorName) setAuthorName(draft.authorName);
    if (draft.readingTimeMinutes) setReadingTimeMinutes(draft.readingTimeMinutes);
    if (draft.coverImage) setCoverImage(draft.coverImage);
    if (draft.categoryId) {
      const matched = categories.find(
        (c) =>
          c.id.toLowerCase() === draft.categoryId?.toLowerCase() ||
          c.slug.toLowerCase() === draft.categoryId?.toLowerCase()
      );
      if (matched) setCategoryId(matched.id);
    }
    if (draft.faqItems && draft.faqItems.length > 0) {
      setFaqItems(draft.faqItems);
    }

    showToast(
      isAr
        ? `تم استخراج وتعبئة ${fieldsFoundCount} حقل تلقائياً!`
        : `Extracted and populated ${fieldsFoundCount} fields!`,
      'success'
    );
  };

  const toggleProductSelection = (id: string) => {
    setRelatedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const addFaqRow = () => {
    setFaqItems((prev) => [
      ...prev,
      {
        question: { ar: '', en: '' },
        answer: { ar: '', en: '' },
      },
    ]);
  };

  const updateFaqRow = (
    idx: number,
    field: 'question' | 'answer',
    lang: 'ar' | 'en',
    val: string
  ) => {
    setFaqItems((prev) =>
      prev.map((item, i) =>
        i === idx
          ? {
              ...item,
              [field]: {
                ...item[field],
                [lang]: val,
              },
            }
          : item
      )
    );
  };

  const removeFaqRow = (idx: number) => {
    setFaqItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csrfToken) return;
    setSaving(true);
    setErrorMessage('');

    try {
      const payload = {
        slug: slug.trim().toLowerCase(),
        title: { en: titleEn, ar: titleAr },
        excerpt: { en: excerptEn, ar: excerptAr },
        contentHtml: { en: contentEn, ar: contentAr },
        editorVerdict: { en: editorVerdictEn, ar: editorVerdictAr },
        authorName: authorName.trim() || 'SoufShop Editorial Team',
        seoTitle: { en: seoTitleEn, ar: seoTitleAr },
        seoDescription: { en: seoDescriptionEn, ar: seoDescriptionAr },
        seoKeywords: seoKeywords
          .split(/[،,]/)
          .map((k) => k.trim())
          .filter(Boolean),
        faqItems,
        coverImage: coverImage.trim() || undefined,
        topPickProductId: topPickProductId.trim() || undefined,
        categoryId,
        readingTimeMinutes: Number(readingTimeMinutes) || 5,
        status,
        relatedProductIds,
      };

      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          existingId: existingArticle?.id,
          payload,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErrorMessage(data.error || 'Error saving article');
        return;
      }

      showToast(
        isAr ? 'تم حفظ دليل الشراء بنجاح.' : 'Buying guide saved.',
        'success'
      );
      router.push('/admin/articles');
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            {existingArticle
              ? isAr
                ? 'تعديل دليل الشراء'
                : 'Edit Buying Guide'
              : isAr
                ? 'كتابة دليل شراء جديد'
                : 'Write New Buying Guide'}
          </h1>
          <p className={styles.pageSubtitle}>
            {isAr
              ? 'استخدم اللصق السريع الذكي لتعبئة المقال بالكامل، مع حقول SEO المتقدمة والأسئلة الشائعة (FAQPage Schema).'
              : 'Use Smart Magic Paste to auto-fill guides, with full SEO metadata and FAQPage Schema support.'}
          </p>
        </div>
      </div>

      {/* Smart Magic Paste Box for Articles */}
      <section className={styles.card} style={{ marginBlockEnd: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBlockEnd: '0.75rem',
          }}
        >
          <div>
            <h2 className={styles.sectionTitle} style={{ marginBlockEnd: '0.25rem' }}>
              <Sparkles
                size={16}
                style={{ display: 'inline', marginInlineEnd: '0.4rem' }}
              />
              {isAr
                ? 'اللصق السريع الذكي لقوالب المقالات (Magic Article Paste)'
                : 'Smart AI Article Template Paste'}
            </h2>
            <p className={styles.pageSubtitle}>
              {isAr
                ? 'انسخ قالب الذكاء الاصطناعي، الصق المخرج هنا، واضغط تعبئة لتفريغ جميع حقول المقال والـ SEO والأسئلة الشائعة تلقائياً.'
                : 'Copy the AI prompt template, paste the generated output below, and auto-fill all article, SEO, and FAQ fields.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyAiPrompt}
            className={styles.topBarBtn}
          >
            <Copy size={14} />
            <span>
              {isAr ? 'نسخ أمر الذكاء الاصطناعي للمقالات' : 'Copy AI Article Prompt'}
            </span>
          </button>
        </div>

        <textarea
          rows={4}
          value={magicRawText}
          onChange={(e) => setMagicRawText(e.target.value)}
          className={styles.textareaInput}
          placeholder={
            isAr
              ? 'الصق هنا مخرج الذكاء الاصطناعي ([العنوان بالعربية]: ... [المحتوى بالعربية]: ...)'
              : 'Paste AI article template output here...'
          }
        />

        <div className={styles.actionRow} style={{ marginBlockStart: '0.75rem' }}>
          <Button
            type="button"
            size="sm"
            onClick={handleMagicParse}
            disabled={!magicRawText.trim()}
          >
            {isAr
              ? 'تحليل وتعبئة الحقول تلقائياً'
              : 'Parse & Auto-Fill Article Fields'}
          </Button>
          {magicRawText && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setMagicRawText('')}
            >
              {isAr ? 'مسح النص' : 'Clear'}
            </Button>
          )}
        </div>
      </section>

      <form onSubmit={handleSubmit} className={styles.card}>
        <div className={styles.formGrid}>
          <Input
            label={isAr ? 'المعرف (Slug)' : 'URL Slug'}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. best-noise-cancelling-headphones-2026"
            required
          />

          <Input
            label={isAr ? 'اسم الكاتب / الفريق التحريري' : 'Author Name'}
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="SoufShop Editorial Team"
            required
          />
        </div>

        <div className={styles.formGrid}>
          <Input
            label={isAr ? 'العنوان باللغة العربية' : 'Title (Arabic)'}
            value={titleAr}
            onChange={(e) => setTitleAr(e.target.value)}
            placeholder="مثال: أفضل 5 سماعات رأس لاسلكية لعام 2026"
            required
          />

          <Input
            label={isAr ? 'العنوان باللغة الإنجليزية' : 'Title (English)'}
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            placeholder="e.g. Top 5 Wireless Noise-Cancelling Headphones in 2026"
            required
          />
        </div>

        <div className={styles.formGrid}>
          <Input
            label={isAr ? 'رابط صورة الغلاف (اختياري)' : 'Cover Image URL (Optional)'}
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="/images/hero-bg.jpg"
          />

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              {isAr
                ? 'المنتج الفائز / الخيار الأول (Top Pick)'
                : 'Top Pick Featured Product'}
            </label>
            <select
              value={topPickProductId}
              onChange={(e) => setTopPickProductId(e.target.value)}
              className={styles.selectInput}
            >
              <option value="">
                {isAr
                  ? '— اختيار تلقائي (أول منتج مرتبط) —'
                  : '— Auto (First linked product) —'}
              </option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {t(p.title)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              {isAr ? 'المقتطف / النبذة (عربي)' : 'Excerpt (Arabic)'}
            </label>
            <textarea
              rows={3}
              value={excerptAr}
              onChange={(e) => setExcerptAr(e.target.value)}
              className={styles.textareaInput}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              {isAr ? 'المقتطف / النبذة (إنجليزي)' : 'Excerpt (English)'}
            </label>
            <textarea
              rows={3}
              value={excerptEn}
              onChange={(e) => setExcerptEn(e.target.value)}
              className={styles.textareaInput}
              required
            />
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              {isAr ? 'محتوى الدليل (عربي - HTML)' : 'Content HTML (Arabic)'}
            </label>
            <textarea
              rows={10}
              value={contentAr}
              onChange={(e) => setContentAr(e.target.value)}
              className={styles.textareaInput}
              placeholder="<h2>مقدمة</h2><p>...</p><h2>أبرز المعايير</h2><p>...</p>"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              {isAr ? 'محتوى الدليل (إنجليزي - HTML)' : 'Content HTML (English)'}
            </label>
            <textarea
              rows={10}
              value={contentEn}
              onChange={(e) => setContentEn(e.target.value)}
              className={styles.textareaInput}
              placeholder="<h2>Introduction</h2><p>...</p><h2>Key Criteria</h2><p>...</p>"
            />
          </div>
        </div>

        {/* Editor's Verdict Fields */}
        <div className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              {isAr
                ? 'خلاصة وتوصية المحرر (عربي)'
                : "Editor's Verdict & Recommendation (Arabic)"}
            </label>
            <textarea
              rows={3}
              value={editorVerdictAr}
              onChange={(e) => setEditorVerdictAr(e.target.value)}
              className={styles.textareaInput}
              placeholder="توصية ختامية توجه المشتري للخيار الأنسب لميزانيته..."
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              {isAr
                ? 'خلاصة وتوصية المحرر (إنجليزي)'
                : "Editor's Verdict & Recommendation (English)"}
            </label>
            <textarea
              rows={3}
              value={editorVerdictEn}
              onChange={(e) => setEditorVerdictEn(e.target.value)}
              className={styles.textareaInput}
              placeholder="Final recommendation guiding the shopper by budget and needs..."
            />
          </div>
        </div>

        {/* Advanced SEO Section */}
        <div
          style={{
            marginBlock: '1.25rem',
            paddingBlockStart: '1.25rem',
            borderBlockStart: '1px solid var(--color-border-hairline)',
          }}
        >
          <h2 className={styles.sectionTitle} style={{ marginBlockEnd: '0.75rem' }}>
            {isAr
              ? 'إعدادات محركات البحث المتقدمة (Advanced SEO)'
              : 'Advanced Search Engine Optimization (SEO)'}
          </h2>

          <div className={styles.formGrid}>
            <Input
              label={
                isAr
                  ? 'عنوان محركات البحث (SEO Title - عربي)'
                  : 'SEO Meta Title (Arabic)'
              }
              value={seoTitleAr}
              onChange={(e) => setSeoTitleAr(e.target.value)}
              placeholder={titleAr || 'أفضل 5 سماعات لاسلكية 2026 | SoufShop'}
            />

            <Input
              label={
                isAr
                  ? 'عنوان محركات البحث (SEO Title - إنجليزي)'
                  : 'SEO Meta Title (English)'
              }
              value={seoTitleEn}
              onChange={(e) => setSeoTitleEn(e.target.value)}
              placeholder={titleEn || 'Top 5 Wireless Headphones 2026 | SoufShop'}
            />
          </div>

          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                {isAr
                  ? 'الوصف التعريفي لمحركات البحث (Meta Description - عربي)'
                  : 'SEO Meta Description (Arabic)'}
              </label>
              <textarea
                rows={2}
                value={seoDescriptionAr}
                onChange={(e) => setSeoDescriptionAr(e.target.value)}
                className={styles.textareaInput}
                placeholder="وصف مركز من 120-155 حرفاً يظهر في نتائج بحث Google..."
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                {isAr
                  ? 'الوصف التعريفي لمحركات البحث (Meta Description - إنجليزي)'
                  : 'SEO Meta Description (English)'}
              </label>
              <textarea
                rows={2}
                value={seoDescriptionEn}
                onChange={(e) => setSeoDescriptionEn(e.target.value)}
                className={styles.textareaInput}
                placeholder="120-155 chars summary for Google search snippets..."
              />
            </div>
          </div>

          <div className={styles.formGrid}>
            <Input
              label={
                isAr
                  ? 'الكلمات المفتاحية (Long-tail Keywords مفصولة بفواصل)'
                  : 'Target SEO Keywords (Comma-separated)'
              }
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
              placeholder="أفضل سماعات لاسلكية، مقارنة سماعات، best wireless headphones"
            />

            <Input
              label={isAr ? 'وقت القراءة المقدر (بالدقائق)' : 'Reading Time (Minutes)'}
              type="number"
              min={1}
              max={60}
              value={readingTimeMinutes}
              onChange={(e) => setReadingTimeMinutes(e.target.value)}
              required
            />
          </div>
        </div>

        {/* FAQ Schema Builder */}
        <div
          style={{
            marginBlock: '1.25rem',
            paddingBlockStart: '1.25rem',
            borderBlockStart: '1px solid var(--color-border-hairline)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBlockEnd: '0.75rem',
            }}
          >
            <div>
              <h2 className={styles.sectionTitle}>
                {isAr
                  ? 'الأسئلة الشائعة (FAQPage Schema لنتائج Google)'
                  : 'FAQ Items (FAQPage Rich Schema)'}
              </h2>
              <p className={styles.pageSubtitle}>
                {isAr
                  ? 'تُعرض في نهاية المقال وتُضمّن تلقائياً كـ FAQPage JSON-LD في محرك بحث Google.'
                  : 'Displayed at the end of the guide and embedded as FAQPage JSON-LD schema.'}
              </p>
            </div>
            <button type="button" onClick={addFaqRow} className={styles.topBarBtn}>
              <Plus size={14} />
              <span>{isAr ? 'إضافة سؤال شائع' : 'Add FAQ Item'}</span>
            </button>
          </div>

          {faqItems.map((faq, idx) => (
            <div
              key={idx}
              style={{
                padding: '1rem',
                border: '1px solid var(--color-border-hairline)',
                borderRadius: 'var(--radius-md)',
                marginBlockEnd: '0.75rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBlockEnd: '0.5rem',
                }}
              >
                <strong>
                  {isAr ? `سؤال #${idx + 1}` : `FAQ #${idx + 1}`}
                </strong>
                <button
                  type="button"
                  onClick={() => removeFaqRow(idx)}
                  className={styles.topBarBtn}
                >
                  <Trash2 size={13} />
                  <span>{isAr ? 'حذف' : 'Remove'}</span>
                </button>
              </div>
              <div className={styles.formGrid}>
                <Input
                  label={isAr ? 'السؤال (عربي)' : 'Question (Arabic)'}
                  value={faq.question.ar}
                  onChange={(e) =>
                    updateFaqRow(idx, 'question', 'ar', e.target.value)
                  }
                />
                <Input
                  label={isAr ? 'السؤال (إنجليزي)' : 'Question (English)'}
                  value={faq.question.en}
                  onChange={(e) =>
                    updateFaqRow(idx, 'question', 'en', e.target.value)
                  }
                />
              </div>
              <div className={styles.formGrid}>
                <Input
                  label={isAr ? 'الإجابة (عربي)' : 'Answer (Arabic)'}
                  value={faq.answer.ar}
                  onChange={(e) => updateFaqRow(idx, 'answer', 'ar', e.target.value)}
                />
                <Input
                  label={isAr ? 'الإجابة (إنجليزي)' : 'Answer (English)'}
                  value={faq.answer.en}
                  onChange={(e) => updateFaqRow(idx, 'answer', 'en', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <div className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              {isAr ? 'الفئة' : 'Category'}
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={styles.selectInput}
            >
              <option value="general">{isAr ? 'عام' : 'General'}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {t(c.name)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              {isAr ? 'حالة النشر' : 'Status'}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'published' | 'draft')}
              className={styles.selectInput}
            >
              <option value="published">{isAr ? 'منشور' : 'Published'}</option>
              <option value="draft">{isAr ? 'مسودة' : 'Draft'}</option>
            </select>
          </div>
        </div>

        {products.length > 0 && (
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              {isAr
                ? 'المنتجات الموصى بها داخل هذا الدليل (تظهر في جدول المقارنة وبين الفقرات وفي أسفل المقال)'
                : 'Recommended Products Linked to This Guide (Shown in comparison table, inline cards & footer)'}
            </label>
            <div className={styles.actionRow} style={{ flexWrap: 'wrap', gap: '8px' }}>
              {products.map((p) => (
                <label
                  key={p.id}
                  className={styles.topBarBtn}
                  style={{ cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={relatedProductIds.includes(p.id)}
                    onChange={() => toggleProductSelection(p.id)}
                    style={{ marginInlineEnd: '6px' }}
                  />
                  <span>{t(p.title)}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {errorMessage && (
          <div className={styles.alertBanner} role="alert">
            {errorMessage}
          </div>
        )}

        <div className={styles.actionRow}>
          <Button type="submit" size="lg" isLoading={saving}>
            {isAr ? 'حفظ الدليل' : 'Save Guide'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/admin/articles')}
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
        </div>
      </form>
    </>
  );
}
