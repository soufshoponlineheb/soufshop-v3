'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, MessageCircle } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { SiteHeader } from '@/components/sections/SiteHeader';
import { SiteFooter } from '@/components/sections/SiteFooter';
import { SignatureMotif } from '@/components/ui/SignatureMotif';
import styles from './AboutView.module.css';

interface TeamMemberItem {
  id: string;
  nameAr: string;
  nameEn: string;
  initialAr: string;
  initialEn: string;
  roleAr: string;
  roleEn: string;
  avatarClass: string;
}

const SOUFSHOP_TEAM: TeamMemberItem[] = [
  {
    id: 'soufiane',
    nameAr: 'سفيان',
    nameEn: 'Soufiane',
    initialAr: 'س',
    initialEn: 'S',
    roleAr: 'مؤسس SoufShop ومدير مشروع souftools ai',
    roleEn: 'Founder of SoufShop & Project Lead at souftools ai',
    avatarClass: styles.avatarEmerald,
  },
  {
    id: 'said',
    nameAr: 'سعيد',
    nameEn: 'Said',
    initialAr: 'س',
    initialEn: 'S',
    roleAr: 'مسؤول التسويق',
    roleEn: 'Marketing Lead',
    avatarClass: styles.avatarTerracotta,
  },
  {
    id: 'ilyas',
    nameAr: 'إلياس',
    nameEn: 'Ilyas',
    initialAr: 'إ',
    initialEn: 'I',
    roleAr: 'مسؤول المحتوى',
    roleEn: 'Content Manager',
    avatarClass: styles.avatarTeal,
  },
  {
    id: 'khaoula',
    nameAr: 'خولة',
    nameEn: 'Khaoula',
    initialAr: 'خ',
    initialEn: 'K',
    roleAr: 'مسؤولة المحتوى',
    roleEn: 'Content Manager',
    avatarClass: styles.avatarOlive,
  },
  {
    id: 'farah',
    nameAr: 'فراح',
    nameEn: 'Farah',
    initialAr: 'ف',
    initialEn: 'F',
    roleAr: 'مصممة',
    roleEn: 'Designer',
    avatarClass: styles.avatarClay,
  },
];

export function AboutView() {
  const { locale, messages } = useI18n();
  const isAr = locale === 'ar';

  return (
    <div className={styles.pageShell}>
      <SiteHeader />

      <main id="main-content" className={`siteContainer ${styles.main}`}>
        {/* 1. About SoufShop */}
        <header className={`${styles.heroBlock} revealUp`}>
          <SignatureMotif index="01" label={messages.about.heading} />
          <h1 className={styles.heroTitle}>{messages.about.heading}</h1>

          <div className={styles.staticIdentityBlock}>
            <p className={styles.paragraph}>{messages.about.p1}</p>
            <p className={styles.paragraph}>{messages.about.p2}</p>
            <p className={styles.paragraph}>{messages.about.p3}</p>
          </div>
        </header>

        {/* 2. Our Team Section (Founder Quote + 5 Horizontal Team Cards) */}
        <section className={styles.sectionBlock} aria-labelledby="our-team-heading">
          <SignatureMotif index="02" label={messages.about.teamHeading} />

          <div className={styles.teamHeader}>
            <h2 id="our-team-heading" className={styles.sectionHeading}>
              {messages.about.teamHeading}
            </h2>
            <p className={styles.teamIntro}>{messages.about.teamIntro}</p>
          </div>

          {/* Founder Quote above team cards */}
          <blockquote className={styles.founderQuoteBox}>
            <p className={styles.founderQuoteText}>
              &ldquo;{messages.about.founderQuote}&rdquo;
            </p>
            <cite className={styles.founderQuoteAuthor}>
              {messages.about.founderSignature}
            </cite>
          </blockquote>

          {/* Team Cards Grid (2 or 3 per row) */}
          <div className={styles.teamGrid}>
            {SOUFSHOP_TEAM.map((member) => {
              const displayName = isAr ? member.nameAr : member.nameEn;
              const displayInitial = isAr ? member.initialAr : member.initialEn;
              const displayRole = isAr ? member.roleAr : member.roleEn;

              return (
                <article key={member.id} className={styles.teamCard}>
                  <div
                    className={`${styles.teamAvatar} ${member.avatarClass}`}
                    aria-hidden="true"
                  >
                    {displayInitial}
                  </div>
                  <div className={styles.teamInfo}>
                    <h3 className={styles.teamName}>{displayName}</h3>
                    <p className={styles.teamRole}>{displayRole}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* 3. Contact Information below Team */}
        <section className={styles.sectionBlock}>
          <SignatureMotif
            index="03"
            label={isAr ? 'معلومات التواصل' : 'Contact Information'}
          />
          <div className={styles.contactStrip}>
            <div className={styles.contactIntro}>
              <p className={styles.paragraph}>
                {isAr
                  ? 'البريد: soufshop.online@gmail.com | واتساب: +212684063908'
                  : 'Email: soufshop.online@gmail.com | WhatsApp: +212684063908'}
              </p>
            </div>

            <address className={styles.contactLinksRow}>
              <a href="mailto:soufshop.online@gmail.com" className={styles.contactPill}>
                <Mail size={16} aria-hidden="true" />
                <span>soufshop.online@gmail.com</span>
              </a>

              <a
                href="https://wa.me/212684063908"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.contactPillAccent}
              >
                <MessageCircle size={16} aria-hidden="true" />
                <span dir="ltr">WhatsApp: +212684063908</span>
              </a>

              <Link href="/contact" className={styles.contactPill}>
                <span>{isAr ? 'صفحة التواصل' : 'Contact Page'}</span>
              </Link>
            </address>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
