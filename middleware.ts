import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const locales = ['en', 'ar'] as const;
export const defaultLocale = 'en';

const STRICT_CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://trustedorigin.org https://*.trustedorigin.org https://apis.google.com https://www.gstatic.com https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline' https://trustedorigin.org https://*.trustedorigin.org https://fonts.googleapis.com",
  "img-src 'self' data: blob: https: http: https://res.cloudinary.com https://trustedorigin.org https://*.trustedorigin.org",
  "font-src 'self' https://fonts.gstatic.com https://trustedorigin.org https://*.trustedorigin.org",
  "connect-src 'self' https://trustedorigin.org https://*.trustedorigin.org https://dns.google https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebasestorage.app https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://api.cloudinary.com https://res.cloudinary.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com",
  "frame-src 'self' https://trustedorigin.org https://*.trustedorigin.org https://*.firebaseapp.com https://accounts.google.com https://www.youtube-nocookie.com https://www.youtube.com https://player.vimeo.com",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('Content-Security-Policy', STRICT_CSP_HEADER);
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const detectedCountry =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-country-code') ||
    request.headers.get('x-appengine-country') ||
    '';

  if (pathname === '/') {
    const cookieLocale = request.cookies.get('soufshop_locale')?.value;
    const targetLocale =
      cookieLocale === 'ar' || cookieLocale === 'en'
        ? cookieLocale
        : defaultLocale;

    const url = request.nextUrl.clone();
    url.pathname = `/${targetLocale}`;
    const response = NextResponse.redirect(url, 307);
    if (
      detectedCountry &&
      /^[A-Z]{2}$/i.test(detectedCountry) &&
      detectedCountry.toUpperCase() !== 'XX'
    ) {
      response.cookies.set('aqurivo_country', detectedCountry.toUpperCase(), {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
      });
    }
    return applySecurityHeaders(response);
  }

  const response = NextResponse.next();
  if (
    detectedCountry &&
    /^[A-Z]{2}$/i.test(detectedCountry) &&
    detectedCountry.toUpperCase() !== 'XX'
  ) {
    response.cookies.set('aqurivo_country', detectedCountry.toUpperCase(), {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
    });
  }
  return applySecurityHeaders(response);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)'],
};
