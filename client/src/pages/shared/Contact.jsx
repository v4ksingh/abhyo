import React, { useState } from 'react';
import { Mail, MapPin, Phone, MessageSquare, Send, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import usePageMeta from '../../hooks/usePageMeta';

export default function Contact() {
  usePageMeta({
    title: 'Contact Us – Abhyo Support & Sales',
    description: 'Get in touch with Abhyo for support, queries, or admissions. Phone: +91 9334964086, Email: info@abhyo.com. Near Janakpuri Petrol Pump, Panki Road, Redma, Medininagar - 822101, Jharkhand.',
    canonical: '/contact',
  });

  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/cms/contact', formData);
      toast.success("Thanks for reaching out! We'll contact you soon.");
      setFormData({ firstName: '', lastName: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
    } catch (err) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold px-4 py-2 rounded-full mb-6 shadow-sm">
            <MessageSquare className="w-3.5 h-3.5" /> Support 24/7
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-4">
            We'd love to <span className="text-indigo-600">hear from you</span>
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
            Whether you have a question about our plans, need technical support, or want to discuss enterprise pricing.
          </p>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden grid lg:grid-cols-5">
          {/* Contact Info */}
          <div className="bg-slate-900 p-10 lg:col-span-2 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[80px] opacity-20 -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <h2 className="text-2xl font-black mb-2">Contact Information</h2>
              <p className="text-slate-400 font-medium mb-12">Fill out the form and our team will get back to you within 24 hours.</p>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Phone / WhatsApp</h4>
                    <a href="tel:+919334964086" className="text-slate-300 hover:text-white text-sm font-medium transition-colors block">
                      +91 93349 64086
                    </a>
                    <a
                      href="https://wa.me/919334964086"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold mt-1 inline-flex items-center gap-1 transition-colors"
                    >
                      Chat on WhatsApp →
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Email</h4>
                    <a href="mailto:info@abhyo.com" className="text-slate-300 hover:text-white text-sm font-medium transition-colors block">
                      info@abhyo.com
                    </a>
                    <a href="mailto:support@abhyo.com" className="text-slate-400 hover:text-slate-300 text-xs font-medium transition-colors block mt-0.5">
                      support@abhyo.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Office Address</h4>
                    <p className="text-slate-300 text-sm font-medium leading-relaxed">
                      Near Janakpuri Petrol Pump, Panki Road,<br />
                      Redma, Medininagar - 822101<br />
                      Jharkhand, India
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-10 lg:p-12 lg:col-span-3">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">First Name</label>
                  <input type="text" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors" placeholder="John" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Last Name</label>
                  <input type="text" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors" placeholder="Doe" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Phone</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors" placeholder="+91 93349 64086" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
                <select value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors">
                  <option>General Inquiry</option>
                  <option>Technical Support</option>
                  <option>Payment Issue</option>
                  <option>Enterprise Sales</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
                <textarea required rows={4} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors resize-none" placeholder="How can we help?"></textarea>
              </div>
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-50">
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Send Message</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
