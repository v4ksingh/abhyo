import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Calendar, Clock, BookOpen, User, MapPin, Hash, Printer, School, FileText } from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../../lib/imageUrl';

export default function AdmitCard() {
  const { regId } = useParams();
  const navigate  = useNavigate();
  const printRef  = useRef();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/olympiad/student/admit-card/${regId}`)
      .then(r => setData(r.data.data))
      .catch(() => toast.error('Failed to load admit card'))
      .finally(() => setLoading(false));
  }, [regId]);

  const handlePrint = () => window.print();

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!data)   return <div className="text-center py-16 text-slate-400">Admit card not found</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex gap-2">
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold hover:shadow-lg transition-all">
            <Download className="w-4 h-4" /> Download
          </button>
        </div>
      </div>

      {/* Admit Card */}
      <div ref={printRef} id="admit-card" className="bg-white border-2 border-indigo-600 rounded-2xl overflow-hidden shadow-xl print:shadow-none print:rounded-none print:border-2">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-200 mb-1">Abhyo Olympiad</p>
              <h1 className="text-xl font-black">ADMIT CARD</h1>
              <p className="text-indigo-200 text-sm mt-0.5">{data.olympiadTitle}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-indigo-200">Subject</p>
              <p className="font-black text-lg">{data.subjectName}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Photo & Roll */}
            <div className="flex flex-col items-center gap-3 flex-shrink-0">
              {data.studentAvatar ? (
                <img src={getImageUrl(data.studentAvatar)} alt="Student" className="w-24 h-24 rounded-xl object-cover border-2 border-indigo-200" />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 border-2 border-indigo-200 flex items-center justify-center">
                  <User className="w-10 h-10 text-indigo-400" />
                </div>
              )}
              <div className="text-center">
                <p className="text-xs text-slate-500">Roll Number</p>
                <p className="font-black text-indigo-700 text-sm font-mono">{data.rollNumber}</p>
              </div>
            </div>

            {/* Student Details */}
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { icon: User,     label: 'Name',          value: data.studentName },
                  { icon: User,     label: "Father's Name", value: data.fatherName || '—' },
                  { icon: Hash,     label: 'Class',         value: `Class ${data.classSelected}` },
                  { icon: Calendar, label: 'DOB',           value: data.dob || '—' },
                  { icon: User,     label: 'Gender',        value: data.gender ? data.gender.charAt(0).toUpperCase() + data.gender.slice(1) : '—' },
                  { icon: BookOpen, label: 'Board',         value: data.board || '—' },
                  { icon: BookOpen, label: 'Medium',        value: data.medium || 'Hindi' },
                  { icon: School,   label: 'School Type',   value: data.schoolType === 'govt' ? 'Govt School' : 'Private School' },
                  { icon: School,   label: 'School Name',   value: data.schoolName || '—' },
                  { icon: FileText, label: 'ID Number',     value: data.documentNumber || '—' },
                  { icon: MapPin,   label: 'State',         value: data.studentState || '—' },
                  { icon: BookOpen, label: 'Subject',       value: data.subjectName },
                ].map(row => (
                  <div key={row.label} className="bg-slate-50 rounded-xl p-2.5">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <row.icon className="w-3 h-3 text-slate-400 stroke-[1.5]" />
                      <p className="text-[11px] text-slate-500 font-normal">{row.label}</p>
                    </div>
                    <p className="font-medium text-slate-800 text-xs truncate" title={row.value}>{row.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Exam Details */}
          <div className="mt-5 bg-gradient-to-r from-indigo-50/70 to-purple-50/70 rounded-xl p-4 border border-indigo-100">
            <h3 className="font-medium text-indigo-900 text-xs tracking-wider mb-2.5">EXAMINATION DETAILS</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Calendar, label: 'Date',      value: data.examDate ? new Date(data.examDate).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'}) : '—' },
                { icon: Clock,    label: 'Start Time', value: data.examStartTime },
                { icon: Clock,    label: 'Duration',   value: `${data.examDuration} Minutes` },
                { icon: BookOpen, label: 'Questions',  value: `${data.totalQuestions} MCQs (${data.marksPerQuestion}M each)` },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-xs text-slate-500 font-normal flex items-center gap-1"><item.icon className="w-3 h-3 stroke-[1.5]" />{item.label}</p>
                  <p className="font-medium text-slate-800 text-xs mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-4">
            <h3 className="font-medium text-slate-700 text-xs mb-2">IMPORTANT INSTRUCTIONS</h3>
            <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
              <li>Keep this admit card ready before starting the exam.</li>
              <li>The exam must be taken on a desktop/laptop for the best experience.</li>
              <li>Do not switch tabs during the exam — violations are recorded.</li>
              <li>Stay in full-screen mode throughout the examination.</li>
              <li>Ensure a stable internet connection before starting.</li>
              <li>Each correct answer: +{data.marksPerQuestion}M · Incorrect: -{data.negativeMarks}M</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="mt-5 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
            <p>Registration ID: <span className="font-mono">{data.registrationId}</span></p>
            <p>Abhyo.com · Official Admit Card</p>
          </div>
        </div>
      </div>

      <style>{`@media print { body * { visibility: hidden; } #admit-card, #admit-card * { visibility: visible; } #admit-card { position: absolute; left: 0; top: 0; width: 100%; } }`}</style>
    </div>
  );
}
