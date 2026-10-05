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
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M1 13V4.5L4.5 1H13"
            stroke="var(--color-accent-primary)"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <circle cx="6.5" cy="6.5" r="1.5" fill="var(--color-accent-primary)" />
        </svg>
      </span>
      {index && <span className={`${styles.indexNumber} tabularNums`}>{index}</span>}
      <span className={styles.labelText}>{label}</span>
      <span className={styles.hairlineRule} aria-hidden="true" />
      {subtleText && <span className={styles.subtleText}>{subtleText}</span>}
    </div>
  );
}
