import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, Globe, Phone, Mail, Users, BookOpen, Award, Star,
  Calendar, Zap, ExternalLink, ChevronRight, List, Clock, Tag,
  ImageIcon, X, Share2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { getImageUrl } from '../lib/imageUrl';

const SOCIAL = {
  facebook:  { label: 'f',  color: '#1877F2' },
  twitter:   { label: '𝕏',  color: '#000' },
  youtube:   { label: '▶', color: '#FF0000' },
  instagram: { label: '◈', color: '#E1306C' },
  linkedin:  { label: 'in', color: '#0A66C2' },
};

function SocialBtn({ platform, url }) {
  const s = SOCIAL[platform];
  if (!s || !url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-sm font-bold bg-white hover:bg-slate-50 transition-colors"
      style={{ color: s.color }}>
      {s.label}
    </a>
  );
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, color = 'text-indigo-600', children }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <Icon size={20} className={color} />
      <h2 className="text-lg font-bold text-slate-800">{children}</h2>
    </div>
  );
}

export default function InstituteLandingPage() {
  const { slug } = useParams();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/public/institutes/${slug}`);
        const d = res.data.data;
        const safe = (v, fb) => {
          if (!v) return fb;
          if (typeof v === 'string') { try { return JSON.parse(v); } catch { return fb; } }
          return v;
        };
        if (d?.institute) {
          d.institute.achievements = safe(d.institute.achievements, []);
          d.institute.socialLinks  = safe(d.institute.socialLinks, {});
          d.institute.courses      = safe(d.institute.courses, []);
          d.institute.faculty      = safe(d.institute.faculty, []);
          d.institute.testimonials = safe(d.institute.testimonials, []);
          d.institute.gallery      = safe(d.institute.gallery, []);
        }
        setData(d);
      } catch (err) {
        if (err.response?.status === 404) setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 p-8 text-center">
        <div className="text-5xl">🏫</div>
        <h2 className="text-2xl font-bold text-slate-800">Institute Not Found</h2>
        <p className="text-slate-500 max-w-sm">This page is unavailable or doesn't exist.</p>
        <Link to="/institutes" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors">
          Browse Institutes
        </Link>
      </div>
    );
  }

  const inst         = data?.institute || {};
  const publicTests  = data?.publicTests || [];
  const achievements = inst.achievements || [];
  const courses      = inst.courses || [];
  const faculty      = inst.faculty || [];
  const testimonials = inst.testimonials || [];
  const gallery      = inst.gallery || [];
  const socialLinks  = inst.socialLinks || {};

  const bannerUrl = getImageUrl(inst.bannerImage)
    || 'https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1600&auto=format&fit=crop';
  const logoUrl = getImageUrl(inst.logo);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── Hero ── */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: 260 }}>
        <img
          src={bannerUrl}
          alt="banner"
          className="absolute inset-0 w-full h-full object-cover object-top"
          loading="eager"
        />
        {/* single simple gradient overlay — no mix-blend */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.35) 60%, transparent 100%)' }} />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 pt-24 flex flex-col sm:flex-row gap-5 items-center sm:items-end">
          {/* Logo */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-white p-1 shadow-md flex-shrink-0 border border-white/30">
            <div className="w-full h-full rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
              {logoUrl
                ? <img src={logoUrl} alt={inst.name} className="w-full h-full object-cover" />
                : <span className="text-3xl font-black text-indigo-600">{inst.name?.charAt(0)}</span>}
            </div>
          </div>

          {/* Name + meta */}
          <div className="flex-1 text-center sm:text-left">
            {inst.isFeatured && (
              <span className="inline-block mb-2 px-2 py-0.5 bg-amber-400 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                🏆 Featured
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-1 leading-tight">
              {inst.name}
            </h1>
            {inst.tagline && (
              <p className="text-slate-300 text-sm sm:text-base mb-3 line-clamp-2">{inst.tagline}</p>
            )}
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 text-xs text-white/80">
              {(inst.city || inst.state) && (
                <span className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-lg">
                  <MapPin size={12} /> {[inst.city, inst.state].filter(Boolean).join(', ')}
                </span>
              )}
              {inst.foundedYear > 0 && (
                <span className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-lg">
                  <Calendar size={12} /> Est. {inst.foundedYear}
                </span>
              )}
              {inst.totalStudents > 0 && (
                <span className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-lg">
                  <Users size={12} /> {inst.totalStudents.toLocaleString()}+ Students
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats bar ── */}
      {achievements.length > 0 && (
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap justify-center gap-8">
            {achievements.map((a, i) => (
              <div key={i} className="text-center">
                <div className="text-xl font-black text-indigo-600">{a.value}</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">{a.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

        {/* ── Main column ── */}
        <div className="xl:col-span-2 flex flex-col gap-6">

          {/* About */}
          <Card>
            <SectionTitle icon={BookOpen} color="text-indigo-600">About {inst.name}</SectionTitle>
            {inst.landingBio || inst.description ? (
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                {inst.landingBio || inst.description}
              </p>
            ) : (
              <p className="text-slate-400 text-sm text-center py-6">No description available.</p>
            )}
          </Card>

          {/* Courses */}
          {courses.length > 0 && (
            <Card>
              <SectionTitle icon={Award} color="text-emerald-600">Courses</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {courses.map((c) => (
                  <div key={c.id || c.title} className="border border-slate-200 rounded-xl overflow-hidden hover:border-indigo-300 transition-colors">
                    {c.thumbnail ? (
                      <img src={c.thumbnail} alt={c.title} className="w-full h-36 object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-36 bg-slate-100 flex items-center justify-center text-slate-300">
                        <BookOpen size={40} strokeWidth={1} />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-slate-800 text-sm mb-1 line-clamp-2">{c.title || c.name}</h3>
                      {c.description && <p className="text-xs text-slate-500 line-clamp-2 mb-3">{c.description}</p>}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-indigo-600">
                          {c.price > 0 ? `₹${parseFloat(c.price).toLocaleString()}` : 'Free'}
                        </span>
                        <Link
                          to={`/register${inst.inviteCode ? `?code=${inst.inviteCode}` : ''}`}
                          className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
                        >
                          Enroll
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Free Tests */}
          {publicTests.length > 0 && (
            <Card>
              <SectionTitle icon={Zap} color="text-amber-500">Free Mock Tests</SectionTitle>
              <div className="flex flex-col divide-y divide-slate-100">
                {publicTests.map(t => (
                  <div key={t.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                      <BookOpen size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-800 truncate">{t.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {t.totalQuestions} Qs · {t.duration} min · {t.category}
                      </p>
                    </div>
                    <Link
                      to={`/test/${t.id}/lobby`}
                      className="flex-shrink-0 text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      Start
                    </Link>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Faculty */}
          {faculty.length > 0 && (
            <Card>
              <SectionTitle icon={Users} color="text-purple-600">Faculty</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {faculty.map((f, i) => (
                  <div key={i} className="text-center">
                    <div className="w-16 h-16 rounded-full mx-auto mb-2 overflow-hidden bg-slate-100 border-2 border-slate-200">
                      {f.photo
                        ? <img src={getImageUrl(f.photo)} alt={f.name} className="w-full h-full object-cover" loading="lazy" />
                        : <div className="w-full h-full flex items-center justify-center text-xl font-bold text-slate-400">{f.name?.charAt(0)}</div>}
                    </div>
                    <p className="font-semibold text-slate-800 text-xs">{f.name}</p>
                    {f.designation && <p className="text-[10px] text-slate-500 mt-0.5">{f.designation}</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Testimonials */}
          {testimonials.length > 0 && (
            <Card id="reviews-section">
              <SectionTitle icon={Star} color="text-pink-500">Student Reviews</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {testimonials.map((t, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex text-amber-400 mb-2 gap-0.5">
                      {[1,2,3,4,5].map(n => <Star key={n} size={12} fill="currentColor" />)}
                    </div>
                    <p className="text-sm text-slate-600 italic mb-3">"{t.text}"</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {t.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{t.name}</p>
                        {t.score && <p className="text-[10px] text-emerald-600">{t.score}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Gallery */}
          {gallery.length > 0 && (
            <Card>
              <SectionTitle icon={ImageIcon} color="text-blue-600">Gallery</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {gallery.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setLightbox(img)}
                    className="aspect-square rounded-xl overflow-hidden cursor-pointer border border-slate-200 hover:border-indigo-300 transition-colors"
                  >
                    {img.url?.match(/\.(mp4|webm|ogg|mov|mkv)$/i)
                      ? <video src={getImageUrl(img.url)} muted playsInline className="w-full h-full object-cover" />
                      : <img src={getImageUrl(img.url)} alt={img.caption || ''} className="w-full h-full object-cover" loading="lazy" />}
                  </div>
                ))}
              </div>
            </Card>
          )}

        </div>

        {/* ── Sidebar ── */}
        <div className="flex flex-col gap-4">

          {/* Enroll CTA */}
          <div className="bg-indigo-600 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-1.5 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">Admissions Open</span>
            </div>
            <h3 className="text-xl font-black mb-2">Join {inst.name}</h3>
            <p className="text-indigo-200 text-sm mb-5">Access premium test series, expert faculty, and structured learning.</p>
            <Link
              to={`/register${inst.inviteCode ? `?code=${inst.inviteCode}` : ''}`}
              className="block w-full py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl font-bold text-center text-sm transition-colors mb-2"
            >
              Join for Free
            </Link>
            <Link
              to="/login"
              className="block w-full py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-semibold text-center text-sm transition-colors border border-indigo-500"
            >
              Already enrolled? Login
            </Link>
          </div>

          {/* Contact */}
          {(inst.contactAddress || inst.address || inst.phone || inst.mobile || inst.email || inst.website) && (
            <Card>
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <MapPin size={16} className="text-indigo-500" /> Contact
              </h3>
              <div className="flex flex-col gap-3 text-sm">
                {(inst.contactAddress || inst.address) && (
                  <div className="flex gap-3">
                    <MapPin size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600">{inst.contactAddress || inst.address}</span>
                  </div>
                )}
                {(inst.phone || inst.mobile) && (
                  <div className="flex gap-3">
                    <Phone size={15} className="text-slate-400 flex-shrink-0" />
                    <span className="text-slate-700 font-semibold">{inst.phone || inst.mobile}</span>
                  </div>
                )}
                {inst.email && (
                  <div className="flex gap-3">
                    <Mail size={15} className="text-slate-400 flex-shrink-0" />
                    <a href={`mailto:${inst.email}`} className="text-indigo-600 hover:underline">{inst.email}</a>
                  </div>
                )}
                {inst.website && (
                  <div className="flex gap-3">
                    <Globe size={15} className="text-slate-400 flex-shrink-0" />
                    <a href={inst.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                      Website <ExternalLink size={11} />
                    </a>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Rating snapshot */}
          {testimonials.length > 0 && (
            <Card className="cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 flex items-center gap-1.5"><Star size={15} className="text-amber-400" fill="currentColor" /> Reviews</h3>
                <ChevronRight size={15} className="text-slate-400" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl font-black text-slate-900">4.9</span>
                <div className="flex text-amber-400 gap-0.5">
                  {[1,2,3,4,5].map(n => <Star key={n} size={13} fill="currentColor" />)}
                </div>
              </div>
              <p className="text-xs text-slate-500 italic line-clamp-3">"{testimonials[0]?.text}"</p>
              <p className="text-xs font-bold text-slate-700 mt-1">— {testimonials[0]?.name}</p>
            </Card>
          )}

          {/* Social */}
          {Object.values(socialLinks).some(v => v) && (
            <Card>
              <h3 className="font-bold text-slate-700 mb-3 text-xs uppercase tracking-widest">Follow Us</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(socialLinks).map(([p, url]) => (
                  <SocialBtn key={p} platform={p} url={url} />
                ))}
              </div>
            </Card>
          )}

        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            onClick={() => setLightbox(null)}
          >
            <X size={22} />
          </button>
          <div onClick={e => e.stopPropagation()} className="max-w-4xl w-full">
            {lightbox.url?.match(/\.(mp4|webm|ogg|mov|mkv)$/i)
              ? <video src={getImageUrl(lightbox.url)} controls autoPlay className="max-h-[80vh] w-full rounded-xl object-contain" />
              : <img src={getImageUrl(lightbox.url)} alt={lightbox.caption || ''} className="max-h-[80vh] w-full rounded-xl object-contain" />}
            {lightbox.caption && <p className="text-white text-sm mt-3 text-center">{lightbox.caption}</p>}
          </div>
        </div>
      )}

    </div>
  );
}
