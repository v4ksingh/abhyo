import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Brain, ArrowRight, PlayCircle, Clock, Video, Star, ChevronRight, Play, Lock, CheckCircle, Menu, X } from 'lucide-react';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';

const navLinks = [
  { label: 'Exam Series', to: '/exam-series' },
  { label: 'Video Series', to: '/video-series' },
  { label: 'Live Tests', to: '/live-test' },
  { label: 'Pricing', to: '/plans' },
  { label: 'For Institutes', to: '/#institutes' },
  { label: 'Features', to: '/#features' },
];

const footerLinks = [
  { title: 'Platform', links: [{ label: 'Exam Series', to: '/exam-series' }, { label: 'Video Series', to: '/video-series' }, { label: 'Live Tests', to: '/live-test' }, { label: 'Pricing', to: '/plans' }, { label: 'For Institutes', to: '/#institutes' }] },
  { title: 'Exams', links: [{ label: 'UPSC', to: '#' }, { label: 'SSC', to: '#' }, { label: 'Banking', to: '#' }, { label: 'Railway', to: '#' }, { label: 'State PCS', to: '#' }] },
  { title: 'Company', links: [{ label: 'About Us', to: '#' }, { label: 'Blog', to: '#' }, { label: 'Contact', to: '#' }, { label: 'Privacy Policy', to: '#' }] },
];

function SectionCard({ title, children, id }) {
  return (
    <div id={id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-sm font-extrabold text-slate-900 mb-5 flex items-center gap-2 tracking-tight">{title}</h3>
      {children}
    </div>
  );
}

function VideoItem({ video, series, user, isAuthenticated, onWatch }) {
  const isPaid = !series?.isFree && series?.price > 0 && !video.isFree;
  const hasActiveSub = user?.studentSubscriptionStatus === 'active' && user?.studentSubscriptionEndDate && new Date(user.studentSubscriptionEndDate) > new Date();
  const isLocked = isPaid && !hasActiveSub && user?.role !== 'superadmin';

  return (
    <div className={`group flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white border rounded-xl p-4 transition-all cursor-pointer relative overflow-hidden ${isLocked ? 'border-indigo-100 hover:border-indigo-200 opacity-90' : 'border-slate-200 hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5'}`} onClick={() => onWatch(video, isLocked)}>
      {isLocked && <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl z-10">PREMIUM</div>}
      
      <div className={`w-full sm:w-32 h-20 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-100 relative overflow-hidden group-hover:scale-[1.02] transition-transform`}>
         <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-violet-500/10" />
         {isLocked ? <Lock className="w-6 h-6 text-slate-400" /> : <PlayCircle className="w-8 h-8 text-indigo-500 group-hover:text-indigo-600 transition-colors" />}
      </div>
      
      <div className="flex-1 min-w-0 py-1">
        <div className="flex items-center gap-2 mb-1.5">
           <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">L{video.order || 1}</span>
           {video.isFree && <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">FREE PREVIEW</span>}
        </div>
        <p className="font-bold text-slate-800 text-[14px] leading-snug group-hover:text-indigo-600 transition-colors mb-1">{video.title}</p>
        <div className="flex gap-3 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {video.duration} mins</span>
          <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5" /> {video.videoType || 'HD Video'}</span>
        </div>
      </div>
      
      <div className="flex-shrink-0 pt-2 sm:pt-0 pb-1 sm:pb-0 w-full sm:w-auto">
        {isLocked ? (
           <span className="inline-flex w-full sm:w-auto justify-center items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700 hover:bg-amber-100 text-xs font-bold rounded-lg transition-colors">
              <Lock className="w-3.5 h-3.5" /> Unlock
           </span>
        ) : (
           <span className="inline-flex w-full sm:w-auto justify-center items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white text-xs font-bold rounded-lg transition-all group-hover:shadow-md">
              <Play className="w-3.5 h-3.5" /> Watch Now
           </span>
        )}
      </div>
    </div>
  );
}

export default function VideoSeriesPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null); // Simple video modal player state
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    api.get(`/video-series/${slug}`)
      .then(r => setSeries(r.data.data))
      .catch(() => toast.error('Video series not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleWatch = (video, isLocked) => {
    if (isLocked) {
      if (!isAuthenticated) {
        toast('Please login to continue', { icon: '🔐' });
        navigate('/login');
        return;
      }
      toast('🔒 Premium Video — upgrade to unlock!', { icon: '⚡' });
      navigate('/student/subscription');
      return;
    }
    
    // Simulate setting up a player modal (In real life, map URL correctly if YouTube vs Custom)
    setPlayingVideo(video);
  };

  const getEmbedUrl = (url) => {
    if(!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
        return `https://www.youtube.com/embed/${url.split('youtu.be/')[1]}`
    }
    return url;
  }

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-4">
      <div className="w-10 h-10 rounded-full border-3 border-indigo-100 border-t-indigo-600 animate-spin" />
      <p className="text-sm text-slate-500 font-medium">Loading video series…</p>
    </div>
  );

  if (!series) return (
    <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-3">
      <div className="text-5xl">😕</div>
      <p className="font-bold text-slate-800 text-base">Video series not found</p>
      <Link to="/video-series" className="text-indigo-600 font-semibold text-sm hover:underline">← Explore All Series</Link>
    </div>
  );

  const totalDuration = series.videos?.reduce((acc, v) => acc + (v.duration || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans overflow-x-hidden">
      
      {/* ── NAVBAR ──────────────────────────────────────────── */}
      {/* Nav is now handled by PublicLayout */}

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-slate-900 pt-32 pb-16 px-6 lg:px-12">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-violet-900 opacity-90" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[120px] opacity-20 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-2 text-xs text-indigo-200 font-medium mb-6">
             <Link to="/" className="hover:text-white transition-colors">Home</Link> <ChevronRight className="w-3 h-3" />
             <Link to="/video-series" className="hover:text-white transition-colors">Video Series</Link> <ChevronRight className="w-3 h-3" />
             <span className="truncate max-w-[200px]">{series.title}</span>
          </div>

          <div className="grid lg:grid-cols-[1fr_350px] gap-12 items-center">
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                 <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 uppercase tracking-wider">{series.category || 'General'}</span>
                 {series.isFeatured && <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 uppercase tracking-wider">★ Featured</span>}
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight mb-4">{series.title}</h1>
              <p className="text-indigo-100/70 text-base leading-relaxed mb-8 max-w-2xl">
                 {series.description ? series.description.slice(0, 150) + '...' : 'Master this topic with comprehensive high-definition video lessons.'}
              </p>
              
              <div className="flex flex-wrap gap-4 text-sm text-indigo-100 font-semibold mb-8">
                 <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                   <Video className="w-4 h-4 text-indigo-400" /> {series.videos?.length || 0} Lessons
                 </div>
                 <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                   <Clock className="w-4 h-4 text-amber-400" /> {totalDuration} Mins Total
                 </div>
              </div>

              <div className="flex items-center gap-4">
                 <a href="#lessons" className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-indigo-500/30 transition-all">
                    Start Learning
                 </a>
                 <div className="text-2xl font-black text-white ml-2">
                    {series.isFree ? 'Free Access' : `₹${series.price}`}
                 </div>
              </div>
            </div>
            
            {/* Visual preview card */}
            <div className="hidden lg:block relative">
               <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-3xl blur-2xl opacity-30 transform translate-y-4" />
               <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-2 rounded-3xl relative">
                  <div className="bg-slate-800 rounded-2xl aspect-video w-full flex items-center justify-center relative overflow-hidden group">
                     {series.thumbnail ? (
                        <img src={series.thumbnail} alt="series cover" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                     ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/50 to-violet-900/50" />
                     )}
                     <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center z-10 group-hover:scale-110 transition-transform cursor-pointer shadow-xl">
                        <Play className="w-6 h-6 text-white ml-1" />
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 lg:px-12 py-12">
         {/* Description */}
         {series.description && (
            <div className="mb-12">
               <h2 className="text-2xl font-black text-slate-900 mb-4">About this Series</h2>
               <div className={`prose max-w-none text-slate-600 !leading-loose relative ${!showFullDesc ? 'max-h-32 overflow-hidden' : ''}`}>
                  <p>{series.description}</p>
                  {!showFullDesc && <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />}
               </div>
               {series.description.length > 200 && (
                 <button onClick={() => setShowFullDesc(!showFullDesc)} className="text-indigo-600 font-extrabold text-sm mt-2 hover:underline">
                    {showFullDesc ? 'Read less' : 'Read full description'}
                 </button>
               )}
            </div>
         )}
         
         {/* Course Curriculum / Videos */}
         <div id="lessons">
           <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <Video className="text-indigo-600" /> Series Content
           </h2>
           
           <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
                 <p className="font-bold text-slate-600 text-sm">{series.videos?.length || 0} Lessons</p>
                 <p className="font-bold text-slate-600 text-sm">{totalDuration} min total length</p>
              </div>
              
              {series.videos?.length > 0 ? (
                 <div className="flex flex-col gap-3">
                    {series.videos.map(v => (
                       <VideoItem key={v.id} video={v} series={series} user={user} isAuthenticated={isAuthenticated} onWatch={handleWatch} />
                    ))}
                 </div>
              ) : (
                 <p className="text-slate-500 text-center py-6">Videos are being added to this series soon!</p>
              )}
           </div>
         </div>
      </div>

      {/* Player Modal */}
      {playingVideo && (
         <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-5xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative">
               <button onClick={() => setPlayingVideo(null)} className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors">
                 ✕ 
               </button>
               <div className="aspect-video bg-black w-full">
                 {getEmbedUrl(playingVideo.videoUrl) ? (
                   <iframe 
                     src={getEmbedUrl(playingVideo.videoUrl)} 
                     className="w-full h-full"
                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                     allowFullScreen
                   />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-slate-500">
                     Invalid Video URL
                   </div>
                 )}
               </div>
               <div className="p-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{playingVideo.title}</h3>
                  <p className="text-slate-400 text-sm">Series: {series.title} • {playingVideo.duration} mins</p>
               </div>
            </div>
         </div>
      )}

      {/* FOOTER */}
      {/* Footer is now handled by PublicLayout */}
    </div>
  );
}
