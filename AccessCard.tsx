"use client";

import { useRef } from "react";
import styles from "./AccessCard.module.css";

export default function AccessCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = -(y - centerY) / 20;
    const rotateY = (x - centerX) / 20;

    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

    if (glareRef.current) {
      const px = (x / rect.width) * 100;
      const py = (y / rect.height) * 100;
      glareRef.current.style.background = `radial-gradient(circle at ${px}% ${py}%, rgba(255,255,255,0.15) 0%, transparent 60%)`;
      glareRef.current.style.opacity = '1';
    }
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    
    if (glareRef.current) {
      glareRef.current.style.opacity = '0';
    }
  };

  return (
    <div className={styles.cardContainer}>
      <div
        className={styles.card}
        id="card"
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className={styles.cardBg}></div>
        <div className={styles.glare} ref={glareRef}></div>
        <div className={styles.cardBorder}></div>

        <div className={styles.content}>
          <div className={styles.icon}>&gt;_</div>

          <div className={styles.title}>JOHN KYLLE</div>
          <div className={styles.subtitle}>ACCESS CARD</div>

          <div className={styles.memberSection}>
            <div className={styles.label}>SPECIALIZATION</div>
            <div className={styles.name}>Junior Software Engineer</div>
          </div>

          <div className={styles.bottomRow}>
            <div className={styles.role}>OPEN TO WORK</div>
            <div className={styles.qr}>
              <svg viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                <path fillRule="evenodd" clipRule="evenodd" d="M0 0h7v7H0V0zm2 2h3v3H2V2zm-2 7h2v2H0V9zm3 0h4v2H3V9zm-3 3h2v2H0v-2zm3 0h2v2H3v-2zm3 0h2v2H6v-2zm-6 3h7v7H0v-7zm2 2h3v3H2v-3zm7-14h2v2H9V0zm3 0h2v2h-2V0zm3 0h6v7h-6V0zm2 2h2v3h-2V2zm-7 5h2v2H9V7zm3 0h2v2h-2V7zm-3 3h2v2H9v-2zm3 0h2v2h-2v-2zm3 0h2v2h-2v-2zm3 0h2v2h-2v-2zm-9 3h2v2H9v-2zm3 0h2v2h-2v-2zm3 0h2v2h-2v-2zm3 0h2v2h-2v-2zm-9 3h2v2H9v-2zm3 0h2v2h-2v-2zm3 0h4v4h-4v-4zm1 1h2v2h-2v-2zm-4 3h2v2h-2v-2z" fill="currentColor"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}