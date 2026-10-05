import React from 'react';
import styles from './ProductArtwork.module.css';

interface ProductArtworkProps {
  title: string;
  categoryLabel?: string;
  noteText?: string;
}

/**
 * Custom SVG/CSS Editorial Artwork used when a real Cloudinary product image
 * has not been uploaded yet. Clearly communicates that it is temporary editorial artwork.
 */
export function ProductArtwork({ title, categoryLabel, noteText }: ProductArtworkProps) {
  return (
    <div className={styles.artworkCanvas} role="img" aria-label={title}>
      <svg
        className={styles.geometricSvg}
        viewBox="0 0 320 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Architectural grid lines */}
        <line
          x1="40"
          y1="0"
          x2="40"
          y2="240"
          stroke="var(--color-border-hairline)"
          strokeWidth="1"
        />
        <line
          x1="280"
          y1="0"
          x2="280"
          y2="240"
          stroke="var(--color-border-hairline)"
          strokeWidth="1"
        />
        <line
          x1="0"
          y1="190"
          x2="320"
          y2="190"
          stroke="var(--color-border-hairline)"
          strokeWidth="1"
        />

        {/* Pedestal & Botanical Emerald Form */}
        <rect
          x="96"
          y="156"
          width="128"
          height="34"
          rx="4"
          fill="var(--color-bg-elevated)"
          stroke="var(--color-border-strong)"
          strokeWidth="1.5"
        />
        <path
          d="M124 156V86C124 66.1177 140.118 50 160 50C179.882 50 196 66.1177 196 86V156"
          fill="var(--color-accent-subtle)"
          stroke="var(--color-accent-primary)"
          strokeWidth="1.75"
        />
        <circle
          cx="160"
          cy="96"
          r="18"
          fill="var(--color-bg-elevated)"
          stroke="var(--color-accent-primary)"
          strokeWidth="1.75"
        />
      </svg>

      <div className={styles.captionOverlay}>
        {categoryLabel && <span className={styles.categoryText}>{categoryLabel}</span>}
        {noteText && <span className={styles.temporaryNotice}>{noteText}</span>}
      </div>
    </div>
  );
}
