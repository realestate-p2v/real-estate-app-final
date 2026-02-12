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
          <div style={styles.logoWrapper}>
            <img 
              src="/p2v-logo.png" 
              alt="Real Estate Photo 2 Video" 
              style={styles.logo} 
            />
          </div>

          <h2 style={styles.headline}>
            Wait! Grab An <span style={styles.redText}>Extra $30 Off</span> <br/>
            Before You Go!
          </h2>
          
          <p style={styles.subtext}>
            Boost your listings with the industry's best <strong>video tours</strong>. Your exclusive bonus is ready!
          </p>

          <div style={styles.promoBox}>
            <p style={styles.promoLabel}>EXCLUSIVELY FOR YOU:</p>
            <div style={styles.couponRow}>
              <span style={styles.couponCode}>P2V</span>
              <span style={styles.divider}>|</span>
              <div style={styles.savingsHighlight}>
                <span style={styles.discountText}>EXTRA $30 OFF</span>
              </div>
            </div>
          </div>

          <a href="/order" style={styles.ctaButton}>
            YES! CLAIM MY EXTRA $30 OFF →
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
    backgroundColor: 'rgba(13, 27, 42, 0.85)',
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(8px)',
  },
  modal: {
    // NEW: Subtle Gradient (Top: #E9ECEF to Bottom: #F8F9FA)
    background: 'linear-gradient(180deg, #E9ECEF 0%, #F8F9FA 100%)',
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
    backgroundColor: '#D32F2F',
    width: '100%',
  },
  closeBtn: {
    position: 'absolute',
    top: '15px',
    right: '20px',
    background: 'none',
    border: 'none',
    fontSize: '34px',
    color: '#adb5bd',
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
    color: '#0D1B2A',
    fontSize: '28px',
    fontWeight: '900',
    margin: '0 0 15px 0',
    lineHeight: '1.2',
    letterSpacing: '-1px',
  },
  redText: {
    color: '#D32F2F',
  },
  subtext: {
    color: '#495057',
    fontSize: '17px',
    lineHeight: '1.5',
    marginBottom: '30px',
  },
  promoBox: {
    backgroundColor: '#FFFFFF',
    border: '2px dashed #0D1B2A',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '35px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  promoLabel: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#6c757d',
    margin: '0 0 8px 0',
    letterSpacing: '2px',
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
    color: '#dee2e6',
    fontSize: '28px',
  },
  savingsHighlight: {
    backgroundColor: '#FFF0F0',
    padding: '5px 12px',
    borderRadius: '8px',
    border: '1px solid #D32F2F',
  },
  discountText: {
    fontSize: '20px',
    fontWeight: '900',
    color: '#D32F2F',
  },
  ctaButton: {
    display: 'block',
    backgroundColor: '#28a745', 
    color: '#ffffff',
    padding: '20px',
    borderRadius: '14px',
    textDecoration: 'none',
    fontWeight: '900',
    fontSize: '18px',
    boxShadow: '0 10px 20px -5px rgba(40, 167, 69, 0.4)',
  },
  urgencyText: {
    fontSize: '13px',
    color: '#adb5bd',
    marginTop: '20px',
  }
};
