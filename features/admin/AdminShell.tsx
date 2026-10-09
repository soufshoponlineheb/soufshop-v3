'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  FileText,
  Flag,
  FolderTree,
  Globe,
  Inbox,
  LayoutDashboard,
  Moon,
  Package,
  Settings,
  Store,
  Sun,
  Users,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/components/ui/ThemeProvider';
import { useSaved } from '@/features/saved/SavedProvider';
import { BrandLogo } from '@/components/ui/BrandLogo';
import styles from './AdminShell.module.css';

export interface AdminShellProps {
  adminEmail: string;
  firebaseAdminReady: boolean;
  cloudinaryReady: boolean;
  initialNewReportsCount?: number;
  children: React.ReactNode;
}

export function AdminShell({
  adminEmail,
  firebaseAdminReady,
  cloudinaryReady,
  initialNewReportsCount = 0,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { user, authLoading } = useSaved();
  const isAr = locale === 'ar';

  const [newReportsCount, setNewReportsCount] = useState<number>(
    initialNewReportsCount
  );

  useEffect(() => {
    setNewReportsCount(initialNewReportsCount);
  }, [initialNewReportsCount]);

  useEffect(() => {
    const handleReportsCount = (e: Event) => {
      const custom = e as CustomEvent<{ newCount?: number }>;
      if (typeof custom.detail?.newCount === 'number') {
        setNewReportsCount(custom.detail.newCount);
      }
    };
    window.addEventListener('aqurivo-reports-count', handleReportsCount);
    return () => {
      window.removeEventListener('aqurivo-reports-count', handleReportsCount);
    };
  }, []);

  const effectiveEmail = adminEmail || (user?.role === 'admin' ? user.email : '');

  useEffect(() => {
    if (adminEmail) return;
    if (authLoading) return;

    if (!user) {
      router.replace('/login?next=/admin');
    } else if (user.role !== 'admin') {
      router.replace('/account');
    }
  }, [adminEmail, authLoading, user, router]);

  if (!effectiveEmail) {
    return null;
  }

  const navItems: Array<{
    href: string;
    label: string;
    icon: React.ComponentType<{ size?: number; 'aria-hidden'?: boolean | 'true' | 'false' }>;
    exact?: boolean;
    badgeCount?: number;
  }> = [
    {
      href: '/admin',
      label: isAr ? 'لوحة المعلومات' : 'Overview',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: '/admin/products',
      label: isAr ? 'المنتجات' : 'Products',
      icon: Package,
    },
    {
      href: '/admin/categories',
      label: isAr ? 'الفئات' : 'Categories',
      icon: FolderTree,
    },
    {
      href: '/admin/amazon',
      label: isAr ? 'استيراد Amazon' : 'Amazon Import',
      icon: Store,
    },
    {
      href: '/admin/sources',
      label: isAr ? 'المصادر الشريكة' : 'Partner Sources',
      icon: Store,
    },
    {
      href: '/admin/articles',
      label: isAr ? 'أدلة الشراء' : 'Buying Guides',
      icon: FileText,
    },
    {
      href: '/admin/reports',
      label: isAr ? 'البلاغات والمساعدة' : 'Issue Reports',
      icon: Flag,
      badgeCount: newReportsCount,
    },
    {
      href: '/admin/messages',
      label: isAr ? 'الرسائل الواردة' : 'Messages',
      icon: Inbox,
    },
    {
      href: '/admin/testimonials',
      label: isAr ? 'شهادات الزوار' : 'Testimonials',
      icon: Inbox,
    },
    {
      href: '/admin/analytics',
      label: isAr ? 'تقارير النقرات' : 'Click Analytics',
      icon: BarChart3,
    },
    {
      href: '/admin/users',
      label: isAr ? 'المستخدمون' : 'Users',
      icon: Users,
    },
    {
      href: '/admin/settings',
      label: isAr ? 'الإعدادات' : 'Settings',
      icon: Settings,
    },
  ];

  return (
    <div className={styles.adminLayout}>
      {/* Operational Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <div className={styles.brandGroup}>
            <BrandLogo size="sm" />
            <span className={styles.adminBadge}>
              {isAr ? 'الإدارة' : 'Admin'}
            </span>
          </div>
          <Link href="/" className={styles.backToSiteTopBtn}>
            {isAr ? (
              <ArrowRight size={15} aria-hidden="true" />
            ) : (
              <ArrowLeft size={15} aria-hidden="true" />
            )}
            <span>{isAr ? 'الرجوع للموقع' : 'Back to Site'}</span>
          </Link>
        </div>

        <nav className={styles.navMenu} aria-label="Admin Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
              >
                <Icon size={17} aria-hidden="true" />
                <span>{item.label}</span>
                {typeof item.badgeCount === 'number' && item.badgeCount > 0 && (
                  <span className={styles.navCountBadge}>
                    {item.badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.readinessBlock}>
            <div className={styles.readinessRow}>
              <span
                className={`${styles.statusDot} ${
                  firebaseAdminReady ? styles.dotReady : styles.dotPending
                }`}
              />
              <span>
                {isAr ? 'قاعدة البيانات: ' : 'Database: '}
                <strong>
                  {firebaseAdminReady
                    ? isAr
                      ? 'متصلة'
                      : 'Connected'
                    : isAr
                      ? 'غير مُعدّة بعد'
                      : 'Not set up'}
                </strong>
              </span>
            </div>
            <div className={styles.readinessRow}>
              <span
                className={`${styles.statusDot} ${
                  cloudinaryReady ? styles.dotReady : styles.dotPending
                }`}
              />
              <span>
                {isAr ? 'رفع الصور: ' : 'Image Upload: '}
                <strong>
                  {cloudinaryReady
                    ? isAr
                      ? 'جاهز'
                      : 'Ready'
                    : isAr
                      ? 'غير مُعدّ بعد'
                      : 'Not set up'}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={styles.workspace}>
        <header className={styles.topBar}>
          <div className={styles.adminIdentity}>
            <span className={styles.identityLabel}>
              {isAr ? 'المدير المسجل:' : 'Signed in as:'}
            </span>
            <strong className={styles.identityEmail}>{effectiveEmail}</strong>
          </div>

          <div className={styles.topBarActions}>
            <button
              type="button"
              onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
              className={styles.topBarBtn}
            >
              <Globe size={15} aria-hidden="true" />
              <span>{locale === 'en' ? 'العربية' : 'EN'}</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className={styles.topBarBtn}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            <Link href="/" className={styles.storefrontLink}>
              {isAr ? (
                <ArrowRight size={15} aria-hidden="true" />
              ) : (
                <ArrowLeft size={15} aria-hidden="true" />
              )}
              <span>{isAr ? 'الرجوع إلى الموقع' : 'Back to Website'}</span>
            </Link>
          </div>
        </header>

        <main className={styles.mainContent}>{children}</main>
      </div>
    </div>
  );
}
