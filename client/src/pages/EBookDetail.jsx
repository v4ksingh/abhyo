import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  BookOpen, ArrowLeft, Star, Download, ShoppingBag, Zap, CheckCircle,
  FileText, Globe, Users, Eye, Heart, ChevronDown, ChevronUp,
  Shield, Award, Tag, BookMarked, Play, Lock, Unlock,
  TrendingUp, Target, BarChart2, Copy, Check, AlertCircle, Calendar
} from "lucide-react";
import api from "../lib/api";
import useAuthStore from "../store/authStore";
import { getImageUrl } from "../lib/imageUrl";
import toast from "react-hot-toast";


const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace("/api", "");

const FALLBACK_ICONS = {
  General: "📚", Mathematics: "📐", Science: "🔬", English: "📝", History: "🏛️",
  Geography: "🌍", "Current Affairs": "📰", Aptitude: "🧮", Reasoning: "🧠",
  Computer: "💻", GK: "🌐", Economics: "📈", Polity: "⚖️", SSC: "🎯", UPSC: "🏛️",
  Banking: "🏦", Railway: "🚄", Defence: "🛡️", Teaching: "👨‍🏫", Other: "📖",
};

const FEATURES = [
  { icon:<Target size={18}/>, label:"Exam-focused Content", desc:"Curated exactly for competitive exam pattern" },
  { icon:<BarChart2 size={18}/>, label:"Previous Year Analysis", desc:"Detailed analysis of last 10 years papers" },
  { icon:<TrendingUp size={18}/>, label:"Score Booster Tips", desc:"Expert strategies to maximise your marks" },
  { icon:<Shield size={18}/>, label:"Verified by Experts", desc:"Reviewed by top subject matter experts" },
  { icon:<Play size={18}/>, label:"Instant PDF Access", desc:"Download immediately after purchase" },
  { icon:<Award size={18}/>, label:"Trusted by Students", desc:"Thousands of aspirants use this material" },
];

function StatBadge({ icon, value, label }) {
  if (!value && value !== 0) return null;
  return (
    <div className="bg-slate-50 rounded-2xl p-4 text-center">
      <div className="flex justify-center mb-1.5 text-indigo-500">{icon}</div>
      <p className="text-lg font-black text-slate-800">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return null;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
}

export default function EBookDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();


  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tocOpen, setTocOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get(`/ebooks/public/${slug}`)
      .then(res => setBook(res.data?.data || null))
      .catch(() => setError("eBook not found or unavailable."))
      .finally(() => setLoading(false));
  }, [slug]);

  // Check purchase status when book + auth available
  useEffect(() => {
    if (!book?.id || !isAuthenticated) return;
    api.get(`/ebooks/has-purchased/${book.id}`)
      .then(res => setHasPurchased(res.data.hasPurchased))
      .catch(() => {});
  }, [book?.id, isAuthenticated]);


  const isFreeAccess = book && (book.isFree || book.accessType === "free");
  const isPlan = book?.accessType === "plan";

  // Check if the logged-in user has an active plan subscription
  const hasPlan = isAuthenticated && (
    ['superadmin', 'admin', 'content_manager', 'teacher'].includes(user?.role) ||
    (['active', 'trial'].includes(user?.studentSubscriptionStatus) &&
     (!user?.studentSubscriptionEndDate || new Date(user.studentSubscriptionEndDate) > new Date())) ||
    (user?.studentSubscriptionPlan && user?.studentSubscriptionPlan !== 'free' && user?.studentSubscriptionStatus !== 'expired') ||
    (user?.institute?.subscriptionStatus === 'active' && user?.institute?.subscriptionPlan !== 'free')
  );

  const discountPct = book?.mrp > 0 && book?.price > 0
    ? Math.round(((book.mrp - book.price) / book.mrp) * 100) : 0;
  const coverUrl = book?.coverImage ? getImageUrl(book.coverImage) : null;
  const tags = Array.isArray(book?.tags) ? book.tags : [];
  const fileSize = formatFileSize(book?.fileSize);
  const createdDate = formatDate(book?.createdAt);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    const toastId = toast.loading("Preparing download...");
    try {
      const res = await api.get(`/ebooks/download/${book.id}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${book.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Download started!", { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.error || "Download failed. Please try again.", { id: toastId });
    }
  };

  const handleBuy = () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    // Store ebook in sessionStorage so checkout page can render without extra API call
    sessionStorage.setItem(`ebook_checkout_${book.id}`, JSON.stringify({
      id: book.id, title: book.title, author: book.author,
      price: book.price, mrp: book.mrp, coverImage: book.coverImage, slug: book.slug,
    }));
    navigate(`/ebook-checkout/${book.id}`);
  };


  /*  Loading  */
  if (loading) return (
    <div className="min-h-screen bg-slate-50 pt-[76px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-semibold">Loading eBook...</p>
      </div>
    </div>
  );

  /*  Error  */
  if (error || !book) return (
    <div className="min-h-screen bg-slate-50 pt-[76px] flex items-center justify-center">
      <div className="text-center p-8 bg-white rounded-3xl shadow-xl max-w-md mx-4">
        <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-slate-900 mb-2">eBook Not Found</h2>
        <p className="text-slate-500 mb-6">{error || "This eBook may have been removed."}</p>
        <Link to="/ebooks"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
          <ArrowLeft size={16} /> Back to eBooks
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-[76px] font-sans">

      {/*  Breadcrumb  */}
      <div className="bg-white border-b border-slate-100 px-6 lg:px-12 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-slate-500 font-medium flex-wrap">
          <Link to="/" className="hover:text-indigo-600 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/ebooks" className="hover:text-indigo-600 transition-colors">eBooks</Link>
          <span>/</span>
          {book.category && (
            <>
              <Link to={`/ebooks?category=${book.category}`} className="hover:text-indigo-600 transition-colors">{book.category}</Link>
              <span>/</span>
            </>
          )}
          <span className="text-slate-800 font-semibold truncate max-w-xs">{book.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* â"â"â"â"â"â"â"â"â"â"â"â" LEFT COLUMN â"â"â"â"â"â"â"â"â"â"â"â" */}
          <div className="lg:col-span-2 space-y-8">

            <button onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to eBooks
            </button>

            {/*  Hero Card  */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">

              {/* Gradient header */}
              <div className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-8 pb-10">
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage:"radial-gradient(circle at 2px 2px,white 1px,transparent 0)", backgroundSize:"20px 20px" }} />

                <div className="relative flex flex-col sm:flex-row gap-8 items-start">

                  {/* Cover */}
                  <div className="shrink-0 relative">
                    <div className="absolute bg-white/20 rounded-2xl inset-0" style={{ transform:"rotate(6deg) scale(1.05)" }} />
                    <div className="absolute bg-white/10 rounded-2xl inset-0" style={{ transform:"rotate(-3deg)" }} />
                    <div className="relative w-36 h-44 rounded-2xl overflow-hidden border-4 border-white/30 shadow-2xl bg-white">
                      {coverUrl
                        ? <img src={coverUrl} alt={book.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-100 text-5xl">
                            {FALLBACK_ICONS[book.category] || "📚"}
                          </div>
                      }
                    </div>
                    {book.isFeatured && (
                      <div className="absolute -top-2 -right-2 bg-amber-400 text-amber-950 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg">
                        <Star size={8} className="fill-amber-950" /> FEATURED
                      </div>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20">
                        <Globe size={11} /> {book.language || "English"}
                      </span>
                      {book.totalPages > 0 && (
                        <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20">
                          <FileText size={11} /> {book.totalPages} Pages
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full
                        ${isFreeAccess ? "bg-green-400/90 text-green-950"
                          : isPlan ? "bg-purple-400/90 text-purple-950"
                          : "bg-blue-400/90 text-blue-950"}`}>
                        {isFreeAccess ? <Unlock size={11} /> : <Lock size={11} />}
                        {isFreeAccess ? "Free" : isPlan ? "Plan Access" : "Paid"}
                      </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-2">
                      {book.title}
                    </h1>

                    {book.author && (
                      <p className="text-indigo-200 text-sm font-bold mb-4 flex items-center gap-1.5">
                        <BookMarked size={13} /> by {book.author}
                      </p>
                    )}

                    {/* Stats row */}
                    <div className="flex flex-wrap items-center gap-4">
                      {book.totalViews > 0 && (
                        <span className="flex items-center gap-1.5 text-indigo-200 text-sm font-semibold">
                          <Eye size={13} /> {book.totalViews.toLocaleString()} views
                        </span>
                      )}
                      {book.totalDownloads > 0 && (
                        <span className="flex items-center gap-1.5 text-indigo-200 text-sm font-semibold">
                          <Download size={13} /> {book.totalDownloads.toLocaleString()} downloads
                        </span>
                      )}
                      {book.totalSales > 0 && (
                        <span className="flex items-center gap-1.5 text-indigo-200 text-sm font-semibold">
                          <Users size={13} /> {book.totalSales.toLocaleString()} sold
                        </span>
                      )}
                    </div>

                    {book.category && (
                      <div className="mt-4">
                        <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20">
                          <span>{FALLBACK_ICONS[book.category] || "📚"}</span>
                          {book.category}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Share / action row */}
              <div className="px-8 py-4 border-b border-slate-100 flex items-center gap-3 flex-wrap">
                <button onClick={() => setLiked(l => !l)}
                  className={`inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl transition-all
                    ${liked ? "bg-rose-50 text-rose-500 border border-rose-200"
                            : "bg-slate-50 text-slate-500 border border-slate-200 hover:border-rose-200 hover:text-rose-400"}`}>
                  <Heart size={15} className={liked ? "fill-rose-500" : ""} />
                  {liked ? "Saved" : "Save"}
                </button>
                <button onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl bg-slate-50 text-slate-500 border border-slate-200 hover:border-indigo-200 hover:text-indigo-500 transition-all">
                  {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
                  {copied ? "Copied!" : "Share Link"}
                </button>
                {createdDate && (
                  <span className="ml-auto flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <Calendar size={12} /> Published {createdDate}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="p-8">
                <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                  <BookOpen size={18} className="text-indigo-500" />
                  About This eBook
                </h2>
                {book.description ? (
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{book.description}</p>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <AlertCircle size={16} className="text-slate-400 shrink-0" />
                    <p className="text-slate-400 text-sm font-medium">No description available for this eBook.</p>
                  </div>
                )}
              </div>
            </div>

            {/*  What You'll Get  */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
              <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <CheckCircle size={18} className="text-green-500" />
                What You'll Get
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {FEATURES.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      {f.icon}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{f.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/*  Topics Covered (real tags only)  */}
            {tags.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                  <Tag size={18} className="text-orange-500" />
                  Topics Covered
                </h2>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, i) => (
                    <span key={i}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 text-sm font-bold rounded-xl border border-indigo-100 hover:border-indigo-300 hover:shadow-sm transition-all">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/*  Real Stats  */}
            {(book.totalViews > 0 || book.totalDownloads > 0 || book.totalSales > 0) && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                <h2 className="text-lg font-black text-slate-900 mb-5 flex items-center gap-2">
                  <TrendingUp size={18} className="text-emerald-500" />
                  Popularity
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  {book.totalViews > 0 && <StatBadge icon={<Eye size={20}/>} value={book.totalViews} label="Total Views" />}
                  {book.totalDownloads > 0 && <StatBadge icon={<Download size={20}/>} value={book.totalDownloads} label="Downloads" />}
                  {book.totalSales > 0 && <StatBadge icon={<Users size={20}/>} value={book.totalSales} label="Purchases" />}
                </div>
              </div>
            )}

            {/*  No Reviews notice  */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
              <h2 className="text-lg font-black text-slate-900 mb-5 flex items-center gap-2">
                <Star size={18} className="text-amber-400" />
                Student Reviews
              </h2>
              <div className="flex flex-col items-center justify-center py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Star size={36} className="text-slate-200 mb-3" />
                <p className="text-slate-500 font-bold text-sm mb-1">No reviews yet</p>
                <p className="text-slate-400 text-xs max-w-xs">Be the first to download and review this eBook after your exam preparation!</p>
              </div>
            </div>

          </div>

          {/* â"â"â"â"â"â"â"â"â"â"â"â" RIGHT COLUMN — Sidebar â"â"â"â"â"â"â"â"â"â"â"â" */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-5">

              {/*  Purchase Card  */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">

                {/* Cover preview */}
                <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-6 flex items-center justify-center min-h-[150px]">
                  {coverUrl
                    ? <img src={coverUrl} alt={book.title} className="h-32 w-auto object-contain rounded-xl shadow-2xl border-2 border-white/10" />
                    : <div className="w-24 h-32 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-xl flex items-center justify-center text-5xl shadow-2xl">
                        {FALLBACK_ICONS[book.category] || "📚"}
                      </div>
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-4 right-4 text-center">
                    <p className="text-white/70 text-xs font-bold truncate">{book.title}</p>
                  </div>
                </div>

                <div className="p-6 space-y-5">

                  {/* Price */}
                  <div>
                    {isFreeAccess ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-green-600">FREE</span>
                        <span className="text-slate-400 text-sm">No payment needed</span>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline gap-3">
                          <span className="text-4xl font-black text-slate-900">
                            ₹{Number(book.price).toFixed(0)}
                          </span>
                          {discountPct > 0 && (
                            <span className="text-slate-400 text-lg font-bold line-through">
                              ₹{Number(book.mrp).toFixed(0)}
                            </span>
                          )}
                        </div>
                        {discountPct > 0 && (
                          <div className="mt-2 inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-xl text-sm font-black">
                            🎉 {discountPct}% OFF — Save ₹{Number(book.mrp - book.price).toFixed(0)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  {isFreeAccess ? (
                    <button onClick={handleDownload}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black py-4 rounded-2xl text-base hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/30 hover:-translate-y-0.5">
                      <Download size={18} />
                      {isAuthenticated ? "Download Free" : "Get Free (Login required)"}
                    </button>
                  ) : isPlan ? (
                    (hasPlan || hasPurchased) ? (
                      <button onClick={handleDownload}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black py-4 rounded-2xl text-base hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/30 hover:-translate-y-0.5">
                        <Download size={18} /> Download Now {hasPurchased ? "(Purchased)" : "(Plan Active)"}
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <Link to="/student/subscription"
                          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-black py-4 rounded-2xl text-base hover:from-violet-700 hover:to-purple-800 transition-all shadow-lg shadow-violet-500/30 hover:-translate-y-0.5">
                          <Zap size={18} /> Upgrade to Plan
                        </Link>
                        {Number(book.price) > 0 && (
                          <button onClick={handleBuy}
                            className="w-full flex items-center justify-center gap-2 bg-slate-50 text-slate-700 font-bold py-3.5 rounded-2xl text-sm border border-slate-200 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 transition-all">
                            <ShoppingBag size={15} /> Buy Individual eBook — ₹{Number(book.price).toFixed(0)}
                          </button>
                        )}
                      </div>
                    )
                  ) : (
                    hasPurchased ? (
                      <button onClick={handleDownload}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black py-4 rounded-2xl text-base hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg shadow-green-500/30 hover:-translate-y-0.5">
                        <Download size={18} /> Download Now (Purchased)
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <button onClick={handleBuy}
                          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black py-4 rounded-2xl text-base hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5">
                          <ShoppingBag size={18} />
                          Buy Now — ₹{Number(book.price).toFixed(0)}
                        </button>
                        <Link to="/student/subscription"
                          className="w-full flex items-center justify-center gap-2 bg-slate-50 text-slate-700 font-bold py-3.5 rounded-2xl text-sm border border-slate-200 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 transition-all">
                          <Zap size={15} /> Get with Plan (Better Value)
                        </Link>
                      </div>
                    )
                  )}


                  {/* Trust badges */}
                  <div className="flex items-center justify-center gap-5 text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1"><Shield size={12} className="text-green-500" /> Secure</span>
                    <span className="flex items-center gap-1"><Download size={12} className="text-indigo-400" /> Instant PDF</span>
                    <span className="flex items-center gap-1"><Lock size={12} className="text-slate-400" /> Lifetime</span>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Book details — real data only */}
                  <div className="space-y-3">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Book Details</p>
                    {[
                      { label:"Format",   value:"PDF (Digital)" },
                      { label:"Language", value:book.language || "English" },
                      book.totalPages > 0  && { label:"Pages",    value:`${book.totalPages} pages` },
                      fileSize             && { label:"File Size", value:fileSize },
                      { label:"Category", value:book.category || "General" },
                      book.author          && { label:"Author",    value:book.author },
                      createdDate          && { label:"Published", value:createdDate },
                      { label:"Access",   value: isFreeAccess ? "Lifetime Free" : isPlan ? "With Active Plan" : "Lifetime (after purchase)" },
                    ].filter(Boolean).map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-sm gap-2">
                        <span className="text-slate-500 font-medium shrink-0">{d.label}</span>
                        <span className="text-slate-800 font-bold text-right">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/*  Plan Upsell (only for paid books)  */}
              {!isFreeAccess && !isPlan && (
                <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-3xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={16} className="text-violet-600" />
                    <p className="text-sm font-black text-violet-800">Better Value with a Plan</p>
                  </div>
                  <p className="text-xs text-violet-600 font-medium mb-4">
                    Get this eBook + unlimited mock tests + video courses — all in one plan.
                  </p>
                  <Link to="/plans"
                    className="w-full flex items-center justify-center gap-1.5 bg-violet-600 text-white text-sm font-black py-2.5 rounded-xl hover:bg-violet-700 transition-colors shadow-md shadow-violet-500/20">
                    View Plans → 
                  </Link>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/*  Mobile sticky bottom bar  */}
      <div className="lg:hidden sticky bottom-0 z-50 bg-white border-t border-slate-200 p-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            {isFreeAccess
              ? <p className="text-xl font-black text-green-600">FREE</p>
              : <div className="flex items-baseline gap-2">
                  <p className="text-xl font-black text-slate-900">₹{Number(book.price).toFixed(0)}</p>
                  {discountPct > 0 && <p className="text-slate-400 text-sm font-bold line-through">₹{Number(book.mrp).toFixed(0)}</p>}
                </div>
            }
            {discountPct > 0 && <p className="text-xs font-bold text-green-600">{discountPct}% OFF</p>}
          </div>
          {isFreeAccess ? (
            <button onClick={handleDownload}
              className="flex items-center gap-2 bg-green-600 text-white font-black px-6 py-3 rounded-2xl text-sm hover:bg-green-700 transition-colors">
              <Download size={15} /> Download Free
            </button>
          ) : hasPurchased ? (
            <button onClick={handleDownload}
              className="flex items-center gap-2 bg-emerald-600 text-white font-black px-6 py-3 rounded-2xl text-sm hover:bg-emerald-700 transition-colors">
              <Download size={15} /> Download (Purchased)
            </button>
          ) : isPlan ? (
            hasPlan ? (
              <button onClick={handleDownload}
                className="flex items-center gap-2 bg-violet-600 text-white font-black px-6 py-3 rounded-2xl text-sm hover:bg-violet-700 transition-colors">
                <Download size={15} /> Download Now
              </button>
            ) : (
              <Link to="/student/subscription"
                className="flex items-center gap-2 bg-violet-600 text-white font-black px-6 py-3 rounded-2xl text-sm hover:bg-violet-700 transition-colors">
                <Zap size={15} /> Subscribe
              </Link>
            )
          ) : (
            <button onClick={handleBuy}
              className="flex items-center gap-2 bg-indigo-600 text-white font-black px-6 py-3 rounded-2xl text-sm hover:bg-indigo-700 transition-colors">
              <ShoppingBag size={15} /> Buy Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

