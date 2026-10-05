'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { Direction, Locale, LocalizedText } from '@/types';
import {
  DEFAULT_LOCALE,
  getDictionary,
  getDirection,
  interpolateMessage,
  pickLocalizedText,
} from './index';
import type { MessagesDictionary } from './en';

interface I18nContextValue {
  locale: Locale;
  dir: Direction;
  messages: MessagesDictionary;
  setLocale: (nextLocale: Locale) => void;
  t: (text: LocalizedText | undefined) => string;
  formatTemplate: (template: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const LOCALE_STORAGE_KEY = 'soufshop_locale';

function resolvePathLocale(pathname: string | null): Locale | null {
  if (!pathname) return null;
  if (pathname === '/en' || pathname.startsWith('/en/')) return 'en';
  if (pathname === '/ar' || pathname.startsWith('/ar/')) return 'ar';
  return null;
}

function buildLocalizedPathname(pathname: string | null, nextLocale: Locale): string | null {
  if (!pathname) return null;
  if (pathname === '/en' || pathname === '/ar') {
    return `/${nextLocale}`;
  }
  if (pathname.startsWith('/en/')) {
    return `/${nextLocale}${pathname.slice(3)}`;
  }
  if (pathname.startsWith('/ar/')) {
    return `/${nextLocale}${pathname.slice(3)}`;
  }
  return null;
}

export function I18nProvider({
  initialLocale = DEFAULT_LOCALE,
  children,
}: {
  initialLocale?: Locale;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const pathLocale = resolvePathLocale(pathname);
  const [userLocale, setUserLocale] = useState<Locale>(pathLocale || initialLocale);
  const locale: Locale = userLocale;

  useEffect(() => {
    if (pathLocale) {
      setUserLocale(pathLocale);
      return;
    }
    try {
      const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (saved === 'en' || saved === 'ar') {
        setUserLocale(saved);
      }
    } catch {
      // Ignore storage access errors in restricted browsing modes
    }
  }, [pathLocale]);

  useEffect(() => {
    const dir = getDirection(locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale]);

  const setLocale = useCallback(
    (nextLocale: Locale) => {
      setUserLocale(nextLocale);
      try {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
        document.cookie = `${LOCALE_STORAGE_KEY}=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
      } catch {
        // Ignore cookie/storage write failures
      }

      const nextPath = buildLocalizedPathname(pathname, nextLocale);
      if (nextPath && nextPath !== pathname) {
        const search = typeof window !== 'undefined' ? window.location.search : '';
        router.push(`${nextPath}${search}`);
      }
    },
    [pathname, router]
  );

  const t = useCallback(
    (text: LocalizedText | undefined) => pickLocalizedText(text, locale),
    [locale]
  );

  const dir = getDirection(locale);
  const messages = getDictionary(locale);

  return (
    <I18nContext.Provider
      value={{
        locale,
        dir,
        messages,
        setLocale,
        t,
        formatTemplate: interpolateMessage,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
