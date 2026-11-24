import React, { useState, useEffect } from "react";
import {
  BookOpen, Download, Search, FileText, Eye, Star, Lock,
  CheckCircle, Zap, ExternalLink, Receipt, X, Printer, ShieldCheck
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../lib/api";
import { getImageUrl } from "../../lib/imageUrl";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";

export default function MyEBooks() {
  const { user } = useAuthStore();
  const [books, setBooks] = useState([]);
  const [hasPlan, setHasPlan] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState("all"); // 'all' | 'purchased' | 'plan' | 'free'
  const [downloading, setDownloading] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await api.get("/ebooks/my");
        setBooks(res.data?.data || []);
        setHasPlan(res.data?.hasPlan || false);
      } catch {
        toast.error("Failed to load your eBooks");
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  const handleDownload = async (book) => {
    if (downloading) return;
    setDownloading(book.id);
    const toastId = toast.loading("Preparing download...");
    try {
      const res = await api.get(`/ebooks/download/${book.id}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      const sanitized = (book.title || "eBook").replace(/[^a-zA-Z0-9_\-\. ]/g, "_");
      a.download = `${sanitized}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Download started!", { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.error || "Download failed. Please try again.", { id: toastId });
    } finally {
      setDownloading(null);
    }
  };

  const purchasedBooks = books.filter(b => b.hasPurchased);
  const planBooks = books.filter(b => !b.hasPurchased && b.accessType === "plan");
  const freeBooks = books.filter(b => !b.hasPurchased && (b.accessType === "free" || b.isFree));

  const tabFiltered = books.filter(b => {
    if (filterTab === "purchased") return b.hasPurchased;
    if (filterTab === "plan") return !b.hasPurchased && b.accessType === "plan";
    if (filterTab === "free") return !b.hasPurchased && (b.accessType === "free" || b.isFree);
    return true;
  });

  const filtered = tabFiltered.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    (b.author || "").toLowerCase().includes(search.toLowerCase()) ||
    (b.category || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="space-y-6 animate-fade-in">
      <div className="h-44 bg-white rounded-3xl animate-pulse border border-slate-200" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-80 bg-white rounded-3xl animate-pulse border border-slate-200" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/20">
              <BookOpen size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">My eBooks Library</h1>
              <p className="text-violet-200 text-sm mt-0.5 font-medium">
                {books.length} {books.length === 1 ? "eBook" : "eBooks"} available for instant download
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {hasPlan ? (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                <Zap size={16} className="text-amber-300 fill-amber-300" />
                <span className="text-sm font-bold">Subscription Plan Active</span>
              </div>
            ) : (
              <Link to="/student/subscription"
                className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-900 px-4 py-2 rounded-xl text-sm font-black transition-colors shadow">
                <Zap size={16} /> Upgrade to Plan
              </Link>
            )}
            <Link to="/ebooks"
              className="flex items-center gap-2 bg-white text-indigo-700 px-4 py-2 rounded-xl text-sm font-black hover:bg-violet-50 transition-colors shadow">
              <BookOpen size={16} /> Browse eBook Store
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
          {[
            { label: "All Accessible", value: books.length, tab: "all" },
            { label: "Purchased", value: purchasedBooks.length, tab: "purchased" },
            { label: "Plan eBooks", value: planBooks.length, tab: "plan" },
            { label: "Free eBooks", value: freeBooks.length, tab: "free" },
          ].map(s => (
            <button
              key={s.label}
              onClick={() => setFilterTab(s.tab)}
              className={`rounded-2xl p-3 sm:p-4 text-center transition-all ${
                filterTab === s.tab
                  ? "bg-white text-slate-900 shadow-md font-bold"
                  : "bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
              }`}
            >
              <p className="text-xl sm:text-2xl font-black">{s.value}</p>
              <p className={`text-xs mt-0.5 font-semibold ${filterTab === s.tab ? "text-slate-500" : "text-violet-200"}`}>
                {s.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Controls: Filter Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
          {[
            { id: "all", label: "All eBooks", count: books.length },
            { id: "purchased", label: "Purchased", count: purchasedBooks.length },
            { id: "plan", label: "With Plan", count: planBooks.length },
            { id: "free", label: "Free", count: freeBooks.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                filterTab === tab.id
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                filterTab === tab.id ? "bg-indigo-50 text-indigo-600" : "bg-slate-200 text-slate-500"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, author, category..."
            className="input-field !pl-10 w-full text-sm rounded-xl py-2"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* eBooks Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 p-8 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center mx-auto mb-4 text-indigo-500">
            <BookOpen size={32} />
          </div>
          {books.length === 0 ? (
            <>
              <h3 className="text-xl font-black text-slate-800 mb-1">No eBooks in your library yet</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
                Explore our catalog to find study guides, test series notes, and subject materials.
              </p>
              <div className="flex justify-center gap-3">
                <Link to="/ebooks" className="btn-primary inline-flex items-center gap-2">
                  <BookOpen size={16} /> Explore eBook Store
                </Link>
                {!hasPlan && (
                  <Link to="/student/subscription" className="btn-secondary inline-flex items-center gap-2">
                    <Zap size={16} /> Upgrade to Plan
                  </Link>
                )}
              </div>
            </>
          ) : (
            <>
              <h3 className="text-lg font-bold text-slate-700 mb-1">No matches found</h3>
              <p className="text-slate-400 text-sm mb-4">Try different keywords or clear your active filters</p>
              <button onClick={() => { setSearch(""); setFilterTab("all"); }} className="btn-secondary">
                Reset Filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(book => (
            <EBookCard
              key={book.id}
              book={book}
              onDownload={handleDownload}
              isDownloading={downloading === book.id}
              onViewReceipt={() => setSelectedReceipt(book)}
            />
          ))}
        </div>
      )}

      {/* Upgrade banner if user has no active plan */}
      {!hasPlan && (
        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-5 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
            <Lock size={24} className="text-white" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h4 className="font-black text-slate-900 text-base">Want unlimited access to all plan eBooks?</h4>
            <p className="text-sm text-slate-600 mt-0.5">
              Subscribe to unlock all premium eBooks, mock tests, and video courses with one subscription.
            </p>
          </div>
          <Link to="/student/subscription" className="btn-primary flex-shrink-0 whitespace-nowrap shadow-md shadow-violet-500/20">
            <Zap size={16} /> Upgrade Now
          </Link>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          book={selectedReceipt}
          user={user}
          onClose={() => setSelectedReceipt(null)}
          onDownload={() => handleDownload(selectedReceipt)}
        />
      )}
    </div>
  );
}

function EBookCard({ book, onDownload, isDownloading, onViewReceipt }) {
  const coverUrl = book.coverImage ? getImageUrl(book.coverImage) : null;
  const isFreeAccess = book.isFree || book.accessType === "free";
  const hasFile = book.hasFile !== undefined ? book.hasFile : !!book.fileUrl;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 group flex flex-col">
      {/* Cover Link */}
      <Link to={`/ebooks/${book.slug}`} className="relative block h-52 bg-gradient-to-br from-slate-100 to-indigo-50 overflow-hidden flex-shrink-0">
        {coverUrl ? (
          <img src={coverUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-indigo-50 to-violet-100">
            <BookOpen size={48} className="text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{book.category}</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {book.isFeatured && (
            <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-md">
              <Star size={10} className="fill-amber-950" /> Featured
            </span>
          )}
          {book.hasPurchased ? (
            <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md">
              <CheckCircle size={10} /> PURCHASED
            </span>
          ) : isFreeAccess ? (
            <span className="bg-green-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md">
              FREE
            </span>
          ) : (
            <span className="bg-purple-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-md">
              <Zap size={9} /> PLAN
            </span>
          )}
        </div>
      </Link>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <Link to={`/ebooks/${book.slug}`} className="hover:text-indigo-600 transition-colors">
          <h3 className="font-black text-slate-900 text-base leading-snug line-clamp-2 mb-1.5 group-hover:text-indigo-600 transition-colors">
            {book.title}
          </h3>
        </Link>
        {book.author && <p className="text-xs text-slate-500 mb-3 font-semibold">by {book.author}</p>}

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-lg">
            {book.category || "General"}
          </span>
          {book.language && (
            <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-lg">
              {book.language}
            </span>
          )}
          {book.hasPurchased && (
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-lg">
              Lifetime Access
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 mb-4 font-semibold">
          {book.totalPages > 0 && (
            <span className="flex items-center gap-1"><FileText size={12} />{book.totalPages} pages</span>
          )}
          <span className="flex items-center gap-1"><Eye size={12} />{book.totalViews || 0}</span>
          <span className="flex items-center gap-1"><Download size={12} />{book.totalDownloads || 0}</span>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto space-y-2">
          <div className="flex gap-2">
            <Link
              to={`/ebooks/${book.slug}`}
              className="flex-1 text-center text-xs font-bold py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <ExternalLink size={13} /> View
            </Link>

            <button
              onClick={() => onDownload(book)}
              disabled={isDownloading || !hasFile}
              title={!hasFile ? "PDF file not available yet" : "Download eBook PDF"}
              className={`flex-1 text-xs font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                !hasFile
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                  : isDownloading
                  ? "bg-indigo-400 text-white cursor-wait"
                  : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-violet-500/20"
              }`}
            >
              {isDownloading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download size={13} /> Download PDF
                </>
              )}
            </button>
          </div>

          {book.hasPurchased && (
            <button
              onClick={onViewReceipt}
              className="w-full text-center text-[11px] font-bold py-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1"
            >
              <Receipt size={12} /> View Purchase Receipt
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReceiptModal({ book, user, onClose, onDownload }) {
  const p = book.payment || {};
  const amount = parseFloat(p.amount) || parseFloat(book.price) || 0;
  const basePrice = Math.round(amount / 1.18);
  const gst = Math.round(amount - basePrice);
  const dateStr = p.date || p.createdAt || new Date();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
      <style>{`@media print{body *{visibility:hidden}#receipt-modal-content,#receipt-modal-content *{visibility:visible}#receipt-modal-content{position:absolute;left:0;top:0;width:100%}.no-print{display:none!important}}`}</style>
      <div id="receipt-modal-content" className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 no-print"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">eBook Payment Receipt</h3>
            <p className="text-xs text-slate-400">Order #{p.razorpayPaymentId || p.id || book.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div>
            <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Student</span>
            <span className="font-black text-slate-800 text-sm">{user?.name || "Student"}</span>
            <span className="text-slate-500 block truncate">{user?.email}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Date</span>
            <span className="font-bold text-slate-800">
              {new Date(dateStr).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
            </span>
            <span className="text-slate-400 block">
              {new Date(dateStr).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>

        <div className="border border-slate-200 rounded-2xl overflow-hidden mb-6 text-xs">
          <div className="p-3.5 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 flex justify-between">
            <span>eBook Title</span>
            <span>Amount</span>
          </div>
          <div className="p-3.5 flex justify-between items-start">
            <div>
              <p className="font-bold text-slate-900">{book.title}</p>
              <p className="text-slate-400 text-[11px]">One-time purchase · Lifetime PDF access</p>
            </div>
            <p className="font-bold text-slate-800">₹{basePrice.toLocaleString("en-IN")}</p>
          </div>
          <div className="p-3.5 bg-slate-50/50 border-t border-slate-100 flex justify-between text-slate-500">
            <span>GST (18%)</span>
            <span>₹{gst.toLocaleString("en-IN")}</span>
          </div>
          <div className="p-3.5 bg-slate-100/70 border-t border-slate-200 flex justify-between font-black text-slate-900 text-sm">
            <span>Total Paid</span>
            <span className="text-indigo-600">₹{amount.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <div className="flex gap-3 no-print">
          <button
            onClick={() => window.print()}
            className="flex-1 border border-slate-200 text-slate-700 font-bold py-3 rounded-2xl text-xs hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <Printer size={15} /> Print Receipt
          </button>
          <button
            onClick={() => { onClose(); onDownload(); }}
            className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black py-3 rounded-2xl text-xs hover:from-violet-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-violet-500/20"
          >
            <Download size={15} /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
