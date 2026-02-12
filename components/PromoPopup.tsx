'use client';

import React, { useState, useEffect } from 'react';

export default function PromoPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 6000); 

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Branding Red Top Bar */}
        <div style={styles.accentBar}></div>
        
        <button 
          style={styles.closeBtn} 
          onClick={() => setIsVisible(false)}
        >
          ×
        </button>

        <div style={styles.content}>
          {/* Logo - Now pops against the Dark background */}
          <div style={styles.logoWrapper}>
            <img 
              src="/p2v-logo.png" 
              alt="Real Estate Photo 2 Video" 
              style={styles.logo} 
            />
          </div>

          <h2 style={styles.headline}>
            Stop Scrolling! <br/>
            <span style={styles.redText}>Get The Listing Edge.</span>
          </h2>
          
          <p style={styles.subtext}>
            Transform your photos into <strong>high-converting video tours</strong> today and save big!
          </p>

          <div style={styles.promoBox}>
            <p style={styles.promoLabel}>EXCLUSIVELY FOR YOU:</p>
            <div style={styles.couponRow}>
              <span style={styles.couponCode}>P2V</span>
              <span style={styles.divider}>|</span>
              <span style={styles.discountText}>$30 OFF</span>
            </div>
          </div>

          <a href="/order" style={styles.ctaButton}>
            YES! CLAIM MY $30 DISCOUNT →
          </a>

          <p style={styles.urgencyText}>*Valid for new orders only. Act fast!</p>
        </div>
      </div>

      {/* Modern Slide-Up Animation Style */}
      <style>{`
        @keyframes slideInUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(5, 10, 20, 0.9)', // Darker, moodier backdrop
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  modal: {
    backgroundColor: '#0D1B2A', // NIGHT MODE: Matches your Navy Header
    width: '90%',
    maxWidth: '460px',
    borderRadius: '24px',
    position: 'relative',
    textAlign: 'center',
    boxShadow: '0 40px 80px -15px rgba(0, 0, 0, 0.8)',
    overflow: 'hidden',
    fontFamily: 'sans-serif',
    border: '1px solid rgba(255, 255, 255, 0.1)', // Subtle glow border
    animation: 'slideInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)', // Elegant slide
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
    color: '#64748b',
    cursor: 'pointer',
    lineHeight: 1,
  },
  content: {
    padding: '50px 30px',
  },
  logo: {
    height: '85px', // Made it a bit larger to stand out
    width: 'auto',
    margin: '0 auto 25px auto',
    display: 'block',
  },
  headline: {
    color: '#FFFFFF', // Pure white for high contrast
    fontSize: '30px',
    fontWeight: '900',
    margin: '0 0 15px 0',
    lineHeight: '1.1',
    letterSpacing: '-1px',
  },
  redText: {
    color: '#D32F2F',
  },
  subtext: {
    color: '#cbd5e0', // Light grey for readability
    fontSize: '18px',
    lineHeight: '1.5',
    marginBottom: '30px',
  },
  promoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Transparent glass effect
    border: '2px dashed #D32F2F',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '35px',
  },
  promoLabel: {
    fontSize: '12px',
    fontWeight: '800',
    color: '#94a3b8',
    margin: '0 0 8px 0',
    letterSpacing: '2px',
  },
  couponRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
  },
  couponCode: {
    fontSize: '36px',
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: '3px',
  },
  divider: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: '28px',
  },
  discountText: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#D32F2F',
  },
  ctaButton: {
    display: 'block',
    backgroundColor: '#D32F2F',
    color: '#ffffff',
    padding: '20px',
    borderRadius: '14px',
    textDecoration: 'none',
    fontWeight: '900',
    fontSize: '19px',
    boxShadow: '0 15px 30px -5px rgba(211, 47, 47, 0.5)',
    transition: 'all 0.3s ease',
  },
  urgencyText: {
    fontSize: '13px',
    color: '#64748b',
    marginTop: '20px',
  }
};
