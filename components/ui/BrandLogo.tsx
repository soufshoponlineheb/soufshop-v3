import React, { useId } from 'react';
import styles from './BrandLogo.module.css';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

/**
 * AQURIVO Exclusive Brand Symbol — "The Sovereign Lotus-Crown & Aqua-Jewel":
 * A pure, non-lettermark luxury emblem crafted exclusively for AQURIVO:
 * - Central 4-facet kite-cut Aqua-Diamond (symbolizing 'Aqua' — clarity & rare curated selection)
 * - Twin sweeping Champagne Gold crescent wings (symbolizing 'Rivo' — converging streams of global excellence)
 * - Central 4-point Golden Polaris spark & sovereign diamond pedestal
 * - Unified, high-fashion geometric wordmark "AQURIVO"
 */
export function BrandLogo({ size = 'md', showWordmark = true }: BrandLogoProps) {
  const uid = useId().replace(/:/g, '');
  const bgGradId = `aqBg_${uid}`;
  const glowGradId = `aqGlow_${uid}`;
  const rimGradId = `aqRim_${uid}`;
  const goldLeftId = `aqGoldL_${uid}`;
  const goldRightId = `aqGoldR_${uid}`;

  return (
    <span className={`${styles.brandLockup} ${styles[size]}`}>
      <svg
        className={styles.mark}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id={bgGradId}
            x1="4"
            y1="4"
            x2="44"
            y2="44"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#115E49" />
            <stop offset="52%" stopColor="#083026" />
            <stop offset="100%" stopColor="#031510" />
          </linearGradient>

          <radialGradient
            id={glowGradId}
            cx="24"
            cy="20"
            r="19"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="rgba(45, 212, 191, 0.24)" />
            <stop offset="100%" stopColor="rgba(45, 212, 191, 0)" />
          </radialGradient>

          <linearGradient
            id={rimGradId}
            x1="2"
            y1="2"
            x2="46"
            y2="46"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="rgba(253, 230, 138, 0.7)" />
            <stop offset="50%" stopColor="rgba(45, 212, 191, 0.32)" />
            <stop offset="100%" stopColor="rgba(217, 119, 6, 0.6)" />
          </linearGradient>

          <linearGradient
            id={goldLeftId}
            x1="9"
            y1="14"
            x2="22"
            y2="37"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="48%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          <linearGradient
            id={goldRightId}
            x1="39"
            y1="14"
            x2="26"
            y2="37"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="48%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
        </defs>

        {/* Imperial Emerald Squircle Crest */}
        <rect
          x="2"
          y="2"
          width="44"
          height="44"
          rx="12.5"
          fill={`url(#${bgGradId})`}
          stroke={`url(#${rimGradId})`}
          strokeWidth="1.5"
        />

        {/* Ambient Emerald Inner Aura */}
        <rect
          x="2.75"
          y="2.75"
          width="42.5"
          height="42.5"
          rx="11.75"
          fill={`url(#${glowGradId})`}
        />

        {/* Fine Watchmaker Inner Bezel */}
        <rect
          x="5"
          y="5"
          width="38"
          height="38"
          rx="9.5"
          stroke="rgba(253, 230, 138, 0.15)"
          strokeWidth="0.75"
        />

        {/* Twin Golden Rivo Crescent Wings (Sovereign Lotus Petals) */}
        <g className={styles.goldenWings}>
          {/* Left Golden Wing */}
          <path
            d="M9.2 14.8C11.8 15.8 14.0 17.6 15.4 20.2L21.8 36.2C13.8 33.8 8.6 25.2 9.2 14.8Z"
            fill={`url(#${goldLeftId})`}
          />
          {/* Right Golden Wing */}
          <path
            d="M38.8 14.8C36.2 15.8 34.0 17.6 32.6 20.2L26.2 36.2C34.2 33.8 39.4 25.2 38.8 14.8Z"
            fill={`url(#${goldRightId})`}
          />
          {/* Sovereign Diamond Pedestal Base */}
          <path
            d="M16.5 39.4L24 37.8L31.5 39.4L24 41.0L16.5 39.4Z"
            fill={`url(#${goldLeftId})`}
          />
        </g>

        {/* Central 4-Faceted Kite-Cut Aqua-Jewel (The Spire) */}
        <g className={styles.centralJewel}>
          {/* Upper-Left Lit Alabaster Facet */}
          <path d="M24 7.5L17.8 18.5H24V7.5Z" fill="#FFFFFF" />
          {/* Upper-Right Pearl-Aqua Facet */}
          <path d="M24 7.5L30.2 18.5H24V7.5Z" fill="#CCFBF1" />
          {/* Lower-Left Silky Mint Facet */}
          <path d="M17.8 18.5L24 33.8V18.5H17.8Z" fill="#E6F4F1" />
          {/* Lower-Right Turquoise-Emerald Facet */}
          <path d="M30.2 18.5L24 33.8V18.5H30.2Z" fill="#5EEAD4" />
          {/* Inner 4-Point Golden Polaris Spark */}
          <path
            d="M24 14.6L25.05 17.45L27.9 18.5L25.05 19.55L24 22.4L22.95 19.55L20.1 18.5L22.95 17.45L24 14.6Z"
            fill="#F59E0B"
          />
          <circle cx="24" cy="18.5" r="1.1" fill="#FEF3C7" />
        </g>
      </svg>

      {showWordmark && (
        <span className={styles.wordmark} dir="ltr">
          AQURIVO
        </span>
      )}
    </span>
  );
}
