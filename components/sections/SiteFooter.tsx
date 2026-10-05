'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { BrandLogo } from '@/components/ui/BrandLogo';
import styles from './SiteFooter.module.css';

const OFFICIAL_EMAIL = 'soufshop.online@gmail.com';
const OFFICIAL_PHONE_DISPLAY = '+212 684 063 908';
const OFFICIAL_PHONE_HREF = 'tel:+212684063908';
const OFFICIAL_WHATSAPP_URL = 'https://wa.me/212684063908';

export interface SiteFooterProps {
  productsCount?: number;
}

export function SiteFooter({ productsCount }: SiteFooterProps = {}) {
  const { locale, messages } = useI18n();
  const isAr = locale === 'ar';

  const displayCount =
    typeof productsCount === 'number' && productsCount > 0
      ? String(productsCount)
      : '500+';

  return (
    <footer className={styles.footer}>
      <div className={`siteContainer ${styles.footerInner}`}>
        <div className={styles.topGrid}>
          {/* Column 1: Brand & Single Small Disclosure */}
          <div className={styles.brandCol}>
            <Link href="/" className={styles.brandLink}>
              <BrandLogo size="md" />
            </Link>
            <p className={styles.amazonDisclosure}>
              SoufShop يستخدم روابط تسويق بالعمولة — affiliate links
            </p>
          </div>

          {/* Column 2: Explore Links */}
          <div className={styles.linksCol}>
            <h3 className={styles.colHeading}>{messages.footer.quickLinks}</h3>
            <ul className={styles.linkList}>
              <li>
                <Link href={`/${locale}/products`} className={styles.footerLink}>
                  {messages.nav.products}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/guides`} className={styles.footerLink}>
                  {messages.nav.guides}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/about`} className={styles.footerLink}>
                  {messages.nav.ourMethod}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} className={styles.footerLink}>
                  {messages.nav.contact}
                </Link>
              </li>
              <li>
                <Link href="/account" className={styles.footerLink}>
                  {messages.nav.saved}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Transparency */}
          <div className={styles.linksCol}>
            <h3 className={styles.colHeading}>{messages.footer.legalLinks}</h3>
            <ul className={styles.linkList}>
              <li>
                <Link href="/affiliate-disclosure" className={styles.footerLink}>
                  {messages.footer.affiliateDisclosure}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/privacy-policy`} className={styles.footerLink}>
                  {messages.footer.privacy}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/terms`} className={styles.footerLink}>
                  {messages.footer.terms}
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className={styles.footerLink}>
                  {messages.howItWorks.heading}
                </Link>
              </li>
              <li>
                <Link href="/cookies" className={styles.footerLink}>
                  {messages.footer.cookieSettings}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Direct Verified Contact */}
          <div className={styles.contactCol}>
            <h3 className={styles.colHeading}>{messages.footer.contactHeading}</h3>
            <address className={styles.contactAddress}>
              <a href={`mailto:${OFFICIAL_EMAIL}`} className={styles.contactLink}>
                <Mail size={15} aria-hidden="true" />
                <span>{OFFICIAL_EMAIL}</span>
              </a>
              <a
                href={OFFICIAL_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.contactLink}
              >
                <MessageCircle size={15} aria-hidden="true" />
                <span dir="ltr" className="tabularNums">
                  WhatsApp: +212 684 063908
                </span>
              </a>
              <a href={OFFICIAL_PHONE_HREF} className={styles.contactLink}>
                <Phone size={15} aria-hidden="true" />
                <span dir="ltr" className="tabularNums">
                  {OFFICIAL_PHONE_DISPLAY}
                </span>
              </a>
              <a
                href={OFFICIAL_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.whatsappButton}
              >
                <MessageCircle size={15} aria-hidden="true" />
                <span>{messages.footer.whatsappCta}</span>
              </a>
            </address>
          </div>
        </div>

        <div className={styles.bottomBar}>
          <p className={`${styles.copyright} tabularNums`}>
            {isAr
              ? '© 2026 SoufShop — جميع الحقوق محفوظة'
              : '© 2026 SoufShop — All rights reserved'}
          </p>

          <address className={styles.bottomAddress}>
            <a href={`mailto:${OFFICIAL_EMAIL}`}>{OFFICIAL_EMAIL}</a>
            <span aria-hidden="true">·</span>
            <a href={OFFICIAL_WHATSAPP_URL}>WhatsApp: +212 684 063908</a>
          </address>
        </div>
      </div>
    </footer>
  );
}
