import React, { useState } from 'react';
import {
  X, Check, AlertTriangle, ExternalLink, Calendar, Users, DollarSign,
  FileText, ShieldCheck, CheckCircle2, XCircle, Globe, Send, Save, Trash2, Award
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../../lib/api';

export default function GovernmentJobReviewModal({ job, onClose, onRefresh }) {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    title: job.title || '',
    shortName: job.shortName || '',
    organization: job.organization || '',
    category: job.category || 'General',
    subcategory: job.subcategory || '',
    tagline: job.tagline || '',
    description: job.description || '',
    totalVacancies: job.totalVacancies || 0,
    vacancyDetails: Array.isArray(job.vacancyDetails) ? job.vacancyDetails : [],
    qualification: Array.isArray(job.qualification) ? job.qualification : [],
    eligibilityDetails: job.eligibilityDetails || '',
    ageLimit: job.ageLimit || { minimum: '', maximum: '', calculationDate: '' },
    salary: job.salary || '',
    salaryDetails: Array.isArray(job.salaryDetails) ? job.salaryDetails : [],
    applicationMode: job.applicationMode || 'Online',
    applicationStartDate: job.applicationStartDate || '',
    applicationLastDate: job.applicationLastDate || '',
    applicationFee: Array.isArray(job.applicationFee) ? job.applicationFee : [],
    howToApply: Array.isArray(job.howToApply) ? job.howToApply : [],
    requiredDocuments: Array.isArray(job.requiredDocuments) ? job.requiredDocuments : [],
    selectionProcess: Array.isArray(job.selectionProcess) ? job.selectionProcess : [],
    examPattern: Array.isArray(job.examPattern) ? job.examPattern : [],
    importantDates: Array.isArray(job.importantDates) ? job.importantDates : [],
    officialNotificationUrl: job.officialNotificationUrl || '',
    officialWebsite: job.officialWebsite || '',
    applyLink: job.applyLink || '',
    source: job.source || 'FreeJobAlert',
    sourceUrl: job.sourceUrl || '',
    adminNotes: job.adminNotes || '',
    isFeatured: !!job.isFeatured,
  });

  const [saving, setSaving] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const sf = (field, val) => setFormData(p => ({ ...p, [field]: val }));

  // Dynamic Array helpers
  const handleAddArrayItem = (field, defaultVal) => {
    setFormData(p => ({ ...p, [field]: [...p[field], defaultVal] }));
  };

  const handleUpdateArrayItem = (field, index, key, value) => {
    setFormData(p => {
      const arr = [...p[field]];
      if (typeof arr[index] === 'object' && arr[index] !== null) {
        arr[index] = { ...arr[index], [key]: value };
      } else {
        arr[index] = value;
      }
      return { ...p, [field]: arr };
    });
  };

  const handleRemoveArrayItem = (field, index) => {
    setFormData(p => ({
      ...p,
      [field]: p[field].filter((_, i) => i !== index),
    }));
  };

  // Save changes
  const handleSave = async () => {
    if (!formData.title.trim() || !formData.organization.trim()) {
      toast.error('Title and Organization are required');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/government-jobs/admin/${job.id}`, formData);
      toast.success('Job details updated');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Approve
  const handleApprove = async () => {
    if (!window.confirm('Approve this recruitment after your review?')) return;
    setActionLoading(true);
    try {
      await api.patch(`/government-jobs/admin/${job.id}/approve`, { adminNotes: formData.adminNotes });
      toast.success('Job approved! Ready to publish.');
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    setActionLoading(true);
    try {
      await api.patch(`/government-jobs/admin/${job.id}/reject`, {
        rejectionReason: rejectionReason.trim(),
        adminNotes: formData.adminNotes,
      });
      toast.success('Job marked as rejected');
      setRejectModalOpen(false);
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Publish
  const handlePublish = async () => {
    if (job.status !== 'approved' && !window.confirm('Job is not yet marked approved. Do you want to approve & publish directly to Abhyo.com?')) {
      return;
    }
    setActionLoading(true);
    try {
      await api.patch(`/government-jobs/admin/${job.id}/publish`, { overrideApproval: true });
      toast.success('🎉 Recruitment published live to Abhyo.com!');
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Publishing failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Unpublish
  const handleUnpublish = async () => {
    if (!window.confirm('Unpublish this job from Abhyo.com?')) return;
    setActionLoading(true);
    try {
      await api.patch(`/government-jobs/admin/${job.id}/unpublish`);
      toast.success('Job unpublished');
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unpublish failed');
    } finally {
      setActionLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', label: '1. Basic Info' },
    { id: 'vacancies', label: '2. Vacancies & Eligibility' },
    { id: 'salary', label: '3. Salary & Fees' },
    { id: 'dates', label: '4. Dates & Application' },
    { id: 'selection', label: '5. Selection & Pattern' },
    { id: 'links', label: '6. Official Links & AI' },
  ];

  const warnings = [
    ...(job.dataWarnings || []),
    ...(job.validationWarnings || []),
    ...(job.validationErrors || []),
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm flex-shrink-0">
              🏛️
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  job.status === 'published' ? 'bg-emerald-100 text-emerald-800' :
                  job.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                  job.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                  'bg-amber-100 text-amber-800 animate-pulse'
                }`}>
                  {job.status?.replace('_', ' ')}
                </span>
                {job.aiExtracted && (
                  <span className="text-[10px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                    🤖 AI Extracted
                  </span>
                )}
                {job.isFeatured && (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    ⭐ Featured
                  </span>
                )}
              </div>
              <h2 className="text-base font-extrabold text-slate-900 truncate mt-0.5">
                {formData.title || 'Job Review'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {job.status === 'published' && job.slug && (
              <a
                href={`/government-jobs/${job.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition"
              >
                <ExternalLink size={13} /> View Live
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* AI Warnings Alert Bar */}
        {warnings.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-xs text-amber-800">
              <span className="font-bold">AI Extraction Notice: </span>
              {warnings.map((w, idx) => (
                <span key={idx} className="mr-3 inline-block bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md my-0.5 font-medium">
                  • {typeof w === 'string' ? w : (w.message || JSON.stringify(w))}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="border-b border-slate-200 bg-white px-6 flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`py-3 px-3.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
                activeTab === t.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 text-slate-800 text-xs sm:text-sm space-y-4">

          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Recruitment Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => sf('title', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Organization / Department *</label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={e => sf('organization', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Short Name / Post Acronym</label>
                  <input
                    type="text"
                    placeholder="e.g. LIC HFL 2026"
                    value={formData.shortName}
                    onChange={e => sf('shortName', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={e => sf('category', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                  >
                    {['General', 'SSC', 'Railway', 'Banking', 'Defence', 'State PSC', 'Teaching', 'Police', 'Apprenticeship', 'Engineering', 'Medical', 'Other'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subcategory</label>
                  <input
                    type="text"
                    placeholder="e.g. Officer Cadre, Technician"
                    value={formData.subcategory}
                    onChange={e => sf('subcategory', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tagline</label>
                  <input
                    type="text"
                    placeholder="Short summary tagline for cards and SEO"
                    value={formData.tagline}
                    onChange={e => sf('tagline', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Job Description &amp; Overview</label>
                  <textarea
                    rows={6}
                    value={formData.description}
                    onChange={e => sf('description', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VACANCIES & ELIGIBILITY */}
          {activeTab === 'vacancies' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Vacancies</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalVacancies}
                    onChange={e => sf('totalVacancies', parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Age</label>
                  <input
                    type="number"
                    value={formData.ageLimit.minimum || ''}
                    onChange={e => sf('ageLimit', { ...formData.ageLimit, minimum: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="e.g. 18"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Age</label>
                  <input
                    type="number"
                    value={formData.ageLimit.maximum || ''}
                    onChange={e => sf('ageLimit', { ...formData.ageLimit, maximum: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="e.g. 28"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Age Calculation Reference Date</label>
                <input
                  type="date"
                  value={formData.ageLimit.calculationDate || ''}
                  onChange={e => sf('ageLimit', { ...formData.ageLimit, calculationDate: e.target.value })}
                  className="w-full max-w-xs px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>

              {/* Qualifications */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">Required Qualifications</h4>
                  <button
                    type="button"
                    onClick={() => handleAddArrayItem('qualification', '')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    + Add Qualification
                  </button>
                </div>
                {formData.qualification.map((q, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 items-center">
                    <input
                      type="text"
                      value={q}
                      onChange={e => handleUpdateArrayItem('qualification', idx, null, e.target.value)}
                      placeholder="e.g. Bachelor's Degree in any discipline"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveArrayItem('qualification', idx)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Vacancy Breakdown Table */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">Detailed Post Vacancies</h4>
                  <button
                    type="button"
                    onClick={() => handleAddArrayItem('vacancyDetails', { postName: '', vacancies: '', qualification: '' })}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    + Add Post Row
                  </button>
                </div>
                {formData.vacancyDetails.map((v, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2 items-center bg-white p-2 rounded-lg border border-slate-200">
                    <input
                      type="text"
                      placeholder="Post / Trade Name"
                      value={v.postName || ''}
                      onChange={e => handleUpdateArrayItem('vacancyDetails', idx, 'postName', e.target.value)}
                      className="px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Vacancies (e.g. 150)"
                      value={v.vacancies || ''}
                      onChange={e => handleUpdateArrayItem('vacancyDetails', idx, 'vacancies', e.target.value)}
                      className="px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                    />
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Eligibility"
                        value={v.qualification || ''}
                        onChange={e => handleUpdateArrayItem('vacancyDetails', idx, 'qualification', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveArrayItem('vacancyDetails', idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Additional Eligibility Details</label>
                <textarea
                  rows={3}
                  value={formData.eligibilityDetails}
                  onChange={e => sf('eligibilityDetails', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="Physical standards, medical tests, nationality requirements, etc."
                />
              </div>
            </div>
          )}

          {/* TAB 3: SALARY & FEES */}
          {activeTab === 'salary' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Salary / Stipend / Pay Scale</label>
                <input
                  type="text"
                  placeholder="e.g. ₹35,400 - ₹1,12,400 (Level 6)"
                  value={formData.salary}
                  onChange={e => sf('salary', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>

              {/* Application Fee */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">Application Fee Structure</h4>
                  <button
                    type="button"
                    onClick={() => handleAddArrayItem('applicationFee', { category: '', fee: '' })}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    + Add Fee Row
                  </button>
                </div>
                {formData.applicationFee.map((f, idx) => (
                  <div key={idx} className="flex gap-3 mb-2 items-center">
                    <input
                      type="text"
                      placeholder="Category (e.g. Gen/OBC/EWS)"
                      value={f.category || ''}
                      onChange={e => handleUpdateArrayItem('applicationFee', idx, 'category', e.target.value)}
                      className="w-1/2 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Fee (e.g. ₹500 or Free)"
                      value={f.fee || ''}
                      onChange={e => handleUpdateArrayItem('applicationFee', idx, 'fee', e.target.value)}
                      className="w-1/2 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveArrayItem('applicationFee', idx)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: DATES & APPLICATION */}
          {activeTab === 'dates' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Application Mode</label>
                  <select
                    value={formData.applicationMode}
                    onChange={e => sf('applicationMode', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm bg-white"
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Online & Offline">Online &amp; Offline</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.applicationStartDate || ''}
                    onChange={e => sf('applicationStartDate', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Last Date to Apply</label>
                  <input
                    type="date"
                    value={formData.applicationLastDate || ''}
                    onChange={e => sf('applicationLastDate', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm font-bold text-red-600"
                  />
                </div>
              </div>

              {/* Milestone dates */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">Important Milestone Dates</h4>
                  <button
                    type="button"
                    onClick={() => handleAddArrayItem('importantDates', { event: '', date: '' })}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    + Add Date Event
                  </button>
                </div>
                {formData.importantDates.map((d, idx) => (
                  <div key={idx} className="flex gap-3 mb-2 items-center">
                    <input
                      type="text"
                      placeholder="Event (e.g. Admit Card Release, Exam Date)"
                      value={d.event || ''}
                      onChange={e => handleUpdateArrayItem('importantDates', idx, 'event', e.target.value)}
                      className="w-2/3 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Date (e.g. 15 Dec 2026)"
                      value={d.date || ''}
                      onChange={e => handleUpdateArrayItem('importantDates', idx, 'date', e.target.value)}
                      className="w-1/3 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveArrayItem('importantDates', idx)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* How to Apply steps */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">How to Apply Steps</h4>
                  <button
                    type="button"
                    onClick={() => handleAddArrayItem('howToApply', '')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    + Add Step
                  </button>
                </div>
                {formData.howToApply.map((step, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 items-center">
                    <span className="w-5 font-bold text-xs text-indigo-600">{idx + 1}.</span>
                    <input
                      type="text"
                      value={step}
                      onChange={e => handleUpdateArrayItem('howToApply', idx, null, e.target.value)}
                      placeholder="e.g. Visit the official recruitment portal and register"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveArrayItem('howToApply', idx)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: SELECTION & PATTERN */}
          {activeTab === 'selection' && (
            <div className="space-y-4">
              {/* Selection Process */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">Selection Process Stages</h4>
                  <button
                    type="button"
                    onClick={() => handleAddArrayItem('selectionProcess', { stage: '', description: '' })}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    + Add Stage
                  </button>
                </div>
                {formData.selectionProcess.map((sp, idx) => (
                  <div key={idx} className="flex gap-3 mb-2 items-center">
                    <span className="w-5 font-bold text-xs text-indigo-600">{idx + 1}.</span>
                    <input
                      type="text"
                      placeholder="Stage (e.g. CBT Exam / Interview / Physical Test)"
                      value={sp.stage || (typeof sp === 'string' ? sp : '')}
                      onChange={e => handleUpdateArrayItem('selectionProcess', idx, 'stage', e.target.value)}
                      className="w-1/2 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Description / Remarks"
                      value={sp.description || ''}
                      onChange={e => handleUpdateArrayItem('selectionProcess', idx, 'description', e.target.value)}
                      className="w-1/2 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveArrayItem('selectionProcess', idx)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Exam Pattern */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">Exam Pattern Breakdown</h4>
                  <button
                    type="button"
                    onClick={() => handleAddArrayItem('examPattern', { paper: '', subject: '', questions: '', marks: '', time: '' })}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    + Add Pattern Row
                  </button>
                </div>
                {formData.examPattern.map((ep, idx) => (
                  <div key={idx} className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-2 items-center bg-white p-2 rounded-lg border border-slate-200">
                    <input
                      type="text"
                      placeholder="Paper / Tier"
                      value={ep.paper || ''}
                      onChange={e => handleUpdateArrayItem('examPattern', idx, 'paper', e.target.value)}
                      className="px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Subject"
                      value={ep.subject || ''}
                      onChange={e => handleUpdateArrayItem('examPattern', idx, 'subject', e.target.value)}
                      className="px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Questions"
                      value={ep.questions || ''}
                      onChange={e => handleUpdateArrayItem('examPattern', idx, 'questions', e.target.value)}
                      className="px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Marks"
                      value={ep.marks || ''}
                      onChange={e => handleUpdateArrayItem('examPattern', idx, 'marks', e.target.value)}
                      className="px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                    <div className="flex gap-1 items-center">
                      <input
                        type="text"
                        placeholder="Time"
                        value={ep.time || ''}
                        onChange={e => handleUpdateArrayItem('examPattern', idx, 'time', e.target.value)}
                        className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveArrayItem('examPattern', idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: LINKS & AI INFORMATION */}
          {activeTab === 'links' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Notification URL (PDF)</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.officialNotificationUrl}
                      onChange={e => sf('officialNotificationUrl', e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm"
                      placeholder="https://example.gov.in/notification.pdf"
                    />
                    {formData.officialNotificationUrl && (
                      <a
                        href={formData.officialNotificationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-indigo-100"
                      >
                        <ExternalLink size={14} /> Open
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Website</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.officialWebsite}
                      onChange={e => sf('officialWebsite', e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm"
                      placeholder="https://ssc.gov.in"
                    />
                    {formData.officialWebsite && (
                      <a
                        href={formData.officialWebsite}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-slate-100"
                      >
                        <ExternalLink size={14} /> Visit
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Direct Apply Link</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.applyLink}
                      onChange={e => sf('applyLink', e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm"
                      placeholder="https://recruitment.gov.in/apply"
                    />
                    {formData.applyLink && (
                      <a
                        href={formData.applyLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-emerald-100"
                      >
                        <ExternalLink size={14} /> Apply Page
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Source Page URL (n8n Ingestion Origin)</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.sourceUrl}
                      onChange={e => sf('sourceUrl', e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm bg-slate-50"
                      placeholder="https://freejobalert.com/recruitment"
                    />
                    {formData.sourceUrl && (
                      <a
                        href={formData.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-slate-200"
                      >
                        <ExternalLink size={14} /> Source Link
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Internal Admin Notes</label>
                <textarea
                  rows={3}
                  value={formData.adminNotes}
                  onChange={e => sf('adminNotes', e.target.value)}
                  placeholder="Private internal notes for other admins/superadmins (never visible to public)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm"
                />
              </div>

              {/* Feature checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={e => sf('isFeatured', e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isFeatured" className="text-xs font-bold text-slate-700 cursor-pointer">
                  ⭐ Mark as Featured Job (Pin to top of public job listings)
                </label>
              </div>

              {/* Audit trail */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500 space-y-1">
                <p><b>Created At:</b> {job.createdAt ? new Date(job.createdAt).toLocaleString() : '—'}</p>
                {job.reviewedAt && (
                  <p><b>Reviewed By:</b> {job.reviewer?.name || job.reviewedBy} on {new Date(job.reviewedAt).toLocaleString()}</p>
                )}
                {job.publishedAt && (
                  <p><b>Published By:</b> {job.publisher?.name || job.publishedBy} on {new Date(job.publishedAt).toLocaleString()}</p>
                )}
                {job.rejectionReason && (
                  <p className="text-rose-600"><b>Rejection Reason:</b> {job.rejectionReason}</p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition"
            >
              <Save size={14} />
              {saving ? 'Saving...' : 'Save Draft Edits'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Reject Button */}
            {job.status !== 'rejected' && (
              <button
                type="button"
                onClick={() => setRejectModalOpen(true)}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
              >
                <XCircle size={14} /> Reject
              </button>
            )}

            {/* Approve Button */}
            {job.status === 'pending_review' && (
              <button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 size={14} /> Approve Job
              </button>
            )}

            {/* Publish Button */}
            {job.status !== 'published' ? (
              <button
                type="button"
                onClick={handlePublish}
                disabled={actionLoading}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <Send size={14} /> Publish to Abhyo.com
              </button>
            ) : (
              <button
                type="button"
                onClick={handleUnpublish}
                disabled={actionLoading}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                Unpublish
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Reject Reason Confirmation Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-rose-700 flex items-center gap-2">
              <XCircle size={18} /> Reject Recruitment
            </h3>
            <p className="text-xs text-slate-600">
              Please enter the reason why this job is being rejected (e.g. invalid recruitment, duplicate notification, or expired).
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
