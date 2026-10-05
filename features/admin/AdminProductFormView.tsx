'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, HelpCircle, Plus, Sparkles, Trash2, Upload, Wand2 } from 'lucide-react';
import type {
  Category,
  PartnerSource,
  PriceDisplayPolicy,
  Product,
  ProductImage,
  ProductStatus,
  PromoBadgeType,
} from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import { useSaved } from '@/features/saved/SavedProvider';
import { useToast } from '@/components/ui/Toast';
import {
  getFreshFirebaseIdToken,
  syncAdminDocumentToFirebaseClient,
} from '@/lib/firebase-client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { generateSlug } from '@/lib/seoSlug';
import {
  MAGIC_AI_PROMPT_TEMPLATE,
  parseMagicProductContent,
} from '@/lib/magicContentParser';
import styles from './AdminShell.module.css';

interface AdminProductFormViewProps {
  existingProduct?: Product | null;
  categories: Category[];
  sources: PartnerSource[];
  cloudinaryReady: boolean;
}

export function AdminProductFormView({
  existingProduct,
  categories,
  sources,
  cloudinaryReady,
}: AdminProductFormViewProps) {
  const { locale, t } = useI18n();
  const { csrfToken } = useSaved();
  const { showToast } = useToast();
  const router = useRouter();
  const isAr = locale === 'ar';

  // Smart Magic Paste State
  const [magicRawText, setMagicRawText] = useState('');
  const [showPromptTemplate, setShowPromptTemplate] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Form Fields State
  const [slug, setSlug] = useState(existingProduct?.slug || '');
  const [titleEn, setTitleEn] = useState(existingProduct?.title.en || '');
  const [titleAr, setTitleAr] = useState(existingProduct?.title.ar || '');
  const [summaryEn, setSummaryEn] = useState(existingProduct?.shortSummary.en || '');
  const [summaryAr, setSummaryAr] = useState(existingProduct?.shortSummary.ar || '');
  const [whyEn, setWhyEn] = useState(existingProduct?.whyWePickedIt.en || '');
  const [whyAr, setWhyAr] = useState(existingProduct?.whyWePickedIt.ar || '');
  const [considerEn, setConsiderEn] = useState(existingProduct?.whatToConsider.en || '');
  const [considerAr, setConsiderAr] = useState(existingProduct?.whatToConsider.ar || '');
  const [descEn, setDescEn] = useState(existingProduct?.description.en || '');
  const [descAr, setDescAr] = useState(existingProduct?.description.ar || '');

  const [sourceId, setSourceId] = useState(
    existingProduct?.sourceId || sources[0]?.id || 'amazon'
  );
  const [categoryId, setCategoryId] = useState(
    existingProduct?.categorySlug ||
      existingProduct?.categoryId ||
      categories[0]?.slug ||
      categories[0]?.id ||
      ''
  );
  const [affiliateUrl, setAffiliateUrl] = useState(existingProduct?.affiliateUrl || '');
  const [priceDisplayPolicy, setPriceDisplayPolicy] = useState<PriceDisplayPolicy>(
    existingProduct?.priceDisplayPolicy || 'show_with_timestamp'
  );
  const [priceAmount, setPriceAmount] = useState<string>(
    existingProduct?.priceAmount !== null && existingProduct?.priceAmount !== undefined
      ? String(existingProduct.priceAmount)
      : ''
  );
  const [oldPrice, setOldPrice] = useState<string>(
    existingProduct?.oldPrice !== null && existingProduct?.oldPrice !== undefined
      ? String(existingProduct.oldPrice)
      : ''
  );
  const [discount, setDiscount] = useState<string>(
    existingProduct?.discount !== null && existingProduct?.discount !== undefined
      ? String(existingProduct.discount)
      : ''
  );
  const [stars, setStars] = useState<string>(
    existingProduct?.stars !== null && existingProduct?.stars !== undefined
      ? String(existingProduct.stars)
      : ''
  );
  const [soldCount, setSoldCount] = useState<string>(
    existingProduct?.soldCount !== null && existingProduct?.soldCount !== undefined
      ? String(existingProduct.soldCount)
      : ''
  );
  const [badge, setBadge] = useState<PromoBadgeType>(
    existingProduct?.badge ?? null
  );
  const [priceCurrency, setPriceCurrency] = useState(
    existingProduct?.priceCurrency || 'DH'
  );
  const [tagsText, setTagsText] = useState(existingProduct?.tags.join(', ') || '');
  const [isFeatured, setIsFeatured] = useState(Boolean(existingProduct?.isFeatured));
  const [status, setStatus] = useState<ProductStatus>(
    existingProduct?.status || 'published'
  );

  const [images, setImages] = useState<ProductImage[]>(existingProduct?.images || []);
  const [videoUrl, setVideoUrl] = useState(existingProduct?.videoUrl || '');
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle Magic Auto-Fill
  const handleApplyMagicFill = () => {
    if (!magicRawText.trim()) {
      showToast(
        isAr ? 'الرجاء لصق نص المحتوى أولاً.' : 'Please paste content text first.',
        'error'
      );
      return;
    }

    const { draft, fieldsFoundCount } = parseMagicProductContent(magicRawText);

    if (fieldsFoundCount === 0) {
      showToast(
        isAr
          ? 'لم نتمكن من استخراج حقول مطابقة. تأكد من استخدام القالب أو صيغة JSON.'
          : 'No matching fields found. Please verify the format or use the template.',
        'error'
      );
      return;
    }

    if (draft.titleAr !== undefined) setTitleAr(draft.titleAr);
    if (draft.titleEn !== undefined) setTitleEn(draft.titleEn);
    if (draft.slug !== undefined) setSlug(draft.slug);
    if (draft.summaryAr !== undefined) setSummaryAr(draft.summaryAr);
    if (draft.summaryEn !== undefined) setSummaryEn(draft.summaryEn);
    if (draft.whyAr !== undefined) setWhyAr(draft.whyAr);
    if (draft.whyEn !== undefined) setWhyEn(draft.whyEn);
    if (draft.considerAr !== undefined) setConsiderAr(draft.considerAr);
    if (draft.considerEn !== undefined) setConsiderEn(draft.considerEn);
    if (draft.descAr !== undefined) setDescAr(draft.descAr);
    if (draft.descEn !== undefined) setDescEn(draft.descEn);

    if (draft.priceAmount !== undefined) setPriceAmount(draft.priceAmount);
    if (draft.oldPrice !== undefined) setOldPrice(draft.oldPrice);
    if (draft.discount !== undefined) setDiscount(draft.discount);
    if (draft.stars !== undefined) setStars(draft.stars);
    if (draft.soldCount !== undefined) setSoldCount(draft.soldCount);
    if (draft.badge) {
      if (draft.badge.includes('توفير')) setBadge('توفير');
      else if (draft.badge.includes('الأخير')) setBadge('اليوم الأخير');
    }
    if (draft.priceCurrency) setPriceCurrency(draft.priceCurrency);
    if (draft.affiliateUrl) setAffiliateUrl(draft.affiliateUrl);
    if (draft.videoUrl) setVideoUrl(draft.videoUrl);
    if (draft.tags) setTagsText(draft.tags);

    // Auto-match Category if found
    if (draft.categoryId) {
      const catQuery = draft.categoryId.toLowerCase().trim();
      const matchedCat = categories.find(
        (c) =>
          c.slug.toLowerCase() === catQuery ||
          c.id.toLowerCase() === catQuery ||
          (c.name?.ar && c.name.ar.toLowerCase().includes(catQuery)) ||
          (c.name?.en && c.name.en.toLowerCase().includes(catQuery))
      );
      if (matchedCat) {
        setCategoryId(matchedCat.slug || matchedCat.id);
      }
    }

    // Add extracted images if any
    if (draft.images && draft.images.length > 0) {
      const newImages: ProductImage[] = draft.images.map((url) => ({
        url,
        alt: {
          en: draft.titleEn || titleEn || 'Product image',
          ar: draft.titleAr || titleAr || 'صورة المنتج',
        },
        width: 800,
        height: 600,
      }));
      setImages((prev) => [...prev, ...newImages]);
    }

    showToast(
      isAr
        ? `⚡ تم استخراج وتعبئة (${fieldsFoundCount}) حقول بنجاح!`
        : `⚡ Successfully extracted and filled (${fieldsFoundCount}) fields!`,
      'success'
    );
  };

  const handleCopyPromptTemplate = () => {
    navigator.clipboard.writeText(MAGIC_AI_PROMPT_TEMPLATE);
    setCopiedPrompt(true);
    showToast(
      isAr ? 'تم نسخ نموذج التعليمات للحافظة!' : 'Prompt template copied to clipboard!',
      'success'
    );
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const compressImageFileToDataUrl = (
    file: File
  ): Promise<{ url: string; width: number; height: number }> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Unable to read image file.'));
      reader.onload = () => {
        const img = new window.Image();
        img.onerror = () => reject(new Error('Invalid image file.'));
        img.onload = () => {
          const maxDim = 960;
          let width = img.naturalWidth || 800;
          let height = img.naturalHeight || 600;
          if (width > maxDim || height > maxDim) {
            if (width >= height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ url: String(reader.result), width, height });
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve({ url: dataUrl, width, height });
        };
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setErrorMessage('');
    try {
      let uploadedImage: ProductImage | null = null;

      if (csrfToken) {
        try {
          const sigRes = await fetch('/api/admin/upload-signature', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-csrf-token': csrfToken,
            },
            body: JSON.stringify({
              mimeType: file.type || 'image/jpeg',
              fileSizeBytes: file.size,
            }),
          });

          const sigData = (await sigRes.json()) as {
            cloudName?: string;
            apiKey?: string;
            timestamp?: number;
            signature?: string;
            folder?: string;
          };

          if (sigRes.ok && sigData.signature && sigData.cloudName && sigData.apiKey) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('api_key', sigData.apiKey);
            formData.append('timestamp', String(sigData.timestamp));
            formData.append('signature', sigData.signature);
            formData.append('folder', sigData.folder || 'soufshop/products');

            const uploadRes = await fetch(
              `https://api.cloudinary.com/v1_1/${encodeURIComponent(sigData.cloudName)}/image/upload`,
              {
                method: 'POST',
                body: formData,
              }
            );

            if (uploadRes.ok) {
              const uploaded = (await uploadRes.json()) as {
                secure_url: string;
                public_id: string;
                width: number;
                height: number;
              };
              uploadedImage = {
                url: uploaded.secure_url,
                publicId: uploaded.public_id,
                alt: { en: titleEn || 'Product image', ar: titleAr || 'صورة المنتج' },
                width: uploaded.width || 800,
                height: uploaded.height || 600,
              };
            }
          }
        } catch {
          // Fallback to direct compressed image below
        }
      }

      if (!uploadedImage) {
        const compressed = await compressImageFileToDataUrl(file);
        uploadedImage = {
          url: compressed.url,
          alt: { en: titleEn || 'Product image', ar: titleAr || 'صورة المنتج' },
          width: compressed.width,
          height: compressed.height,
        };
      }

      setImages((prev) => [...prev, uploadedImage!]);
      showToast(
        isAr ? 'تم رفع وإضافة الصورة بنجاح.' : 'Image uploaded and added successfully.',
        'success'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setErrorMessage(msg);
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleAddManualImage = () => {
    const trimmed = manualImageUrl.trim();
    if (!trimmed) return;
    const normalizedUrl =
      trimmed.startsWith('https://') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('data:image/')
        ? trimmed
        : `https://${trimmed}`;

    setImages((prev) => [
      ...prev,
      {
        url: normalizedUrl,
        alt: { en: titleEn || 'Product image', ar: titleAr || 'صورة المنتج' },
        width: 800,
        height: 600,
      },
    ]);
    setManualImageUrl('');
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csrfToken) return;
    setSaving(true);
    setErrorMessage('');

    try {
      const finalImages = [...images];
      const pendingUrl = manualImageUrl.trim();
      if (pendingUrl) {
        const normalizedPending =
          pendingUrl.startsWith('https://') ||
          pendingUrl.startsWith('http://') ||
          pendingUrl.startsWith('data:image/')
            ? pendingUrl
            : `https://${pendingUrl}`;
        finalImages.push({
          url: normalizedPending,
          alt: { en: titleEn || 'Product image', ar: titleAr || 'صورة المنتج' },
          width: 800,
          height: 600,
        });
      }

      const autoSlug = slug.trim()
        ? generateSlug(slug.trim(), sourceId)
        : generateSlug(titleEn || titleAr, sourceId);

      const payload = {
        slug: autoSlug,
        title: { en: titleEn, ar: titleAr },
        shortSummary: { en: summaryEn, ar: summaryAr },
        whyWePickedIt: { en: whyEn, ar: whyAr },
        whatToConsider: { en: considerEn, ar: considerAr },
        description: { en: descEn, ar: descAr },
        priceAmount: priceAmount.trim() !== '' ? Number(priceAmount) : null,
        oldPrice: oldPrice.trim() !== '' ? Number(oldPrice) : null,
        discount: discount.trim() !== '' ? Number(discount) : null,
        stars: stars.trim() !== '' ? Number(stars) : null,
        soldCount: soldCount.trim() !== '' ? Number(soldCount) : null,
        badge,
        priceCurrency,
        priceDisplayPolicy,
        affiliateUrl: affiliateUrl.trim(),
        sourceId,
        categoryId,
        images: finalImages,
        videoUrl: videoUrl.trim() || undefined,
        tags: tagsText
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
        isFeatured,
        status,
      };

      const fbToken = await getFreshFirebaseIdToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
      };
      if (fbToken) {
        headers['x-firebase-id-token'] = fbToken;
      }

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          existingId: existingProduct?.id,
          payload,
        }),
      });

      const data = (await res.json()) as { error?: string; product?: Product };
      if (!res.ok) {
        setErrorMessage(data.error || 'Unable to save product.');
        return;
      }

      if (data.product && data.product.id) {
        void syncAdminDocumentToFirebaseClient('products', data.product.id, data.product);
      }

      showToast(
        isAr ? 'تم حفظ المنتج بنجاح في قاعدة بيانات Firebase.' : 'Product saved to Firebase successfully.',
        'success'
      );
      router.push('/admin/products');
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
            {existingProduct
              ? isAr
                ? 'تعديل المنتج'
                : 'Edit Product'
              : isAr
                ? 'إضافة منتج جديد'
                : 'Add New Curated Product'}
          </h1>
          <p className={styles.pageSubtitle}>
            {isAr
              ? 'أدخل بيانات المنتج باللغتين الإنجليزية والعربية، أو استخدم ميزة اللصق السريع الذكي أدناه لتعبئة كل الحقول بنقرة واحدة.'
              : 'Provide bilingual editorial details or use the Smart Magic Paste feature below to auto-fill all fields in one click.'}
          </p>
        </div>
      </div>

      {/* ⚡ Smart Magic Paste & Auto-Fill Container */}
      <div className={styles.magicBox}>
        <div className={styles.magicHeader}>
          <div className={styles.magicTitleGroup}>
            <Sparkles size={18} color="#2DD4BF" aria-hidden="true" />
            <h2 className={styles.magicTitle}>
              {isAr ? 'اللصق السريع والتوزيع التلقائي للمحتوى' : 'Smart Magic Paste & Auto-Fill'}
            </h2>
            <span className={styles.magicBadge}>
              {isAr ? 'ميزة ذكية ⚡' : 'AI Helper ⚡'}
            </span>
          </div>

          <div className={styles.actionRow}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPromptTemplate((prev) => !prev)}
            >
              <HelpCircle size={14} aria-hidden="true" />
              <span>{isAr ? 'نموذج التعليمات (Prompt)' : 'Prompt Template'}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyPromptTemplate}
            >
              {copiedPrompt ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
              <span>{copiedPrompt ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ القالب' : 'Copy Template')}</span>
            </Button>
          </div>
        </div>

        <p className={styles.magicDesc}>
          {isAr
            ? 'الصق النص الكامل المستلم من وكيل الذكاء الاصطناعي (سواء بتنسيق القالب [العنوان]: ... أو بتنسيق JSON) واضغط «توزيع المحتوى» لتعبئة كافة الحقول فوراً.'
            : 'Paste the full output from your AI copywriter (Tagged format or JSON) and click "Auto-Fill Fields" to populate all inputs instantly.'}
        </p>

        {showPromptTemplate && (
          <div className={styles.promptCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {isAr ? '📋 انسخ هذا القالب وقم بتزويده للوكيل أو الذكاء الاصطناعي:' : '📋 Copy this prompt and give it to your AI agent:'}
              </span>
              <Button type="button" variant="outline" size="sm" onClick={handleCopyPromptTemplate}>
                {copiedPrompt ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
                <span>{isAr ? 'نسخ' : 'Copy'}</span>
              </Button>
            </div>
            <div className={styles.promptCode}>
              {MAGIC_AI_PROMPT_TEMPLATE}
            </div>
          </div>
        )}

        <textarea
          value={magicRawText}
          onChange={(e) => setMagicRawText(e.target.value)}
          placeholder={
            isAr
              ? 'الصق محتوى المنتج هنا (مثل:\n[العنوان بالعربية]: زجاجة مياه حرارية 24 أونصة\n[العنوان بالإنجليزية]: 24oz Insulated Bottle\n[الرابط slug]: 24oz-insulated-bottle\n[الملخص بالعربية]: ...\n... إلخ)'
              : 'Paste your product text here (JSON or Tagged Template)...'
          }
          className={styles.magicTextarea}
        />

        <div className={styles.actionRow}>
          <Button
            type="button"
            onClick={handleApplyMagicFill}
            style={{
              backgroundColor: '#0F766E',
              color: '#ffffff',
              fontWeight: 700,
            }}
          >
            <Wand2 size={16} aria-hidden="true" />
            <span>{isAr ? 'توزيع المحتوى على الحقول ⚡' : 'Auto-Fill Fields ⚡'}</span>
          </Button>

          {magicRawText && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMagicRawText('')}
            >
              {isAr ? 'مسح النص' : 'Clear'}
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.card}>
        <div className={styles.formGrid}>
          <Input
            label={isAr ? 'المعرّف في الرابط (Slug - اختياري)' : 'URL Slug (Optional)'}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="ergonomic-desk-lamp"
          />

          <Input
            label={isAr ? 'رابط العمولة الخارجي (HTTPS)' : 'Partner Affiliate URL (HTTPS)'}
            value={affiliateUrl}
            onChange={(e) => setAffiliateUrl(e.target.value)}
            placeholder="https://www.amazon.com/dp/..."
            required
          />

          <Input
            label={isAr ? 'اسم المنتج (بالإنجليزية)' : 'Product Title (English)'}
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
          />

          <Input
            label={isAr ? 'اسم المنتج (بالعربية)' : 'Product Title (Arabic)'}
            value={titleAr}
            onChange={(e) => setTitleAr(e.target.value)}
          />

          <Input
            label={isAr ? 'ملخص قصير (بالإنجليزية - اختياري)' : 'Short Summary (English - Optional)'}
            value={summaryEn}
            onChange={(e) => setSummaryEn(e.target.value)}
          />

          <Input
            label={isAr ? 'ملخص قصير (بالعربية - اختياري)' : 'Short Summary (Arabic - Optional)'}
            value={summaryAr}
            onChange={(e) => setSummaryAr(e.target.value)}
          />
        </div>

        <div className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              {isAr ? 'لماذا اخترناه (بالإنجليزية - اختياري)' : 'Why We Picked It (English - Optional)'}
            </label>
            <textarea
              rows={3}
              value={whyEn}
              onChange={(e) => setWhyEn(e.target.value)}
              className={styles.textareaInput}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              {isAr ? 'لماذا اخترناه (بالعربية - اختياري)' : 'Why We Picked It (Arabic - Optional)'}
            </label>
            <textarea
              rows={3}
              value={whyAr}
              onChange={(e) => setWhyAr(e.target.value)}
              className={styles.textareaInput}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              {isAr ? 'ما يجب الانتباه له (بالإنجليزية - اختياري)' : 'What to Consider (English - Optional)'}
            </label>
            <textarea
              rows={3}
              value={considerEn}
              onChange={(e) => setConsiderEn(e.target.value)}
              className={styles.textareaInput}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              {isAr ? 'ما يجب الانتباه له (بالعربية - اختياري)' : 'What to Consider (Arabic - Optional)'}
            </label>
            <textarea
              rows={3}
              value={considerAr}
              onChange={(e) => setConsiderAr(e.target.value)}
              className={styles.textareaInput}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              {isAr ? 'الوصف التفصيلي (بالإنجليزية - اختياري)' : 'Detailed Description (English - Optional)'}
            </label>
            <textarea
              rows={4}
              value={descEn}
              onChange={(e) => setDescEn(e.target.value)}
              className={styles.textareaInput}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              {isAr ? 'الوصف التفصيلي (بالعربية - اختياري)' : 'Detailed Description (Arabic - Optional)'}
            </label>
            <textarea
              rows={4}
              value={descAr}
              onChange={(e) => setDescAr(e.target.value)}
              className={styles.textareaInput}
            />
          </div>
        </div>

        {/* Store, Category & Pricing */}
        <div className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              {isAr ? 'المتجر الشريك (Source)' : 'Partner Store'}
            </label>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className={styles.selectInput}
            >
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {t(s.name)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className={styles.fieldLabel}>
                {isAr ? 'فئة المنتج (Category)' : 'Product Category'}
              </label>
              <a
                href="/admin/categories"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '12px', color: 'var(--color-primary, #2DD4BF)', textDecoration: 'underline' }}
              >
                {isAr ? '+ إدارة الفئات' : '+ Manage Categories'}
              </a>
            </div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={styles.selectInput}
              required
            >
              {categories.length === 0 ? (
                <option value="">
                  {isAr ? 'لا توجد فئات بعد (أضف فئة من صفحة الفئات)' : 'No categories yet (Add in Categories page)'}
                </option>
              ) : (
                categories.map((c) => (
                  <option key={c.id || c.slug} value={c.slug || c.id}>
                    {c.icon ? `${c.icon} ` : ''}{isAr ? (c.name?.ar || c.name?.en) : (c.name?.en || c.name?.ar)} ({c.slug})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              {isAr ? 'سياسة عرض السعر' : 'Price Display Policy'}
            </label>
            <select
              value={priceDisplayPolicy}
              onChange={(e) => setPriceDisplayPolicy(e.target.value as PriceDisplayPolicy)}
              className={styles.selectInput}
            >
              <option value="show_with_timestamp">
                {isAr
                  ? 'عرض السعر مع تاريخ التحقق'
                  : 'Show Price With Checked Timestamp'}
              </option>
              <option value="hide_price_check_store">
                {isAr
                  ? 'إخفاء السعر وتوجيه الزائر لفحص السعر الحي (موصى به لـ Amazon)'
                  : 'Hide Static Price — Check Live on Store (Recommended for Amazon)'}
              </option>
            </select>
          </div>

          <div className={styles.actionRow}>
            <Input
              type="number"
              step="0.01"
              min="0"
              label={isAr ? 'السعر الجديد (الحالي)' : 'Current Price'}
              value={priceAmount}
              onChange={(e) => setPriceAmount(e.target.value)}
              placeholder="102"
            />

            <Input
              type="number"
              step="0.01"
              min="0"
              label={isAr ? 'السعر القديم (قبل الخصم - اختياري)' : 'Old Price (Optional)'}
              value={oldPrice}
              onChange={(e) => setOldPrice(e.target.value)}
              placeholder="256"
            />

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                {isAr ? 'العملة' : 'Currency'}
              </label>
              <select
                value={priceCurrency}
                onChange={(e) => setPriceCurrency(e.target.value)}
                className={styles.selectInput}
              >
                <option value="DH">DH (درهم)</option>
                <option value="MAD">MAD (د.م.)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="SAR">SAR (ر.س)</option>
                <option value="AED">AED (د.إ)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <div className={styles.actionRow}>
            <Input
              type="number"
              min="1"
              max="99"
              label={isAr ? 'نسبة الخصم % (اختياري أو يُحسب تلقائياً)' : 'Discount % (Optional)'}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="44"
            />

            <Input
              type="number"
              step="0.1"
              min="1"
              max="5"
              label={isAr ? 'النجوم (1 إلى 5 - اختياري)' : 'Stars Rating (1–5)'}
              value={stars}
              onChange={(e) => setStars(e.target.value)}
              placeholder="4.5"
            />

            <Input
              type="number"
              min="0"
              label={isAr ? 'عدد المبيعات (اختياري)' : 'Sold Count (Optional)'}
              value={soldCount}
              onChange={(e) => setSoldCount(e.target.value)}
              placeholder="546"
            />

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                {isAr ? 'شارة العرض (اختياري)' : 'Promo Badge (Optional)'}
              </label>
              <select
                value={badge || ''}
                onChange={(e) =>
                  setBadge(
                    e.target.value === 'توفير' || e.target.value === 'اليوم الأخير'
                      ? e.target.value
                      : null
                  )
                }
                className={styles.selectInput}
              >
                <option value="">{isAr ? 'بدون شارة' : 'None'}</option>
                <option value="توفير">{isAr ? 'توفير (أخضر)' : 'Savings (توفير)'}</option>
                <option value="اليوم الأخير">
                  {isAr ? 'اليوم الأخير (برتقالي)' : 'Last Day (اليوم الأخير)'}
                </option>
              </select>
            </div>
          </div>

          <Input
            label={isAr ? 'الوسوم (مفصولة بفواصل)' : 'Tags (comma-separated)'}
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="workspace, lighting, minimal"
          />

          <Input
            label={
              isAr
                ? 'رابط فيديو المنتج (videoUrl - اختياري)'
                : 'Product Video URL (videoUrl - Optional)'
            }
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="الصق رابط أي فيديو من أي موقع"
          />

          <div className={styles.actionRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                {isAr ? 'حالة النشر' : 'Status'}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
                className={styles.selectInput}
              >
                <option value="published">{isAr ? 'منشور' : 'Published'}</option>
                <option value="draft">{isAr ? 'مسودة' : 'Draft'}</option>
                <option value="archived">{isAr ? 'مؤرشف' : 'Archived'}</option>
              </select>
            </div>

            <label className={styles.actionRow}>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              <span className={styles.fieldLabel}>
                {isAr ? 'منتج مميز في الرئيسية' : 'Featured on Home Page'}
              </span>
            </label>
          </div>
        </div>

        {/* Product Images Section */}
        <div className={styles.fieldGroup}>
          <h2 className={styles.cardTitle}>
            {isAr ? 'صور المنتج' : 'Product Images'}
          </h2>

          {cloudinaryReady ? (
            <div className={styles.actionRow}>
              <label className={styles.storefrontLink}>
                <Upload size={15} aria-hidden="true" />
                <span>
                  {uploadingImage
                    ? isAr
                      ? 'جاري الرفع...'
                      : 'Uploading...'
                    : isAr
                      ? 'رفع صورة عبر Cloudinary الموقّع'
                      : 'Upload via Signed Cloudinary'}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleFileUpload}
                  disabled={uploadingImage}
                  hidden
                />
              </label>
            </div>
          ) : (
            <p className={styles.pageSubtitle}>
              {isAr
                ? 'رفع Cloudinary الموقّع غير مُعدّ بعد في متغيرات البيئة. يمكنك إضافة روابط صور HTTPS مباشرة أدناه أو ترك القائمة فارغة ليظهر الرسم التوضيحي التحريري الخاص بالموقع.'
                : 'Signed Cloudinary upload is not configured yet. You can add verified HTTPS image URLs below, or leave empty to display our custom SVG editorial artwork.'}
            </p>
          )}

          <div className={styles.actionRow}>
            <input
              type="text"
              value={manualImageUrl}
              onChange={(e) => setManualImageUrl(e.target.value)}
              placeholder="https://..."
              className={styles.selectInput}
            />
            <Button type="button" variant="outline" onClick={handleAddManualImage}>
              <Plus size={15} aria-hidden="true" />
              <span>{isAr ? 'إضافة رابط صورة' : 'Add Image URL'}</span>
            </Button>
          </div>

          {images.length > 0 && (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{isAr ? 'معاينة الصورة' : 'Preview'}</th>
                    <th>{isAr ? 'حذف' : 'Remove'}</th>
                  </tr>
                </thead>
                <tbody>
                  {images.map((img, idx) => (
                    <tr key={`${img.url.slice(0, 40)}-${idx}`}>
                      <td>
                        <div className={styles.actionRow}>
                          <img
                            src={img.url}
                            alt="Preview"
                            width={64}
                            height={48}
                            referrerPolicy="no-referrer"
                          />
                          <span>
                            {img.url.startsWith('data:image/')
                              ? isAr
                                ? 'صورة مرفوعة من جهازك'
                                : 'Uploaded image from device'
                              : img.url.slice(0, 60)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() =>
                            setImages((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className={styles.topBarBtn}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className={styles.alertBanner} role="alert">
            {errorMessage}
          </div>
        )}

        <div className={styles.actionRow}>
          <Button type="submit" size="lg" isLoading={saving}>
            {isAr ? 'حفظ المنتج' : 'Save Product'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/admin/products')}
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
        </div>
      </form>
    </>
  );
}
