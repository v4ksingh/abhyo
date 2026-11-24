import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import PricingSection5 from '../../components/ui/pricing';

const PLAN_META = {
  free:       { icon: '🎓', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', badge: 'bg-gray-100 text-gray-600' },
  basic:      { icon: '⚡', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', badge: 'bg-blue-100 text-blue-700' },
  pro:        { icon: '🚀', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', badge: 'bg-violet-100 text-violet-700' },
  enterprise: { icon: '👑', color: '#b45309', bg: '#fffbeb', border: '#fde68a', badge: 'bg-amber-100 text-amber-700' },
};

export default function InstituteSubscription() {
  const navigate = useNavigate();
  const [sub, setSub] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [tab, setTab] = useState('plans'); // plans | students

  const fetchSub = async () => {
    try {
      const res = await api.get('/institute/subscription');
      setSub(res.data.data);
    } catch (err) {
      toast.error('Failed to load subscription');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const res = await api.get('/institute/students-access');
      setStudents(res.data.data || []);
    } catch {}
    finally { setStudentsLoading(false); }
  };

  const handleToggleAccess = async (studentId, currentStatus) => {
    try {
      const res = await api.post(`/institute/students/${studentId}/toggle-access`);
      if (res.data.success) {
        toast.success(res.data.message);
        setStudents(students.map(s => s.id === studentId ? { ...s, institutePremiumBlocked: res.data.institutePremiumBlocked, hasAccess: !res.data.institutePremiumBlocked || s.accessSource === 'own_subscription', accessSource: res.data.institutePremiumBlocked ? (s.accessSource === 'own_subscription' ? 'own_subscription' : 'none') : s.accessSource } : s));
        fetchStudents(); // Refresh to get precise hasAccess logic
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to toggle access');
    }
  };

  useEffect(() => { fetchSub(); fetchStudents(); }, []);

  const handleUpgrade = async (planId) => {
    navigate(`/checkout?planId=${planId}`);
  };

  const handleStartTrial = async (planId) => {
    try {
      setBuying(planId);
      await api.post('/payments/start-trial', { planId });
      toast.success('🎉 Free Trial Activated!');
      await fetchSub();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Trial activation failed');
    } finally {
      setBuying(null);
    }
  };

  const currentPlan = sub?.plan || 'free';
  const isActive = sub?.isActive;
  const meta = PLAN_META[currentPlan] || PLAN_META.free;
  const endDate = sub?.endDate ? new Date(sub.endDate).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) : null;

  return (
    <div style={{ fontFamily:"'Inter',-apple-system,sans-serif", fontSize:13 }} className="space-y-6 animate-fade-in">
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>

      {/* Page Header */}
      <div>
        <h1 className="section-header">💳 Subscription & Plans</h1>
        <p className="section-subheader">Manage your institute plan — upgrade to give all students instant premium test access</p>
      </div>

      {/* Current Plan Hero */}
      {!loading && sub && (
        <div style={{
          background: currentPlan === 'free' ? 'linear-gradient(135deg,#fef3c7,#fffbeb)' : 'linear-gradient(135deg,#7c3aed,#6366f1)',
          border: `2px solid ${currentPlan === 'free' ? '#fde68a' : 'transparent'}`,
          borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: 40 }}>{meta.icon}</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 900, fontSize: 18, color: currentPlan === 'free' ? '#92400e' : '#fff', margin: 0 }}>
              {currentPlan === 'free' ? 'Free Plan' : `${(sub?.plans || []).find(p => p.id === sub?.activePlanId)?.name || currentPlan} Plan`}
              {isActive && currentPlan !== 'free' && <span style={{ marginLeft: 10, fontSize: 12, background: 'rgba(255,255,255,0.2)', padding: '2px 10px', borderRadius: 20 }}>✓ Active</span>}
            </p>
            {isActive && endDate && currentPlan !== 'free' ? (
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: '4px 0 0' }}>
                Valid until {endDate} · {sub.studentCount} / {sub.maxStudents === 999999 ? '∞' : sub.maxStudents} students
              </p>
            ) : currentPlan === 'free' ? (
              <p style={{ fontSize: 13, color: '#78350f', margin: '4px 0 0' }}>
                {sub.studentCount} / {sub.maxStudents} students · Upgrade to give students premium test access
              </p>
            ) : null}
            {sub.coversStudentTests && (
              <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: 20 }}>
                <span style={{ color: '#6ee7b7', fontWeight: 800 }}>✓</span>
                <span style={{ color: '#fff', fontSize: 12 }}>Students have premium test access</span>
              </div>
            )}
          </div>
          {/* Quick stats */}
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { label: 'Students', val: sub.studentCount },
              { label: 'With Access', val: `${students.filter(s=>s.hasAccess).length}` },
              { label: 'Max Students', val: sub.maxStudents === 999999 ? '∞' : sub.maxStudents },
            ].map(({ label, val }) => (
              <div key={label} style={{ textAlign: 'center', background: currentPlan === 'free' ? 'rgba(217,119,6,0.1)' : 'rgba(255,255,255,0.15)', padding: '8px 14px', borderRadius: 10 }}>
                <p style={{ fontWeight: 900, fontSize: 20, color: currentPlan === 'free' ? '#92400e' : '#fff', margin: 0 }}>{val}</p>
                <p style={{ fontSize: 10, color: currentPlan === 'free' ? '#b45309' : 'rgba(255,255,255,0.6)', margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Switch */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e5e7eb', paddingBottom: 0 }}>
        {[
          { id: 'plans', label: '📋 Upgrade Plans' },
          { id: 'students', label: `👨‍🎓 Student Access (${students.filter(s=>s.hasAccess).length}/${students.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '10px 20px', border: 'none', borderBottom: `2px solid ${tab === t.id ? '#7c3aed' : 'transparent'}`,
              background: 'none', fontWeight: 700, fontSize: 13,
              color: tab === t.id ? '#7c3aed' : '#6b7280', cursor: 'pointer', transition: 'all 0.15s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: Plans */}
      {tab === 'plans' && (
        <div>
          <div className="-mt-10 relative z-10">
            <PricingSection5 
              plans={sub?.plans || []} 
              activePlanId={sub?.activePlanId}
              isProcessing={buying}
              onAction={(plan) => plan.trialEnabled && !sub?.hasHadTrial ? handleStartTrial(plan.id) : handleUpgrade(plan.id)}
            />
          </div>

          {/* How it works */}
          <div style={{ marginTop: 24, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '20px 24px' }}>
            <p style={{ fontWeight: 800, fontSize: 14, color: '#111827', margin: '0 0 16px' }}>🔑 How Institute Subscriptions Work</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
              {[
                { icon: '🏫', title: 'Institute Upgrades', desc: 'You purchase a Basic, Pro, or Enterprise plan for your institute.' },
                { icon: '🎓', title: 'Students Get Access', desc: 'ALL students enrolled in your institute automatically get premium test access — no per-student payment.' },
                { icon: '🔒', title: 'Free Plan Students', desc: 'If your institute is on Free, students need their own student subscription to unlock paid tests.' },
                { icon: '♾️', title: 'Unlimited Tests', desc: 'With Basic/Pro/Enterprise, your students can attempt every paid test on the platform.' },
              ].map(item => (
                <div key={item.title} style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: '#111827', margin: '0 0 4px' }}>{item.title}</p>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Student Access */}
      {tab === 'students' && (
        <div>
          {/* Summary bar */}
          {!studentsLoading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Total Students', val: students.length, color: '#6366f1', bg: '#eef2ff' },
                { label: 'Institute Plan Access', val: students.filter(s => s.accessSource === 'institute_plan').length, color: '#7c3aed', bg: '#f5f3ff' },
                { label: 'Own Subscription', val: students.filter(s => s.accessSource === 'own_subscription').length, color: '#059669', bg: '#f0fdf4' },
                { label: 'No Access', val: students.filter(s => !s.hasAccess).length, color: '#dc2626', bg: '#fef2f2' },
              ].map(({ label, val, color, bg }) => (
                <div key={label} style={{ background: bg, border: `1px solid ${color}20`, borderRadius: 12, padding: '12px 16px' }}>
                  <p style={{ fontWeight: 900, fontSize: 22, color, margin: 0 }}>{val}</p>
                  <p style={{ fontSize: 11, color, opacity: 0.7, margin: 0 }}>{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* No plan warning */}
          {!sub?.coversStudentTests && (
            <div style={{ background: '#fffbeb', border: '2px solid #fde68a', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <span style={{ fontSize: 28 }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 800, fontSize: 13, color: '#92400e', margin: 0 }}>Your current plan does not cover premium test access for students</p>
                <p style={{ fontSize: 12, color: '#78350f', margin: '2px 0 0' }}>Upgrade to Basic (₹1,999/yr) or higher. Students on Free plan will see a paywall when attempting paid tests.</p>
              </div>
              <button onClick={() => setTab('plans')}
                style={{ background: 'linear-gradient(135deg,#d97706,#b45309)', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Upgrade Now →
              </button>
            </div>
          )}

          {/* Student Table */}
          {studentsLoading ? (
            <div className="card text-center py-8 text-slate-400">Loading students…</div>
          ) : students.length === 0 ? (
            <div className="card text-center py-8 text-slate-400">No students enrolled yet. Add students from the Students section.</div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                    {['Student', 'Contact', 'Premium Access', 'Access Source', 'Own Plan', 'Status', 'Action'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: i < students.length - 1 ? '1px solid #f3f4f6' : 'none', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                            {s.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 700, color: '#111827', fontSize: 13 }}>{s.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280' }}>
                        <div>{s.email || '—'}</div>
                        <div>{s.mobile || ''}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800,
                          background: s.hasAccess ? '#dcfce7' : '#fee2e2',
                          color: s.hasAccess ? '#15803d' : '#dc2626',
                        }}>
                          {s.hasAccess ? '✓ Has Access' : '✕ No Access'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {s.accessSource === 'institute_plan' && (
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}>
                            🏫 Institute Plan
                          </span>
                        )}
                        {s.accessSource === 'own_subscription' && (
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0' }}>
                            👤 Own Subscription
                          </span>
                        )}
                        {s.accessSource === 'none' && (
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280' }}>
                        {s.studentSubscriptionStatus === 'active' && s.studentSubscriptionEndDate && new Date(s.studentSubscriptionEndDate) > new Date() ? (
                          <div>
                            <div style={{ fontWeight: 700, color: '#059669' }}>{s.studentSubscriptionPlan === 'pro_yearly' ? 'Pro Yearly' : 'Pro Monthly'}</div>
                            <div style={{ fontSize: 10 }}>Until {new Date(s.studentSubscriptionEndDate).toLocaleDateString('en-IN')}</div>
                          </div>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>Free Plan</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.isActive ? '#dcfce7' : '#fee2e2', color: s.isActive ? '#15803d' : '#dc2626' }}>
                          {s.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          onClick={() => handleToggleAccess(s.id, s.institutePremiumBlocked)}
                          style={{
                            padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer',
                            background: !s.institutePremiumBlocked ? '#fee2e2' : '#dcfce7',
                            color: !s.institutePremiumBlocked ? '#dc2626' : '#15803d',
                            transition: 'all 0.15s'
                          }}
                        >
                          {!s.institutePremiumBlocked ? 'Revoke Premium' : 'Grant Premium'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
