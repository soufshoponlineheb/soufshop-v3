/**
 * Smart Multi-Agent Prompt Builder, Media Classifier, Handoff Protocol & Parser for AQURIVO Admin.
 * Supports:
 * 1. Product & Algorithmic DNA Agent (web research from real product URL + visual inspection of image/video URLs + comparison DNA).
 * 2. Dedicated Product Article & Review Agent (connected via AgentHandoffBrief, smart media embedding, category store cross-linking, zero fake "Top Pick", anti-AI-slop rules).
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
  categoryNameAr?: string;
  categoryNameEn?: string;
  categoryIcon?: string;
  sourceId?: string;
  isFeatured?: boolean;
  affiliateUrl?: string;
  videoUrl?: string;
  videoUrls?: string[];
  images?: string[];
  tags?: string;
  altTextsAr?: string[];
  altTextsEn?: string[];
  videoTitlesAr?: string[];
  videoTitlesEn?: string[];
  bestForAr?: string;
  bestForEn?: string;
  keySpecsAr?: string[];
  keySpecsEn?: string[];
  performanceScore?: number;
  valueScore?: number;
  reliabilityScore?: number;
  handoffSummary?: string;
}

export interface AgentHandoffBrief {
  productSlug: string;
  titleAr: string;
  titleEn: string;
  categorySlug: string;
  categoryNameAr?: string;
  categoryNameEn?: string;
  priceUsd?: string;
  oldPriceUsd?: string;
  discount?: string;
  stars?: string;
  sourceProductUrl?: string;
  storePathAr: string;
  storePathEn: string;
  images: Array<{
    url: string;
    altAr: string;
    altEn: string;
  }>;
  videoUrls: string[];
  summaryAr?: string;
  summaryEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  bestForAr?: string;
  bestForEn?: string;
  keySpecsAr?: string[];
  keySpecsEn?: string[];
  whyAr?: string;
  whyEn?: string;
  considerAr?: string;
  considerEn?: string;
  handoffNotes?: string;
  updatedAt: string;
}

const HANDOFF_STORAGE_KEY = 'aqurivo_agent_handoff_v1';

/**
 * Detects whether a given URL points to a video (YouTube, Shorts, youtu.be, TikTok, Vimeo, Dailymotion, or direct video file)
 * vs an image URL.
 */
export function isVideoMediaUrl(rawUrl: string): boolean {
  const trimmed = rawUrl.trim().toLowerCase();
  if (!trimmed) return false;
  if (trimmed.startsWith('data:image/')) return false;
  if (trimmed.startsWith('data:video/')) return true;

  if (
    /(?:youtube\.com\/(?:watch|shorts|embed)|youtu\.be\/|tiktok\.com\/.*\/video\/|vimeo\.com\/|dailymotion\.com\/video)/i.test(
      trimmed
    )
  ) {
    return true;
  }

  // Check file extension before query string
  const withoutQuery = trimmed.split(/[?#]/)[0] || '';
  if (/\.(mp4|webm|mov|m4v|ogv|m3u8)$/i.test(withoutQuery)) {
    return true;
  }

  return false;
}

/**
 * Extracts all URLs from a raw text block (newline, comma, or pipe separated)
 * and classifies them automatically into image URLs and video URLs.
 */
export function classifyMediaUrlsFromText(rawInput: string): {
  imageUrls: string[];
  videoUrls: string[];
} {
  if (!rawInput || !rawInput.trim()) {
    return { imageUrls: [], videoUrls: [] };
  }

  const tokens = rawInput
    .split(/[\n\r,،|]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const imageUrls: string[] = [];
  const videoUrls: string[] = [];

  for (const token of tokens) {
    const urlMatch = token.match(/(?:https?:\/\/|data:image\/)[^\s"'<>]+/i);
    const candidate = urlMatch
      ? urlMatch[0].trim()
      : token.includes('.') && !token.includes(' ')
        ? `https://${token}`
        : '';

    if (!candidate) continue;

    if (isVideoMediaUrl(candidate)) {
      if (!videoUrls.includes(candidate)) {
        videoUrls.push(candidate);
      }
    } else {
      if (!imageUrls.includes(candidate)) {
        imageUrls.push(candidate);
      }
    }
  }

  return { imageUrls, videoUrls };
}

/**
 * Saves the latest Product Agent handoff brief in browser storage so the Article Agent can use it immediately.
 */
export function saveAgentHandoffBrief(brief: AgentHandoffBrief): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HANDOFF_STORAGE_KEY, JSON.stringify(brief));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Reads the saved Product Agent handoff brief from browser storage.
 */
export function getSavedAgentHandoffBrief(): AgentHandoffBrief | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(HANDOFF_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AgentHandoffBrief;
    if (!parsed || typeof parsed !== 'object' || !parsed.productSlug) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSavedAgentHandoffBrief(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(HANDOFF_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Extracts a clean YouTube video ID from standard watch URLs, Shorts URLs, youtu.be, or embed URLs.
 */
export function extractYouTubeVideoId(rawUrl: string): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,20})/i);
  if (shortsMatch?.[1]) return shortsMatch[1];
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{6,20})/i);
  if (watchMatch?.[1] && /youtube\.com/i.test(trimmed)) return watchMatch[1];
  const shortDomainMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{6,20})/i);
  if (shortDomainMatch?.[1]) return shortDomainMatch[1];
  const embedMatch = trimmed.match(/youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{6,20})/i);
  if (embedMatch?.[1]) return embedMatch[1];
  return null;
}

/**
 * Formats an AgentHandoffBrief into a human- and AI-readable block for the Article Agent.
 */
export function formatAgentHandoffBriefText(brief: AgentHandoffBrief): string {
  const imageLines =
    brief.images.length > 0
      ? brief.images
          .map((img, i) => {
            const roleNote =
              i === 0 && brief.images.length > 1
                ? ' [مخصصة لحقل (صورة الغلاف) — تجنب تكرارها داخل فقرات المقال واستخدم الصور #2 وما بعدها داخل الفقرات]'
                : i > 0
                  ? ' [صورة إضافية مخصصة للتضمين الذكي داخل فقرات المقال بوسم <figure>]'
                  : '';
            return `  - صورة #${i + 1}${roleNote}: ${img.url}\n    وصف محتواها (AR): ${img.altAr}\n    Alt (EN): ${img.altEn}`;
          })
          .join('\n')
      : '  - لم يتم إرفاق روابط صور بعد';

  const videoLines =
    brief.videoUrls.length > 0
      ? brief.videoUrls
          .map((v, i) => {
            const ytId = extractYouTubeVideoId(v);
            const embedHint = ytId
              ? `\n    كود التضمين المباشر في المقال: <figure><iframe src="https://www.youtube.com/embed/${ytId}" title="${brief.titleAr}" loading="lazy" allowfullscreen></iframe><figcaption>فيديو استعراضي يوضح تصميم وأداء المنتج على أرض الواقع</figcaption></figure>`
              : '';
            return `  - فيديو #${i + 1} (اعرضه كمشغل فيديو مدمج داخل المقال ولا تعامله كرابط عمولة): ${v}${embedHint}`;
          })
          .join('\n')
      : '  - لا يوجد فيديو مرفق';

  const specsAr =
    brief.keySpecsAr && brief.keySpecsAr.length > 0
      ? brief.keySpecsAr.join(' | ')
      : '';
  const specsEn =
    brief.keySpecsEn && brief.keySpecsEn.length > 0
      ? brief.keySpecsEn.join(' | ')
      : '';

  return [
    `📦 [مرجع الحقائق الفنية للمنتج — خاص بالوكيل فقط: يُمنع منعاً باتاً ذكر عبارة "بطاقة التسليم" أو "البيانات المقدمة" أو "رابط العمولة المختصر" أمام القارئ]`,
    `- اسم المنتج المعتمد (AR): ${brief.titleAr}`,
    `- اسم المنتج المعتمد (EN): ${brief.titleEn}`,
    `- معرف المنتج في المتجر (Slug): ${brief.productSlug}`,
    `- صفحة المنتج الداخلية بالعربية: ${brief.storePathAr}`,
    `- صفحة المنتج الداخلية بالإنجليزية: ${brief.storePathEn}`,
    ...(brief.sourceProductUrl
      ? [`- رابط الشراء الرسمي (Affiliate URL): ${brief.sourceProductUrl}`]
      : []),
    `- الفئة: ${brief.categorySlug}${brief.categoryNameAr ? ` (${brief.categoryNameAr} | ${brief.categoryNameEn || ''})` : ''}`,
    ...(brief.priceUsd
      ? [
          `- السعر المرجعي: $${brief.priceUsd} USD${brief.oldPriceUsd ? ` (السعر السابق: $${brief.oldPriceUsd})` : ''}${brief.discount ? ` — خصم ${brief.discount}%` : ''}`,
        ]
      : []),
    ...(brief.stars ? [`- تقييم المشترين: ★ ${brief.stars} / 5`] : []),
    ...(brief.summaryAr ? [`- الملخص المختصر (AR): ${brief.summaryAr}`] : []),
    ...(brief.summaryEn ? [`- Short Summary (EN): ${brief.summaryEn}`] : []),
    ...(brief.descriptionAr ? [`- الوصف التفصيلي الموثق (AR): ${brief.descriptionAr}`] : []),
    ...(brief.descriptionEn ? [`- Detailed Description (EN): ${brief.descriptionEn}`] : []),
    ...(brief.bestForAr ? [`- الاستخدام الأنسب (AR): ${brief.bestForAr}`] : []),
    ...(brief.bestForEn ? [`- Best For (EN): ${brief.bestForEn}`] : []),
    ...(specsAr ? [`- المواصفات الثلاث للمقارنة (AR): ${specsAr}`] : []),
    ...(specsEn ? [`- Key Specs (EN): ${specsEn}`] : []),
    ...(brief.whyAr ? [`- نقاط التفوق الفعلية (AR): ${brief.whyAr}`] : []),
    ...(brief.whyEn ? [`- Why We Picked It (EN): ${brief.whyEn}`] : []),
    ...(brief.considerAr ? [`- ما يجب الانتباه له قبل الشراء (AR): ${brief.considerAr}`] : []),
    ...(brief.considerEn ? [`- What to Consider (EN): ${brief.considerEn}`] : []),
    ...(brief.handoffNotes ? [`- ملاحظات إضافية: ${brief.handoffNotes}`] : []),
    `- معرض صور المنتج (${brief.images.length} صور):`,
    imageLines,
    `- الفيديوهات التوضيحية للمنتج (${brief.videoUrls.length}):`,
    videoLines,
  ].join('\n');
}

export const MAGIC_AI_PROMPT_TEMPLATE = `أنت «وكيل استقصاء المنتج وبناء البصمة الخوارزمية» (Product Intelligence & Algorithmic DNA Agent) لمنصة AQURIVO (https://aqurivo.store | https://aqurivo.com).

مهمتك الأساسية:
1. البحث الحقيقي في الويب (Web Grounding): افتح رابط المنتج الحقيقي المرفق أدناه وابحث عن طرازه الدقيق في الويب لاستخراج مواصفاته الفعلية، سعره بالدولار، تقييماته، نقاط قوته الحقيقية، وأهم ملاحظة صادقة يجب أن يعرفها المشتري قبل الدفع. يُمنع منعاً باتاً اختلاق مواصفات غير موجودة.
2. الفحص البصري الحقيقي للصور والفيديوهات:
   - بدلاً من تخمين عدد الصور، افتح روابط الصور المرفقة أدناه في الويب واحدة تلو الأخرى.
   - اكتب لكل صورة وصفاً بديلاً (Alt Text) بالعربية والإنجليزية يصف بدقة ما يظهر داخل تلك الصورة تحديداً (مثلاً: زاوية المنافذ الخلفية، حجم الجهاز بجانب اليد، محتويات العلبة...) وبنفس ترتيب وعدد الصور الفعلي.
   - إذا أرفقت لك روابط فيديوهات، ضعها في خانة [روابط الفيديوهات] كما هي لتعمل في معرض المنتج.
3. تغذية خوارزمية المقارنة الذكية (Algorithmic Comparison DNA):
   - منصتنا لا تستخدم نظام "المنتج الفائز الوهمي"، بل تعتمد على خوارزمية حية تقارن أي منتج قديم أو جديد بناءً على البيانات التي تكتبها أنت هنا.
   - لذلك يجب عليك تعبئة خانات البصمة الخوارزمية بدقة وموضوعية: (الاستخدام الأنسب، المواصفات الثلاث المفصلية للمقارنة، ومؤشرات الأداء والقيمة والاعتمادية من 100).
4. دستور الكتابة الاحترافية (يُمنع أسلوب الذكاء الاصطناعي المبتذل):
   - يُحظر استخدام عبارات إنشائية مستهلكة مثل: ("في عالمنا المتسارع"، "لا شك أن"، "يُعد هذا المنتج ثورة أو نقلة نوعية"، "إذا كنت تبحث عن... فقد وصلت"، "في الختام").
   - ابدأ مباشرة بالمعلومة المفيدة والأرقام الفعلية (القدرة بالواط، السعة، الخامة، الوزن، سيناريو الاستخدام الواقعي) بأسلوب خبير تقني وتجاري يخاطب عقل المشتري.
5. بطاقة التسليم لوكيل المقالات:
   - في آخر سطر داخل القالب، اكتب في خانة [ملخص التسليم لوكيل المقالات] ملخصاً مركزاً يربط هذا المنتج بوكيل كتابة المقالات (أهم حقيقة تقنية، زاوية المقال المقترحة، وكيف يتميز في فئته).

أعطني النتيجة كاملة داخل حاوية كود واحدة قابلة للنسخ (\`\`\`text ... \`\`\`) باستخدام هذه العناوين بدقة:

\`\`\`text
[العنوان بالعربية]: اسم المنتج الدقيق والواضح مع أبرز ميزة بحد أقصى 65 حرفاً
[العنوان بالإنجليزية]: Clear, accurate product title with core spec max 65 chars
[الرابط slug]: معرف رابط بالإنجليزية بحروف صغيرة وشرطات مثل anker-prime-power-bank-200w
[الفئة]: معرف الفئة بالإنجليزية مثل electronics (أو اكتب slug جديد لصناعة فئة جديدة تلقائياً)
[اسم الفئة بالعربية]: اسم الفئة بالعربية
[اسم الفئة بالإنجليزية]: Category Name in English
[أيقونة الفئة]: رمز واحد يناسب الفئة مثل 💻 أو 🏠
[المتجر الشريك]: amazon أو aliexpress أو noon أو temu
[السعر]: 59.99
[السعر القديم]: 79.99
[الخصم]: 25
[العملة]: USD
[التقييم]: 4.8
[المبيعات]: 1250
[شارة العرض]: توفير
[منتج مميز]: نعم
[الملخص بالعربية]: جملة واحدة مباشرة تبرز الفائدة العملية الحقيقية للمشتري بحد أقصى 155 حرفاً
[الملخص بالإنجليزية]: Direct 1-sentence value proposition for Meta Description max 155 chars
[لماذا اخترناه بالعربية]: 2 إلى 3 جمل عملية بالأرقام توضح نقاط التفوق الفعلية وجودة التصنيع
[لماذا اخترناه بالإنجليزية]: 2-3 factual sentences with concrete specs explaining why it stands out
[نقاط الانتباه بالعربية]: ملاحظة واحدة صادقة وشفافة للمشتري قبل الطلب (مثلاً: الوزن، عدم وجود محول في العلبة، إلخ)
[نقاط الانتباه بالإنجليزية]: One honest, transparent consideration the buyer should know before ordering
[الوصف التفصيلي بالعربية]: مراجعة تحريرية احترافية من 120 إلى 170 كلمة تشرح التجربة الفعلية والمواصفات الفنية بدون مقدمات إنشائية
[الوصف التفصيلي بالإنجليزية]: Authoritative 120-170 word editorial breakdown covering real-world performance and technical specs
[الاستخدام الأنسب بالعربية]: جملة قصيرة من 4 إلى 7 كلمات تحدد الفئة الأنسب لها هذا المنتج (مثال: للعمل المكتبي المكثف والسفر)
[الاستخدام الأنسب بالإنجليزية]: Short 4-7 word phrase defining the ideal user or scenario (e.g. Heavy remote work & travel)
[المواصفات الثلاث للمقارنة بالعربية]: المواصفة الأهم 1 | المواصفة الأهم 2 | المواصفة الأهم 3
[المواصفات الثلاث للمقارنة بالإنجليزية]: Key Spec 1 | Key Spec 2 | Key Spec 3
[مؤشر الأداء من 100]: 92
[مؤشر القيمة مقابل السعر من 100]: 94
[مؤشر الاعتمادية من 100]: 90
[الوسوم]: 10 كلمات مفتاحية وبحثية دقيقة مفصولة بفواصل
[روابط الصور]: ضع هنا روابط الصور المعتمدة مفصولة بفاصلة أو سطر
[النصوص البديلة للصور بالعربية]: وصف دقيق لمحتوى الصورة 1 بعد فتحها | وصف دقيق لمحتوى الصورة 2 بعد فتحها | ... (بنفس عدد الصور المرفقة)
[النصوص البديلة للصور بالإنجليزية]: Exact visual alt text for Image 1 | Exact visual alt text for Image 2 | ... (matching the exact image count)
[روابط الفيديوهات]: ضع هنا روابط الفيديوهات المرفقة مفصولة بفاصلة (أو اتركها فارغة إن لم يوجد فيديو)
[ملخص التسليم لوكيل المقالات]: ملخص مركز لوكيل المقالات يتضمن زاوية المراجعة الأهم، الأرقام الفارقة في هذا المنتج، وأفضل طريقة لدمج صوره وفيديوهاته داخل المقال.
\`\`\``;

export function buildDynamicProductAiPrompt(
  categories: Array<{
    id: string;
    slug: string;
    name?: { ar?: string; en?: string };
    icon?: string;
  }> = [],
  sources: Array<{
    id: string;
    slug: string;
    name?: { ar?: string; en?: string };
  }> = [],
  options?: {
    sourceProductUrl?: string;
    rawMediaUrlsInput?: string;
    existingImages?: Array<{ url: string }>;
    existingVideoUrls?: string[];
  }
): string {
  const catLines = categories
    .map(
      (c) =>
        `- ${c.slug || c.id}: ${c.icon ? `${c.icon} ` : ''}${c.name?.ar || ''} | ${c.name?.en || ''}`
    )
    .join('\n');

  const sourceLines = sources
    .map((s) => `- ${s.slug || s.id}: ${s.name?.ar || ''} | ${s.name?.en || ''}`)
    .join('\n');

  const classified = classifyMediaUrlsFromText(options?.rawMediaUrlsInput || '');
  const mergedImageUrls = Array.from(
    new Set([
      ...classified.imageUrls,
      ...(options?.existingImages?.map((img) => img.url).filter(Boolean) || []),
    ])
  );
  const mergedVideoUrls = Array.from(
    new Set([
      ...classified.videoUrls,
      ...(options?.existingVideoUrls?.filter(Boolean) || []),
    ])
  );

  const productLinkSection = options?.sourceProductUrl?.trim()
    ? `🔗 الرابط الحقيقي للمنتج (افتحه وابحث عنه في الويب لاستخراج كافة مواصفاته الحقيقية):\n${options.sourceProductUrl.trim()}`
    : `🔗 الرابط الحقيقي للمنتج أو اسمه (ابحث عنه في الويب لاستخراج مواصفاته الحقيقية):\n[ضع هنا رابط المنتج الحقيقي أو اسمه الكامل]`;

  const mediaSectionLines: string[] = [];
  if (mergedImageUrls.length > 0) {
    mediaSectionLines.push(
      `🖼️ روابط الصور الفعلية للمنتج (عددها ${mergedImageUrls.length} صور — افتح كل رابط في الويب واكتب وصف Alt يطابق ما يظهر داخل كل صورة بالترتيب):`,
      ...mergedImageUrls.map((u, idx) => `  ${idx + 1}. ${u}`)
    );
  } else {
    mediaSectionLines.push(
      `🖼️ روابط الصور الفعلية للمنتج (افتح كل رابط صورة ترفقه هنا واكتب اسم/وصف Alt بناءً على محتوى الصورة الفعلي):`,
      `[ضع هنا روابط الصور إن وجدت]`
    );
  }

  if (mergedVideoUrls.length > 0) {
    mediaSectionLines.push(
      `🎬 روابط الفيديوهات المرفقة للمنتج (${mergedVideoUrls.length} فيديو — أدرجها في خانة [روابط الفيديوهات]):`,
      ...mergedVideoUrls.map((u, idx) => `  ${idx + 1}. ${u}`)
    );
  }

  return `${MAGIC_AI_PROMPT_TEMPLATE}

---
📌 الفئات الحالية في متجر AQURIVO (اختر الأنسب أو ابتكر فئة جديدة تماماً):
${catLines || '- electronics, home, health, sports, fashion'}

📌 المتاجر الشريكة المتاحة:
${sourceLines || '- amazon, aliexpress, noon, temu'}

---
${productLinkSection}

${mediaSectionLines.join('\n')}`;
}

/**
 * Splits a raw block of alt text descriptions (separated by `|` or newlines) into a clean array of strings.
 */
function parsePipeOrLineList(rawBlock: string | undefined): string[] {
  if (!rawBlock) return [];
  return rawBlock
    .split(/\s*\|\s*|\n+/)
    .map((item) =>
      cleanExtractedText(
        item
          .replace(/^(?:\d+[\.\)\-]\s*|[-•]\s*|(?:صورة|Image|Alt|Spec|مواصفة)\s*#?\d*\s*:\s*)/i, '')
          .trim()
      )
    )
    .filter((item) => item.length > 1);
}

const AR_ANGLE_SUFFIXES = [
  'الواجهة الأمامية والتصميم الكامل',
  'زاوية جانبية توضح جودة التصنيع',
  'تفاصيل المكونات والمواصفات الدقيقة',
  'الاستخدام العملي في الحياة اليومية',
  'الأبعاد والحجم الفعلي للمنتج',
  'الملحقات والمحتويات المرفقة',
  'جودة الخامات والتشطيب الفاخر',
  'نظرة قريبة على الميزات الذكية',
];

const EN_ANGLE_SUFFIXES = [
  'Front View & Full Design',
  'Side Profile & Build Quality',
  'Close-up Specs & Craftsmanship',
  'Real-World Everyday Use',
  'Dimensions & Compact Form Factor',
  'Included Accessories & Package Contents',
  'Premium Finish & Material Details',
  'Smart Features & Ergonomic View',
];

/**
 * Smart Image Alt Engine:
 * Applies the exact visual descriptions generated by the Product Agent to each image slot,
 * and falls back to structured SEO descriptions if more images exist than descriptions.
 */
export function applySmartAltTextsToImages<
  T extends { url: string; alt: { ar: string; en: string }; width: number; height: number; publicId?: string },
>(
  images: T[],
  altTextsAr: string[] = [],
  altTextsEn: string[] = [],
  context: {
    titleAr?: string;
    titleEn?: string;
    categoryNameAr?: string;
    categoryNameEn?: string;
    tags?: string | string[];
  } = {}
): T[] {
  if (!Array.isArray(images) || images.length === 0) return [];

  const baseTitleAr = (context.titleAr || context.titleEn || 'منتج مختار من AQURIVO').trim();
  const baseTitleEn = (context.titleEn || context.titleAr || 'AQURIVO Curated Product').trim();
  const catAr = (context.categoryNameAr || '').trim();
  const catEn = (context.categoryNameEn || '').trim();

  const tagList = Array.isArray(context.tags)
    ? context.tags
    : typeof context.tags === 'string'
      ? context.tags
          .split(/[،,]/)
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

  return images.map((img, idx) => {
    const aiAr = altTextsAr[idx] ? altTextsAr[idx].trim() : '';
    const aiEn = altTextsEn[idx] ? altTextsEn[idx].trim() : '';

    const existingAr = img.alt?.ar?.trim() || '';
    const existingEn = img.alt?.en?.trim() || '';
    const isGenericExistingAr =
      !existingAr ||
      existingAr === 'صورة المنتج' ||
      existingAr === 'Product image' ||
      existingAr === baseTitleAr;
    const isGenericExistingEn =
      !existingEn ||
      existingEn === 'Product image' ||
      existingEn === 'صورة المنتج' ||
      existingEn === baseTitleEn;

    const tagKw = tagList[idx % Math.max(1, tagList.length)] || '';
    const angleAr =
      AR_ANGLE_SUFFIXES[idx % AR_ANGLE_SUFFIXES.length] || `زاوية عرض ${idx + 1}`;
    const angleEn =
      EN_ANGLE_SUFFIXES[idx % EN_ANGLE_SUFFIXES.length] || `Detailed View ${idx + 1}`;

    const generatedAr = [
      baseTitleAr,
      catAr || undefined,
      tagKw || undefined,
      `${angleAr} (${idx + 1})`,
    ]
      .filter(Boolean)
      .join(' — ')
      .slice(0, 180);

    const generatedEn = [
      baseTitleEn,
      catEn || undefined,
      tagKw || undefined,
      `${angleEn} (${idx + 1})`,
    ]
      .filter(Boolean)
      .join(' — ')
      .slice(0, 180);

    return {
      ...img,
      alt: {
        ar: aiAr || (!isGenericExistingAr ? existingAr : generatedAr),
        en: aiEn || (!isGenericExistingEn ? existingEn : generatedEn),
      },
    };
  });
}

function cleanExtractedText(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
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

function parseScoreField(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const m = raw.match(/(\d+(?:\.\d+)?)/);
  if (!m) return undefined;
  const num = Number(m[1]);
  if (Number.isNaN(num)) return undefined;
  return Math.max(50, Math.min(99, Math.round(num)));
}

export function parseMagicProductContent(rawInput: string): {
  draft: ParsedProductDraft;
  fieldsFoundCount: number;
} {
  let text = rawInput.trim();
  if (!text) {
    return { draft: {}, fieldsFoundCount: 0 };
  }

  if (text.startsWith('```')) {
    text = text.replace(/^```[a-zA-Z0-9_-]*\n?/, '').replace(/\n?```$/, '').trim();
  }

  const draft: ParsedProductDraft = {};

  // 1. JSON format support
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const obj = JSON.parse(text) as Record<string, any>;

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

      if (obj.slug) draft.slug = cleanExtractedText(String(obj.slug));

      if (typeof obj.shortSummary === 'object' && obj.shortSummary !== null) {
        if (obj.shortSummary.en) draft.summaryEn = cleanExtractedText(String(obj.shortSummary.en));
        if (obj.shortSummary.ar) draft.summaryAr = cleanExtractedText(String(obj.shortSummary.ar));
      } else if (typeof obj.shortSummary === 'string') {
        draft.summaryEn = cleanExtractedText(obj.shortSummary);
      }
      if (obj.summaryEn) draft.summaryEn = cleanExtractedText(String(obj.summaryEn));
      if (obj.summaryAr) draft.summaryAr = cleanExtractedText(String(obj.summaryAr));

      const whyObj = obj.whyWePickedIt || obj.whyWeChoseIt || obj.why;
      if (typeof whyObj === 'object' && whyObj !== null) {
        if (whyObj.en) draft.whyEn = cleanExtractedText(String(whyObj.en));
        if (whyObj.ar) draft.whyAr = cleanExtractedText(String(whyObj.ar));
      } else if (typeof whyObj === 'string') {
        draft.whyAr = cleanExtractedText(whyObj);
      }
      if (obj.whyEn) draft.whyEn = cleanExtractedText(String(obj.whyEn));
      if (obj.whyAr) draft.whyAr = cleanExtractedText(String(obj.whyAr));

      const considerObj = obj.whatToConsider || obj.thingsToNotice || obj.consider;
      if (typeof considerObj === 'object' && considerObj !== null) {
        if (considerObj.en) draft.considerEn = cleanExtractedText(String(considerObj.en));
        if (considerObj.ar) draft.considerAr = cleanExtractedText(String(considerObj.ar));
      } else if (typeof considerObj === 'string') {
        draft.considerAr = cleanExtractedText(considerObj);
      }
      if (obj.considerEn) draft.considerEn = cleanExtractedText(String(obj.considerEn));
      if (obj.considerAr) draft.considerAr = cleanExtractedText(String(obj.considerAr));

      const descObj = obj.description || obj.detailedDescription;
      if (typeof descObj === 'object' && descObj !== null) {
        if (descObj.en) draft.descEn = cleanExtractedText(String(descObj.en));
        if (descObj.ar) draft.descAr = cleanExtractedText(String(descObj.ar));
      } else if (typeof descObj === 'string') {
        draft.descAr = cleanExtractedText(descObj);
      }
      if (obj.descEn) draft.descEn = cleanExtractedText(String(obj.descEn));
      if (obj.descAr) draft.descAr = cleanExtractedText(String(obj.descAr));

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

      if (obj.categoryNameAr) draft.categoryNameAr = cleanExtractedText(String(obj.categoryNameAr));
      else if (obj.categoryName?.ar) draft.categoryNameAr = cleanExtractedText(String(obj.categoryName.ar));
      if (obj.categoryNameEn) draft.categoryNameEn = cleanExtractedText(String(obj.categoryNameEn));
      else if (obj.categoryName?.en) draft.categoryNameEn = cleanExtractedText(String(obj.categoryName.en));
      if (obj.categoryIcon) draft.categoryIcon = cleanExtractedText(String(obj.categoryIcon));

      if (obj.isFeatured !== undefined) draft.isFeatured = Boolean(obj.isFeatured);
      if (obj.sourceId) draft.sourceId = cleanExtractedText(String(obj.sourceId));
      if (obj.affiliateUrl) draft.affiliateUrl = cleanExtractedText(String(obj.affiliateUrl));

      if (Array.isArray(obj.altTextsAr)) {
        draft.altTextsAr = obj.altTextsAr.map((s: unknown) => cleanExtractedText(String(s))).filter(Boolean);
      } else if (typeof obj.altTextsAr === 'string') {
        draft.altTextsAr = parsePipeOrLineList(obj.altTextsAr);
      }
      if (Array.isArray(obj.altTextsEn)) {
        draft.altTextsEn = obj.altTextsEn.map((s: unknown) => cleanExtractedText(String(s))).filter(Boolean);
      } else if (typeof obj.altTextsEn === 'string') {
        draft.altTextsEn = parsePipeOrLineList(obj.altTextsEn);
      }

      const rawMediaList: string[] = [];
      if (Array.isArray(obj.images)) {
        for (const img of obj.images) {
          const u = typeof img === 'string' ? img : img?.url;
          if (u) rawMediaList.push(String(u));
        }
      } else if (Array.isArray(obj.imageUrls)) {
        for (const u of obj.imageUrls) {
          if (u) rawMediaList.push(String(u));
        }
      }
      if (Array.isArray(obj.videoUrls)) {
        for (const v of obj.videoUrls) {
          if (v) rawMediaList.push(String(v));
        }
      }
      if (obj.videoUrl) {
        rawMediaList.push(String(obj.videoUrl));
      }

      if (rawMediaList.length > 0) {
        const classified = classifyMediaUrlsFromText(rawMediaList.join('\n'));
        if (classified.imageUrls.length > 0) draft.images = classified.imageUrls;
        if (classified.videoUrls.length > 0) {
          draft.videoUrls = classified.videoUrls;
          draft.videoUrl = classified.videoUrls[0];
        }
      }

      if (obj.bestForAr || obj.comparisonDna?.bestFor?.ar) {
        draft.bestForAr = cleanExtractedText(String(obj.bestForAr || obj.comparisonDna?.bestFor?.ar));
      }
      if (obj.bestForEn || obj.comparisonDna?.bestFor?.en) {
        draft.bestForEn = cleanExtractedText(String(obj.bestForEn || obj.comparisonDna?.bestFor?.en));
      }
      if (obj.keySpecsAr || obj.comparisonDna?.keySpecs?.ar) {
        const raw = obj.keySpecsAr || obj.comparisonDna?.keySpecs?.ar;
        draft.keySpecsAr = Array.isArray(raw) ? raw.map(String) : parsePipeOrLineList(String(raw));
      }
      if (obj.keySpecsEn || obj.comparisonDna?.keySpecs?.en) {
        const raw = obj.keySpecsEn || obj.comparisonDna?.keySpecs?.en;
        draft.keySpecsEn = Array.isArray(raw) ? raw.map(String) : parsePipeOrLineList(String(raw));
      }
      if (obj.performanceScore || obj.comparisonDna?.performanceScore) {
        draft.performanceScore = parseScoreField(String(obj.performanceScore || obj.comparisonDna?.performanceScore));
      }
      if (obj.valueScore || obj.comparisonDna?.valueScore) {
        draft.valueScore = parseScoreField(String(obj.valueScore || obj.comparisonDna?.valueScore));
      }
      if (obj.reliabilityScore || obj.comparisonDna?.reliabilityScore) {
        draft.reliabilityScore = parseScoreField(String(obj.reliabilityScore || obj.comparisonDna?.reliabilityScore));
      }

      if (Array.isArray(obj.tags)) {
        draft.tags = obj.tags.join(', ');
      } else if (typeof obj.tags === 'string') {
        draft.tags = obj.tags;
      }

      const count = Object.values(draft).filter(
        (v) => v !== undefined && v !== '' && (!Array.isArray(v) || v.length > 0)
      ).length;
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
    /\[(?:الملخص\s*بالعربية|الملخص\s*العربي|Short\s*Summary\s*AR|ملخص\s*عربي|الملخص)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|$)/i,
  ]);

  draft.summaryEn = extractFirstMatch(text, [
    /\[(?:الملخص\s*بالإنجليزية|الملخص\s*الإنجليزي|Short\s*Summary\s*EN|ملخص\s*إنجليزي|ملخص\s*انجليزي)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|$)/i,
  ]);

  draft.whyAr = extractFirstMatch(text, [
    /\[(?:لماذا\s*اخترناه\s*بالعربية|لماذا\s*اخترنا\s*هذا\s*المنتج\s*بالعربية|لماذا\s*اخترناه|Why\s*We\s*Picked\s*It\s*AR|Why\s*We\s*Chose\s*It\s*AR)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|$)/i,
  ]);

  draft.whyEn = extractFirstMatch(text, [
    /\[(?:لماذا\s*اخترناه\s*بالإنجليزية|لماذا\s*اخترنا\s*هذا\s*المنتج\s*بالإنجليزية|Why\s*We\s*Picked\s*It\s*EN|Why\s*We\s*Chose\s*It\s*EN)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|$)/i,
  ]);

  draft.considerAr = extractFirstMatch(text, [
    /\[(?:نقاط\s*الانتباه\s*بالعربية|ما\s*يجب\s*الانتباه\s*له\s*بالعربية|نقاط\s*الانتباه|ما\s*يجب\s*الانتباه\s*له|What\s*To\s*Consider\s*AR)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|$)/i,
  ]);

  draft.considerEn = extractFirstMatch(text, [
    /\[(?:نقاط\s*الانتباه\s*بالإنجليزية|ما\s*يجب\s*الانتباه\s*له\s*بالإنجليزية|What\s*To\s*Consider\s*EN|What\s*to\s*consider)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|$)/i,
  ]);

  draft.descAr = extractFirstMatch(text, [
    /\[(?:الوصف\s*التفصيلي\s*بالعربية|الوصف\s*بالعربية|الوصف\s*العربي|Detailed\s*Description\s*AR|Description\s*AR)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|$)/i,
  ]);

  draft.descEn = extractFirstMatch(text, [
    /\[(?:الوصف\s*التفصيلي\s*بالإنجليزية|الوصف\s*بالإنجليزية|الوصف\s*الإنجليزي|Detailed\s*Description\s*EN|Description\s*EN)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|$)/i,
  ]);

  draft.priceAmount = extractFirstMatch(text, [
    /\[(?:السعر|السعر\s*الحالي|Price|Current\s*Price)\]\s*:\s*([\d\.]+)/i,
  ]);

  draft.oldPrice = extractFirstMatch(text, [
    /\[(?:السعر\s*القديم|السعر\s*السابق|Old\s*Price|Original\s*Price)\]\s*:\s*([\d\.]+)/i,
  ]);

  draft.discount = extractFirstMatch(text, [
    /\[(?:الخصم|نسبة\s*الخصم|Discount)\]\s*:\s*([\d]+)/i,
  ]);

  draft.stars = extractFirstMatch(text, [
    /\[(?:التقييم|النجوم|Stars|Rating)\]\s*:\s*([\d\.]+)/i,
  ]);

  draft.soldCount = extractFirstMatch(text, [
    /\[(?:المبيعات|عدد\s*المبيعات|Sold\s*Count|Sold)\]\s*:\s*([\d]+)/i,
  ]);

  draft.categoryId = extractFirstMatch(text, [
    /\[(?:الفئة|فئة\s*المنتج|Category|categorySlug)\]\s*:\s*([^\n\[]+)/i,
  ]);

  draft.categoryNameAr = extractFirstMatch(text, [
    /\[(?:اسم\s*الفئة\s*بالعربية|اسم\s*الفئة\s*العربي|Category\s*Name\s*AR)\]\s*:\s*([^\n\[]+)/i,
  ]);

  draft.categoryNameEn = extractFirstMatch(text, [
    /\[(?:اسم\s*الفئة\s*بالإنجليزية|اسم\s*الفئة\s*الإنجليزي|Category\s*Name\s*EN)\]\s*:\s*([^\n\[]+)/i,
  ]);

  draft.categoryIcon = extractFirstMatch(text, [
    /\[(?:أيقونة\s*الفئة|ايقونة\s*الفئة|رمز\s*الفئة|Category\s*Icon)\]\s*:\s*([^\n\[]+)/i,
  ]);

  draft.sourceId = extractFirstMatch(text, [
    /\[(?:المتجر\s*الشريك|المتجر|المصدر|Partner\s*Store|Source)\]\s*:\s*([^\n\[]+)/i,
  ]);

  draft.priceCurrency = extractFirstMatch(text, [
    /\[(?:العملة|نوع\s*العملة|Currency)\]\s*:\s*([A-Za-z]{2,4})/i,
  ]);

  draft.badge = extractFirstMatch(text, [
    /\[(?:شارة\s*العرض|الشارة|Badge|Promo\s*Badge)\]\s*:\s*([^\n\[]+)/i,
  ]);

  const rawFeatured = extractFirstMatch(text, [
    /\[(?:منتج\s*مميز|مميز|Featured)\]\s*:\s*([^\n\[]+)/i,
  ]);
  if (rawFeatured) {
    const lowerFeat = rawFeatured.toLowerCase().trim();
    draft.isFeatured =
      lowerFeat === 'نعم' ||
      lowerFeat === 'yes' ||
      lowerFeat === 'true' ||
      lowerFeat === '1';
  }

  draft.affiliateUrl = extractFirstMatch(text, [
    /\[(?:رابط\s*المنتج|رابط\s*الافلييت|رابط\s*العمولة|Affiliate\s*URL|URL)\]\s*:\s*(https?:\/\/[^\s\n\[]+)/i,
  ]);

  // Algorithmic Comparison DNA extraction
  draft.bestForAr = extractFirstMatch(text, [
    /\[(?:الاستخدام\s*الأنسب\s*بالعربية|لمن\s*يناسب\s*بالعربية|Best\s*For\s*AR)\]\s*:\s*([^\n\[]+)/i,
  ]);
  draft.bestForEn = extractFirstMatch(text, [
    /\[(?:الاستخدام\s*الأنسب\s*بالإنجليزية|لمن\s*يناسب\s*بالإنجليزية|Best\s*For\s*EN)\]\s*:\s*([^\n\[]+)/i,
  ]);

  const rawSpecsAr = extractFirstMatch(text, [
    /\[(?:المواصفات\s*الثلاث\s*للمقارنة\s*بالعربية|نقاط\s*المقارنة\s*بالعربية|Key\s*Specs\s*AR)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|$)/i,
  ]);
  if (rawSpecsAr) {
    draft.keySpecsAr = parsePipeOrLineList(rawSpecsAr).slice(0, 5);
  }

  const rawSpecsEn = extractFirstMatch(text, [
    /\[(?:المواصفات\s*الثلاث\s*للمقارنة\s*بالإنجليزية|نقاط\s*المقارنة\s*بالإنجليزية|Key\s*Specs\s*EN)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|$)/i,
  ]);
  if (rawSpecsEn) {
    draft.keySpecsEn = parsePipeOrLineList(rawSpecsEn).slice(0, 5);
  }

  draft.performanceScore = parseScoreField(
    extractFirstMatch(text, [
      /\[(?:مؤشر\s*الأداء\s*من\s*100|درجة\s*الأداء|Performance\s*Score)\]\s*:\s*([^\n\[]+)/i,
    ])
  );
  draft.valueScore = parseScoreField(
    extractFirstMatch(text, [
      /\[(?:مؤشر\s*القيمة\s*مقابل\s*السعر\s*من\s*100|درجة\s*القيمة|Value\s*Score)\]\s*:\s*([^\n\[]+)/i,
    ])
  );
  draft.reliabilityScore = parseScoreField(
    extractFirstMatch(text, [
      /\[(?:مؤشر\s*الاعتمادية\s*من\s*100|درجة\s*الاعتمادية|Reliability\s*Score)\]\s*:\s*([^\n\[]+)/i,
    ])
  );

  draft.handoffSummary = extractFirstMatch(text, [
    /\[(?:ملخص\s*التسليم\s*لوكيل\s*المقالات|بطاقة\s*التسليم|ملخص\s*التسليم|Agent\s*Handoff)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|$)/i,
  ]);

  const rawAltAr = extractFirstMatch(text, [
    /\[(?:النصوص\s*البديلة\s*للصور\s*بالعربية|النص\s*البديل\s*للصور\s*بالعربية|أوصاف\s*الصور\s*بالعربية|Alt\s*Texts?\s*AR|Image\s*Alt\s*AR)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|$)/i,
  ]);
  if (rawAltAr) {
    draft.altTextsAr = parsePipeOrLineList(rawAltAr);
  }

  const rawAltEn = extractFirstMatch(text, [
    /\[(?:النصوص\s*البديلة\s*للصور\s*بالإنجليزية|النص\s*البديل\s*للصور\s*بالإنجليزية|أوصاف\s*الصور\s*بالإنجليزية|Alt\s*Texts?\s*EN|Image\s*Alt\s*EN)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|$)/i,
  ]);
  if (rawAltEn) {
    draft.altTextsEn = parsePipeOrLineList(rawAltEn);
  }

  const rawTags = extractFirstMatch(text, [
    /\[(?:الوسوم|الكلمات\s*المفتاحية|Tags)\]\s*:\s*([^\n\[]+)/i,
  ]);

  const rawLongTail = extractFirstMatch(text, [
    /\[(?:كلمات\s*Long\s*Tail|كلمات\s*البحث|Long\s*Tail\s*Keywords|Long\s*Tail)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|$)/i,
  ]);

  if (rawTags && rawLongTail) {
    draft.tags = `${rawTags}, ${rawLongTail.replace(/\n+/g, ', ')}`;
  } else if (rawTags) {
    draft.tags = rawTags;
  } else if (rawLongTail) {
    draft.tags = rawLongTail.replace(/\n+/g, ', ');
  }

  // Extract unified media (both images and videos) from [روابط الصور], [روابط الفيديوهات], [رابط الفيديو], [الوسائط]
  const rawImagesBlock = extractFirstMatch(text, [
    /\[(?:روابط\s*الصور|روابط\s*الوسائط|الصور|Images|Image\s*URLs|Media\s*URLs)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|$)/i,
  ]);
  const rawVideosBlock = extractFirstMatch(text, [
    /\[(?:روابط\s*الفيديوهات|رابط\s*الفيديو|الفيديوهات|فيديو|Video\s*URLs?|Videos?)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|$)/i,
  ]);

  const combinedMediaRaw = [rawImagesBlock || '', rawVideosBlock || '']
    .filter(Boolean)
    .join('\n');

  if (combinedMediaRaw) {
    const classified = classifyMediaUrlsFromText(combinedMediaRaw);
    if (classified.imageUrls.length > 0) {
      draft.images = classified.imageUrls;
    }
    if (classified.videoUrls.length > 0) {
      draft.videoUrls = classified.videoUrls;
      draft.videoUrl = classified.videoUrls[0];
    }
  }

  const count = Object.values(draft).filter(
    (v) => v !== undefined && v !== '' && (!Array.isArray(v) || v.length > 0)
  ).length;
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
  relatedProductsQuery?: string[];
  agentReport?: string;
  affiliateCtaUrl?: string;
  affiliateCtaColor?: string;
  faqItems?: Array<{
    question: { ar: string; en: string };
    answer: { ar: string; en: string };
  }>;
}

export interface AffiliateCtaColorPreset {
  hex: string;
  nameAr: string;
  nameEn: string;
}

export const AFFILIATE_CTA_COLOR_PRESETS: AffiliateCtaColorPreset[] = [
  {
    hex: '#EA580C',
    nameAr: 'برتقالي نحاسي دافئ (الافتراضي المحفز)',
    nameEn: 'Warm Copper Orange (Default)',
  },
  {
    hex: '#059669',
    nameAr: 'أخضر زمردي موثوق',
    nameEn: 'Emerald Trust Green',
  },
  {
    hex: '#2563EB',
    nameAr: 'أزرق ياقوتي واضح',
    nameEn: 'Royal Sapphire Blue',
  },
  {
    hex: '#D97706',
    nameAr: 'ذهبي كهرماني مميز',
    nameEn: 'Amber Gold',
  },
  {
    hex: '#E11D48',
    nameAr: 'عنابي ياقوتي جذاب',
    nameEn: 'Crimson Ruby',
  },
  {
    hex: '#7C3AED',
    nameAr: 'بنفسجي ملكي أنيق',
    nameEn: 'Royal Violet',
  },
];

export function normalizeHexColor(input?: string | null, fallback = '#EA580C'): string {
  if (!input || typeof input !== 'string') return fallback;
  const trimmed = input.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toUpperCase();
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const r = trimmed[1];
    const g = trimmed[2];
    const b = trimmed[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return fallback;
}

/**
 * Applies or updates the affiliate link URL and chosen highlight color on contextual
 * buying-trigger anchor tags inside article HTML without disturbing internal category/product links.
 */
export function applyAffiliateCtaStylingToHtml(
  rawHtml: string,
  affiliateUrl?: string,
  highlightColor = '#EA580C'
): string {
  if (!rawHtml || typeof rawHtml !== 'string') return '';
  const safeColor = normalizeHexColor(highlightColor, '#EA580C');
  const trimmedAffiliateUrl = affiliateUrl?.trim() || '';

  let html = rawHtml;
  if (trimmedAffiliateUrl) {
    html = html
      .replace(/\[AFFILIATE_LINK\]/gi, trimmedAffiliateUrl)
      .replace(/\{\{\s*AFFILIATE_LINK\s*\}\}/gi, trimmedAffiliateUrl);
  }

  // Upgrade any <a ...> that is an affiliate CTA link while protecting video/internal links
  return html.replace(
    /<a\b([^>]*)>([\s\S]*?)<\/a>/gi,
    (fullMatch, rawAttrs: string, innerHtml: string) => {
      const hrefMatch = rawAttrs.match(/\bhref\s*=\s*(['"])(.*?)\1/i);
      const currentHref = hrefMatch ? hrefMatch[2].trim() : '';
      const cleanInner = innerHtml.replace(/\s*↗\s*$/g, '').trim();

      // Never style video links (YouTube, Shorts, Vimeo, direct video) as affiliate CTA links
      if (currentHref && isVideoMediaUrl(currentHref)) {
        return `<a href="${currentHref}" target="_blank" rel="noopener noreferrer">${cleanInner}</a>`;
      }

      const isExplicitCta =
        /data-affiliate-cta\s*=\s*(['"]?)true\1/i.test(rawAttrs) ||
        /\baffiliate-cta-link\b/i.test(rawAttrs) ||
        /data-cta-color\s*=/i.test(rawAttrs) ||
        /\brel\s*=\s*(['"])[^'"]*sponsored[^'"]*\1/i.test(rawAttrs);

      const isMatchingAffiliateHref =
        Boolean(trimmedAffiliateUrl) &&
        (currentHref === trimmedAffiliateUrl ||
          currentHref === '[AFFILIATE_LINK]' ||
          currentHref.startsWith('/go/'));

      const isExternalMerchantLink =
        /^https?:\/\//i.test(currentHref) &&
        !/aqurivo\.(?:store|com)/i.test(currentHref) &&
        !/(?:youtube\.com|youtu\.be|vimeo\.com|tiktok\.com|dailymotion\.com|wikipedia\.org)/i.test(
          currentHref
        );

      if (!isExplicitCta && !isMatchingAffiliateHref && !isExternalMerchantLink) {
        return fullMatch;
      }

      const finalHref =
        trimmedAffiliateUrl && (isExplicitCta || currentHref === '[AFFILIATE_LINK]')
          ? trimmedAffiliateUrl
          : currentHref || trimmedAffiliateUrl || '#';

      return `<a href="${finalHref}" class="affiliate-cta-link" data-affiliate-cta="true" data-cta-color="${safeColor}" style="--cta-color: ${safeColor};" target="_blank" rel="sponsored noopener noreferrer">${cleanInner}</a>`;
    }
  );
}

export const MAGIC_ARTICLE_AI_PROMPT_TEMPLATE = `أنت «وكيل المقالات التحريرية والمراجعات المتعمقة» (Editorial Guide & Deep Review Agent) لمنصة AQURIVO (https://aqurivo.store | https://aqurivo.com).

فلسفة وقواعد عملك الصارمة والعامة لأي منتج (Universal Editorial System Prompt):
1. الهوية التحريرية الموثوقة ومنع كسر الجدار الرابع (Strict Editorial Voice & Zero Fourth-Wall Leaks):
   - اكتب دائماً بصفتك فريق التحرير والاختبار في منصة AQURIVO الذي يخاطب القارئ مباشرةً بلغة خبيرة، واضحة، ومقنعة تناسب طبيعة المنتج قيد المراجعة أياً كانت فئته.
   - يُمنع منعاً باتاً ذكر أي مصطلحات داخلية أو كواليس تقنية أمام القارئ، مثل: ("بطاقة التسليم"، "البيانات المسلمة لنا"، "القائمة المطابقة للعنوان"، "رابط العمولة المختصر"، "السعر المسجل في بطاقة AQURIVO"، "لم يتح لنا الرابط التحقق"). القارئ يقرأ مراجعة تحريرية احترافية منشورة للجمهور العام وليس تقريراً داخلياً.
2. التوازن الاحترافي بين الإقناع الذكي والأمانة المهنية (High-Conversion Objectivity):
   - تجنب نبرة "التشكيك القانوني المفرط" أو تكرار عبارات إخلاء المسؤولية في كل فقرة (مثل تكرار "لا تتوفر اختبارات معملية مستقلة" أو التشكيك في تطابق صفحة المتجر)، لأن ذلك يربك القارئ ويضعف ثقته دون مبرر.
   - بدلاً من ذلك، اعرض نقاط القوة والمواصفات الفنية وتجربة الاستخدام الواقعية بثقة ووضوح، وناقش القيود العملية أو نقاط الانتباه بأسلوب الخبير الناصح الذي يوضّح للمشتري متى يكون هذا المنتج خياراً ممتازاً له ومتى قد يفضّل مواصفات أخرى.
3. التوزيع الاستراتيجي لروابط العمولة الملونة (3 عبارات شرائية في مواضع القرار، للأحرف فقط):
   - ادمج رابط العمولة المعتمد في **3 مواضع طبيعية موزعة بذكاء** عبر المقال:
     (أ) الموضع الأول: بعد تحليل التجربة العملية والمواصفات الأساسية في الثلث الأول من المقال.
     (ب) الموضع الثاني: داخل قسم تقييم القيمة مقابل السعر.
     (ج) الموضع الثالث: في القسم الختامي (قرار الشراء) حيث يحسم القارئ قراره النهائي.
   - لوّن نص العبارة التحفيزية (تلوين الحروف فقط بدون أي رموز أسهم وبدون إطارات) باستخدام هذا الوسم الدقيق:
     <a href="AFFILIATE_URL" class="affiliate-cta-link" data-affiliate-cta="true" data-cta-color="HIGHLIGHT_HEX" style="--cta-color: HIGHLIGHT_HEX;" target="_blank" rel="sponsored noopener noreferrer">العبارة التحفيزية الطبيعية للشراء</a>
   - تنبيه صارم: يُمنع وضع كلاس affiliate-cta-link أو تلوين الشراء على روابط الفيديوهات (مثل YouTube) أو الروابط الداخلية للموقع؛ التلوين مخصص حصرياً لروابط شراء المنتج.
4. التوظيف البصري الذكي لمعرض الصور والفيديو بدون تكرار صورة الغلاف:
   - الصورة رقم [1] تُعتمد لحقل [صورة الغلاف]؛ لذلك تجنب تكرار الصورة رقم [1] داخل فقرات المقال طالما تتوفر صور إضافية للمنتج ([2]، [3]، [4]...).
   - وزّع 2 إلى 3 صور مختلفة من الصور الإضافية داخل أقسام المقال لشرح زوايا المنتج وميزاته وتفاصيله باستخدام:
     <figure><img src="IMAGE_URL" alt="وصف دقيق لمحتوى الصورة" loading="lazy" /><figcaption>تعليق توضيحي مفيد للقارئ</figcaption></figure>
   - إذا توفر للمنتج فيديو توضيحي (YouTube أو Shorts)، قم بتضمينه في السياق المناسب باستخدام كود التضمين <figure><iframe src="https://www.youtube.com/embed/VIDEO_ID" title="عنوان الفيديو" loading="lazy" allowfullscreen></iframe><figcaption>تعليق توضيحي</figcaption></figure> دون تلوينه كرابط عمولة.
5. الدقة الصارمة في ربط المنتجات المقترحة وجدول المقارنة (Strict Comparable-Only Product Linking):
   - في خانة [المنتجات المقترحة]، أدرج دائماً معرف (slug) المنتج الأساسي أولاً.
   - لا تضف معه منتجات أخرى من فهرس متجر AQURIVO إلا إذا كانت بدائل حقيقية قابلة للمقارنة المباشرة أو مكملات وثيقة الصلة بنفس نوع الاستخدام.
   - إذا لم يتوفر في فهرس المتجر منتج آخر يصلح للمقارنة المنطقية المباشرة مع المنتج الأساسي، اكتفِ بوضع slug المنتج الأساسي وحده فقط في [المنتجات المقترحة]، ولا تحشر منتجات عشوائية لا علاقة لها بطبيعة المنتج، ولا تكتب داخل نص المقال أي تبرير أو إشارة لعدم توفر بدائل في فهرس المتجر.
6. حظر أسلوب الذكاء الاصطناعي المبتذل (Zero AI Slop Policy):
   - يُمنع استخدام مقدمات إنشائية عامة أو قوالب مكررة مثل: ("في عالمنا المتسارع"، "لا شك أن"، "يُعد خياراً مثالياً لكل من يبحث عن..."، "في الختام"). ادخل مباشرة من الجملة الأولى في صلب التجربة العملية والأرقام التي تفيد المشتري.

طريقة الإخراج المطلوبة:
أولاً — خارج مربع الكود، قدم "تقرير الفحص والترابط" في 3 نقاط مختصرة (موجهة للمشرف):
- المنتج الأساسي الذي بُني عليه المقال وأهم الحقائق المستخرجة عنه.
- الصور الإضافية والفيديو والعبارات التحفيزية الثلاث الملونة التي تم توزيعها داخل المقال.
- قرار ربط المنتجات المقترحة (ذكر البدائل المتوافقة منطقياً إن وجدت، أو الاكتفاء بالمنتج الأساسي وحده لضمان دقة العرض).

ثانياً — داخل مربع كود واحد فقط (\`\`\`text ... \`\`\`)، اكتب المراجعة والدليل التحريري باللغتين العربية والإنجليزية باستخدام هذه العناوين بدقة تامة:

\`\`\`text
[تقرير الفحص]: ملخص سريع للمشرف يوضح المنتج الأساسي وتوزيع الصور والروابط التحفيزية الثلاثة
[العنوان بالعربية]: عنوان احترافي للمراجعة ودليل الشراء يستهدف نية الباحث الحقيقية
[العنوان بالإنجليزية]: Authoritative review and buying guide title in English
[الرابط slug]: in-depth-review-and-guide-slug-2026
[الفئة]: معرف الفئة المناسب للمنتج
[المنتجات المقترحة]: slug-المنتج-الأساسي (أضف معه فقط المنتجات القابلة للمقارنة المباشرة منطقياً إن وجدت في المتجر)
[رابط العمولة المدمج]: ضع رابط العمولة المعتمد للمنتج هنا
[لون الكلمات التحفيزية]: #EA580C
[صورة الغلاف]: ضع رابط الصورة رقم 1 للمنتج هنا
[المقتطف بالعربية]: خلاصة مركزة من سطرين تخبر القارئ فوراً بما سيكتشفه في هذه المراجعة العملية
[المقتطف بالإنجليزية]: Direct 2-line summary telling the reader what this hands-on review covers
[عنوان SEO بالعربية]: عنوان مخصص لمحركات البحث بحد أقصى 60 حرفاً
[عنوان SEO بالإنجليزية]: SEO meta title max 60 chars
[وصف SEO بالعربية]: وصف تعريفي لمحركات البحث (Meta Description) بحد أقصى 155 حرفاً
[وصف SEO بالإنجليزية]: SEO meta description max 155 chars
[الكلمات المفتاحية]: مراجعة، تحليل الأداء، دليل شراء، مقارنة، الكلمات المفتاحية للمنتج
[الكاتب]: AQURIVO Editorial Team
[وقت القراءة]: 6
[المحتوى بالعربية]: <h2>التجربة الفعلية: ماذا يقدم هذا المنتج على أرض الواقع؟</h2><p>تحليل مباشر بالأرقام والحقائق العملية مع دمج متناسق لـ <a href="AFFILIATE_URL" class="affiliate-cta-link" data-affiliate-cta="true" data-cta-color="#EA580C" style="--cta-color: #EA580C;" target="_blank" rel="sponsored noopener noreferrer">التحقق من السعر الحالي وتوفر النسخة الأصلية</a> في السياق المناسب...</p><h2>جودة التصنيع والأداء اليومي</h2><p>تفصيل عميق مع تضمين الصور الإضافية (صورة #2 و #3) والفيديو التوضيحي إن وجد...</p><h2>القيمة مقابل السعر: هل يستحق الاقتناء؟</h2><p>تحليل اقتصادي واضح مع دمج الرابط الثاني مثل <a href="AFFILIATE_URL" class="affiliate-cta-link" data-affiliate-cta="true" data-cta-color="#EA580C" style="--cta-color: #EA580C;" target="_blank" rel="sponsored noopener noreferrer">مراجعة العرض الرسمي وخيارات الشحن المتاحة</a>...</p><h2>لمن يناسب هذا المنتج وقرار الشراء النهائي</h2><p>توجيه عملي واضح يساعد القارئ على حسم قراره مع دمج الرابط الختامي <a href="AFFILIATE_URL" class="affiliate-cta-link" data-affiliate-cta="true" data-cta-color="#EA580C" style="--cta-color: #EA580C;" target="_blank" rel="sponsored noopener noreferrer">طلب المنتج مباشرة من المتجر المعتمد</a>...</p>
[المحتوى بالإنجليزية]: <h2>Real-World Performance: What Does It Actually Deliver?</h2><p>Direct, data-backed analysis with natural integration to <a href="AFFILIATE_URL" class="affiliate-cta-link" data-affiliate-cta="true" data-cta-color="#EA580C" style="--cta-color: #EA580C;" target="_blank" rel="sponsored noopener noreferrer">check live official pricing and availability</a> in context...</p><h2>Build Quality & Daily Experience</h2><p>In-depth breakdown with smart placement of additional product images (#2, #3) and video...</p><h2>Value for Money</h2><p>Practical evaluation of cost vs features with natural link to <a href="AFFILIATE_URL" class="affiliate-cta-link" data-affiliate-cta="true" data-cta-color="#EA580C" style="--cta-color: #EA580C;" target="_blank" rel="sponsored noopener noreferrer">view the current deal and shipping options</a>...</p><h2>Who Should Buy It & Final Buying Decision</h2><p>Actionable guidance concluding with <a href="AFFILIATE_URL" class="affiliate-cta-link" data-affiliate-cta="true" data-cta-color="#EA580C" style="--cta-color: #EA580C;" target="_blank" rel="sponsored noopener noreferrer">order the authentic edition from the official store</a>...</p>
[خلاصة المحرر بالعربية]: نصيحة قرار واضحة ومحددة تساعد القارئ على حسم قراره حسب طبيعة استخدامه وميزانيته
[خلاصة المحرر بالإنجليزية]: Actionable final verdict helping the reader decide based on use case and budget
[سؤال 1 بالعربية]: سؤال عملي محدد يسأله المشترون فعلياً قبل شراء هذا المنتج؟
[إجابة 1 بالعربية]: إجابة دقيقة ومباشرة مبنية على المواصفات الحقيقية.
[سؤال 1 بالإنجليزية]: Specific practical question buyers ask before ordering this product?
[إجابة 1 بالإنجليزية]: Direct, factual answer backed by real specifications.
[سؤال 2 بالعربية]: سؤال ثانٍ حول الاستخدام اليومي أو العناية أو القيمة مقابل السعر؟
[إجابة 2 بالعربية]: إجابة عملية واضحة تساعد المشتري.
[سؤال 2 بالإنجليزية]: Second question regarding daily use, care, or value?
[إجابة 2 بالإنجليزية]: Clear, helpful answer for the shopper.
\`\`\``;

export function buildDynamicArticleAiPrompt(
  products: Array<{
    id: string;
    slug: string;
    title: { ar?: string; en?: string };
    categoryId?: string;
    categorySlug?: string;
    price?: number | null;
    priceAmount?: number | null;
    priceCurrency?: string;
    stars?: number | null;
    affiliateUrl?: string;
    images?: Array<{ url: string; alt?: { ar?: string; en?: string } }>;
    videoUrl?: string;
    videoUrls?: string[];
    comparisonDna?: {
      bestFor?: { ar?: string; en?: string };
      keySpecs?: { ar?: string[]; en?: string[] };
    };
  }> = [],
  categories: Array<{
    id: string;
    slug: string;
    name: { ar?: string; en?: string };
  }> = [],
  handoffBrief?: AgentHandoffBrief | null,
  affiliateOptions?: {
    affiliateUrl?: string;
    highlightColor?: string;
  }
): string {
  const categoryLines = categories
    .map((c) => `- ${c.slug || c.id}: ${c.name?.ar || ''} | ${c.name?.en || ''}`)
    .join('\n');

  const productLines = products
    .slice(0, 80)
    .map((p) => {
      const cat = p.categorySlug || p.categoryId || 'general';
      const img = p.images?.[0]?.url || '';
      const numericPrice =
        typeof p.priceAmount === 'number'
          ? p.priceAmount
          : typeof p.price === 'number'
            ? p.price
            : null;
      const currency = p.priceCurrency || 'USD';
      const priceStr =
        numericPrice !== null && numericPrice > 0
          ? ` | السعر: ${numericPrice} ${currency}`
          : '';
      const ratingStr =
        typeof p.stars === 'number' && p.stars > 0 ? ` | التقييم: ★${p.stars}` : '';
      const bestForStr = p.comparisonDna?.bestFor?.ar
        ? ` | الأنسب لـ: ${p.comparisonDna.bestFor.ar}`
        : '';
      return `- [slug: ${p.slug}] (الفئة: ${cat}${priceStr}${ratingStr}${bestForStr}) AR: "${p.title?.ar || ''}" | EN: "${p.title?.en || ''}"${img ? ` | Image: ${img}` : ''}`;
    })
    .join('\n');

  const resolvedAffiliateUrl =
    affiliateOptions?.affiliateUrl?.trim() ||
    handoffBrief?.sourceProductUrl?.trim() ||
    (handoffBrief?.productSlug ? `/go/${handoffBrief.productSlug}?ref=article_cta` : '[AFFILIATE_LINK]');

  const resolvedColor = normalizeHexColor(affiliateOptions?.highlightColor, '#EA580C');
  const presetInfo = AFFILIATE_CTA_COLOR_PRESETS.find(
    (p) => p.hex.toUpperCase() === resolvedColor
  );
  const colorLabel = presetInfo ? `${resolvedColor} (${presetInfo.nameAr})` : resolvedColor;

  const affiliateCtaDirectiveSection = [
    `\n---`,
    `🎨 🔗 إعدادات دمج رابط العمولة وتلوين الكلمات التحفيزية (Contextual Affiliate CTA Settings):`,
    `- رابط العمولة المطلوب دمجه في الكلمات المحفزة للشراء: ${resolvedAffiliateUrl}`,
    `- اللون المميز المطلوب للكلمات التحفيزية (تلوين الحروف فقط بدون حواف أو أسهم): ${colorLabel}`,
    `- طريقة الدمج الإلزامية (3 مواضع استراتيجية: بعد الأداء الفعلي، وفي القيمة مقابل السعر، وفي قرار الشراء الختامي):`,
    `  استخدم هذا الكود نصياً عند كتابة العبارات التي تحفز القارئ على الشراء أو فحص العرض في [المحتوى بالعربية] و [المحتوى بالإنجليزية]:`,
    `  <a href="${resolvedAffiliateUrl}" class="affiliate-cta-link" data-affiliate-cta="true" data-cta-color="${resolvedColor}" style="--cta-color: ${resolvedColor};" target="_blank" rel="sponsored noopener noreferrer">العبارة التحفيزية هنا</a>`,
    `- تنبيه: لا تستخدم هذا الكود أو اللون على روابط يوتيوب أو الفيديوهات؛ هذا التلوين خاص بروابط شراء المنتج فقط.`,
  ].join('\n');

  const handoffSection = handoffBrief
    ? `\n---\n${formatAgentHandoffBriefText(handoffBrief)}\n`
    : `\n---\n🎯 المنتج أو الموضوع المطلوب البحث عنه في الويب وكتابة مراجعة ومقال خاص به:\n[اختر المنتج من منتقي المنتجات في لوحة التحكم أو اكتب اسم/رابط المنتج هنا]\n`;

  return `${MAGIC_ARTICLE_AI_PROMPT_TEMPLATE}
${affiliateCtaDirectiveSection}
---
📌 فهرس منتجات متجر AQURIVO (اربط منه فقط البدائل القابلة للمقارنة المباشرة منطقياً مع المنتج الأساسي؛ وإن لم يوجد بديل مباشر من نفس نوع الاستخدام، اكتفِ بوضع slug المنتج الأساسي وحده فقط في [المنتجات المقترحة]):

الفئات المتاحة في المتجر:
${categoryLines || '- electronics, home, health, sports, fashion'}

المنتجات المنشورة حالياً في متجر AQURIVO:
${productLines || '- تصفح https://aqurivo.store/ar/products لاستخراج أحدث المنتجات.'}
${handoffSection}`;
}

export function parseMagicArticleContent(
  rawInput: string,
  affiliateOptions?: {
    affiliateUrl?: string;
    highlightColor?: string;
  }
): {
  draft: ParsedArticleDraft;
  fieldsFoundCount: number;
} {
  let text = rawInput.trim();
  if (!text) {
    return { draft: {}, fieldsFoundCount: 0 };
  }

  let preBlockReport: string | undefined;

  const codeBlockMatch = text.match(/```(?:text|markdown|html)?\s*\n([\s\S]*?)\n```/i);
  if (codeBlockMatch && codeBlockMatch[1] && codeBlockMatch[1].includes('[')) {
    const beforeIndex = codeBlockMatch.index || 0;
    const rawBefore = text.slice(0, beforeIndex).trim();
    if (rawBefore.length > 10) {
      preBlockReport = rawBefore;
    }
    text = codeBlockMatch[1].trim();
  } else if (text.startsWith('```')) {
    text = text.replace(/^```[a-zA-Z0-9_-]*\n?/, '').replace(/\n?```$/, '').trim();
  }

  const draft: ParsedArticleDraft = {};
  if (preBlockReport) {
    draft.agentReport = preBlockReport;
  }

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

      if (Array.isArray(obj.relatedProducts || obj.relatedProductIds)) {
        draft.relatedProductsQuery = (obj.relatedProducts || obj.relatedProductIds)
          .map((item: unknown) => cleanExtractedText(String(item)))
          .filter(Boolean);
      } else if (typeof obj.relatedProducts === 'string') {
        draft.relatedProductsQuery = obj.relatedProducts
          .split(/[،,\n|]+/)
          .map((s: string) => cleanExtractedText(s))
          .filter(Boolean);
      }
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
  const taggedReport = extractFirstMatch(text, [
    /\[(?:تقرير\s*الفحص|تقرير\s*الوكيل|ملخص\s*الفحص|Agent\s*Report|Discovery\s*Report)\]\s*:\s*([\s\S]*?)(?=\n\s*\[|$)/i,
  ]);
  if (taggedReport) {
    draft.agentReport = draft.agentReport
      ? `${taggedReport}\n${draft.agentReport}`
      : taggedReport;
  }

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

  const rawRelatedProducts = extractFirstMatch(text, [
    /\[(?:المنتجات\s*المقترحة|المنتجات\s*المدمجة|المنتجات\s*المرتبطة|المنتجات\s*المقارنة|Related\s*Products|Recommended\s*Products)\]\s*:\s*([^\n\[]+)/i,
  ]);
  if (rawRelatedProducts) {
    draft.relatedProductsQuery = rawRelatedProducts
      .split(/[،,\n|]+/)
      .map((item) => cleanExtractedText(item))
      .filter(Boolean);
  }

  draft.coverImage = extractFirstMatch(text, [
    /\[(?:صورة\s*الغلاف|رابط\s*صورة\s*الغلاف|الغلاف|Cover\s*Image)\]\s*:\s*([^\n\[]+)/i,
  ]);
  draft.affiliateCtaUrl = extractFirstMatch(text, [
    /\[(?:رابط\s*العمولة\s*المدمج|رابط\s*العمولة|رابط\s*الافلييت|Affiliate\s*URL|Affiliate\s*Link)\]\s*:\s*(https?:\/\/[^\s\n\[]+|\/go\/[^\s\n\[]+)/i,
  ]);
  draft.affiliateCtaColor = extractFirstMatch(text, [
    /\[(?:لون\s*الكلمات\s*التحفيزية|لون\s*الرابط\s*التحفيزي|Highlight\s*Color|CTA\s*Color)\]\s*:\s*(#[0-9a-fA-F]{3,6})/i,
  ]);
  draft.contentAr = extractFirstMatch(text, [
    /\[(?:المحتوى\s*بالعربية|محتوى\s*الدليل\s*بالعربية|Content\s*AR)\]\s*:\s*([\s\S]*?)(?=\n\s*\[(?:المحتوى\s*بالإنجليزية|خلاصة|سؤال|إجابة|Content\s*EN|Editor|FAQ)|$)/i,
  ]);
  draft.contentEn = extractFirstMatch(text, [
    /\[(?:المحتوى\s*بالإنجليزية|محتوى\s*الدليل\s*بالإنجليزية|Content\s*EN)\]\s*:\s*([\s\S]*?)(?=\n\s*\[(?:المحتوى\s*بالعربية|خلاصة|سؤال|إجابة|Editor|FAQ)|$)/i,
  ]);

  const effectiveAffiliateUrl =
    affiliateOptions?.affiliateUrl?.trim() || draft.affiliateCtaUrl?.trim() || '';
  const effectiveHighlightColor = normalizeHexColor(
    affiliateOptions?.highlightColor || draft.affiliateCtaColor,
    '#EA580C'
  );

  if (draft.contentAr) {
    draft.contentAr = applyAffiliateCtaStylingToHtml(
      draft.contentAr,
      effectiveAffiliateUrl,
      effectiveHighlightColor
    );
  }
  if (draft.contentEn) {
    draft.contentEn = applyAffiliateCtaStylingToHtml(
      draft.contentEn,
      effectiveAffiliateUrl,
      effectiveHighlightColor
    );
  }
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
