import React from 'react';
import { Shield, BookOpen, AlertCircle, Scale, Building2, Mail } from 'lucide-react';
import usePageMeta from '../../hooks/usePageMeta';

export default function Terms() {
  usePageMeta({
    title: 'Terms & Conditions – Abhyo Platform Usage Policy',
    description: 'Read Abhyo’s terms and conditions governing use of our exam preparation platform, including student accounts, institute partnerships, and intellectual property rights.',
    canonical: '/terms',
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-50 rounded-full blur-[100px] opacity-60 pointer-events-none" />
        
        <div className="container mx-auto px-6 lg:px-12 relative z-10 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white border border-indigo-200 text-indigo-700 text-xs font-bold px-4 py-2 rounded-full mb-6 shadow-sm shadow-indigo-500/10">
            <Scale className="w-3.5 h-3.5" /> Legal Information
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-6 leading-tight">
            Terms & <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">Conditions</span>
          </h1>
          
          <p className="text-lg text-slate-600 font-medium leading-relaxed">
            Please read these terms and conditions carefully before using the Abhyo platform. By accessing or using our services, you agree to be bound by these terms.
          </p>
          <p className="text-sm text-slate-400 mt-4 font-bold uppercase tracking-widest">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="pb-24 relative z-20">
        <div className="container mx-auto px-6 lg:px-12 max-w-4xl">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12 lg:p-16">
            
            <div className="prose prose-slate prose-indigo max-w-none">
              
              <div className="flex items-start gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0 mt-1">
                  <BookOpen className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-3">1. Acceptance of Terms</h2>
                  <p className="text-slate-600 leading-relaxed font-medium mb-4">
                    By accessing and using Abhyo (the "Platform"), you accept and agree to be bound by the terms and provision of this agreement. In addition, when using this Platform's particular services, you shall be subject to any posted guidelines or rules applicable to such services.
                  </p>
                </div>
              </div>

              <hr className="border-slate-100 my-10" />

              <div className="flex items-start gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center shrink-0 mt-1">
                  <Shield className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-3">2. User Accounts & Responsibilities</h2>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    To use certain features of the Platform, you must register for an account. You are responsible for maintaining the confidentiality of your account password. You are also responsible for all activities that occur in connection with your account. You agree to notify us immediately of any unauthorized use of your account.
                  </p>
                </div>
              </div>

              <hr className="border-slate-100 my-10" />

              <div className="flex items-start gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0 mt-1">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-3">3. Institute Partnerships</h2>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    Coaching institutes partnering with Abhyo are granted a non-exclusive, non-transferable license to use the platform for educational purposes. Institutes must not misuse the platform to distribute unauthorized or copyrighted materials. Abhyo reserves the right to suspend any institute account that violates these terms.
                  </p>
                </div>
              </div>

              <hr className="border-slate-100 my-10" />

              <div className="flex items-start gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center shrink-0 mt-1">
                  <AlertCircle className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-3">4. Intellectual Property</h2>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    All mock tests, study materials, video lectures, and platform designs provided by Abhyo are protected by intellectual property laws. Users may not copy, reproduce, distribute, or create derivative works from this content without explicit written permission from Abhyo.
                  </p>
                </div>
              </div>

              <hr className="border-slate-100 my-10" />

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-2">Need clarification on any terms?</h3>
                  <p className="text-slate-600 text-sm font-medium">Reach out to our legal team for any questions regarding these terms.</p>
                </div>
                <a href="/contact" className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Contact Us
                </a>
              </div>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
