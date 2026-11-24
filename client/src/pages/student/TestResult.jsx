import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Trophy, Clock, Target, BarChart2, CheckCircle, XCircle,
  MinusCircle, ArrowLeft, ChevronDown, ChevronUp, Eye, EyeOff,
  TrendingUp, Award, Users, RefreshCw, Share2, Download, Zap,
  BookOpen, AlertTriangle, CheckCircle2
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import { getImageUrl } from '../../lib/imageUrl';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Animated counter ───────────────────────────────────────────
function AnimCount({ to, duration = 1000, suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const prog = Math.min(elapsed / duration, 1);
      setVal(Math.round(to * prog));
      if (prog < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [to, duration]);
  return <span>{val}{suffix}</span>;
}

// ── Circular progress ring ─────────────────────────────────────
function RingChart({ pct, size = 120, stroke = 10, color }) {
  const r = (size - stroke) / 2;
  const circum = 2 * Math.PI * r;
  const dash = (pct / 100) * circum;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circum}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1.2s ease' }} />
    </svg>
  );
}

const PIE_COLORS  = ['#10b981', '#ef4444', '#9ca3af'];
const fmt = (s) => s >= 3600 ? `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m` : s >= 60 ? `${Math.floor(s/60)}m ${s%60}s` : `${s}s`;
const pctColor = (p) => p >= 70 ? '#10b981' : p >= 45 ? '#f59e0b' : '#ef4444';
const pctBg    = (p) => p >= 70 ? '#f0fdf4' : p >= 45 ? '#fffbeb' : '#fef2f2';
const pctBorder= (p) => p >= 70 ? '#bbf7d0' : p >= 45 ? '#fde68a' : '#fecaca';

export default function TestResult() {
  const { user } = useAuthStore();
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [expandedQ, setExpandedQ]   = useState(null);
  const [filterQ, setFilterQ]       = useState('all'); // all | correct | wrong | skipped
  const [activeTab, setActiveTab]   = useState('overview'); // overview | subjects | review

  useEffect(() => {
    api.get(`/results/${resultId}`)
      .then(r => setResult(r.data.data))
      .catch(() => toast.error('Failed to load result'))
      .finally(() => setLoading(false));
  }, [resultId]);

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#f9fafb', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14, fontFamily:"'Inter',sans-serif" }}>
      <div style={{ width:40, height:40, border:'3px solid #e0e7ff', borderTopColor:'#6366f1', borderRadius:'50%', animation:'sp 0.8s linear infinite' }} />
      <p style={{ fontSize:14, color:'#6b7280', fontWeight:600 }}>Loading your results...</p>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!result) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f9fafb' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>😕</div>
        <p style={{ color:'#374151', fontWeight:700, marginBottom:8 }}>Result not found</p>
        <button onClick={() => navigate('/student/results')} style={{ padding:'8px 20px', background:'#6366f1', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:14 }}>← Back</button>
      </div>
    </div>
  );

  const {
    score = 0, totalMarks = 0, correctAnswers = 0, wrongAnswers = 0, skippedAnswers = 0,
    accuracy = 0, timeTaken = 0, globalRank, instituteRank, globalPercentile,
    totalParticipants, subjectPerformance = [], responses = [],
  } = result;

  const totalQ    = correctAnswers + wrongAnswers + skippedAnswers || 1;
  const pct       = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
  const grade     = pct >= 90 ? { letter:'A+', label:'Outstanding 🎉', color:'#059669' }
                  : pct >= 75 ? { letter:'A',  label:'Excellent! 🏆',  color:'#10b981' }
                  : pct >= 60 ? { letter:'B',  label:'Good Job! ✅',   color:'#6366f1' }
                  : pct >= 45 ? { letter:'C',  label:'Keep Going 💪',  color:'#f59e0b' }
                  :             { letter:'D',  label:'Need Practice',   color:'#ef4444' };

  const pieData = [
    { name:'Correct', value:correctAnswers, color:'#10b981' },
    { name:'Wrong',   value:wrongAnswers,   color:'#ef4444' },
    { name:'Skipped', value:skippedAnswers, color:'#d1d5db' },
  ];

  const barData = subjectPerformance.map(s => ({
    name: s.subject?.length > 10 ? s.subject.slice(0,10)+'…' : s.subject,
    fullName: s.subject,
    accuracy: s.accuracy,
    correct: s.correct,
    total: s.totalQuestions,
  }));

  const filteredRes = responses.filter(r => {
    if (filterQ === 'correct') return r.isCorrect;
    if (filterQ === 'wrong')   return !r.isCorrect && !r.isSkipped;
    if (filterQ === 'skipped') return r.isSkipped;
    return true;
  });

  const card   = { background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, padding:'16px 18px' };
  const tabBtn = (id, count) => ({
    padding:'7px 14px', borderRadius:8, fontSize:13, fontWeight:600, border:'none', cursor:'pointer',
    background: activeTab===id ? '#6366f1' : '#f3f4f6',
    color:      activeTab===id ? '#fff'    : '#6b7280',
    display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
    boxShadow: activeTab===id ? '0 4px 10px rgba(99, 102, 241, 0.2)' : 'none'
  });

  // Calculate advanced metrics
  const avgTimePerQuestion = timeTaken / totalQ;
  const paceLabel = avgTimePerQuestion < 45 ? "⚡ Fast Pace" : avgTimePerQuestion > 90 ? "🐢 Slow Pace" : "⏱ Optimal Pace";
  const pointsPerMinute = timeTaken > 0 ? Math.max(0, (score / (timeTaken / 60))).toFixed(1) : 0;
  
  let insightMsg = "";
  if (avgTimePerQuestion < 45 && accuracy < 60) {
    insightMsg = "You are answering very quickly but accuracy is suffering. Slow down and read questions carefully.";
  } else if (avgTimePerQuestion > 90 && accuracy > 75) {
    insightMsg = "Great accuracy, but your speed is quite slow. Work on taking less time per question to finish exams comfortably.";
  } else if (accuracy >= 80) {
    insightMsg = "Outstanding overall performance! You have a great balance of speed and accuracy.";
  } else if (accuracy < 40) {
    insightMsg = "Your foundational concepts in several subjects need revision. Focus on basics before taking more full mocks.";
  } else {
    insightMsg = "You show potential but need consistency. Review your incorrect and skipped questions to close the gap.";
  }

  const exportPDF = async () => {
    const toastId = toast.loading('Generating detailed PDF report...');
    try {
      // Async image loader helper
      const getBase64ImageFromUrl = async (imageUrl) => {
        try {
          const res = await fetch(imageUrl);
          const blob = await res.blob();
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        } catch {
          return null;
        }
      };

      const doc = new jsPDF();
      
      // Modern Top Colored Bar
      doc.setFillColor(99, 102, 241); // Indigo color
      doc.rect(0, 0, 210, 6, 'F');
      
      let topY = 22; // Base alignment y-coordinate

      // 1. "Our Logo" -> Abhyo Branding (Left)
      const abhyoLogoBase64 = await getBase64ImageFromUrl(window.location.origin + '/logo.png');
      if (abhyoLogoBase64) {
        // Adjust width:height proportional to actual logo, guessing ~ 40x12
        doc.addImage(abhyoLogoBase64, 'PNG', 14, 10, 36, 12); 
      } else {
        doc.setFontSize(24);
        doc.setTextColor(79, 70, 229);
        doc.setFont("helvetica", "bold");
        doc.text("ABHYO", 14, topY);
      }
      
      doc.setFontSize(9);
      doc.setTextColor(156, 163, 175);
      doc.setFont("helvetica", "normal");
      doc.text("Practice. Improve. Achieve.", 14, topY + 5);

      // 2. Coaching Logo / Details (Right)
      const instituteName = result.test?.institute?.name || user?.institute?.name || user?.instituteName || "Partner Coaching Institute";
      const instituteAddr = result.test?.institute?.address || user?.institute?.address || "Address, Contact Details & Info";
      const instituteLogoPath = result.test?.institute?.logo || user?.institute?.logo || user?.instituteLogo;
      
      const instituteLogoBase64 = instituteLogoPath ? await getBase64ImageFromUrl(getImageUrl(instituteLogoPath)) : null;
      
      if (instituteLogoBase64) {
        doc.addImage(instituteLogoBase64, 'PNG', 160, 10, 36, 12); // Right aligned
        doc.setFontSize(10);
        doc.setTextColor(17, 24, 39);
        doc.setFont("helvetica", "bold");
        doc.text(instituteName, 196, topY + 5, { align: "right" });
      } else {
        doc.setFontSize(14);
        doc.setTextColor(17, 24, 39);
        doc.setFont("helvetica", "bold");
        doc.text(instituteName, 196, topY, { align: "right" });
        
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.setFont("helvetica", "normal");
        doc.text(instituteAddr, 196, topY + 5, { align: "right" });
      }

      doc.setDrawColor(229, 231, 235);
      doc.line(14, 34, 196, 34);

      // 3. Report Title
      doc.setFontSize(16);
      doc.setTextColor(17, 24, 39);
      doc.setFont("helvetica", "bold");
      doc.text('Detailed Result Assessment', 14, 44);

      // 4. Full Student & Test Details (Two Columns)
      // Left Column: Student Detail
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.setFont("helvetica", "normal");
      doc.text('Student Name:', 14, 54);
      doc.setTextColor(17, 24, 39);
      doc.setFont("helvetica", "bold");
      doc.text((result.student?.name || user?.name || 'Student Name').toUpperCase(), 42, 54);

      doc.setTextColor(107, 114, 128);
      doc.setFont("helvetica", "normal");
      doc.text('Roll / Email:', 14, 60);
      doc.setTextColor(17, 24, 39);
      doc.setFont("helvetica", "bold");
      doc.text(result.student?.email || user?.email || '-', 42, 60);

      // Right Column: Exam Detail
      doc.setTextColor(107, 114, 128);
      doc.setFont("helvetica", "normal");
      doc.text('Exam Name:', 110, 54);
      doc.setTextColor(17, 24, 39);
      doc.setFont("helvetica", "bold");
      doc.text(result.test?.title || 'Mock Test', 133, 54);

      doc.setTextColor(107, 114, 128);
      doc.setFont("helvetica", "normal");
      doc.text('Completed On:', 110, 60);
      doc.setTextColor(17, 24, 39);
      doc.setFont("helvetica", "bold");
      doc.text(result.completedAt ? new Date(result.completedAt).toLocaleString('en-IN') : 'N/A', 133, 60);

      doc.line(14, 68, 196, 68);

      // 5. Core Overview Metics (Grid style)
      let currentY = 78;
      
      // Score Block
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(14, currentY, 56, 18, 2, 2, 'F');
      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(9);
      doc.text("TOTAL SCORE", 20, currentY + 6);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.setFontSize(14);
      doc.text(`${score} / ${totalMarks}`, 20, currentY + 14);

      // Accuracy Block
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(74, currentY, 56, 18, 2, 2, 'F');
      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(9);
      doc.text("ACCURACY", 80, currentY + 6);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(16, 185, 129); // emerald
      doc.setFontSize(14);
      doc.text(`${accuracy}%`, 80, currentY + 14);

      // Rank Block
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(134, currentY, 62, 18, 2, 2, 'F');
      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(9);
      doc.text("GLOBAL RANK", 140, currentY + 6);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(217, 119, 6); // amber
      doc.setFontSize(14);
      doc.text(globalRank ? `# ${globalRank}` : 'N/A', 140, currentY + 14);

      currentY += 24;

      // Performance Meter Progress Bar
      doc.setFontSize(10);
      doc.setTextColor(31, 41, 55);
      doc.setFont("helvetica", "bold");
      doc.text(`Performance Meter: ${pct}%`, 14, currentY);
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(14, currentY + 4, 182, 6, 3, 3, 'F');
      const fillWidth = Math.max(3, (pct / 100) * 182);
      if (pct >= 70) doc.setFillColor(16, 185, 129);
      else if (pct >= 45) doc.setFillColor(245, 158, 11);
      else doc.setFillColor(239, 68, 68);
      doc.roundedRect(14, currentY + 4, fillWidth, 6, 3, 3, 'F');
      
      currentY += 18;

      // Attempt Summary & Time Management
      doc.setFontSize(10);
      doc.setTextColor(31, 41, 55);
      doc.setFont("helvetica", "bold");
      doc.text("Attempt Summary", 14, currentY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(16, 185, 129); doc.text(`Correct: ${correctAnswers}`, 14, currentY + 6);
      doc.setTextColor(239, 68, 68); doc.text(`Wrong: ${wrongAnswers}`, 40, currentY + 6);
      doc.setTextColor(107, 114, 128); doc.text(`Skipped: ${skippedAnswers}`, 66, currentY + 6);

      doc.setTextColor(31, 41, 55);
      doc.setFont("helvetica", "bold");
      doc.text("Time Management", 110, currentY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128); 
      doc.text(`Speed: ${fmt(Math.round(avgTimePerQuestion))} / question  (${paceLabel})`, 110, currentY + 6);
      doc.text(`Productivity: ${pointsPerMinute} points / min`, 110, currentY + 12);
      
      currentY += 20;

      // AI Performance Insight
      doc.setFillColor(240, 253, 250);
      doc.rect(14, currentY, 182, 14, 'F');
      doc.setFont("helvetica", "bold");
      doc.setTextColor(5, 150, 105);
      doc.text("Performance Insight:", 18, currentY + 9);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(insightMsg, 130), 55, currentY + 9);

      currentY += 20;

      // Weak Subjects
      const weakSubjects = subjectPerformance.filter(s => s.accuracy < 60);
      if (weakSubjects.length > 0) {
        const height = 12 + (weakSubjects.length * 6);
        doc.setFillColor(254, 242, 242);
        doc.rect(14, currentY, 182, height, 'F');
        doc.setFont("helvetica", "bold");
        doc.setTextColor(220, 38, 38);
        doc.text("Weak Subject Analytics — Areas for Improvement", 18, currentY + 8);
        doc.setFont("helvetica", "normal");
        let weakY = currentY + 14;
        weakSubjects.forEach(ws => {
           doc.text(`• ${ws.subject} (Accuracy: ${ws.accuracy}%) - Scored ${ws.correct} out of ${ws.totalQuestions}`, 22, weakY);
           weakY += 6;
        });
        currentY += height + 6;
      }
      
      // 6. Subject Wise Table (Accuracy)
      doc.setFontSize(12);
      doc.setTextColor(31, 41, 55);
      doc.setFont("helvetica", "bold");
      doc.text('Subject Accuracy & Review', 14, currentY + 6);

      const subjectData = subjectPerformance.map(s => [
        s.subject,
        s.totalQuestions,
        s.correct,
        ((s.totalQuestions || 0) - (s.correct || 0) - (s.skipped || 0)),
        s.skipped,
        `${s.accuracy}%`
      ]);

      autoTable(doc, {
        startY: currentY + 10,
        head: [['Subject', 'Total Qs', 'Correct', 'Wrong', 'Skipped', 'Accuracy %']],
        body: subjectData,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241], textColor: 255 },
        styles: { fontSize: 10, cellPadding: 4 }
      });

      // 7. Question Review Details
      const finalY = doc.lastAutoTable.finalY || 100;
      doc.setFontSize(12);
      doc.setTextColor(31, 41, 55);
      doc.setFont("helvetica", "bold");
      doc.text('Line-by-Line Question Review', 14, finalY + 14);

      const questionsData = responses.map((r, i) => [
        i + 1,
        r.isSkipped ? 'Skipped' : r.isCorrect ? 'Correct' : 'Wrong',
        r.marksEarned,
        r.question?.subject || '-',
        r.selectedOption || '-'
      ]);

      autoTable(doc, {
        startY: finalY + 18,
        head: [['Q No.', 'Status', 'Marks', 'Subject Topic', 'Your Option']],
        body: questionsData,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 3 },
        didParseCell: function (data) {
           if (data.section === 'body' && data.column.index === 1) {
             if (data.cell.raw === 'Correct') {
               data.cell.styles.textColor = [5, 150, 105];
               data.cell.styles.fontStyle = 'bold';
             } else if (data.cell.raw === 'Wrong') {
               data.cell.styles.textColor = [220, 38, 38];
               data.cell.styles.fontStyle = 'bold';
             }
           }
        }
      });

      // Footer
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
         doc.setPage(i);
         doc.setFontSize(8);
         doc.setTextColor(156, 163, 175);
         doc.setFont("helvetica", "normal");
         doc.text(`Generated by Abhyo Mock Test Platform - abhyo.com | Page ${i} of ${totalPages}`, 105, 290, { align: 'center' });
      }

      doc.save(`${(result.student?.name || 'Student').replace(/\s+/g,'_')}_Assessment_Report.pdf`);
      toast.success('Professional report exported successfully!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to export PDF.', { id: toastId });
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6', fontFamily:"'Inter',-apple-system,sans-serif", fontSize:13 }}>

      {/* ── Hero Banner ─────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${pct>=60?'#1e1b4b':'#1c1917'} 0%, ${pct>=60?'#4f46e5':'#7c2d12'} 100%)`,
        padding:'24px 20px 28px', position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(to right,rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize:'28px 28px', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, background:'rgba(255,255,255,0.04)', borderRadius:'50%', pointerEvents:'none' }}/>

        <div style={{ maxWidth:900, margin:'0 auto', position:'relative' }}>
          {/* Back */}
          <button onClick={() => navigate('/student/results')}
            style={{ display:'flex', alignItems:'center', gap:6, color:'rgba(255,255,255,0.6)', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, padding:'5px 12px', fontSize:12, cursor:'pointer', marginBottom:20 }}>
            <ArrowLeft size={13}/> Back to Results
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6">

            {/* Ring */}
            <div className="mx-auto sm:mx-0" style={{ position:'relative', width:110, height:110, flexShrink:0 }}>
              <RingChart pct={pct} size={110} stroke={9} color={grade.color} />
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:24, fontWeight:900, color:'#fff', lineHeight:1 }}>{pct}%</span>
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.5)', marginTop:2 }}>Score</span>
              </div>
            </div>

            {/* Title + grade */}
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 mb-2">
                <span style={{ background: grade.color, color:'#fff', fontSize:11, fontWeight:800, padding:'2px 10px', borderRadius:20 }}>Grade {grade.letter}</span>
                <span style={{ color:'rgba(255,255,255,0.7)', fontSize:13, fontWeight:700 }}>{grade.label}</span>
              </div>
              <h1 style={{ color:'#fff', fontSize:17, fontWeight:800, margin:'0 0 4px', lineHeight:1.3 }}>{result.test?.title || 'Test Result'}</h1>
              <p style={{ color:'rgba(255,255,255,0.45)', fontSize:11, margin:0 }}>
                Completed {result.completedAt ? new Date(result.completedAt).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}) : ''}
              </p>
            </div>

            {/* Score box */}
            <div className="w-full sm:w-auto" style={{ textAlign:'center', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:14, padding:'14px 20px', flexShrink:0 }}>
              <div style={{ color:'rgba(255,255,255,0.5)', fontSize:10, textTransform:'uppercase', letterSpacing:1.5, marginBottom:4 }}>Total Score</div>
              <div style={{ fontSize:36, fontWeight:900, color:'#fff', lineHeight:1 }}>{score}</div>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:12 }}>/ {totalMarks}</div>
            </div>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
            {[
              { emoji:'🎯', label:'Accuracy',    val:`${accuracy}%`, sub:'of answered' },
              { emoji:'⏱', label:'Time Taken',  val:fmt(timeTaken), sub:'' },
              { emoji:'🏅', label:'Global Rank', val: globalRank ? `#${globalRank}` : '—', sub: totalParticipants ? `of ${totalParticipants}` : '' },
              { emoji:'📈', label:'Percentile',  val: globalPercentile ? `${globalPercentile}th` : '—', sub:'better than peers' },
            ].map(s => (
              <div key={s.label} style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 12px', textAlign:'center' }}>
                <div style={{ fontSize:18, marginBottom:4 }}>{s.emoji}</div>
                <div style={{ fontSize:16, fontWeight:800, color:'#fff', lineHeight:1 }}>{s.val}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:3 }}>{s.label}</div>
                {s.sub && <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', marginTop:1 }}>{s.sub}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div style={{ maxWidth:900, margin:'0 auto', padding:'20px 16px 40px' }}>

        {/* Tabs */}
        <div style={{ display:'flex', gap:10, marginBottom:20, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
          <button style={tabBtn('overview')}     onClick={()=>setActiveTab('overview')}><BarChart2 size={16}/> Overview & Insights</button>
          <button style={tabBtn('subjects')}     onClick={()=>setActiveTab('subjects')}><BookOpen size={16}/> Subject Analytics</button>
          {result.test?.allowReview && responses.length > 0 &&
            <button style={tabBtn('review')}    onClick={()=>setActiveTab('review')}><Eye size={16}/> Answer Review ({responses.length})</button>}
        </div>

        {/* ── TAB: OVERVIEW ─────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Attempt summary */}
            <div style={card}>
              <p style={{ fontWeight:700, fontSize:13, margin:'0 0 14px', color:'#111827' }}>📋 Attempt Summary</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label:'Correct', val:correctAnswers, pct:Math.round(correctAnswers/totalQ*100), bg:'#f0fdf4', border:'#a7f3d0', color:'#059669' },
                  { label:'Wrong',   val:wrongAnswers,   pct:Math.round(wrongAnswers/totalQ*100),   bg:'#fef2f2', border:'#fca5a5', color:'#dc2626' },
                  { label:'Skipped', val:skippedAnswers, pct:Math.round(skippedAnswers/totalQ*100), bg:'#f9fafb', border:'#e5e7eb', color:'#6b7280' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign:'center', padding:'12px 8px', borderRadius:10, background:s.bg, border:`1px solid ${s.border}` }}>
                    <div style={{ fontSize:24, fontWeight:900, color:s.color, lineHeight:1 }}>{s.val}</div>
                    <div style={{ fontSize:9, color:s.color, opacity:0.7, marginTop:3, fontWeight:700 }}>{s.pct}%</div>
                    <div style={{ fontSize:10, color:s.color, marginTop:1 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Progress bars */}
              {[
                { label:'Correct',  val:correctAnswers, color:'#10b981' },
                { label:'Wrong',    val:wrongAnswers,   color:'#ef4444' },
                { label:'Skipped',  val:skippedAnswers, color:'#d1d5db' },
              ].map(s => (
                <div key={s.label} style={{ marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#6b7280', marginBottom:3 }}>
                    <span>{s.label}</span><span style={{ fontWeight:700 }}>{s.val} / {totalQ}</span>
                  </div>
                  <div style={{ height:6, background:'#f3f4f6', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:4, background:s.color, width:`${Math.round(s.val/totalQ*100)}%`, transition:'width 1s ease' }} />
                  </div>
                </div>
              ))}

              {/* Rank */}
              {(globalRank || instituteRank) && (
                <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid #f3f4f6', display:'flex', gap:12 }}>
                  {globalRank && <div style={{ flex:1, textAlign:'center', padding:'8px', background:'#fefce8', borderRadius:8, border:'1px solid #fef08a' }}>
                    <div style={{ fontSize:12, fontWeight:800, color:'#b45309' }}>#{globalRank}</div>
                    <div style={{ fontSize:9, color:'#92400e', marginTop:2 }}>Global Rank</div>
                  </div>}
                  {instituteRank && <div style={{ flex:1, textAlign:'center', padding:'8px', background:'#eff6ff', borderRadius:8, border:'1px solid #bfdbfe' }}>
                    <div style={{ fontSize:12, fontWeight:800, color:'#1d4ed8' }}>#{instituteRank}</div>
                    <div style={{ fontSize:9, color:'#1e3a8a', marginTop:2 }}>Institute Rank</div>
                  </div>}
                </div>
              )}
            </div>

            {/* Donut chart */}
            <div style={card}>
              <p style={{ fontWeight:700, fontSize:13, margin:'0 0 8px', color:'#111827' }}>🍩 Score Distribution</p>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                <div style={{ position:'relative', width:140, height:140 }}>
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie data={pieData} cx={65} cy={65} innerRadius={44} outerRadius={65} paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270}>
                        {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(v,n) => [`${v} (${Math.round(v/totalQ*100)}%)`,n]} contentStyle={{ fontSize:11, borderRadius:8, border:'1px solid #e5e7eb' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontSize:20, fontWeight:900, color:grade.color }}>{pct}%</span>
                    <span style={{ fontSize:9, color:'#9ca3af' }}>Overall</span>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, width:'100%', marginTop:12 }}>
                  {pieData.map(d => (
                    <div key={d.name} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
                      <span style={{ width:10, height:10, borderRadius:3, background:d.color, flexShrink:0 }}/>
                      <span style={{ color:'#6b7280', flex:1 }}>{d.name}</span>
                      <span style={{ fontWeight:800, color:'#111827' }}>{d.value}</span>
                      <span style={{ color:'#9ca3af', fontSize:11 }}>({Math.round(d.value/totalQ*100)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Score meter */}
            <div style={{ ...card, gridColumn:'1/-1' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <p style={{ fontWeight:700, fontSize:13, margin:0, color:'#111827' }}>⚡ Performance Meter</p>
                <span style={{ fontSize:11, color:'#9ca3af' }}>{score} / {totalMarks} marks</span>
              </div>
              <div style={{ height:14, background:'#f3f4f6', borderRadius:8, overflow:'hidden', position:'relative' }}>
                <div style={{ height:'100%', borderRadius:8, background:`linear-gradient(to right, ${pctColor(pct)}, ${pct>=60?'#10b981':'#ef4444'})`, width:`${pct}%`, transition:'width 1.5s ease', position:'relative' }}>
                  <div style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', color:'#fff', fontSize:9, fontWeight:800, whiteSpace:'nowrap' }}>{pct}%</div>
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                {[0,25,50,75,100].map(m => (
                  <div key={m} style={{ textAlign:'center' }}>
                    <div style={{ height:4, width:1, background:'#e5e7eb', margin:'0 auto 2px' }}/>
                    <span style={{ fontSize:9, color:'#9ca3af' }}>{m}%</span>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:8, marginTop:14, flexWrap:'wrap' }}>
                {[
                  { range:'0–44%', label:'Needs Work', color:'#fef2f2', border:'#fecaca', text:'#dc2626' },
                  { range:'45–59%', label:'Average',   color:'#fffbeb', border:'#fde68a', text:'#b45309' },
                  { range:'60–74%', label:'Good',      color:'#eff6ff', border:'#bfdbfe', text:'#1d4ed8' },
                  { range:'75–89%', label:'Very Good', color:'#f0fdf4', border:'#a7f3d0', text:'#059669' },
                  { range:'90%+',   label:'Excellent', color:'#faf5ff', border:'#ddd6fe', text:'#6d28d9' },
                ].map(b => (
                  <div key={b.range} style={{ padding:'4px 10px', borderRadius:20, background:b.color, border:`1px solid ${b.border}`, fontSize:10 }}>
                    <span style={{ color:b.text, fontWeight:700 }}>{b.range}</span>
                    <span style={{ color:'#6b7280', marginLeft:4 }}>{b.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 🤖 AI Performance Insights Card (NEW) */}
            <div style={{ ...card, gridColumn:'1/-1', background: 'linear-gradient(135deg, #f0fdfa, #ecfdf5)', border: '1px solid #10b981', boxShadow: '0 4px 12px rgba(16,185,129,0.08)' }}>
              <div style={{ display:'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ background: '#10b981', color: 'white', padding: 8, borderRadius: 10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Zap size={20} />
                </div>
                <div>
                   <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 800, color: '#065f46' }}>Performance Insight</h3>
                   <p style={{ margin: 0, fontSize: 13, color: '#047857', lineHeight: 1.5, fontWeight: 500 }}>
                     {insightMsg}
                   </p>
                </div>
              </div>
            </div>

            {/* ⏱ Efficiency & Speed Metrics (NEW) */}
            <div className="md:col-span-2 flex flex-col sm:flex-row items-center gap-5 flex-wrap" style={card}>
                <div style={{ flex: 1, minWidth: 200, width: '100%' }}>
                  <p style={{ fontWeight:700, fontSize:13, margin:'0 0 12px', color:'#111827', display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={16} /> Time Management</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                       <div style={{ color: '#64748b', fontSize: 10, textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Avg Time / Question</div>
                       <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>{fmt(Math.round(avgTimePerQuestion))}</div>
                       <div style={{ color: avgTimePerQuestion > 90 ? '#ea580c' : '#059669', fontSize: 11, fontWeight: 600, marginTop: 4 }}>{paceLabel}</div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                       <div style={{ color: '#64748b', fontSize: 10, textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Points / Minute</div>
                       <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>{pointsPerMinute}</div>
                       <div style={{ color: '#059669', fontSize: 11, fontWeight: 600, marginTop: 4 }}>Productivity Rate</div>
                    </div>
                  </div>
                </div>
                <div style={{ width: 1, background: '#e5e7eb', alignSelf: 'stretch' }} className="hidden sm:block" />
                <div style={{ flex: 1, minWidth: 240, width: '100%' }}>
                   <p style={{ fontWeight:700, fontSize:13, margin:'0 0 12px', color:'#111827', display: 'flex', alignItems: 'center', gap: 6 }}><Target size={16} /> Strategy Breakdown</p>
                   {/* Mini progress bars showing behavior */}
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600 }}>
                         <span style={{ color: '#64748b' }}>Attempt Rate</span>
                         <span style={{ color: '#0f172a' }}>{Math.round(((correctAnswers + wrongAnswers) / totalQ) * 100)}%</span>
                       </div>
                       <div style={{ height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                          <div style={{ height: '100%', width: `${Math.round(((correctAnswers + wrongAnswers) / totalQ) * 100)}%`, background: '#3b82f6', borderRadius: 4 }} />
                       </div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600 }}>
                         <span style={{ color: '#64748b' }}>Accuracy</span>
                         <span style={{ color: '#0f172a' }}>{accuracy}%</span>
                       </div>
                       <div style={{ height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${accuracy}%`, background: pctColor(accuracy), borderRadius: 4 }} />
                       </div>
                   </div>
                </div>
            </div>
            
            {/* ⚠️ Weak Subject Analytics */}
            {subjectPerformance.some(s => s.accuracy < 60) && (
              <div className="md:col-span-2" style={{ ...card, border:'1px solid #fecaca', background:'#fff5f5' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                  <AlertTriangle size={18} style={{ color:'#dc2626' }} />
                  <p style={{ fontWeight:800, fontSize:14, margin:0, color:'#991b1b' }}>Weak Subject Analytics — Areas for Improvement</p>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:12 }}>
                  {subjectPerformance.filter(s => s.accuracy < 60).map(s => (
                    <div key={s.subject} style={{ background:'#fff', border:'1px solid #fee2e2', borderRadius:12, padding:'14px', boxShadow:'0 2px 4px rgba(220,38,38,0.05)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <h4 style={{ fontWeight:700, fontSize:13, color:'#1f2937', margin:0, truncate:true }}>{s.subject}</h4>
                          <p style={{ fontSize:10, color:'#991b1b', fontWeight:600, margin:'2px 0 0' }}>Needs Focus</p>
                        </div>
                        <span style={{ fontSize:15, fontWeight:900, color:'#dc2626' }}>{s.accuracy}%</span>
                      </div>
                      <div style={{ height:5, background:'#fef2f2', borderRadius:10, overflow:'hidden' }}>
                        <div style={{ height:'100%', background:'#ef4444', width:`${s.accuracy}%`, borderRadius:10 }} />
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:10 }}>
                        <span style={{ color:'#6b7280' }}>Score: <strong>{s.correct}</strong> / {s.totalQuestions}</span>
                        <span style={{ color:'#dc2626', fontWeight:700 }}>{s.correct < (s.totalQuestions / 2) ? 'Critical' : 'Poor'}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:14, padding:'10px 14px', background:'#fff', borderRadius:10, border:'1px dashed #fca5a5', fontSize:11, color:'#7f1d1d', lineHeight:1.5 }}>
                  💡 <strong>Recommendation:</strong> Re-visit the study material for these subjects. Practicing topic-wise quizzes might help improve your accuracy.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: SUBJECTS ─────────────────────────────────── */}
        {activeTab === 'subjects' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {subjectPerformance.length === 0 ? (
              <div style={{ ...card, textAlign:'center', padding:40 }}>
                <div style={{ fontSize:36, marginBottom:8 }}>📊</div>
                <p style={{ color:'#6b7280', fontSize:14 }}>Subject analysis not available for this test.</p>
              </div>
            ) : (
              <>
                {/* Bar chart */}
                {barData.length >= 2 && (
                  <div style={card}>
                    <p style={{ fontWeight:700, fontSize:13, margin:'0 0 14px', color:'#111827' }}>📊 Subject Accuracy Chart</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={barData} margin={{ top:5, right:5, bottom:5, left:-20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="name" tick={{ fontSize:10, fill:'#9ca3af' }} />
                        <YAxis tick={{ fontSize:10, fill:'#9ca3af' }} domain={[0,100]} />
                        <Tooltip
                          formatter={(v,n,p) => [`${v}% accuracy (${p.payload.correct}/${p.payload.total})`, p.payload.fullName]}
                          contentStyle={{ fontSize:11, borderRadius:8, border:'1px solid #e5e7eb' }}
                        />
                        <Bar dataKey="accuracy" radius={[4,4,0,0]}>
                          {barData.map((e,i) => <Cell key={i} fill={pctColor(e.accuracy)} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Subject cards */}
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {subjectPerformance.map(s => (
                    <div key={s.subject} style={{ ...card, padding:'12px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ width:44, height:44, borderRadius:10, background:pctBg(s.accuracy), border:`1px solid ${pctBorder(s.accuracy)}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <span style={{ fontSize:16, fontWeight:900, color:pctColor(s.accuracy) }}>{s.accuracy}%</span>
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                            <span style={{ fontWeight:700, color:'#111827', fontSize:13 }}>{s.subject}</span>
                            <div style={{ display:'flex', gap:4, fontSize:11 }}>
                              <span style={{ color:'#059669', fontWeight:700, background:'#f0fdf4', padding:'2px 7px', borderRadius:10, border:'1px solid #a7f3d0' }}>✓ {s.correct}</span>
                              <span style={{ color:'#dc2626', fontWeight:700, background:'#fef2f2', padding:'2px 7px', borderRadius:10, border:'1px solid #fecaca' }}>✗ {(s.totalQuestions||0)-(s.correct||0)-(s.skipped||0)}</span>
                              <span style={{ color:'#6b7280', fontWeight:700, background:'#f9fafb', padding:'2px 7px', borderRadius:10, border:'1px solid #e5e7eb' }}>– {s.skipped||0}</span>
                            </div>
                          </div>
                          <div style={{ height:6, background:'#f3f4f6', borderRadius:4, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${s.accuracy}%`, background:pctColor(s.accuracy), borderRadius:4, transition:'width 1s ease' }} />
                          </div>
                          <div style={{ display:'flex', justifyContent:'space-between', marginTop:3, fontSize:10, color:'#9ca3af' }}>
                            <span>{s.correct} / {s.totalQuestions} correct</span>
                            <span style={{ color:pctColor(s.accuracy), fontWeight:700 }}>
                              {s.accuracy >= 70 ? '🔥 Strong' : s.accuracy >= 45 ? '📈 Average' : '⚠️ Needs work'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Radar */}
                {subjectPerformance.length >= 3 && (
                  <div style={card}>
                    <p style={{ fontWeight:700, fontSize:13, margin:'0 0 8px', color:'#111827' }}>🕸 Radar Analysis</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart data={subjectPerformance.map(s => ({ subject: s.subject?.slice(0,12), accuracy: s.accuracy }))}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill:'#6b7280', fontSize:10 }} />
                        <Radar name="Accuracy" dataKey="accuracy" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
                        <Tooltip formatter={v=>[`${v}%`,'Accuracy']} contentStyle={{ fontSize:11, borderRadius:8, border:'1px solid #e5e7eb' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── TAB: REVIEW ───────────────────────────────────── */}
        {activeTab === 'review' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

            {/* Filter bar */}
            <div className="flex flex-wrap gap-2 items-center">
              <span style={{ fontSize:12, color:'#6b7280', fontWeight:600 }}>Filter:</span>
              {[
                { id:'all',     label:`All (${responses.length})` },
                { id:'correct', label:`✓ Correct (${responses.filter(r=>r.isCorrect).length})` },
                { id:'wrong',   label:`✗ Wrong (${responses.filter(r=>!r.isCorrect&&!r.isSkipped).length})` },
                { id:'skipped', label:`– Skipped (${responses.filter(r=>r.isSkipped).length})` },
              ].map(f => (
                <button key={f.id} onClick={()=>setFilterQ(f.id)}
                  style={{ padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:600, border:`1px solid ${filterQ===f.id?'#6366f1':'#e5e7eb'}`, background:filterQ===f.id?'#6366f1':'#fff', color:filterQ===f.id?'#fff':'#6b7280', cursor:'pointer' }}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Questions */}
            {filteredRes.map((r, idx) => {
              const q = r.question;
              if (!q) return null;
              const isOpen = expandedQ === idx;
              const statusColor = r.isSkipped ? '#6b7280' : r.isCorrect ? '#059669' : '#dc2626';
              const statusBg    = r.isSkipped ? '#f9fafb'  : r.isCorrect ? '#f0fdf4'  : '#fef2f2';
              const statusBdr   = r.isSkipped ? '#e5e7eb'  : r.isCorrect ? '#a7f3d0'  : '#fecaca';
              return (
                <div key={idx} style={{ background:'#fff', border:`1px solid ${isOpen?statusColor+'60':statusBdr}`, borderRadius:12, overflow:'hidden', transition:'border-color 0.2s' }}>
                  {/* Question header */}
                  <button
                    onClick={() => setExpandedQ(isOpen ? null : idx)}
                    style={{ width:'100%', padding:'12px 16px', background:statusBg, border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:10, textAlign:'left' }}
                  >
                    <span style={{ width:24, height:24, background:statusColor, color:'#fff', borderRadius:6, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, flexShrink:0 }}>
                      {responses.indexOf(r)+1}
                    </span>
                    <span style={{ flex:1, fontSize:12, fontWeight:600, color:'#374151', lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace: isOpen?'normal':'nowrap' }}>
                      {q.questionText}
                    </span>
                    <span style={{ fontSize:11, fontWeight:700, color:statusColor, flexShrink:0, marginLeft:8 }}>
                      {r.isSkipped ? '—' : r.isCorrect ? `+${r.marksEarned}` : `${r.marksEarned}`} marks
                    </span>
                    <span style={{ fontSize:10, background: r.isSkipped?'#f3f4f6':r.isCorrect?'#d1fae5':'#fee2e2', color:statusColor, padding:'2px 8px', borderRadius:10, fontWeight:700, flexShrink:0 }}>
                      {r.isSkipped ? 'Skipped' : r.isCorrect ? '✓ Correct' : '✗ Wrong'}
                    </span>
                    {isOpen ? <ChevronUp size={14} style={{ color:'#9ca3af', flexShrink:0 }}/> : <ChevronDown size={14} style={{ color:'#9ca3af', flexShrink:0 }}/>}
                  </button>

                  {/* Expanded */}
                  {isOpen && (
                    <div style={{ padding:'14px 16px', borderTop:`1px solid ${statusBdr}` }}>
                      {q.image && <img src={q.image} alt="Q" style={{ maxHeight:140, borderRadius:8, marginBottom:12, objectFit:'contain', border:'1px solid #e5e7eb', maxWidth:'100%' }} />}

                      <p style={{ fontSize:13, color:'#1f2937', lineHeight:1.6, margin:'0 0 12px', fontWeight:500 }}>{q.questionText}</p>

                      {/* Options */}
                      <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:12 }}>
                        {(q.options||[]).map(opt => {
                          const isCorrect  = opt.label === q.correctAnswer;
                          const isSelected = opt.label === r.selectedOption;
                          const wrongPick  = isSelected && !isCorrect;
                          return (
                            <div key={opt.label} style={{
                              display:'flex', gap:8, alignItems:'flex-start',
                              padding:'8px 10px', borderRadius:8, fontSize:12,
                              background: isCorrect ? '#f0fdf4' : wrongPick ? '#fef2f2' : '#f9fafb',
                              border: `1px solid ${isCorrect ? '#a7f3d0' : wrongPick ? '#fca5a5' : '#e5e7eb'}`,
                              color: isCorrect ? '#065f46' : wrongPick ? '#991b1b' : '#374151',
                            }}>
                              <span style={{ fontWeight:800, flexShrink:0, width:16, textAlign:'center' }}>{opt.label}.</span>
                              <span style={{ flex:1, lineHeight:1.5 }}>{opt.text}</span>
                              {isCorrect && <span style={{ fontSize:11, flexShrink:0 }}>✅</span>}
                              {wrongPick  && <span style={{ fontSize:11, flexShrink:0 }}>❌ Your answer</span>}
                            </div>
                          );
                        })}
                      </div>

                      {/* Answer info */}
                      {!r.isSkipped && (
                        <div style={{ display:'flex', gap:8, fontSize:11, marginBottom: q.explanation ? 8 : 0 }}>
                          <div style={{ padding:'4px 10px', borderRadius:8, background:'#f0fdf4', border:'1px solid #a7f3d0', color:'#065f46', fontWeight:600 }}>
                            ✅ Correct: <strong>{q.correctAnswer}</strong>
                          </div>
                          {r.selectedOption && (
                            <div style={{ padding:'4px 10px', borderRadius:8, background: r.isCorrect?'#f0fdf4':'#fef2f2', border:`1px solid ${r.isCorrect?'#a7f3d0':'#fca5a5'}`, color: r.isCorrect?'#065f46':'#991b1b', fontWeight:600 }}>
                              Your answer: <strong>{r.selectedOption}</strong>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Explanation */}
                      {q.explanation && (
                        <div style={{ marginTop:8, padding:'10px 12px', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, fontSize:12, color:'#1e40af', lineHeight:1.6 }}>
                          💡 <strong>Explanation:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredRes.length === 0 && (
              <div style={{ ...card, textAlign:'center', padding:32 }}>
                <p style={{ color:'#9ca3af', fontSize:14 }}>No questions in this filter. Try changing the filter.</p>
              </div>
            )}
          </div>
        )}

        {/* ── CTA buttons ──────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6 flex-wrap">
          <button onClick={() => navigate('/student/tests')}
            style={{ flex:1, minWidth: 200, padding:'12px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 14px rgba(99,102,241,0.3)' }}>
            🔄 Attempt Another Test
          </button>
          <button onClick={() => navigate(`/student/leaderboard?testId=${result.test?.id}`)}
            style={{ flex:1, minWidth: 200, padding:'12px', background:'#fff', color:'#374151', border:'1px solid #e5e7eb', borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer' }}>
            🏆 View Leaderboard
          </button>
          <button onClick={() => navigate('/student/results')}
            style={{ padding:'12px 20px', background:'#f9fafb', color:'#6b7280', border:'1px solid #e5e7eb', borderRadius:12, fontSize:13, fontWeight:600, cursor:'pointer' }}>
            📋 All Results
          </button>
          <button onClick={exportPDF}
            style={{ padding:'12px 20px', background:'#fff', color:'#4f46e5', border:'1px solid #c7d2fe', borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={16}/> Export Report
          </button>
        </div>
      </div>
    </div>
  );
}
