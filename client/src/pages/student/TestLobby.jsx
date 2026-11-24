import React, { useEffect, useState, Component } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';

// ── Error Boundary ─────────────────────────────────────
class LobbyErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return (
      <div style={{ padding: 32, background: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        <p style={{ color: '#dc2626', fontWeight: 700 }}>⚠️ Lobby Error: {this.state.error?.message}</p>
        <pre style={{ fontSize: 11, color: '#6b7280', marginTop: 8 }}>{this.state.error?.stack}</pre>
        <button onClick={() => window.history.back()} style={{ marginTop: 16, padding: '8px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Go Back</button>
      </div>
    );
    return this.props.children;
  }
}

// ── Helpers ────────────────────────────────────────────
const fmt = (mins) => {
  if (!mins) return '—';
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
};

const TYPE_MAP = {
  mock:       { label: 'Mock Test',          bg: '#ede9fe', color: '#7c3aed', icon: '📝' },
  pyp:        { label: 'Previous Year',       bg: '#fef3c7', color: '#b45309', icon: '📅' },
  daily_quiz: { label: 'Daily Quiz',          bg: '#d1fae5', color: '#065f46', icon: '⚡' },
  sectional:  { label: 'Sectional',           bg: '#dbeafe', color: '#1d4ed8', icon: '📖' },
};

function TestLobbyInner() {
  const { testId } = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuthStore();
  const isAdmin    = user?.role === 'superadmin';

  const [test, setTest]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [paywallData, setPaywallData] = useState(null); // {price}
  const [language, setLanguage] = useState(null); // force user to select
  const [agreed, setAgreed]     = useState({});
  const [counting, setCounting] = useState(false);
  const [counter, setCounter]   = useState(3);
  const [tab, setTab]           = useState('overview');
  const [sysOk, setSysOk]       = useState({ internet: null, screen: null });

  useEffect(() => {
    api.get(`/tests/${testId}`)
      .then(r => { const t = r.data?.data; if (!t) throw new Error('No data'); setTest(t); if (t.language === 'hi') setLanguage('hi'); })
      .catch(e => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  }, [testId]);

  useEffect(() => {
    const t1 = setTimeout(() => setSysOk(s => ({ ...s, internet: navigator.onLine })), 600);
    const t2 = setTimeout(() => setSysOk(s => ({ ...s, screen: window.screen.width >= 1024 })), 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (!counting) return;
    if (counter <= 0) { navigate(`/test/${testId}`, { state: { language } }); return; }
    const t = setTimeout(() => setCounter(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [counting, counter]);

  const AGREES = [
    { id: 'a', label: 'I have read and understood all exam instructions.' },
    { id: 'b', label: `I have a stable internet connection and charged device.` },
    { id: 'c', label: 'I will attempt honestly without any unfair means.' },
    { id: 'd', label: `I am in a quiet environment for the next ${test ? fmt(test.duration) : '—'}.` },
  ];
  const agreedAll = AGREES.every(i => agreed[i.id]);

  const handleBegin = async () => {
    if (!language) { toast.error('Please select an exam language first.'); return; }
    if (!agreedAll) { toast.error('Please accept all conditions first.'); return; }
    sessionStorage.setItem(`test_lang_${testId}`, language);
    // Pre-flight access check: hit the start endpoint
    try {
      await api.get(`/tests/${testId}/start`);
      // Access OK — proceed to countdown
      setCounting(true);
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 403 && data?.requiresPayment) {
        // Fetch plans to show the actual plan value
        try {
          const subRes = await api.get(isAdmin ? '/institute/subscription' : '/payments/student-plans');
          const plans = isAdmin ? (subRes.data?.data?.plans || []) : (subRes.data?.data || []);
          const paidPlans = plans.filter(p => p.price > 0).sort((a,b) => a.price - b.price);
          setPaywallData({ price: data.price || 0, lowestPlan: paidPlans[0] || null });
        } catch (e) {
          setPaywallData({ price: data.price || 0, lowestPlan: null });
        }
      } else {
        toast.error(data?.error || 'Failed to start test');
      }
    }
  };

  const goBack = () => navigate(isAdmin ? '/admin/tests' : '/student/tests');

  // ── Paywall screen ─────────────────────────────────────
  if (paywallData) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#fef3c7 0%,#fffbeb 100%)', fontFamily:"'Inter',-apple-system,sans-serif", padding:24 }}>
      <div style={{ background:'#fff', borderRadius:20, padding:'36px 32px', maxWidth:420, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.1)', textAlign:'center' }}>
        <div style={{ fontSize:52, marginBottom:12 }}>🔒</div>
        <h2 style={{ fontSize:20, fontWeight:900, color:'#111827', margin:'0 0 8px' }}>Premium Test</h2>
        <p style={{ fontSize:13, color:'#6b7280', margin:'0 0 20px', lineHeight:1.7 }}>
          This test requires a <strong style={{color:'#7c3aed'}}>Premium subscription</strong> to access.
          <br/>
          {paywallData.lowestPlan ? (
            <span style={{ display: 'inline-block', marginTop: 6 }}>
              Unlock ALL tests starting at just <strong style={{color:'#16a34a', fontSize:14}}>₹{paywallData.lowestPlan.price}/{paywallData.lowestPlan.interval}</strong>!
            </span>
          ) : (
            paywallData.price > 0 && ` (Individual Value: ₹${paywallData.price})`
          )}
        </p>

        <div style={{ background:'linear-gradient(135deg,#f5f3ff,#eff6ff)', border:'1px solid #ddd6fe', borderRadius:14, padding:'16px 20px', marginBottom:20, textAlign:'left' }}>
          <p style={{ fontWeight:800, fontSize:13, color:'#6d28d9', margin:'0 0 10px' }}>⚡ Premium Plan Includes:</p>
          {['Access to ALL premium tests','Subject-wise deep analytics','Unlimited attempts','Priority support'].map((f,i) => (
            <div key={i} style={{ display:'flex', gap:8, fontSize:12, color:'#4c1d95', marginBottom:6 }}>
              <span style={{ color:'#059669', fontWeight:700 }}>✓</span><span>{f}</span>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
          <div style={{ background:'#f5f3ff', border:'1px solid #ddd6fe', borderRadius:10, padding:'12px 16px', textAlign:'center' }}>
            <p style={{ fontWeight:700, fontSize:12, color:'#6d28d9', margin:0 }}>
              🎁 Free trial available on select plans — choose what suits you!
            </p>
          </div>
          <button onClick={() => navigate(isAdmin ? '/institute/subscription' : '/student/subscription')}
            style={{ padding:'13px', background:'linear-gradient(135deg,#7c3aed,#6366f1)', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:800, cursor:'pointer', boxShadow:'0 4px 16px rgba(124,58,237,0.35)' }}>
            🚀 View Plans & Upgrade →
          </button>
        </div>

        <button onClick={goBack} style={{ background:'none', border:'none', color:'#9ca3af', fontSize:12, cursor:'pointer' }}>← Go Back</button>
        {!isAdmin && (
          <p style={{ fontSize:11, color:'#9ca3af', margin:'8px 0 0' }}>Institute students: contact your admin — your institute plan may already cover this!</p>
        )}
      </div>
    </div>
  );

  // ── Shared styles ──────────────────────────────────────
  const card  = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px' };
  const small = { fontSize: 12, color: '#6b7280' };
  const label = { fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 };
  const bdg   = (bg, col) => ({ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: bg, color: col, whiteSpace: 'nowrap' });

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', flexDirection: 'column', gap: 14 }}>
      <div style={{ width: 40, height: 40, border: '3px solid #e0e7ff', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'sp 0.8s linear infinite' }} />
      <p style={{ fontSize: 14, color: '#6b7280', fontWeight: 600 }}>Loading exam details...</p>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error || !test) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 36 }}>⚠️</div>
      <p style={{ fontSize: 16, fontWeight: 700, color: '#1f2937' }}>Test not found</p>
      <p style={{ fontSize: 13, color: '#6b7280' }}>{error}</p>
      <button onClick={goBack} style={{ padding: '8px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>← Back</button>
    </div>
  );

  if (counting) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <p style={{ color: '#94a3b8', fontSize: 13, letterSpacing: 6, textTransform: 'uppercase', marginBottom: 24 }}>Starting in</p>
      <div style={{ fontSize: 96, fontWeight: 900, color: '#fff', lineHeight: 1, textShadow: '0 0 60px rgba(99,102,241,0.8)' }}>{counter > 0 ? counter : '🚀'}</div>
      <p style={{ color: '#64748b', fontSize: 14, marginTop: 24 }}>Good luck!</p>
    </div>
  );

  const type  = TYPE_MAP[test.type] || { label: test.type, bg: '#f3f4f6', color: '#374151', icon: '📋' };
  const totalQ = Number(test.totalQuestions) || 0;
  const totalM = Number(test.totalMarks) || 0;
  const mpq   = totalQ > 0 ? (totalM / totalQ).toFixed(1) : '—';
  const neg   = test.negativeMarkingEnabled ? (Number(test.negativeMarkingValue) || 0.25) : 0;
  const bil   = test.language === 'bilingual' || test.language === 'hi';

  const TAB_BTN = (id, lbl) => ({
    padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
    border: `1px solid ${tab === id ? '#6366f1' : '#e5e7eb'}`,
    background: tab === id ? '#6366f1' : '#fff',
    color: tab === id ? '#fff' : '#6b7280', cursor: 'pointer',
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: "'Inter', -apple-system, sans-serif", fontSize: 13 }}>

      {/* ── Top bar ──────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>⚡</div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 13, margin: 0, color: '#111827' }}>Abhyo</p>
            <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>{isAdmin ? '👁 Admin Preview' : 'Exam Lobby'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          {isAdmin && <span className="hidden sm:inline-block" style={{ ...bdg('#fef3c7','#b45309'), fontSize: 11 }}>👁 Preview Mode</span>}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: sysOk.internet ? '#d1fae5' : sysOk.internet === null ? '#f3f4f6' : '#fef3c7', color: sysOk.internet ? '#065f46' : '#b45309', border: `1px solid ${sysOk.internet ? '#a7f3d0' : '#e5e7eb'}` }}>
            <span style={{ width:6,height:6,borderRadius:'50%',background:'currentColor',display:'inline-block' }}/>
            {sysOk.internet === null ? 'Checking…' : sysOk.internet ? 'Ready' : 'Connection?'}
          </div>
          <button onClick={goBack} className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg cursor-pointer transition-colors">✕ Exit</button>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto p-4 lg:p-5 flex flex-col lg:flex-row gap-4 lg:gap-6 items-start">

        {/* ── LEFT ─────────────────────────────────────── */}
        <div className="flex-1 w-full flex flex-col gap-3.5 min-w-0">

          {/* Hero */}
          <div style={{ ...card, padding: '18px 20px', background: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)', border: 'none', color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, background:'rgba(255,255,255,0.06)', borderRadius:'50%', pointerEvents:'none' }}/>
            <div style={{ position:'absolute', bottom:-20, left:-20, width:80, height:80, background:'rgba(255,255,255,0.06)', borderRadius:'50%', pointerEvents:'none' }}/>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10, position:'relative' }}>
              <span style={{ ...bdg(type.bg, type.color) }}>{type.icon} {type.label}</span>
              <span style={{ ...bdg('rgba(255,255,255,0.2)','#fff') }}>{test.category || 'General'}</span>
              {bil && <span style={{ ...bdg('rgba(255,255,255,0.2)','#fff') }}>🌐 Bilingual</span>}
              <span style={{ marginLeft:'auto', ...bdg(test.isFree?'rgba(16,185,129,0.2)':'rgba(251,191,36,0.2)', test.isFree?'#6ee7b7':'#fbbf24') }}>
                {test.isFree ? 'FREE' : '★ Premium'}
              </span>
            </div>
            <h1 style={{ fontSize:17, fontWeight:800, margin:'0 0 4px', lineHeight:1.3, position:'relative' }}>{test.title}</h1>
            {test.type==='pyp' && <div style={{ fontSize:12, opacity:0.8, marginBottom:6 }}>{test.examName && `📋 ${test.examName}`}{test.year && ` · ${test.year}`}{test.shift && ` · ${test.shift}`}</div>}
            {test.description && <p style={{ fontSize:12, opacity:0.75, margin:'4px 0 12px', lineHeight:1.5, position:'relative' }}>{test.description}</p>}

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 relative">
              {[['📚',totalQ||'—','Questions'],['⏱',fmt(test.duration),'Duration'],['🎯',totalM||'—','Total Marks'],['🏆',test.passingMarks||'—','Pass Marks']].map(([e,v,l])=>(
                <div key={l} style={{ background:'rgba(255,255,255,0.12)', borderRadius:8, padding:'10px 8px', textAlign:'center' }}>
                  <div style={{ fontSize:16, marginBottom:4 }}>{e}</div>
                  <div style={{ fontSize:18, fontWeight:900, lineHeight:1 }}>{v}</div>
                  <div style={{ fontSize:9, opacity:0.7, marginTop:3, textTransform:'uppercase', letterSpacing:0.5 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:6 }}>
            {[['overview','📊 Overview'],['instructions','📋 Instructions'],['security','🔒 Security']].map(([id,lbl])=>(
              <button key={id} style={TAB_BTN(id,lbl)} onClick={()=>setTab(id)}>{lbl}</button>
            ))}
          </div>

          {/* Tab: Overview */}
          {tab === 'overview' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {/* Marking scheme */}
              <div style={card}>
                <p style={label}>Marking Scheme</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                  {[
                    { v:`+${mpq}`, sublabel:'Correct', bg:'#f0fdf4', color:'#16a34a', border:'#bbf7d0' },
                    { v: neg>0?`-${neg}`:'0', sublabel:'Wrong', bg: neg>0?'#fef2f2':'#f9fafb', color: neg>0?'#dc2626':'#9ca3af', border: neg>0?'#fecaca':'#e5e7eb' },
                    { v:'0', sublabel:'Skipped', bg:'#f9fafb', color:'#9ca3af', border:'#e5e7eb' },
                  ].map(s=>(
                    <div key={s.sublabel} style={{ textAlign:'center', padding:'12px 8px', borderRadius:8, background:s.bg, border:`1px solid ${s.border}` }}>
                      <div style={{ fontSize:22, fontWeight:900, color:s.color, lineHeight:1 }}>{s.v}</div>
                      <div style={{ fontSize:10, color:s.color, opacity:0.7, marginTop:3 }}>{s.sublabel}</div>
                    </div>
                  ))}
                </div>
                {test.negativeMarkingEnabled && (
                  <div style={{ marginTop:10, padding:'8px 12px', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, fontSize:12, color:'#92400e' }}>
                    ⚠️ Negative marking is active. Skip if unsure.
                  </div>
                )}
              </div>

              {/* PYP Cutoff */}
              {test.type==='pyp' && (test.cutoffMarks||test.expectedCutoff) && (
                <div style={{ ...card, background:'#fffbeb', borderColor:'#fde68a' }}>
                  <p style={{ ...label, color:'#b45309' }}>Cutoff Info {test.year&&`(${test.year})`}</p>
                  <div className="flex gap-6 sm:gap-8">
                    {test.cutoffMarks && <div><div style={{ color:'#9ca3af', fontSize:11 }}>Official Cutoff</div><div style={{ fontSize:24, fontWeight:900, color:'#b45309' }}>{test.cutoffMarks}</div></div>}
                    {test.expectedCutoff && <div><div style={{ color:'#9ca3af', fontSize:11 }}>Expected</div><div style={{ fontSize:24, fontWeight:900, color:'#16a34a' }}>{test.expectedCutoff}</div></div>}
                  </div>
                </div>
              )}

              {/* Community stats */}
              {Number(test.totalAttempts)>0 && (
                <div style={card}>
                  <p style={label}>Community Stats</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[[test.totalAttempts,'Attempts','#6366f1'],[`${Math.round(test.avgScore||0)}%`,'Avg Score','#16a34a'],[fmt(test.duration),'Duration','#0369a1']].map(([v,l,c])=>(
                      <div key={l} style={{ padding:'10px 6px', background:'#f9fafb', borderRadius:8, border:'1px solid #e5e7eb' }}>
                        <div style={{ fontSize:18, fontWeight:800, color:c, lineHeight:1 }}>{v}</div>
                        <div style={{ fontSize:10, color:'#9ca3af', marginTop:3 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Instructions */}
          {tab==='instructions' && (
            <div style={card}>
              <p style={label}>Exam Instructions</p>
              <ol style={{ padding:0, margin:0, listStyle:'none', display:'flex', flexDirection:'column', gap:8 }}>
                {[
                  'Once started, the timer cannot be paused.',
                  'Do not refresh, navigate away, or close this tab.',
                  'Correct answers earn marks shown; wrong answers may incur negative marking.',
                  'Marked-for-review questions are NOT treated as answered.',
                  'Test auto-submits when time runs out.',
                  'Tab-switch events are logged.',
                  'Only one active session is allowed per student per test.',
                ].map((t,i)=>(
                  <li key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', color:'#374151', lineHeight:1.5, fontSize:13 }}>
                    <span style={{ minWidth:20, height:20, background:'#ede9fe', color:'#6d28d9', borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', font:'700 10px/1 sans-serif', flexShrink:0, marginTop:2 }}>{i+1}</span>
                    {t}
                  </li>
                ))}
              </ol>
              <div style={{ marginTop:12, padding:'10px 12px', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, fontSize:12, color:'#1e40af' }}>
                ℹ️ Mark questions for review and revisit before final submission. Marked ≠ Answered.
              </div>
            </div>
          )}

          {/* Tab: Security */}
          {tab==='security' && (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={card}>
                <p style={label}>Proctoring & Security</p>
                {['👁 Tab-switch events are monitored and timestamped.','🖥 Fullscreen exit triggers an automatic warning.','🚫 Right-click is disabled during the exam.','⏱ Timer runs server-side — closing tab does NOT pause it.','🔐 One attempt per student per test.'].map((t,i)=>(
                  <div key={i} style={{ padding:'8px 12px', background:'#f9fafb', border:'1px solid #f3f4f6', borderRadius:8, fontSize:12, color:'#374151', marginBottom:6 }}>{t}</div>
                ))}
              </div>
              <div style={card}>
                <p style={{ ...label, marginBottom:6 }}>Fullscreen (Recommended)</p>
                <button onClick={()=>{ try{document.documentElement.requestFullscreen?.();}catch{} }}
                  style={{ width:'100%', padding:'9px', background:'#f3f4f6', border:'1px solid #e5e7eb', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', color:'#374151' }}>
                  🔲 Enable Fullscreen
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ─────────────────────────────── */}
        <div className="w-full lg:w-[280px] xl:w-[300px] flex-shrink-0 flex flex-col gap-3">

          {/* Language Selection (Mandatory) */}
          <div style={{ ...card, border: !language ? '2px solid #f87171' : '1px solid #e5e7eb' }}>
            <p style={{ ...label, color: !language ? '#dc2626' : undefined }}>Select Exam Language *</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {[{id:'en',flag:'🇬🇧',label:'English'},{id:'hi',flag:'🇮🇳',label:'हिंदी'}].map(l=>(
                <button key={l.id} onClick={()=>setLanguage(l.id)}
                  style={{ padding:'10px 8px', borderRadius:8, fontWeight:700, fontSize:13, border:`1px solid ${language===l.id?'#6366f1':'#e5e7eb'}`, background:language===l.id?'#e0e7ff':'#f9fafb', color:language===l.id?'#4f46e5':'#374151', cursor:'pointer', transition:'all 0.2s' }}>
                  {l.flag} {l.label}
                  {language===l.id && <span style={{ marginLeft:6 }}>✓</span>}
                </button>
              ))}
            </div>
            {!language && <p style={{ fontSize: 11, color: '#dc2626', marginTop: 6, marginBottom: 0 }}>Please select your preferred language to continue.</p>}
          </div>

          {/* System check */}
          <div style={card}>
            <p style={label}>System Check</p>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {[
                { label:'Internet', ok:sysOk.internet, detail: sysOk.internet===null?'Checking…':sysOk.internet?'Stable':'Issue detected' },
                { label:'Screen', ok:sysOk.screen, detail: sysOk.screen===null?'Checking…':`${window.screen.width}px` },
                { label:'Browser', ok:true, detail:'Compatible' },
              ].map(s=>{
                const c = s.ok===null?'#9ca3af':s.ok?'#16a34a':'#d97706';
                return (
                  <div key={s.label} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', background: s.ok===null?'#f9fafb':s.ok?'#f0fdf4':'#fffbeb', borderRadius:8, border:`1px solid ${s.ok===null?'#e5e7eb':s.ok?'#bbf7d0':'#fde68a'}`, fontSize:12 }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:c, flexShrink:0 }}/>
                    <span style={{ fontWeight:600, color:c }}>{s.label}</span>
                    <span style={{ marginLeft:'auto', color:'#6b7280' }}>{s.detail}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick facts */}
          <div style={card}>
            <p style={label}>Quick Facts</p>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {[
                ['Shuffle Qs', test.shuffleQuestions?'✓ Yes':'✗ No'],
                ['Result', test.showResultImmediately?'Instant':'Later'],
                ['Review', test.allowReview?'✓ Allowed':'✗ No'],
                ['Difficulty', test.difficultyTag||'Mixed'],
                ['Per Question', `+${mpq} marks`],
              ].map(([k,v])=>(
                <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'4px 0', borderBottom:'1px solid #f3f4f6' }}>
                  <span style={{ color:'#6b7280' }}>{k}</span>
                  <span style={{ fontWeight:700, color:'#111827' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Declaration */}
          <div style={card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <p style={{ ...label, marginBottom:0 }}>Declaration</p>
              {!agreedAll && (
                <button onClick={()=>{ const all={}; AGREES.forEach(i=>{all[i.id]=true;}); setAgreed(all); }}
                  style={{ fontSize:11, color:'#6366f1', background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>Agree All</button>
              )}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {AGREES.map(item=>(
                <button key={item.id} onClick={()=>setAgreed(p=>({...p,[item.id]:!p[item.id]}))}
                  style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'8px 10px', borderRadius:8, border:`1px solid ${agreed[item.id]?'#a7f3d0':'#e5e7eb'}`, background:agreed[item.id]?'#f0fdf4':'#f9fafb', cursor:'pointer', textAlign:'left', fontSize:11, color:agreed[item.id]?'#065f46':'#374151', lineHeight:1.5 }}>
                  <span style={{ flexShrink:0, fontSize:14, marginTop:0 }}>{agreed[item.id]?'☑':'☐'}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action */}
          {isAdmin ? (
            <div style={{ ...card, background:'#fffbeb', borderColor:'#fde68a', textAlign:'center' }}>
              <p style={{ fontWeight:700, fontSize:13, color:'#b45309', margin:'0 0 4px' }}>👁 Admin Preview</p>
              <p style={{ fontSize:11, color:'#92400e', margin:'0 0 10px' }}>Students see this before starting.</p>
              <button onClick={goBack} style={{ width:'100%', padding:'9px', background:'#fff', border:'1px solid #fde68a', borderRadius:8, fontSize:12, fontWeight:600, color:'#92400e', cursor:'pointer' }}>← Back to Tests</button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <button onClick={handleBegin} disabled={!agreedAll || !language}
                style={{ padding:'13px', borderRadius:12, fontSize:14, fontWeight:800, border:'none', cursor:(agreedAll && language)?'pointer':'not-allowed', background:(agreedAll && language)?'linear-gradient(135deg,#6366f1,#8b5cf6)':'#e5e7eb', color:(agreedAll && language)?'#fff':'#9ca3af', boxShadow:(agreedAll && language)?'0 4px 16px rgba(99,102,241,0.35)':'none', transition:'all 0.15s' }}>
                {(agreedAll && language) ? '🚀 Begin Exam →' : '🔒 Accept Conditions & Language'}
              </button>
              {(!agreedAll || !language) && <p style={{ textAlign:'center', fontSize:11, color:'#9ca3af', margin:0 }}>Check all boxes and select language</p>}
              <button onClick={goBack} style={{ padding:'8px', background:'none', border:'none', color:'#9ca3af', fontSize:12, cursor:'pointer' }}>← Back to Tests</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TestLobby() {
  return <LobbyErrorBoundary><TestLobbyInner /></LobbyErrorBoundary>;
}
