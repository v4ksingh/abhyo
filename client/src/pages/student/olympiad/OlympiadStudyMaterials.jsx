import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';
import {
  BookOpen, FileText, Video, PenLine, Target,
  Download, ExternalLink, Play, Search, Filter,
  ChevronRight, ArrowLeft, Lock, CheckCircle,
} from 'lucide-react';

const SUBJECTS = [
  { label: 'All Subjects', value: '' },
  { label: 'Mathematics',  value: 'Mathematics' },
  { label: 'Science',      value: 'Science' },
  { label: 'Computer',     value: 'Computer' },
];
const CLASSES  = ['', 6, 7, 8, 9, 10, 11, 12];
const TYPES    = [
  { label: 'All Types', value: '' },
  { label: 'PDF Notes', value: 'pdf', icon: FileText, color: 'text-red-500 bg-red-50' },
  { label: 'Videos',    value: 'video', icon: Video,    color: 'text-blue-500 bg-blue-50' },
  { label: 'Notes',     value: 'notes', icon: PenLine,  color: 'text-green-500 bg-green-50' },
  { label: 'Practice',  value: 'practice', icon: Target, color: 'text-purple-500 bg-purple-50' },
];

function typeStyle(type) {
  const map = {
    pdf:      { icon: FileText, color: 'text-red-600',    bg: 'bg-red-50 border-red-200',    label: 'PDF Notes' },
    video:    { icon: Video,    color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200',   label: 'Video' },
    notes:    { icon: PenLine,  color: 'text-green-600',  bg: 'bg-green-50 border-green-200', label: 'Notes' },
    practice: { icon: Target,   color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', label: 'Practice' },
  };
  return map[type] || map.notes;
}

export default function OlympiadStudyMaterials() {
  const navigate = useNavigate();
  const [materials,   setMaterials]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [subject,     setSubject]     = useState('');
  const [classLevel,  setClassLevel]  = useState('');
  const [type,        setType]        = useState('');
  const [search,      setSearch]      = useState('');

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const params = {};
      if (subject)    params.subjectId   = subject;
      if (classLevel) params.classLevel  = classLevel;
      if (type)       params.type        = type;
      const res = await api.get('/olympiad/study-materials', { params });
      setMaterials(res.data.data || []);
    } catch { setMaterials([]); }
    setLoading(false);
  };

  useEffect(() => { fetchMaterials(); }, [subject, classLevel, type]);

  const filtered = materials.filter(m =>
    !search || m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.description?.toLowerCase().includes(search.toLowerCase())
  );

  // Group by subject
  const grouped = filtered.reduce((acc, m) => {
    const key = m.subject?.name || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  // Resolve relative paths (e.g. /uploads/...) to full URL using the API server root
  const resolveUrl = (url) => {
    if (!url) return '';
    const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');
    const serverRoot = apiBase.replace(/\/api\/?$/, ''); // e.g. https://abhyo.com/server
    try {
      const parsed = new URL(url);
      if (parsed.pathname.startsWith('/uploads/')) {
        // Old record: https://abhyo.com/uploads/... → https://abhyo.com/server/uploads/...
        return `${serverRoot}${parsed.pathname}`;
      }
      return url; // External URL — use as-is
    } catch { /* relative path */ }
    return `${serverRoot}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const openMaterial = (m) => {
    if (m.videoUrl)    return window.open(resolveUrl(m.videoUrl), '_blank', 'noopener,noreferrer');
    if (m.fileUrl)     return window.open(resolveUrl(m.fileUrl), '_blank', 'noopener,noreferrer');
    if (m.externalUrl) return window.open(resolveUrl(m.externalUrl), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-700 to-purple-700 text-white px-4 py-10">
        <div className="max-w-6xl mx-auto">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-indigo-200 hover:text-white text-sm mb-5 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black">Olympiad Study Materials</h1>
          </div>
          <p className="text-indigo-200 text-sm">PDFs, videos, notes & practice sets — all in one place.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filters bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-8 flex flex-wrap gap-3 items-center shadow-sm">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search materials..." className="bg-transparent text-sm outline-none w-full text-slate-700 placeholder-slate-400" />
          </div>

          {/* Subject */}
          <select value={subject} onChange={e => setSubject(e.target.value)}
            className="border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 cursor-pointer">
            {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          {/* Class */}
          <select value={classLevel} onChange={e => setClassLevel(e.target.value)}
            className="border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 cursor-pointer">
            <option value="">All Classes</option>
            {[6,7,8,9,10,11,12].map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>

          {/* Type */}
          <select value={type} onChange={e => setType(e.target.value)}
            className="border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 cursor-pointer">
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          <span className="text-xs text-slate-400 ml-auto">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !filtered.length ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 mx-auto text-slate-200 mb-4" />
            <p className="text-lg font-bold text-slate-600">No study materials found</p>
            <p className="text-sm text-slate-400 mt-1">Try clearing the filters above</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([subjectName, items]) => (
              <div key={subjectName}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
                  <h2 className="text-lg font-black text-slate-900">{subjectName}</h2>
                  <span className="text-xs text-slate-400 font-semibold">{items.length} items</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map(m => {
                    const ts = typeStyle(m.type);
                    const Icon = ts.icon;
                    const hasLink = m.videoUrl || m.fileUrl || m.externalUrl;
                    return (
                      <div key={m.id}
                        className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-md transition-all duration-200 group cursor-pointer"
                        onClick={() => hasLink && openMaterial(m)}>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${ts.bg}`}>
                            <Icon className={`w-5 h-5 ${ts.color}`} />
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${ts.bg} ${ts.color}`}>
                              {ts.label}
                            </span>
                            {m.classLevel && (
                              <span className="text-[10px] text-slate-400 font-semibold">Class {m.classLevel}</span>
                            )}
                          </div>
                        </div>

                        <h3 className="font-bold text-slate-900 text-sm mb-1 leading-tight">{m.title}</h3>
                        {m.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{m.description}</p>
                        )}
                        {m.chapter && (
                          <p className="text-[10px] text-indigo-500 font-semibold mt-2">📌 {m.chapter.name}</p>
                        )}

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.isFree ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                            {m.isFree ? '✅ Free' : '🔒 Registered'}
                          </span>
                          {hasLink ? (
                            <div className={`flex items-center gap-1 text-xs font-bold ${ts.color} group-hover:gap-2 transition-all`}>
                              {m.type === 'video' ? <Play className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                              {m.type === 'video' ? 'Watch' : 'Open'}
                              <ChevronRight className="w-3 h-3" />
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300">Coming soon</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
