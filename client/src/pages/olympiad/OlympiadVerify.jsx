import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Award, Shield, QrCode } from 'lucide-react';
import api from '../../lib/api';

export default function OlympiadVerify() {
  const { certId } = useParams();
  const [cert, setCert]     = useState(null);
  const [valid, setValid]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/olympiad/verify/${certId}`)
      .then(r => { setCert(r.data.data); setValid(true); })
      .catch(() => setValid(false))
      .finally(() => setLoading(false));
  }, [certId]);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className={`p-6 text-white text-center ${valid ? 'bg-gradient-to-br from-emerald-600 to-teal-700' : 'bg-gradient-to-br from-red-600 to-rose-700'}`}>
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            {valid ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
          </div>
          <h1 className="text-xl font-black mb-1">{valid ? 'Certificate Verified ✓' : 'Invalid Certificate'}</h1>
          <p className="text-sm opacity-80">{valid ? 'This certificate is authentic and valid.' : 'This certificate could not be verified.'}</p>
        </div>
        {/* Content */}
        {valid && cert && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-emerald-600" />
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Issued by Abhyo Olympiad</p>
            </div>
            {[
              { label: 'Student Name',   value: cert.studentName },
              { label: 'Olympiad',       value: cert.olympiadTitle },
              { label: 'Subject',        value: cert.subjectName },
              { label: 'Class',          value: cert.className },
              { label: 'Grade',          value: cert.grade || '—' },
              { label: 'National Rank',  value: cert.nationalRank ? `#${cert.nationalRank}` : '—' },
              { label: 'Exam Date',      value: cert.examDate ? new Date(cert.examDate).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}) : '—' },
              { label: 'Issued On',      value: cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}) : '—' },
              { label: 'Certificate ID', value: cert.certificateId },
            ].map(row => (
              <div key={row.label} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-500">{row.label}</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{row.value}</span>
              </div>
            ))}
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-700 text-xs">
              <Award className="w-4 h-4 flex-shrink-0" />
              This certificate was digitally issued by Abhyo and is tamper-proof.
            </div>
          </div>
        )}
        {!valid && (
          <div className="p-6 text-center text-slate-500">
            <XCircle className="w-12 h-12 mx-auto mb-3 text-red-300" />
            <p className="font-semibold">Certificate ID: <span className="font-mono text-slate-700">{certId}</span></p>
            <p className="text-sm mt-2">This certificate ID was not found in our records. It may be invalid or expired.</p>
          </div>
        )}
        <div className="px-6 pb-6 text-center text-xs text-slate-400">
          Abhyo Olympiad · Certificate Verification System · abhyo.com
        </div>
      </div>
    </div>
  );
}
