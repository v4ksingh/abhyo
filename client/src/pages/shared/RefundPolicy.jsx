import React from 'react';
import { 
  RotateCcw, 
  ShieldCheck, 
  CreditCard, 
  Clock, 
  AlertCircle, 
  HelpCircle, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  FileText
} from 'lucide-react';
import usePageMeta from '../../hooks/usePageMeta';

export default function RefundPolicy() {
  usePageMeta({
    title: 'Refund & Cancellation Policy – Abhyo Edu Services',
    description: 'Learn about Abhyo’s refund, cancellation, and payment resolution policies for mock tests, Olympiad registrations, and subscriptions. Quick 5–7 day processing via Razorpay.',
    canonical: '/refund-policy',
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden">
        {/* Background glow orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[520px] bg-emerald-50/80 rounded-full blur-[110px] opacity-70 pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-72 h-72 bg-teal-100/50 rounded-full blur-[90px] pointer-events-none" />

        <div className="container mx-auto px-6 lg:px-12 relative z-10 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white border border-emerald-200 text-emerald-700 text-xs font-bold px-4 py-2 rounded-full mb-6 shadow-sm shadow-emerald-500/10">
            <RotateCcw className="w-3.5 h-3.5 text-emerald-600 animate-spin-reverse" />
            Transparent & Fair Guarantee
          </div>

          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-6 leading-tight">
            Refund & <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600">Cancellation Policy</span>
          </h1>

          <p className="text-lg text-slate-600 font-medium leading-relaxed">
            At Abhyo, we prioritize student and institute satisfaction. This policy transparently outlines conditions under which refunds, cancellations, and payment adjustments are granted.
          </p>

          <p className="text-xs text-slate-400 mt-4 font-bold uppercase tracking-widest">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-24 relative z-20">
        <div className="container mx-auto px-6 lg:px-12 max-w-4xl">
          
          {/* Quick Highlight Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-sm shadow-emerald-500/5 flex items-start gap-4 hover:border-emerald-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">100% Duplicate Reversal</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Automatic or rapid refund for multiple charges caused by network glitches.
                </p>
              </div>
            </div>

            <div className="bg-white border border-teal-100 rounded-2xl p-6 shadow-sm shadow-teal-500/5 flex items-start gap-4 hover:border-teal-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 text-teal-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">5 – 7 Business Days</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Direct return to original source account via Razorpay gateway.
                </p>
              </div>
            </div>

            <div className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm shadow-indigo-500/5 flex items-start gap-4 hover:border-indigo-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 text-indigo-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Zero Hassle Support</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Dedicated ticket resolution team via email, WhatsApp, or helpline.
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Document Container */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12 lg:p-16">
            <div className="prose prose-slate prose-emerald max-w-none space-y-10">

              {/* Section 1 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0 mt-1">
                  <FileText className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-3">1. Scope of Digital Services</h2>
                  <p className="text-slate-600 leading-relaxed font-medium mb-3">
                    Abhyo (<span className="text-slate-900 font-semibold">abhyo.com</span>) provides digital, non-tangible educational software services, including online mock tests, test series packages, video courses, downloadable digital study materials/eBooks, Olympiad registration access, and coaching institute management software.
                  </p>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    Because our digital assets and exam materials are accessible immediately upon successful payment authorization, our refund policy balances consumer fairness with the irrevocable nature of digital content consumption.
                  </p>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Section 2 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center shrink-0 mt-1">
                  <CheckCircle2 className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-3">2. Eligibility for Refunds</h2>
                  <p className="text-slate-600 leading-relaxed font-medium mb-4">
                    Refunds will be accepted and evaluated under the following verified conditions:
                  </p>
                  
                  <div className="space-y-4">
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                      <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> A. Duplicate or Multiple Charges
                      </h4>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        If you were charged more than once for the same subscription or exam series due to a network timeout or browser refresh, the duplicate transaction will be refunded 100% without deductions upon verification.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                      <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> B. Payment Debited but Account Not Upgraded
                      </h4>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        If payment was successfully debited from your bank or card but the purchased test series, plan, or Olympiad slot failed to activate due to an API sync error, and our engineering support cannot rectify or activate your access within 24 hours of reporting.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                      <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> C. Prolonged Technical Disruption
                      </h4>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        If verified systemic platform downtime or video player corruption prevents access to premium features for more than 72 consecutive hours and alternative access cannot be provided.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Section 3 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0 mt-1">
                  <XCircle className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-3">3. Non-Refundable Items & Scenarios</h2>
                  <p className="text-slate-600 leading-relaxed font-medium mb-4">
                    Except as expressly noted in Section 2, transactions cannot be refunded or cancelled under the following circumstances:
                  </p>
                  <ul className="list-disc pl-5 text-slate-600 font-medium space-y-2 text-sm leading-relaxed">
                    <li>
                      <strong>Attempted Mock Tests:</strong> Once any full mock test, section test, or live exam within a purchased bundle has been started or submitted.
                    </li>
                    <li>
                      <strong>Downloaded Materials & eBooks:</strong> Once an eBook or study PDF file has been downloaded or unlocked in the user's dashboard library.
                    </li>
                    <li>
                      <strong>Change of Mind / Subject Interest:</strong> Regret or decision not to pursue an exam after purchasing cannot be grounds for a refund. We strongly urge students to explore free sample tests and preview materials prior to purchasing.
                    </li>
                    <li>
                      <strong>Third-Party Connectivity Issues:</strong> Inability to participate due to local internet dropouts, device incompatibility, power failures, or browser restrictions at the student's end.
                    </li>
                    <li>
                      <strong>Terms Violation & Malpractice:</strong> Any account terminated or suspended due to academic dishonesty, unauthorized screen recording, credentials sharing, or abusive conduct will forfeit all fee entitlements.
                    </li>
                  </ul>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Section 4 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 mt-1">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-3">4. Olympiad Examination Cancellation Policy</h2>
                  <p className="text-slate-600 leading-relaxed font-medium mb-3">
                    Registration fees for the National / Global Olympiad exams are managed under specific event timelines:
                  </p>
                  <ul className="list-disc pl-5 text-slate-600 font-medium space-y-2 text-sm leading-relaxed mb-4">
                    <li>
                      <strong>Before Registration Closing Date:</strong> If a student notifies us at least <strong>72 hours before</strong> the official registration closure date, they may request a transfer of the enrollment to another subject or class slot without penalty.
                    </li>
                    <li>
                      <strong>After Admit Card Generation:</strong> Once roll numbers and digital admit cards are generated, no refunds or fee rollbacks can be issued.
                    </li>
                    <li>
                      <strong>Exam Day Absence:</strong> Failure to sit for the scheduled Olympiad exam window (whether due to personal reasons, medical emergency, or scheduling clashes) does not qualify for a refund.
                    </li>
                  </ul>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Section 5 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0 mt-1">
                  <CreditCard className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-3">5. Processing Method & Timelines</h2>
                  <p className="text-slate-600 leading-relaxed font-medium mb-3">
                    Abhyo processes all digital financial transactions strictly through our Reserve Bank of India (RBI) compliant payment aggregator partner, <strong>Razorpay</strong>.
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-4 text-sm space-y-2 font-medium text-slate-700">
                    <p className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 min-w-[140px]">Original Mode:</span>
                      Refunds are credited directly back to the original source (Credit Card, Debit Card, Net Banking, or UPI ID).
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 min-w-[140px]">Settlement Time:</span>
                      Once approved and initiated by Abhyo, banking partner networks generally take <strong>5 to 7 working days</strong> to reflect in your bank account statement.
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 min-w-[140px]">No Cash / Paper:</span>
                      Under no circumstances do we issue cash refunds or paper cheques for online transactions.
                    </p>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Section 6 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center shrink-0 mt-1">
                  <RefreshCw className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-3">6. How to Submit a Refund Claim</h2>
                  <p className="text-slate-600 leading-relaxed font-medium mb-4">
                    To expedite your claim, please follow this procedure within <strong>7 days</strong> of the incident:
                  </p>
                  <ol className="list-decimal pl-5 text-slate-600 font-medium space-y-2 text-sm leading-relaxed">
                    <li>Send an email to <a href="mailto:info@abhyo.com" className="text-emerald-600 font-bold hover:underline">info@abhyo.com</a> with the subject line: <code className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs font-mono font-bold">Refund Request - [Your Order/Payment ID]</code>.</li>
                    <li>Include your full name, registered phone number, and registered email address.</li>
                    <li>Attach the Razorpay Payment ID or banking screenshot showing the debit transaction details and UTR number.</li>
                    <li>Provide a concise explanation of the error or discrepancy.</li>
                  </ol>
                  <p className="text-xs text-slate-500 font-medium mt-3 italic">
                    Our billing team will review the transaction logs within 24–48 hours and notify you via email regarding the approval status.
                  </p>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Contact Box */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[70px] pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <HelpCircle className="w-4 h-4" /> Need Assistance?
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-white mb-3">
                    Have questions about a payment or refund?
                  </h3>
                  <p className="text-slate-300 text-sm font-medium mb-6 max-w-xl leading-relaxed">
                    Our dedicated support team is available Monday through Saturday (9:00 AM – 7:00 PM IST) to assist with any billing or payment queries.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium text-slate-300 mb-6">
                    <a 
                      href="mailto:info@abhyo.com" 
                      className="flex items-center gap-3 bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/10 transition-colors"
                    >
                      <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-400">Email Us</div>
                        <div className="font-bold text-white text-sm">info@abhyo.com</div>
                      </div>
                    </a>

                    <a 
                      href="tel:+919334964086" 
                      className="flex items-center gap-3 bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/10 transition-colors"
                    >
                      <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-400">Call / WhatsApp</div>
                        <div className="font-bold text-white text-sm">+91 9334964086</div>
                      </div>
                    </a>
                  </div>

                  <div className="flex items-start gap-3 text-xs text-slate-400 pt-4 border-t border-white/10">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Near Janakpuri Petrol Pump, Panki Road, Redma, Medininagar - 822101, Jharkhand, India</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
