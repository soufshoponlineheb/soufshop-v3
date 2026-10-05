/**
 * Parser for Smart Magic Paste in SoufShop Admin.
 * Handles JSON structures, Markdown tags, and Plain Tagged key-value blocks in Arabic & English.
 */

export interface ParsedProductDraft {
  slug?: string;
  titleEn?: string;
  titleAr?: string;
  summaryEn?: string;
  summaryAr?: string;
  whyEn?: string;
  whyAr?: string;
  considerEn?: string;
  considerAr?: string;
  descEn?: string;
  descAr?: string;
  priceAmount?: string;
  oldPrice?: string;
  discount?: string;
  stars?: string;
  soldCount?: string;
  badge?: string;
  priceCurrency?: string;
  categoryId?: string;
  sourceId?: string;
  affiliateUrl?: string;
  videoUrl?: string;
  images?: string[];
  tags?: string;
}

export const MAGIC_AI_PROMPT_TEMPLATE = `أنت خبير SEO وصانع محتوى تجاري متخصص لمتجر SoufShop.

عندما أعطيك اسم منتج أو رابطه أو مواصفاته، ابحث عنه وحلله بعمق، ثم أعطني النتيجة كاملة داخل حاوية كود واحدة قابلة للنسخ (Code Block) بدون كتابة الأقواس الدائرية التوضيحية، باستخدام هذا التنسيق والعناوين المحددة بدقة:

\`\`\`text
[العنوان بالعربية]: اسم جذاب وشامل للمنتج بحد أقصى 60 حرف
[العنوان بالإنجليزية]: Attractive and concise product title max 60 chars
[الرابط slug]: معرف رابط بالإنجليزية بحروف صغيرة وشرطات مثل wireless-headphones
[الملخص بالعربية]: جملة واحدة مقنعة تبرز القيمة الأساسية لـ Meta Description بحد أقصى 155 حرف
[الملخص بالإنجليزية]: One compelling sentence for Meta Description max 155 chars
[لماذا اخترناه بالعربية]: 2 إلى 3 جمل تشرح المميزات الحقيقية ونقاط القوة وجودة المنتج
[لماذا اخترناه بالإنجليزية]: 2-3 sentences highlighting genuine benefits and value
[نقاط الانتباه بالعربية]: ملاحظة واحدة صادقة وشفافة للمشتري قبل الطلب
[نقاط الانتباه بالإنجليزية]: One honest note or consideration for the buyer
[الوصف التفصيلي بالعربية]: فقرة تحريرية عميقة من 100 إلى 150 كلمة تشرح المواصفات وتدمج كلمات البحث بشكل طبيعي
[الوصف التفصيلي بالإنجليزية]: Comprehensive editorial review of 100-150 words with natural high-ranking SEO keywords
[الفئة]: electronics أو home أو health أو sports أو fashion
[السعر]: 45
[السعر القديم]: 75
[الخصم]: 40
[التقييم]: 4.8
[المبيعات]: 1200
[الوسوم]: 10 كلمات مفتاحية و Long-Tail مستهدفة مفصولة بفواصل
\`\`\`

قواعد كتابة صارمة:
1. الالتزام التام بأسماء الأقواس المربعة [ ] كما هي دون تغيير ليتعرف عليها النظام البرمجي.
2. لا تكتب الأقواس الدائرية التوضيحية ( ) في المخرج النهائي، بل اكتب المحتوى الفعلي مباشرة.
3. ضع المخرج كاملاً داخل مربع كود واحد (\`\`\`text ... \`\`\`) لتسهيل النسخ بنقرة واحدة.
4. عدم ذكر أسماء أي متاجر أو مزودين خارجيين أبداً.

المنتج المطلوب مراجعته هو:
[ضع هنا اسم المنتج أو رابطه أو مواصفاته]`;

function cleanExtractedText(raw: string): string {
  let cleaned = raw.trim();
  // Remove accidental surrounding parentheses ( ... ) if the AI left them
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  // Remove accidental surrounding quotes " ... "
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith('\'') && cleaned.endsWith('\''))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

function extractFirstMatch(text: string, regexList: RegExp[]): string | undefined {
  for (const rx of regexList) {
    const m = text.match(rx);
    if (m && m[1] && m[1].trim()) {
      return cleanExtractedText(m[1]);
    }
  }
  return undefined;
}

export function parseMagicProductContent(rawInput: string): {
  draft: ParsedProductDraft;
  fieldsFoundCount: number;
} {
  let text = rawInput.trim();
  if (!text) {
    return { draft: {}, fieldsFoundCount: 0 };
  }

  // Strip markdown code block wrapper if present
  if (text.startsWith('```')) {
    text = text.replace(/^```[a-zA-Z0-9_-]*\n?/, '').replace(/\n?```$/, '').trim();
  }

  const draft: ParsedProductDraft = {};

  // 1. Try parsing JSON format
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const obj = JSON.parse(text) as Record<string, any>;

      // Titles
      if (typeof obj.title === 'object' && obj.title !== null) {
        if (obj.title.en) draft.titleEn = cleanExtractedText(String(obj.title.en));
        if (obj.title.ar) draft.titleAr = cleanExtractedText(String(obj.title.ar));
      } else if (typeof obj.title === 'string') {
        draft.titleEn = cleanExtractedText(obj.title);
      }
      if (obj.titleEn) draft.titleEn = cleanExtractedText(String(obj.titleEn));
      if (obj.titleAr) draft.titleAr = cleanExtractedText(String(obj.titleAr));
      if (obj.name && typeof obj.name === 'object') {
        if (obj.name.en && !draft.titleEn) draft.titleEn = cleanExtractedText(String(obj.name.en));
        if (obj.name.ar && !draft.titleAr) draft.titleAr = cleanExtractedText(String(obj.name.ar));
      }

      // Slug
      if (obj.slug) draft.slug = cleanExtractedText(String(obj.slug));

      // Short Summary
      if (typeof obj.shortSummary === 'object' && obj.shortSummary !== null) {
        if (obj.shortSummary.en) draft.summaryEn = cleanExtractedText(String(obj.shortSummary.en));
        if (obj.shortSummary.ar) draft.summaryAr = cleanExtractedText(String(obj.shortSummary.ar));
      } else if (typeof obj.shortSummary === 'string') {
        draft.summaryEn = cleanExtractedText(obj.shortSummary);
      }
      if (obj.summaryEn) draft.summaryEn = cleanExtractedText(String(obj.summaryEn));
      if (obj.summaryAr) draft.summaryAr = cleanExtractedText(String(obj.summaryAr));

      // Why we picked it
      const whyObj = obj.whyWePickedIt || obj.whyWeChoseIt || obj.why;
      if (typeof whyObj === 'object' && whyObj !== null) {
        if (whyObj.en) draft.whyEn = cleanExtractedText(String(whyObj.en));
        if (whyObj.ar) draft.whyAr = cleanExtractedText(String(whyObj.ar));
      } else if (typeof whyObj === 'string') {
        draft.whyAr = cleanExtractedText(whyObj);
      }
      if (obj.whyEn) draft.whyEn = cleanExtractedText(String(obj.whyEn));
      if (obj.whyAr) draft.whyAr = cleanExtractedText(String(obj.whyAr));

      // What to consider
      const considerObj = obj.whatToConsider || obj.thingsToNotice || obj.consider;
      if (typeof considerObj === 'object' && considerObj !== null) {
        if (considerObj.en) draft.considerEn = cleanExtractedText(String(considerObj.en));
        if (considerObj.ar) draft.considerAr = cleanExtractedText(String(considerObj.ar));
      } else if (typeof considerObj === 'string') {
        draft.considerAr = cleanExtractedText(considerObj);
      }
      if (obj.considerEn) draft.considerEn = cleanExtractedText(String(obj.considerEn));
      if (obj.considerAr) draft.considerAr = cleanExtractedText(String(obj.considerAr));

      // Detailed Description
      const descObj = obj.description || obj.detailedDescription;
      if (typeof descObj === 'object' && descObj !== null) {
        if (descObj.en) draft.descEn = cleanExtractedText(String(descObj.en));
        if (descObj.ar) draft.descAr = cleanExtractedText(String(descObj.ar));
      } else if (typeof descObj === 'string') {
        draft.descAr = cleanExtractedText(descObj);
      }
      if (obj.descEn) draft.descEn = cleanExtractedText(String(obj.descEn));
      if (obj.descAr) draft.descAr = cleanExtractedText(String(obj.descAr));

      // Pricing & Stats
      if (obj.priceAmount !== undefined && obj.priceAmount !== null) draft.priceAmount = String(obj.priceAmount);
      else if (obj.price !== undefined && obj.price !== null) draft.priceAmount = String(obj.price);

      if (obj.oldPrice !== undefined && obj.oldPrice !== null) draft.oldPrice = String(obj.oldPrice);
      if (obj.discount !== undefined && obj.discount !== null) draft.discount = String(obj.discount);
      if (obj.stars !== undefined && obj.stars !== null) draft.stars = String(obj.stars);
      else if (obj.rating !== undefined && obj.rating !== null) draft.stars = String(obj.rating);

      if (obj.soldCount !== undefined && obj.soldCount !== null) draft.soldCount = String(obj.soldCount);
      else if (obj.salesCount !== undefined && obj.salesCount !== null) draft.soldCount = String(obj.salesCount);

      if (obj.badge) draft.badge = cleanExtractedText(String(obj.badge));
      if (obj.priceCurrency) draft.priceCurrency = cleanExtractedText(String(obj.priceCurrency));
      if (obj.categoryId) draft.categoryId = cleanExtractedText(String(obj.categoryId));
      else if (obj.categorySlug) draft.categoryId = cleanExtractedText(String(obj.categorySlug));

      if (obj.sourceId) draft.sourceId = cleanExtractedText(String(obj.sourceId));
      if (obj.affiliateUrl) draft.affiliateUrl = cleanExtractedText(String(obj.affiliateUrl));
      if (obj.videoUrl) draft.videoUrl = cleanExtractedText(String(obj.videoUrl));

      if (Array.isArray(obj.images)) {
        draft.images = obj.images.map((img: any) => (typeof img === 'string' ? img : img.url)).filter(Boolean);
      } else if (Array.isArray(obj.imageUrls)) {
        draft.images = obj.imageUrls.filter(Boolean);
      }

      if (Array.isArray(obj.tags)) {
        draft.tags = obj.tags.join(', ');
      } else if (typeof obj.tags === 'string') {
        draft.tags = obj.tags;
      }

      const count = Object.values(draft).filter((v) => v !== undefined && v !== '' && (!Array.isArray(v) || v.length > 0)).length;
      return { draft, fieldsFoundCount: count };
    } catch {
      // Fall through to regex-based tag parsing
    }
  }

  // 2. Multi-line tag / key-value regex parsing
  draft.titleAr = extractFirstMatch(text, [
    /\[(?:العنوان\s*بالعربية|العنوان\s*العربي|Arabic\s*Title|الاسم\s*بالعربية|اسم\s*المنتج\s*بالعربية)\]\s*:\s*([^\n\[]+)/i,
    /(?:العنوان\s*بالعربية|العنوان\s*العربي|الاسم\s*بالعربية|اسم\s*المنتج\s*بالعربية)\s*:\s*([^\n\[]+)/i,
  ]);

  draft.titleEn = extractFirstMatch(text, [
    /\[(?:العنوان\s*بالإنجليزية|العنوان\s*الإنجليزي|English\s*Title|الاسم\s*بالإنجليزية|اسم\s*المنتج\s*بالإنجليزية)\]\s*:\s*([^\n\[]+)/i,
    /(?:العنوان\s*بالإنجليزية|العنوان\s*الإنجليزي|الاسم\s*بالإنجليزية|اسم\s*المنتج\s*بالإنجليزية)\s*:\s*([^\n\[]+)/i,
  ]);

  draft.slug = extractFirstMatch(text, [
    /\[(?:الرابط\s*slug|slug|الرابط|المعرف)\]\s*:\s*([^\n\[]+)/i,
    /(?:slug|الرابط\s*المختصر)\s*:\s*([^\n\[]+)/i,
  ]);

  draft.summaryAr = extractFirstMatch(text, [
    /\[(?:الملخص\s*بالعربية|الملخص\s*العربي|Short\s*Summary\s*AR|ملخص\s*عربي|الملخص)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|\n\s*[\u0600-\u06FFA-Za-z]+(?:\s*[\u0600-\u06FFA-Za-z]+)*\s*:|$)/i,
    /(?:الملخص\s*بالعربية|الملخص\s*العربي|ملخص\s*عربي)\s*:\s*([\s\S]*?)(?=\n\s*\[|\n\s*[\u0600-\u06FFA-Za-z]+(?:\s*[\u0600-\u06FFA-Za-z]+)*\s*:|$)/i,
  ]);

  draft.summaryEn = extractFirstMatch(text, [
    /\[(?:الملخص\s*بالإنجليزية|الملخص\s*الإنجليزي|Short\s*Summary\s*EN|ملخص\s*إنجليزي|ملخص\s*انجليزي)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|\n\s*[\u0600-\u06FFA-Za-z]+(?:\s*[\u0600-\u06FFA-Za-z]+)*\s*:|$)/i,
    /(?:الملخص\s*بالإنجليزية|الملخص\s*الإنجليزي|Short\s*Summary\s*EN)\s*:\s*([\s\S]*?)(?=\n\s*\[|\n\s*[\u0600-\u06FFA-Za-z]+(?:\s*[\u0600-\u06FFA-Za-z]+)*\s*:|$)/i,
  ]);

  draft.whyAr = extractFirstMatch(text, [
    /\[(?:لماذا\s*اخترناه\s*بالعربية|لماذا\s*اخترنا\s*هذا\s*المنتج\s*بالعربية|لماذا\s*اخترناه|Why\s*We\s*Picked\s*It\s*AR|Why\s*We\s*Chose\s*It\s*AR)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|\n\s*[\u0600-\u06FFA-Za-z]+(?:\s*[\u0600-\u06FFA-Za-z]+)*\s*:|$)/i,
    /(?:لماذا\s*اخترناه\s*بالعربية|لماذا\s*اخترناه|لماذا\s*اخترنا\s*هذا\s*المنتج)\s*:\s*([\s\S]*?)(?=\n\s*\[|\n\s*[\u0600-\u06FFA-Za-z]+(?:\s*[\u0600-\u06FFA-Za-z]+)*\s*:|$)/i,
  ]);

  draft.whyEn = extractFirstMatch(text, [
    /\[(?:لماذا\s*اخترناه\s*بالإنجليزية|لماذا\s*اخترنا\s*هذا\s*المنتج\s*بالإنجليزية|Why\s*We\s*Picked\s*It\s*EN|Why\s*We\s*Chose\s*It\s*EN)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|\n\s*[\u0600-\u06FFA-Za-z]+(?:\s*[\u0600-\u06FFA-Za-z]+)*\s*:|$)/i,
    /(?:لماذا\s*اخترناه\s*بالإنجليزية|Why\s*We\s*Picked\s*It|Why\s*We\s*Chose\s*It)\s*:\s*([\s\S]*?)(?=\n\s*\[|\n\s*[\u0600-\u06FFA-Za-z]+(?:\s*[\u0600-\u06FFA-Za-z]+)*\s*:|$)/i,
  ]);

  draft.considerAr = extractFirstMatch(text, [
    /\[(?:نقاط\s*الانتباه\s*بالعربية|ما\s*يجب\s*الانتباه\s*له\s*بالعربية|نقاط\s*الانتباه|ما\s*يجب\s*الانتباه\s*له|What\s*To\s*Consider\s*AR)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|\n\s*[\u0600-\u06FFA-Za-z]+(?:\s*[\u0600-\u06FFA-Za-z]+)*\s*:|$)/i,
    /(?:نقاط\s*الانتباه\s*بالعربية|ما\s*يجب\s*الانتباه\s*له\s*بالعربية|نقاط\s*الانتباه)\s*:\s*([\s\S]*?)(?=\n\s*\[|\n\s*[\u0600-\u06FFA-Za-z]+(?:\s*[\u0600-\u06FFA-Za-z]+)*\s*:|$)/i,
  ]);

  draft.considerEn = extractFirstMatch(text, [
    /\[(?:نقاط\s*الانتباه\s*بالإنجليزية|ما\s*يجب\s*الانتباه\s*له\s*بالإنجليزية|What\s*To\s*Consider\s*EN|What\s*to\s*consider)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|\n\s*[\u0600-\u06FFA-Za-z]+(?:\s*[\u0600-\u06FFA-Za-z]+)*\s*:|$)/i,
    /(?:نقاط\s*الانتباه\s*بالإنجليزية|What\s*To\s*Consider|Things\s*To\s*Notice)\s*:\s*([\s\S]*?)(?=\n\s*\[|\n\s*[\u0600-\u06FFA-Za-z]+(?:\s*[\u0600-\u06FFA-Za-z]+)*\s*:|$)/i,
  ]);

  draft.descAr = extractFirstMatch(text, [
    /\[(?:الوصف\s*التفصيلي\s*بالعربية|الوصف\s*بالعربية|الوصف\s*العربي|Detailed\s*Description\s*AR|Description\s*AR)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|\n\s*[\u0600-\u06FFA-Za-z]+(?:\s*[\u0600-\u06FFA-Za-z]+)*\s*:|$)/i,
    /(?:الوصف\s*التفصيلي\s*بالعربية|الوصف\s*بالعربية|الوصف\s*العربي)\s*:\s*([\s\S]*?)(?=\n\s*\[|\n\s*[\u0600-\u06FFA-Za-z]+(?:\s*[\u0600-\u06FFA-Za-z]+)*\s*:|$)/i,
  ]);

  draft.descEn = extractFirstMatch(text, [
    /\[(?:الوصف\s*التفصيلي\s*بالإنجليزية|الوصف\s*بالإنجليزية|الوصف\s*الإنجليزي|Detailed\s*Description\s*EN|Description\s*EN)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|\n\s*[\u0600-\u06FFA-Za-z]+(?:\s*[\u0600-\u06FFA-Za-z]+)*\s*:|$)/i,
    /(?:الوصف\s*التفصيلي\s*بالإنجليزية|الوصف\s*بالإنجليزية|Detailed\s*Description)\s*:\s*([\s\S]*?)(?=\n\s*\[|\n\s*[\u0600-\u06FFA-Za-z]+(?:\s*[\u0600-\u06FFA-Za-z]+)*\s*:|$)/i,
  ]);

  draft.priceAmount = extractFirstMatch(text, [
    /\[(?:السعر|السعر\s*الحالي|Price|Current\s*Price)\]\s*:\s*([\d\.]+)/i,
    /(?:السعر|Price)\s*:\s*([\d\.]+)/i,
  ]);

  draft.oldPrice = extractFirstMatch(text, [
    /\[(?:السعر\s*القديم|السعر\s*السابق|Old\s*Price|Original\s*Price)\]\s*:\s*([\d\.]+)/i,
    /(?:السعر\s*القديم|Old\s*Price)\s*:\s*([\d\.]+)/i,
  ]);

  draft.discount = extractFirstMatch(text, [
    /\[(?:الخصم|نسبة\s*الخصم|Discount)\]\s*:\s*([\d]+)/i,
    /(?:الخصم|نسبة\s*الخصم|Discount)\s*:\s*([\d]+)/i,
  ]);

  draft.stars = extractFirstMatch(text, [
    /\[(?:التقييم|النجوم|Stars|Rating)\]\s*:\s*([\d\.]+)/i,
    /(?:التقييم|النجوم|Rating)\s*:\s*([\d\.]+)/i,
  ]);

  draft.soldCount = extractFirstMatch(text, [
    /\[(?:المبيعات|عدد\s*المبيعات|Sold\s*Count|Sold)\]\s*:\s*([\d]+)/i,
    /(?:المبيعات|عدد\s*المبيعات|Sold)\s*:\s*([\d]+)/i,
  ]);

  draft.categoryId = extractFirstMatch(text, [
    /\[(?:الفئة|فئة\s*المنتج|Category|categorySlug)\]\s*:\s*([^\n\[]+)/i,
    /(?:الفئة|فئة\s*المنتج|Category)\s*:\s*([^\n\[]+)/i,
  ]);

  draft.affiliateUrl = extractFirstMatch(text, [
    /\[(?:رابط\s*المنتج|رابط\s*الافلييت|رابط\s*العمولة|Affiliate\s*URL|URL)\]\s*:\s*(https?:\/\/[^\s\n\[]+)/i,
    /(?:رابط\s*العمولة|Affiliate\s*URL)\s*:\s*(https?:\/\/[^\s\n\[]+)/i,
  ]);

  draft.videoUrl = extractFirstMatch(text, [
    /\[(?:رابط\s*الفيديو|فيديو|Video\s*URL|Video)\]\s*:\s*(https?:\/\/[^\s\n\[]+)/i,
    /(?:رابط\s*الفيديو|Video\s*URL)\s*:\s*(https?:\/\/[^\s\n\[]+)/i,
  ]);

  const rawTags = extractFirstMatch(text, [
    /\[(?:الوسوم|الكلمات\s*المفتاحية|Tags)\]\s*:\s*([^\n\[]+)/i,
    /(?:الوسوم|Tags)\s*:\s*([^\n\[]+)/i,
  ]);

  const rawLongTail = extractFirstMatch(text, [
    /\[(?:كلمات\s*Long\s*Tail|كلمات\s*البحث|Long\s*Tail\s*Keywords|Long\s*Tail)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|\n\s*[\u0600-\u06FFA-Za-z]+(?:\s*[\u0600-\u06FFA-Za-z]+)*\s*:|$)/i,
  ]);

  if (rawTags && rawLongTail) {
    draft.tags = `${rawTags}, ${rawLongTail.replace(/\n+/g, ', ')}`;
  } else if (rawTags) {
    draft.tags = rawTags;
  } else if (rawLongTail) {
    draft.tags = rawLongTail.replace(/\n+/g, ', ');
  }

  // Extract images if provided
  const rawImagesBlock = extractFirstMatch(text, [
    /\[(?:روابط\s*الصور|الصور|Images|Image\s*URLs)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|\n\s*[\u0600-\u06FFA-Za-z]+(?:\s*[\u0600-\u06FFA-Za-z]+)*\s*:|$)/i,
    /(?:روابط\s*الصور|الصور|Images)\s*:\s*([\s\S]*?)(?=\n\s*\[|\n\s*[\u0600-\u06FFA-Za-z]+(?:\s*[\u0600-\u06FFA-Za-z]+)*\s*:|$)/i,
  ]);

  if (rawImagesBlock) {
    const foundUrls = rawImagesBlock.match(/https?:\/\/[^\s"'<>\n]+/g);
    if (foundUrls && foundUrls.length > 0) {
      draft.images = foundUrls;
    }
  }

  const count = Object.values(draft).filter((v) => v !== undefined && v !== '' && (!Array.isArray(v) || v.length > 0)).length;
  return { draft, fieldsFoundCount: count };
}

export interface ParsedArticleDraft {
  slug?: string;
  titleAr?: string;
  titleEn?: string;
  excerptAr?: string;
  excerptEn?: string;
  contentAr?: string;
  contentEn?: string;
  editorVerdictAr?: string;
  editorVerdictEn?: string;
  seoTitleAr?: string;
  seoTitleEn?: string;
  seoDescriptionAr?: string;
  seoDescriptionEn?: string;
  seoKeywords?: string;
  authorName?: string;
  readingTimeMinutes?: string;
  categoryId?: string;
  coverImage?: string;
  faqItems?: Array<{
    question: { ar: string; en: string };
    answer: { ar: string; en: string };
  }>;
}

export const MAGIC_ARTICLE_AI_PROMPT_TEMPLATE = `أنت محرر تقني وخبير SEO متخصص في كتابة دلائل الشراء والمقارنات لمتجر SoufShop.

عندما أعطيك موضوع دليل شراء أو قائمة منتجات للمقارنة، اكتب دليلاً تحريرياً شاملاً باللغتين العربية والإنجليزية داخل مربع كود واحد (\`\`\`text ... \`\`\`) باستخدام هذه العناوين بدقة:

\`\`\`text
[العنوان بالعربية]: عنوان جذاب لدليل الشراء يستهدف كلمات البحث الطويلة (Long-tail)
[العنوان بالإنجليزية]: Engaging long-tail buying guide title in English
[الرابط slug]: best-wireless-headphones-buying-guide-2026
[المقتطف بالعربية]: ملخص مشوق من سطرين يوضح فائدة الدليل للقارئ
[المقتطف بالإنجليزية]: Compelling 2-line summary explaining what the reader will learn
[عنوان SEO بالعربية]: عنوان مخصص لمحركات البحث بحد أقصى 60 حرفاً
[عنوان SEO بالإنجليزية]: SEO meta title max 60 chars
[وصف SEO بالعربية]: وصف تعريفي لمحركات البحث (Meta Description) بحد أقصى 155 حرفاً
[وصف SEO بالإنجليزية]: SEO meta description max 155 chars
[الكلمات المفتاحية]: أفضل سماعات، دليل شراء، مقارنة، best headphones, buying guide
[الكاتب]: SoufShop Editorial Team
[وقت القراءة]: 6
[الفئة]: electronics
[المحتوى بالعربية]: <h2>كيف تختار المنتج الأنسب؟</h2><p>شرح عميق ومفيد...</p><h2>أهم المعايير قبل الشراء</h2><ul><li>المعيار الأول</li><li>المعيار الثاني</li></ul>
[المحتوى بالإنجليزية]: <h2>How to Choose the Right Model</h2><p>In-depth analysis...</p><h2>Key Buying Factors</h2><ul><li>First factor</li><li>Second factor</li></ul>
[خلاصة المحرر بالعربية]: توصية ختامية واضحة توجه المشتري للخيار الأنسب لميزانيته واحتياجه
[خلاصة المحرر بالإنجليزية]: Final editorial recommendation guiding the shopper by budget and use case
[سؤال 1 بالعربية]: ما هي أهم ميزة يجب التركيز عليها عند الشراء؟
[إجابة 1 بالعربية]: إجابة واضحة ومباشرة تفيد المتسوق وتظهر في نتائج بحث Google.
[سؤال 1 بالإنجليزية]: What is the most important feature to look for?
[إجابة 1 بالإنجليزية]: Direct, helpful answer optimized for Google FAQ rich results.
[سؤال 2 بالعربية]: هل يستحق الطراز الأغلى فرق السعر؟
[إجابة 2 بالعربية]: توضيح الفروقات لمساعدة القارئ في اتخاذ قرار ذكي.
[سؤال 2 بالإنجليزية]: Is the premium model worth the extra cost?
[إجابة 2 بالإنجليزية]: Practical breakdown to help the buyer decide.
\`\`\`

الموضوع أو المنتجات المطلوب كتابة دليل شراء عنها:
[اكتب هنا موضوع المقال أو المنتجات]`;

export function parseMagicArticleContent(rawInput: string): {
  draft: ParsedArticleDraft;
  fieldsFoundCount: number;
} {
  let text = rawInput.trim();
  if (!text) {
    return { draft: {}, fieldsFoundCount: 0 };
  }

  if (text.startsWith('```')) {
    text = text.replace(/^```[a-zA-Z0-9_-]*\n?/, '').replace(/\n?```$/, '').trim();
  }

  const draft: ParsedArticleDraft = {};

  // 1. JSON format support
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const obj = JSON.parse(text) as Record<string, any>;
      if (obj.slug) draft.slug = cleanExtractedText(String(obj.slug));
      if (obj.title?.ar) draft.titleAr = cleanExtractedText(String(obj.title.ar));
      if (obj.title?.en) draft.titleEn = cleanExtractedText(String(obj.title.en));
      if (obj.titleAr) draft.titleAr = cleanExtractedText(String(obj.titleAr));
      if (obj.titleEn) draft.titleEn = cleanExtractedText(String(obj.titleEn));
      if (obj.excerpt?.ar) draft.excerptAr = cleanExtractedText(String(obj.excerpt.ar));
      if (obj.excerpt?.en) draft.excerptEn = cleanExtractedText(String(obj.excerpt.en));
      if (obj.contentHtml?.ar) draft.contentAr = String(obj.contentHtml.ar).trim();
      if (obj.contentHtml?.en) draft.contentEn = String(obj.contentHtml.en).trim();
      if (obj.editorVerdict?.ar) draft.editorVerdictAr = cleanExtractedText(String(obj.editorVerdict.ar));
      if (obj.editorVerdict?.en) draft.editorVerdictEn = cleanExtractedText(String(obj.editorVerdict.en));
      if (obj.seoTitle?.ar) draft.seoTitleAr = cleanExtractedText(String(obj.seoTitle.ar));
      if (obj.seoTitle?.en) draft.seoTitleEn = cleanExtractedText(String(obj.seoTitle.en));
      if (obj.seoDescription?.ar) draft.seoDescriptionAr = cleanExtractedText(String(obj.seoDescription.ar));
      if (obj.seoDescription?.en) draft.seoDescriptionEn = cleanExtractedText(String(obj.seoDescription.en));
      if (Array.isArray(obj.seoKeywords)) draft.seoKeywords = obj.seoKeywords.join(', ');
      else if (typeof obj.seoKeywords === 'string') draft.seoKeywords = obj.seoKeywords;
      if (obj.authorName) draft.authorName = cleanExtractedText(String(obj.authorName));
      if (obj.readingTimeMinutes) draft.readingTimeMinutes = String(obj.readingTimeMinutes);
      if (obj.categoryId) draft.categoryId = cleanExtractedText(String(obj.categoryId));
      if (obj.coverImage) draft.coverImage = cleanExtractedText(String(obj.coverImage));
      if (Array.isArray(obj.faqItems)) {
        draft.faqItems = obj.faqItems;
      }

      const count = Object.values(draft).filter(
        (v) => v !== undefined && v !== '' && (!Array.isArray(v) || v.length > 0)
      ).length;
      return { draft, fieldsFoundCount: count };
    } catch {
      // Fallback to tagged text
    }
  }

  // 2. Tagged key-value extraction
  draft.titleAr = extractFirstMatch(text, [
    /\[(?:العنوان\s*بالعربية|عنوان\s*المقال\s*بالعربية|Title\s*AR)\]\s*:\s*([^\n\[]+)/i,
  ]);
  draft.titleEn = extractFirstMatch(text, [
    /\[(?:العنوان\s*بالإنجليزية|عنوان\s*المقال\s*بالإنجليزية|Title\s*EN)\]\s*:\s*([^\n\[]+)/i,
  ]);
  draft.slug = extractFirstMatch(text, [
    /\[(?:الرابط\s*slug|slug|المعرف)\]\s*:\s*([^\n\[]+)/i,
  ]);
  draft.excerptAr = extractFirstMatch(text, [
    /\[(?:المقتطف\s*بالعربية|الملخص\s*بالعربية|Excerpt\s*AR)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|$)/i,
  ]);
  draft.excerptEn = extractFirstMatch(text, [
    /\[(?:المقتطف\s*بالإنجليزية|الملخص\s*بالإنجليزية|Excerpt\s*EN)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|$)/i,
  ]);
  draft.seoTitleAr = extractFirstMatch(text, [
    /\[(?:عنوان\s*SEO\s*بالعربية|SEO\s*Title\s*AR)\]\s*:\s*([^\n\[]+)/i,
  ]);
  draft.seoTitleEn = extractFirstMatch(text, [
    /\[(?:عنوان\s*SEO\s*بالإنجليزية|SEO\s*Title\s*EN)\]\s*:\s*([^\n\[]+)/i,
  ]);
  draft.seoDescriptionAr = extractFirstMatch(text, [
    /\[(?:وصف\s*SEO\s*بالعربية|SEO\s*Description\s*AR)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|$)/i,
  ]);
  draft.seoDescriptionEn = extractFirstMatch(text, [
    /\[(?:وصف\s*SEO\s*بالإنجليزية|SEO\s*Description\s*EN)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|$)/i,
  ]);
  draft.seoKeywords = extractFirstMatch(text, [
    /\[(?:الكلمات\s*المفتاحية|الوسوم|SEO\s*Keywords|Keywords)\]\s*:\s*([^\n\[]+)/i,
  ]);
  draft.authorName = extractFirstMatch(text, [
    /\[(?:الكاتب|اسم\s*الكاتب|Author)\]\s*:\s*([^\n\[]+)/i,
  ]);
  draft.readingTimeMinutes = extractFirstMatch(text, [
    /\[(?:وقت\s*القراءة|Reading\s*Time)\]\s*:\s*(\d+)/i,
  ]);
  draft.categoryId = extractFirstMatch(text, [
    /\[(?:الفئة|Category)\]\s*:\s*([^\n\[]+)/i,
  ]);
  draft.coverImage = extractFirstMatch(text, [
    /\[(?:صورة\s*الغلاف|Cover\s*Image)\]\s*:\s*([^\n\[]+)/i,
  ]);
  draft.contentAr = extractFirstMatch(text, [
    /\[(?:المحتوى\s*بالعربية|محتوى\s*الدليل\s*بالعربية|Content\s*AR)\]\s*:\s*([\s\S]*?)(?=\n\s*\[(?:المحتوى\s*بالإنجليزية|خلاصة|سؤال|إجابة|Content\s*EN|Editor|FAQ)|$)/i,
  ]);
  draft.contentEn = extractFirstMatch(text, [
    /\[(?:المحتوى\s*بالإنجليزية|محتوى\s*الدليل\s*بالإنجليزية|Content\s*EN)\]\s*:\s*([\s\S]*?)(?=\n\s*\[(?:المحتوى\s*بالعربية|خلاصة|سؤال|إجابة|Editor|FAQ)|$)/i,
  ]);
  draft.editorVerdictAr = extractFirstMatch(text, [
    /\[(?:خلاصة\s*المحرر\s*بالعربية|توصية\s*المحرر\s*بالعربية|Editor\s*Verdict\s*AR)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|$)/i,
  ]);
  draft.editorVerdictEn = extractFirstMatch(text, [
    /\[(?:خلاصة\s*المحرر\s*بالإنجليزية|توصية\s*المحرر\s*بالإنجليزية|Editor\s*Verdict\s*EN)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|$)/i,
  ]);

  const faqItems: Array<{
    question: { ar: string; en: string };
    answer: { ar: string; en: string };
  }> = [];

  for (let i = 1; i <= 5; i++) {
    const qAr = extractFirstMatch(text, [
      new RegExp(`\\[(?:سؤال\\s*${i}\\s*بالعربية|FAQ\\s*${i}\\s*Q\\s*AR)\\]\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*\\[|$)`, 'i'),
    ]);
    const aAr = extractFirstMatch(text, [
      new RegExp(`\\[(?:إجابة\\s*${i}\\s*بالعربية|اجابة\\s*${i}\\s*بالعربية|FAQ\\s*${i}\\s*A\\s*AR)\\]\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*\\[|$)`, 'i'),
    ]);
    const qEn = extractFirstMatch(text, [
      new RegExp(`\\[(?:سؤال\\s*${i}\\s*بالإنجليزية|FAQ\\s*${i}\\s*Q\\s*EN)\\]\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*\\[|$)`, 'i'),
    ]);
    const aEn = extractFirstMatch(text, [
      new RegExp(`\\[(?:إجابة\\s*${i}\\s*بالإنجليزية|اجابة\\s*${i}\\s*بالإنجليزية|FAQ\\s*${i}\\s*A\\s*EN)\\]\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*\\[|$)`, 'i'),
    ]);

    if ((qAr || qEn) && (aAr || aEn)) {
      faqItems.push({
        question: { ar: qAr || qEn || '', en: qEn || qAr || '' },
        answer: { ar: aAr || aEn || '', en: aEn || aAr || '' },
      });
    }
  }

  if (faqItems.length > 0) {
    draft.faqItems = faqItems;
  }

  const count = Object.values(draft).filter(
    (v) => v !== undefined && v !== '' && (!Array.isArray(v) || v.length > 0)
  ).length;
  return { draft, fieldsFoundCount: count };
}
