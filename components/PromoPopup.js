'use client'; // Required for Next.js App Router

import React, { useState, useEffect } from 'react';

const PromoPopup = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Starts the 6-second timer
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 6000);

    return () => clearTimeout(timer); // Cleanup timer if user leaves page
  }, []);

  if (!isVisible) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button style={styles.closeBtn} onClick={() => setIsVisible(false)}>×</button>
        
        <div style={styles.content}>
          <h2 style={styles.headline}>Wait! Complete your order.</h2>
          <p style={styles.subtext}>
            Use the code below at checkout for an extra <br />
            <span style={styles.highlight}>$30 OFF</span>
          </p>
          
          <div style={styles.couponBox}>
            <span style={styles.label}>CODE:</span>
            <span style={styles.code}>P2V</span>
          </div>

          <a href="/order" style={styles.ctaButton}>
            Claim My $30 Off →
          </a>
          
          <p style={styles.footer}>Offer ends soon. Don't miss out.</p>
        </div>
      </div>
    </div>
  );
};

// Styles designed to match your site screenshot
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(13, 27, 42, 0.8)', // Navy tinted background
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  },
  modal: {
    backgroundColor: '#ffffff',
    width: '90%',
    maxWidth: '420px',
    padding: '40px 30px',
    borderRadius: '16px',
    position: 'relative',
    textAlign: 'center',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
    borderTop: '6px solid #D32F2F', // Your brand red
    fontFamily: 'sans-serif',
  },
  closeBtn: {
    position: 'absolute',
    top: '10px',
    right: '15px',
    background: 'none',
    border: 'none',
    fontSize: '30px',
    color: '#cbd5e0',
    cursor: 'pointer',
  },
  headline: {
    color: '#0D1B2A', // Your Navy Blue
    fontSize: '24px',
    fontWeight: '800',
    margin: '10px 0',
  },
  subtext: {
    color: '#4a5568',
    fontSize: '16px',
    marginBottom: '20px',
  },
  highlight: {
    color: '#D32F2F', // Your Brand Red
    fontWeight: 'bold',
  },
  couponBox: {
    backgroundColor: '#f8f9fa',
    border: '2px dashed #0D1B2A',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '25px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
  },
  label: {
    fontSize: '12px',
    color: '#718096',
    fontWeight: 'bold',
  },
  code: {
    fontSize: '22px',
    fontWeight: '900',
    color: '#0D1B2A',
    letterSpacing: '1px',
  },
  ctaButton: {
    display: 'block',
    backgroundColor: '#D32F2F', // Your Brand Red
    color: '#fff',
    padding: '16px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '18px',
    transition: '0.2s',
  },
  footer: {
    marginTop: '15px',
    fontSize: '12px',
    color: '#a0aec0',
  }
};

export default PromoPopup;
