import React, { useEffect, useState } from 'react';

const WARNING_SECONDS = 60;

export default function IdleWarningModal({ visible, onStay, onLogout }) {
  const [seconds, setSeconds] = useState(WARNING_SECONDS);

  // Reset + tick whenever the modal becomes visible
  useEffect(() => {
    if (!visible) {
      setSeconds(WARNING_SECONDS);
      return;
    }
    setSeconds(WARNING_SECONDS);
    const interval = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  const pct = (seconds / WARNING_SECONDS) * 100;
  const radius = 26;
  const circ = 2 * Math.PI * radius;
  const dash = (pct / 100) * circ;

  return (
    <div style={overlay}>
      <div style={card}>
        {/* Animated ring */}
        <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 20px' }}>
          <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="36" cy="36" r={radius} fill="none" stroke="#1f2937" strokeWidth="5" />
            <circle
              cx="36" cy="36" r={radius}
              fill="none"
              stroke={seconds <= 15 ? '#ef4444' : seconds <= 30 ? '#f59e0b' : '#6366f1'}
              strokeWidth="5"
              strokeDasharray={`${dash} ${circ}`}
              style={{ transition: 'stroke-dasharray 1s linear, stroke 0.5s' }}
            />
          </svg>
          <span style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700,
            color: seconds <= 15 ? '#ef4444' : '#f9fafb',
          }}>
            {seconds}
          </span>
        </div>

        <div style={{ fontSize: 20, fontWeight: 700, color: '#f9fafb', marginBottom: 8 }}>
          ⚠️ Session Expiring Soon
        </div>
        <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
          You've been inactive for a while. You will be automatically<br />
          logged out in <strong style={{ color: '#f9fafb' }}>{seconds} second{seconds !== 1 ? 's' : ''}</strong>.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={onLogout} style={btnSecondary}>
            Logout now
          </button>
          <button onClick={onStay} style={btnPrimary}>
            Stay logged in
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── inline styles ───────────────────────────────────────────── */
const overlay = {
  position: 'fixed', inset: 0, zIndex: 99999,
  background: 'rgba(0,0,0,0.65)',
  backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const card = {
  background: 'linear-gradient(135deg,#111827 0%,#1f2937 100%)',
  border: '1px solid #374151',
  borderRadius: 20,
  padding: '40px 36px',
  maxWidth: 420,
  width: '90%',
  textAlign: 'center',
  boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
  animation: 'idleSlideIn 0.3s ease',
};

const btnPrimary = {
  padding: '10px 28px',
  borderRadius: 10,
  border: 'none',
  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
  color: '#fff',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  transition: 'opacity 0.2s',
};

const btnSecondary = {
  padding: '10px 22px',
  borderRadius: 10,
  border: '1px solid #374151',
  background: 'transparent',
  color: '#9ca3af',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
};
