import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const locales = ['en', 'ar'] as const;
export const defaultLocale = 'en';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/') {
    const cookieLocale = request.cookies.get('soufshop_locale')?.value;
    const targetLocale =
      cookieLocale === 'ar' || cookieLocale === 'en'
        ? cookieLocale
        : defaultLocale;

    const url = request.nextUrl.clone();
    url.pathname = `/${targetLocale}`;
    return NextResponse.redirect(url, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
