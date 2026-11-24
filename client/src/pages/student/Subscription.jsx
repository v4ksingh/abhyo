import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';

export default function StudentSubscription() {
  const navigate = useNavigate();
  const { user, fetchMe } = useAuthStore();
  const [buying, setBuying] = useState(null);
  const [dbPlans, setDbPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/payments/student-plans')
      .then(res => setDbPlans(res.data.data || []))
      .catch(() => toast.error('Failed to load plans'))
      .finally(() => setLoading(false));
  }, []);

  const activeplan = user?.studentSubscriptionPlan || 'free';
  const isActive = user?.studentSubscriptionStatus === 'active' && user?.studentSubscriptionEndDate && new Date(user.studentSubscriptionEndDate) > new Date();
  const isTrial = user?.studentSubscriptionStatus === 'trial' && user?.studentSubscriptionEndDate && new Date(user.studentSubscriptionEndDate) > new Date();
  const hasAnyAccess = isActive || isTrial;
  const currentPlan = hasAnyAccess ? activeplan : 'free';
  const hasHadTrial = user?.studentSubscriptionEndDate != null;

  const handleTrial = async (planId) => {
    setBuying(planId);
    try {
      await api.post('/payments/start-trial', { planId });
      toast.success('🎁 Free trial activated! Enjoy premium access.');
      await fetchMe();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to activate trial');
    } finally {
      setBuying(null);
    }
  };

  const handleBuy = async (planId) => {
    if (planId === 'free') return;
    navigate(`/checkout?planId=${planId}`);
  };

  const endDateStr = user?.studentSubscriptionEndDate
    ? new Date(user.studentSubscriptionEndDate).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })
    : null;

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: "'Inter',-apple-system,sans-serif", fontSize: 13 }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 60%,#a855f7 100%)', padding: '40px 24px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, background:'rgba(255,255,255,0.06)', borderRadius:'50%', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-40, left:40, width:140, height:140, background:'rgba(255,255,255,0.04)', borderRadius:'50%', pointerEvents:'none' }}/>
        <div style={{ fontSize: 36, marginBottom: 10 }}>🚀</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>Unlock All Premium Tests</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', maxWidth: 480, margin: '0 auto 20px' }}>
          Access every paid test on the platform — UPSC, SSC, Banking, Defence & more — with one simple subscription.
        </p>

        {/* Current status */}
        {isTrial ? (
          <div style={{ display:'inline-flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:12, padding:'10px 20px' }}>
            <span style={{ fontSize: 18 }}>🎁</span>
            <div style={{ textAlign:'left' }}>
              <p style={{ fontWeight:800, color:'#fff', fontSize:13, margin:0 }}>Free Trial Active</p>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.7)', margin:0 }}>Trial ends {endDateStr} — Upgrade to keep access</p>
            </div>
          </div>
        ) : isActive ? (
          <div style={{ display:'inline-flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:12, padding:'10px 20px' }}>
            <span style={{ fontSize: 18 }}>✅</span>
            <div style={{ textAlign:'left' }}>
              <p style={{ fontWeight:800, color:'#fff', fontSize:13, margin:0 }}>Pro Active – {activeplan === 'pro_yearly' ? 'Yearly' : 'Monthly'}</p>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.7)', margin:0 }}>Valid until {endDateStr}</p>
            </div>
          </div>
        ) : (
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:12, padding:'8px 16px' }}>
            <span style={{ fontSize:14, color:'rgba(255,255,255,0.6)' }}>Currently on Free plan — upgrade to access premium tests</span>
          </div>
        )}
      </div>

      {/* Plan Cards */}
      <div style={{ maxWidth: 900, margin: '-28px auto 0', padding: '0 20px 40px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading plans...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
            {dbPlans.map(plan => {
            const isCurrent = currentPlan === plan.id || (currentPlan === 'free' && plan.price === 0);
            const isPopular = plan.highlight;
            const planColor = plan.interval === 'yearly' ? '#7c3aed' : (plan.price === 0 ? '#6b7280' : '#6366f1');
            const planBg = plan.interval === 'yearly' ? '#f5f3ff' : (plan.price === 0 ? '#f9fafb' : '#eff6ff');
            const planBorder = plan.interval === 'yearly' ? '#ddd6fe' : (plan.price === 0 ? '#e5e7eb' : '#c7d2fe');
            return (
              <div key={plan.id} style={{
                background: '#fff',
                border: `2px solid ${isCurrent ? planColor : isPopular ? planColor : '#e5e7eb'}`,
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: isPopular ? '0 8px 32px rgba(124,58,237,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                position: 'relative',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}>
                {isPopular && (
                  <div style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color:'#fff', textAlign:'center', padding:'6px', fontSize:11, fontWeight:800, letterSpacing:1 }}>
                    ⭐ BEST VALUE — SAVE 58%
                  </div>
                )}
                {isCurrent && (
                  <div style={{ background: planColor, color:'#fff', textAlign:'center', padding:'6px', fontSize:11, fontWeight:800, letterSpacing:1 }}>
                    ✓ YOUR CURRENT PLAN
                  </div>
                )}

                <div style={{ padding: '20px 20px 0' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{plan.interval === 'yearly' ? '👑' : '⚡'}</div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>{plan.name}</h2>
                  <div style={{ marginBottom: 16 }}>
                    {plan.price === 0 ? (
                      <span style={{ fontSize: 24, fontWeight: 900, color: '#111827' }}>Free</span>
                    ) : (
                      <>
                        <span style={{ fontSize: 11, fontWeight:700, color:'#6b7280', verticalAlign:'middle' }}>₹</span>
                        <span style={{ fontSize: 28, fontWeight: 900, color: planColor }}>{plan.price}</span>
                        <span style={{ fontSize: 12, color:'#9ca3af', marginLeft:4 }}>
                          {plan.interval === 'monthly' ? '/month' : '/year'}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Features */}
                  <div style={{ borderTop:'1px solid #f3f4f6', paddingTop:12, marginBottom:16 }}>
                    {(Array.isArray(plan.features) ? plan.features : (typeof plan.features === 'string' ? JSON.parse(plan.features || '[]') : [])).map((f, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:7, fontSize:12, color:'#374151' }}>
                        <span style={{ color:'#059669', fontWeight:700, flexShrink:0, marginTop:1 }}>✓</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '0 20px 20px' }}>
                  {/* Trial badge above button if plan has trial */}
                  {plan.trialEnabled && !hasHadTrial && plan.price > 0 && (
                    <div style={{ marginBottom: 8, textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#059669', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '5px 10px' }}>
                      🎁 {plan.trialDays || 7}-day FREE trial included!
                    </div>
                  )}

                  {isCurrent && isActive && plan.price !== 0 ? (
                    <div style={{ padding:'10px', background:planBg, border:`1px solid ${planBorder}`, borderRadius:10, textAlign:'center', fontSize:12, fontWeight:700, color:planColor }}>
                      ✓ Active until {endDateStr}
                    </div>
                  ) : isCurrent && isTrial ? (
                    // Currently on trial — show upgrade CTA
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ padding:'8px', background:'#fef9c3', border:'1px solid #fde68a', borderRadius:8, textAlign:'center', fontSize:11, fontWeight:700, color:'#92400e' }}>
                        🎁 Trial active · Ends {endDateStr}
                      </div>
                      <button
                        onClick={() => handleBuy(plan.id)}
                        disabled={buying === plan.id}
                        style={{ width:'100%', padding:'10px', borderRadius:10, border:'none', cursor: buying === plan.id ? 'wait' : 'pointer', fontWeight:800, fontSize:12, color:'#fff', background: buying === plan.id ? '#9ca3af' : `linear-gradient(135deg,${planColor},#8b5cf6)`, transition: 'all 0.15s' }}>
                        {buying === plan.id ? '⏳ Processing…' : '⚡ Upgrade Now →'}
                      </button>
                    </div>
                  ) : plan.price === 0 && isCurrent ? (
                    <div style={{ padding:'10px', background:'#f3f4f6', borderRadius:10, textAlign:'center', fontSize:12, fontWeight:600, color:'#6b7280' }}>
                      Currently Free
                    </div>
                  ) : plan.trialEnabled && !hasHadTrial && plan.price > 0 ? (
                    // Show trial CTA — free trial available, not yet on trial
                    <button
                      onClick={() => handleTrial(plan.id)}
                      disabled={buying === plan.id}
                      style={{ width:'100%', padding:'12px', borderRadius:10, border: `2px solid ${planColor}`, cursor: buying === plan.id ? 'wait' : 'pointer', fontWeight:800, fontSize:13, color: planColor, background: planBg, transition: 'all 0.15s' }}>
                      {buying === plan.id ? '⏳ Activating…' : `🎁 Start ${plan.trialDays || 7}-Day Free Trial`}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuy(plan.id)}
                      disabled={buying === plan.id}
                      style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', cursor: buying === plan.id ? 'wait' : 'pointer', fontWeight:800, fontSize:13, color:'#fff', background: buying === plan.id ? '#9ca3af' : `linear-gradient(135deg,${planColor},${plan.interval==='yearly'?'#a855f7':'#8b5cf6'})`, boxShadow: `0 4px 16px ${planColor}40`, transition: 'all 0.15s' }}>
                      {buying === plan.id ? '⏳ Processing…' : `Get ${plan.name} →`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

        {/* Institute note */}
        <div style={{ marginTop:24, padding:'16px 20px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, display:'flex', gap:14, alignItems:'flex-start' }}>
          <span style={{ fontSize:24, flexShrink:0 }}>🏫</span>
          <div>
            <p style={{ fontWeight:700, fontSize:13, color:'#111827', margin:'0 0 4px' }}>Are you a coaching institute student?</p>
            <p style={{ fontSize:12, color:'#6b7280', margin:0, lineHeight:1.6 }}>
              If your institute has subscribed to a Pro or Enterprise plan and added you as a student, you <strong>automatically get free access</strong> to all premium tests without needing a personal subscription. Contact your institute admin for your invite code.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginTop:24, padding:'16px 20px', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:14 }}>
          <p style={{ fontWeight:700, fontSize:13, color:'#92400e', margin:'0 0 12px' }}>💡 Frequently Asked Questions</p>
          {[
            ['Can I try before buying?', 'Yes! All FREE tests are available without any subscription. Only tests marked as "Premium" require a paid plan.'],
            ['Can I cancel anytime?', 'Yes. Your plan simply won\'t renew. You keep full access until your current period ends.'],
            ['What payment methods are accepted?', 'UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, and Net Banking via Razorpay.'],
          ].map(([q, a], i) => (
            <div key={i} style={{ marginBottom: i < 2 ? 12 : 0 }}>
              <p style={{ fontWeight:700, fontSize:12, color:'#78350f', margin:'0 0 3px' }}>Q: {q}</p>
              <p style={{ fontSize:12, color:'#92400e', margin:0, lineHeight:1.6 }}>A: {a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
