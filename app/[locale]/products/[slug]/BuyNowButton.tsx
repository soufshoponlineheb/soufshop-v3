'use client';

import React, { useState } from 'react';
import styles from './ProductPage.module.css';

interface BuyNowButtonProps {
  href: string;
  label: string;
  variant?: 'primary' | 'sticky';
}

export function BuyNowButton({
  href,
  label,
  variant = 'primary',
}: BuyNowButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const triggerPressFeedback = () => {
    setIsPressed(true);
    window.setTimeout(() => {
      setIsPressed(false);
    }, 280);
  };

  const baseClass =
    variant === 'sticky' ? styles.stickyButton : styles.buyNowBtn;
  const pressedClass =
    variant === 'sticky'
      ? styles.stickyButtonPressed
      : styles.buyNowBtnPressed;

  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className={`${baseClass} ${isPressed ? pressedClass : ''}`}
      onMouseDown={triggerPressFeedback}
      onTouchStart={triggerPressFeedback}
      onClick={triggerPressFeedback}
    >
      <span>{label}</span>
    </a>
  );
}
