import React from 'react';
import styles from './BrandLogo.module.css';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

/**
 * Iconic Brand Identity for SoufShop — "The Curated Prism S":
 * - Architectural dark emerald & obsidian squircle shield (#0B2920 -> #115E49)
 * - Interlocking dual-ribbon 'S' monogram (Turquoise #2DD4BF upper ascending deal wing
 *   + Crisp Alabaster #FFFFFF lower trust wing)
 * - Negative-space 4-pointed Curation Star (✦) with a Saharan Gold (#E0963E) diamond core
 *   at the exact geometric center of the 'S'
 * - Precision Saharan Gold ascending arrow spark at the upper right corner
 * - Paired with a bespoke "Souf◆Shop" wordmark anchored by a micro gold diamond
 */
export function BrandLogo({ size = 'md', showWordmark = true }: BrandLogoProps) {
  return (
    <span className={`${styles.brandLockup} ${styles[size]}`}>
      <svg
        className={styles.mark}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="soufShieldGrad"
            x1="4"
            y1="4"
            x2="40"
            y2="40"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#0D382B" />
            <stop offset="55%" stopColor="#115E49" />
            <stop offset="100%" stopColor="#09221A" />
          </linearGradient>

          <linearGradient
            id="soufTurquoiseRibbon"
            x1="11"
            y1="9"
            x2="33"
            y2="24"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#5EEAD4" />
            <stop offset="100%" stopColor="#14B8A6" />
          </linearGradient>

          <linearGradient
            id="soufGoldCore"
            x1="18"
            y1="18"
            x2="26"
            y2="26"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#C87D28" />
          </linearGradient>
        </defs>

        {/* Outer Sculpted Tag-Shield Squircle */}
        <rect
          x="3"
          y="3"
          width="38"
          height="38"
          rx="11"
          fill="url(#soufShieldGrad)"
          stroke="rgba(45, 212, 191, 0.28)"
          strokeWidth="1.2"
        />

        {/* Subtle Inner Architectural Frame */}
        <rect
          x="5.5"
          y="5.5"
          width="33"
          height="33"
          rx="8.5"
          stroke="rgba(255, 255, 255, 0.07)"
          strokeWidth="0.9"
        />

        {/* Upper Ribbon of the 'S' — Ascending Turquoise Deal Wing */}
        <path
          d="M29.5 11.5H17.2C13.7758 11.5 11 14.2758 11 17.7C11 20.65 13.06 23.12 15.85 23.75L21.5 22L17.4 18.8C16.55 18.45 16.1 17.6 16.4 16.75C16.65 16.05 17.32 15.6 18.1 15.6H26.8L29.5 11.5Z"
          fill="url(#soufTurquoiseRibbon)"
        />

        {/* Lower Ribbon of the 'S' — Crisp White Trust Wing */}
        <path
          d="M14.5 32.5H26.8C30.2242 32.5 33 29.7242 33 26.3C33 23.35 30.94 20.88 28.15 20.25L22.5 22L26.6 25.2C27.45 25.55 27.9 26.4 27.6 27.25C27.35 27.95 26.68 28.4 25.9 28.4H17.2L14.5 32.5Z"
          fill="#FFFFFF"
        />

        {/* Central Negative-Space 4-Pointed Curation Star & Saharan Gold Diamond Core */}
        <path
          className={styles.curationStar}
          d="M22 16.6L23.55 20.45L27.4 22L23.55 23.55L22 27.4L20.45 23.55L16.6 22L20.45 20.45L22 16.6Z"
          fill="url(#soufGoldCore)"
        />

        {/* Precision Ascending Deal Arrowhead Notch at Upper Right */}
        <path
          d="M27.8 9.8H33.2V15.2"
          stroke="#E0963E"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showWordmark && (
        <span className={styles.wordmark} dir="ltr">
          <span className={styles.wordPrimary}>Souf</span>
          <span className={styles.wordDiamond} aria-hidden="true" />
          <span className={styles.wordAccent}>Shop</span>
        </span>
      )}
    </span>
  );
}
