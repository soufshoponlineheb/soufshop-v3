import 'server-only';
import type {
  LocalizedText,
  PriceDisplayPolicy,
  ProductImage,
  ProductStatus,
  PromoBadgeType,
} from '@/types';
import { generateSlug } from '@/lib/seoSlug';

export class ValidationError extends Error {
  public readonly field?: string;
  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CURRENCY_REGEX = /^[A-Z]{2,4}$/;

export function sanitizePlainText(input: unknown, maxLength: number): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitizes editorial HTML for buying guides, stripping scripts, event handlers,
 * iframes, objects, and dangerous protocols while preserving clean semantic tags.
 */
export function sanitizeEditorialHtml(rawHtml: unknown, maxLength = 50000): string {
  if (typeof rawHtml !== 'string') return '';
  return rawHtml
    .slice(0, maxLength)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:text\/html/gi, '')
    .trim();
}

export function validateSlug(input: unknown, fieldName = 'slug'): string {
  const raw = typeof input === 'string' ? input.trim().toLowerCase() : '';
  const normalized = raw
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\u0600-\u06FF-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);

  if (normalized.length >= 1) {
    return normalized;
  }

  return `${fieldName}-${Date.now().toString(36)}`;
}

export function validateImageSource(input: unknown, fieldName = 'imageUrl'): string {
  if (typeof input !== 'string') {
    throw new ValidationError('يرجى توفير رابط صورة صحيح.', fieldName);
  }
  const trimmed = input.trim();
  if (trimmed.startsWith('data:image/')) {
    if (trimmed.length > 1500000) {
      throw new ValidationError('حجم الصورة المدمجة كبير جداً.', fieldName);
    }
    return trimmed;
  }
  return validateHttpsUrl(trimmed, fieldName);
}

export function validateHttpsUrl(input: unknown, fieldName = 'url'): string {
  if (typeof input !== 'string' || input.trim().length < 4 || input.trim().length > 1024) {
    throw new ValidationError(
      'يرجى إدخال رابط صحيح يبدأ بـ https:// (Please provide a valid HTTPS link).',
      fieldName
    );
  }
  const raw = input.trim();
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new ValidationError('يرجى إدخال رابط يبدأ بـ https://', fieldName);
    }
    return parsed.toString();
  } catch {
    throw new ValidationError('يرجى إدخال رابط ويب صحيح يبدأ بـ https://', fieldName);
  }
}

export function validateLocalizedText(
  input: unknown,
  fieldName: string,
  minLength = 0,
  maxLength = 500
): LocalizedText {
  if (!input || typeof input !== 'object') {
    if (minLength <= 0) {
      return { en: '', ar: '' };
    }
    throw new ValidationError(
      `يرجى إدخال حقل (${fieldName}) بالعربية أو الإنجليزية.`,
      fieldName
    );
  }
  const obj = input as Record<string, unknown>;
  const rawEn = sanitizePlainText(obj.en, maxLength);
  const rawAr = sanitizePlainText(obj.ar, maxLength);

  // Auto-copy from whichever language was provided so the admin only needs to type once
  const en = rawEn || rawAr;
  const ar = rawAr || rawEn;

  if (minLength > 0 && en.length === 0 && ar.length === 0) {
    throw new ValidationError(
      `يرجى تعبئة حقل (${fieldName}) بالعربية أو الإنجليزية.`,
      fieldName
    );
  }

  return { en, ar };
}

export interface ValidatedContactPayload {
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
}

export function validateContactInput(body: unknown): ValidatedContactPayload {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Invalid form submission.');
  }
  const data = body as Record<string, unknown>;
  const senderName = sanitizePlainText(data.senderName, 100);
  const senderEmail = sanitizePlainText(data.senderEmail, 160).toLowerCase();
  const subject = sanitizePlainText(data.subject, 160);
  const message = sanitizePlainText(data.message, 3000);

  if (senderName.length < 2) {
    throw new ValidationError('Please enter your name.', 'senderName');
  }
  if (!EMAIL_REGEX.test(senderEmail)) {
    throw new ValidationError('Please enter a valid email address.', 'senderEmail');
  }
  if (subject.length < 2) {
    throw new ValidationError('Please enter a brief subject.', 'subject');
  }
  if (message.length < 10) {
    throw new ValidationError('Please write a message of at least 10 characters.', 'message');
  }

  return { senderName, senderEmail, subject, message };
}

export interface ValidatedProductPayload {
  slug: string;
  title: LocalizedText;
  shortSummary: LocalizedText;
  whyWePickedIt: LocalizedText;
  whatToConsider: LocalizedText;
  description: LocalizedText;
  priceAmount: number | null;
  oldPrice: number | null;
  discount: number | null;
  discountPercent?: number | null;
  stars: number | null;
  soldCount: number | null;
  badge: PromoBadgeType;
  priceCurrency: string;
  priceNote?: LocalizedText;
  priceDisplayPolicy: PriceDisplayPolicy;
  affiliateUrl: string;
  sourceId: string;
  categoryId: string;
  images: ProductImage[];
  videoUrl?: string;
  tags: string[];
  isFeatured: boolean;
  status: ProductStatus;
}

export function validateProductInput(body: unknown): ValidatedProductPayload {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Invalid product data.');
  }
  const data = body as Record<string, unknown>;

  const title = validateLocalizedText(data.title, 'اسم المنتج / Title', 1, 180);
  const rawSourceForSlug = sanitizePlainText(data.sourceId, 64) || 'amazon';
  const rawCustomSlug = typeof data.slug === 'string' ? data.slug.trim() : '';
  const slug = rawCustomSlug
    ? generateSlug(rawCustomSlug, rawSourceForSlug)
    : generateSlug(title.en || title.ar, rawSourceForSlug);
  const rawSummary = validateLocalizedText(data.shortSummary, 'الملخص القصير', 0, 320);
  const shortSummary = {
    en: rawSummary.en || title.en,
    ar: rawSummary.ar || title.ar,
  };
  const whyWePickedIt = validateLocalizedText(data.whyWePickedIt, 'لماذا اخترناه', 0, 1200);
  const whatToConsider = validateLocalizedText(data.whatToConsider, 'ما يجب الانتباه له', 0, 1200);
  const rawDescription = validateLocalizedText(data.description, 'الوصف التفصيلي', 0, 5000);
  const description = {
    en: rawDescription.en || shortSummary.en,
    ar: rawDescription.ar || shortSummary.ar,
  };

  const priceDisplayPolicy: PriceDisplayPolicy =
    data.priceDisplayPolicy === 'hide_price_check_store'
      ? 'hide_price_check_store'
      : 'show_with_timestamp';

  let priceAmount: number | null = null;
  if (data.priceAmount !== null && data.priceAmount !== undefined && data.priceAmount !== '') {
    const num = Number(data.priceAmount);
    if (Number.isNaN(num) || num < 0 || num > 1000000) {
      throw new ValidationError('Please provide a valid positive price amount.', 'priceAmount');
    }
    priceAmount = Math.round(num * 100) / 100;
  }

  let oldPrice: number | null = null;
  if (data.oldPrice !== null && data.oldPrice !== undefined && data.oldPrice !== '') {
    const num = Number(data.oldPrice);
    if (!Number.isNaN(num) && num > 0 && num <= 1000000) {
      oldPrice = Math.round(num * 100) / 100;
    }
  }

  let discount: number | null = null;
  const rawDiscountInput =
    data.discountPercent !== null &&
    data.discountPercent !== undefined &&
    data.discountPercent !== ''
      ? data.discountPercent
      : data.discount;
  if (rawDiscountInput !== null && rawDiscountInput !== undefined && rawDiscountInput !== '') {
    const num = Number(rawDiscountInput);
    if (!Number.isNaN(num) && num > 0 && num <= 99) {
      discount = Math.round(num);
    }
  } else if (oldPrice && priceAmount && oldPrice > priceAmount) {
    discount = Math.round(((oldPrice - priceAmount) / oldPrice) * 100);
  }

  let stars: number | null = null;
  if (data.stars !== null && data.stars !== undefined && data.stars !== '') {
    const num = Number(data.stars);
    if (!Number.isNaN(num) && num >= 1 && num <= 5) {
      stars = Math.round(num * 10) / 10;
    }
  }

  let soldCount: number | null = null;
  if (data.soldCount !== null && data.soldCount !== undefined && data.soldCount !== '') {
    const num = Number(data.soldCount);
    if (!Number.isNaN(num) && num >= 0 && num <= 10000000) {
      soldCount = Math.round(num);
    }
  }

  const badge: PromoBadgeType =
    data.badge === 'توفير' || data.badge === 'اليوم الأخير' ? data.badge : null;

  const rawCurrency = typeof data.priceCurrency === 'string' ? data.priceCurrency.trim().toUpperCase() : 'DH';
  const priceCurrency = CURRENCY_REGEX.test(rawCurrency) ? rawCurrency : 'DH';

  const affiliateUrl = validateHttpsUrl(data.affiliateUrl, 'affiliateUrl');
  const sourceId = sanitizePlainText(data.sourceId, 128);
  const categoryId = sanitizePlainText(data.categoryId, 128);

  if (!sourceId) {
    throw new ValidationError('Please select a partner store source.', 'sourceId');
  }
  if (!categoryId) {
    throw new ValidationError('Please select a category.', 'categoryId');
  }

  const rawImages = Array.isArray(data.images) ? data.images.slice(0, 8) : [];
  const images: ProductImage[] = rawImages
    .map((img): ProductImage | null => {
      if (!img || typeof img !== 'object') return null;
      const item = img as Record<string, unknown>;
      const url = validateImageSource(item.url, 'imageUrl');
      const altObj = (item.alt as Record<string, unknown>) || {};
      return {
        url,
        publicId: sanitizePlainText(item.publicId, 180) || undefined,
        alt: {
          en: sanitizePlainText(altObj.en, 180) || title.en,
          ar: sanitizePlainText(altObj.ar, 180) || title.ar,
        },
        width: Number(item.width) > 0 ? Number(item.width) : 800,
        height: Number(item.height) > 0 ? Number(item.height) : 600,
      };
    })
    .filter((item): item is ProductImage => item !== null);

  const rawTags = Array.isArray(data.tags) ? data.tags.slice(0, 10) : [];
  const tags = rawTags
    .map((tag) => sanitizePlainText(tag, 40))
    .filter(Boolean);

  const status: ProductStatus =
    data.status === 'published' || data.status === 'archived' ? data.status : 'draft';

  let priceNote: LocalizedText | undefined;
  if (data.priceNote && typeof data.priceNote === 'object') {
    const noteObj = data.priceNote as Record<string, unknown>;
    const noteEn = sanitizePlainText(noteObj.en, 200);
    const noteAr = sanitizePlainText(noteObj.ar, 200);
    if (noteEn || noteAr) {
      priceNote = { en: noteEn, ar: noteAr };
    }
  }

  let videoUrl: string | undefined;
  if (typeof data.videoUrl === 'string' && data.videoUrl.trim().length > 0) {
    videoUrl = validateHttpsUrl(data.videoUrl.trim(), 'videoUrl');
  }

  return {
    slug,
    title,
    shortSummary,
    whyWePickedIt,
    whatToConsider,
    description,
    priceAmount,
    oldPrice,
    discount,
    discountPercent: discount,
    stars,
    soldCount,
    badge,
    priceCurrency,
    priceNote,
    priceDisplayPolicy,
    affiliateUrl,
    sourceId,
    categoryId,
    images,
    videoUrl,
    tags,
    isFeatured: Boolean(data.isFeatured),
    status,
  };
}

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB max

export function validateUploadMetadata(body: unknown): {
  mimeType: string;
  fileSizeBytes: number;
  folder: string;
} {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Invalid upload request.');
  }
  const data = body as Record<string, unknown>;
  const mimeType = typeof data.mimeType === 'string' ? data.mimeType.trim().toLowerCase() : '';
  const fileSizeBytes = Number(data.fileSizeBytes);

  if (!ALLOWED_IMAGE_MIMES.has(mimeType)) {
    throw new ValidationError(
      'Only JPEG, PNG, WebP, and AVIF images are permitted.',
      'mimeType'
    );
  }

  if (Number.isNaN(fileSizeBytes) || fileSizeBytes <= 0 || fileSizeBytes > MAX_UPLOAD_BYTES) {
    throw new ValidationError('Image file size must not exceed 5 MB.', 'fileSizeBytes');
  }

  return {
    mimeType,
    fileSizeBytes,
    folder: 'soufshop/products',
  };
}
