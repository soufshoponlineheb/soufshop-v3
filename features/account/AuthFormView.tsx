'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import {
  createGoogleProvider,
  getFirebaseClientAuth,
  isFirebaseClientConfigured,
} from '@/lib/firebase-client';
import { useI18n } from '@/i18n/I18nProvider';
import { useSaved } from '@/features/saved/SavedProvider';
import { SiteHeader } from '@/components/sections/SiteHeader';
import { SiteFooter } from '@/components/sections/SiteFooter';
import { SignatureMotif } from '@/components/ui/SignatureMotif';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import styles from './AuthFormView.module.css';

interface AuthFormViewProps {
  mode: 'login' | 'register';
}

export function AuthFormView({ mode }: AuthFormViewProps) {
  const { locale } = useI18n();
  const { user, refreshSession } = useSaved();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clientReady = isFirebaseClientConfigured();

  const getRedirectDestination = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const nextPath = params.get('next');
      if (nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//')) {
        return nextPath;
      }
    }
    return '/';
  };

  useEffect(() => {
    if (user) {
      router.replace(getRedirectDestination());
    }
  }, [user, router]);

  const exchangeTokenForSession = async (idToken: string) => {
    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (res.ok) {
        const data = (await res.json()) as { csrfToken?: string };
        if (data.csrfToken) {
          try {
            window.sessionStorage.setItem('soufshop_session_token', data.csrfToken);
          } catch {
            // Ignore sessionStorage errors
          }
        }
      }
    } catch {
      // Even if cookie exchange fails, Firebase client state is active
    }
    await refreshSession();
    router.replace(getRedirectDestination());
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const auth = getFirebaseClientAuth();
    if (!auth) {
      setErrorMessage(
        locale === 'ar'
          ? 'خدمة تسجيل الدخول قيد الإعداد حالياً. يمكنك حفظ المنتجات على جهازك مباشرة دون حساب.'
          : 'Sign-in is currently being set up. You can save items directly on your device without an account.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const credential =
        mode === 'register'
          ? await createUserWithEmailAndPassword(auth, email.trim(), password)
          : await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await credential.user.getIdToken();
      await exchangeTokenForSession(idToken);
    } catch (err) {
      const code =
        err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
      if (code === 'auth/email-already-in-use') {
        setErrorMessage(
          locale === 'ar'
            ? 'هذا البريد الإلكتروني مسجل بالفعل. انتقل إلى صفحة تسجيل الدخول.'
            : 'This email is already registered. Please sign in instead.'
        );
      } else if (code === 'auth/operation-not-allowed') {
        setErrorMessage(
          locale === 'ar'
            ? 'يرجى تفعيل الدخول بالبريد وكلمة المرور (Email/Password) من قسم Sign-in method في لوحة تحكم Firebase.'
            : 'Please enable Email/Password sign-in in your Firebase Console (Authentication → Sign-in method).'
        );
      } else {
        setErrorMessage(
          locale === 'ar'
            ? 'يرجى التأكد من صحة البريد الإلكتروني وكلمة المرور (أو أنشئ حساباً جديداً إذا كانت هذه المرة الأولى).'
            : 'Please check your email and password (or create a new account if this is your first time).'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    const auth = getFirebaseClientAuth();
    if (!auth) {
      setErrorMessage(
        locale === 'ar'
          ? 'خدمة تسجيل الدخول قيد الإعداد حالياً. يمكنك حفظ المنتجات على جهازك مباشرة دون حساب.'
          : 'Sign-in is currently being set up. You can save items directly on your device without an account.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const provider = createGoogleProvider();
      const credential = await signInWithPopup(auth, provider);
      const idToken = await credential.user.getIdToken();
      await exchangeTokenForSession(idToken);
    } catch (err) {
      const code =
        err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
      if (code === 'auth/unauthorized-domain') {
        setErrorMessage(
          locale === 'ar'
            ? 'يرجى إضافة نطاق المعاينة الحالي في قسم Authorized domains داخل إعدادات Firebase Authentication.'
            : 'Please add the current preview domain to Authorized domains in Firebase Authentication settings.'
        );
      } else {
        setErrorMessage(
          locale === 'ar'
            ? 'لم تكتمل عملية الدخول عبر Google. يمكنك المحاولة مرة أخرى أو استخدام البريد وكلمة المرور.'
            : 'Google sign-in was cancelled or could not be completed. Please try again.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageShell}>
      <SiteHeader />

      <main id="main-content" className={`siteContainer ${styles.main}`}>
        <section className={styles.authCard}>
          <SignatureMotif
            index="01"
            label={
              mode === 'login'
                ? locale === 'ar'
                  ? 'تسجيل الدخول'
                  : 'Sign In'
                : locale === 'ar'
                  ? 'إنشاء حساب اختياري'
                  : 'Optional Account'
            }
          />

          <h1 className={styles.title}>
            {mode === 'login'
              ? locale === 'ar'
                ? 'مرحباً بعودتك إلى AQURIVO'
                : 'Welcome back to AQURIVO'
              : locale === 'ar'
                ? 'احفظ مختاراتك عبر جميع أجهزتك'
                : 'Sync your saved picks across devices'}
          </h1>

          <p className={styles.subtitle}>
            {locale === 'ar'
              ? 'إنشاء الحساب اختياري تماماً؛ يمكنك دائماً التصفح والشراء وحفظ المفضلة على جهازك دون تسجيل.'
              : 'Accounts are completely optional. You can always browse, shop, and save items locally without signing in.'}
          </p>

          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={handleGoogleSignIn}
            disabled={isSubmitting || !clientReady}
          >
            {locale === 'ar' ? 'المتابعة باستخدام Google' : 'Continue with Google'}
          </Button>

          <div className={styles.divider}>
            <span>{locale === 'ar' ? 'أو عبر البريد الإلكتروني' : 'or with email'}</span>
          </div>

          <form onSubmit={handleEmailSubmit} className={styles.form}>
            <Input
              type="email"
              label={locale === 'ar' ? 'البريد الإلكتروني' : 'Email address'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              type="password"
              label={locale === 'ar' ? 'كلمة المرور' : 'Password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />

            {errorMessage && (
              <p className={styles.errorBanner} role="alert">
                {errorMessage}
              </p>
            )}

            <Button type="submit" fullWidth isLoading={isSubmitting}>
              {mode === 'login'
                ? locale === 'ar'
                  ? 'تسجيل الدخول'
                  : 'Sign In'
                : locale === 'ar'
                  ? 'إنشاء الحساب'
                  : 'Create Account'}
            </Button>
          </form>

          <div className={styles.switchFooter}>
            {mode === 'login' ? (
              <p>
                {locale === 'ar' ? 'ليس لديك حساب؟ ' : "Don't have an account? "}
                <Link href="/register" className={styles.switchLink}>
                  {locale === 'ar' ? 'أنشئ حساباً' : 'Create one'}
                </Link>
              </p>
            ) : (
              <p>
                {locale === 'ar' ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}
                <Link href="/login" className={styles.switchLink}>
                  {locale === 'ar' ? 'سجّل الدخول' : 'Sign in'}
                </Link>
              </p>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
