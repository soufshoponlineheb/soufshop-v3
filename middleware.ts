import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const locales = ['en', 'ar'] as const;
export const defaultLocale = 'en';

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
    if (detectedCountry && /^[A-Z]{2}$/i.test(detectedCountry) && detectedCountry.toUpperCase() !== 'XX') {
      response.cookies.set('aqurivo_country', detectedCountry.toUpperCase(), {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
      });
    }
    return response;
  }

  const response = NextResponse.next();
  if (detectedCountry && /^[A-Z]{2}$/i.test(detectedCountry) && detectedCountry.toUpperCase() !== 'XX') {
    response.cookies.set('aqurivo_country', detectedCountry.toUpperCase(), {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
    });
  }
  return response;
}

export const config = {
  matcher: ['/'],
};
