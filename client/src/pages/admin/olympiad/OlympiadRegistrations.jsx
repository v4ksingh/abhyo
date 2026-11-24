import React, { useEffect, useState } from 'react';
import {
  Users, Search, Filter, CheckCircle, XCircle, Clock, Download,
  Eye, FileText, Check, X, AlertCircle, ShieldCheck, ShieldAlert,
  ExternalLink, Calendar, MapPin, School, BookOpen, ChevronRight, User
} from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../../lib/imageUrl';

const PayBadge = ({ status }) => ({
  paid:    <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Paid</span>,
  pending: <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">Pending</span>,
  failed:  <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">Failed</span>,
  refunded:<span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">Refunded</span>,
}[status] || null);

const VerifyBadge = ({ status }) => ({
  approved: <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3 stroke-[1.5]" /> Approved</span>,
  pending:  <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit"><Clock className="w-3 h-3 stroke-[1.5]" /> Under Review</span>,
  rejected: <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 w-fit"><XCircle className="w-3 h-3 stroke-[1.5]" /> Rejected</span>,
}[status] || <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">Pending</span>);

export default function OlympiadRegistrations() {
  const [regs,       setRegs]       = useState([]);
  const [olympiads,  setOlympiads]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState({
    olympiadId: '',
    paymentStatus: '',
    verificationStatus: 'all',
    schoolType: 'all',
    search: '',
  });
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);

  // Review Modal state
  const [selectedReg, setSelectedReg] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState('approved');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/olympiad/admin/olympiads').then(r => setOlympiads(r.data.data || []));
  }, []);

  const fetchRegistrations = () => {
    setLoading(true);
    api.get('/olympiad/admin/registrations', {
      params: {
        olympiadId: filter.olympiadId || undefined,
        paymentStatus: filter.paymentStatus || undefined,
        verificationStatus: filter.verificationStatus !== 'all' ? filter.verificationStatus : undefined,
        schoolType: filter.schoolType !== 'all' ? filter.schoolType : undefined,
        page,
        limit: 50,
      }
    })
      .then(r => { setRegs(r.data.data || []); setTotal(r.data.total || 0); })
      .catch(() => toast.error('Failed to load registrations'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRegistrations();
  }, [filter.olympiadId, filter.paymentStatus, filter.verificationStatus, filter.schoolType, page]);

  const filtered = regs.filter(r =>
    !filter.search ||
    r.student?.name?.toLowerCase().includes(filter.search.toLowerCase()) ||
    r.student?.email?.toLowerCase().includes(filter.search.toLowerCase()) ||
    r.student?.mobile?.toLowerCase().includes(filter.search.toLowerCase()) ||
    r.fatherName?.toLowerCase().includes(filter.search.toLowerCase()) ||
    r.schoolName?.toLowerCase().includes(filter.search.toLowerCase()) ||
    r.schoolAddress?.toLowerCase().includes(filter.search.toLowerCase()) ||
    r.documentNumber?.toLowerCase().includes(filter.search.toLowerCase()) ||
    r.board?.toLowerCase().includes(filter.search.toLowerCase()) ||
    r.rollNumber?.toLowerCase().includes(filter.search.toLowerCase())
  );

  const pendingCount = regs.filter(r => r.verificationStatus === 'pending' || !r.verificationStatus).length;

  const handleOpenReview = (reg) => {
    setSelectedReg(reg);
    setVerifyStatus(reg.verificationStatus === 'rejected' ? 'rejected' : 'approved');
    setRemarks(reg.verificationRemarks || '');
  };

  const handleVerifySubmit = async (statusOverride) => {
    if (!selectedReg) return;
    const finalStatus = statusOverride || verifyStatus;

    if (finalStatus === 'rejected' && !remarks.trim()) {
      toast.error('Please enter a rejection reason for the student');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.put(`/olympiad/admin/registrations/${selectedReg.id}/verify`, {
        verificationStatus: finalStatus,
        remarks: remarks.trim() || undefined,
      });

      const isGovt = (selectedReg.schoolType || '').toLowerCase() === 'govt';
      toast.success(
        finalStatus === 'approved'
          ? (isGovt
              ? 'Registration approved 100% Free of Cost for Govt School! Roll number generated.'
              : 'Registration approved! Payment option is now enabled for the student.')
          : 'Registration marked as rejected.'
      );

      // Update local state
      setRegs(prev => prev.map(r => r.id === selectedReg.id ? { ...r, ...res.data.data } : r));
      setSelectedReg(null);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to update verification status');
    } finally {
      setSubmitting(false);
    }
  };

  const exportCSV = () => {
    const headers = [
      'Roll No', 'Student Name', 'Father Name', 'DOB', 'Gender', 'Email', 'Mobile',
      'Class', 'Board', 'Medium', 'School Type', 'School Name', 'School Address',
      'Document Type', 'Document Number', 'Address', 'Olympiad', 'Amount',
      'Payment Status', 'Verification Status', 'Verified At', 'Registered At'
    ];
    const rows = filtered.map(r => [
      `"${r.rollNumber || ''}"`,
      `"${r.student?.name || ''}"`,
      `"${r.fatherName || ''}"`,
      `"${r.dob || ''}"`,
      `"${r.gender || ''}"`,
      `"${r.student?.email || ''}"`,
      `"${r.student?.mobile || ''}"`,
      `"Class ${r.classSelected}"`,
      `"${r.board || ''}"`,
      `"${r.medium || ''}"`,
      `"${(r.schoolType || 'private').toUpperCase()}"`,
      `"${(r.schoolName || '').replace(/"/g, '""')}"`,
      `"${(r.schoolAddress || '').replace(/"/g, '""')}"`,
      `"${r.documentType || ''}"`,
      `"${r.documentNumber || ''}"`,
      `"${(r.address || '').replace(/"/g, '""')}"`,
      `"${r.olympiad?.title || ''}"`,
      `"₹${r.amountPaid}"`,
      `"${r.paymentStatus}"`,
      `"${r.verificationStatus || 'pending'}"`,
      `"${r.verifiedAt ? new Date(r.verifiedAt).toLocaleString('en-IN') : ''}"`,
      `"${new Date(r.createdAt).toLocaleString('en-IN')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'olympiad-registrations.csv'; a.click();
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-medium text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 stroke-[1.5]" /> Olympiad Registrations & Document Verification
          </h1>
          <p className="text-slate-400 text-xs font-normal">
            Verify student identity documents (Aadhaar / ID) to enable their payment option.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-normal hover:bg-slate-50 transition-all">
            <Download className="w-3.5 h-3.5 stroke-[1.5]" /> Export CSV
          </button>
        </div>
      </div>

      {/* Verification Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'all', label: 'All Registrations' },
          { id: 'pending', label: 'Under Review', countBadge: pendingCount > 0 ? pendingCount : null },
          { id: 'approved', label: 'Approved (Payment Enabled)' },
          { id: 'rejected', label: 'Rejected' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setFilter({ ...filter, verificationStatus: tab.id }); setPage(1); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filter.verificationStatus === tab.id
                ? 'bg-indigo-600 text-white font-medium shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 font-normal'
            }`}
          >
            {tab.label}
            {tab.countBadge && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                filter.verificationStatus === tab.id ? 'bg-white text-indigo-700' : 'bg-amber-100 text-amber-800'
              }`}>
                {tab.countBadge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex flex-wrap gap-2.5">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 stroke-[1.5]" />
          <input
            value={filter.search}
            onChange={e => setFilter(p => ({ ...p, search: e.target.value }))}
            placeholder="Search student, father name, email, roll no..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-normal text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-300"
          />
        </div>
        <select
          value={filter.schoolType}
          onChange={e => setFilter(p => ({ ...p, schoolType: e.target.value }))}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-normal text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="all">All School Types</option>
          <option value="govt">🏛️ Govt School (Free)</option>
          <option value="private">🏢 Private School</option>
        </select>
        <select
          value={filter.olympiadId}
          onChange={e => setFilter(p => ({ ...p, olympiadId: e.target.value }))}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-normal text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All Olympiads</option>
          {olympiads.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
        </select>
        <select
          value={filter.paymentStatus}
          onChange={e => setFilter(p => ({ ...p, paymentStatus: e.target.value }))}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-normal text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All Payment States</option>
          {['paid', 'pending', 'failed', 'refunded'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Registrations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2">
            <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-normal text-slate-400">Loading registrations...</p>
          </div>
        ) : !filtered.length ? (
          <div className="py-16 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30 stroke-[1.5]" />
            <p className="text-xs font-normal">No registrations found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80">
                  {['Student & Father', 'Class & Board', 'School & Type', 'DOB & Gender', 'Identity & School ID', 'Verification', 'Payment', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Student & Father */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 text-xs">{r.student?.name || '—'}</p>
                      {r.fatherName && (
                        <p className="text-[11px] text-slate-400 font-normal">Father: <span className="text-slate-600">{r.fatherName}</span></p>
                      )}
                      <p className="text-[11px] text-slate-400 font-normal">{r.student?.mobile || r.student?.email}</p>
                      {r.rollNumber && (
                        <span className="font-mono text-[11px] text-indigo-600 block font-semibold">Roll: {r.rollNumber}</span>
                      )}
                    </td>

                    {/* Class & Board */}
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-normal mb-0.5">
                        Class {r.classSelected}
                      </span>
                      <p className="text-xs font-medium text-slate-700">{r.board || '—'}</p>
                      <p className="text-[11px] text-slate-400 font-normal">Medium: {r.medium || 'Hindi'}</p>
                      <p className="text-[11px] text-slate-400 font-normal truncate max-w-[140px]">{r.olympiad?.title}</p>
                    </td>

                    {/* School & Type */}
                    <td className="px-4 py-3">
                      {r.schoolType === 'govt' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          🏛️ Govt School (Free)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-normal bg-slate-100 text-slate-700 border border-slate-200">
                          🏢 Private School
                        </span>
                      )}
                      <p className="text-xs font-semibold text-slate-800 mt-1 max-w-[190px] truncate" title={r.schoolName}>
                        {r.schoolName || '—'}
                      </p>
                      {r.schoolAddress && (
                        <p className="text-[11px] text-slate-400 font-normal max-w-[190px] truncate" title={r.schoolAddress}>
                          {r.schoolAddress}
                        </p>
                      )}
                    </td>

                    {/* DOB & Gender */}
                    <td className="px-4 py-3">
                      <p className="text-xs font-normal text-slate-700">{r.dob || '—'}</p>
                      <span className="text-[11px] font-normal text-slate-400 capitalize">{r.gender || '—'}</span>
                      {r.student?.state && <p className="text-[11px] text-slate-400 font-normal">{r.student.state}</p>}
                    </td>

                    {/* Identity Doc & School ID */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {(r.studentPhotoUrl || r.student?.avatar) && (
                          <img
                            src={getImageUrl(r.studentPhotoUrl || r.student?.avatar)}
                            alt="Student"
                            className="w-8 h-10 object-cover rounded-lg border border-indigo-200 shrink-0 cursor-zoom-in"
                            title="Student Photograph (Passport Size, Max 100KB)"
                            onClick={() => window.open(getImageUrl(r.studentPhotoUrl || r.student?.avatar), '_blank')}
                          />
                        )}
                        <div className="space-y-1">
                          {r.documentNumber && (
                            <div className="font-mono text-[11px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 w-fit" title="Document / Aadhaar Number">
                              #{r.documentNumber}
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-1">
                            {r.documentUrl ? (
                              <a
                                href={getImageUrl(r.documentUrl)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[11px] font-medium transition-colors"
                                title="Identity Document (JPEG/PNG max 500KB)"
                              >
                                <FileText className="w-3 h-3 stroke-[1.5]" />
                                {r.documentType || 'Doc'}
                                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                              </a>
                            ) : (
                              <span className="text-[11px] text-slate-300 font-normal italic">No ID Doc</span>
                            )}

                            {r.schoolType === 'govt' && (
                              r.schoolIdCardUrl ? (
                                <a
                                  href={getImageUrl(r.schoolIdCardUrl)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 text-[11px] font-semibold transition-colors"
                                  title="Government School ID Card (JPEG/PNG max 500KB)"
                                >
                                  🪪 Govt ID Card
                                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                </a>
                              ) : (
                                <span className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                  ⚠️ Missing ID Card
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Verification Status */}
                    <td className="px-4 py-3">
                      <VerifyBadge status={r.verificationStatus} />
                      {r.verificationRemarks && (
                        <p className="text-[11px] text-slate-400 font-normal mt-0.5 max-w-[160px] truncate" title={r.verificationRemarks}>
                          "{r.verificationRemarks}"
                        </p>
                      )}
                    </td>

                    {/* Payment Status */}
                    <td className="px-4 py-3">
                      {r.schoolType === 'govt' && r.paymentStatus === 'paid' ? (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Free Waiver (₹0)
                        </span>
                      ) : (
                        <PayBadge status={r.paymentStatus} />
                      )}
                      <p className="text-xs font-medium text-slate-700 mt-0.5">
                        {r.schoolType === 'govt' && r.paymentStatus === 'paid' ? '₹0 (100% Free)' : `₹${r.amountPaid}`}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleOpenReview(r)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-indigo-600 text-xs font-normal transition-all shadow-sm"
                      >
                        <Eye className="w-3 h-3 stroke-[1.5]" /> Review / Verify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 50 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t text-xs font-normal text-slate-500">
            <p>Showing {(page-1)*50+1}–{Math.min(page*50, total)} of {total}</p>
            <div className="flex gap-1.5">
              <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1 rounded-lg border text-xs disabled:opacity-40">Prev</button>
              <button disabled={page*50>=total} onClick={()=>setPage(p=>p+1)} className="px-3 py-1 rounded-lg border text-xs disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* ─── REVIEW & VERIFICATION MODAL ─── */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  selectedReg.schoolType === 'govt' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-50 text-indigo-600'
                }`}>
                  <ShieldCheck className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2">
                    Verify Student Registration & Documents
                    {selectedReg.schoolType === 'govt' ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold">
                        🏛️ Govt School (Free Waiver)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium">
                        🏢 Private School
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 font-normal">
                    Olympiad: {selectedReg.olympiad?.title} · Class {selectedReg.classSelected}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReg(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Government School Notice Callout */}
              {selectedReg.schoolType === 'govt' ? (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
                  <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-amber-900">
                        GOVERNMENT SCHOOL REGISTRATION — 100% FREE OF COST
                      </span>
                      <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold text-[10px] rounded-full uppercase">
                        Admin Inspection Required
                      </span>
                    </div>
                    <p className="text-xs text-amber-800 mt-1 font-normal leading-relaxed">
                      Please examine the uploaded <strong>Government School ID Card</strong> and <strong>Identity Document</strong> carefully to confirm that the student actually attends a Government School. If approved, the student will receive <strong>100% free registration (₹0 fee waiver)</strong>, their seat will be confirmed immediately, and their official Roll Number will be generated without payment.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-blue-800">
                  <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p>
                    <strong>Private School Student:</strong> Once approved, the student will be enabled to pay the registration fee (₹{selectedReg.olympiad?.registrationFee || selectedReg.amountPaid || '...'}) to confirm their seat.
                  </p>
                </div>
              )}

              {/* Student Details Grid */}
              <div className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-4">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Student & School Registration Details
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
                  <div>
                    <span className="text-slate-400 font-normal block">Full Name:</span>
                    <span className="font-semibold text-slate-800 text-sm">{selectedReg.student?.name || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-normal block">Father's Name:</span>
                    <span className="font-medium text-slate-800 text-sm">{selectedReg.fatherName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-normal block">Date of Birth:</span>
                    <span className="font-normal text-slate-700">{selectedReg.dob || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-normal block">Gender:</span>
                    <span className="font-normal text-slate-700 capitalize">{selectedReg.gender || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-normal block">Class:</span>
                    <span className="font-semibold text-indigo-600">Class {selectedReg.classSelected}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-normal block">Board of Study:</span>
                    <span className="font-normal text-slate-700">{selectedReg.board || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-normal block">Medium of Study:</span>
                    <span className="font-normal text-slate-700">{selectedReg.medium || 'Hindi'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-normal block">Mobile:</span>
                    <span className="font-normal text-slate-700">{selectedReg.student?.mobile || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-normal block">Email:</span>
                    <span className="font-normal text-slate-600 truncate block">{selectedReg.student?.email || '—'}</span>
                  </div>

                  {/* School details */}
                  <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-400 font-normal block">School Type:</span>
                      <span className={`inline-block font-semibold text-xs mt-0.5 ${
                        selectedReg.schoolType === 'govt' ? 'text-emerald-700' : 'text-slate-700'
                      }`}>
                        {selectedReg.schoolType === 'govt' ? '🏛️ Government School' : '🏢 Private School'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-normal block">School Name:</span>
                      <span className="font-medium text-slate-800 text-xs block">{selectedReg.schoolName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-normal block">School Address:</span>
                      <span className="font-normal text-slate-700 text-xs block">{selectedReg.schoolAddress || '—'}</span>
                    </div>
                  </div>

                  {/* Document and Residential Address */}
                  <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 font-normal block">Document Type & Number:</span>
                      <span className="font-mono font-medium text-slate-800 text-xs">
                        {selectedReg.documentType || 'Aadhaar Card'}: {selectedReg.documentNumber ? `#${selectedReg.documentNumber}` : 'Not provided'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-normal block">Residential Address:</span>
                      <span className="font-normal text-slate-700 text-xs">{selectedReg.address || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Review Section (Side by side or stacked) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Student Passport Photo */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60">
                  <h4 className="text-xs font-semibold text-slate-700 flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-600 stroke-[1.5]" />
                      Student Photograph (Max 100 KB)
                    </span>
                    {(selectedReg.studentPhotoUrl || selectedReg.student?.avatar) && (
                      <button
                        type="button"
                        onClick={() => window.open(getImageUrl(selectedReg.studentPhotoUrl || selectedReg.student?.avatar), '_blank')}
                        className="text-indigo-600 hover:text-indigo-800 text-[11px] font-medium inline-flex items-center gap-1"
                      >
                        Full Size <ExternalLink className="w-3 h-3 opacity-60" />
                      </button>
                    )}
                  </h4>

                  {(selectedReg.studentPhotoUrl || selectedReg.student?.avatar) ? (
                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/70">
                      <img
                        src={getImageUrl(selectedReg.studentPhotoUrl || selectedReg.student?.avatar)}
                        alt="Student Photograph"
                        className="w-20 h-24 rounded-lg object-cover border-2 border-indigo-200 shadow-sm cursor-zoom-in"
                        onClick={() => window.open(getImageUrl(selectedReg.studentPhotoUrl || selectedReg.student?.avatar), '_blank')}
                      />
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-800">{selectedReg.student?.name}</p>
                        <p className="text-[11px] text-slate-400 font-normal">Official admit card passport photograph</p>
                        <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-medium">
                          JPEG / PNG &le; 100 KB
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-400 text-xs italic bg-white rounded-xl border border-dashed border-slate-200">
                      No photo uploaded
                    </div>
                  )}
                </div>

                {/* 2. Identity Document */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-600 stroke-[1.5]" />
                      <span>{selectedReg.documentType || 'Identity Document'}</span>
                      {selectedReg.documentNumber && (
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">
                          #{selectedReg.documentNumber}
                        </span>
                      )}
                    </h4>
                    {selectedReg.documentUrl && (
                      <a
                        href={getImageUrl(selectedReg.documentUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        Full Size <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    )}
                  </div>

                  {selectedReg.documentUrl ? (
                    <div className="border border-slate-200 rounded-xl p-2 bg-white flex items-center justify-center min-h-[160px] max-h-[220px] overflow-hidden">
                      <img
                        src={getImageUrl(selectedReg.documentUrl)}
                        alt="Document Preview"
                        className="max-h-[200px] w-auto max-w-full rounded-lg object-contain shadow-sm cursor-zoom-in"
                        onClick={() => window.open(getImageUrl(selectedReg.documentUrl), '_blank')}
                      />
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 text-xs italic bg-white">
                      No identity document uploaded
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Government School ID Card (Critical for Govt School Free Waiver) */}
              {selectedReg.schoolType === 'govt' && (
                <div className="border-2 border-amber-300 rounded-2xl p-4 bg-amber-50/40">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <span className="text-base">🪪</span>
                      Government School ID Card (Mandatory for Free Waiver)
                    </h4>
                    {selectedReg.schoolIdCardUrl && (
                      <a
                        href={getImageUrl(selectedReg.schoolIdCardUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 underline"
                      >
                        Open Full Size <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                      </a>
                    )}
                  </div>

                  {selectedReg.schoolIdCardUrl ? (
                    <div className="space-y-2">
                      <div className="border border-amber-200 rounded-xl p-3 bg-white flex items-center justify-center min-h-[180px] max-h-[320px] overflow-hidden">
                        <img
                          src={getImageUrl(selectedReg.schoolIdCardUrl)}
                          alt="Government School ID Card"
                          className="max-h-[300px] w-auto max-w-full rounded-lg object-contain shadow-sm cursor-zoom-in"
                          onClick={() => window.open(getImageUrl(selectedReg.schoolIdCardUrl), '_blank')}
                        />
                      </div>
                      <p className="text-[11px] text-amber-800 font-medium text-center">
                        🔍 Verify that the School Name on ID matches: <strong>"{selectedReg.schoolName}"</strong> and the student name is <strong>"{selectedReg.student?.name}"</strong>.
                      </p>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-rose-300 rounded-xl p-6 text-center bg-rose-50/60">
                      <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-1" />
                      <p className="text-xs font-bold text-rose-800">No Government School ID Card Uploaded!</p>
                      <p className="text-[11px] text-rose-600 mt-1">
                        This student applied under Government School quota for 100% Free registration, but did not upload the required School ID Card. Please reject with a note to upload their Govt School ID Card.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Admin Decision */}
              <div className="border-t border-slate-100 pt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Admin Remarks / Notes (Visible to Student if Rejected)
                  </label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    placeholder="e.g. Govt School ID verified · Free Waiver approved / Please upload clear Govt School ID Card photo"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-normal text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-300"
                  />
                  {/* Quick remarks buttons */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      'Document verified successfully',
                      'Govt School ID verified (Free Waiver granted)',
                      'School ID card blurry / unreadable, please re-upload',
                      'School ID card missing official seal/stamp',
                      'Name mismatch with registration',
                      'Wrong document uploaded',
                    ].map(msg => (
                      <button
                        key={msg}
                        type="button"
                        onClick={() => setRemarks(msg)}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-normal text-slate-600 transition-colors"
                      >
                        + {msg}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Verification Action Buttons */}
                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleVerifySubmit('rejected')}
                    className="flex-1 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-normal text-xs border border-rose-200 transition-all flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4 stroke-[1.5]" /> Reject Registration
                  </button>

                  {selectedReg.schoolType === 'govt' ? (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleVerifySubmit('approved')}
                      className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-xs shadow-md shadow-emerald-200 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4 stroke-[2]" />
                      Approve as Govt School (100% Free Waiver & Confirms Seat)
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleVerifySubmit('approved')}
                      className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium text-xs shadow-md shadow-indigo-100 hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4 stroke-[1.5]" />
                      Approve & Enable Payment (₹{selectedReg.olympiad?.registrationFee || selectedReg.amountPaid || '...'})
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
