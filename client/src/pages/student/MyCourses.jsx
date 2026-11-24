import React, { useState, useEffect } from 'react';
import { BookOpen, Video, ChevronRight, PlayCircle, Layers, CheckCircle2, Clock, BarChart2, MessageSquare, TrendingUp } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

export default function MyCourses() {
  const [activeTab, setActiveTab] = useState('my-courses');
  const [courses, setCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [enrolledRes, availableRes] = await Promise.all([
        api.get('/student/courses'),
        api.get('/student/courses/available')
      ]);
      setCourses(enrolledRes.data.data || []);
      // Filter out already enrolled courses from available courses if they are mixed
      const allAvailable = availableRes.data.data || [];
      setAvailableCourses(allAvailable.filter(c => c.enrollmentStatus !== 'enrolled'));
    } catch (err) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRequestEnroll = async (courseId) => {
    try {
      await api.post(`/student/courses/${courseId}/request`);
      toast.success('Enrollment request sent successfully!');
      fetchData(); // refresh list
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to request enrollment');
    }
  };

  // Compute analytics per course
  const withStats = courses.map(course => {
    const allLessons = course.modules?.flatMap(m => [
      ...(m.lessons || []),
      ...(m.moduleQuizzes || []).map(q => ({ ...q, isQuiz: true })),
      ...(m.quizzes || []).map(q => ({ ...q, isMockTest: true }))
    ]) || [];
    
    const completed = allLessons.filter(l => {
      if (l.isMockTest) {
        return l.results?.some(r => r.status === 'completed' || r.status === 'auto-submitted');
      }
      if (l.isQuiz) {
        return l.attempts?.some(a => a.completedAt);
      }
      return l.progressRecords?.length > 0;
    }).length;
    
    const standardLessons = allLessons.filter(l => !l.isQuiz && !l.isMockTest);
    const totalDuration = standardLessons.reduce((s, l) => s + (parseInt(l.duration) || 0), 0);
    const progress = allLessons.length ? Math.round((completed / allLessons.length) * 100) : 0;
    return { ...course, allLessons, completed, totalDuration, progress };
  });

  // Summary stats
  const totalCourses = withStats.length;
  const completedCourses = withStats.filter(c => c.progress === 100).length;
  const inProgress = withStats.filter(c => c.progress > 0 && c.progress < 100).length;
  const totalLessonsCompleted = withStats.reduce((s, c) => s + c.completed, 0);
  const totalLessons = withStats.reduce((s, c) => s + c.allLessons.length, 0);
  const totalHours = Math.round(withStats.reduce((s, c) => s + c.totalDuration, 0) / 60);
  const overallProgress = totalLessons ? Math.round((totalLessonsCompleted / totalLessons) * 100) : 0;

  if (loading) return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-72 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-header">📚 Courses</h1>
          <p className="section-subheader">Track your learning progress or discover new courses</p>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('my-courses')}
            className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'my-courses' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            My Courses
          </button>
          <button
            onClick={() => setActiveTab('available-courses')}
            className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'available-courses' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Available Courses
          </button>
        </div>
      </div>

      {activeTab === 'my-courses' && (
        <>
          {courses.length > 0 && (
        <>
          {/* ── Analytics Summary ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: BookOpen, label: 'Enrolled', value: totalCourses, color: 'text-primary-500', bg: 'bg-primary-50 border-primary-100' },
              { icon: CheckCircle2, label: 'Completed', value: completedCourses, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-100' },
              { icon: TrendingUp, label: 'In Progress', value: inProgress, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-100' },
              { icon: Clock, label: 'Total Hours', value: `${totalHours}h`, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-100' },
            ].map((s, i) => (
              <div key={i} className={`flex items-center gap-3 p-4 rounded-2xl border ${s.bg}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                  <s.icon size={18} className={s.color} />
                </div>
                <div>
                  <p className="text-xl font-black text-slate-800">{s.value}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Overall Progress Bar */}
          <div className="card !py-4 flex items-center gap-5">
            <div className="flex-shrink-0">
              <BarChart2 size={22} className="text-primary-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1.5">
                <p className="text-sm font-black text-slate-800">Overall Learning Progress</p>
                <span className="text-sm font-black text-primary-600">{overallProgress}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-500 to-indigo-500 transition-all duration-700"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">{totalLessonsCompleted} of {totalLessons} lessons completed</p>
            </div>
          </div>
        </>
      )}

      {/* ── Course Cards ── */}
      {courses.length === 0 ? (
        <div className="card text-center py-24 border-dashed border-2">
          <BookOpen className="mx-auto text-slate-200 mb-4" size={56} strokeWidth={1} />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Courses Enrolled</h3>
          <p className="text-slate-500 max-w-xs mx-auto mb-6 text-sm">You haven't been assigned to any courses yet. Contact your institute administrator for access.</p>
          <Link to="/student/dashboard" className="btn-secondary px-8">Back to Dashboard</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {withStats.map(course => (
            <div
              key={course.id}
              onClick={() => navigate(`/student/courses/${course.id}`)}
              className="card group hover:border-primary-300 hover:shadow-xl transition-all duration-300 flex flex-col p-0 overflow-hidden cursor-pointer"
            >
              {/* Thumbnail */}
              <div className="relative overflow-hidden bg-slate-900" style={{ aspectRatio: '16/9' }}>
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700">
                    <Video size={40} strokeWidth={1} />
                  </div>
                )}
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/40 backdrop-blur-[1px]">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border border-white/30 text-white">
                    <PlayCircle size={26} fill="currentColor" />
                  </div>
                </div>
                {/* Progress badge */}
                {course.progress > 0 && (
                  <div className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[10px] font-black shadow-lg ${
                    course.progress === 100 ? 'bg-emerald-500 text-white' : 'bg-white/90 text-slate-800'
                  }`}>
                    {course.progress === 100 ? '✓ Done' : `${course.progress}%`}
                  </div>
                )}
                {/* Category badge */}
                <div className="absolute bottom-2.5 left-2.5">
                  <span className="text-[9px] font-black uppercase tracking-widest bg-black/60 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {course.category || 'Course'}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 mb-1">{course.title}</h3>
                  {course.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-1">{course.description}</p>
                  )}
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Progress</span>
                    <span className="text-[10px] font-black text-primary-500">{course.completed}/{course.allLessons.length}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${course.progress === 100 ? 'bg-emerald-500' : 'bg-primary-500'}`}
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                  <span className="flex items-center gap-1"><Layers size={11} className="text-indigo-400" />{course.modules?.length || 0} modules</span>
                  <span className="flex items-center gap-1"><Video size={11} className="text-primary-400" />{course.allLessons.length} lessons</span>
                  {course.totalDuration > 0 && (
                    <span className="flex items-center gap-1"><Clock size={11} className="text-amber-400" />{course.totalDuration}m</span>
                  )}
                </div>

                {/* CTA */}
                <button className={`mt-auto w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm ${
                  course.progress === 100
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 group-hover:bg-emerald-500 group-hover:text-white'
                    : course.progress > 0
                      ? 'bg-primary-600 text-white group-hover:bg-primary-700 shadow-primary-200'
                      : 'bg-slate-900 text-white group-hover:bg-primary-600'
                }`}>
                  {course.progress === 100 ? <><CheckCircle2 size={13} /> Review Course</> 
                   : course.progress > 0 ? <><PlayCircle size={13} /> Continue</> 
                   : <><PlayCircle size={13} /> Start Learning</>}
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </>
      )}

      {activeTab === 'available-courses' && (
        <>
          {availableCourses.length === 0 ? (
            <div className="card text-center py-24 border-dashed border-2">
              <BookOpen className="mx-auto text-slate-200 mb-4" size={56} strokeWidth={1} />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Courses Available</h3>
              <p className="text-slate-500 max-w-xs mx-auto mb-6 text-sm">There are currently no new courses available for enrollment.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {availableCourses.map(course => (
                <div key={course.id} className="card group hover:border-primary-300 hover:shadow-xl transition-all duration-300 flex flex-col p-0 overflow-hidden">
                  {/* Thumbnail */}
                  <div className="relative overflow-hidden bg-slate-900" style={{ aspectRatio: '16/9' }}>
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-700">
                        <Video size={40} strokeWidth={1} />
                      </div>
                    )}
                    {/* Category badge */}
                    <div className="absolute bottom-2.5 left-2.5">
                      <span className="text-[9px] font-black uppercase tracking-widest bg-black/60 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {course.category || 'Course'}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 mb-1">{course.title}</h3>
                      {course.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">{course.description}</p>
                      )}
                      {course.assignedInstructor && (
                        <div className="flex items-center gap-2 mt-2">
                          {course.assignedInstructor.avatar ? (
                            <img src={course.assignedInstructor.avatar} alt="Instructor" className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
                              <span className="text-[8px] font-bold text-slate-500">{course.assignedInstructor.name.charAt(0)}</span>
                            </div>
                          )}
                          <span className="text-[10px] font-medium text-slate-600">{course.assignedInstructor.name}</span>
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="mt-auto">
                      {course.enrollmentStatus === 'pending' ? (
                        <button disabled className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all bg-amber-50 text-amber-600 border border-amber-200 cursor-not-allowed">
                          <Clock size={13} /> Request Pending
                        </button>
                      ) : course.enrollmentStatus === 'approved' ? (
                        <button disabled className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-not-allowed">
                          <CheckCircle2 size={13} /> Approved
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleRequestEnroll(course.id)}
                          className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all bg-slate-900 text-white hover:bg-primary-600 shadow-sm"
                        >
                          <BookOpen size={13} /> Request to Enroll
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
