import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, Clock, Users, PlayCircle, Tag, Star, ChevronDown, CheckCircle,
  FileText, Calendar, Share2, ArrowLeft, Shield, Award, MapPin, Video,
  Target, GraduationCap, Zap, HelpCircle, MessageCircle
} from 'lucide-react';
import api from '../lib/api';
import CourseReviews from '../components/CourseReviews';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const getImageUrl = (path) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_BASE}/uploads/${path}`;
};

export default function PublicCoursePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedModules, setExpandedModules] = useState({});
  const [reviewStats, setReviewStats] = useState(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await api.get(`/public/courses/${slug}`);
        setCourse(res.data.data);
        // auto-expand first module
        if (res.data.data?.modules?.length > 0) {
          setExpandedModules({ [res.data.data.modules[0].id]: true });
        }
        // fetch review stats
        try {
          const rRes = await api.get(`/reviews/course/${res.data.data.id}?limit=1`);
          setReviewStats(rRes.data.stats);
        } catch { }
      } catch (err) {
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [slug]);

  const toggleModule = (id) => {
    setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading course details...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 p-8 text-center">
        <div className="text-6xl mb-2">📚</div>
        <h2 className="text-3xl font-extrabold text-slate-900">Course Not Found</h2>
        <p className="text-slate-500 max-w-sm mb-6">The course you are looking for is unavailable or has been removed.</p>
        <button onClick={() => navigate(-1)} className="btn-primary">Go Back</button>
      </div>
    );
  }

  const avgRating = reviewStats?.avgRating || 0;
  const totalReviews = reviewStats?.totalCount || 0;
  const thumbnailUrl = getImageUrl(course.thumbnail) || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1000';
  const instructorAvatar = getImageUrl(course.assignedInstructor?.avatar) || getImageUrl(course.creator?.avatar);
  const instituteLogo = getImageUrl(course.institute?.logo);

  const totalLessons = course.modules?.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0) || 0;
  const enrollUrl = `/register${course.institute?.inviteCode ? `?code=${course.institute.inviteCode}` : ''}`;

  const parseJsonArray = (val) => {
    if (!val) return [];
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch (e) { return []; }
    }
    return Array.isArray(val) ? val : [];
  };

  const salientFeatures = parseJsonArray(course.salientFeatures);
  const productHighlights = parseJsonArray(course.productHighlights);
  const examsCovered = parseJsonArray(course.examsCovered);
  const faqs = parseJsonArray(course.faqs);

  return (
    <div className="min-h-screen bg-gray-50 pb-20" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Navbar handled by PublicLayout */}

      {/* Top Split Section */}
      <section className="bg-white border-b border-gray-200 shadow-sm relative pt-12 pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mb-6">
            <Link to="/" className="hover:text-indigo-600 transition-colors">Home</Link>
            <span>/</span>
            <Link to="/courses" className="hover:text-indigo-600 transition-colors">Courses</Link>
            {course.category && (
              <>
                <span>/</span>
                <span className="text-gray-900 font-semibold">{course.category}</span>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

            {/* Left Column: Thumbnail */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-lg border border-gray-200 relative group bg-gray-900">
                <img src={thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/40 transition-colors cursor-pointer">
                  <div className="w-16 h-16 bg-white/95 backdrop-blur-md rounded-full text-indigo-600 flex items-center justify-center shadow-xl hover:scale-110 hover:bg-white transition-all transform z-10">
                    <PlayCircle size={32} className="ml-1" fill="currentColor" />
                  </div>
                </div>
              </div>
              <div className="flex justify-center mt-2 border border-gray-200 rounded-xl py-3 px-4 shadow-sm bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-gray-700 font-semibold text-sm gap-2">
                <Share2 size={16} /> Share this course
              </div>
            </div>

            {/* Right Column: Title, Details, Action */}
            <div className="lg:col-span-7 flex flex-col pt-2">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight mb-4 tracking-tight">
                {course.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mb-6">
                <span className="flex items-center gap-1 text-amber-600 text-[13px] font-semibold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                  <Star size={14} fill="currentColor" className="text-amber-500" />
                  {avgRating > 0 ? `${avgRating.toFixed(1)} (${totalReviews} Review${totalReviews !== 1 ? 's' : ''})` : 'No Reviews Yet'}
                </span>
                <div className="text-[13px] font-semibold text-gray-600 flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                  <Video size={14} className="text-gray-500" /> Online Live & Recorded
                </div>
              </div>

              {/* Course Features List */}
              <ul className="space-y-3 mb-8">
                {course.courseDuration && (
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-emerald-500 mt-0.5 flex-shrink-0" size={16} />
                    <span className="text-gray-800 text-sm font-medium">Valid for <span className="font-semibold">{course.courseDuration}</span></span>
                  </li>
                )}
                {course.seats > 0 && (
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-emerald-500 mt-0.5 flex-shrink-0" size={16} />
                    <span className="text-gray-800 text-sm font-medium">Limited Batch Size: <span className="font-semibold">{course.seats} Seats</span></span>
                  </li>
                )}
                {course.liveClasses > 0 && (
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-emerald-500 mt-0.5 flex-shrink-0" size={16} />
                    <span className="text-gray-800 text-sm font-medium"><span className="font-semibold">{course.liveClasses}</span> Online Live Classes</span>
                  </li>
                )}
                {course.recordedClasses > 0 && (
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-emerald-500 mt-0.5 flex-shrink-0" size={16} />
                    <span className="text-gray-800 text-sm font-medium"><span className="font-semibold">{course.recordedClasses}</span> Recorded Videos</span>
                  </li>
                )}
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-emerald-500 mt-0.5 flex-shrink-0" size={16} />
                  <span className="text-gray-800 text-sm font-medium">Access to <span className="font-semibold">Top Expert Faculties</span> of India</span>
                </li>
              </ul>

              {/* Call to Action */}
              <div className="mt-auto max-w-sm pt-4">
                <Link to={enrollUrl} className="flex items-center justify-center w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all text-[15px]">
                  Enroll Now
                </Link>
                <p className="text-[11px] text-center text-gray-500 mt-2 font-medium">100% Secure Payment • Instant Access</p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Main Content (Tabs and Details) */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 mt-12 relative z-20 grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* Main Tab View */}
        <div className="lg:col-span-8">

          {/* Tabs Navigation */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 flex overflow-x-auto hide-scrollbar mb-8 sticky top-4 z-30">
            {['overview', 'curriculum', 'instructor', 'reviews'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[120px] text-center px-4 py-3 rounded-xl font-semibold text-sm capitalize transition-all duration-300 ${activeTab === tab ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
                {tab === 'reviews'
                  ? `Reviews${totalReviews > 0 ? ` (${totalReviews})` : ''}`
                  : tab === 'curriculum' ? 'Study Plan' : tab}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200/60 animate-fade-in space-y-12">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2"><BookOpen className="text-indigo-500" /> Description</h2>
                <div className="text-gray-700 leading-loose whitespace-pre-wrap text-sm font-normal">
                  {course.description}
                </div>
              </div>

              {salientFeatures.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2"><Zap className="text-amber-500" /> Salient Features</h2>
                  <ul className="grid sm:grid-cols-2 gap-4">
                    {salientFeatures.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <CheckCircle className="text-emerald-500 flex-shrink-0 mt-0.5" size={17} />
                        <span className="text-gray-800 text-sm font-medium leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {productHighlights.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2"><Award className="text-indigo-500" /> Package Includes</h2>
                  <div className="flex flex-col gap-3">
                    {productHighlights.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0"></div>
                        <span className="text-gray-800 text-sm font-medium">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {examsCovered.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2"><Target className="text-rose-500" /> Subjects / Exams Covered</h2>
                  <div className="flex flex-wrap gap-2">
                    {examsCovered.map((exam, idx) => (
                      <span key={idx} className="px-4 py-2 bg-rose-50 text-rose-700 font-semibold text-sm rounded-xl border border-rose-100">
                        {exam}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {faqs.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2"><HelpCircle className="text-blue-500" /> Frequently Asked Questions</h2>
                  <div className="space-y-4">
                    {faqs.map((faq, idx) => (
                      <div key={idx} className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-start gap-2 text-sm">
                          <span className="text-blue-500 font-bold">Q.</span> {faq.question}
                        </h4>
                        <p className="text-gray-600 pl-6 text-sm leading-relaxed">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Study Plan Tab */}
          {activeTab === 'curriculum' && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200/60 animate-fade-in">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-gray-900">Study Plan</h2>
                <div className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                  {course.modules?.length || 0} Modules • {totalLessons} Lessons
                </div>
              </div>

              {course.modules?.length > 0 ? (
                <div className="space-y-4">
                  {course.modules.map((mod, i) => (
                    <div key={mod.id} className="border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:border-indigo-200">
                      <button onClick={() => toggleModule(mod.id)}
                        className={`w-full flex items-center justify-between p-5 text-left transition-colors ${expandedModules[mod.id] ? 'bg-indigo-50/50' : 'bg-white hover:bg-gray-50'}`}>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            <span className="text-indigo-400 mr-2">{"0" + (i + 1)}</span>
                            {mod.title}
                          </h3>
                          <div className="text-xs font-medium text-gray-500 mt-1 ml-6">
                            {mod.lessons?.length || 0} Lessons
                          </div>
                        </div>
                        <ChevronDown size={20} className={`text-gray-400 transition-transform duration-300 ${expandedModules[mod.id] ? 'rotate-180 text-indigo-500' : ''}`} />
                      </button>

                      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedModules[mod.id] ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-2 border-t border-gray-100 bg-white">
                          {mod.lessons?.length > 0 ? (
                            mod.lessons.map((lesson) => (
                              <div key={lesson.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${lesson.isFree ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 text-indigo-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                                    {lesson.type === 'video' ? <PlayCircle size={16} /> : <FileText size={16} />}
                                  </div>
                                  <span className="text-sm font-medium text-gray-800">{lesson.title}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  {lesson.isFree && <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">Preview</span>}
                                  <span className="text-xs font-medium text-gray-400">{lesson.duration || 0} min</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-sm text-gray-400 italic">No lessons added to this module yet.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 flex flex-col items-center border-t border-gray-100">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"><BookOpen size={30} className="text-gray-300" /></div>
                  <p className="text-gray-500 font-medium">The study plan is currently being updated.</p>
                </div>
              )}
            </div>
          )}

          {/* Instructor Tab */}
          {activeTab === 'instructor' && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200/60 animate-fade-in space-y-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2"><GraduationCap className="text-indigo-500"/> Faculty Profile</h2>
                <div className="flex flex-col md:flex-row gap-6 items-start p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 border-2 border-indigo-50 overflow-hidden flex-shrink-0 shadow-sm">
                    {instructorAvatar ? <img src={instructorAvatar} alt="Instructor" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-indigo-600 text-3xl font-bold">{(course.instructorName || course.creator?.name || 'I').charAt(0)}</div>}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{course.instructorName || course.assignedInstructor?.name || course.creator?.name || 'Expert Instructor'}</h3>
                    <p className="text-indigo-600 font-semibold text-sm mb-4">Lead Instructor</p>
                    <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">
                      {course.instructorBio || 'An expert educator committed to providing top-quality learning materials. Passionate about empowering students to reach their full potential through structured and engaging courses.'}
                    </p>
                  </div>
                </div>
              </div>

              {course.institute && (
                <>
                  <div className="w-full h-px bg-gray-100"></div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Offered By</h2>
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-start p-6 rounded-2xl border border-gray-100">
                      <div className="w-20 h-20 bg-white rounded-2xl p-1 shadow-sm border border-gray-200">
                        {instituteLogo ? <img src={instituteLogo} alt="Institute" className="w-full h-full object-contain rounded-xl" /> : <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 font-bold">{course.institute.name?.charAt(0)}</div>}
                      </div>
                      <div className="text-center md:text-left flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{course.institute.name}</h3>
                        <div className="flex items-center justify-center md:justify-start gap-1 text-sm font-medium text-gray-500 mb-3">
                          <MapPin size={14} /> {[course.institute.city, course.institute.state].filter(Boolean).join(', ') || 'Online'}
                        </div>
                        <Link to={`/i/${course.institute.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 border border-indigo-100 rounded-lg shadow-sm transition-all hover:shadow-md">
                          View Institute Profile
                        </Link>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="animate-fade-in bg-white rounded-3xl shadow-sm border border-gray-200/60 p-8">
              <CourseReviews courseId={course.id} currentUser={null} canReply={false} />
            </div>
          )}

        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 hidden lg:block">
          <div className="sticky top-28 bg-emerald-50 rounded-[2rem] border border-emerald-100 p-8 animate-slide-up shadow-sm">
            <Shield className="text-emerald-500 mb-4 flex-shrink-0" size={32} />
            <h3 className="font-bold text-gray-900 mb-2 text-xl">Premium Quality Guaranteed</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">Designed by industry top experts with curated materials to strictly ensure the best outcome.</p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-gray-800 text-sm font-medium"><CheckCircle size={16} className="text-emerald-500"/> Tested & Proven Methodology</li>
              <li className="flex items-center gap-3 text-gray-800 text-sm font-medium"><CheckCircle size={16} className="text-emerald-500"/> Extensive Support Provided</li>
              <li className="flex items-center gap-3 text-gray-800 text-sm font-medium"><CheckCircle size={16} className="text-emerald-500"/> Lifetime updates in validity period</li>
            </ul>
          </div>
        </div>

      </section>

    </div>
  );
}
