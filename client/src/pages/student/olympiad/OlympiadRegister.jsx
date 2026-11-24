import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, CreditCard, User, BookOpen,
  Trophy, AlertCircle, Sparkles, FileText, Calendar, Clock,
  Upload, ShieldCheck, ShieldAlert, Lock, RefreshCw, Eye,
  School, MapPin, Check, X, File, AlertTriangle, ChevronRight,
  Camera, Crop, Copy, ArrowRight
} from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../../lib/imageUrl';
import PhotoCropModal from '../../../components/shared/PhotoCropModal';

const STEPS = ['Select Class', 'Student Details', 'Identity Document', 'Verification & Payment'];

const BOARDS = [
  { id: 'JAC', label: 'JAC (Jharkhand Academic Council)' },
  { id: 'CBSE', label: 'CBSE (Central Board)' },
  { id: 'ICSE', label: 'ICSE / ISC' },
  { id: 'State Board', label: 'State Board (Bihar/UP/Other)' },
  { id: 'Other', label: 'Other Board' },
];

export default function OlympiadRegister() {
  const { olympiadId } = useParams();
  const navigate       = useNavigate();
  const fileInputRef   = useRef(null);
  const photoInputRef  = useRef(null);
  const schoolIdCardInputRef = useRef(null);

  const [olympiad,      setOlympiad]      = useState(null);
  const [user,          setUser]          = useState(null);
  const [step,          setStep]          = useState(0);
  const [classSelected, setClassSelected] = useState(null);
  const [processing,    setProcessing]    = useState(false);
  const [loading,       setLoading]       = useState(true);

  // Verification & Existing registration state
  const [existingReg,   setExistingReg]   = useState(null);
  const [registered,    setRegistered]    = useState(false);
  const [rollNumber,    setRollNumber]    = useState('');
  const [regId,         setRegId]         = useState('');
  const [copiedRoll,    setCopiedRoll]    = useState(false);

  // Form details
  const [formData, setFormData] = useState({
    dob: '',
    gender: 'male',
    fatherName: '',
    address: '',
    board: 'JAC',
    medium: 'Hindi',
    schoolType: 'private', // 'govt' or 'private'
    schoolName: '',
    schoolAddress: '',
    documentType: 'Aadhaar Card',
    documentNumber: '',
  });

  // Identity document upload (JPEG or PNG only, max 500 KB)
  const [docFile,    setDocFile]    = useState(null);
  const [docPreview, setDocPreview] = useState(null);

  // School ID Card upload (Mandatory for Govt school, max 500 KB, JPEG or PNG only)
  const [schoolIdCardFile,    setSchoolIdCardFile]    = useState(null);
  const [schoolIdCardPreview, setSchoolIdCardPreview] = useState(null);

  // Student Photograph upload & crop state (Max 100 KB, JPEG or PNG only)
  const [photoFile,     setPhotoFile]     = useState(null);
  const [photoPreview,  setPhotoPreview]  = useState(null);
  const [rawPhotoSrc,   setRawPhotoSrc]   = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);

  const loadData = async () => {
    try {
      const [o, u, regs] = await Promise.all([
        api.get(`/olympiad/public/${olympiadId}`).catch(() => api.get(`/olympiad/admin/olympiads/${olympiadId}`)),
        api.get('/auth/me'),
        api.get('/olympiad/student/registrations').catch(() => ({ data: { data: [] } })),
      ]);

      setOlympiad(o.data.data);
      const currentUser = u.data.user || u.data.data;
      setUser(currentUser);

      const allRegs = regs.data.data || [];
      const existing = allRegs.find(r => r.olympiadId === olympiadId);

      if (existing) {
        setExistingReg(existing);
        setClassSelected(existing.classSelected);
        setFormData({
          dob: existing.dob || '',
          gender: existing.gender || 'male',
          fatherName: existing.fatherName || '',
          address: existing.address || '',
          board: existing.board || 'JAC',
          medium: existing.medium || 'Hindi',
          schoolType: existing.schoolType || 'private',
          schoolName: existing.schoolName || '',
          schoolAddress: existing.schoolAddress || '',
          documentType: existing.documentType || 'Aadhaar Card',
          documentNumber: existing.documentNumber || '',
        });

        if (existing.documentUrl) {
          setDocPreview(existing.documentUrl);
        }

        if (existing.schoolIdCardUrl) {
          setSchoolIdCardPreview(existing.schoolIdCardUrl);
        }

        const initialPhoto = existing.studentPhotoUrl || currentUser?.avatar;
        if (initialPhoto) {
          setPhotoPreview(initialPhoto);
        }

        if (existing.paymentStatus === 'paid') {
          setRollNumber(existing.rollNumber || '');
          setRegId(existing.id);
          setRegistered(true);
        } else {
          // If registration was already submitted, go directly to Step 3 (Verification & Payment)
          setStep(3);
        }
      }
    } catch {
      toast.error('Olympiad not found or registration is closed');
      navigate('/student/olympiad', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!olympiadId || olympiadId === 'undefined') {
      navigate('/student/olympiad', { replace: true });
      return;
    }
    loadData();
  }, [olympiadId]);

  // Handle document file selection (Strict: JPEG or PNG only, Maximum 500 KB)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const isAllowedFormat = ['.jpg', '.jpeg', '.png'].includes(ext) || ['image/jpeg', 'image/png'].includes(file.type);
    if (!isAllowedFormat) {
      toast.error('Document must be in JPEG or PNG format only (PDF is not allowed)');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 500 * 1024) {
      toast.error(`Document size must be maximum 500 KB (selected file is ${(file.size / 1024).toFixed(1)} KB)`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setDocFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setDocPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  // Handle School ID Card file selection (Strict: JPEG or PNG only, Maximum 500 KB)
  const handleSchoolIdCardChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const isAllowedFormat = ['.jpg', '.jpeg', '.png'].includes(ext) || ['image/jpeg', 'image/png'].includes(file.type);
    if (!isAllowedFormat) {
      toast.error('School ID Card must be in JPEG or PNG format only');
      if (schoolIdCardInputRef.current) schoolIdCardInputRef.current.value = '';
      return;
    }

    if (file.size > 500 * 1024) {
      toast.error(`School ID Card size must be maximum 500 KB (selected file is ${(file.size / 1024).toFixed(1)} KB)`);
      if (schoolIdCardInputRef.current) schoolIdCardInputRef.current.value = '';
      return;
    }

    setSchoolIdCardFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setSchoolIdCardPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  // Handle student photograph selection and trigger cropper modal (JPEG/PNG only, max 100 KB)
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const isAllowedFormat = ['.jpg', '.jpeg', '.png'].includes(ext) || ['image/jpeg', 'image/png'].includes(file.type);
    if (!isAllowedFormat) {
      toast.error('Student photo must be in JPEG or PNG format only');
      return;
    }

    // Load photo in cropper (which will crop to passport ratio and compress to <= 100 KB)
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRawPhotoSrc(ev.target.result);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle saving cropped photo from PhotoCropModal
  const handleCropApply = (croppedFile, previewUrl) => {
    if (croppedFile.size > 100 * 1024) {
      toast.error(`Passport photograph must be under 100 KB (cropped size: ${(croppedFile.size / 1024).toFixed(1)} KB)`);
      return;
    }
    setPhotoFile(croppedFile);
    setPhotoPreview(previewUrl);
    toast.success('Passport photo attached successfully (under 100 KB)!');
  };

  // Submit Step 1 & 2: Details + Documents for admin verification
  const handleSubmitVerification = async () => {
    if (!formData.fatherName.trim()) {
      toast.error("Please enter Father's Name");
      return;
    }
    if (!formData.dob) {
      toast.error('Please enter Date of Birth');
      return;
    }
    if (!formData.schoolName.trim()) {
      toast.error('Please enter School Name');
      return;
    }
    if (!formData.schoolAddress.trim()) {
      toast.error('Please enter School Address');
      return;
    }
    if (!formData.address.trim()) {
      toast.error('Please enter residential address');
      return;
    }
    if (!formData.board) {
      toast.error('Please select educational board');
      return;
    }
    if (!formData.medium) {
      toast.error('Please select medium of study');
      return;
    }
    if (!photoFile && !existingReg?.studentPhotoUrl) {
      toast.error('Please upload student passport-size photograph (Max 100 KB)');
      return;
    }
    if (!formData.documentNumber.trim()) {
      toast.error('Please enter Document / ID number');
      return;
    }
    if (!docFile && !existingReg?.documentUrl) {
      toast.error('Please upload your identity document (Max 500 KB, JPEG or PNG)');
      return;
    }
    if (formData.schoolType === 'govt' && !schoolIdCardFile && !existingReg?.schoolIdCardUrl) {
      toast.error('Government School ID Card is mandatory for Government school students');
      return;
    }

    setProcessing(true);
    try {
      const data = new FormData();
      data.append('olympiadId', olympiadId);
      data.append('classSelected', classSelected);
      data.append('dob', formData.dob);
      data.append('gender', formData.gender);
      data.append('fatherName', formData.fatherName.trim());
      data.append('address', formData.address.trim());
      data.append('board', formData.board);
      data.append('medium', formData.medium);
      data.append('schoolType', formData.schoolType);
      data.append('schoolName', formData.schoolName.trim());
      data.append('schoolAddress', formData.schoolAddress.trim());
      data.append('documentType', formData.documentType);
      data.append('documentNumber', formData.documentNumber.trim());

      if (docFile) {
        data.append('document', docFile);
      }
      if (photoFile) {
        data.append('photo', photoFile);
      }
      if (formData.schoolType === 'govt' && schoolIdCardFile) {
        data.append('schoolIdCard', schoolIdCardFile);
      }

      const res = await api.post('/olympiad/student/submit-verification', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Registration details, photo & documents submitted for verification!');
      setExistingReg(res.data.data);
      if (res.data?.data?.studentPhotoUrl) {
        setPhotoPreview(res.data.data.studentPhotoUrl);
      }
      if (res.data?.data?.schoolIdCardUrl) {
        setSchoolIdCardPreview(res.data.data.schoolIdCardUrl);
      }
      setStep(3);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to submit verification details');
    } finally {
      setProcessing(false);
    }
  };

  // Razorpay Loader
  const loadRazorpay = () => new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

  const onPaymentSuccess = (rollNo, registrationId) => {
    setRollNumber(rollNo);
    setRegId(registrationId);
    setRegistered(true);
  };

  const handlePay = async () => {
    if (existingReg?.verificationStatus !== 'approved') {
      toast.error('Your identity document must be verified and approved by admin before payment.');
      return;
    }

    setProcessing(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) { toast.error('Payment gateway failed to load'); setProcessing(false); return; }

      const r = await api.post('/olympiad/student/register', { olympiadId, classSelected });
      const d = r.data.data;

      const rzp = new window.Razorpay({
        key:         d.key,
        amount:      d.amount,
        currency:    d.currency,
        name:        'Abhyo Olympiad',
        description: d.olympiadTitle,
        order_id:    d.orderId,
        prefill: { name: d.studentName, email: d.studentEmail, contact: d.studentMobile },
        theme: { color: '#6366f1' },
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/olympiad/student/payment/verify', {
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              olympiadId,
            });
            const { rollNumber: roll, registrationId } = verifyRes.data.data;
            onPaymentSuccess(roll, registrationId);
          } catch {
            toast.error('Payment verification failed. Please contact support.');
            setProcessing(false);
          }
        },
        modal: { ondismiss: () => setProcessing(false) },
      });
      rzp.open();
    } catch (e) {
      const msg = e.response?.data?.error || '';
      if (msg.includes('already registered')) {
        toast.success('You are already registered! View your registration on the dashboard.');
        navigate('/student/olympiad', { replace: true });
      } else {
        toast.error(msg || 'Failed to initiate payment');
        setProcessing(false);
      }
    }
  };

  // ─── Loading ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!olympiad) return null;

  // ─── Payment & Registration Successfully Done Screen ──────────────
  if (registered) {
    const handleCopyRoll = () => {
      if (rollNumber) {
        navigator.clipboard.writeText(rollNumber);
        setCopiedRoll(true);
        toast.success('Roll Number copied to clipboard!');
        setTimeout(() => setCopiedRoll(false), 2200);
      }
    };

    return (
      <div className="max-w-xl mx-auto py-2">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
          {/* Celebratory Gradient Banner */}
          <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-700 p-8 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-3 ring-4 ring-white/30 animate-pulse">
                <CheckCircle className="w-9 h-9 text-white stroke-[2]" />
              </div>
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full mb-1">
                Payment Received & Verified
              </span>
              <h1 className="text-2xl font-black tracking-tight mb-1">Registration Successfully Done!</h1>
              <p className="text-white/90 text-xs font-normal max-w-sm mx-auto">
                Your payment is captured and your seat is officially confirmed for the National Olympiad.
              </p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Roll Number Card with Copy */}
            <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/70 border border-indigo-100 rounded-2xl p-5 text-center relative">
              <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider block mb-1">
                Your Official Roll Number
              </span>
              <div className="flex items-center justify-center gap-2">
                <p className="text-2xl sm:text-3xl font-black text-indigo-700 tracking-wider font-mono">
                  {rollNumber}
                </p>
                <button
                  type="button"
                  onClick={handleCopyRoll}
                  className="p-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors shadow-2xs"
                  title="Copy Roll Number"
                >
                  {copiedRoll ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Keep this safe — required for online exam login & admit card verification</p>
            </div>

            {/* Key Enrollment Information */}
            <div className="space-y-2 border-y border-slate-100 py-3 text-xs">
              {[
                { icon: Trophy,   label: 'Olympiad Title', value: olympiad.title },
                { icon: BookOpen, label: 'Subject',        value: olympiad.subject?.name },
                {
                  icon: School,
                  label: 'Selected Class',
                  value: `Class ${classSelected}`,
                  badge: 'Enrolled Class'
                },
                { icon: Calendar, label: 'Exam Date',      value: olympiad.examDate ? new Date(olympiad.examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBD' },
                { icon: Clock,    label: 'Duration',       value: `${olympiad.examDurationMinutes} minutes · ${olympiad.totalQuestions || 40} Questions` },
                {
                  icon: CreditCard,
                  label: 'Payment Status',
                  value: `₹${olympiad.registrationFee} (Successful & Verified)`,
                  color: 'text-emerald-700 font-bold'
                },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-3 py-1.5 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
                    <row.icon className="w-3.5 h-3.5 stroke-[1.5]" />
                  </div>
                  <span className="text-slate-500 flex-1">{row.label}</span>
                  <div className="flex items-center gap-1.5">
                    {row.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                        {row.badge}
                      </span>
                    )}
                    <span className={`font-semibold ${row.color || 'text-slate-800'}`}>
                      {row.value || '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Next Step Information Callout */}
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex gap-3">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 space-y-1">
                <p className="font-bold">Next Steps Unlocked:</p>
                <p className="text-amber-800 leading-relaxed font-normal">
                  Your <strong>Class {classSelected} syllabus</strong> and <strong>official preparatory mock tests</strong> are now available in your preparation portal. Practice now to benchmark your rank!
                </p>
              </div>
            </div>

            {/* Actions: Primary CTA -> Class Syllabus & Mock Tests; Secondary -> Admit Card */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => navigate(`/student/olympiad/preparation/${regId}`)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
              >
                <span>Proceed to Class {classSelected} Syllabus & Mock Tests</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => navigate(`/student/olympiad/admit-card/${regId}`)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Admit Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/student/olympiad')}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Go to Dashboard</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Registration Multi-Step Form ──────────────────────────────────
  const eligible = olympiad.eligibleClasses || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-medium text-slate-800 text-lg flex items-center gap-2">
            <Trophy className="w-4 h-4 text-indigo-600 stroke-[1.5]" /> Register for Olympiad
          </h1>
          <p className="text-slate-400 text-xs font-normal">{olympiad.title}</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-1">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 text-xs transition-all ${
                i === step ? 'text-indigo-600 font-medium' : i < step ? 'text-emerald-600 font-normal' : 'text-slate-400 font-normal'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                  i < step  ? 'bg-emerald-500 text-white font-normal' :
                  i === step ? 'bg-indigo-600 text-white font-medium ring-2 ring-indigo-100' :
                  'bg-slate-100 text-slate-400 font-normal'
                }`}>
                  {i < step ? <Check className="w-3.5 h-3.5 stroke-[2]" /> : i + 1}
                </div>
                <span className="hidden md:inline">{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 rounded-full mx-1 transition-all ${i < step ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ─── STEP 0: Select Class ─── */}
      {step === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-base font-medium text-slate-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600 stroke-[1.5]" /> Step 1: Select Your Class
            </h2>
            <p className="text-xs font-normal text-slate-400 mt-1">
              Choose the class you are currently studying in. Eligibility: Class {eligible.join(', ')}.
            </p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {eligible.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setClassSelected(c)}
                className={`h-14 rounded-2xl transition-all flex flex-col items-center justify-center ${
                  classSelected === c
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-100 ring-1 ring-indigo-500'
                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/30'
                }`}
              >
                <span className="text-[10px] uppercase font-normal opacity-70">Class</span>
                <span className="text-base font-semibold">{c}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={!classSelected}
            onClick={() => setStep(1)}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-sm hover:shadow-md transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            Continue to Student Details <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── STEP 1: Student Details ─── */}
      {step === 1 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-base font-medium text-slate-800 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600 stroke-[1.5]" /> Step 2: Student Information
            </h2>
            <p className="text-xs font-normal text-slate-400 mt-1">
              Please enter your accurate academic & personal details for Olympiad records & admit card.
            </p>
          </div>

          {/* Account Profile Summary (Prefilled) */}
          <div className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-4">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">Account Profile</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-normal">Student Name:</span>
                <p className="font-medium text-slate-800 text-sm mt-0.5">{user?.name || '—'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-normal">Selected Class:</span>
                <p className="font-medium text-indigo-600 text-sm mt-0.5">Class {classSelected}</p>
              </div>
              <div>
                <span className="text-slate-400 font-normal">Email:</span>
                <p className="font-normal text-slate-600 truncate mt-0.5">{user?.email || '—'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-normal">Mobile:</span>
                <p className="font-normal text-slate-600 mt-0.5">{user?.mobile || '—'}</p>
              </div>
            </div>
          </div>

          {/* Detailed Input Fields */}
          <div className="space-y-4">
            {/* Father's Name */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Father's Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.fatherName}
                onChange={e => setFormData({ ...formData, fatherName: e.target.value })}
                placeholder="Enter father's full name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-normal text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-300"
              />
            </div>

            {/* DOB & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  value={formData.dob}
                  onChange={e => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-normal text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Gender <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['male', 'female', 'other'].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: g })}
                      className={`py-2 rounded-xl text-xs font-normal capitalize transition-all border ${
                        formData.gender === g
                          ? 'bg-indigo-600 text-white border-indigo-600 font-medium'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Educational Board & Medium */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-indigo-500 stroke-[1.5]" /> Educational Board <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.board}
                  onChange={e => setFormData({ ...formData, board: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-normal text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                >
                  {BOARDS.map(b => (
                    <option key={b.id} value={b.id}>{b.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Medium of Study <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Hindi', label: '🇮🇳 Hindi' },
                    { id: 'English', label: '🌐 English' },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, medium: m.id })}
                      className={`py-2 rounded-xl text-xs transition-all border ${
                        formData.medium === m.id
                          ? 'bg-indigo-600 text-white border-indigo-600 font-medium'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 font-normal'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* School Type (Govt vs Private) */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-indigo-500 stroke-[1.5]" /> School Type <span className="text-red-500">*</span>
                </span>
                {formData.schoolType === 'govt' ? (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    🎁 100% Free for Govt School Students
                  </span>
                ) : (
                  <span className="text-[10px] font-normal text-slate-400">
                    Standard Registration
                  </span>
                )}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, schoolType: 'govt' })}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    formData.schoolType === 'govt'
                      ? 'bg-emerald-50/70 border-emerald-400 ring-1 ring-emerald-400 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                      🏛️ Government School
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      100% FREE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal">
                    State / Central Govt School (School ID Card mandatory for free waiver)
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, schoolType: 'private' })}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    formData.schoolType === 'private'
                      ? 'bg-indigo-50/70 border-indigo-400 ring-1 ring-indigo-400 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                      🏢 Private School
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                      Standard
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Private / Public / Convent / International School
                  </p>
                </button>
              </div>
            </div>

            {/* School Name & School Address (Mandatory for both options) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-indigo-500 stroke-[1.5]" /> School Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.schoolName}
                  onChange={e => setFormData({ ...formData, schoolName: e.target.value })}
                  placeholder={formData.schoolType === 'govt' ? "e.g. Govt. High School / Kendriya Vidyalaya..." : "e.g. St. Xavier's / DPS / Model School..."}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-normal text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500 stroke-[1.5]" /> School Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.schoolAddress}
                  onChange={e => setFormData({ ...formData, schoolAddress: e.target.value })}
                  placeholder="School location, city, block, district"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-normal text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-500 stroke-[1.5]" /> Residential Address <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Village / Town, Ward / Street, Post Office, District, State, PIN Code"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-normal text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none placeholder:text-slate-300"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-normal text-xs hover:bg-slate-50 transition-all"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (!formData.fatherName.trim()) { toast.error("Please enter Father's Name"); return; }
                if (!formData.dob) { toast.error('Please enter Date of Birth'); return; }
                if (!formData.schoolName.trim()) { toast.error('Please enter School Name'); return; }
                if (!formData.schoolAddress.trim()) { toast.error('Please enter School Address'); return; }
                if (!formData.address.trim()) { toast.error('Please enter residential address'); return; }
                setStep(2);
              }}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              Continue to Document Upload <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 2: Identity Document & Photo Upload ─── */}
      {step === 2 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-base font-medium text-slate-800 flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-600 stroke-[1.5]" /> Step 3: Student Photo & Identity Document Upload
            </h2>
            <p className="text-xs font-normal text-slate-400 mt-1">
              Upload passport photograph (max 100 KB) and identity documents (JPEG/PNG only, max 500 KB) for verification.
            </p>
          </div>

          {/* Student Photograph (Passport Size) & Crop Tool */}
          <div className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-indigo-600" />
                    Student Photograph (Passport Size) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold">
                    Max 100 KB • JPEG / PNG
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                  Upload a clear passport-size photo for your official Admit Card & Certificate (Maximum file size: 100 KB)
                </p>
              </div>
            </div>

            <input
              type="file"
              ref={photoInputRef}
              onChange={handlePhotoSelect}
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
            />

            {!photoPreview ? (
              <div
                onClick={() => photoInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 rounded-xl p-5 text-center cursor-pointer transition-all group flex flex-col items-center justify-center"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <Camera className="w-5 h-5 stroke-[1.5]" />
                </div>
                <p className="font-semibold text-slate-800 text-xs">
                  Click to upload student photograph
                </p>
                <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                  JPEG or PNG only • Maximum 100 KB • Built-in Passport Crop (3:4) & Light Adjustment
                </p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-4 shadow-sm">
                <div className="relative group flex-shrink-0">
                  <img
                    src={typeof photoPreview === 'string' && photoPreview.startsWith('/uploads') ? getImageUrl(photoPreview) : photoPreview}
                    alt="Student Passport"
                    className="w-14 h-18 rounded-lg object-cover border-2 border-indigo-100 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const src = rawPhotoSrc || (typeof photoPreview === 'string' && photoPreview.startsWith('/uploads') ? getImageUrl(photoPreview) : photoPreview);
                      setRawPhotoSrc(src);
                      setShowCropModal(true);
                    }}
                    className="absolute inset-0 bg-black/50 text-white rounded-lg flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-medium cursor-pointer"
                  >
                    <Crop className="w-3.5 h-3.5 mb-0.5" />
                    <span>Crop</span>
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-slate-800 text-xs truncate">
                      {photoFile?.name || 'Passport Photograph Attached'}
                    </p>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold flex items-center gap-0.5">
                      <CheckCircle className="w-2.5 h-2.5" /> Ready (≤ 100 KB)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                    Passport ratio (3:4) formatted for official admit card printing
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const src = rawPhotoSrc || (typeof photoPreview === 'string' && photoPreview.startsWith('/uploads') ? getImageUrl(photoPreview) : photoPreview);
                        setRawPhotoSrc(src);
                        setShowCropModal(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
                    >
                      <Crop className="w-3 h-3" />
                      <span>Crop & Adjust</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg text-xs font-normal text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null); setRawPhotoSrc(null); }}
                      className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove photo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Document Number Input Box */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Document / Identification Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.documentNumber}
              onChange={e => setFormData({ ...formData, documentNumber: e.target.value })}
              placeholder="e.g. 12-digit Aadhaar Number / Student ID / Registration No."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-normal text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-300"
            />
          </div>

          {/* Document Type Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">
              Select Document Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['Aadhaar Card', 'School ID Card', 'Birth Certificate', 'Other Govt ID'].map(dtype => (
                <button
                  key={dtype}
                  type="button"
                  onClick={() => setFormData({ ...formData, documentType: dtype })}
                  className={`p-2.5 rounded-xl text-xs text-left transition-all border ${
                    formData.documentType === dtype
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-medium'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-normal'
                  }`}
                >
                  {dtype}
                </button>
              ))}
            </div>
          </div>

          {/* Identity Document Upload Area (Max 500 KB, JPEG or PNG only) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-slate-600">
                Upload {formData.documentType} File <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                JPEG or PNG only • Max 500 KB
              </span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
            />

            {!docPreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20 rounded-2xl p-7 text-center cursor-pointer transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                  <Upload className="w-5 h-5 stroke-[1.5]" />
                </div>
                <p className="font-medium text-slate-700 text-xs">
                  Click to browse or upload {formData.documentType}
                </p>
                <p className="text-[11px] font-normal text-slate-400 mt-1">JPEG or PNG format only • Maximum 500 KB (PDF not accepted)</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/70 flex items-center gap-3.5">
                <img
                  src={typeof docPreview === 'string' && docPreview.startsWith('/uploads') ? getImageUrl(docPreview) : docPreview}
                  alt="Document preview"
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-xs truncate">
                    {docFile?.name || `${formData.documentType} uploaded`}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-normal flex items-center gap-1 mt-0.5">
                    <CheckCircle className="w-3 h-3 stroke-[1.5]" /> Ready for verification
                  </p>
                  {docFile && (
                    <p className="text-[10px] text-slate-400 font-normal mt-0.5">{(docFile.size / 1024).toFixed(1)} KB (Max 500 KB)</p>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-normal text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDocFile(null); setDocPreview(null); }}
                    className="p-1.5 rounded-lg text-xs text-rose-500 bg-rose-50 hover:bg-rose-100 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mandatory School ID Card Upload (ONLY if Govt School selected) */}
          {formData.schoolType === 'govt' && (
            <div className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-300 bg-emerald-50/40 space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <School className="w-4 h-4 stroke-[1.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-emerald-950">
                      Government School ID Card <span className="text-red-500">* Mandatory for 100% Free Waiver</span>
                    </label>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-semibold">
                      Max 500 KB • JPEG / PNG
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 font-normal mt-0.5">
                    Because you selected <strong>Government School</strong>, uploading your official School ID Card is strictly mandatory. The admin will verify this document to grant your 100% Free registration waiver.
                  </p>
                </div>
              </div>

              <input
                type="file"
                ref={schoolIdCardInputRef}
                onChange={handleSchoolIdCardChange}
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
              />

              {!schoolIdCardPreview ? (
                <div
                  onClick={() => schoolIdCardInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/50 rounded-xl p-5 text-center cursor-pointer transition-all group flex flex-col items-center justify-center"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                    <Upload className="w-5 h-5 stroke-[1.5]" />
                  </div>
                  <p className="font-semibold text-emerald-900 text-xs">
                    Click to upload Government School ID Card *
                  </p>
                  <p className="text-[11px] text-emerald-700 font-normal mt-0.5">
                    Supports JPEG or PNG format only • Maximum 500 KB
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-emerald-300 rounded-xl p-3.5 flex items-center gap-3.5 shadow-sm">
                  <img
                    src={typeof schoolIdCardPreview === 'string' && schoolIdCardPreview.startsWith('/uploads') ? getImageUrl(schoolIdCardPreview) : schoolIdCardPreview}
                    alt="School ID preview"
                    className="w-12 h-12 rounded-xl object-cover border border-emerald-200 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-xs truncate">
                      {schoolIdCardFile?.name || 'Government School ID Card Attached'}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                      <CheckCircle className="w-3 h-3 stroke-[1.5]" /> Ready for Admin School Verification
                    </p>
                    {schoolIdCardFile && (
                      <p className="text-[10px] text-slate-400 font-normal mt-0.5">{(schoolIdCardFile.size / 1024).toFixed(1)} KB (Max 500 KB)</p>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => schoolIdCardInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 transition-colors"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSchoolIdCardFile(null); setSchoolIdCardPreview(null); }}
                      className="p-1.5 rounded-lg text-xs text-rose-500 bg-rose-50 hover:bg-rose-100 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Privacy & Admin Verification Note */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-3.5 flex gap-2.5 text-xs text-blue-800">
            <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5 stroke-[1.5]" />
            <div className="font-normal">
              <p className="font-medium text-blue-900 mb-0.5">Admin Document Verification</p>
              <p className="text-blue-700/80">
                {formData.schoolType === 'govt'
                  ? 'Our admin team will carefully check your Government School ID Card and document details. Once verified, your Olympiad seat will be activated 100% FREE OF COST.'
                  : 'Once submitted, our admin team will review your identity document and details. After approval by admin, the payment option will be unlocked.'}
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-normal text-xs hover:bg-slate-50 transition-all"
            >
              Back
            </button>
            <button
              type="button"
              disabled={
                processing ||
                (!docFile && !existingReg?.documentUrl) ||
                (!photoFile && !existingReg?.studentPhotoUrl && !photoPreview) ||
                (formData.schoolType === 'govt' && !schoolIdCardFile && !existingReg?.schoolIdCardUrl)
              }
              onClick={handleSubmitVerification}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-xs hover:shadow-md transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              {processing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting to Admin...
                </>
              ) : (
                <>Submit for Admin Verification →</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 3: Verification & Payment ─── */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Status State A: Verification Pending */}
          {(!existingReg || existingReg.verificationStatus === 'pending') && (
            <div className="bg-white rounded-3xl border border-amber-200/80 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-6 text-white text-center">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-2.5 ring-2 ring-white/20">
                  <Clock className="w-6 h-6 text-white stroke-[1.5]" />
                </div>
                <h2 className="text-lg font-medium">Under Admin Verification</h2>
                <p className="text-white/80 text-xs font-normal mt-0.5">
                  {(formData.schoolType || existingReg?.schoolType) === 'govt'
                    ? 'Your Government School ID Card and document details are under admin review for 100% Free Waiver.'
                    : `Your registration details & ${formData.documentType || 'document'} have been submitted to the admin team.`}
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-3.5 flex gap-2.5 text-xs text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5 stroke-[1.5]" />
                  <div className="font-normal">
                    <p className="font-medium text-amber-900 mb-0.5">Verification in Progress</p>
                    <p className="text-amber-700/80">
                      {(formData.schoolType || existingReg?.schoolType) === 'govt'
                        ? 'The administrator is verifying your Government School ID Card. Upon approval, your registration is completely free of cost and your Roll Number will be generated automatically.'
                        : 'The administrator is verifying your identity document. Once approved, the payment option will be enabled automatically. You can click "Refresh Status" below to check for approval.'}
                    </p>
                  </div>
                </div>

                {/* Submitted details summary */}
                <div className="border border-slate-200/80 rounded-2xl p-4 divide-y divide-slate-100">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider pb-2">Submitted Details</p>
                  <div className="grid grid-cols-2 gap-3 py-2 text-xs">
                    <div>
                      <span className="text-slate-400 font-normal">Student Name:</span>
                      <p className="font-medium text-slate-700">{user?.name}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-normal">Father's Name:</span>
                      <p className="font-medium text-slate-700">{formData.fatherName || existingReg?.fatherName}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-normal">School Type:</span>
                      <p className="font-semibold text-slate-800">
                        {(formData.schoolType || existingReg?.schoolType) === 'govt' ? (
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block text-[11px]">
                            🏛️ Government School (100% Free)
                          </span>
                        ) : (
                          <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full inline-block text-[11px]">
                            🏢 Private School
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-normal">School Name:</span>
                      <p className="font-medium text-slate-700 truncate">{formData.schoolName || existingReg?.schoolName || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-normal">DOB & Gender:</span>
                      <p className="font-medium text-slate-700">{formData.dob || existingReg?.dob} · {formData.gender || existingReg?.gender}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-normal">Class & Board:</span>
                      <p className="font-medium text-slate-700">Class {classSelected} · {formData.board || existingReg?.board}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-normal">Document & Number:</span>
                      <p className="font-medium text-indigo-600 flex items-center gap-1 truncate">
                        <FileText className="w-3.5 h-3.5 stroke-[1.5] shrink-0" /> {formData.documentType || existingReg?.documentType} ({formData.documentNumber || existingReg?.documentNumber || '—'})
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-normal">Student Photo:</span>
                      {(existingReg?.studentPhotoUrl || photoPreview) ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <img
                            src={typeof (existingReg?.studentPhotoUrl || photoPreview) === 'string' && (existingReg?.studentPhotoUrl || photoPreview).startsWith('/uploads') ? getImageUrl(existingReg?.studentPhotoUrl || photoPreview) : (existingReg?.studentPhotoUrl || photoPreview)}
                            alt="Student Photo"
                            className="w-6 h-8 object-cover rounded border border-indigo-200"
                          />
                          <span className="font-medium text-emerald-600 text-xs">Attached (≤100KB)</span>
                        </div>
                      ) : (
                        <p className="font-normal text-slate-400">Not provided</p>
                      )}
                    </div>
                    {((formData.schoolType || existingReg?.schoolType) === 'govt' && (existingReg?.schoolIdCardUrl || schoolIdCardPreview)) && (
                      <div className="col-span-2 pt-1 border-t border-slate-100">
                        <span className="text-slate-400 font-normal block">Government School ID Card:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <img
                            src={typeof (existingReg?.schoolIdCardUrl || schoolIdCardPreview) === 'string' && (existingReg?.schoolIdCardUrl || schoolIdCardPreview).startsWith('/uploads') ? getImageUrl(existingReg?.schoolIdCardUrl || schoolIdCardPreview) : (existingReg?.schoolIdCardUrl || schoolIdCardPreview)}
                            alt="Govt School ID"
                            className="w-10 h-10 object-cover rounded-lg border border-emerald-200 shadow-xs"
                          />
                          <span className="font-semibold text-emerald-700 text-xs flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Attached for Free Waiver Review
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment or Free Exemption Preview */}
                {(formData.schoolType || existingReg?.schoolType) === 'govt' ? (
                  <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <span className="text-xs font-semibold text-emerald-900">Registration Fee</span>
                        <p className="text-[11px] text-emerald-700 font-normal">Government School 100% Free Waiver</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs line-through text-slate-400 mr-2">₹{olympiad.registrationFee}</span>
                        <span className="text-lg font-bold text-emerald-700">₹0 (FREE)</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal mb-3">
                      Once your Government School ID is verified and approved by admin, your seat and Roll Number will be confirmed automatically without any fee payment.
                    </p>
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl bg-emerald-200/70 text-emerald-900 font-semibold text-xs cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5 stroke-[1.5]" /> Free Enrollment (Awaiting Admin ID Check)
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-normal text-slate-500">Registration Fee</span>
                      <span className="text-lg font-semibold text-slate-800">₹{olympiad.registrationFee}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-normal mb-3">
                      Fee payment unlocks admit card, roll number, and exam portal access.
                    </p>
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl bg-slate-200/70 text-slate-400 font-medium text-xs cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5 stroke-[1.5]" /> Payment Locked (Awaiting Admin Verification)
                    </button>
                  </div>
                )}

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-normal text-xs hover:bg-slate-50 transition-all"
                  >
                    Edit Submitted Details
                  </button>
                  <button
                    type="button"
                    onClick={loadData}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-normal text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <RefreshCw className="w-3 h-3 stroke-[1.5]" /> Refresh Status
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Status State B: Verification Approved -> Payment ENABLED! */}
          {existingReg && existingReg.verificationStatus === 'approved' && (
            <div className="bg-white rounded-3xl border border-emerald-200/80 shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white text-center">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-2.5 ring-2 ring-white/20">
                  <ShieldCheck className="w-6 h-6 text-white stroke-[1.5]" />
                </div>
                <h2 className="text-lg font-medium">Identity Document Verified & Approved!</h2>
                <p className="text-white/80 text-xs font-normal mt-0.5">
                  The admin has approved your details. Proceed to payment to confirm your seat.
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-2xl p-4 border border-indigo-100/70">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-[11px] font-medium text-indigo-500 uppercase tracking-wider">Registration Fee</span>
                      <h3 className="text-2xl font-semibold text-indigo-700">₹{olympiad.registrationFee}</h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-normal border border-emerald-200 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 stroke-[1.5]" /> Approved for Payment
                    </span>
                  </div>

                  <div className="space-y-1.5 border-t border-indigo-100/60 pt-2.5 text-xs text-slate-600 font-normal">
                    <div className="flex justify-between"><span>Olympiad:</span><span className="font-medium text-slate-800">{olympiad.title}</span></div>
                    <div className="flex justify-between"><span>Subject:</span><span className="font-medium text-slate-800">{olympiad.subject?.name}</span></div>
                    <div className="flex justify-between"><span>Class & Board:</span><span className="font-medium text-slate-800">Class {classSelected} ({formData.board || existingReg.board})</span></div>
                    <div className="flex justify-between"><span>Medium of Exam:</span><span className="font-medium text-slate-800">{formData.medium || existingReg.medium}</span></div>
                    <div className="flex justify-between"><span>Exam Date:</span><span className="font-medium text-slate-800">{olympiad.examDate ? new Date(olympiad.examDate).toLocaleDateString('en-IN') : 'TBD'}</span></div>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-700 font-normal">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5 stroke-[1.5]" />
                  <p>Payments are 100% secure via Razorpay. Your Roll Number and Admit Card will be generated instantly upon successful transaction.</p>
                </div>

                <button
                  type="button"
                  disabled={processing}
                  onClick={handlePay}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white font-medium text-sm shadow-md shadow-emerald-100 hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Opening Payment Gateway...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 stroke-[1.5]" /> Pay ₹{olympiad.registrationFee} & Confirm Seat
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Status State C: Verification Rejected */}
          {existingReg && existingReg.verificationStatus === 'rejected' && (
            <div className="bg-white rounded-3xl border border-red-200/80 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-rose-600 p-6 text-white text-center">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-2.5 ring-2 ring-white/20">
                  <ShieldAlert className="w-6 h-6 text-white stroke-[1.5]" />
                </div>
                <h2 className="text-lg font-medium">Verification Rejected</h2>
                <p className="text-white/80 text-xs font-normal mt-0.5">
                  The admin was unable to verify your submitted identity document.
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-rose-50/70 border border-rose-200/60 rounded-2xl p-4">
                  <p className="text-[11px] font-medium text-rose-700 uppercase tracking-wider mb-1">Admin Feedback / Remarks:</p>
                  <p className="text-xs font-normal text-rose-900">
                    {existingReg.verificationRemarks || 'The uploaded document was not clear or details did not match. Please re-upload a clear copy of your identity card.'}
                  </p>
                </div>

                <p className="text-xs font-normal text-slate-500">
                  Please update your details or upload a clear photo/scan of your Aadhaar card or School ID to re-submit for admin verification.
                </p>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-xs hover:shadow-md transition-all"
                >
                  Update Details & Re-upload Document →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Photo Crop & Adjust Modal */}
      <PhotoCropModal
        isOpen={showCropModal}
        imageSrc={rawPhotoSrc}
        onClose={() => setShowCropModal(false)}
        onApply={handleCropApply}
        aspectRatio={3 / 4}
      />
    </div>
  );
}
