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
          {/* Logo - Stands out against the Smoke White background */}
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
    backgroundColor: 'rgba(13, 27, 42, 0.85)', // Navy backdrop
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(8px)',
  },
  modal: {
    backgroundColor: '#F8F9FA', // DAY MODE: One shade darker (Smoke White)
    width: '90%',
    maxWidth: '460px',
    borderRadius: '24px',
    position: 'relative',
    textAlign: 'center',
    boxShadow: '0 40px 80px -15px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
    fontFamily: 'sans-serif',
    animation: 'slideInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
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
    lineHeight: 1,
  },
  content: {
    padding: '50px 30px',
  },
  logo: {
    height: '85px',
    width: 'auto',
    margin: '0 auto 25px auto',
    display: 'block',
  },
  headline: {
    color: '#0D1B2A', // Navy
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
    color: '#4a5568',
    fontSize: '18px',
    lineHeight: '1.5',
    marginBottom: '30px',
  },
  promoBox: {
    backgroundColor: '#FFFFFF', // Pure white inner box for contrast
    border: '2px dashed #0D1B
