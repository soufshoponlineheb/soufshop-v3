'use client';

import React from 'react';
import { Play } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './ProductVideo.module.css';

export interface ProductVideoProps {
  videoUrl?: string;
  title?: string;
}

function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host.includes('youtu.be')) {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id || null;
    }

    if (host.includes('youtube.com')) {
      const vParam = parsed.searchParams.get('v');
      if (vParam) return vParam;

      const segments = parsed.pathname.split('/').filter(Boolean);
      const markerIdx = segments.findIndex(
        (s) => s === 'embed' || s === 'shorts' || s === 'v'
      );
      if (markerIdx !== -1 && segments[markerIdx + 1]) {
        return segments[markerIdx + 1];
      }
    }
  } catch {
    // Fallback regex
  }

  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i
  );
  return match ? match[1] : null;
}

function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/|channels\/[^/]+\/)?(\d+)/i);
  return match ? match[1] : null;
}

function isDirectVideoFile(url: string): boolean {
  const cleanPath = url.split('?')[0].split('#')[0].toLowerCase();
  return (
    cleanPath.endsWith('.mp4') ||
    cleanPath.endsWith('.webm') ||
    cleanPath.endsWith('.ogg')
  );
}

export function ProductVideo({ videoUrl, title }: ProductVideoProps) {
  const { locale } = useI18n();
  const isAr = locale === 'ar';

  const rawUrl = videoUrl?.trim() || '';
  if (!rawUrl) {
    return null;
  }

  const normalizedUrl = /^https?:\/\//i.test(rawUrl)
    ? rawUrl
    : `https://${rawUrl}`;
  const lowerUrl = normalizedUrl.toLowerCase();

  const isYouTube =
    lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be');
  const isVimeo = lowerUrl.includes('vimeo.com');
  const isDirectVideo = isDirectVideoFile(normalizedUrl);
  const isTikTok = lowerUrl.includes('tiktok.com');
  const isInstagram = lowerUrl.includes('instagram.com');

  const youtubeId = isYouTube ? extractYouTubeId(normalizedUrl) : null;
  const vimeoId = isVimeo ? extractVimeoId(normalizedUrl) : null;

  let externalLabel = isAr ? 'شاهد الفيديو ↗' : 'Watch Video ↗';
  if (isTikTok) {
    externalLabel = isAr ? 'شاهد على TikTok ↗' : 'Watch on TikTok ↗';
  } else if (isInstagram) {
    externalLabel = isAr ? 'شاهد على Instagram ↗' : 'Watch on Instagram ↗';
  }

  return (
    <section
      className={styles.videoSection}
      aria-labelledby="product-video-heading"
    >
      <h2 id="product-video-heading" className={styles.sectionHeading}>
        <Play size={18} className={styles.headingIcon} aria-hidden="true" />
        <span>{isAr ? 'شاهد المنتج' : 'Watch Product'}</span>
      </h2>

      <div className={styles.aspectContainer}>
        {youtubeId ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(
              youtubeId
            )}?rel=0`}
            title={title || (isAr ? 'شاهد المنتج' : 'Watch Product')}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className={styles.mediaEmbed}
          />
        ) : vimeoId ? (
          <iframe
            src={`https://player.vimeo.com/video/${encodeURIComponent(vimeoId)}`}
            title={title || (isAr ? 'شاهد المنتج' : 'Watch Product')}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className={styles.mediaEmbed}
          />
        ) : isDirectVideo ? (
          <video
            src={normalizedUrl}
            controls
            playsInline
            preload="metadata"
            className={styles.mediaEmbed}
          >
            {isAr
              ? 'متصفحك لا يدعم تشغيل الفيديو المباشر.'
              : 'Your browser does not support embedded video playback.'}
          </video>
        ) : (
          <div className={styles.externalCard}>
            <span className={styles.playCircle} aria-hidden="true">
              <Play size={24} />
            </span>
            <a
              href={normalizedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.externalBtn}
            >
              {externalLabel}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
