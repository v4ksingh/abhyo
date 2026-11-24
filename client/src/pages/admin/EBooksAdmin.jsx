import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen, Plus, Edit2, Trash2, Search, Upload, X, Eye,
  Download, Star, DollarSign, FileText,
  CheckCircle, Globe, Zap, ShoppingBag, RefreshCw
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../lib/api";
import { getImageUrl } from "../../lib/imageUrl";

const CATEGORIES = [
  "General","Mathematics","Science","English","History","Geography",
  "Current Affairs","Aptitude","Reasoning","Computer","GK","Economics",
  "Polity","SSC","UPSC","Banking","Railway","Defence","Teaching","Other"
];
const LANGUAGES = ["English","Hindi","Bengali","Tamil","Telugu","Marathi","Kannada","Gujarati","Other"];
const ACCESS_OPTIONS = [
  { value:"free", label:"Free for All",      icon:Globe,       color:"text-green-600" },
  { value:"paid", label:"One-Time Purchase", icon:ShoppingBag, color:"text-blue-600"  },
  { value:"plan", label:"Subscribers Only",  icon:Zap,         color:"text-purple-600"},
];
const defaultForm = {
  title:"", author:"", description:"", category:"General",
  language:"English", tags:"", totalPages:"",
  isFree:false, price:"", mrp:"", accessType:"paid",
  isActive:true, isFeatured:false,
};

/* ── Modal (React Portal) ── */
function EBookModal({ show, onClose, editingId, form, setForm,
  coverPreview, setCoverPreview, pdfName, setPdfName,
  coverRef, pdfRef, onSubmit, submitting }) {

  if (!show) return null;

  return createPortal(
    <div
      onClick={onClose}
      style={{ position:"fixed",inset:0,zIndex:99999,background:"rgba(0,0,0,0.65)",
               display:"flex",alignItems:"center",justifyContent:"center",padding:"16px" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background:"#fff",borderRadius:16,width:"100%",maxWidth:680,
                 maxHeight:"90vh",overflowY:"auto",
                 boxShadow:"0 25px 60px rgba(0,0,0,0.35)" }}
      >
        {/* Header */}
        <div style={{ position:"sticky",top:0,background:"#fff",
                      padding:"20px 24px 14px",borderBottom:"1px solid #e2e8f0",
                      display:"flex",alignItems:"center",justifyContent:"space-between",zIndex:10 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:10,
                          background:"linear-gradient(135deg,#7c3aed,#4f46e5)",
                          display:"flex",alignItems:"center",justifyContent:"center" }}>
              <BookOpen size={18} color="#fff" />
            </div>
            <h2 style={{ margin:0,fontSize:18,fontWeight:700,color:"#1e293b" }}>
              {editingId ? "Edit eBook" : "Publish New eBook"}
            </h2>
          </div>
          <button onClick={onClose}
            style={{ padding:8,border:"none",background:"transparent",
                     cursor:"pointer",borderRadius:8,display:"flex",color:"#64748b" }}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} style={{ padding:"20px 24px",display:"flex",flexDirection:"column",gap:16 }}>

          {/* Cover + Title */}
          <div style={{ display:"flex",gap:16 }}>
            <div onClick={() => coverRef.current?.click()}
              style={{ width:108,height:136,borderRadius:12,border:"2px dashed #cbd5e1",
                       background:"#f8fafc",cursor:"pointer",flexShrink:0,
                       overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center" }}>
              {coverPreview
                ? <img src={coverPreview} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                : <div style={{ textAlign:"center",padding:8 }}>
                    <Upload size={22} color="#94a3b8" /><p style={{ fontSize:11,color:"#94a3b8",marginTop:4 }}>Cover</p>
                  </div>
              }
              <input ref={coverRef} type="file" accept="image/*" style={{ display:"none" }}
                onChange={e => { const f=e.target.files[0]; if(f) setCoverPreview(URL.createObjectURL(f)); }} />
            </div>
            <div style={{ flex:1,display:"flex",flexDirection:"column",gap:10 }}>
              <div>
                <label className="label">Title *</label>
                <input required type="text" className="input-field" placeholder="Complete SSC CGL Guide 2025"
                  value={form.title} onChange={e => setForm({...form,title:e.target.value})} />
              </div>
              <div>
                <label className="label">Author</label>
                <input type="text" className="input-field" placeholder="Dr. R.K. Sharma"
                  value={form.author} onChange={e => setForm({...form,author:e.target.value})} />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea className="input-field" style={{ height:80,resize:"none" }}
              placeholder="What will students learn?"
              value={form.description} onChange={e => setForm({...form,description:e.target.value})} />
          </div>

          {/* Category / Language / Pages */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10 }}>
            <div>
              <label className="label">Category</label>
              <select className="input-field" value={form.category}
                onChange={e => setForm({...form,category:e.target.value})}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Language</label>
              <select className="input-field" value={form.language}
                onChange={e => setForm({...form,language:e.target.value})}>
                {LANGUAGES.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Pages</label>
              <input type="number" className="input-field" placeholder="350"
                value={form.totalPages} onChange={e => setForm({...form,totalPages:e.target.value})} />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="label">Tags <span style={{ fontWeight:400,color:"#94a3b8" }}>(comma separated)</span></label>
            <input type="text" className="input-field" placeholder="SSC, GK, Reasoning"
              value={form.tags} onChange={e => setForm({...form,tags:e.target.value})} />
          </div>

          {/* PDF */}
          <div>
            <label className="label">PDF File</label>
            <div onClick={() => pdfRef.current?.click()}
              style={{ border:"2px dashed #cbd5e1",borderRadius:12,padding:14,
                       textAlign:"center",cursor:"pointer",background:"#f8fafc" }}>
              {pdfName
                ? <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8,color:"#16a34a" }}>
                    <FileText size={16}/><span style={{ fontSize:12 }}>{pdfName}</span>
                  </div>
                : <><Upload size={20} color="#94a3b8" style={{ margin:"0 auto 4px" }}/>
                    <p style={{ fontSize:12,color:"#64748b" }}>Click to upload PDF (max 100MB)</p></>
              }
              <input ref={pdfRef} type="file" accept=".pdf" style={{ display:"none" }}
                onChange={e => { const f=e.target.files[0]; if(f) setPdfName(f.name); }} />
            </div>
          </div>

          {/* Pricing */}
          <div style={{ background:"#f8fafc",borderRadius:12,padding:14,border:"1px solid #e2e8f0" }}>
            <p style={{ margin:"0 0 10px",fontSize:13,fontWeight:600,color:"#475569",
                        display:"flex",alignItems:"center",gap:6 }}>
              <DollarSign size={14}/> Pricing &amp; Access
            </p>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10 }}>
              {ACCESS_OPTIONS.map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setForm({...form,accessType:opt.value,isFree:opt.value==="free"})}
                  style={{ padding:"10px 6px",borderRadius:10,cursor:"pointer",
                           border:"2px solid",
                           borderColor: form.accessType===opt.value ? "#6366f1" : "#e2e8f0",
                           background:  form.accessType===opt.value ? "#eef2ff" : "#fff",
                           color:       form.accessType===opt.value ? "#4338ca" : "#64748b",
                           fontSize:11,fontWeight:600,
                           display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}>
                  <opt.icon size={15}/>
                  {opt.label}
                </button>
              ))}
            </div>
            {form.accessType !== "free" && (
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                <div>
                  <label className="label">Sale Price (Rs.) *</label>
                  <input type="number" className="input-field" placeholder="199"
                    value={form.price} onChange={e => setForm({...form,price:e.target.value})} />
                </div>
                <div>
                  <label className="label">MRP / Strike Price (Rs.)</label>
                  <input type="number" className="input-field" placeholder="499"
                    value={form.mrp} onChange={e => setForm({...form,mrp:e.target.value})} />
                </div>
              </div>
            )}
          </div>

          {/* Toggles */}
          <div style={{ display:"flex",gap:24 }}>
            {[
              { key:"isActive",   label:"Active",    onColor:"#22c55e" },
              { key:"isFeatured", label:"Featured",  onColor:"#f59e0b" },
            ].map(t => (
              <label key={t.key} style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer" }}>
                <div onClick={() => setForm({...form,[t.key]:!form[t.key]})}
                  style={{ width:40,height:24,borderRadius:12,position:"relative",cursor:"pointer",
                           background:form[t.key]?t.onColor:"#cbd5e1",transition:"background 0.2s" }}>
                  <div style={{ position:"absolute",top:4,
                                left:form[t.key]?20:4,width:16,height:16,
                                borderRadius:"50%",background:"#fff",
                                boxShadow:"0 1px 3px rgba(0,0,0,0.2)",transition:"left 0.2s" }} />
                </div>
                <span style={{ fontSize:13,fontWeight:500,color:"#475569" }}>{t.label}</span>
              </label>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display:"flex",gap:10,justifyContent:"flex-end",
                        paddingTop:12,borderTop:"1px solid #f1f5f9" }}>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary"
              style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 24px" }}>
              {submitting
                ? <div style={{ width:16,height:16,border:"2px solid #fff",
                                borderTopColor:"transparent",borderRadius:"50%",
                                animation:"spin 0.8s linear infinite" }} />
                : <CheckCircle size={16} />}
              {editingId ? "Save Changes" : "Publish eBook"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

/* ── Card ── */
function EBookCard({ book, onEdit, onDelete, onToggle }) {
  const coverUrl = book.coverImage ? getImageUrl(book.coverImage) : null;
  const disc = book.mrp>0 && book.price>0 ? Math.round(((book.mrp-book.price)/book.mrp)*100) : 0;

  return (
    <div style={{ background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,
                  overflow:"hidden",display:"flex",flexDirection:"column",
                  boxShadow:"0 1px 3px rgba(0,0,0,0.06)",transition:"box-shadow 0.2s,transform 0.2s" }}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.12)";e.currentTarget.style.transform="translateY(-2px)"}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.06)";e.currentTarget.style.transform="translateY(0)"}}>

      {/* Cover */}
      <div style={{ position:"relative",height:160,cursor:"pointer",
                    background:"linear-gradient(135deg,#ede9fe,#e0e7ff)",overflow:"hidden" }}
        onClick={() => onEdit(book)}>
        {coverUrl
          ? <img src={coverUrl} alt={book.title} style={{ width:"100%",height:"100%",objectFit:"cover" }} />
          : <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <BookOpen size={48} color="#a5b4fc" />
            </div>
        }
        <div style={{ position:"absolute",top:8,left:8,display:"flex",gap:4 }}>
          {book.isFeatured && (
            <span style={{ background:"#f59e0b",color:"#fff",fontSize:10,fontWeight:700,
                           padding:"2px 6px",borderRadius:99,display:"flex",alignItems:"center",gap:2 }}>
              <Star size={9}/> FEATURED
            </span>
          )}
          {disc>0 && (
            <span style={{ background:"#ef4444",color:"#fff",fontSize:10,fontWeight:700,
                           padding:"2px 6px",borderRadius:99 }}>{disc}% OFF</span>
          )}
        </div>
        <div style={{ position:"absolute",top:8,right:8 }}>
          <span style={{ fontSize:10,fontWeight:700,padding:"2px 6px",borderRadius:99,
                         background:book.isActive?"#dcfce7":"#fee2e2",
                         color:book.isActive?"#16a34a":"#dc2626" }}>
            {book.isActive?"LIVE":"OFF"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:14,display:"flex",flexDirection:"column",flex:1 }}>
        <p style={{ fontWeight:700,fontSize:13,color:"#1e293b",lineHeight:1.4,marginBottom:4,
                    overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" }}>
          {book.title}
        </p>
        {book.author && <p style={{ fontSize:11,color:"#64748b",marginBottom:8 }}>{book.author}</p>}

        <div style={{ display:"flex",gap:4,flexWrap:"wrap",marginBottom:8 }}>
          <span style={{ background:"#f1f5f9",color:"#64748b",fontSize:10,fontWeight:500,padding:"2px 8px",borderRadius:99 }}>
            {book.category}
          </span>
          <span style={{ fontSize:10,fontWeight:500,padding:"2px 8px",borderRadius:99,
                         background:book.accessType==="free"?"#dcfce7":book.accessType==="plan"?"#f3e8ff":"#dbeafe",
                         color:book.accessType==="free"?"#16a34a":book.accessType==="plan"?"#7c3aed":"#1d4ed8" }}>
            {book.accessType==="free"?"Free":book.accessType==="plan"?"Plan Only":"Paid"}
          </span>
        </div>

        <div style={{ display:"flex",gap:10,fontSize:11,color:"#94a3b8",marginBottom:8 }}>
          <span style={{ display:"flex",alignItems:"center",gap:3 }}><Download size={11}/>{book.totalDownloads}</span>
          <span style={{ display:"flex",alignItems:"center",gap:3 }}><Eye size={11}/>{book.totalViews}</span>
          {book.totalPages>0 && <span style={{ display:"flex",alignItems:"center",gap:3 }}><FileText size={11}/>{book.totalPages}pp</span>}
        </div>

        <div style={{ marginBottom:12 }}>
          {book.isFree||book.accessType==="free"
            ? <span style={{ color:"#16a34a",fontWeight:700,fontSize:14 }}>FREE</span>
            : <span style={{ display:"flex",alignItems:"baseline",gap:6 }}>
                <span style={{ color:"#4f46e5",fontWeight:700,fontSize:14 }}>Rs.{Number(book.price).toFixed(0)}</span>
                {book.mrp>0 && <span style={{ color:"#94a3b8",fontSize:11,textDecoration:"line-through" }}>Rs.{Number(book.mrp).toFixed(0)}</span>}
              </span>
          }
        </div>

        {/* Buttons */}
        <div style={{ marginTop:"auto",display:"flex",gap:6 }}>
          <button onClick={() => onToggle(book)}
            style={{ flex:1,fontSize:11,fontWeight:600,padding:"7px 0",borderRadius:8,cursor:"pointer",
                     border:"1px solid",
                     borderColor:book.isActive?"#fecaca":"#bbf7d0",
                     background:"transparent",
                     color:book.isActive?"#ef4444":"#16a34a" }}>
            {book.isActive?"Deactivate":"Activate"}
          </button>
          <button onClick={() => onEdit(book)} title="Edit eBook"
            style={{ width:34,height:34,borderRadius:8,border:"1px solid #c7d2fe",
                     background:"#eef2ff",color:"#4f46e5",cursor:"pointer",
                     display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Edit2 size={14}/>
          </button>
          <button onClick={() => onDelete(book.id, book.title)} title="Delete eBook"
            style={{ width:34,height:34,borderRadius:8,border:"1px solid #fecaca",
                     background:"#fff1f2",color:"#ef4444",cursor:"pointer",
                     display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Trash2 size={14}/>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function EBooksAdmin() {
  const [books, setBooks]               = useState([]);
  const [stats, setStats]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [editingId, setEditingId]       = useState(null);
  const [form, setForm]                 = useState(defaultForm);
  const [search, setSearch]             = useState("");
  const [catFilter, setCatFilter]       = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);
  const [pdfName, setPdfName]           = useState("");
  const coverRef = useRef();
  const pdfRef   = useRef();

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (catFilter) params.category = catFilter;
      const res = await api.get("/ebooks/admin", { params });
      setBooks(res.data?.data || []);
    } catch { toast.error("Failed to load eBooks"); }
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try { const res = await api.get("/ebooks/admin/stats"); setStats(res.data?.data); } catch {}
  };

  useEffect(() => { fetchBooks(); fetchStats(); }, []);
  useEffect(() => { const t = setTimeout(fetchBooks, 400); return () => clearTimeout(t); }, [search, catFilter]);

  const openCreate = () => {
    setEditingId(null); setForm(defaultForm);
    setCoverPreview(null); setPdfName(""); setShowModal(true);
  };

  const openEdit = (book) => {
    console.log("EDIT CLICKED:", book.title, book.id);
    const parsedTags = (() => {
      try {
        const t = book.tags;
        if (Array.isArray(t)) return t;
        if (typeof t === "string") return JSON.parse(t);
        return [];
      } catch { return []; }
    })();
    setEditingId(book.id);
    setForm({
      title:book.title, author:book.author||"", description:book.description||"",
      category:book.category||"General", language:book.language||"English",
      tags: parsedTags.join(", "), totalPages:book.totalPages||"",
      isFree:book.isFree, price:book.price||"", mrp:book.mrp||"",
      accessType:book.accessType||"paid", isActive:book.isActive, isFeatured:book.isFeatured,
    });
    setCoverPreview(book.coverImage ? getImageUrl(book.coverImage) : null);
    setPdfName(book.fileUrl || "");
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k, String(v)));
      if (coverRef.current?.files[0]) fd.append("coverImage", coverRef.current.files[0]);
      if (pdfRef.current?.files[0])   fd.append("pdfFile",    pdfRef.current.files[0]);
      if (editingId) {
        await api.put(`/ebooks/admin/${editingId}`, fd, { headers:{"Content-Type":"multipart/form-data"} });
        toast.success("eBook updated!");
      } else {
        await api.post("/ebooks/admin", fd, { headers:{"Content-Type":"multipart/form-data"} });
        toast.success("eBook published!");
      }
      closeModal(); fetchBooks(); fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error || "Operation failed");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try { await api.delete(`/ebooks/admin/${id}`); toast.success("eBook deleted"); fetchBooks(); fetchStats(); }
    catch { toast.error("Failed to delete"); }
  };

  const handleToggle = async (book) => {
    try {
      const fd = new FormData();
      fd.append("isActive", String(!book.isActive));
      fd.append("title", book.title);
      await api.put(`/ebooks/admin/${book.id}`, fd, { headers:{"Content-Type":"multipart/form-data"} });
      toast.success(`eBook ${!book.isActive?"activated":"deactivated"}`);
      fetchBooks();
    } catch { toast.error("Failed to update"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <BookOpen className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">eBook Store</h1>
            <p className="text-sm text-slate-500">Upload, manage &amp; sell digital books</p>
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 !px-5 !py-2.5">
          <Plus size={18} /> Publish New eBook
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label:"Total eBooks", value:stats.total,  icon:BookOpen,    bg:"bg-violet-50", ic:"text-violet-600", border:"border-violet-100" },
            { label:"Active",       value:stats.active, icon:CheckCircle, bg:"bg-green-50",  ic:"text-green-600",  border:"border-green-100"  },
            { label:"Free",         value:stats.free,   icon:Globe,       bg:"bg-sky-50",    ic:"text-sky-600",    border:"border-sky-100"    },
            { label:"Paid",         value:stats.paid,   icon:ShoppingBag, bg:"bg-amber-50",  ic:"text-amber-600",  border:"border-amber-100"  },
          ].map(s => (
            <div key={s.label} className={`bg-white border ${s.border} rounded-xl p-4 flex items-center gap-3 shadow-sm`}>
              <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.ic} flex items-center justify-center flex-shrink-0`}>
                <s.icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search eBooks by title..." className="input-field !pl-10 w-full" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input-field sm:w-48">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={() => { fetchBooks(); fetchStats(); }} className="btn-secondary flex items-center gap-1">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <BookOpen size={48} className="mx-auto mb-3 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-600 mb-1">No eBooks yet</h3>
          <p className="text-slate-400 text-sm mb-4">Publish your first eBook to start selling</p>
          <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} /> Publish eBook
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {books.map(book => (
            <EBookCard key={book.id} book={book}
              onEdit={openEdit} onDelete={handleDelete} onToggle={handleToggle} />
          ))}
        </div>
      )}

      <EBookModal
        show={showModal} onClose={closeModal}
        editingId={editingId} form={form} setForm={setForm}
        coverPreview={coverPreview} setCoverPreview={setCoverPreview}
        pdfName={pdfName} setPdfName={setPdfName}
        coverRef={coverRef} pdfRef={pdfRef}
        onSubmit={handleSubmit} submitting={submitting}
      />
    </div>
  );
}
