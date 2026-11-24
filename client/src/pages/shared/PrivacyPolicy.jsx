import React from 'react';
import { Shield, Lock, Eye, FileText, Server, Mail } from 'lucide-react';
import usePageMeta from '../../hooks/usePageMeta';

export default function PrivacyPolicy() {
  usePageMeta({
    title: 'Privacy Policy – How Abhyo Protects Your Data',
    description: 'Read Abhyo’s privacy policy to understand how we collect, use, and protect your personal data. We never sell your data. SSL encrypted, GDPR-aware practices.',
    canonical: '/privacy-policy',
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-emerald-50 rounded-full blur-[100px] opacity-60 pointer-events-none" />
        
        <div className="container mx-auto px-6 lg:px-12 relative z-10 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white border border-emerald-200 text-emerald-700 text-xs font-bold px-4 py-2 rounded-full mb-6 shadow-sm shadow-emerald-500/10">
            <Shield className="w-3.5 h-3.5" /> Legal Information
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-6 leading-tight">
            Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Policy</span>
          </h1>
          
          <p className="text-lg text-slate-600 font-medium leading-relaxed">
            Your privacy is critically important to us. This policy outlines how we collect, use, and protect your personal data when you use the Abhyo platform.
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
            
            <div className="prose prose-slate prose-emerald max-w-none">
              
              <div className="flex items-start gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0 mt-1">
                  <Eye className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-3">1. Information We Collect</h2>
                  <p className="text-slate-600 leading-relaxed font-medium mb-4">
                    When you register for an Abhyo account, we collect personal information such as your name, email address, mobile number, and educational background. We also collect usage data—including your test scores, performance analytics, time spent on questions, and navigation paths across our platform.
                  </p>
                  <ul className="list-disc pl-5 text-slate-600 font-medium space-y-2">
                    <li><strong>Account Data:</strong> Name, Email, Password, Phone Number.</li>
                    <li><strong>Profile Data:</strong> Target Exams, State, City, Educational Institute.</li>
                    <li><strong>Usage Data:</strong> Test attempts, IP addresses, browser types, and device information.</li>
                  </ul>
                </div>
              </div>

              <hr className="border-slate-100 my-10" />

              <div className="flex items-start gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center shrink-0 mt-1">
                  <FileText className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-3">2. How We Use Your Data</h2>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    The data we collect is fundamentally used to improve your learning experience. We use your performance data to generate personalized analytics, recommend mock tests, and highlight areas for improvement. We may also use your contact information to send you platform updates, password resets, and promotional offers (which you can opt out of at any time).
                  </p>
                </div>
              </div>

              <hr className="border-slate-100 my-10" />

              <div className="flex items-start gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0 mt-1">
                  <Server className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-3">3. Data Sharing & Third Parties</h2>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    We do not sell, trade, or rent your personal identification information to others. We may share generic aggregated demographic information not linked to any personal identification information with our business partners and trusted affiliates. If you are enrolled through a partner coaching institute, your performance data will be shared with the administrators of that specific institute.
                  </p>
                </div>
              </div>

              <hr className="border-slate-100 my-10" />

              <div className="flex items-start gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center shrink-0 mt-1">
                  <Lock className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-3">4. Security Protocols</h2>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    We adopt appropriate data collection, storage, and processing practices and security measures to protect against unauthorized access, alteration, disclosure, or destruction of your personal information, username, password, transaction information, and data stored on our Site. All sensitive data exchange happens over an SSL secured communication channel and is encrypted and protected.
                  </p>
                </div>
              </div>

              <hr className="border-slate-100 my-10" />

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-2">Have questions about your data?</h3>
                  <p className="text-slate-600 text-sm font-medium">Our data protection team is always here to help you understand your rights.</p>
                </div>
                <a href="/contact" className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2">
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
