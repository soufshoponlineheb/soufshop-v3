'use client';

import React, { useState } from 'react';
import styles from './ProductPage.module.css';

interface GalleryImage {
  url: string;
  alt?: { ar?: string; en?: string } | string;
}

interface ProductGalleryProps {
  images: GalleryImage[];
  videoUrl?: string;
  productTitle: string;
}

function formatVideoEmbedUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();

  try {
    // 1. YouTube short links: youtu.be/ID
    const youtuBeMatch = trimmed.match(
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)/i
    );
    if (youtuBeMatch && youtuBeMatch[1]) {
      return `https://www.youtube.com/embed/${youtuBeMatch[1]}?autoplay=1`;
    }

    // 2. YouTube standard links: youtube.com/watch?v=ID
    const ytWatchMatch = trimmed.match(
      /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]+)/i
    );
    if (ytWatchMatch && ytWatchMatch[1]) {
      return `https://www.youtube.com/embed/${ytWatchMatch[1]}?autoplay=1`;
    }

    // 3. YouTube Shorts: youtube.com/shorts/ID
    const ytShortsMatch = trimmed.match(
      /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/i
    );
    if (ytShortsMatch && ytShortsMatch[1]) {
      return `https://www.youtube.com/embed/${ytShortsMatch[1]}?autoplay=1`;
    }

    // 4. Already an embed link: youtube.com/embed/ID
    const ytEmbedMatch = trimmed.match(
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)/i
    );
    if (ytEmbedMatch && ytEmbedMatch[1]) {
      return `https://www.youtube.com/embed/${ytEmbedMatch[1]}?autoplay=1`;
    }

    // 5. TikTok links: tiktok.com/@user/video/ID -> embed
    const tiktokMatch = trimmed.match(
      /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[^/]+\/video\/(\d+)/i
    );
    if (tiktokMatch && tiktokMatch[1]) {
      return `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`;
    }

    // 6. Direct video or other services (e.g. Vimeo, daily motion, etc.)
    return trimmed;
  } catch {
    return trimmed;
  }
}

export function ProductGallery({
  images,
  videoUrl,
  productTitle,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const safeImages = images && images.length > 0 ? images : [{ url: '' }];
  const currentImage = safeImages[activeIndex] || safeImages[0];
  const currentUrl = currentImage?.url || '';

  const hasVideo = Boolean(videoUrl && videoUrl.trim());
  const embedUrl = hasVideo ? formatVideoEmbedUrl(videoUrl!) : '';

  const getAltText = (img: GalleryImage, idx: number): string => {
    if (!img) return productTitle;
    if (typeof img.alt === 'string' && img.alt.trim()) return img.alt;
    if (typeof img.alt === 'object' && img.alt) {
      return img.alt.ar || img.alt.en || `${productTitle} - ${idx + 1}`;
    }
    return `${productTitle} - ${idx + 1}`;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches && e.touches.length > 0) {
      setTouchStartX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    if (e.changedTouches && e.changedTouches.length > 0) {
      const touchEndX = e.changedTouches[0].clientX;
      const diffX = touchEndX - touchStartX;
      const minSwipeDistance = 35; // px

      if (diffX > minSwipeDistance) {
        // Swipe Right -> previous image
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : safeImages.length - 1));
      } else if (diffX < -minSwipeDistance) {
        // Swipe Left -> next image
        setActiveIndex((prev) => (prev < safeImages.length - 1 ? prev + 1 : 0));
      }
    }
    setTouchStartX(null);
  };

  const handleSelectImage = (idx: number) => {
    setIsVideoActive(false);
    setActiveIndex(idx);
  };

  const handleSelectVideo = () => {
    setIsVideoActive(true);
  };

  const handleCloseVideo = () => {
    setIsVideoActive(false);
    setActiveIndex(0);
  };

  const showThumbnails = safeImages.length > 1 || hasVideo;

  return (
    <div className={styles.imageGallery}>
      {/* 1. Main Display Area: Either Video iframe OR Large Main Image */}
      {isVideoActive && embedUrl ? (
        <div className={styles.videoPlayerWrapper}>
          <button
            type="button"
            onClick={handleCloseVideo}
            className={styles.videoCloseBtn}
            aria-label="إغلاق الفيديو والعودة للصورة الأولى"
          >
            ✕
          </button>
          <iframe
            src={embedUrl}
            title={`${productTitle} Video`}
            className={styles.videoIframe}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : (
        <>
          {/* Large Main Image taking 100% width on mobile with touch swipe support */}
          <div
            className={styles.mainImageWrapper}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {currentUrl ? (
              <img
                src={currentUrl}
                alt={getAltText(currentImage, activeIndex)}
                className={styles.mainImage}
                referrerPolicy="no-referrer"
                loading="eager"
                draggable={false}
              />
            ) : (
              <div className={`${styles.mainImage} ${styles.imageFallback}`}>
                <span>{productTitle.slice(0, 1)}</span>
              </div>
            )}
          </div>

          {/* Dots indicator under the image showing current slide */}
          {safeImages.length > 1 && (
            <div
              className={styles.dotsIndicator}
              role="tablist"
              aria-label="Image slide indicator"
            >
              {safeImages.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  role="tab"
                  aria-selected={idx === activeIndex}
                  aria-label={`Image ${idx + 1} of ${safeImages.length}`}
                  className={`${styles.dot} ${
                    idx === activeIndex ? styles.dotActive : ''
                  }`}
                  onClick={() => handleSelectImage(idx)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* 2. Thumbnails Row: All images first, then video thumbnail at the end */}
      {showThumbnails && (
        <div
          className={styles.thumbnailsRow}
          role="tablist"
          aria-label="معرض الوسائط"
        >
          {/* Images in original order */}
          {safeImages.map((img, idx) => {
            const isSelected = !isVideoActive && idx === activeIndex;
            return (
              <button
                key={img.url || idx}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-label={`${productTitle} thumbnail ${idx + 1}`}
                onClick={() => handleSelectImage(idx)}
                className={`${styles.thumbnailButton} ${
                  isSelected ? styles.thumbnailActive : ''
                }`}
              >
                {img.url ? (
                  <img
                    src={img.url}
                    alt={getAltText(img, idx)}
                    className={styles.thumbnailImg}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className={styles.thumbnailFallback}>{idx + 1}</span>
                )}
              </button>
            );
          })}

          {/* Video thumbnail at the end */}
          {hasVideo && (
            <button
              type="button"
              role="tab"
              aria-selected={isVideoActive}
              aria-label={`${productTitle} Video`}
              onClick={handleSelectVideo}
              className={`${styles.videoThumbnailButton} ${
                isVideoActive ? styles.thumbnailActive : ''
              }`}
            >
              <span className={styles.videoThumbnailPlayIcon} aria-hidden="true">
                ▶
              </span>
              <span className={styles.videoThumbnailLabel}>فيديو</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
