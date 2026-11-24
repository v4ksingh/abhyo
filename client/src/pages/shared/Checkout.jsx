import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { CreditCard, CheckCircle2, ShieldCheck, ArrowLeft, Loader2, Info, Printer, ArrowRight, Check, X } from 'lucide-react';

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const planId = searchParams.get('planId');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [receiptInfo, setReceiptInfo] = useState(null);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  useEffect(() => {
    if (!planId) return;

    // Fetch plan details
    const fetchPlan = async () => {
      try {
        const res = await api.get('/plans/public');
        const p = res.data.data.find(curr => curr.id === planId);
        if (!p) {
          toast.error('Plan not found.');
          navigate(-1);
        } else {
          setPlan(p);
        }
      } catch (err) {
        toast.error('Failed to load plan details');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [planId, navigate]);

  if (!planId) return <Navigate to="/dashboard" />;

  if (!planId) return <Navigate to="/dashboard" />;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError('');
    try {
      const res = await api.post('/plans/public/validate-coupon', { code: couponCode, planId });
      setAppliedCoupon(res.data.data);
      toast.success('Coupon applied successfully!');
    } catch (err) {
      setCouponError(err.response?.data?.error || 'Invalid coupon');
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const getDiscountedPrice = () => {
    if (!plan) return 0;
    if (!appliedCoupon) return plan.price;
    if (appliedCoupon.discountType === 'percentage') {
      return Math.max(0, plan.price - (plan.price * appliedCoupon.discountValue / 100));
    }
    return Math.max(0, plan.price - appliedCoupon.discountValue);
  };

  const handleCheckout = async () => {
    setProcessing(true);
    try {
      const endpoint = user.role === 'institute' 
          ? '/institute/subscription/upgrade' 
          : '/payments/student-subscription';
          
      const payload = { planId };
      if (appliedCoupon) {
        payload.couponCode = appliedCoupon.code;
      }

      const res = await api.post(endpoint, payload);
      const { orderId, amount, currency, paymentId, key } = res.data.data;
      
      const options = {
        key, amount, currency,
        name: 'Abhyo',
        description: `Upgrade to ${plan.name}`,
        order_id: orderId,
        handler: async (resp) => {
          try {
            const verifyEndpoint = user.role === 'institute' 
                ? '/institute/subscription/verify' 
                : '/payments/verify-student-subscription';

            const payload = user.role === 'institute' 
                ? { ...resp, paymentId, planId }
                : { 
                    razorpay_order_id: resp.razorpay_order_id, 
                    razorpay_payment_id: resp.razorpay_payment_id, 
                    razorpay_signature: resp.razorpay_signature, 
                    paymentId, planId 
                  };

            await api.post(verifyEndpoint, payload);
            toast.success('🎉 Payment successful! Plan activated.');
            setReceiptInfo({
               transactionId: resp.razorpay_payment_id || `PAY-${Math.floor(Math.random()*10000000)}`,
               date: new Date(),
               amount: plan.price,
               planName: plan.name,
               user: user
            });
          } catch { 
            toast.error('Payment verification failed. Please contact support.'); 
          }
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#6366f1' },
      };

      if (!window.Razorpay) {
        toast.error('Payment gateway not loaded. Please refresh.');
        setProcessing(false);
        return;
      }
      
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function () {
        toast.error('Payment failed or cancelled.');
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upgrade initialization failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Preparing your cart...</p>
      </div>
    );
  }

  if (!plan) return null;

  let parsedFeatures = [];
  try {
    parsedFeatures = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features || [];
  } catch {
    parsedFeatures = [];
  }

  const finalPrice = getDiscountedPrice();
  const basePrice = Math.round(finalPrice / 1.18);
  const tax = finalPrice - basePrice;
  const savings = plan.price - finalPrice;

  if (receiptInfo) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center py-10 px-4 sm:px-6 md:px-8 font-sans -mt-4 animate-fade-in print:py-0 print:bg-white print:min-h-0 print:block">
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #printable-invoice, #printable-invoice * { visibility: visible; }
            #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: none !important; }
            .no-print { display: none !important; }
          }
        `}</style>
        
        <div className="w-full max-w-2xl mb-6 flex justify-between items-center no-print">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2"><Check className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 p-1.5" /> Order Complete</h2>
          <div className="flex gap-3">
            <button onClick={() => window.print()} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm">
              <Printer size={16} /> Print Receipt
            </button>
            <button onClick={() => navigate(`/${user.role === 'institute' ? 'institute' : 'student'}/subscription`)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold text-sm transition-colors shadow-sm shadow-indigo-500/20">
              Go to Dashboard <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div id="printable-invoice" className="w-full max-w-2xl bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-indigo-900/5 p-10 md:p-14 relative overflow-hidden">
          {/* subtle decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>

          {/* Header */}
          <div className="flex justify-between items-start mb-12 border-b border-slate-100 pb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                 <img src="/logo.png" alt="Abhyo" className="h-10 w-auto mix-blend-multiply" />
              </div>
              <p className="text-slate-500 text-xs font-semibold">Payment Receipt</p>
              <p className="text-slate-400 text-xs mt-0.5">Receipt #{receiptInfo.transactionId}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-900 font-bold text-sm mb-1">Abhyo Platform</p>
              <p className="text-slate-500 text-xs leading-relaxed">info@abhyo.com<br/>support.abhyo.com<br/>GSTIN: 27AABC1234DZ</p>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-8 mb-12">
            <div>
               <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1.5">Billed To</p>
               <p className="text-slate-900 font-bold text-sm mb-0.5">{receiptInfo.user.name}</p>
               <p className="text-slate-500 text-xs">{receiptInfo.user.email}</p>
               {receiptInfo.user.role === 'institute' && <p className="text-slate-500 text-xs mt-0.5">Institute Account</p>}
            </div>
            <div className="text-right">
               <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1.5">Date Paid</p>
               <p className="text-slate-900 font-bold text-sm">{new Date(receiptInfo.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
               <p className="text-slate-500 text-xs mt-0.5">{new Date(receiptInfo.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>

          {/* Items */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-8">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-5 py-4">
                    <p className="text-slate-900 font-bold mb-0.5">{receiptInfo.planName} Plan</p>
                    <p className="text-slate-500 text-xs">Subscription Upgrade</p>
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-slate-900">₹{basePrice.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-slate-500 text-xs text-right">Subtotal</td>
                  <td className="px-5 py-3 text-right font-medium text-slate-600">₹{basePrice.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-slate-500 text-xs text-right border-t-0">Integrated GST (18%)</td>
                  <td className="px-5 py-3 text-right font-medium text-slate-600 border-t-0">₹{tax.toLocaleString('en-IN')}</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="px-5 py-4 text-slate-900 font-black text-right uppercase tracking-wider text-[11px]">Total Paid</td>
                  <td className="px-5 py-4 text-right font-black text-indigo-600 text-lg">₹{receiptInfo.amount.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
             <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-indigo-500" />
                <span className="text-indigo-900 font-bold text-xs uppercase tracking-wider">Payment Received</span>
             </div>
             <span className="text-indigo-600 font-semibold text-xs text-right">Thank you for investing<br/>in your journey with Abhyo.</span>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center py-10 px-4 sm:px-6 md:px-8 font-sans -mt-4 animate-fade-in">
      {/* Back button */}
      <div className="w-full max-w-5xl mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest bg-white/50 px-4 py-2 rounded-xl"
        >
          <ArrowLeft size={16} /> Retreat
        </button>
      </div>

      <div className="w-full max-w-5xl bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col md:flex-row items-stretch">
        
        {/* Left Side: Order Details & Branding */}
        <div className="flex-1 p-10 md:p-14 bg-[#FAFAFC] relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-100/40 rounded-full blur-3xl pointer-events-none -translate-x-1/3 translate-y-1/3"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 bg-white text-indigo-600 border border-indigo-100 text-[11px] font-bold uppercase tracking-widest rounded-lg mb-8 shadow-sm">
              <ShieldCheck size={16} className="text-indigo-500" /> Official Subscription
            </div>
            
            <h1 className="text-4xl md:text-[2.75rem] font-black text-slate-900 tracking-tight leading-tight mb-4">Order Checkout.</h1>
            <p className="text-slate-500 text-[15px] font-medium leading-relaxed mb-10 max-w-sm">You are upgrading to a tier that unlocks premium benefits and comprehensive platform features.</p>
            
            <div className="bg-white border border-slate-200/80 shadow-md shadow-slate-200/40 rounded-3xl p-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-full blur-2xl -mt-10 -mr-10"></div>
               
               <h3 className="text-2xl font-black text-slate-900 mb-1.5">{plan.name}</h3>
               <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">Billing Cycle: {plan.interval}</p>
               
               <div className="space-y-3.5 relative z-10">
                 {parsedFeatures.slice(0, 4).map((f, i) => (
                    <div key={i} className="flex gap-3 items-start text-[14px] font-semibold text-slate-600">
                      <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span className="leading-snug">{f}</span>
                    </div>
                 ))}
               </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-200/60 relative z-10 flex gap-4 items-center">
             <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
               <ShieldCheck size={22} />
             </div>
             <div>
                <h4 className="font-bold text-slate-900 text-[13px] mb-0.5 tracking-wide">Safe Processing</h4>
                <p className="text-[12px] text-slate-500 font-medium leading-relaxed">Encrypted transaction backed by Razorpay. Zero hidden fees.</p>
             </div>
          </div>
        </div>
        
        {/* Right Side: Payment Calculation */}
        <div className="w-full md:w-[420px] bg-white p-10 md:p-12 flex flex-col justify-center border-l-0 md:border-l border-slate-100 shadow-[-10px_0_30px_rgba(0,0,0,0.02)] z-10">
            
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Payment Summary</h3>
            
            {/* Promo Code Section */}
            <div className="mb-6 bg-slate-50 rounded-xl p-4 border border-slate-100">
               {!appliedCoupon ? (
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Apply Promo Code</label>
                     <div className="flex gap-2">
                        <input type="text" value={couponCode} onChange={e => {setCouponCode(e.target.value.toUpperCase()); setCouponError('');}} placeholder="Enter code" className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 font-black uppercase tracking-wider focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-300 placeholder:font-medium" disabled={validatingCoupon} />
                        <button onClick={handleApplyCoupon} disabled={!couponCode.trim() || validatingCoupon} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50 transition-all hover:bg-slate-900">
                           {validatingCoupon ? <Loader2 size={16} className="animate-spin" /> : 'Apply'}
                        </button>
                     </div>
                     {couponError && <p className="text-red-500 text-[10px] font-bold mt-1">{couponError}</p>}
                  </div>
               ) : (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                     <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                           <CheckCircle2 size={14} className="text-emerald-500" />
                           <span className="text-emerald-700 font-black text-xs uppercase tracking-widest">{appliedCoupon.code} Applied</span>
                        </div>
                        <p className="text-emerald-600/80 text-[10px] font-bold">
                           {appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}% OFF` : `₹${appliedCoupon.discountValue} OFF`}
                        </p>
                     </div>
                     <button onClick={handleRemoveCoupon} className="text-slate-400 hover:text-red-500 p-1">
                        <X size={16} />
                     </button>
                  </div>
               )}
            </div>

            <div className="space-y-4 mb-8">
              {appliedCoupon && (
                <>
                  <div className="flex justify-between items-center text-slate-400 font-bold text-sm line-through">
                    <span>Original Price</span>
                    <span>₹{plan.price.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-600 font-bold text-sm">
                    <span>Total Savings</span>
                    <span>- ₹{savings.toLocaleString('en-IN')}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center text-slate-500 font-bold text-sm">
                <span>Base Charge</span>
                <span>₹{basePrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 font-bold text-sm">
                <span>Integrated GST (18%)</span>
                <span>₹{tax.toLocaleString('en-IN')}</span>
              </div>
            </div>
            
            <div className="border border-indigo-100 bg-indigo-50/30 rounded-2xl p-6 mb-8 flex justify-between items-end">
              <div>
                <span className="block text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-1">Final Amount</span>
                <span className="block text-sm font-bold text-slate-500">Total Payable</span>
              </div>
              <span className="text-4xl font-black text-slate-900 tracking-tight leading-none">₹{finalPrice.toLocaleString('en-IN')}</span>
            </div>
             
             <button
               onClick={handleCheckout}
               disabled={processing}
               className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white shadow-xl shadow-indigo-600/20 py-4 px-6 rounded-2xl font-black text-[15px] transition-all disabled:opacity-70 disabled:cursor-wait hover:-translate-y-0.5 group"
             >
                {processing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Authenticating...
                  </>
                ) : (
                  <>
                    <CreditCard size={20} className="opacity-70 group-hover:opacity-100 transition-opacity" /> Proceed • ₹{finalPrice.toLocaleString('en-IN')}
                  </>
                )}
             </button>
             
             <div className="mt-8 flex flex-col items-center gap-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-4 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all" />
             </div>
             
             <div className="mt-6 flex items-start gap-3 bg-amber-50 text-amber-900 p-4 rounded-xl text-[10px] font-bold uppercase tracking-wide border border-amber-200/50">
              <Info size={14} className="shrink-0 text-amber-500" />
              <p className="leading-relaxed">Instant activation strictly upon successful transaction. Cancellation available anytime.</p>
            </div>
        </div>

      </div>
    </div>
  );
}
