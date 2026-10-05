import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  detectDeviceType,
  getClientIpFromHeaders,
  hashClientIpDaily,
  isKnownBotUserAgent,
} from '@/server/middleware/security';
import { getProductBySlugAnyStatus } from '@/server/repositories/products.repo';
import { recordOutboundClick } from '@/server/repositories/clicks.repo';
import { loadServerEnv } from '@/server/config/env';

const SAFE_SLUG_PATTERN = /^[a-z0-9-]+$/;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const cleanSlug = (slug || '').trim().toLowerCase();
  const env = loadServerEnv();

  if (!cleanSlug || cleanSlug.length > 120 || !SAFE_SLUG_PATTERN.test(cleanSlug)) {
    return NextResponse.redirect(new URL('/not-found', env.siteUrl), 307);
  }

  const product = await getProductBySlugAnyStatus(cleanSlug);

  // Edge Case 1: Product does not exist at all -> 404
  if (!product) {
    return NextResponse.redirect(new URL('/not-found', env.siteUrl), 307);
  }

  // Edge Case 2: Product is inactive/draft/archived or affiliate link is missing/invalid
  let targetUrl: URL | null = null;
  try {
    targetUrl = new URL(product.affiliateUrl);
    if (targetUrl.protocol !== 'https:') {
      targetUrl = null;
    }
  } catch {
    targetUrl = null;
  }

  if (product.status !== 'published' || !targetUrl) {
    const fallbackUrl = new URL('/go/unavailable', env.siteUrl);
    fallbackUrl.searchParams.set('slug', product.slug);
    fallbackUrl.searchParams.set('cat', product.categorySlug);
    return NextResponse.redirect(fallbackUrl, 307);
  }

  // Privacy-First Click Tracking (Exclude bots & enforce rate limit)
  const userAgent = req.headers.get('user-agent');
  const rawIp = await getClientIpFromHeaders();
  const ipDailyHash = hashClientIpDaily(rawIp);

  const isBot = isKnownBotUserAgent(userAgent);
  const rate = checkRateLimit(`outbound_click:${ipDailyHash}:${product.id}`, 5, 60 * 1000);

  if (!isBot && rate.allowed) {
    const countryHeader =
      req.headers.get('x-vercel-ip-country') ||
      req.headers.get('cf-ipcountry') ||
      'UN';

    const localeCookie = req.cookies.get('soufshop_locale')?.value;
    const locale = localeCookie === 'ar' ? 'ar' : 'en';
    const refContext = req.nextUrl.searchParams.get('ref') || 'direct';

    await recordOutboundClick({
      productId: product.id,
      productSlug: product.slug,
      sourceId: product.sourceId,
      sourceSlug: product.sourceSlug,
      ipDailyHash,
      countryCode: countryHeader,
      deviceType: detectDeviceType(userAgent),
      locale,
      refContext,
    });
  }

  const response = NextResponse.redirect(targetUrl.toString(), 307);
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}
