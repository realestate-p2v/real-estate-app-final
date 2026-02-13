'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function PromoPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/') {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 10000); 

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText('P2V');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); 
  };

  if (!isVisible || pathname !== '/') return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.accentBar}></div>
        
        <button 
          style={styles.closeBtn} 
          onClick={() => setIsVisible(false)}
          className="close-hover"
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
            February Sale <br /><span style={styles.redText}>Extra $30 Off!</span>
          </h2>
          
          <p style={styles.subtext}>
            12-clip walkthrough video, with branding <br /><strong>for just $49!</strong>
          </p>

          <div style={styles.promoBox}>
            <p style={styles.promoLabel}>
              CLICK TO COPY <span style={styles.highlightLabel}>PROMO CODE</span>:
            </p>
            
            <div 
              style={styles.couponRow} 
              onClick={copyToClipboard}
              title="Click to copy code"
              className="coupon-clickable"
            >
              <span style={styles.couponCode} className="pulse-text">
                {copied ? 'COPIED!' : 'P2V'}
              </span>
              <span style={styles.divider}>|</span>
              <div style={styles.savingsHighlight}>
                <span style={styles.discountText}>EXTRA $30 OFF</span>
              </div>
            </div>
          </div>

          <a href="/order" className="cta-hover" style={styles.ctaButton}>
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
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .pulse-text {
          display: inline-block;
          animation: pulse 2s infinite ease-in-out;
        }
        .coupon-clickable {
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        .coupon-clickable:hover {
          transform: scale(1.02);
        }
        .cta-hover {
          transition: all 0.3s ease !important;
        }
        .cta-hover:hover {
          background-color: #218838 !important;
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 15px 25px -5px rgba(40, 167, 69, 0.5) !important;
        }
        .close-hover:hover {
          color: #D32F2F !important;
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
    backgroundColor: 'rgba(52, 101, 164, 0.6)', 
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  },
  modal: {
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
    height: '10px',
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
    zIndex: 10,
  },
  content: {
    padding: '40px 30px',
  },
  logoWrapper: {
    backgroundColor: '#0D1B2A',
    padding: '15px',
    borderRadius: '16px',
    display: 'inline-block',
    marginBottom: '25px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
  },
  logo: {
    height: '65px',
    width: 'auto',
    display: 'block',
  },
  headline: {
    // NEW: Product Sans Bold implementation
    fontFamily: "'Product Sans', 'Product Sans Bold', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    color: '#0D1B2A',
    fontSize: '32px',
    fontWeight: '700', // Bold
    margin: '0 0 15px 0',
    lineHeight: '1.1',
    letterSpacing: '-0.5px', // Product Sans looks best with slightly tight tracking
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
    fontSize: '13px',
    fontWeight: '700',
    color: '#495057',
    margin: '0 0 10px 0',
    letterSpacing: '0.5px',
  },
  highlightLabel: {
    color: '#D32F2F',
    fontWeight: '900',
    fontSize: '15px',
    textDecoration: 'underline',
  },
  couponRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
    backgroundColor: '#f1f3f5',
    padding: '10px',
    borderRadius: '12px',
  },
  couponCode: {
    fontSize: '32px',
    fontWeight: '900',
    color: '#0D1B2A',
    letterSpacing: '2px',
    minWidth: '100px',
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
