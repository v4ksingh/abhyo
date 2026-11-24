import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Award, Download, QrCode, ArrowLeft, CheckCircle,
  ExternalLink, Star, Shield, Loader,

} from 'lucide-react';
import { jsPDF } from 'jspdf';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

/* ─── helpers ───────────────────────────────────────────────── */
const UPLOADS = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

function getAvatarUrl(avatar) {
  if (!avatar) return null;
  if (avatar.startsWith('http')) return avatar;
  return `${UPLOADS}/uploads/${avatar}`;
}

async function toBase64(url) {
  try {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

/* ══════════════════════════════════════════════════════════════
   The certificate template is configured PER-OLYMPIAD via the
   Admin Panel → Olympiad → Edit → "Certificate Template" section.
   If a template image is uploaded, it is used as the background;
   otherwise the built-in designed certificate is shown.
   Field overlay positions (% based) — adjust to match your template.
══════════════════════════════════════════════════════════════ */


/* Grade colour map (used in built-in design) */
const GRADE = {
  Gold:   { pill: 'bg-amber-50 ring-amber-400 text-amber-800',   medal: ['#F59E0B', '#FBBF24', '#FDE68A'] },
  Silver: { pill: 'bg-slate-50 ring-slate-400 text-slate-600',   medal: ['#94A3B8', '#CBD5E1', '#F1F5F9'] },
  Bronze: { pill: 'bg-orange-50 ring-orange-400 text-orange-700',medal: ['#F97316', '#FB923C', '#FFEDD5'] },
  Merit:  { pill: 'bg-indigo-50 ring-indigo-400 text-indigo-700',medal: ['#6366F1', '#818CF8', '#EEF2FF'] },
};
const gradeStyle = g => GRADE[g] || GRADE.Merit;

/* ─── Built-in corner flourish ──────────────────────────────── */
function Corner({ className }) {
  return (
    <svg className={className} width="64" height="64" viewBox="0 0 64 64" fill="none">
      <path d="M2 2L22 2Q32 2 32 12L32 32" stroke="#B8963E" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M2 2L2 22Q2 32 12 32L32 32" stroke="#B8963E" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <circle cx="2" cy="2" r="3.5" fill="#B8963E" />
      <path d="M9 9L18 9Q24 9 24 15L24 24" stroke="#B8963E" strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.55" />
    </svg>
  );
}

/* ─── Built-in Medal SVG ────────────────────────────────────── */
function Medal({ grade }) {
  const [c1, c2, c3] = (GRADE[grade] || GRADE.Merit).medal;
  const id = `mg${grade}`;
  return (
    <svg width="90" height="90" viewBox="0 0 90 90">
      <defs>
        <radialGradient id={id} cx="38%" cy="28%" r="62%">
          <stop offset="0%" stopColor={c3} /><stop offset="100%" stopColor={c1} />
        </radialGradient>
      </defs>
      <circle cx="45" cy="50" r="32" fill={`url(#${id})`} stroke={c1} strokeWidth="2.5" />
      <circle cx="45" cy="50" r="25" fill="none" stroke={c2} strokeWidth="1" strokeDasharray="4 3" />
      <polygon points="45,30 49,43 63,43 52,51 56,65 45,57 34,65 38,51 27,43 41,43"
        fill={c2} opacity="0.9" />
      <rect x="36" y="8" width="18" height="22" rx="5" fill={c1} />
      <rect x="39" y="6" width="12" height="5" rx="2.5" fill={c2} />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   CUSTOM TEMPLATE OVERLAY — renders data fields on top of image
   ══════════════════════════════════════════════════════════════ */
function CustomTemplateOverlay({ cert, avatarUrl, examDateFmt, grade }) {
  const p = FIELD_POSITIONS;
  return (
    <>
      {/* Student Name */}
      <div style={{ position: 'absolute', ...p.studentName }}>
        {cert.studentName}
      </div>

      {/* Olympiad Title */}
      <div style={{ position: 'absolute', ...p.olympiadTitle }}>
        {cert.olympiadTitle}
      </div>

      {/* Subject · Class · Date */}
      <div style={{ position: 'absolute', ...p.subjectClassDate }}>
        {cert.subjectName} · Class {cert.className} · {examDateFmt}
      </div>

      {/* Score */}
      <div style={{ position: 'absolute', ...p.score }}>
        {cert.obtainedMarks}/{cert.totalMarks}
        <div style={{ fontSize: 'clamp(6px,0.8vw,8px)', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>Score</div>
      </div>

      {/* Rank */}
      <div style={{ position: 'absolute', ...p.rank }}>
        {cert.nationalRank ? `#${cert.nationalRank}` : 'TBD'}
        <div style={{ fontSize: 'clamp(6px,0.8vw,8px)', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>Rank</div>
      </div>

      {/* Grade */}
      <div style={{ position: 'absolute', ...p.grade }}>
        {grade}
        <div style={{ fontSize: 'clamp(6px,0.8vw,8px)', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>Grade</div>
      </div>

      {/* Student Photo */}
      {avatarUrl && (
        <div style={{ position: 'absolute', ...p.photo, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(184,134,11,0.8)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
          <img src={avatarUrl} alt={cert.studentName} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.parentElement.style.display = 'none'; }} />
        </div>
      )}

      {/* Certificate ID */}
      <div style={{ position: 'absolute', ...p.certificateId }}>
        {cert.certificateId}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function OlympiadCertificate() {
  const { certId } = useParams();
  const navigate = useNavigate();
  const certRef = useRef(null);

  const [cert, setCert]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [dlLoading, setDlLoading] = useState(false);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    api.get(`/olympiad/student/certificate/${certId}`)
      .then(r => setCert(r.data.data))
      .catch(() => toast.error('Certificate not found'))
      .finally(() => setLoading(false));
  }, [certId]);

  const verifyUrl = `${window.location.origin}/olympiad/verify/${certId}`;

  /* ── jsPDF Download ───────────────────────────────────────── */
  const downloadPDF = async () => {
    if (!cert) return;
    setDlLoading(true);
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
      const W = 792, H = 612;
      const examDateFmt = cert.examDate
        ? new Date(cert.examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

      if (usingCustomTemplate) {
        /* ── CUSTOM TEMPLATE PDF ── */
        const templateB64 = await toBase64(window.location.origin + CUSTOM_TEMPLATE_PATH);
        if (templateB64) {
          doc.addImage(templateB64, 'PNG', 0, 0, W, H);
        }

        /* Overlay data at same proportional positions as screen */
        const fp = FIELD_POSITIONS;
        const pctToX = (pct) => (parseFloat(pct) / 100) * W;
        const pctToY = (pct) => (parseFloat(pct) / 100) * H;

        /* Student Name */
        doc.setFont('times', 'bolditalic');
        doc.setFontSize(36);
        doc.setTextColor(28, 42, 74);
        doc.text(cert.studentName || '', W / 2, pctToY('42'), { align: 'center' });

        /* Olympiad Title */
        doc.setFont('times', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(28, 42, 74);
        doc.text(cert.olympiadTitle || '', W / 2, pctToY('52'), { align: 'center', maxWidth: 500 });

        /* Subject · Class · Date */
        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100, 80, 50);
        doc.text(`${cert.subjectName || ''} · Class ${cert.className || ''} · ${examDateFmt}`, W / 2, pctToY('57'), { align: 'center' });

        /* Score */
        doc.setFont('times', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(28, 42, 74);
        doc.text(`${cert.obtainedMarks}/${cert.totalMarks}`, pctToX('37'), pctToY('66'), { align: 'center' });

        /* Rank */
        doc.text(cert.nationalRank ? `#${cert.nationalRank}` : 'TBD', pctToX('50'), pctToY('66'), { align: 'center' });

        /* Grade */
        doc.setTextColor(184, 134, 11);
        doc.text(cert.grade || 'Merit', pctToX('63'), pctToY('66'), { align: 'center' });

        /* Student Photo */
        const avatarUrl = getAvatarUrl(cert.studentAvatar);
        if (avatarUrl) {
          const avatarB64 = await toBase64(avatarUrl);
          if (avatarB64) {
            const px = W - pctToX('7') - 56;
            const py = pctToY('18') - 36;
            doc.circle(px + 36, py + 36, 36, 'S');
            doc.addImage(avatarB64, 'JPEG', px, py, 72, 72, '', 'FAST');
          }
        }

        /* Certificate ID */
        doc.setFont('courier', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(120, 80, 50);
        doc.text(`Certificate ID: ${cert.certificateId}`, W / 2, pctToY('86'), { align: 'center' });

      } else {
        /* ── BUILT-IN DESIGN PDF ── */
        doc.setFillColor(253, 250, 243);
        doc.roundedRect(0, 0, W, H, 0, 0, 'F');
        doc.setFillColor(220, 195, 120);
        for (let x = 30; x < W; x += 60)
          for (let y = 30; y < H; y += 60)
            doc.circle(x, y, 0.7, 'F');

        doc.setDrawColor(185, 150, 62); doc.setLineWidth(2.5);
        doc.roundedRect(16, 16, W - 32, H - 32, 6, 6, 'S');
        doc.setLineWidth(1); doc.setDrawColor(201, 168, 76, 0.5);
        doc.roundedRect(26, 26, W - 52, H - 52, 4, 4, 'S');
        doc.setFillColor(185, 150, 62);
        doc.rect(16, 16, W - 32, 6, 'F');
        doc.rect(16, H - 22, W - 32, 6, 'F');

        const logoB64 = await toBase64(window.location.origin + '/logo.png');
        if (logoB64) doc.addImage(logoB64, 'PNG', 50, 36, 88, 30);
        else { doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(99, 102, 241); doc.text('ABHYO', 50, 58); }

        const avatarUrl = getAvatarUrl(cert.studentAvatar);
        if (avatarUrl) {
          const avatarB64 = await toBase64(avatarUrl);
          if (avatarB64) {
            doc.setFillColor(255, 255, 255); doc.circle(W - 76, 64, 36, 'F');
            doc.setDrawColor(185, 150, 62); doc.setLineWidth(2); doc.circle(W - 76, 64, 36, 'S');
            doc.addImage(avatarB64, 'JPEG', W - 112, 28, 72, 72, '', 'FAST');
          }
        }

        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(180, 140, 60);
        doc.text('ABHYO  ·  EMPOWERING MINDS', W / 2, 46, { align: 'center', charSpace: 3 });
        doc.setFontSize(9); doc.setTextColor(201, 168, 76);
        doc.text('★  ★  ★  ★  ★', W / 2, 60, { align: 'center' });

        doc.setFont('times', 'bold'); doc.setFontSize(28); doc.setTextColor(30, 19, 71);
        doc.text('CERTIFICATE OF ACHIEVEMENT', W / 2, 100, { align: 'center', charSpace: 2 });
        doc.setDrawColor(201, 168, 76); doc.setLineWidth(1.2);
        doc.line(W / 2 - 130, 108, W / 2 + 130, 108);

        doc.setFont('times', 'italic'); doc.setFontSize(12); doc.setTextColor(150, 110, 50);
        doc.text('This is proudly presented to', W / 2, 132, { align: 'center' });

        doc.setFont('times', 'bold'); doc.setFontSize(36); doc.setTextColor(146, 64, 14);
        doc.text(cert.studentName || '', W / 2, 172, { align: 'center' });
        const nameW = doc.getTextWidth(cert.studentName || '');
        doc.setLineWidth(0.8); doc.setDrawColor(201, 168, 76);
        doc.line(W / 2 - nameW / 2, 178, W / 2 + nameW / 2, 178);

        doc.setFont('times', 'normal'); doc.setFontSize(12); doc.setTextColor(51, 51, 51);
        doc.text('For outstanding performance in the', W / 2, 202, { align: 'center' });
        doc.setFont('times', 'bold'); doc.setFontSize(14); doc.setTextColor(30, 19, 71);
        doc.text(cert.olympiadTitle || '', W / 2, 220, { align: 'center', maxWidth: 520 });
        doc.setFont('times', 'normal'); doc.setFontSize(10); doc.setTextColor(120, 100, 70);
        doc.text(
          `${cert.subjectName || ''} · Class ${cert.className || ''} · ${examDateFmt}`,
          W / 2, 238, { align: 'center' }
        );

        const boxes = [
          { label: 'Score', value: `${cert.obtainedMarks} / ${cert.totalMarks}` },
          { label: 'National Rank', value: cert.nationalRank ? `# ${cert.nationalRank}` : 'TBD' },
          { label: 'Grade', value: cert.grade || 'Merit' },
        ];
        const bW = 130, bH = 48, bY = 258, gap = 22;
        let bX = (W - (boxes.length * bW + (boxes.length - 1) * gap)) / 2;
        boxes.forEach(b => {
          doc.setFillColor(253, 248, 230); doc.setDrawColor(201, 168, 76); doc.setLineWidth(1);
          doc.roundedRect(bX, bY, bW, bH, 6, 6, 'FD');
          doc.setFont('times', 'bold'); doc.setFontSize(17); doc.setTextColor(146, 64, 14);
          doc.text(b.value, bX + bW / 2, bY + 24, { align: 'center' });
          doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(130, 100, 60);
          doc.text(b.label.toUpperCase(), bX + bW / 2, bY + 38, { align: 'center', charSpace: 1 });
          bX += bW + gap;
        });

        doc.setDrawColor(201, 168, 76); doc.setLineWidth(0.6);
        doc.line(80, 326, W - 80, 326);

        doc.setFillColor(99, 102, 241); doc.circle(120, 380, 30, 'F');
        doc.setFillColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
        doc.text('VERIFIED', 120, 378, { align: 'center', charSpace: 1 });
        doc.setFontSize(6.5); doc.text('ABHYO', 120, 388, { align: 'center', charSpace: 2 });

        doc.setFillColor(185, 150, 62); doc.circle(W - 120, 380, 30, 'F');
        doc.setFillColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
        doc.text('DIRECTOR', W - 120, 378, { align: 'center', charSpace: 0.5 });
        doc.setFontSize(6.5); doc.text('ABHYO', W - 120, 388, { align: 'center', charSpace: 2 });

        doc.setDrawColor(201, 168, 76); doc.setLineWidth(0.8);
        doc.line(220, 395, W - 220, 395);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(150, 120, 60);
        doc.text('Authorised Signature', W / 2, 406, { align: 'center' });

        doc.setFont('courier', 'normal'); doc.setFontSize(8); doc.setTextColor(120, 100, 70);
        doc.text(`Certificate ID: ${cert.certificateId}`, W / 2, 428, { align: 'center' });
        doc.setFontSize(7);
        doc.text(`Verify at: ${verifyUrl}`, W / 2, 440, { align: 'center' });

        doc.setFillColor(253, 248, 230);
        doc.rect(16, H - 56, W - 32, 36, 'F');
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(160, 130, 70);
        doc.text(
          'This certificate is issued by Abhyo Learning Pvt. Ltd. and is valid with the QR code verification above.',
          W / 2, H - 34, { align: 'center', maxWidth: 600 }
        );
      }

      doc.save(`Certificate-${cert.certificateId}.pdf`);
      toast.success('Certificate downloaded!');
    } catch (e) {
      console.error(e);
      toast.error('Download failed. Please try again.');
    }
    setDlLoading(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── loading / empty states ────────────────────────────── */
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!cert) return (
    <div className="text-center py-16 text-slate-400">
      <Award className="w-16 h-16 mx-auto mb-3 opacity-20" />
      <p>Certificate not found</p>
    </div>
  );

  const grade = cert.grade || 'Merit';
  const gStyle = gradeStyle(grade);
  const avatarUrl = getAvatarUrl(cert.studentAvatar);
  const examDateFmt = cert.examDate
    ? new Date(cert.examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">

      {/* ── Page header ──────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-black text-slate-900 text-xl flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" /> My Certificate
        </h1>

        {/* Template mode badge */}
        {cert?.certificateTemplate && (
          <span className="ml-2 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            ✦ Custom Template
          </span>
        )}

        <button onClick={downloadPDF} disabled={dlLoading}
          className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
          {dlLoading
            ? <><Loader className="w-4 h-4 animate-spin" /> Generating…</>
            : <><Download className="w-4 h-4" /> Download PDF</>}
        </button>
      </div>



      {/* ══════════════════════════════════════════════
           CERTIFICATE PREVIEW
         ══════════════════════════════════════════════ */}
      <div ref={certRef}
        className="relative overflow-hidden rounded-2xl shadow-2xl"
        style={{
          width: '100%',
          aspectRatio: '11 / 8.5',
          fontFamily: 'Georgia, "Times New Roman", serif',
          ...(cert?.certificateTemplate
            ? { background: '#fff' }
            : {
              background: 'linear-gradient(160deg, #fdfaf3 0%, #fef9ee 45%, #fdf6e3 100%)',
              border: '1px solid #dfc98a',
            }
          ),
        }}>

        {cert?.certificateTemplate ? (
          /* ── CUSTOM TEMPLATE MODE ── */
          <>
            {/* Template image as background */}
            <img
              src={cert.certificateTemplate}
              alt="Certificate Template"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }}
              draggable={false}
            />
            {/* Data overlay */}
            <CustomTemplateOverlay
              cert={cert}
              avatarUrl={avatarUrl}
              examDateFmt={examDateFmt}
              grade={grade}
            />
          </>
        ) : (
          /* ── BUILT-IN DESIGN MODE ── */
          <>
            {/* Dot watermark */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.035]"
              style={{
                backgroundImage: 'radial-gradient(circle, #92400e 1.2px, transparent 0)',
                backgroundSize: '48px 48px',
              }} />

            {/* Outer gold border */}
            <div className="absolute inset-3 rounded-xl pointer-events-none"
              style={{ border: '2.5px solid rgba(185,150,62,0.7)' }} />
            {/* Inner gold border */}
            <div className="absolute inset-5 rounded-lg pointer-events-none"
              style={{ border: '1px solid rgba(201,168,76,0.35)' }} />

            {/* Top gold bar */}
            <div className="absolute top-3 left-3 right-3 h-1.5 rounded-t-xl"
              style={{ background: 'linear-gradient(90deg,#B8963E,#F5D482,#B8963E)' }} />
            {/* Bottom gold bar */}
            <div className="absolute bottom-3 left-3 right-3 h-1.5 rounded-b-xl"
              style={{ background: 'linear-gradient(90deg,#B8963E,#F5D482,#B8963E)' }} />

            {/* Corners */}
            <Corner className="absolute top-3 left-3" />
            <Corner className="absolute top-3 right-3 scale-x-[-1]" />
            <Corner className="absolute bottom-3 left-3 scale-y-[-1]" />
            <Corner className="absolute bottom-3 right-3 scale-[-1]" />

            {/* ── Top row: logo + student photo ──────────── */}
            <div className="absolute top-8 left-0 right-0 flex items-start justify-between px-14 pt-2">
              <img src="/logo.png" alt="Abhyo" className="h-10 w-auto object-contain" />
              <div className="relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={cert.studentName}
                    className="w-16 h-16 rounded-full object-cover border-[3px] shadow-md"
                    style={{ borderColor: '#B8963E' }}
                    onError={e => { e.target.style.display = 'none'; }} />
                ) : (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black border-[3px] shadow-md"
                    style={{ borderColor: '#B8963E', background: 'linear-gradient(135deg,#C9A84C,#F5D482)', color: '#7c3700' }}>
                    {(cert.studentName || '?')[0].toUpperCase()}
                  </div>
                )}
                <div className="absolute -inset-1 rounded-full pointer-events-none"
                  style={{ border: '1px solid rgba(201,168,76,0.4)' }} />
              </div>
            </div>

            {/* ── Main certificate content ────────────────── */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-16 pt-10">

              {/* Organisation */}
              <div className="flex items-center gap-2 mb-1">
                <div className="h-px w-10" style={{ background: 'linear-gradient(90deg,transparent,#B8963E)' }} />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-700">
                  Abhyo · Empowering Minds
                </span>
                <div className="h-px w-10" style={{ background: 'linear-gradient(90deg,#B8963E,transparent)' }} />
              </div>

              {/* Stars */}
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`fill-amber-${i === 2 ? '500' : '400'} text-amber-${i === 2 ? '500' : '400'} ${i === 2 ? 'w-4 h-4' : 'w-2.5 h-2.5'}`} />
                ))}
              </div>

              {/* Title */}
              <h1 className="font-black text-2xl tracking-widest mb-1"
                style={{ color: '#1e1347', letterSpacing: '0.18em', fontSize: 'clamp(14px,2.5vw,24px)' }}>
                CERTIFICATE OF ACHIEVEMENT
              </h1>
              <div className="h-0.5 w-40 mb-3 rounded-full"
                style={{ background: 'linear-gradient(90deg,transparent,#C9A84C,transparent)' }} />

              <p className="text-xs italic mb-3" style={{ color: '#92600a' }}>
                This is proudly presented to
              </p>

              {/* Student name */}
              <h2 className="font-black capitalize mb-1"
                style={{
                  fontSize: 'clamp(18px,4vw,36px)',
                  background: 'linear-gradient(135deg,#92400e,#C9A84C,#92400e)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                {cert.studentName}
              </h2>
              <div className="h-0.5 w-36 mb-4 rounded-full"
                style={{ background: 'linear-gradient(90deg,transparent,#D4A82B,transparent)' }} />

              {/* Description */}
              <p className="text-xs text-slate-700 leading-relaxed mb-1 max-w-sm"
                style={{ fontFamily: 'Georgia, serif' }}>
                For outstanding performance in the{' '}
                <strong className="text-indigo-800">{cert.olympiadTitle}</strong>
              </p>
              <p className="mb-4" style={{ fontSize: '10px', color: '#78716c' }}>
                {cert.subjectName} · Class {cert.className} · {examDateFmt}
              </p>

              {/* Medal + badges */}
              <div className="flex items-end justify-center gap-6 mb-4">
                <Medal grade={grade} />
                <div className="flex flex-col gap-2">
                  {[
                    { label: 'Score', value: `${cert.obtainedMarks} / ${cert.totalMarks}` },
                    { label: 'National Rank', value: cert.nationalRank ? `#${cert.nationalRank}` : 'TBD' },
                  ].map(b => (
                    <div key={b.label} className="text-center px-5 py-2 rounded-xl"
                      style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.35)' }}>
                      <p className="font-black text-amber-800" style={{ fontSize: 'clamp(12px,2vw,18px)' }}>{b.value}</p>
                      <p style={{ fontSize: '9px', color: '#78716c', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{b.label}</p>
                    </div>
                  ))}
                </div>
                <span className={`text-xs font-black px-3 py-1.5 rounded-full ring-1 self-center ${gStyle.pill}`}>
                  {grade}
                </span>
              </div>

              {/* Divider */}
              <div className="h-px w-3/4 mb-4"
                style={{ background: 'linear-gradient(90deg,transparent,#C9A84C 30%,#C9A84C 70%,transparent)' }} />

              {/* Seals row */}
              <div className="flex items-center justify-between w-3/4 mb-2">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <span style={{ fontSize: '9px', color: '#6366f1', fontFamily: 'sans-serif', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Verified</span>
                </div>

                <div className="text-center">
                  <p style={{ fontSize: '8px', color: '#92600a', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                    {cert.certificateId}
                  </p>
                  <p style={{ fontSize: '7px', color: '#a8a29e', fontFamily: 'monospace' }}>Certificate ID</p>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
                    style={{ background: 'linear-gradient(135deg,#C9A84C,#F5D482)' }}>
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <span style={{ fontSize: '9px', color: '#92600a', fontFamily: 'sans-serif', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Director</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Certificate Details ───────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
          <CheckCircle className="w-4 h-4 text-green-500" /> Certificate Details
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Certificate ID', value: cert.certificateId },
            { label: 'Issued Date', value: cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
            { label: 'Olympiad', value: cert.olympiadTitle },
            { label: 'Subject', value: cert.subjectName },
            { label: 'Class', value: `Class ${cert.className}` },
            { label: 'Grade', value: cert.grade || '—' },
          ].map(row => (
            <div key={row.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{row.label}</p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{row.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Verification ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
          <QrCode className="w-4 h-4 text-indigo-500" /> Verify Certificate
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Share this link to verify the authenticity of this certificate online.
        </p>
        <div className="flex items-center gap-2 bg-indigo-50 rounded-xl p-3 border border-indigo-100">
          <p className="text-xs font-mono text-indigo-700 flex-1 truncate">{verifyUrl}</p>
          <button onClick={copyLink}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${copied ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          <a href={verifyUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Open
          </a>
        </div>
      </div>

    </div>
  );
}
