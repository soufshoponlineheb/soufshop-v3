import React from 'react';
import styles from './SignatureMotif.module.css';

interface SignatureMotifProps {
  index?: string;
  label: string;
  subtleText?: string;
}

/**
 * Reusable Signature Brand Element ("The Editorial Corner Mark & Hairline Index")
 * Propagated across section headers, curated collections, and verification blocks.
 */
export function SignatureMotif({ index, label, subtleText }: SignatureMotifProps) {
  return (
    <div className={styles.motifBar}>
      <span className={styles.cornerMark} aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          {/* Central Aqua-Diamond Spire */}
          <path
            d="M12 2.5L8.2 9.5L12 18.5L15.8 9.5L12 2.5Z"
            fill="var(--color-accent-primary)"
          />
          {/* Left & Right Lotus-Crown Crescent Wings */}
          <path
            d="M3.2 7.2C5.0 7.8 6.4 9.0 7.2 10.6L10.6 19.6C6.0 18.2 2.8 13.4 3.2 7.2Z"
            fill="#D97706"
          />
          <path
            d="M20.8 7.2C19.0 7.8 17.6 9.0 16.8 10.6L13.4 19.6C18.0 18.2 21.2 13.4 20.8 7.2Z"
            fill="#D97706"
          />
        </svg>
      </span>
      {index && <span className={`${styles.indexNumber} tabularNums`}>{index}</span>}
      <span className={styles.labelText}>{label}</span>
      <span className={styles.hairlineRule} aria-hidden="true" />
      {subtleText && <span className={styles.subtleText}>{subtleText}</span>}
    </div>
  );
}
