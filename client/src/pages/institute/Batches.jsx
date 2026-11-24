import React, { useEffect, useState } from 'react';
import { Plus, Users, BookOpen, Trash2, Link2, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import ExportButtons from '../../components/shared/ExportButtons';

export default function BatchesPage() {
  const [batches, setBatches] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchForm, setBatchForm] = useState({ name: '', description: '' });
  const [inviteLink, setInviteLink] = useState('');
  const [assignForm, setAssignForm] = useState({ testId: '', deadline: '' });
  const [studentForm, setStudentForm] = useState({ name: '', email: '', mobile: '', password: '' });

  const [allStudents, setAllStudents] = useState([]);
  const [studentMode, setStudentMode] = useState('new'); // 'new' | 'existing'
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/institute/batches');
      setBatches(res.data.data);
    } catch { toast.error('Failed to load batches'); }
    finally { setLoading(false); }
  };

  const fetchTests = async () => {
    try {
      const res = await api.get('/tests', { params: { limit: 100 } });
      setTests(res.data.data);
    } catch {}
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/institute/students', { params: { limit: 1000 } });
      setAllStudents(res.data.data || []);
    } catch {}
  };

  const fetchInviteLink = async () => {
    try {
      const res = await api.get('/institute/invite-link');
      setInviteLink(res.data.data.inviteUrl);
    } catch {}
  };

  useEffect(() => { fetchBatches(); fetchTests(); fetchStudents(); fetchInviteLink(); }, []);

  const createBatch = async (e) => {
    e.preventDefault();
    try {
      await api.post('/institute/batches', batchForm);
      toast.success('Batch created!');
      setShowModal(false);
      setBatchForm({ name: '', description: '' });
      fetchBatches();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create batch');
    }
  };

  const assignTest = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/institute/batches/${selectedBatch.id}/assign-test`, assignForm);
      toast.success('Test assigned!');
      setShowAssignModal(false);
      setAssignForm({ testId: '', deadline: '' });
      fetchBatches();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign test');
    }
  };

  const addStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/institute/students/add', { ...studentForm, batchId: selectedBatch.id });
      toast.success('Student added successfully!');
      setShowAddStudentModal(false);
      setStudentForm({ name: '', email: '', mobile: '', password: '' });
      fetchBatches();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add student');
    }
  };

  const assignExistingStudents = async (e) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0) return toast.error('Check at least one student');
    try {
      await api.post(`/institute/batches/${selectedBatch.id}/assign-students`, { studentIds: selectedStudentIds });
      toast.success('Students assigned successfully!');
      setShowAddStudentModal(false);
      setSelectedStudentIds([]);
      fetchBatches();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign students');
    }
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied!');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-header">👥 Batches</h1>
          <p className="section-subheader">Manage student batches and assign tests</p>
        </div>
        <div className="flex gap-3">
          <ExportButtons 
            data={batches} 
            filename="batches_report" 
            title="Batch Management Report" 
            headers={['Batch Name', 'Description', 'Students', 'Tests', 'Status']}
            pdfDataMapping={(b) => [
              b.name,
              b.description || '-',
              b.students?.length || 0,
              b.tests?.length || 0,
              b.isActive ? 'Active' : 'Inactive'
            ]}
          />
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Create Batch
          </button>
        </div>
      </div>

      {/* Invite Link */}
      {inviteLink && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Link2 size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Student Invite Link</p>
              <p className="text-sm font-bold text-indigo-900 truncate max-w-[200px] sm:max-w-md lg:max-w-xl">{inviteLink}</p>
            </div>
          </div>
          <button onClick={copyInvite} className="flex-shrink-0 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all hover:shadow-indigo-200">
            <Copy size={16} /> Copy Invite Link
          </button>
        </div>
      )}

      {/* Batches Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-48" />)}</div>
      ) : batches.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-500">No batches yet. Create your first batch!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {batches.map(batch => (
            <div key={batch.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 flex flex-col group relative overflow-hidden">
              {/* Top Accent Strip */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-start justify-between mb-5">
                <div className="pr-4">
                  <h3 className="font-black text-slate-900 text-lg tracking-tight group-hover:text-indigo-700 transition-colors">{batch.name}</h3>
                  {batch.description && <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-2 leading-relaxed">{batch.description}</p>}
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${batch.isActive ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'}`}>
                  {batch.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Stats Block */}
              <div className="flex bg-slate-50 rounded-2xl border border-slate-100 p-4 mb-6 gap-4">
                 <div className="flex-1">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Students</p>
                   <p className="text-xl font-black text-slate-800 flex items-center gap-2">
                     <Users className="w-4 h-4 text-indigo-500" /> {batch.students?.length || 0}
                   </p>
                 </div>
                 <div className="w-px bg-slate-200" />
                 <div className="flex-1">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tests</p>
                   <p className="text-xl font-black text-slate-800 flex items-center gap-2">
                     <BookOpen className="w-4 h-4 text-emerald-500" /> {batch.tests?.length || 0}
                   </p>
                 </div>
              </div>

              {/* Assigned Tests */}
              <div className="flex-1 mb-6">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Assigned Tests</p>
                {batch.tests?.length > 0 ? (
                  <div className="space-y-2">
                    {batch.tests.slice(0, 3).map(bt => (
                      <div key={bt.id || bt.testId} className="flex items-center justify-between text-[13px] bg-white border border-slate-100 shadow-sm rounded-xl px-3 py-2.5 hover:border-indigo-100 transition-colors">
                        <span className="font-bold text-slate-700 truncate min-w-0 mr-2">{bt.title || bt.test?.title || 'Test'}</span>
                        {bt.deadline ? (
                          <span className="text-[10px] font-bold text-orange-600 whitespace-nowrap bg-orange-100 px-2 py-0.5 rounded-lg border border-orange-200">
                            {new Date(bt.deadline).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">No deadline</span>
                        )}
                      </div>
                    ))}
                    {batch.tests.length > 3 && <p className="text-[11px] font-bold text-indigo-600 pl-2 pt-1">+{batch.tests.length - 3} more tests in batch</p>}
                  </div>
                ) : (
                   <p className="text-xs font-semibold text-slate-400 bg-slate-50 p-4 rounded-xl text-center border border-dashed border-slate-200">No tests assigned yet</p>
                )}
              </div>

              <div className="flex gap-3 mt-auto border-t border-slate-100 pt-5">
                <button
                  onClick={() => { setSelectedBatch(batch); setShowAssignModal(true); }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20 hover:-translate-y-0.5"
                >
                  <BookOpen size={16} /> Assign Test
                </button>
                <button
                  onClick={() => { setSelectedBatch(batch); setShowAddStudentModal(true); }}
                  className="flex-1 bg-white border-[1.5px] border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Users size={16} /> Add Student
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && selectedBatch && (
        <div className="modal-overlay" onClick={() => setShowAddStudentModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Add Student to Batch</h3>
            <p className="text-slate-500 text-sm mb-4">Batch: <strong className="text-slate-900">{selectedBatch.name}</strong></p>

            <div className="flex gap-2 mb-4 p-1 bg-slate-100 rounded-lg">
              <button onClick={() => setStudentMode('new')} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${studentMode === 'new' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Create New</button>
              <button onClick={() => setStudentMode('existing')} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${studentMode === 'existing' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Select Existing</button>
            </div>

            {studentMode === 'new' ? (
              <form onSubmit={addStudent} className="space-y-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input type="text" value={studentForm.name} onChange={e => setStudentForm({ ...studentForm, name: e.target.value })}
                    className="input-field" placeholder="John Doe" required />
                </div>
                <div>
                  <label className="label">Email Address *</label>
                  <input type="email" value={studentForm.email} onChange={e => setStudentForm({ ...studentForm, email: e.target.value })}
                    className="input-field" placeholder="john@example.com" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Mobile</label>
                    <input type="text" value={studentForm.mobile} onChange={e => setStudentForm({ ...studentForm, mobile: e.target.value })}
                      className="input-field" placeholder="10 digits" />
                  </div>
                  <div>
                    <label className="label">Temporary Password</label>
                    <input type="text" value={studentForm.password} onChange={e => setStudentForm({ ...studentForm, password: e.target.value })}
                      className="input-field" placeholder="Leave empty to auto-generate" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn-primary flex-1">Create & Assign</button>
                  <button type="button" onClick={() => setShowAddStudentModal(false)} className="btn-secondary flex-1">Cancel</button>
                </div>
              </form>
            ) : (
              <form onSubmit={assignExistingStudents} className="space-y-4">
                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1">
                  {allStudents.filter(s => !(selectedBatch.students || []).find(bs => bs.id === s.id)).length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No available students to assign.</p>
                  ) : (
                    allStudents
                      .filter(s => !(selectedBatch.students || []).find(bs => bs.id === s.id))
                      .map(student => (
                      <label key={student.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-md cursor-pointer border border-transparent hover:border-slate-100 transition-colors">
                        <input type="checkbox"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedStudentIds([...selectedStudentIds, student.id]);
                            else setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id));
                          }}
                          className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500" />
                        <div>
                          <p className="text-sm font-semibold text-slate-800 leading-tight">{student.name}</p>
                          <p className="text-xs text-slate-500">{student.email}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn-primary flex-1" disabled={selectedStudentIds.length === 0}>Assign Selected</button>
                  <button type="button" onClick={() => setShowAddStudentModal(false)} className="btn-secondary flex-1">Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Create Batch Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Create Batch</h3>
            <form onSubmit={createBatch} className="space-y-4">
              <div><label className="label">Batch Name *</label>
                <input type="text" value={batchForm.name} onChange={e => setBatchForm({ ...batchForm, name: e.target.value })}
                  className="input-field" placeholder="e.g., UPSC 2025 Batch A" required />
              </div>
              <div><label className="label">Description</label>
                <textarea value={batchForm.description} onChange={e => setBatchForm({ ...batchForm, description: e.target.value })}
                  className="input-field resize-none" rows={2} />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Create</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Test Modal */}
      {showAssignModal && selectedBatch && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Assign Test</h3>
            <p className="text-slate-500 text-sm mb-4">Batch: <strong className="text-slate-900">{selectedBatch.name}</strong></p>
            <form onSubmit={assignTest} className="space-y-4">
              <div>
                <label className="label">Select Test *</label>
                <select value={assignForm.testId} onChange={e => setAssignForm({ ...assignForm, testId: e.target.value })}
                  className="input-field" required>
                  <option value="">Choose a test...</option>
                  {tests.map(t => <option key={t.id} value={t.id}>{t.title} ({t.category})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Deadline (Optional)</label>
                <input type="datetime-local" value={assignForm.deadline}
                  onChange={e => setAssignForm({ ...assignForm, deadline: e.target.value })}
                  className="input-field" />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Assign</button>
                <button type="button" onClick={() => setShowAssignModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
