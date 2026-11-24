import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

const FacebookIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
);
const TwitterIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.05c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/></svg>
);
const InstagramIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
);
const LinkedinIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
);
const YoutubeIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.872.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
);
const WhatsappIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.405 0 0 5.394 0 12.019c0 2.115.553 4.18 1.603 5.992L.002 24l6.155-1.611a11.96 11.96 0 0 0 5.874 1.529h.005c6.626 0 12.031-5.394 12.031-12.019C24 5.405 18.657 0 12.031 0zm0 21.892h-.003a9.92 9.92 0 0 1-5.064-1.385l-.363-.215-3.766.987.998-3.666-.236-.376a9.914 9.914 0 0 1-1.52-5.326c0-5.485 4.471-9.946 9.954-9.946 5.484 0 9.954 4.46 9.954 9.945s-4.47 9.982-9.954 9.982zm5.46-7.464c-.299-.15-1.774-.876-2.049-.977-.275-.1-.475-.15-.675.15-.2.299-.775.976-.95 1.176-.175.2-.35.225-.65.075-.3-.15-1.266-.467-2.411-1.488-.89-.793-1.49-1.774-1.665-2.074-.175-.3-.018-.462.132-.612.135-.135.3-.35.45-.525.15-.175.2-.3.3-.5s-.05-.375-.125-.525c-.075-.15-.675-1.625-.925-2.225-.243-.585-.49-.505-.675-.515-.175-.01-.375-.01-.575-.01s-.525.075-.8.375c-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.115 3.226 5.122 4.526 2.007.868 2.846.962 3.9.813 1.176-.168 3.593-1.468 4.093-2.888.5-1.42.5-2.637.35-2.887-.15-.25-.55-.4-.85-.55z"/></svg>
);
import api from '../../lib/api';


const footerLinks = [
  { title: 'Platform', links: [{ label: 'Olympiad', to: '/olympiad' }, { label: 'Awards & Scholarships', to: '/olympiad/awards' }, { label: 'Exam Series', to: '/categories' }, { label: 'Upcoming Exams', to: '/upcoming-exams' }, { label: 'Video Series', to: '/video-series' }, { label: 'eBooks', to: '/ebooks' }, { label: 'Live Tests', to: '/live-test' }, { label: 'Pricing', to: '/plans' }, { label: 'For Institutes', to: '/institutes' }] },
  { title: 'Exams', links: [{ label: 'UPSC', to: '/upcoming-exams' }, { label: 'SSC', to: '/upcoming-exams' }, { label: 'Banking', to: '/upcoming-exams' }, { label: 'Railway', to: '/upcoming-exams' }, { label: 'State PCS', to: '/upcoming-exams' }] },
  { title: 'Company', links: [{ label: 'About Us', to: '/about' }, { label: 'Blog', to: '/blog' }, { label: 'Contact', to: '/contact' }, { label: 'Privacy Policy', to: '/privacy-policy' }, { label: 'Terms & Conditions', to: '/terms' }, { label: 'Refund Policy', to: '/refund-policy' }] },
];

export default function PublicFooter() {
  const [socialLinks, setSocialLinks] = useState({
    facebook: 'https://facebook.com/abhyo_edu',
    instagram: 'https://www.instagram.com/abhyoedu/'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/cms/settings');
        if (res.data.success) {
          const socialSetting = res.data.data.find(s => s.key === 'socialLinks');
          if (socialSetting && socialSetting.value) {
            setSocialLinks(JSON.parse(socialSetting.value));
          }
        }
      } catch (err) {
        console.error('Failed to load social links');
      }
    };
    fetchSettings();
  }, []);

  const icons = {
    facebook: FacebookIcon,
    twitter: TwitterIcon,
    instagram: InstagramIcon,
    linkedin: LinkedinIcon,
    youtube: YoutubeIcon,
    whatsapp: WhatsappIcon,
  };
  return (
    <footer className="bg-gradient-to-b from-slate-950 via-[#0a0a0a] to-black text-white py-16 px-5 lg:px-10 relative overflow-hidden">
      {/* Subtle top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-24 bg-emerald-500/10 blur-[80px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          <div className="col-span-2">
            <div className="flex items-center mb-5">
              <img src="/logo.png" alt="Abhyo" className="h-14 w-auto brightness-0 invert" />
            </div>
            <p className="text-sm font-medium leading-relaxed text-white max-w-xs mb-4">
              India's most trusted mock test platform for competitive exam preparation. Real tests. Real results.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-white mb-8">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              All systems operational
            </div>
            
            {/* App Store Buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Apple Store */}
              <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-4 py-2 rounded-xl relative overflow-hidden group cursor-not-allowed">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <svg className="w-6 h-6 text-white relative z-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.62 1.54-1.53 2.97-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <div className="flex flex-col relative z-10">
                  <span className="text-[9px] text-white/70 leading-none mb-0.5">Coming Soon on</span>
                  <span className="text-[13px] font-bold text-white leading-none">App Store</span>
                </div>
              </div>

              {/* Google Play */}
              <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-4 py-2 rounded-xl relative overflow-hidden group cursor-not-allowed">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <svg className="w-6 h-6 text-white relative z-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5.5 3.1c-.4.2-.7.6-.7 1.3v15.2c0 .7.3 1.1.7 1.3l.1.1 8.3-8.3v-.3L5.6 3l-.1.1zm9.3 8.6l2.6 2.6 3-1.7c.8-.5.8-1.2 0-1.7l-3-1.7-2.6 2.5v.3zm-9 9.1l8.2-8.2 2.6 2.6-10.8 5.6zM5.8 3l10.8 5.6-2.6 2.6L5.8 3z"/>
                </svg>
                <div className="flex flex-col relative z-10">
                  <span className="text-[9px] text-white/70 leading-none mb-0.5">Coming Soon on</span>
                  <span className="text-[13px] font-bold text-white leading-none">Google Play</span>
                </div>
              </div>
            </div>
          </div>
          {footerLinks.map((col) => (
            <div key={col.title}>
              <h4 className="font-black text-white mb-4 text-xs md:text-[13px] uppercase tracking-widest">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.to.startsWith('/') && !l.to.includes('#')
                      ? <Link to={l.to} className="text-sm text-white hover:text-emerald-400 transition-colors font-medium">{l.label}</Link>
                      : <a href={l.to} className="text-sm text-white hover:text-emerald-400 transition-colors font-medium">{l.label}</a>
                    }
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-slate-800 pt-8 mt-12 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <p className="text-xs sm:text-[13px] text-white font-medium">© {new Date().getFullYear()} Abhyo.com. All rights reserved.</p>
            <div className="flex items-center gap-1.5 text-xs sm:text-[13px] text-white font-medium">
              <span>Designed and developed with</span><span className="text-red-500 text-sm">❤️</span><span>by</span>
              <a href="http://facebook.com/bizfixdigital/" target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors font-bold hover:underline">
                bizfixdigital
              </a>
            </div>
          </div>

          {/* Social Links on the right */}
          {Object.values(socialLinks).some(v => v) && (
            <div className="flex justify-center gap-4">
              {Object.keys(socialLinks).map(platform => {
                const url = socialLinks[platform];
                if (!url) return null;
                const Icon = icons[platform.toLowerCase()];
                return (
                  <a 
                    key={platform} 
                    href={url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-white hover:text-white transition-colors bg-slate-800 p-2.5 rounded-full hover:bg-emerald-600"
                  >
                    {Icon ? <Icon className="w-4 h-4" /> : platform}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
