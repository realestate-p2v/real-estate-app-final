'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const PromoPopup: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 6000); // 6 second delay

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Top Accent Bar */}
        <div style={styles.accentBar}></div>
        
        <button 
          style={styles.closeBtn} 
          onClick={() => setIsVisible(false)}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#D32F2F')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e0')}
        >
          ×
        </button>

        <div style={styles.content}>
          {/* Brand Logo */}
          <div style={styles.logoWrapper}>
            <img 
              src="/logo.png" 
              alt="Real Estate Photo 2 Video" 
              style={styles.logo} 
            />
          </div>

          {/* High-Impact Copy */}
          <h2 style={styles.headline}>Stop Scrolling! <br/><span style={styles.redText}>Get The Listing Edge.</span></h2>
          
          <p style={styles.subtext}>
            Don't let your listings stay static. Transform your photos into **high-converting video tours** today and save big!
          </p>

          {/* Scarcity/Offer Box */}
          <div style={styles.promoBox}>
            <p style={styles.promoLabel}>EXCLUSIVELY FOR YOU:</p>
            <div style={styles.couponRow}>
              <span style={styles.couponCode}>P2V</span>
              <span style={styles.divider}>|</span>
              <span style={styles.discountText}>$30 OFF</span>
            </div>
          </div>

          {/* High-Conversion CTA */}
          <a 
            href="/order" 
            style={styles.ctaButton}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            YES! CLAIM MY $30 DISCOUNT →
          </a>

          <p style={styles.urgencyText}>*Valid for new orders only. Act fast!</p>
        </div>
      </div>
    </div>
  );
};

// --- Professional Styling ---
const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(13, 27, 42, 0.85)', // Deep Navy overlay to match header
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(8px)',
  },
  modal: {
    backgroundColor: '#ffffff',
    width: '90%',
    maxWidth: '460px',
    borderRadius: '20px',
    position: 'relative',
    textAlign: 'center',
    boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
    animation: 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
    fontFamily: 'inherit',
  },
  accentBar: {
    height: '8px',
    backgroundColor: '#D32F2F', // Your brand red
    width: '100%',
  },
  closeBtn: {
    position: 'absolute',
    top: '15px',
    right: '20px',
    background: 'none',
    border: 'none',
    fontSize: '34px',
    color: '#cbd5e0',
    cursor: 'pointer',
    transition: 'color 0.2s',
    lineHeight: 1,
  },
  content: {
    padding: '40px 30px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoWrapper: {
    marginBottom: '20px',
  },
  logo: {
    height: '70px',
    width: 'auto',
  },
  headline: {
    color: '#0D1B2A', // Navy
    fontSize: '28px',
    fontWeight: '900',
    margin: '0 0 15px 0',
    lineHeight: '1.1',
    letterSpacing: '-1px',
  },
  redText: {
    color: '#D32F2F',
  },
  subtext: {
    color: '#4a5568',
    fontSize: '17px',
    lineHeight: '1.5',
    marginBottom: '25px',
  },
  promoBox: {
    backgroundColor: '#F8FAFC',
    border: '2px dashed #0D1B2A',
    borderRadius: '12px',
    padding: '15px 25px',
    marginBottom: '30px',
    width: '100%',
  },
  promoLabel: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#718096',
    letterSpacing: '1px',
    margin: '0 0 5px 0',
  },
  couponRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
  },
  couponCode: {
    fontSize: '32px',
    fontWeight: '900',
    color: '#0D1B2A',
    letterSpacing: '2px',
  },
  divider: {
    color: '#cbd5e0',
    fontSize: '24px',
    fontWeight: '200',
  },
  discountText: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#D32F2F',
  },
  ctaButton: {
    display: 'inline-block',
    backgroundColor: '#D32F2F', // Your red
    color: '#ffffff',
    padding: '18px 30px',
    borderRadius: '12px',
    textDecoration: 'none',
    fontWeight: '900',
    fontSize: '18px',
    width: '100%',
    transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    boxShadow: '0 10px 15px -3px rgba(211, 47, 47, 0.4)',
  },
  urgencyText: {
    fontSize: '12px',
    color: '#a0aec0',
    marginTop: '15px',
    fontStyle: 'italic',
  }
};

export default PromoPopup;
