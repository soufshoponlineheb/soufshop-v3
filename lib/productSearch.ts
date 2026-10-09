import type { Article, Product } from '@/types';

/**
 * Normalizes Arabic and Latin text for resilient single-letter, prefix,
 * and multi-word search matching:
 * - Removes Arabic tashkeel (diacritics) and tatweel
 * - Normalizes Alef variants (أ إ آ ٱ -> ا), Teh Marbuta (ة -> ه), Alef Maqsura (ى -> ي), Hamza (ؤ -> و, ئ -> ي)
 * - Lowercases Latin characters
 */
export function normalizeSearchText(input: string | undefined | null): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // Strip Arabic diacritics & tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىئ]/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/گ/g, 'ك')
    .replace(/ڤ/g, 'ف')
    .replace(/پ/g, 'ب')
    .replace(/چ/g, 'ج')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strips the Arabic definite article "ال" from the start of a normalized word
 * so searching "ساعه" matches "الساعه" and vice-versa.
 */
function stripArabicDefiniteArticle(word: string): string {
  return word.startsWith('ال') && word.length > 2 ? word.slice(2) : word;
}

/**
 * Collapses consecutive duplicate characters (e.g., "ميييني" -> "ميني", "pcc" -> "pc")
 */
function collapseDuplicateChars(word: string): string {
  return word.replace(/(.)\1+/gu, '$1');
}

/**
 * Produces an Arabic/Latin phonetic skeleton that tolerates omitted or swapped
 * long vowels (ا, و, ي) and common phonetic letter confusions:
 * - "ميني" -> "من", "مني" -> "من"
 * - "بيسي" -> "بس", "بسيى" -> "بس", "بسي" -> "بس"
 * - "ماوس" -> "مس", "مواس" -> "مس"
 * - "سماعه" -> "سمع", "سمعه" -> "سمع"
 * - "كمبيوتر" -> "كمبتر", "كومبيوتر" -> "كمبتر"
 */
export function toPhoneticSkeleton(rawWord: string): string {
  const base = collapseDuplicateChars(stripArabicDefiniteArticle(rawWord));
  if (base.length <= 2) return base;

  // Normalize commonly confused Arabic consonants
  const phonetic = base
    .replace(/ظ/g, 'ض')
    .replace(/ذ/g, 'د')
    .replace(/ص/g, 'س')
    .replace(/ط/g, 'ت');

  // Keep the first character's identity if it's not a weak vowel, strip internal/trailing weak vowels (ا و ي ه)
  const firstChar = phonetic[0];
  const rest = phonetic.slice(1).replace(/[اوي]/g, '');
  const result = `${firstChar}${rest}`.replace(/ه$/g, '');
  return result.length >= 2 ? result : phonetic;
}

/**
 * Bounded Damerau-Levenshtein edit distance (supports character insertions,
 * deletions, substitutions, and adjacent transpositions like "مواس" <-> "ماوس" or "lpatop" <-> "laptop").
 */
export function damerauLevenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const lenA = a.length;
  const lenB = b.length;
  if (lenA === 0) return lenB;
  if (lenB === 0) return lenA;
  if (Math.abs(lenA - lenB) > 3) return Math.abs(lenA - lenB);

  const dp: number[][] = Array.from({ length: lenA + 1 }, () =>
    new Array(lenB + 1).fill(0)
  );

  for (let i = 0; i <= lenA; i += 1) dp[i][0] = i;
  for (let j = 0; j <= lenB; j += 1) dp[0][j] = j;

  for (let i = 1; i <= lenA; i += 1) {
    for (let j = 1; j <= lenB; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1); // transposition
      }
    }
  }
  return dp[lenA][lenB];
}

/**
 * Bidirectional Arabic <-> English + Colloquial / Typo Concept Dictionary.
 * If ANY term in a group appears in a product or query, all sibling terms in that group
 * are recognized so searching "pc" matches "ميني بي سي" / "حاسوب" and searching "مني بسيى" matches "Mini PC".
 */
const BILINGUAL_CONCEPT_GROUPS: string[][] = [
  [
    'pc',
    'minipc',
    'mini pc',
    'computer',
    'desktop',
    'workstation',
    'beelink',
    'geekom',
    'mac mini',
    'ryzen',
    'intel',
    'بي سي',
    'بيسي',
    'بسي',
    'بسيي',
    'ميني بي سي',
    'مني بي سي',
    'مني بسي',
    'ميني بسي',
    'منيبسي',
    'مينيبيسي',
    'كمبيوتر',
    'كومبيوتر',
    'كمبيتر',
    'حاسوب',
    'حسوب',
    'حاسب',
    'مكتبي',
    'مصغر',
  ],
  [
    'mini',
    'compact',
    'portable',
    'pocket',
    'small',
    'ميني',
    'مني',
    'مصغر',
    'صغير',
    'محمول',
    'جيب',
  ],
  [
    'laptop',
    'notebook',
    'macbook',
    'ultrabook',
    'chromebook',
    'لابتوب',
    'لاب توب',
    'لبتوب',
    'لب توب',
    'ماك بوك',
    'ماكبوك',
    'حاسوب محمول',
    'كمبيوتر محمول',
    'نوتبوك',
  ],
  [
    'phone',
    'smartphone',
    'mobile',
    'iphone',
    'galaxy',
    'android',
    'pixel',
    'هاتف',
    'جوال',
    'موبايل',
    'مبيل',
    'تلفون',
    'تليفون',
    'ايفون',
    'سامسونج',
    'شاومي',
  ],
  [
    'tablet',
    'ipad',
    'tab',
    'تابلت',
    'تبلت',
    'ايباد',
    'لوحي',
    'جهاز لوحي',
  ],
  [
    'headphones',
    'headphone',
    'earbuds',
    'earphones',
    'airpods',
    'headset',
    'audio',
    'anc',
    'wireless',
    'bluetooth',
    'سماعه',
    'سماعات',
    'سمعه',
    'سمعات',
    'سماعه راس',
    'ايربودز',
    'بلوتوث',
    'لاسلكيه',
    'لاسلكي',
    'عزل',
    'صوت',
  ],
  [
    'speaker',
    'soundbar',
    'subwoofer',
    'سبيكر',
    'مكبر صوت',
    'مكبر',
    'ساوند بار',
    'صوتيات',
  ],
  [
    'watch',
    'smartwatch',
    'smart watch',
    'band',
    'fitness tracker',
    'wearable',
    'ساعه',
    'ساعات',
    'سعه',
    'ساعه ذكيه',
    'سوار',
    'سوار ذكي',
    'رياضيه',
  ],
  [
    'monitor',
    'screen',
    'display',
    'tv',
    'television',
    'oled',
    'qled',
    '4k',
    '144hz',
    'شاشه',
    'شاشات',
    'ششه',
    'مونيتور',
    'تلفزيون',
    'تلفاز',
    'عرض',
    'بوصه',
  ],
  [
    'keyboard',
    'mechanical',
    'keycaps',
    'switches',
    'كيبورد',
    'كيبرد',
    'كي بورد',
    'لوحه مفاتيح',
    'مفاتيح',
    'ميكانيكي',
  ],
  [
    'mouse',
    'mice',
    'trackpad',
    'ergonomic mouse',
    'ماوس',
    'مواس',
    'موس',
    'فاره',
    'فأره',
  ],
  [
    'gaming',
    'gamer',
    'controller',
    'gamepad',
    'joystick',
    'console',
    'ps5',
    'playstation',
    'xbox',
    'nintendo',
    'قيمنق',
    'جيمنج',
    'قيمينق',
    'العاب',
    'لعب',
    'يد تحكم',
    'ذراع تحكم',
    'كونسول',
    'بلايستيشن',
  ],
  [
    'camera',
    'webcam',
    'gopro',
    'action cam',
    'drone',
    'gimbal',
    'tripod',
    'lens',
    'كاميرا',
    'كميرا',
    'كمره',
    'ويب كام',
    'تصوير',
    'درون',
    'ترايبود',
    'حامل',
    'عدسه',
  ],
  [
    'microphone',
    'mic',
    'podcast',
    'streaming',
    'مايك',
    'ميكروفون',
    'مايكروفون',
    'ميكرفون',
    'بودكاست',
    'تسجيل',
  ],
  [
    'charger',
    'powerbank',
    'power bank',
    'battery',
    'cable',
    'adapter',
    'hub',
    'dock',
    'gan',
    'usb',
    'type c',
    'magsafe',
    'شاحن',
    'شحن',
    'شواحن',
    'باور بانك',
    'باوربانك',
    'بطاريه',
    'سلك',
    'كيبل',
    'كابل',
    'محول',
    'هاب',
    'موزع',
    'تايب سي',
  ],
  [
    'ssd',
    'nvme',
    'hard drive',
    'hdd',
    'storage',
    'flash drive',
    'memory',
    'sdcard',
    'هارد',
    'هاردسك',
    'قرص صلب',
    'تخزين',
    'ذاكره',
    'فلاش',
    'ميموري',
    'تيرا',
    'جيجا',
  ],
  [
    'coffee',
    'espresso',
    'barista',
    'grinder',
    'maker',
    'machine',
    'kitchen',
    'air fryer',
    'blender',
    'kettle',
    'قهوه',
    'اسبريسو',
    'باريستا',
    'ماكينه',
    'مكينه',
    'طاحونه',
    'مطبخ',
    'قلايه',
    'قلايه هوائيه',
    'خلاط',
    'غلايه',
  ],
  [
    'vacuum',
    'robot',
    'cleaner',
    'mop',
    'smart home',
    'مكنسه',
    'مكنسه ذكيه',
    'مكنسه روبوت',
    'روبوت',
    'تنظيف',
    'منزل ذكي',
  ],
  [
    'projector',
    'cinema',
    'beamer',
    'بروجكتر',
    'بروجيكتور',
    'برجكتر',
    'عارض',
    'سينما',
  ],
  [
    'router',
    'wifi',
    'mesh',
    'network',
    'modem',
    'راوتر',
    'روتر',
    'واي فاي',
    'وايفاي',
    'شبكه',
    'انترنت',
  ],
  [
    'chair',
    'desk',
    'office',
    'ergonomic',
    'stand',
    'holder',
    'mount',
    'كرسي',
    'مكتب',
    'مكتبي',
    'طبي',
    'مريح',
    'طاوله',
    'ستاند',
    'قاعده',
  ],
  [
    'bag',
    'backpack',
    'luggage',
    'travel',
    'case',
    'pouch',
    'حقيبه',
    'شنطه',
    'ظهر',
    'سفر',
    'حافظه',
  ],
  [
    'lamp',
    'light',
    'led',
    'lightbar',
    'ambient',
    'مصباح',
    'اضاءه',
    'اناره',
    'ليد',
  ],
];

/**
 * Expands normalized text with all matching bilingual concept groups
 * so cross-language and colloquial searches match seamlessly.
 */
export function expandWithBilingualSynonyms(normalizedText: string): string {
  if (!normalizedText) return '';
  const compactText = normalizedText.replace(/\s+/g, '');
  const wordsSet = new Set(
    normalizedText
      .split(' ')
      .filter(Boolean)
      .flatMap((w) => [w, stripArabicDefiniteArticle(w), toPhoneticSkeleton(w)])
  );

  const additions: string[] = [];

  for (const group of BILINGUAL_CONCEPT_GROUPS) {
    let matched = false;
    for (const rawTerm of group) {
      const normTerm = normalizeSearchText(rawTerm);
      if (!normTerm) continue;
      const compactTerm = normTerm.replace(/\s+/g, '');

      if (normTerm.includes(' ')) {
        // Multi-word phrase match (either spaced or joined like "بي سي" / "بيسي")
        if (
          normalizedText.includes(normTerm) ||
          (compactTerm.length >= 3 && compactText.includes(compactTerm))
        ) {
          matched = true;
          break;
        }
      } else {
        const strippedTerm = stripArabicDefiniteArticle(normTerm);
        const skelTerm = toPhoneticSkeleton(normTerm);
        if (
          wordsSet.has(normTerm) ||
          wordsSet.has(strippedTerm) ||
          (skelTerm.length >= 3 && wordsSet.has(skelTerm)) ||
          (normTerm.length >= 3 && normalizedText.includes(normTerm))
        ) {
          matched = true;
          break;
        }
      }
    }

    if (matched) {
      for (const sibling of group) {
        additions.push(normalizeSearchText(sibling));
      }
    }
  }

  return additions.length > 0
    ? `${normalizedText} ${additions.join(' ')}`
    : normalizedText;
}

/**
 * Safely extracts text from a LocalizedText object, plain string, or undefined value.
 */
function extractLocalized(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    const rec = val as { ar?: unknown; en?: unknown };
    const ar = typeof rec.ar === 'string' ? rec.ar : '';
    const en = typeof rec.en === 'string' ? rec.en : '';
    return `${ar} ${en}`;
  }
  return '';
}

/**
 * Extracts words, definite-article-stripped words, adjacent joined compound words
 * (e.g., "بي سي" -> "بيسي", "ميني بي سي" -> "مينيبيسي", "لاب توب" -> "لابتوب"),
 * and phonetic skeletons for resilient typo-tolerant matching.
 */
function buildWordAndSkeletonTokens(normText: string): {
  words: string[];
  skeletons: string[];
  compact: string;
} {
  const rawTokens = normText.split(' ').filter(Boolean);
  const wordSet = new Set<string>();
  const skeletonSet = new Set<string>();

  for (let i = 0; i < rawTokens.length; i += 1) {
    const w = rawTokens[i];
    const stripped = stripArabicDefiniteArticle(w);
    const collapsed = collapseDuplicateChars(stripped);
    wordSet.add(w);
    wordSet.add(stripped);
    wordSet.add(collapsed);

    const skel = toPhoneticSkeleton(w);
    if (skel) skeletonSet.add(skel);

    // Join adjacent 2-word and 3-word compounds (handles "بي سي" <-> "بيسي" / "بسي", "mini pc" <-> "minipc")
    if (i + 1 < rawTokens.length) {
      const pair = `${stripped}${stripArabicDefiniteArticle(rawTokens[i + 1])}`;
      wordSet.add(pair);
      const pairSkel = toPhoneticSkeleton(pair);
      if (pairSkel) skeletonSet.add(pairSkel);
    }
    if (i + 2 < rawTokens.length) {
      const triple = `${stripped}${stripArabicDefiniteArticle(rawTokens[i + 1])}${stripArabicDefiniteArticle(rawTokens[i + 2])}`;
      wordSet.add(triple);
      const tripleSkel = toPhoneticSkeleton(triple);
      if (tripleSkel) skeletonSet.add(tripleSkel);
    }
  }

  return {
    words: Array.from(wordSet).filter(Boolean),
    skeletons: Array.from(skeletonSet).filter(Boolean),
    compact: normText.replace(/\s+/g, ''),
  };
}

/**
 * Core smart scoring engine used by both full Product objects and BrowserProductSnapshot items.
 * Supports:
 * 1. Exact, prefix, middle-word, last-word, and internal substring matching in Arabic & English
 * 2. Cross-language & synonym matching (e.g., "pc" <-> "ميني بي سي" / "حاسوب" / "كمبيوتر")
 * 3. Phonetic vowel-omission & Arabic letter confusion correction (e.g., "مني بسيى" <-> "ميني بي سي")
 * 4. Joined/split compound word matching ("بي سي" <-> "بيسي" / "بسي", "لاب توب" <-> "لابتوب")
 * 5. Damerau-Levenshtein typo tolerance (1–2 character typos or swapped adjacent letters)
 */
export function scoreSmartSearchCandidate(
  primaryTitleText: string,
  secondaryMetaText: string,
  rawQuery: string
): number {
  const normalizedQuery = normalizeSearchText(rawQuery);
  if (!normalizedQuery) return 1;

  const titleNorm = normalizeSearchText(primaryTitleText);
  const metaNorm = normalizeSearchText(secondaryMetaText);
  const baseAllText = `${titleNorm} ${metaNorm}`.trim();

  // Expand both product text and user query with bilingual concept synonyms
  const expandedProductText = expandWithBilingualSynonyms(baseAllText);
  const expandedQueryText = expandWithBilingualSynonyms(normalizedQuery);

  const titleTokens = buildWordAndSkeletonTokens(titleNorm);
  const allTokens = buildWordAndSkeletonTokens(expandedProductText);

  const rawQueryWords = normalizedQuery.split(' ').filter(Boolean);
  // Also include joined query version so "مني بسيى" can also test as individual words + compound
  const queryTerms = rawQueryWords.map((token) => {
    const stripped = stripArabicDefiniteArticle(token);
    const collapsed = collapseDuplicateChars(stripped);
    const skeleton = toPhoneticSkeleton(token);
    const synonymExpanded = expandWithBilingualSynonyms(token)
      .split(' ')
      .filter((t) => Boolean(t && t !== token));
    return {
      raw: token,
      stripped,
      collapsed,
      skeleton,
      synonyms: synonymExpanded,
    };
  });

  if (queryTerms.length === 0) return 1;

  let totalScore = 0;
  let matchedTokensCount = 0;

  const compactQuery = normalizedQuery.replace(/\s+/g, '');

  // Phrase-level bonuses (contiguous or joined compound phrase in title or expanded synonyms)
  if (titleNorm.startsWith(normalizedQuery)) {
    totalScore += 150;
  } else if (titleNorm.includes(normalizedQuery)) {
    totalScore += 110;
  } else if (
    compactQuery.length >= 2 &&
    titleTokens.compact.includes(compactQuery)
  ) {
    totalScore += 95;
  } else if (expandedProductText.includes(normalizedQuery)) {
    totalScore += 80;
  } else if (
    compactQuery.length >= 2 &&
    allTokens.compact.includes(compactQuery)
  ) {
    totalScore += 70;
  }

  // Also check if the query as a whole phrase triggered a bilingual synonym present in the product
  if (totalScore === 0 && rawQueryWords.length > 1) {
    const phraseSynonyms = expandedQueryText.split(' ').filter(Boolean);
    if (
      phraseSynonyms.some(
        (syn) => syn.length >= 2 && allTokens.words.includes(syn)
      )
    ) {
      totalScore += 75;
    }
  }

  for (const q of queryTerms) {
    let tokenScore = 0;
    const candidates = Array.from(
      new Set([q.raw, q.stripped, q.collapsed].filter(Boolean))
    );

    for (const term of candidates) {
      if (!term) continue;

      // 1. Exact word match in title (any position: first, middle, or last word)
      if (titleTokens.words.some((w) => w === term)) {
        tokenScore = Math.max(tokenScore, 105);
      } else if (titleTokens.words.some((w) => w.startsWith(term))) {
        // 2. Prefix of any word in title
        tokenScore = Math.max(tokenScore, 90);
      } else if (
        titleNorm.includes(term) ||
        (term.length >= 2 && titleTokens.compact.includes(term))
      ) {
        // 3. Substring anywhere inside title or joined title words
        tokenScore = Math.max(tokenScore, 78);
      } else if (allTokens.words.some((w) => w === term)) {
        // 4. Exact match in bilingual synonyms, category, tags, or specs (e.g. "pc" -> "ميني بي سي")
        tokenScore = Math.max(tokenScore, 74);
      } else if (allTokens.words.some((w) => w.startsWith(term))) {
        // 5. Prefix match in bilingual synonyms, category, tags, or description
        tokenScore = Math.max(tokenScore, 62);
      } else if (
        expandedProductText.includes(term) ||
        (term.length >= 2 && allTokens.compact.includes(term))
      ) {
        // 6. Substring anywhere in expanded product text
        tokenScore = Math.max(tokenScore, 50);
      }
    }

    // 7. Bilingual synonym cross-check from query token -> product words
    if (tokenScore < 65 && q.synonyms.length > 0) {
      for (const syn of q.synonyms) {
        if (syn.length < 2) continue;
        if (titleTokens.words.some((w) => w === syn || w.includes(syn))) {
          tokenScore = Math.max(tokenScore, 76);
          break;
        }
        if (allTokens.words.some((w) => w === syn)) {
          tokenScore = Math.max(tokenScore, 68);
          break;
        }
      }
    }

    // 8. Phonetic Vowel-Skeleton Match (handles "مني" -> "ميني", "بسيى" -> "بي سي", "مواس" -> "ماوس", "سمعه" -> "سماعة")
    if (tokenScore < 60 && q.skeleton.length >= 2) {
      if (titleTokens.skeletons.some((sk) => sk === q.skeleton)) {
        tokenScore = Math.max(tokenScore, 70);
      } else if (
        q.skeleton.length >= 3 &&
        titleTokens.skeletons.some(
          (sk) => sk.includes(q.skeleton) || q.skeleton.includes(sk)
        )
      ) {
        tokenScore = Math.max(tokenScore, 60);
      } else if (allTokens.skeletons.some((sk) => sk === q.skeleton)) {
        tokenScore = Math.max(tokenScore, 56);
      }
    }

    // 9. Damerau-Levenshtein Fuzzy Typo Correction (handles misspelled letters or swapped keys)
    if (tokenScore === 0 && q.collapsed.length >= 3) {
      const maxAllowedDist = q.collapsed.length >= 6 ? 2 : 1;

      for (const word of titleTokens.words) {
        if (word.length < 2) continue;
        const dist = damerauLevenshtein(q.collapsed, word);
        const prefixTarget =
          word.length > q.collapsed.length
            ? word.slice(0, q.collapsed.length)
            : word;
        const prefixDist = damerauLevenshtein(q.collapsed, prefixTarget);

        if (dist <= maxAllowedDist) {
          tokenScore = Math.max(tokenScore, dist === 1 ? 64 : 52);
          break;
        }
        if (q.collapsed.length >= 4 && prefixDist <= 1) {
          tokenScore = Math.max(tokenScore, 55);
          break;
        }
      }

      if (tokenScore === 0) {
        for (const word of allTokens.words) {
          if (word.length < 3) continue;
          const dist = damerauLevenshtein(q.collapsed, word);
          if (dist <= maxAllowedDist) {
            tokenScore = Math.max(tokenScore, dist === 1 ? 48 : 38);
            break;
          }
        }
      }

      // Skeleton-level fuzzy check (e.g., vowel omission + 1 consonant typo)
      if (tokenScore === 0 && q.skeleton.length >= 3) {
        for (const sk of titleTokens.skeletons) {
          if (sk.length >= 3 && damerauLevenshtein(q.skeleton, sk) <= 1) {
            tokenScore = Math.max(tokenScore, 46);
            break;
          }
        }
      }
    }

    if (tokenScore > 0) {
      matchedTokensCount += 1;
      totalScore += tokenScore;
    }
  }

  // Also test if joining two adjacent query words into one word matches a product word or skeleton
  // (e.g., user typed "مني بسيى" and product has "ميني بي سي")
  if (matchedTokensCount === 0 && rawQueryWords.length >= 2) {
    const joinedQuerySkel = toPhoneticSkeleton(compactQuery);
    if (
      joinedQuerySkel.length >= 3 &&
      allTokens.skeletons.some(
        (sk) =>
          sk === joinedQuerySkel ||
          sk.includes(joinedQuerySkel) ||
          damerauLevenshtein(joinedQuerySkel, sk) <= 1
      )
    ) {
      return 65;
    }
  }

  if (matchedTokensCount === 0) {
    return 0;
  }

  // Reward matching all words in a multi-word query, and lightly penalize partial token matches
  if (queryTerms.length > 1) {
    if (matchedTokensCount === queryTerms.length) {
      totalScore += 65;
    } else {
      totalScore = Math.round(
        totalScore * (matchedTokensCount / queryTerms.length) * 0.85
      );
    }
  }

  return totalScore;
}

/**
 * Builds weighted searchable fields for a product across all its Arabic & English attributes.
 */
function getProductSearchIndex(product: Product) {
  const titleText = `${extractLocalized(product?.title)} ${extractLocalized(product?.name)}`;

  const specsText = Array.isArray(product?.specs)
    ? product.specs
        .map(
          (s) =>
            `${extractLocalized(s?.label)} ${extractLocalized(s?.value)}`
        )
        .join(' ')
    : '';

  const prosText = Array.isArray(product?.pros)
    ? product.pros.map((p) => extractLocalized(p)).join(' ')
    : '';

  const consText = Array.isArray(product?.cons)
    ? product.cons.map((c) => extractLocalized(c)).join(' ')
    : '';

  const metaText = [
    extractLocalized(product?.categoryName),
    product?.categorySlug || '',
    extractLocalized(product?.sourceName),
    product?.sourceSlug || '',
    ...(Array.isArray(product?.tags) ? product.tags : []),
    extractLocalized(product?.shortSummary),
    extractLocalized(product?.whyWePickedIt),
    extractLocalized(product?.whatToConsider),
    extractLocalized(product?.description),
    specsText,
    prosText,
    consText,
    product?.slug || '',
    product?.priceAmount ? String(product.priceAmount) : '',
  ].join(' ');

  return {
    titleText,
    metaText,
  };
}

/**
 * Scores a single product against a user search query.
 * Supports:
 * - Single-letter instant matching (e.g., "ك", "س", "a")
 * - Cross-language & synonym matching (e.g., "pc" <-> "ميني بي سي")
 * - Typo tolerance & phonetic vowel normalization (e.g., "مني بسيى" <-> "ميني بي سي")
 * - Any word (first, middle, or last) or partial word in any order
 * Returns 0 if the product does not match.
 */
export function scoreProductMatch(product: Product, rawQuery: string): number {
  const idx = getProductSearchIndex(product);
  return scoreSmartSearchCandidate(idx.titleText, idx.metaText, rawQuery);
}

/**
 * Scores a single article/buying guide against a user search query
 * across Arabic and English title, category, excerpt, keywords, and body.
 */
export function scoreArticleMatch(article: Article, rawQuery: string): number {
  const normalizedQuery = normalizeSearchText(rawQuery);
  if (!normalizedQuery) return 1;

  const queryTokens = normalizedQuery
    .split(' ')
    .filter(Boolean)
    .map((token) => ({
      raw: token,
      stripped: stripArabicDefiniteArticle(token),
    }));

  if (queryTokens.length === 0) return 1;

  const titleNorm = normalizeSearchText(
    `${extractLocalized(article?.title)} ${extractLocalized(article?.seoTitle)}`
  );
  const titleWords = titleNorm
    .split(' ')
    .filter(Boolean)
    .flatMap((w) => [w, stripArabicDefiniteArticle(w)]);

  const faqText = Array.isArray(article?.faqItems)
    ? article.faqItems
        .map(
          (f) =>
            `${extractLocalized(f?.question)} ${extractLocalized(f?.answer)}`
        )
        .join(' ')
    : '';

  const metaNorm = normalizeSearchText(
    [
      extractLocalized(article?.categoryName),
      article?.categorySlug || '',
      extractLocalized(article?.excerpt),
      extractLocalized(article?.seoDescription),
      extractLocalized(article?.editorVerdict),
      article?.slug || '',
      ...(Array.isArray(article?.seoKeywords) ? article.seoKeywords : []),
    ].join(' ')
  );

  const bodyPlain = `${extractLocalized(article?.contentHtml).replace(/<[^>]*>/g, ' ')} ${faqText}`;
  const bodyNorm = normalizeSearchText(bodyPlain);
  const allText = `${titleNorm} ${metaNorm} ${bodyNorm}`;
  const allWords = allText
    .split(' ')
    .filter(Boolean)
    .flatMap((w) => [w, stripArabicDefiniteArticle(w)]);

  let totalScore = 0;
  let matchedTokensCount = 0;

  if (titleNorm.startsWith(normalizedQuery)) {
    totalScore += 150;
  } else if (titleNorm.includes(normalizedQuery)) {
    totalScore += 105;
  } else if (metaNorm.includes(normalizedQuery)) {
    totalScore += 65;
  } else if (allText.includes(normalizedQuery)) {
    totalScore += 35;
  }

  for (const { raw, stripped } of queryTokens) {
    let tokenScore = 0;
    const candidates = raw === stripped ? [raw] : [raw, stripped];

    for (const term of candidates) {
      if (!term) continue;
      if (titleWords.some((w) => w === term)) {
        tokenScore = Math.max(tokenScore, 100);
      } else if (titleWords.some((w) => w.startsWith(term))) {
        tokenScore = Math.max(tokenScore, 85);
      } else if (titleNorm.includes(term)) {
        tokenScore = Math.max(tokenScore, 65);
      } else if (metaNorm.includes(term)) {
        tokenScore = Math.max(tokenScore, 45);
      } else if (allWords.some((w) => w.startsWith(term))) {
        tokenScore = Math.max(tokenScore, 30);
      } else if (bodyNorm.includes(term)) {
        tokenScore = Math.max(tokenScore, 20);
      }
    }

    if (tokenScore > 0) {
      matchedTokensCount += 1;
      totalScore += tokenScore;
    }
  }

  if (matchedTokensCount === 0) return 0;

  if (matchedTokensCount === queryTokens.length && queryTokens.length > 1) {
    totalScore += 50;
  }

  return totalScore;
}

/**
 * Filters and ranks articles/buying guides by relevance for real-time search.
 * Also matches articles whose category or reviewed products match the user's product search.
 */
export function searchAndRankArticles(
  articles: Article[],
  rawQuery: string,
  products?: Product[]
): Article[] {
  const normalizedQuery = normalizeSearchText(rawQuery);
  if (!normalizedQuery) return articles;

  const matchedProductIds = new Set<string>();
  const matchedProductCategories = new Set<string>();
  if (Array.isArray(products) && products.length > 0) {
    for (const p of products) {
      if (scoreProductMatch(p, rawQuery) > 0) {
        if (p.id) matchedProductIds.add(p.id);
        if (p.slug) matchedProductIds.add(p.slug);
        if (p.categorySlug) matchedProductCategories.add(p.categorySlug);
        if (p.categoryId) matchedProductCategories.add(p.categoryId);
      }
    }
  }

  const scored: Array<{ article: Article; score: number }> = [];
  for (const article of articles) {
    let score = scoreArticleMatch(article, rawQuery);

    if (matchedProductIds.size > 0) {
      const relatedIds = Array.isArray(article.relatedProductIds)
        ? article.relatedProductIds
        : [];
      if (
        (article.topPickProductId &&
          matchedProductIds.has(article.topPickProductId)) ||
        relatedIds.some((id) => matchedProductIds.has(id))
      ) {
        score += 70;
      }
    }

    if (
      matchedProductCategories.size > 0 &&
      ((article.categorySlug &&
        matchedProductCategories.has(article.categorySlug)) ||
        (article.categoryId &&
          matchedProductCategories.has(article.categoryId)))
    ) {
      score += 35;
    }

    if (score > 0) {
      scored.push({ article, score });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.article.publishedAt || '').localeCompare(a.article.publishedAt || '');
  });

  return scored.map((entry) => entry.article);
}

/**
 * Returns direct matches + article-linked matches + similar-category matches
 * for instant live search dropdown previews.
 */
export function findMatchingProducts(
  products: Product[],
  rawQuery: string,
  articles?: Article[]
): Product[] {
  const normalizedQuery = normalizeSearchText(rawQuery);
  if (!normalizedQuery) return products;

  const directMatches: Array<{ product: Product; score: number }> = [];
  const matchedCategories = new Set<string>();
  const matchedTags = new Set<string>();
  const articleRelatedProductKeys = new Set<string>();

  if (Array.isArray(articles) && articles.length > 0) {
    const matchedArticles = searchAndRankArticles(articles, rawQuery);
    for (const art of matchedArticles) {
      if (art.categorySlug) matchedCategories.add(art.categorySlug);
      if (art.categoryId) matchedCategories.add(art.categoryId);
      if (art.topPickProductId) articleRelatedProductKeys.add(art.topPickProductId);
      if (Array.isArray(art.relatedProductIds)) {
        for (const idOrSlug of art.relatedProductIds) {
          if (idOrSlug) articleRelatedProductKeys.add(idOrSlug);
        }
      }
    }
  }

  for (const product of products) {
    let score = scoreProductMatch(product, rawQuery);
    if (
      articleRelatedProductKeys.has(product.id) ||
      articleRelatedProductKeys.has(product.slug)
    ) {
      score += 75;
    }

    if (score > 0) {
      directMatches.push({ product, score });
      if (product.categorySlug) matchedCategories.add(product.categorySlug);
      if (product.categoryId) matchedCategories.add(product.categoryId);
      if (Array.isArray(product.tags)) {
        for (const t of product.tags) {
          const normTag = normalizeSearchText(t);
          if (normTag) matchedTags.add(normTag);
        }
      }
    }
  }

  directMatches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return String(b.product.createdAt || '').localeCompare(
      String(a.product.createdAt || '')
    );
  });

  const directIds = new Set(directMatches.map((entry) => entry.product.id));

  const similarFieldMatches: Array<{ product: Product; similarityScore: number }> = [];
  if (matchedCategories.size > 0 || matchedTags.size > 0) {
    for (const product of products) {
      if (directIds.has(product.id)) continue;

      let similarityScore = 0;
      if (
        (product.categorySlug && matchedCategories.has(product.categorySlug)) ||
        (product.categoryId && matchedCategories.has(product.categoryId))
      ) {
        similarityScore += 30;
      }

      if (Array.isArray(product.tags) && matchedTags.size > 0) {
        for (const t of product.tags) {
          if (matchedTags.has(normalizeSearchText(t))) {
            similarityScore += 15;
          }
        }
      }

      if (similarityScore > 0) {
        similarFieldMatches.push({ product, similarityScore });
      }
    }

    similarFieldMatches.sort((a, b) => {
      if (b.similarityScore !== a.similarityScore) {
        return b.similarityScore - a.similarityScore;
      }
      return String(b.product.createdAt || '').localeCompare(
        String(a.product.createdAt || '')
      );
    });
  }

  return [
    ...directMatches.map((entry) => entry.product),
    ...similarFieldMatches.map((entry) => entry.product),
  ];
}

/**
 * Ranks products by relevance for real-time search:
 * 1. Direct product matches first
 * 2. Products related to matching articles and products in the same/similar category second
 * 3. Remaining catalog products after that so products NEVER disappear from the page during search.
 */
export function searchAndRankProducts(
  products: Product[],
  rawQuery: string,
  articles?: Article[]
): Product[] {
  const normalizedQuery = normalizeSearchText(rawQuery);
  if (!normalizedQuery) return products;

  const matchedAndSimilar = findMatchingProducts(products, rawQuery, articles);
  const includedIds = new Set(matchedAndSimilar.map((p) => p.id));
  const remainingProducts = products.filter((p) => !includedIds.has(p.id));

  return [...matchedAndSimilar, ...remainingProducts];
}

const VISITOR_PROFILE_KEY = 'aqurivo_visitor_profile_v1';

interface VisitorInterestProfile {
  queries: string[];
  categories: string[];
  seed: number;
}

function getOrInitVisitorProfile(): VisitorInterestProfile {
  if (typeof window === 'undefined') {
    return { queries: [], categories: [], seed: 1 };
  }
  try {
    const raw = window.localStorage.getItem(VISITOR_PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<VisitorInterestProfile>;
      return {
        queries: Array.isArray(parsed.queries) ? parsed.queries.slice(0, 8) : [],
        categories: Array.isArray(parsed.categories) ? parsed.categories.slice(0, 8) : [],
        seed:
          typeof parsed.seed === 'number' && Number.isFinite(parsed.seed)
            ? parsed.seed
            : Math.floor(Math.random() * 10000) + 1,
      };
    }
  } catch {}

  const fresh: VisitorInterestProfile = {
    queries: [],
    categories: [],
    seed: Math.floor(Math.random() * 10000) + 1,
  };
  try {
    window.localStorage.setItem(VISITOR_PROFILE_KEY, JSON.stringify(fresh));
  } catch {}
  return fresh;
}

/**
 * Records a visitor's search query or category interest in localStorage
 * so future product listings prioritize matching and similar-field products.
 */
export function recordVisitorInterest(input: {
  query?: string;
  categorySlug?: string;
  products?: Product[];
}): void {
  if (typeof window === 'undefined') return;
  const profile = getOrInitVisitorProfile();

  const normQuery = normalizeSearchText(input.query);
  if (normQuery && normQuery.length >= 2) {
    profile.queries = [
      normQuery,
      ...profile.queries.filter((q) => q !== normQuery),
    ].slice(0, 8);

    // Also infer categories from matching products so similar-field items are boosted
    if (Array.isArray(input.products)) {
      for (const p of input.products) {
        if (scoreProductMatch(p, normQuery) > 0 && p.categorySlug) {
          profile.categories = [
            p.categorySlug,
            ...profile.categories.filter((c) => c !== p.categorySlug),
          ].slice(0, 8);
        }
      }
    }
  }

  if (input.categorySlug && input.categorySlug !== 'all') {
    profile.categories = [
      input.categorySlug,
      ...profile.categories.filter((c) => c !== input.categorySlug),
    ].slice(0, 8);
  }

  try {
    window.localStorage.setItem(VISITOR_PROFILE_KEY, JSON.stringify(profile));
  } catch {}
}

/**
 * Detects the visitor's country/region signal from browser timezone & locale
 * to prioritize stores and products suited to their region.
 */
function getVisitorRegionStoreAffinity(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '').toLowerCase();
    const lang = (navigator.language || '').toLowerCase();

    // Gulf / Middle East region (SA, AE, KW, QA, BH, OM, EG)
    if (
      tz.includes('riyadh') ||
      tz.includes('dubai') ||
      tz.includes('kuwait') ||
      tz.includes('qatar') ||
      tz.includes('bahrain') ||
      tz.includes('muscat') ||
      tz.includes('cairo') ||
      lang.includes('-sa') ||
      lang.includes('-ae') ||
      lang.includes('-kw') ||
      lang.includes('-qa') ||
      lang.includes('-eg')
    ) {
      return ['noon', 'amazon', 'temu'];
    }

    // North Africa / Morocco / Algeria / Tunisia / Europe
    if (
      tz.includes('casablanca') ||
      tz.includes('algiers') ||
      tz.includes('tunis') ||
      tz.includes('europe') ||
      lang.includes('-ma') ||
      lang.includes('-dz') ||
      lang.includes('-tn')
    ) {
      return ['amazon', 'temu', 'aliexpress'];
    }
  } catch {}
  return ['amazon', 'noon', 'temu'];
}

function deterministicHash(str: string, seed: number): number {
  let h = seed ^ 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 1000;
}

/**
 * Dynamically orders products based on:
 * 1. Active search query + similar category/field matches
 * 2. Visitor's past search queries & interested categories (stored locally)
 * 3. Visitor's country/region store affinity
 * 4. Visitor-specific rotation so the catalog feels alive and personalized
 */
export function rankProductsForVisitor(
  products: Product[],
  options?: {
    activeQuery?: string;
    activeCategorySlug?: string;
  }
): Product[] {
  let base = products;

  if (options?.activeCategorySlug && options.activeCategorySlug !== 'all') {
    const catSlug = options.activeCategorySlug;
    const exactCat = base.filter(
      (p) => p.categorySlug === catSlug || p.categoryId === catSlug
    );
    const otherCat = base.filter(
      (p) => p.categorySlug !== catSlug && p.categoryId !== catSlug
    );
    base = exactCat.length > 0 ? [...exactCat, ...otherCat] : base;
  }

  if (options?.activeQuery && options.activeQuery.trim()) {
    return searchAndRankProducts(base, options.activeQuery);
  }

  if (typeof window === 'undefined') {
    return base;
  }

  const profile = getOrInitVisitorProfile();
  const preferredStores = getVisitorRegionStoreAffinity();

  const scored = base.map((product) => {
    let score = 0;

    // 1. Boost products matching visitor's recent searches
    for (let i = 0; i < profile.queries.length; i += 1) {
      const q = profile.queries[i];
      const matchScore = scoreProductMatch(product, q);
      if (matchScore > 0) {
        const recencyWeight = Math.max(1, 4 - i);
        score += matchScore * recencyWeight;
      }
    }

    // 2. Boost products in categories/fields similar to what the visitor searched or browsed
    if (product.categorySlug) {
      const catIndex = profile.categories.indexOf(product.categorySlug);
      if (catIndex !== -1) {
        score += Math.max(25, 90 - catIndex * 15);
      }
    }

    // 3. Country / Region store relevance
    const storeSlug = (product.sourceSlug || product.sourceId || '').toLowerCase();
    const storeRank = preferredStores.indexOf(storeSlug);
    if (storeRank !== -1) {
      score += (preferredStores.length - storeRank) * 8;
    }

    // 4. Visitor-specific tie-breaker seed so products rotate naturally per visitor
    const visitorTieBreaker = deterministicHash(product.id || product.slug, profile.seed) / 1000;
    score += visitorTieBreaker * 12;

    return { product, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((entry) => entry.product);
}

export type ProductFeedEntry =
  | { type: 'product'; product: Product }
  | {
      type: 'article';
      article: Article;
      matchedProduct?: Product;
    };

function nextSeededRandom(state: { seed: number }): number {
  let x = state.seed || 123456789;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  state.seed = x >>> 0;
  return (state.seed % 10000) / 10000;
}

/**
 * Matches an unused review article to a batch of products that just appeared to the user:
 * 1. Exact product reference (topPickProductId, relatedProductIds, or slug in HTML)
 * 2. Same category / field as one of the products in the batch
 * 3. Random available unused article
 */
function pickReviewArticleForBatch(
  batchProducts: Product[],
  articles: Article[],
  usedArticleIds: Set<string>,
  rngState: { seed: number }
): { article: Article; matchedProduct?: Product } | null {
  const available = articles.filter((a) => !usedArticleIds.has(a.id));
  if (available.length === 0) return null;

  // 1. Direct product matches
  const directCandidates: Array<{ article: Article; matchedProduct: Product }> = [];
  for (const product of batchProducts) {
    const prodId = product.id;
    const prodSlug = product.slug;
    for (const article of available) {
      const relatedIds = Array.isArray(article.relatedProductIds)
        ? article.relatedProductIds
        : [];
      const htmlCombined = `${article.contentHtml?.ar || ''} ${article.contentHtml?.en || ''}`;
      if (
        article.topPickProductId === prodId ||
        article.topPickProductId === prodSlug ||
        relatedIds.includes(prodId) ||
        relatedIds.includes(prodSlug) ||
        (prodSlug && htmlCombined.includes(prodSlug))
      ) {
        directCandidates.push({ article, matchedProduct: product });
      }
    }
  }
  if (directCandidates.length > 0) {
    const idx = Math.floor(nextSeededRandom(rngState) * directCandidates.length);
    return directCandidates[idx];
  }

  // 2. Same category / field matches
  const categoryCandidates: Array<{ article: Article; matchedProduct: Product }> = [];
  for (const product of batchProducts) {
    if (!product.categorySlug && !product.categoryId) continue;
    for (const article of available) {
      if (
        (product.categorySlug && article.categorySlug === product.categorySlug) ||
        (product.categoryId && article.categoryId === product.categoryId)
      ) {
        categoryCandidates.push({ article, matchedProduct: product });
      }
    }
  }
  if (categoryCandidates.length > 0) {
    const idx = Math.floor(nextSeededRandom(rngState) * categoryCandidates.length);
    return categoryCandidates[idx];
  }

  // 3. Fallback to a randomly chosen available article
  const fallbackIdx = Math.floor(nextSeededRandom(rngState) * available.length);
  return {
    article: available[fallbackIdx],
    matchedProduct: batchProducts[0],
  };
}

/**
 * Interleaves review articles inside the product feed at randomly chosen intervals
 * from [6, 8, 10, 12, 15] on every visit/session so the user never feels a fixed pattern.
 */
export function buildInterleavedProductFeed(
  products: Product[],
  articles: Article[],
  randomSeed = 1
): ProductFeedEntry[] {
  if (!Array.isArray(articles) || articles.length === 0) {
    return products.map((product) => ({ type: 'product', product }));
  }

  const intervalPool = [6, 8, 10, 12];
  const rngState = { seed: randomSeed || 1 };
  const checkpoints = new Set<number>();

  let cumulative = 0;
  let lastPickedStep = -1;
  while (cumulative < products.length) {
    const candidates = intervalPool.filter((step) => step !== lastPickedStep);
    const chosenStep =
      candidates[Math.floor(nextSeededRandom(rngState) * candidates.length)] ||
      intervalPool[0];
    lastPickedStep = chosenStep;
    cumulative += chosenStep;
    checkpoints.add(cumulative);
  }

  const entries: ProductFeedEntry[] = [];
  const usedArticleIds = new Set<string>();
  let currentBatch: Product[] = [];

  for (let i = 0; i < products.length; i += 1) {
    const product = products[i];
    entries.push({ type: 'product', product });
    currentBatch.push(product);

    const countSoFar = i + 1;
    const remainingProducts = products.length - countSoFar;

    // Ensure at least 4 trailing products exist after an inline article so CSS `grid-auto-flow: row dense`
    // can always backfill every column (2, 3, 4, or 5 columns) in the row above the article without any empty slot.
    if (checkpoints.has(countSoFar) && remainingProducts >= 4) {
      const picked = pickReviewArticleForBatch(
        currentBatch,
        articles,
        usedArticleIds,
        rngState
      );
      if (picked) {
        usedArticleIds.add(picked.article.id);
        entries.push({
          type: 'article',
          article: picked.article,
          matchedProduct: picked.matchedProduct,
        });
      }
      currentBatch = [];
    }
  }

  return entries;
}
