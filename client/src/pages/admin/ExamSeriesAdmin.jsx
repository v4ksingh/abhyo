import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Edit2, Trash2, Eye, BookOpen, Users, ToggleLeft, ToggleRight,
  Star, Layers, ChevronRight, Search, Tags, CheckSquare, X, Check, ExternalLink, FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import Editor from 'react-simple-wysiwyg';

const CATEGORIES = ['UPSC','SSC','Banking','Railway','Defence','State PSC','Engineering','Medical','Custom'];

// ── Inline style tokens ─────────────────────────────────────────
const card   = { background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, padding:'18px 20px' };
const badgeC = (c) => ({ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap',
  background:c==='Defence'?'#dbeafe':c==='UPSC'?'#fef3c7':c==='SSC'?'#d1fae5':'#f3f4f6',
  color:c==='Defence'?'#1d4ed8':c==='UPSC'?'#92400e':c==='SSC'?'#065f46':'#374151'
});
const input = { width:'100%', padding:'9px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit', color: '#111827', backgroundColor: '#fff' };
const btn   = (v='primary') => ({
  padding:'8px 18px', borderRadius:9, fontSize:13, fontWeight:700, border:'none', cursor:'pointer',
  background:v==='primary'?'#6366f1':v==='danger'?'#ef4444':v==='ghost'?'#f3f4f6':'#fff',
  color:v==='primary'?'#fff':v==='danger'?'#fff':v==='ghost'?'#374151':'#374151',
  border:v==='outline'?'1px solid #d1d5db':'none',
});

// ── Small components ────────────────────────────────────────────
function Stat({ emoji, label, value }) {
  return (
    <div style={{ textAlign:'center', padding:'10px 8px', background:'#f9fafb', borderRadius:10, border:'1px solid #e5e7eb' }}>
      <div style={{ fontSize:18, marginBottom:4 }}>{emoji}</div>
      <div style={{ fontSize:17, fontWeight:800, color:'#111827', lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:10, color:'#9ca3af', marginTop:2, textTransform:'uppercase', letterSpacing:0.5 }}>{label}</div>
    </div>
  );
}

// ── Series Card ─────────────────────────────────────────────────
function SeriesCard({ s, onEdit, onDelete, onToggle, onAddTest, onAssign, onManageNotes }) {
  return (
    <div style={{ ...card, padding:'16px 18px', position:'relative', opacity: s.isActive?1:0.6 }}>
      {s.isFeatured && (
        <div style={{ position:'absolute', top:12, right:12, background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10 }}>
          ⭐ Featured
        </div>
      )}
      <div style={{ display:'flex', gap:10, marginBottom:10, alignItems:'flex-start' }}>
        <div style={{ width:40, height:40, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
          {s.category==='Defence'?'🛡':s.category==='UPSC'?'🏛':s.category==='SSC'?'📋':'📚'}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontWeight:800, color:'#111827', fontSize:14, margin:0, lineHeight:1.3 }}>{s.title}</p>
          <p style={{ fontSize:11, color:'#6b7280', margin:'2px 0 6px' }}>{s.examName}</p>
          <span style={badgeC(s.category)}>{s.category}</span>
        </div>
      </div>
      <p style={{ fontSize:12, color:'#6b7280', margin:'0 0 12px', lineHeight:1.5 }}>
        {s.tagline || (s.description ? s.description.replace(/<[^>]+>/g, '').slice(0,90) + '...' : 'No description')}
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:12 }}>
        <Stat emoji="📝" label="Tests" value={s.totalTests||0} />
        <Stat emoji="👥" label="Students" value={s.totalStudents||0} />
        <Stat emoji="💎" label="Access" value={s.isFree ? 'FREE' : 'PRO'} />
      </div>
      {/* Action buttons */}
      <div style={{ display:'flex', gap:6, marginBottom:6 }}>
        <button
          onClick={() => onAddTest(s)}
          style={{ flex:1, padding:'9px 8px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
          <Plus size={13}/> Add Test
        </button>
        <button
          onClick={() => onAssign(s)}
          style={{ flex:1, padding:'9px 8px', background:'#eff6ff', border:'1px solid #bfdbfe', color:'#1d4ed8', borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer' }}>
          📎 Assign Existing
        </button>
      </div>
      {/* Notes button */}
      <button
        onClick={() => onManageNotes(s)}
        style={{ width:'100%', padding:'8px', background:'#f0fdf4', border:'1px solid #a7f3d0', color:'#065f46', borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5, marginBottom:6 }}>
        <FileText size={13}/> 📝 Manage Study Notes
      </button>
      <div style={{ display:'flex', gap:6 }}>
        <button style={{ ...btn('ghost'), flex:1, fontSize:12 }} onClick={() => onEdit(s)}>✏️ Edit</button>
        <button
          onClick={() => onToggle(s)}
          style={{ ...btn('ghost'), flex:1, fontSize:12, color: s.isActive?'#059669':'#6b7280' }}>
          {s.isActive?'✓ Active':'✗ Inactive'}
        </button>
        <button style={{ ...btn('danger'), fontSize:12, padding:'8px 12px' }} onClick={() => onDelete(s.id)}>🗑</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
export default function AdminExamSeries() {
  const navigate = useNavigate();
  const [series,  setSeries]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [modal,   setModal]   = useState(null); // null | 'create' | 'edit' | 'assign'
  const [editing, setEditing] = useState(null); // current series being edited
  const [tests,   setTests]   = useState([]);   // all tests (for assign modal)
  const [assigned,setAssigned]= useState([]);   // assigned testIds
  const [saving,  setSaving]  = useState(false);

  const [form, setForm] = useState({
    title:'', examName:'', tagline:'', description:'', category:'Defence',
    isFree:true, price:0, isActive:true, isFeatured:false,
    examDetails:{ organizer:'', applicationDate:'', examDate:'', vacancy:'', website:'' },
    eligibility:[{ label:'Age', value:'' },{ label:'Education', value:'' }],
    importantDates:[{ event:'Application Start', date:'' }],
    highlights:[''],
    examPattern:[{ paper:'', subject:'', questions:'', marks:'', time:'', negativeMarking:'' }],
    syllabus:[{ subject:'', topics:'' }],
    faqs:[{ question:'', answer:'' }],
  });

  const fetchSeries = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/exam-series/admin/all');
      setSeries(r.data.data);
    } catch { toast.error('Failed to load series'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSeries(); }, [fetchSeries]);

  const openCreate = () => {
    navigate('/admin/exam-series/form');
  };

  const openEdit = (s) => {
    navigate('/admin/exam-series/form', { state: { editing: s } });
  };

  const openAssign = async (s) => {
    setEditing(s);
    try {
      const [allTests, seriesTests] = await Promise.all([
        api.get('/tests?limit=200'),
        api.get(`/exam-series/admin/${s.id}/tests`),
      ]);
      setTests(allTests.data.data?.tests || []);
      setAssigned(seriesTests.data.data.map(t => t.id));
      setModal('assign');
    } catch { toast.error('Failed to load tests'); }
  };

  const handleSave = async () => {
    if (!form.title || !form.examName) { toast.error('Title and Exam Name required'); return; }
    setSaving(true);
    try {
      if (modal === 'edit' && editing) {
        await api.put(`/exam-series/admin/${editing.id}`, form);
        toast.success('Series updated');
      } else {
        await api.post('/exam-series/admin/create', form);
        toast.success('Series created');
      }
      setModal(null);
      fetchSeries();
    } catch (e) { toast.error(e.response?.data?.error || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this exam series? Tests will be unlinked but not deleted.')) return;
    try {
      await api.delete(`/exam-series/admin/${id}`);
      toast.success('Deleted'); fetchSeries();
    } catch { toast.error('Delete failed'); }
  };

  const handleToggle = async (s) => {
    try {
      await api.put(`/exam-series/admin/${s.id}`, { isActive: !s.isActive });
      fetchSeries();
    } catch { toast.error('Failed'); }
  };

  const handleAssignSave = async () => {
    setSaving(true);
    try {
      await api.post(`/exam-series/admin/${editing.id}/assign-tests`, { testIds: assigned });
      toast.success('Tests assigned!');
      setModal(null); fetchSeries();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  // Navigate to Tests page with series pre-filled in state
  const handleAddTest = (s) => {
    navigate('/admin/tests', { state: { openCreateWithSeries: s.id, seriesName: s.examName } });
  };

  // Navigate to Notes management page
  const handleManageNotes = (s) => {
    navigate(`/admin/exam-series/${s.id}/notes`, { state: { seriesTitle: s.title } });
  };

  const sf = (field, val) => setForm(p => ({ ...p, [field]: val }));
  const sfNested = (parent, field, val) => setForm(p => ({ ...p, [parent]: { ...p[parent], [field]: val } }));
  const sfArr = (field, idx, key, val) => setForm(p => ({
    ...p, [field]: p[field].map((item, i) => i === idx ? (key ? { ...item, [key]: val } : val) : item)
  }));
  const addArr = (field, template) => setForm(p => ({ ...p, [field]: [...p[field], template] }));
  const delArr = (field, idx) => setForm(p => ({ ...p, [field]: p[field].filter((_,i) => i !== idx) }));

  const filtered = series.filter(s => {
    const matchCat = !catFilter || s.category === catFilter;
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.examName.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, fontFamily:'sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:36, height:36, border:'3px solid #e0e7ff', borderTopColor:'#6366f1', borderRadius:'50%', animation:'sp 0.7s linear infinite', margin:'0 auto 12px' }}/>
        <p style={{ color:'#6b7280', fontSize:13 }}>Loading exam series...</p>
        <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ padding:'20px 24px', fontFamily:"'Inter',-apple-system,sans-serif", fontSize:13 }}>
      <style>{`
        .rsw-editor { color: #111827 !important; }
        .rsw-toolbar { text-align: left !important; }
        .rsw-dd { color: #111827 !important; }
        .rsw-dd ul, .rsw-dd li, .rsw-dd button { color: #111827 !important; text-align: left; }
        .rsw-dd button:not([disabled]):hover { background: #f3f4f6 !important; }
      `}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:18, fontWeight:800, color:'#111827', margin:0 }}>🏛 Exam Series</h1>
          <p style={{ fontSize:12, color:'#6b7280', margin:'3px 0 0' }}>Create landing pages for exams (NDA, UPSC, SSC etc.)</p>
        </div>
        <button style={{ ...btn('primary'), display:'flex', alignItems:'center', gap:6 }} onClick={openCreate}>
          <Plus size={14}/> New Exam Series
        </button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:180 }}>
          <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}/>
          <input style={{ ...input, paddingLeft:30 }} placeholder="Search series..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select style={{ ...input, width:'auto' }} value={catFilter} onChange={e=>setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Series Grid */}
      {filtered.length === 0 ? (
        <div style={{ ...card, textAlign:'center', padding:48 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📚</div>
          <p style={{ fontWeight:700, color:'#374151', fontSize:15, marginBottom:6 }}>No Exam Series Yet</p>
          <p style={{ color:'#9ca3af', fontSize:13, marginBottom:16 }}>Create your first exam series like "NDA 2026 Mock Test Pack"</p>
          <button style={btn('primary')} onClick={openCreate}>+ Create First Series</button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(310px,1fr))', gap:14 }}>
          {filtered.map(s => (
            <SeriesCard
              key={s.id}
              s={s}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
              onAddTest={handleAddTest}
              onAssign={openAssign}
              onManageNotes={handleManageNotes}
            />
          ))}
        </div>
      )}



      {/* ── Assign Tests Modal ──────────────────────────────── */}
      {modal === 'assign' && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:560, boxShadow:'0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h2 style={{ fontSize:15, fontWeight:800, margin:0, color:'#111827' }}>📎 Assign Tests — {editing?.title}</h2>
              <button onClick={()=>setModal(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7280' }}><X size={18}/></button>
            </div>
            <div style={{ padding:'14px 20px', maxHeight:'55vh', overflowY:'auto', display:'flex', flexDirection:'column', gap:6 }}>
              {tests.length === 0 && (
                <div style={{ textAlign:'center', padding:'20px 10px' }}>
                  <p style={{ color:'#9ca3af', fontSize:12, marginBottom:12 }}>No tests found yet. Create a test first and link it to this series.</p>
                  <button
                    onClick={() => { setModal(null); handleAddTest(editing); }}
                    style={{ padding:'8px 18px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                    + Create New Test for this Series
                  </button>
                </div>
              )}
              {tests.map(t => {
                const isAssigned = assigned.includes(t.id);
                return (
                  <div key={t.id}
                    onClick={() => setAssigned(p => isAssigned ? p.filter(x=>x!==t.id) : [...p, t.id])}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, cursor:'pointer', border:`1px solid ${isAssigned?'#a7f3d0':'#e5e7eb'}`, background:isAssigned?'#f0fdf4':'#f9fafb' }}>
                    <div style={{ width:18, height:18, borderRadius:4, border:`2px solid ${isAssigned?'#10b981':'#d1d5db'}`, background:isAssigned?'#10b981':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {isAssigned && <Check size={11} color="#fff"/>}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontWeight:600, color:'#111827', fontSize:12, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</p>
                      <p style={{ fontSize:10, color:'#6b7280', margin:'2px 0 0' }}>{t.type.toUpperCase()} · {t.totalQuestions}Q · {t.duration}m · {t.isFree?'FREE':`₹${t.price}`}</p>
                    </div>
                    <span style={{ fontSize:10, fontWeight:700, color:isAssigned?'#059669':'#9ca3af' }}>{isAssigned?'✓ Added':'+ Add'}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ padding:'12px 20px', borderTop:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:12, color:'#6b7280' }}>{assigned.length} test(s) selected</span>
              <div style={{ display:'flex', gap:8 }}>
                <button style={btn('ghost')} onClick={()=>setModal(null)}>Cancel</button>
                <button style={btn('primary')} onClick={handleAssignSave} disabled={saving}>
                  {saving ? 'Saving…' : '✓ Save Assignment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
