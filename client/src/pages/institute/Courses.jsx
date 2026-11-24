import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, BookOpen, Layers, Video, FileText, 
  MoreVertical, Edit2, Trash2, ExternalLink, Users,
  ChevronRight, PlayCircle, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const { user } = useAuthStore();
  const isInstructor = user?.role === 'instructor';
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    instructorName: '',
    price: 0,
    thumbnail: ''
  });

  const fetchCourses = async () => {
    try {
      const res = await api.get('/lms/courses');
      setCourses(res.data.data);
    } catch (err) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    const handleClickOutside = () => setMenuOpenId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/lms/courses', form);
      toast.success('Course created successfully');
      setShowCreateModal(false);
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create course');
    }
  };

  const handleTogglePublish = async (course) => {
    try {
      await api.put(`/lms/courses/${course.id}`, { ...course, isPublished: !course.isPublished });
      toast.success(`Course ${!course.isPublished ? 'published' : 'unpublished'}`);
      fetchCourses();
    } catch (err) {
      toast.error('Failed to toggle course status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await api.delete(`/lms/courses/${id}`);
      toast.success('Course deleted successfully');
      fetchCourses();
    } catch (err) {
      toast.error('Failed to delete course');
    }
  };

  let filtered = courses.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (filterStatus === 'published') {
    filtered = filtered.filter(c => c.isPublished);
  } else if (filterStatus === 'draft') {
    filtered = filtered.filter(c => !c.isPublished);
  }

  filtered.sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return 0;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-primary-900 to-slate-900 rounded-[2rem] p-8 md:p-10 text-white shadow-2xl shadow-primary-900/20 relative overflow-hidden">
        {/* Abstract shapes for premium feel */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-primary-500/20 rounded-full blur-3xl translate-y-1/2"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
              <span className="text-2xl">🎓</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-0">
              {isInstructor ? 'My Assigned Courses' : 'Course Management'}
            </h1>
          </div>
          <p className="text-primary-100/70 font-medium text-lg max-w-xl md:pl-16">
            {isInstructor
              ? 'Manage your assigned courses — add content, lessons and track attendance.'
              : 'Design, organize, and publish your world-class educational content.'}
          </p>
        </div>
        {!isInstructor && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="relative z-10 bg-white text-slate-900 hover:bg-primary-50 font-bold px-6 py-3.5 rounded-xl transition-all duration-300 shadow-[0_8px_30px_rgba(255,255,255,0.15)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.25)] hover:-translate-y-1 flex items-center gap-3 group whitespace-nowrap"
          >
            <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Plus size={18} strokeWidth={3} />
            </div>
            Create New Course
          </button>
        )}
      </div>

      {/* Glassmorphic Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 glass p-4 rounded-2xl shadow-xl shadow-slate-200/40 relative z-20">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by course title or category..."
            className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 focus:border-primary-500 rounded-xl pl-12 pr-4 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all duration-300 text-sm font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="sm:w-48 bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 focus:border-primary-500 rounded-xl px-4 py-3.5 text-slate-700 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all duration-300 cursor-pointer appearance-none"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em' }}
        >
          <option value="all">📊 All Status</option>
          <option value="published">✅ Published</option>
          <option value="draft">📝 Drafts</option>
        </select>
        <select 
          className="sm:w-56 bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 focus:border-primary-500 rounded-xl px-4 py-3.5 text-slate-700 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all duration-300 cursor-pointer appearance-none"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em' }}
        >
          <option value="newest">✨ Newest First</option>
          <option value="title">🅰️ Title (A-Z)</option>
          <option value="price-desc">💰 Price (High to Low)</option>
          <option value="price-asc">🏷️ Price (Low to High)</option>
        </select>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm flex flex-col gap-4">
               <div className="skeleton h-48 rounded-2xl w-full" />
               <div className="skeleton h-6 w-3/4 rounded-lg" />
               <div className="skeleton h-4 w-full rounded-lg" />
               <div className="skeleton h-4 w-5/6 rounded-lg" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass text-center py-24 rounded-[2rem] border border-slate-200/60 shadow-xl shadow-slate-200/20 relative overflow-hidden mt-8">
          <div className="absolute inset-0 bg-gradient-to-b from-primary-50/30 to-transparent pointer-events-none"></div>
          <div className="relative z-10">
            <div className="w-24 h-24 bg-gradient-to-br from-white to-primary-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary-500/10 border border-white">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center">
                <BookOpen size={32} className="text-primary-600" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-slate-800 mb-3">No Courses Found</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-8 text-lg">
              {isInstructor
                ? 'No courses have been assigned to you yet. Contact your institute admin.'
                : 'Start building your educational library by creating your very first professional course.'}
            </p>
            {!isInstructor && (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="btn-primary px-8 py-3.5 text-lg shadow-[0_8px_20px_rgba(var(--color-primary-500),0.3)] hover:shadow-[0_12px_25px_rgba(var(--color-primary-500),0.4)]"
              >
                Create Your First Course
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map(course => (
            <div key={course.id} className="group bg-white rounded-3xl border border-slate-100/80 shadow-md hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:border-primary-200 transition-all duration-500 flex flex-col overflow-hidden hover:-translate-y-2 relative">
              <div className="aspect-[16/10] relative overflow-hidden bg-slate-50">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                ) : (
                  <div className="w-full h-full flex flex-col gap-2 items-center justify-center text-slate-300 bg-gradient-to-br from-slate-50 to-slate-100">
                    <Video size={48} strokeWidth={1} />
                    <span className="text-xs font-semibold uppercase tracking-wider">No Thumbnail</span>
                  </div>
                )}
                
                <div className="absolute top-4 left-4 flex flex-col items-start gap-2 z-10">
                  <span className="px-3 py-1.5 bg-white/95 backdrop-blur-md text-slate-800 text-[10px] uppercase font-black tracking-widest rounded-lg shadow-sm border border-white/20">
                    {course.category || 'General'}
                  </span>
                  <span className={`px-3 py-1.5 backdrop-blur-md text-[10px] uppercase font-black tracking-widest rounded-lg shadow-sm border border-white/20 ${course.isPublished ? 'bg-emerald-500/95 text-white' : 'bg-amber-500/95 text-white'}`}>
                    {course.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                 <Link to={`/${isInstructor ? 'instructor' : 'institute'}/courses/${course.id}`} className="w-full py-3.5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl">
                   {isInstructor ? 'Open Course' : 'Manage Course Content'} <ChevronRight size={16} />
                 </Link>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col relative z-20 bg-white">
                <div className="flex justify-between items-start mb-2 relative">
                  <Link to={`/${isInstructor ? 'instructor' : 'institute'}/courses/${course.id}`} className="flex-1 pr-4">
                    <h3 className="text-[1.15rem] font-extrabold text-slate-800 group-hover:text-primary-600 transition-colors line-clamp-2 leading-snug">{course.title}</h3>
                  </Link>
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                      onClick={() => setMenuOpenId(menuOpenId === course.id ? null : course.id)}
                    >
                      <MoreVertical size={18} />
                    </button>
                    {menuOpenId === course.id && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 py-1.5 z-50 animate-fade-in origin-top-right">
                        <button onClick={() => { handleTogglePublish(course); setMenuOpenId(null); }} className="w-full text-left px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                          {course.isPublished ? <><Clock size={16} className="text-amber-500"/> Unpublish</> : <><PlayCircle size={16} className="text-emerald-500"/> Publish</>}
                        </button>
                        {!isInstructor && (
                          <>
                            <hr className="my-1 border-slate-100" />
                            <button onClick={() => { handleDelete(course.id); setMenuOpenId(null); }} className="w-full text-left px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors">
                              <Trash2 size={16}/> Delete Course
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {course.instructorName && (
                   <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[8px] font-bold">
                         {course.instructorName.charAt(0).toUpperCase()}
                      </div>
                      {course.instructorName}
                   </div>
                )}
                
                <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-1 font-medium">{course.description || 'No description provided'}</p>

                <div className="flex items-center gap-4 text-[11px] text-slate-500 font-bold mb-6 pb-5 border-b border-slate-100/80">
                   <div className="flex items-center gap-1.5 bg-primary-50 px-2.5 py-1.5 rounded-lg text-primary-700"><Layers size={14} /> {course.modules?.length || 0} Modules</div>
                   <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1.5 rounded-lg text-emerald-700"><Video size={14} /> {course.allLessons?.length || 0} Lessons</div>
                   <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1.5 rounded-lg text-blue-700"><Users size={14} /> {course.batches?.length || 0} Batches</div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-0.5">Price</span>
                    <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600">
                      ₹{parseFloat(course.price).toLocaleString()}
                    </span>
                  </div>
                  <Link 
                    to={`/institute/courses/${course.id}`} 
                    className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-primary-50 hover:text-primary-600 transition-all border border-transparent hover:border-primary-100 hover:shadow-sm"
                  >
                    <Edit2 size={18} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Premium Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay backdrop-blur-md z-50">
          <div className="modal-content max-w-md w-full rounded-2xl border border-white/20 shadow-2xl overflow-hidden animate-slide-up !p-0">
            <div className="bg-gradient-to-r from-slate-900 via-primary-900 to-slate-900 p-5 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
               <h2 className="text-xl font-extrabold flex items-center gap-3 relative z-10">
                 <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
                    <Plus className="text-primary-100" size={20} strokeWidth={3} /> 
                 </div>
                 Create New Course
               </h2>
               <p className="text-primary-100/70 mt-2 text-xs relative z-10 font-medium pl-[52px]">Fill in the details below to launch your new program.</p>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4 bg-white max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Course Title <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-primary-500 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-medium text-sm"
                  placeholder="e.g., Complete Mathematics for SSC CGL"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
                <textarea
                  className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-primary-500 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-medium min-h-[80px] resize-none text-sm"
                  placeholder="Write a brief overview of what students will learn..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Category</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-primary-500 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-medium text-sm"
                  placeholder="e.g., SSC, UPSC"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Instructor Name (Opt)</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-primary-500 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-medium text-sm"
                    placeholder="e.g., Prof. Sarah"
                    value={form.instructorName || ''}
                    onChange={(e) => setForm({ ...form, instructorName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Price (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-primary-500 rounded-lg pl-8 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-bold text-sm"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Thumbnail URL <span className="text-slate-400 font-normal ml-1">(Optional)</span></label>
                <input
                  type="text"
                  className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-primary-500 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-medium text-sm"
                  placeholder="https://example.com/image.jpg"
                  value={form.thumbnail}
                  onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-all duration-300">Cancel</button>
                <button type="submit" className="px-5 py-2 text-sm bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-lg shadow-md transition-all duration-300">Launch Course</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
