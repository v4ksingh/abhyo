import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";
import { getImageUrl } from "../lib/imageUrl";
import {
  ArrowLeft, CreditCard, ShieldCheck, CheckCircle2, Download,
  Printer, BookOpen, Loader2, ArrowRight, Info
} from "lucide-react";

export default function EBookCheckout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [ebook, setEbook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [alreadyOwned, setAlreadyOwned] = useState(false);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    // Load ebook from sessionStorage (set by EBookDetail before navigating)
    const stored = sessionStorage.getItem(`ebook_checkout_${id}`);
    if (stored) {
      try { setEbook(JSON.parse(stored)); } catch { /**/ }
    } else {
      api.get(`/ebooks/public/${id}`)
        .then(res => {
          if (res.data?.data) setEbook(res.data.data);
        })
        .catch(() => {});
    }
    api.get(`/ebooks/has-purchased/${id}`)
      .then(res => { if (res.data.hasPurchased) setAlreadyOwned(true); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handlePay = async () => {
    if (!window.Razorpay) {
      toast.error("Payment gateway not loaded. Please refresh.");
      return;
    }
    setProcessing(true);
    try {
      const res = await api.post(`/ebooks/buy/${id}`);
      const { orderId, amount, currency, paymentId, key, ebook: ebookInfo } = res.data.data;
      if (ebookInfo && !ebook) setEbook(ebookInfo);

      const rzpOptions = {
        key, amount, currency,
        name: "Abhyo",
        description: ebookInfo?.title || ebook?.title || "eBook Purchase",
        image: ebookInfo?.coverImage ? getImageUrl(ebookInfo.coverImage) : undefined,
        order_id: orderId,
        handler: async (resp) => {
          try {
            const verifyRes = await api.post("/ebooks/verify-purchase", {
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              paymentId,
            });
            toast.success("Purchase successful! Enjoy your eBook.");
            setReceipt({
              transactionId: resp.razorpay_payment_id,
              date: new Date(),
              amount: (ebookInfo || ebook)?.price,
              ebook: verifyRes.data.data?.ebook || ebookInfo || ebook,
            });
          } catch {
            toast.error("Verification failed. Contact support with Razorpay payment ID.");
          }
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: "#6366f1" },
        modal: { ondismiss: () => setProcessing(false) },
      };
      const rzp = new window.Razorpay(rzpOptions);
      rzp.on("payment.failed", () => { toast.error("Payment failed."); setProcessing(false); });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not initiate payment.");
      setProcessing(false);
    }
  };

  const handleDownload = async () => {
    const eb = receipt?.ebook || ebook;
    if (!eb?.id) return;
    const toastId = toast.loading("Preparing download...");
    try {
      const res = await api.get(`/ebooks/download/${eb.id}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url; a.download = `${eb.title}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Download started!", { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.error || "Download failed.", { id: toastId });
    }
  };

  const finalPrice = parseFloat(ebook?.price) || 0;
  const mrp = parseFloat(ebook?.mrp) || finalPrice;
  const discount = mrp > finalPrice ? Math.round(((mrp - finalPrice) / mrp) * 100) : 0;
  const basePrice = Math.round(finalPrice / 1.18);
  const gst = Math.round(finalPrice - basePrice);
  const coverUrl = ebook?.coverImage ? getImageUrl(ebook.coverImage) : null;

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      <p className="text-slate-500 font-medium">Preparing checkout...</p>
    </div>
  );

  /* ─── Receipt screen ─── */
  if (receipt) {
    const eb = receipt.ebook;
    const ebCover = eb?.coverImage ? getImageUrl(eb.coverImage) : null;
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center py-10 px-4 md:px-8 font-sans -mt-4 animate-fade-in">
        <style>{`@media print{body *{visibility:hidden}#ebook-receipt,#ebook-receipt *{visibility:visible}#ebook-receipt{position:absolute;left:0;top:0;width:100%}.no-print{display:none!important}}`}</style>
        <div className="w-full max-w-2xl mb-6 flex justify-between items-center no-print">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" /> Purchase Complete
          </h2>
          <div className="flex gap-3">
            <button onClick={() => window.print()} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-50 shadow-sm">
              <Printer size={16} /> Print
            </button>
            <button onClick={handleDownload} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-sm shadow-violet-500/20">
              <Download size={16} /> Download eBook
            </button>
          </div>
        </div>

        <div id="ebook-receipt" className="w-full max-w-2xl bg-white rounded-3xl border border-slate-100 shadow-2xl p-10 md:p-14 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
          <div className="flex justify-between items-start mb-10 border-b border-slate-100 pb-8">
            <div>
              <img src="/logo.png" alt="Abhyo" className="h-10 mb-3 mix-blend-multiply" />
              <p className="text-slate-500 text-xs font-semibold">eBook Purchase Receipt</p>
              <p className="text-slate-400 text-xs">#{receipt.transactionId}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-900 font-bold text-sm mb-1">Abhyo Platform</p>
              <p className="text-slate-500 text-xs leading-relaxed">info@abhyo.com<br />support.abhyo.com</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div>
              <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1.5">Billed To</p>
              <p className="text-slate-900 font-bold text-sm">{user?.name}</p>
              <p className="text-slate-500 text-xs">{user?.email}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1.5">Date</p>
              <p className="text-slate-900 font-bold text-sm">{new Date(receipt.date).toLocaleDateString("en-IN",{year:"numeric",month:"short",day:"numeric"})}</p>
              <p className="text-slate-500 text-xs">{new Date(receipt.date).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</p>
            </div>
          </div>
          {eb && (
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-8">
              {ebCover ? <img src={ebCover} alt={eb.title} className="w-16 h-20 object-cover rounded-lg shadow" />
                : <div className="w-16 h-20 bg-violet-100 rounded-lg flex items-center justify-center"><BookOpen size={28} className="text-violet-400" /></div>}
              <div>
                <p className="font-black text-slate-900 mb-0.5">{eb.title}</p>
                {eb.author && <p className="text-slate-500 text-xs">by {eb.author}</p>}
                <span className="inline-block mt-1.5 bg-violet-100 text-violet-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Lifetime Access</span>
              </div>
            </div>
          )}
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-8">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b text-slate-600 text-[11px] uppercase tracking-wider font-bold">
                <tr><th className="px-5 py-3 text-left">Description</th><th className="px-5 py-3 text-right">Amount</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-5 py-4"><p className="text-slate-900 font-bold">{eb?.title}</p><p className="text-slate-500 text-xs">One-time · Lifetime access</p></td>
                  <td className="px-5 py-4 text-right font-semibold text-slate-900">Rs.{basePrice.toLocaleString("en-IN")}</td>
                </tr>
                <tr><td className="px-5 py-3 text-slate-500 text-xs text-right">GST (18%)</td><td className="px-5 py-3 text-right font-medium text-slate-600">Rs.{gst.toLocaleString("en-IN")}</td></tr>
                <tr className="bg-slate-50">
                  <td className="px-5 py-4 text-right text-slate-900 font-black uppercase text-[11px] tracking-wider">Total Paid</td>
                  <td className="px-5 py-4 text-right font-black text-indigo-600 text-lg">Rs.{parseFloat(receipt.amount).toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50 mb-6">
            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-indigo-500" /><span className="text-indigo-900 font-bold text-xs uppercase tracking-wider">Payment Received</span></div>
            <span className="text-indigo-600 font-semibold text-xs text-right">Thank you! Happy reading. <br/>📚</span>
          </div>
          <button onClick={handleDownload} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black py-4 rounded-2xl text-base hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 no-print">
            <Download size={18} /> Download eBook PDF
          </button>
        </div>
        <button onClick={() => navigate("/student/ebooks")} className="mt-6 flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm transition-colors no-print">
          My eBooks <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  /* ─── Already owned ─── */
  if (alreadyOwned) return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] gap-5 p-6">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
        <CheckCircle2 size={40} className="text-emerald-500" />
      </div>
      <h2 className="text-2xl font-black text-slate-900">You already own this eBook!</h2>
      <p className="text-slate-500 text-center max-w-sm">Download it anytime from My eBooks.</p>
      <div className="flex gap-3">
        <button onClick={handleDownload} className="flex items-center gap-2 bg-violet-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-violet-700 transition-colors">
          <Download size={18} /> Download Now
        </button>
        <button onClick={() => navigate("/student/ebooks")} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors">
          My eBooks
        </button>
      </div>
    </div>
  );

  /* ─── Checkout ─── */
  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center py-10 px-4 md:px-8 font-sans -mt-4 animate-fade-in">
      <div className="w-full max-w-5xl mb-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest bg-white/50 px-4 py-2 rounded-xl">
          <ArrowLeft size={16} /> Back
        </button>
      </div>
      <div className="w-full max-w-5xl bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col md:flex-row items-stretch">
        {/* Left */}
        <div className="flex-1 p-10 md:p-14 bg-[#FAFAFC] relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-96 h-96 bg-violet-100/50 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white text-violet-600 border border-violet-100 text-[11px] font-bold uppercase tracking-widest rounded-lg mb-8 shadow-sm">
              <ShieldCheck size={16} className="text-violet-500" /> Secure Purchase
            </div>
            <h1 className="text-4xl md:text-[2.75rem] font-black text-slate-900 tracking-tight leading-tight mb-4">Buy eBook.</h1>
            <p className="text-slate-500 text-[15px] font-medium leading-relaxed mb-10 max-w-sm">One-time payment. Lifetime access. Download the PDF anytime.</p>
            {ebook ? (
              <div className="bg-white border border-slate-200/80 shadow-md rounded-3xl p-6 flex gap-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-full blur-2xl -mt-10 -mr-10" />
                {coverUrl ? <img src={coverUrl} alt={ebook.title} className="w-20 h-28 object-cover rounded-xl shadow-md flex-shrink-0" />
                  : <div className="w-20 h-28 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0"><BookOpen size={32} className="text-violet-400" /></div>}
                <div className="relative z-10">
                  <h3 className="text-xl font-black text-slate-900 mb-1 leading-snug">{ebook.title}</h3>
                  {ebook.author && <p className="text-slate-500 text-sm mb-3">by {ebook.author}</p>}
                  <div className="flex gap-2">
                    <span className="bg-violet-100 text-violet-700 text-xs font-bold px-2.5 py-1 rounded-full">Lifetime Access</span>
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">PDF Download</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center gap-3">
                <Loader2 size={20} className="animate-spin text-slate-400" />
                <p className="text-slate-500 font-medium">Loading eBook details...</p>
              </div>
            )}
          </div>
          <div className="mt-12 pt-8 border-t border-slate-200/60 relative z-10 flex gap-4 items-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0"><ShieldCheck size={22} /></div>
            <div>
              <h4 className="font-bold text-slate-900 text-[13px] mb-0.5">100% Secure</h4>
              <p className="text-[12px] text-slate-500 font-medium leading-relaxed">Encrypted via Razorpay. Zero hidden charges.</p>
            </div>
          </div>
        </div>
        {/* Right */}
        <div className="w-full md:w-[420px] bg-white p-10 md:p-12 flex flex-col justify-center border-l-0 md:border-l border-slate-100 z-10">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Payment Summary</h3>
          <div className="space-y-4 mb-8">
            {discount > 0 && (
              <>
                <div className="flex justify-between text-slate-400 font-bold text-sm line-through"><span>Original Price</span><span>Rs.{mrp.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between text-emerald-600 font-bold text-sm"><span>You Save</span><span>– Rs.{(mrp - finalPrice).toLocaleString("en-IN")} ({discount}% OFF)</span></div>
              </>
            )}
            <div className="flex justify-between text-slate-500 font-bold text-sm"><span>Base Price</span><span>Rs.{basePrice.toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between text-slate-500 font-bold text-sm"><span>GST (18%)</span><span>Rs.{gst.toLocaleString("en-IN")}</span></div>
          </div>
          <div className="border border-indigo-100 bg-indigo-50/30 rounded-2xl p-6 mb-8 flex justify-between items-end">
            <div>
              <span className="block text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-1">Final Amount</span>
              <span className="block text-sm font-bold text-slate-500">Total Payable</span>
            </div>
            <span className="text-4xl font-black text-slate-900 tracking-tight leading-none">Rs.{finalPrice.toLocaleString("en-IN")}</span>
          </div>
          <button onClick={handlePay} disabled={processing || !ebook}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white shadow-xl shadow-indigo-600/20 py-4 px-6 rounded-2xl font-black text-[15px] transition-all disabled:opacity-70 disabled:cursor-wait hover:-translate-y-0.5 group">
            {processing ? <><Loader2 size={20} className="animate-spin" /> Processing...</>
              : <><CreditCard size={20} className="opacity-70 group-hover:opacity-100" /> Pay Rs.{finalPrice.toLocaleString("en-IN")}</>}
          </button>
          <div className="mt-6 flex flex-col items-center gap-2">
            <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-4 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all" />
          </div>
          <div className="mt-5 flex items-start gap-3 bg-amber-50 text-amber-900 p-4 rounded-xl text-[10px] font-bold uppercase tracking-wide border border-amber-200/50">
            <Info size={14} className="shrink-0 text-amber-500" />
            <p className="leading-relaxed">One-time payment. No recurring charges. Lifetime PDF access.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
