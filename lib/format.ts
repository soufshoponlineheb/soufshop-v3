import type { Locale } from '@/types';

const INTL_LOCALE_MAP: Record<Locale, string> = {
  en: 'en-US',
  ar: 'ar-MA',
};

/**
 * Formats currency using the product's own currency code via standard Intl.NumberFormat.
 */
export function formatProductPrice(
  amount: number | null | undefined,
  currencyCode: string,
  locale: Locale
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return '';
  }

  const normalizedCurrency = (currencyCode || 'DH').toUpperCase().trim();
  const intlLocale = INTL_LOCALE_MAP[locale] || 'en-US';

  if (normalizedCurrency === 'DH' || normalizedCurrency === 'MAD') {
    const formattedNum = new Intl.NumberFormat(intlLocale, {
      maximumFractionDigits: 2,
    }).format(amount);
    return `${formattedNum} DH`;
  }

  try {
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency: normalizedCurrency,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    const formattedNum = new Intl.NumberFormat(intlLocale, {
      maximumFractionDigits: 2,
    }).format(amount);
    return `${formattedNum} ${normalizedCurrency}`;
  }
}

/**
 * Formats numbers using standard Intl.NumberFormat.
 */
export function formatNumber(value: number, locale: Locale): string {
  const intlLocale = INTL_LOCALE_MAP[locale] || 'en-US';
  return new Intl.NumberFormat(intlLocale).format(value);
}

/**
 * Formats ISO dates using standard Intl.DateTimeFormat so visitors see clear price check dates.
 */
export function formatCalendarDate(isoDate: string | undefined, locale: Locale): string {
  if (!isoDate) return '';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return '';

  const intlLocale = INTL_LOCALE_MAP[locale] || 'en-US';
  return new Intl.DateTimeFormat(intlLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsed);
}
