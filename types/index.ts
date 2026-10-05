export type Locale = 'en' | 'ar';

export type Direction = 'ltr' | 'rtl';

export type ThemeMode = 'light' | 'dark' | 'system';

export type PriceDisplayPolicy = 'show_with_timestamp' | 'hide_price_check_store';

export type ProductStatus = 'published' | 'draft' | 'archived';

export type PromoBadgeType = 'توفير' | 'اليوم الأخير' | null;

export interface LocalizedText {
  en: string;
  ar: string;
}

export interface PartnerSource {
  id: string;
  slug: string;
  name: LocalizedText;
  websiteUrl: string;
  disclosureText: LocalizedText;
  defaultPricePolicy: PriceDisplayPolicy;
  accentColor: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  slug: string;
  name: LocalizedText;
  description?: LocalizedText;
  icon?: string;
  order?: number;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductImage {
  url: string;
  publicId?: string;
  alt: LocalizedText;
  width: number;
  height: number;
}

export interface Product {
  id: string;
  slug: string;
  title: LocalizedText;
  name?: LocalizedText;
  shortSummary: LocalizedText;
  whyWePickedIt: LocalizedText;
  whyWeChoseIt?: LocalizedText;
  whatToConsider: LocalizedText;
  thingsToNotice?: LocalizedText;
  description: LocalizedText;
  detailedDescription?: LocalizedText;
  priceAmount: number | null;
  oldPrice?: number | null;
  discount?: number | null;
  discountPercent?: number | null;
  stars?: number | null;
  soldCount?: number | null;
  salesCount?: number | null;
  inStock?: boolean;
  rating?: number | null;
  reviewCount?: number | null;
  reviewsAreOwn?: boolean;
  badge?: PromoBadgeType;
  priceCurrency: string;
  priceNote?: LocalizedText;
  priceDisplayPolicy: PriceDisplayPolicy;
  priceUpdatedAt: string;
  images: ProductImage[];
  videoUrl?: string;
  affiliateUrl: string;
  sourceId: string;
  sourceSlug: string;
  sourceName: LocalizedText;
  sourceDisclosure: LocalizedText;
  categoryId: string;
  categorySlug: string;
  categoryName: LocalizedText;
  tags: string[];
  isFeatured: boolean;
  status: ProductStatus;
  clicksCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleFaqItem {
  question: LocalizedText;
  answer: LocalizedText;
}

export interface Article {
  id: string;
  slug: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  contentHtml: LocalizedText;
  coverImage?: string;
  topPickProductId?: string;
  authorName?: string;
  seoTitle?: LocalizedText;
  seoDescription?: LocalizedText;
  seoKeywords?: string[];
  editorVerdict?: LocalizedText;
  faqItems?: ArticleFaqItem[];
  categoryId: string;
  categorySlug: string;
  categoryName: LocalizedText;
  relatedProductIds: string[];
  readingTimeMinutes: number;
  status: 'published' | 'draft';
  publishedAt: string;
  updatedAt: string;
}

export interface ContactMessage {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface SiteSettings {
  siteName: LocalizedText;
  topBarAnnouncement: LocalizedText;
  topBarEnabled: boolean;
  contactEmail: string;
  contactPhoneDisplay: string;
  contactPhoneE164: string;
  whatsappUrl: string;
  updatedAt: string;
}
