import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, Video, FileText, Layers, Trash2, Edit2, 
  ChevronDown, ChevronUp, Play, File, Download, 
  Settings, Users, Eye, Save, X, GripVertical,
  Calendar, UserCheck, LayoutList, Award, MessageSquare, 
  CheckCircle, Pin, Clock, Send, AlertCircle, Target, Image as ImageIcon, Upload
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';
import QuizBuilder from './QuizBuilder';

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('curriculum');
  
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [selectedLessonType, setSelectedLessonType] = useState('video');
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [availableTests, setAvailableTests] = useState([]);
  const [thumbnailFileName, setThumbnailFileName] = useState('');
  const [instructors, setInstructors] = useState([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState('');
  
  // Extended Features State
  const [salientFeatures, setSalientFeatures] = useState([]);
  const [productHighlights, setProductHighlights] = useState([]);
  const [examsCovered, setExamsCovered] = useState([]);
  const [faqs, setFaqs] = useState([]);

  // Q&A State
  const [qaList, setQaList] = useState([]);
  const [qaFilter, setQaFilter] = useState('all'); // 'all' | 'answered' | 'unanswered'
  const [answeringId, setAnsweringId] = useState(null);
  const [answerText, setAnswerText] = useState('');
  
  // Attendance State
  const [students, setStudents] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [markingLoading, setMarkingLoading] = useState(false);

  const fetchDetails = async () => {
    try {
      const [courseRes, testRes] = await Promise.all([
        api.get(`/lms/courses/${id}`),
        api.get('/tests') // Or institute tests
      ]);
      const parsedCourse = courseRes.data.data;
      setCourse(parsedCourse);
      setSelectedInstructorId(parsedCourse?.instructorId || '');
      setAvailableTests(testRes.data.data || []);
      
      const safeParse = (val) => {
        if (!val) return [];
        if (typeof val === 'string') {
          try { return JSON.parse(val); } catch(e) { return []; }
        }
        return Array.isArray(val) ? val : [];
      };

      setSalientFeatures(safeParse(parsedCourse?.salientFeatures));
      setProductHighlights(safeParse(parsedCourse?.productHighlights));
      setExamsCovered(safeParse(parsedCourse?.examsCovered));
      setFaqs(safeParse(parsedCourse?.faqs));
      
      try {
        const batchRes = await api.get('/institute/batches');
        setBatches(batchRes.data.data || []);
      } catch (e) {
        setBatches([]);
      }

      try {
        const instrRes = await api.get('/lms/instructors');
        setInstructors(instrRes.data.data || []);
      } catch (e) {
        setInstructors([]);
      }
    } catch (err) {
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'students') fetchStudents();
    if (activeTab === 'qa') fetchQA();
  }, [activeTab]);

  const fetchQA = async () => {
    try {
      const res = await api.get(`/lms/courses/${id}/qa?status=${qaFilter === 'all' ? '' : qaFilter}`);
      setQaList(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load Q&A');
    }
  };

  useEffect(() => {
    if (activeTab === 'qa') fetchQA();
  }, [qaFilter]);

  const handleAnswerSubmit = async (qaId) => {
    if (!answerText.trim()) return toast.error('Answer cannot be empty');
    try {
      await api.put(`/lms/qa/${qaId}/answer`, { answer: answerText });
      toast.success('Answer submitted!');
      setAnsweringId(null);
      setAnswerText('');
      fetchQA();
    } catch (err) {
      toast.error('Failed to submit answer');
    }
  };

  const handleTogglePin = async (qaId) => {
    try {
      await api.patch(`/lms/qa/${qaId}/pin`);
      fetchQA();
    } catch (err) {
      toast.error('Failed to pin question');
    }
  };

  const handleDeleteQuestion = async (qaId) => {
    if (!confirm('Delete this question?')) return;
    try {
      await api.delete(`/lms/qa/${qaId}`);
      toast.success('Question deleted');
      fetchQA();
    } catch (err) {
      toast.error('Failed to delete question');
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get(`/lms/courses/${id}/students`);
      setStudents(res.data.data || []);
      
      // Initialize attendance records if they haven't been touched
      const initial = {};
      res.data.data.forEach(s => {
        initial[s.id] = 'present';
      });
      setAttendanceRecords(initial);
      
      // Try to fetch existing attendance for this date
      fetchExistingAttendance(attendanceDate);
    } catch (err) {
      toast.error('Failed to load students');
    }
  };

  const fetchExistingAttendance = async (date) => {
    try {
      const res = await api.get(`/lms/attendance?courseId=${id}&date=${date}`);
      if (res.data.data && res.data.data.length > 0) {
        const existing = {};
        res.data.data.forEach(record => {
          existing[record.studentId] = record.status;
        });
        setAttendanceRecords(prev => ({ ...prev, ...existing }));
      } else {
        // Reset to all present if no record found for date
        const reset = {};
        students.forEach(s => reset[s.id] = 'present');
        setAttendanceRecords(reset);
      }
    } catch (e) {
      console.error('Failed to fetch existing attendance');
    }
  };

  const handleMarkAttendance = async () => {
    setMarkingLoading(true);
    try {
      const attendanceData = students.map(s => ({
        studentId: s.id,
        batchId: s.batchId,
        status: attendanceRecords[s.id] || 'present'
      }));
      
      await api.post('/lms/attendance', {
        date: attendanceDate,
        courseId: id,
        attendanceData
      });
      
      toast.success('Attendance updated successfully');
    } catch (err) {
      toast.error('Failed to mark attendance');
    } finally {
      setMarkingLoading(false);
    }
  };

  const handleAddModule = async (e) => {
    e.preventDefault();
    const title = e.target.title.value;
    try {
      await api.post(`/lms/courses/${id}/modules`, { title, order: (course.modules?.length || 0) + 1 });
      toast.success('Module added');
      setShowModuleModal(false);
      fetchDetails();
    } catch (err) {
      toast.error('Failed to add module');
    }
  };

  const handleAddLesson = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    try {
      await api.post(`/lms/courses/${id}/lessons`, { ...data, moduleId: selectedModuleId });
      toast.success('Lesson added');
      setShowLessonModal(false);
      fetchDetails();
    } catch (err) {
      toast.error('Failed to add lesson');
    }
  };

  const handleAssignBatch = async (e) => {
    e.preventDefault();
    const batchId = e.target.batchId.value;
    try {
      await api.post(`/lms/courses/${id}/assign-batch`, { batchId });
      toast.success('Course assigned to batch');
      setShowBatchModal(false);
      fetchDetails();
    } catch (err) {
      toast.error('Failed to assign batch');
    }
  };

  const handleAddQuiz = async (e) => {
    e.preventDefault();
    const testId = e.target.testId.value;
    try {
      await api.post(`/lms/courses/${id}/quizzes`, { testId, moduleId: selectedModuleId });
      toast.success('Test attached successfully');
      setShowQuizModal(false);
      fetchDetails();
    } catch (err) {
      toast.error('Failed to attach test');
    }
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    formData.set('isPublished', e.target.isPublished.checked);
    // explicitly set instructorId from controlled state (select doesn't auto-serialize)
    formData.set('instructorId', selectedInstructorId || '');
    
    // Append JSON stringified arrays
    formData.set('salientFeatures', JSON.stringify(salientFeatures));
    formData.set('productHighlights', JSON.stringify(productHighlights));
    formData.set('examsCovered', JSON.stringify(examsCovered));
    formData.set('faqs', JSON.stringify(faqs));

    try {
      await api.put(`/lms/courses/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Course updated successfully!');
      fetchDetails();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update course');
    }
  };

  const handleUpdateStringArray = (setter, state, index, val) => {
    const next = [...state];
    next[index] = val;
    setter(next);
  };
  const handleRemoveStringArray = (setter, state, index) => {
    setter(state.filter((_, i) => i !== index));
  };
  const handleUpdateFaq = (index, key, val) => {
    const next = [...faqs];
    next[index][key] = val;
    setFaqs(next);
  };
  const handleRemoveFaq = (index) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    // lessonId is added to formData
    formData.append('lessonId', selectedLessonId);
    
    try {
      await api.post(`/lms/courses/${id}/materials`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Material uploaded successfully');
      setShowMaterialModal(false);
      fetchDetails();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to upload material');
    }
  };

  if (loading) return <div className="skeleton h-96 w-full" />;
  if (!course) return <div className="text-center py-20">Course not found</div>;

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header Card */}
      <div className="card !p-0 overflow-hidden border-none shadow-xl bg-slate-900 text-white">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-64 h-48 md:h-auto bg-slate-800">
            {course.thumbnail ? (
              <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-700">
                <Video size={64} strokeWidth={1} />
              </div>
            )}
          </div>
          <div className="flex-1 p-6 md:p-8">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-primary-500/20 text-primary-300 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-primary-500/30">
                {course.category || 'Professional Course'}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${course.isPublished ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                {course.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black mb-3">{course.title}</h1>
            {course.instructorName && (
              <div className="flex items-center gap-2 mb-3 mt-1">
                 <div className="w-6 h-6 rounded-full bg-primary-500/20 flex flex-col items-center justify-center text-primary-300 text-xs font-bold border border-primary-500/30">
                    {course.instructorName.charAt(0).toUpperCase()}
                 </div>
                 <p className="text-sm font-semibold text-slate-300">By {course.instructorName}</p>
              </div>
            )}
            <p className="text-slate-400 text-sm max-w-2xl line-clamp-2 mb-6">{course.description}</p>
            
            <div className="flex flex-wrap gap-6 items-center border-t border-white/10 pt-6">
              <div className="flex items-center gap-2">
                <Layers className="text-primary-400" size={18} />
                <span className="text-sm font-bold text-slate-300">{course.modules?.length || 0} Modules</span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="text-emerald-400" size={18} />
                <span className="text-sm font-bold text-slate-300">{course.allLessons?.length || 0} Video Lessons</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="text-blue-400" size={18} />
                <span className="text-sm font-bold text-slate-300">{(course.enrolledBatches?.length || 0)} Batches Enrolled</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-slate-200">
        {[
          { id: 'curriculum', label: '📖 Curriculum', icon: Layers },
          { id: 'quizzes', label: '📝 Quizzes', icon: Layers },
          { id: 'qa', label: '💬 Q&A', icon: MessageSquare },
          { id: 'students', label: '👥 Students & Attendance', icon: UserCheck },
          { id: 'batches', label: '🏷️ Enrolled Batches', icon: Users },
          { id: 'settings', label: '⚙️ Course Settings', icon: Settings },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 pb-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Curriculum Tab */}
      {activeTab === 'curriculum' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Layers className="text-primary-500" size={20} /> Course Syllabus
            </h3>
            <button 
              onClick={() => setShowModuleModal(true)}
              className="btn-secondary !text-xs !py-2 flex items-center gap-1.5"
            >
              <Plus size={14} /> Add New Module
            </button>
          </div>

          <div className="space-y-4">
            {course.modules?.sort((a,b) => a.order - b.order).map((module, mIdx) => (
              <div key={module.id} className="card !p-0 overflow-hidden border-2 border-slate-100 hover:border-slate-200 transition-colors">
                <div className="bg-slate-50 p-4 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-black text-slate-500 text-xs shadow-sm">
                      {mIdx + 1}
                    </span>
                    <h4 className="font-bold text-slate-900">{module.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { setSelectedModuleId(module.id); setShowLessonModal(true); }}
                      className="text-[10px] sm:text-xs font-bold text-primary-600 bg-primary-50 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-colors"
                    >
                      + Add Lesson
                    </button>
                    <button 
                      onClick={() => setActiveTab('quizzes')}
                      className="text-[10px] sm:text-xs font-bold text-blue-600 bg-blue-50 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                      title="Design a custom quiz with your own questions"
                    >
                      + Build Quiz
                    </button>
                    <button 
                      onClick={() => { setSelectedModuleId(module.id); setShowQuizModal(true); }}
                      className="text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                      title="Attach an existing full-length Mock Test"
                    >
                      + Attach Mock Test
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>

                <div className="divide-y divide-slate-50">
                        {module.lessons?.sort((a,b) => a.order-b.order).map((lesson, lIdx) => (
                           <div key={lesson.id} className="bg-white border-b border-slate-50 last:border-0">
                             <div className="p-4 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-center gap-4">
                                 <div className={`p-2 rounded-xl ${lesson.videoUrl ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {lesson.videoUrl ? <Play size={16} fill="currentColor" /> : <FileText size={16} />}
                                 </div>
                                 <div>
                                   <p className="text-sm font-bold text-slate-800">{lesson.title}</p>
                                   <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                     {lesson.videoUrl ? `Video • ${lesson.duration}m` : 'Reading Material'} {lesson.isFree && '• FREE PREVIEW'}
                                   </p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-2 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button 
                                   onClick={() => { setSelectedLessonId(lesson.id); setShowMaterialModal(true); }}
                                   title="Add Attachment"
                                   className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors"
                                 >
                                   <File size={16} />
                                 </button>
                                 <button className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors"><Edit2 size={14} /></button>
                                 <button className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                              </div>
                            </div>
                            
                            {/* Material List per Lesson */}
                            <div className="px-14 pb-4 space-y-1.5">
                               {course.allMaterials?.filter(m => m.lessonId === lesson.id).map(mat => (
                                 <div key={mat.id} className="flex items-center justify-between py-1 px-3 bg-slate-50 rounded-lg group/mat">
                                    <div className="flex items-center gap-2">
                                       <Download size={12} className="text-slate-400" />
                                       <span className="text-[11px] font-bold text-slate-600">{mat.title}</span>
                                    </div>
                                    <button className="opacity-0 group-hover/mat:opacity-100 text-slate-300 hover:text-red-500 transition-opacity"><X size={12} /></button>
                                 </div>
                               ))}
                            </div>
                           </div>
                        ))}

                        {module.quizzes?.map(quiz => (
                          <div key={quiz.id} className="p-4 flex items-center justify-between bg-emerald-50/50 border-b border-white">
                             <div className="flex items-center gap-4">
                                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                                   <Target size={16} />
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-slate-800">{quiz.title}</p>
                                   <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Mock Test • {quiz.totalQuestions} Questions</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-2">
                                <button className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                             </div>
                          </div>
                        ))}

                        {/* Modules Custom Built Quizzes */}
                        {module.moduleQuizzes?.map(quiz => (
                          <div key={quiz.id} className="p-4 flex items-center justify-between bg-blue-50/50 border-b border-white">
                             <div className="flex items-center gap-4">
                                <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                                   <Target size={16} />
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-slate-800">{quiz.title}</p>
                                   <p className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Custom Quiz • {quiz.totalQuestions} Questions</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-2">
                                <button onClick={() => setActiveTab('quizzes')} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><Edit2 size={14} /></button>
                                <button className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                             </div>
                          </div>
                        ))}
                  {(!module.lessons || module.lessons.length === 0) && (
                    <div className="p-8 text-center bg-white">
                       <p className="text-xs text-slate-400 font-medium">No lessons added to this module yet.</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {(!course.modules || course.modules.length === 0) && (
              <div className="card py-16 text-center border-dashed border-2">
                 <Layers className="mx-auto text-slate-300 mb-4" size={48} />
                 <p className="text-slate-500 font-medium">Your curriculum is empty. Start by adding a module.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quizzes Tab (Custom Quiz System) */}
      {activeTab === 'quizzes' && (
        <div className="animate-slide-up">
          <QuizBuilder courseId={id} modules={course.modules || []} />
        </div>
      )}

      {/* Q&A Tab */}
      {/* Students & Attendance Tab */}
      {activeTab === 'qa' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-6 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <MessageSquare className="text-primary-500" /> Course Q&amp;A
              </h3>
              <p className="text-slate-500 text-sm font-medium mt-1">Review and answer questions from enrolled students.</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              {['all', 'unanswered', 'answered'].map(f => (
                <button
                  key={f}
                  onClick={() => setQaFilter(f)}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    qaFilter === f ? 'bg-white shadow text-primary-600' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {f === 'all' ? '🗂 All' : f === 'unanswered' ? '❓ Unanswered' : '✅ Answered'}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Questions', value: qaList.length, icon: MessageSquare, color: 'primary' },
              { label: 'Unanswered', value: qaList.filter(q => !q.isAnswered).length, icon: AlertCircle, color: 'amber' },
              { label: 'Answered', value: qaList.filter(q => q.isAnswered).length, icon: CheckCircle, color: 'emerald' },
            ].map((s, i) => (
              <div key={i} className="card flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl bg-${s.color}-50 text-${s.color}-500 flex items-center justify-center border border-${s.color}-100 flex-shrink-0`}>
                  <s.icon size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
                  <p className="text-2xl font-black text-slate-800">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {qaList.length === 0 ? (
              <div className="card py-20 text-center border-dashed border-2">
                <MessageSquare size={48} className="mx-auto text-slate-200 mb-3" />
                <p className="text-slate-500 font-medium">No questions yet</p>
                <p className="text-xs text-slate-400 mt-1">Students can ask questions from the course page</p>
              </div>
            ) : qaList.map(qa => (
              <div key={qa.id} className={`card transition-all ${qa.isPinned ? 'border-l-4 border-l-primary-500' : ''}`}>
                {/* Question Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 flex-shrink-0 border border-slate-200">
                      {qa.askedBy?.name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-black text-slate-800">{qa.askedBy?.name}</span>
                        <span className="text-[10px] text-slate-400">{qa.askedBy?.email}</span>
                        <span className="text-[10px] text-slate-300">•</span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock size={10} /> {new Date(qa.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                        </span>
                        {qa.isPinned && <span className="bg-primary-50 text-primary-600 border border-primary-100 text-[10px] font-black px-2 py-0.5 rounded-full">📌 Pinned</span>}
                        {!qa.isAnswered && <span className="bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-black px-2 py-0.5 rounded-full">Awaiting Answer</span>}
                        {qa.isAnswered && <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black px-2 py-0.5 rounded-full">✓ Answered</span>}
                      </div>
                      <p className="text-slate-800 font-semibold leading-relaxed">{qa.question}</p>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleTogglePin(qa.id)}
                      title={qa.isPinned ? 'Unpin' : 'Pin to top'}
                      className={`p-2 rounded-lg transition-colors ${qa.isPinned ? 'text-primary-600 bg-primary-50' : 'text-slate-400 hover:text-primary-600 hover:bg-primary-50'}`}
                    >
                      <Pin size={15} />
                    </button>
                    <button
                      onClick={() => { setAnsweringId(answeringId === qa.id ? null : qa.id); setAnswerText(qa.answer || ''); }}
                      className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="Answer"
                    >
                      <Send size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(qa.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Existing Answer */}
                {qa.isAnswered && qa.answer && answeringId !== qa.id && (
                  <div className="ml-13 pl-4 border-l-2 border-emerald-200 mt-2 bg-emerald-50/50 rounded-r-xl py-3 pr-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1.5">
                      Answer by {qa.answeredBy?.name}
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">{qa.answer}</p>
                  </div>
                )}

                {/* Answer Input Box */}
                {answeringId === qa.id && (
                  <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                    <textarea
                      value={answerText}
                      onChange={e => setAnswerText(e.target.value)}
                      placeholder="Type your answer here..."
                      className="input-field min-h-[100px] w-full text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => { setAnsweringId(null); setAnswerText(''); }} className="btn-secondary !py-2 text-xs">
                        Cancel
                      </button>
                      <button onClick={() => handleAnswerSubmit(qa.id)} className="btn-primary !py-2 text-xs flex items-center gap-2">
                        <Send size={13} /> Submit Answer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-6 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <UserCheck className="text-primary-500" /> Mark Daily Attendance
              </h3>
              <p className="text-slate-500 text-sm font-medium mt-1">Select date and update student presence status.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="date" 
                  value={attendanceDate}
                  onChange={(e) => {
                    setAttendanceDate(e.target.value);
                    fetchExistingAttendance(e.target.value);
                  }}
                  className="bg-white border border-slate-200 focus:border-primary-500 rounded-xl pl-10 pr-4 py-2 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all cursor-pointer"
                />
              </div>
              <button 
                onClick={handleMarkAttendance}
                disabled={markingLoading || students.length === 0}
                className={`btn-primary !py-2.5 flex items-center gap-2 ${markingLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {markingLoading ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Save size={16} />}
                {markingLoading ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </div>

          <div className="card !p-0 overflow-hidden border-2 border-slate-100 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-16">#</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Student Info</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Batch</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center w-64">Presence Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {students.map((student, idx) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-400">{idx + 1}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold overflow-hidden border border-slate-200 shadow-sm">
                          {student.avatar 
                            ? <img src={student.avatar} className="w-full h-full object-cover" alt={student.name} /> 
                            : student.name.charAt(0)
                          }
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{student.name}</p>
                            <p className="text-[10px] font-medium text-slate-500">{student.email || student.mobile}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-primary-50 text-primary-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-primary-100">
                          {student.batchName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1 bg-slate-100/50 p-1 rounded-xl border border-slate-200">
                          {[
                            { id: 'present', label: 'Present', color: 'peer-checked:bg-emerald-500 peer-checked:text-white', icon: '✅' },
                            { id: 'absent', label: 'Absent', color: 'peer-checked:bg-red-500 peer-checked:text-white', icon: '❌' },
                            { id: 'late', label: 'Late', color: 'peer-checked:bg-amber-500 peer-checked:text-white', icon: '⏰' }
                          ].map(opt => (
                            <label key={opt.id} className="flex-1 cursor-pointer">
                              <input 
                                type="radio" 
                                name={`attendance-${student.id}`} 
                                value={opt.id}
                                checked={attendanceRecords[student.id] === opt.id}
                                onChange={() => setAttendanceRecords(prev => ({ ...prev, [student.id]: opt.id }))}
                                className="peer sr-only"
                              />
                              <div className={`px-4 py-2 text-[10px] font-black uppercase tracking-tighter text-center rounded-lg transition-all duration-300 text-slate-400 border border-transparent ${opt.color} hover:bg-slate-200/50`}>
                                <span className="mr-1">{opt.icon}</span> {opt.label}
                              </div>
                            </label>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {students.length === 0 && (
              <div className="py-20 text-center">
                <Users size={48} className="mx-auto text-slate-200 mb-3" />
                <p className="text-slate-500 font-medium">No students enrolled in batches associated with this course.</p>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-2">Assign batches to see student list</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="card max-w-4xl animate-slide-up">
          <h3 className="text-lg font-black text-slate-900 mb-8 pb-4 border-b border-slate-100 flex items-center gap-2">
            <Settings className="text-primary-500" size={20} /> Course Global Settings
          </h3>
          
          <form onSubmit={handleUpdateCourse} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="label">Course Title</label>
                  <input name="title" defaultValue={course.title} className="input-field" required />
                </div>
                <div>
                  <label className="label">Category</label>
                  <input name="category" defaultValue={course.category} className="input-field" />
                </div>
                <div>
                  <label className="label">Price (₹)</label>
                  <input name="price" type="number" defaultValue={course.price} className="input-field" />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="label">Course Thumbnail Cover</label>
                  <div className="group relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-slate-200 border-dashed bg-slate-50 flex items-center justify-center transition-all hover:border-primary-300 shadow-sm">
                    {course.thumbnail && !thumbnailFileName ? (
                      <img src={course.thumbnail} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="text-slate-300 w-12 h-12" />
                    )}
                    
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm">
                      <Upload className="text-white mb-2" size={28} />
                      <span className="text-white font-bold text-sm px-4 text-center">
                        {thumbnailFileName ? `Selected: ${thumbnailFileName}` : 'Upload Cover Image'}
                      </span>
                      <input 
                        name="thumbnailFile" 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => setThumbnailFileName(e.target.files[0]?.name || '')} 
                      />
                    </label>
                  </div>
                  <input name="thumbnail" defaultValue={course.thumbnail} className="input-field mt-3 text-xs text-slate-500 placeholder-slate-300 transition-opacity" placeholder="Or paste external image URL..." />
                </div>
                <div>
                  <label className="label">Full Description</label>
                  <textarea name="description" defaultValue={course.description} className="input-field min-h-[120px]"></textarea>
                </div>
              </div>
            </div>

            {/* Instructor Assignment */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="text-primary-500" size={18} /> Assign Instructor
              </h4>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Instructor Account</label>
                  {instructors.length > 0 ? (
                    <select
                      name="instructorId"
                      value={selectedInstructorId}
                      onChange={e => {
                        setSelectedInstructorId(e.target.value);
                        const found = instructors.find(i => i.id === e.target.value);
                        // auto-fill name field so it shows on student view
                        const nameInput = document.querySelector('input[name="instructorName"]');
                        if (nameInput && found) nameInput.value = found.name;
                      }}
                      className="input-field"
                    >
                      <option value="">— No instructor assigned —</option>
                      {instructors.map(instr => (
                        <option key={instr.id} value={instr.id}>
                          {instr.name} ({instr.email})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="input-field bg-slate-100 text-slate-400 text-sm flex items-center gap-2">
                      <Users size={14} /> No instructor accounts found. Create one via Institute Accounts.
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">This links a registered instructor account so they can manage this course.</p>
                </div>
                <div>
                  <label className="label">Display Name <span className="text-slate-400 font-normal">(shown to students)</span></label>
                  <input name="instructorName" defaultValue={course.instructorName} className="input-field" placeholder="e.g. Dr. John Doe" />
                </div>
              </div>
              <div className="mt-4">
                <label className="label">Instructor Biography</label>
                <textarea name="instructorBio" defaultValue={course.instructorBio} className="input-field min-h-[80px]" placeholder="Brief background about the instructor..."></textarea>
              </div>
            </div>

            {/* Course Metrics */}
            <div className="border border-slate-100 rounded-2xl p-6 space-y-4">
               <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                 <Target className="text-primary-500" size={18} /> Course Configuration Metrics
               </h4>
               <div className="grid md:grid-cols-4 gap-4 pt-2">
                 <div>
                   <label className="label">Duration (e.g. 6 Months)</label>
                   <input name="courseDuration" defaultValue={course.courseDuration} className="input-field py-2 text-sm" placeholder="e.g., 6 Months" />
                 </div>
                 <div>
                   <label className="label">Total Seats</label>
                   <input type="number" name="seats" defaultValue={course.seats} className="input-field py-2 text-sm" placeholder="e.g., 100" />
                 </div>
                 <div>
                   <label className="label">Recorded Classes</label>
                   <input type="number" name="recordedClasses" defaultValue={course.recordedClasses} className="input-field py-2 text-sm" placeholder="e.g., 50" />
                 </div>
                 <div>
                   <label className="label">Live Classes</label>
                   <input type="number" name="liveClasses" defaultValue={course.liveClasses} className="input-field py-2 text-sm" placeholder="e.g., 20" />
                 </div>
               </div>
            </div>

            {/* Dynamics Lists: Highlights, Features, Exams */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-slate-100 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2"><CheckCircle size={16} className="text-emerald-500" /> Salient Features</h4>
                  <button type="button" onClick={() => setSalientFeatures([...salientFeatures, ''])} className="text-xs text-primary-600 hover:text-primary-700 font-bold px-2 py-0.5 bg-primary-50 rounded">Add Feature</button>
                </div>
                <div className="space-y-2">
                  {salientFeatures.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <input value={item} onChange={e => handleUpdateStringArray(setSalientFeatures, salientFeatures, idx, e.target.value)} className="input-field py-2 text-sm" placeholder="Feature details..." />
                      <button type="button" onClick={() => handleRemoveStringArray(setSalientFeatures, salientFeatures, idx)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><X size={14} /></button>
                    </div>
                  ))}
                  {salientFeatures.length === 0 && <p className="text-xs text-slate-400">No salient features added.</p>}
                </div>
              </div>
              
              <div className="border border-slate-100 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2"><Award size={16} className="text-orange-500" /> Product Highlights</h4>
                  <button type="button" onClick={() => setProductHighlights([...productHighlights, ''])} className="text-xs text-primary-600 hover:text-primary-700 font-bold px-2 py-0.5 bg-primary-50 rounded">Add Highlight</button>
                </div>
                <div className="space-y-2">
                  {productHighlights.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <input value={item} onChange={e => handleUpdateStringArray(setProductHighlights, productHighlights, idx, e.target.value)} className="input-field py-2 text-sm" placeholder="Highlight details..." />
                      <button type="button" onClick={() => handleRemoveStringArray(setProductHighlights, productHighlights, idx)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><X size={14} /></button>
                    </div>
                  ))}
                  {productHighlights.length === 0 && <p className="text-xs text-slate-400">No product highlights added.</p>}
                </div>
              </div>
            </div>

            <div className="border border-slate-100 rounded-2xl p-6">
               <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2"><Pin size={16} className="text-blue-500" /> Exams Covered</h4>
                  <button type="button" onClick={() => setExamsCovered([...examsCovered, ''])} className="text-xs text-primary-600 hover:text-primary-700 font-bold px-2 py-0.5 bg-primary-50 rounded">Add Exam</button>
               </div>
               <div className="grid md:grid-cols-2 gap-2">
                 {examsCovered.map((item, idx) => (
                   <div key={idx} className="flex items-center gap-2">
                      <input value={item} onChange={e => handleUpdateStringArray(setExamsCovered, examsCovered, idx, e.target.value)} className="input-field py-2 text-sm" placeholder="e.g. UPSC Prelims 2024" />
                      <button type="button" onClick={() => handleRemoveStringArray(setExamsCovered, examsCovered, idx)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><X size={14} /></button>
                   </div>
                 ))}
               </div>
            </div>

            {/* FAQs */}
            <div className="border border-slate-100 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2"><MessageSquare size={16} className="text-indigo-500" /> Frequently Asked Questions (FAQs)</h4>
                  <button type="button" onClick={() => setFaqs([...faqs, { question: '', answer: '' }])} className="text-xs text-primary-600 hover:text-primary-700 font-bold px-2 py-0.5 bg-primary-50 rounded">Add FAQ</button>
                </div>
                <div className="space-y-4">
                  {faqs.map((faq, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                      <div className="flex-1 space-y-3">
                         <input value={faq.question} onChange={e => handleUpdateFaq(idx, 'question', e.target.value)} className="input-field py-2 text-sm font-semibold" placeholder="Question..." />
                         <textarea value={faq.answer} onChange={e => handleUpdateFaq(idx, 'answer', e.target.value)} className="input-field py-2 text-sm min-h-[60px]" placeholder="Answer..."></textarea>
                      </div>
                      <button type="button" onClick={() => handleRemoveFaq(idx)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg mt-1"><Trash2 size={16} /></button>
                    </div>
                  ))}
                  {faqs.length === 0 && <p className="text-xs text-slate-400">No FAQs provided.</p>}
                </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900">Publish Status</h4>
                <p className="text-xs text-slate-500">Enable this to make the course visible to enrolled students.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="isPublished" defaultChecked={course.isPublished} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" className="btn-secondary !text-red-500 hover:!bg-red-50 flex items-center gap-2">
                 <Trash2 size={16} /> Delete Course
              </button>
              <button type="submit" className="btn-primary flex items-center gap-2">
                 <Save size={16} /> Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Batches Tab */}
      {activeTab === 'batches' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">👥 Enrolled Batches</h3>
            <button 
              onClick={() => setShowBatchModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} /> Enroll New Batch
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {course.enrolledBatches?.map(batch => (
              <div key={batch.id} className="card flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center font-black">
                     {batch.name?.slice(0, 1)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{batch.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Batch</p>
                  </div>
                </div>
                <button className="text-slate-400 hover:text-red-600 p-2"><Trash2 size={16} /></button>
              </div>
            ))}
            {(!course.enrolledBatches || course.enrolledBatches.length === 0) && (
              <div className="col-span-full card py-16 text-center border-dashed border-2">
                <Users size={48} className="text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500">No batches currently enrolled in this course.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showModuleModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4 text-slate-900">Add New Module</h2>
            <form onSubmit={handleAddModule}>
              <div className="mb-4">
                <label className="label">Module Title</label>
                <input required name="title" className="input-field" placeholder="e.g. Introduction to Algebra" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowModuleModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Add Module</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLessonModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg w-full">
            <h2 className="text-lg font-bold mb-6 text-slate-900">Add New Lesson</h2>
            <form onSubmit={handleAddLesson} className="space-y-4">
              <div>
                <label className="label">Lesson Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="cursor-pointer">
                    <input 
                      type="radio" 
                      name="lessonType" 
                      value="video" 
                      checked={selectedLessonType === 'video'} 
                      onChange={() => setSelectedLessonType('video')} 
                      className="peer sr-only" 
                    />
                    <div className="p-3 border rounded-xl text-center peer-checked:border-primary-500 peer-checked:bg-primary-50 font-bold text-xs text-slate-600">🎥 Video Lesson</div>
                  </label>
                  <label className="cursor-pointer">
                    <input 
                      type="radio" 
                      name="lessonType" 
                      value="note" 
                      checked={selectedLessonType === 'note'} 
                      onChange={() => setSelectedLessonType('note')} 
                      className="peer sr-only" 
                    />
                    <div className="p-3 border rounded-xl text-center peer-checked:border-primary-500 peer-checked:bg-primary-50 font-bold text-xs text-slate-600">📝 Reading / Notes</div>
                  </label>
                </div>
              </div>
              <div>
                <label className="label">Lesson Title</label>
                <input required name="title" className="input-field" placeholder="e.g. Basic Laws of Indices" />
              </div>
              
              {selectedLessonType === 'video' ? (
                <div className="animate-fade-in space-y-4">
                  <div>
                    <label className="label">Video URL (YouTube/Vimeo)</label>
                    <input name="videoUrl" className="input-field" placeholder="https://youtube.com/watch?v=..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Duration (Min)</label>
                      <input type="number" name="duration" className="input-field" defaultValue={15} />
                    </div>
                    <div>
                      <label className="label">Visibility</label>
                      <select name="isFree" className="input-field">
                        <option value="false">🔒 Locked (Premium)</option>
                        <option value="true">🔓 Free Preview</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <label className="label">Visibility</label>
                  <select name="isFree" className="input-field">
                    <option value="false">🔒 Locked (Premium)</option>
                    <option value="true">🔓 Free Preview</option>
                  </select>
                </div>
              )}
              <div>
                <label className="label">Text Content / Notes</label>
                <textarea name="content" className="input-field min-h-[100px]" placeholder="Optional notes for students..."></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowLessonModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Save Lesson</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMaterialModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4 text-slate-900">Add PDF / Notes Attachment</h2>
            <form onSubmit={handleAddMaterial}>
              <div className="space-y-4">
                <div>
                  <label className="label">Attachment Title</label>
                  <input required name="title" className="input-field" placeholder="e.g. Chapter 1 Notes" />
                </div>
                <div>
                  <label className="label">Select File (PDF preferred)</label>
                  <input required name="file" type="file" className="input-field py-2" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" />
                </div>
              </div>
              <div className="flex gap-2 pt-6">
                <button type="button" onClick={() => setShowMaterialModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Upload & Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQuizModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4 text-slate-900">Attach Mock Test</h2>
            <p className="text-xs text-slate-500 mb-6">Select an existing mock test to attach to this module.</p>
            <form onSubmit={handleAddQuiz}>
              <div className="mb-6">
                 <label className="label">Select Test</label>
                 <select name="testId" required className="input-field">
                    <option value="">Choose a test...</option>
                    {availableTests.map(t => (
                      <option key={t.id} value={t.id}>{t.title} ({t.type})</option>
                    ))}
                 </select>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowQuizModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Attach Test</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBatchModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4">Enroll Batch</h2>
            <p className="text-xs text-slate-500 mb-6">Select a batch to give them access to this entire course curriculum.</p>
            <form onSubmit={handleAssignBatch}>
              <div className="mb-6">
                <label className="label">Select Batch</label>
                <select name="batchId" required className="input-field">
                   <option value="">Choose a batch...</option>
                   {batches.filter(b => !course.enrolledBatches?.some(eb => eb.id === b.id)).map(b => (
                     <option key={b.id} value={b.id}>{b.name}</option>
                   ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowBatchModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Enroll Batch</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
