'use client';

import React, { useState } from 'react';
import { CheckCircle2, Send, X } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { addTestimonial } from '@/lib/testimonials';
import styles from './AddTestimonialForm.module.css';

export interface AddTestimonialFormProps {
  onClose?: () => void;
}

export function AddTestimonialForm({ onClose }: AddTestimonialFormProps) {
  const { locale } = useI18n();
  const isAr = locale === 'ar';

  const [name, setName] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = name.trim();
    const cleanText = text.trim();

    if (!cleanName) {
      setErrorMsg(isAr ? 'يرجى إدخال الاسم.' : 'Please enter your name.');
      return;
    }
    if (!cleanText) {
      setErrorMsg(
        isAr ? 'يرجى كتابة نص الشهادة.' : 'Please write your review text.'
      );
      return;
    }

    setSubmitting(true);
    try {
      await addTestimonial({
        name: cleanName.slice(0, 50),
        rating,
        text: cleanText.slice(0, 300),
        locale: isAr ? 'ar' : 'en',
      });
      setSubmitted(true);
      setName('');
      setText('');
      setRating(5);
    } catch {
      setErrorMsg(
        isAr
          ? 'تعذر إرسال شهادتك حالياً. يرجى المحاولة مرة أخرى.'
          : 'Could not submit your review right now. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={styles.formWrapper} role="status" aria-live="polite">
        <div className={styles.successBox}>
          <span className={styles.successIconBadge} aria-hidden="true">
            <CheckCircle2 size={24} />
          </span>
          <p className={styles.successText}>
            {isAr
              ? 'شكراً! سيتم مراجعة شهادتك ونشرها قريباً'
              : 'Thank you! Your review will be checked and published soon'}
          </p>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={styles.submitBtn}
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          )}
        </div>
      </div>
    );
  }

  const displayStarCount = hoverRating || rating;

  return (
    <div className={styles.formWrapper}>
      <div className={styles.formHeader}>
        <h3 className={styles.formTitle}>
          {isAr ? 'أضف شهادتك حول AQURIVO' : 'Share Your AQURIVO Experience'}
        </h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={styles.closeBtn}
            aria-label={isAr ? 'إغلاق' : 'Close'}
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className={styles.formBody} noValidate>
        {/* 1. Name Input (Required, max 50 chars) */}
        <div className={styles.fieldGroup}>
          <div className={styles.labelRow}>
            <label htmlFor="testimonial-name" className={styles.fieldLabel}>
              {isAr ? 'الاسم *' : 'Your Name *'}
            </label>
            <span className={`${styles.charCounter} tabularNums`}>
              {name.length} / 50
            </span>
          </div>
          <input
            id="testimonial-name"
            type="text"
            required
            maxLength={50}
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 50))}
            placeholder={isAr ? 'مثال: محمد ع.' : 'e.g. Sarah K.'}
            className={styles.textInput}
          />
        </div>

        {/* 2. Interactive Star Rating (1-5) */}
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>
            {isAr ? 'التقييم *' : 'Rating *'}
          </span>
          <div
            className={styles.starsInputRow}
            role="radiogroup"
            aria-label={isAr ? 'التقييم بالنجوم' : 'Star rating'}
          >
            {[1, 2, 3, 4, 5].map((starValue) => {
              const active = starValue <= displayStarCount;
              return (
                <button
                  key={starValue}
                  type="button"
                  role="radio"
                  aria-checked={rating === starValue}
                  aria-label={`${starValue} / 5`}
                  onClick={() => setRating(starValue)}
                  onMouseEnter={() => setHoverRating(starValue)}
                  onMouseLeave={() => setHoverRating(0)}
                  className={`${styles.starBtn} ${
                    active ? styles.starBtnActive : ''
                  }`}
                >
                  ★
                </button>
              );
            })}
            <span className={`${styles.ratingHint} tabularNums`}>
              ({rating} / 5)
            </span>
          </div>
        </div>

        {/* 3. Testimonial Text (Required, max 300 chars with live counter) */}
        <div className={styles.fieldGroup}>
          <div className={styles.labelRow}>
            <label htmlFor="testimonial-text" className={styles.fieldLabel}>
              {isAr ? 'نص الشهادة *' : 'Your Review *'}
            </label>
            <span className={`${styles.charCounter} tabularNums`}>
              {text.length} / 300
            </span>
          </div>
          <textarea
            id="testimonial-text"
            required
            maxLength={300}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 300))}
            placeholder={
              isAr
                ? 'شاركنا رأيك في سهولة البحث ومقارنة الأسعار عبر AQURIVO...'
                : 'Tell visitors how AQURIVO helped you find or compare products...'
            }
            className={styles.textArea}
          />
        </div>

        {errorMsg && <p className={styles.errorBanner}>{errorMsg}</p>}

        <button
          type="submit"
          disabled={submitting}
          className={styles.submitBtn}
        >
          <Send size={15} aria-hidden="true" />
          <span>
            {submitting
              ? isAr
                ? 'جاري الإرسال...'
                : 'Submitting...'
              : isAr
                ? 'إرسال الشهادة'
                : 'Submit Review'}
          </span>
        </button>
      </form>
    </div>
  );
}
