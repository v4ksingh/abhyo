import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Download, Printer, User, Building2, Calendar, Phone,
  Mail, MapPin, BookOpen, CheckCircle, XCircle, Layers,
  ArrowLeft, Shield, IdCard
} from 'lucide-react';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';

// ── Utility ───────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const UPLOADS  = API_BASE.replace('/api', '/uploads/');

function avatarUrl(avatar) {
  if (!avatar) return null;
  if (avatar.startsWith('http')) return avatar;
  return UPLOADS + avatar;
}

function logoUrl(logo) {
  if (!logo) return null;
  if (logo.startsWith('http')) return logo;
  return UPLOADS + logo;
}

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

// ── QR Code — deterministic pixel pattern from student ID hash ───────────────
function MiniQR({ value, cellSize = 3 }) {
  const getMatrix = (str, size = 10) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
    const cells = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const bit = (hash >> ((r * size + c) % 30)) & 1;
        const isCorner =
          (r < 3 && c < 3) ||
          (r < 3 && c >= size - 3) ||
          (r >= size - 3 && c < 3);
        cells.push(isCorner ? 1 : bit);
      }
    }
    return cells;
  };
  const size = 10;
  const cells = getMatrix(value || 'student', size);
  const dim = size * cellSize;
  return (
    <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`} xmlns="http://www.w3.org/2000/svg">
      <rect width={dim} height={dim} fill="white" />
      {cells.map((on, i) => {
        if (!on) return null;
        const r = Math.floor(i / size);
        const c = i % size;
        return <rect key={i} x={c * cellSize} y={r * cellSize} width={cellSize} height={cellSize} fill="#1e1b4b" />;
      })}
    </svg>
  );
}

// ── Main ID Card Component ─────────────────────────────────────────────────────
function IdCardFront({ data }) {
  const { name, email, mobile, avatar, joinedAt, isActive, institute, batches, id, stats } = data;
  const primaryBatch = batches?.[0];
  const instLogo = logoUrl(institute?.logo);
  const stuAvatar = avatarUrl(avatar);
  const joinYear  = joinedAt ? new Date(joinedAt).getFullYear() : '—';

  return (
    <div className="id-card-front" id="id-card-printable">
      {/* ── Header band ── */}
      <div className="id-card-header">
        <div className="id-card-holo" />
        <div className="id-card-header-content">
          {instLogo ? (
            <img src={instLogo} alt="logo" className="id-card-inst-logo" />
          ) : (
            <div className="id-card-inst-logo-placeholder">
              <Building2 size={24} />
            </div>
          )}
          <div>
            <p className="id-card-inst-name">{institute?.name || 'Independent Student'}</p>
            {institute?.tagline && (
              <p className="id-card-inst-tagline">{institute.tagline}</p>
            )}
          </div>
          <div className="id-card-shield">
            <Shield size={10} strokeWidth={2.5} />
          </div>
        </div>
        <p className="id-card-chip-label">STUDENT IDENTITY CARD</p>
      </div>

      {/* ── Body ── */}
      <div className="id-card-body">
        {/* Avatar */}
        <div className="id-card-avatar-wrap">
          {stuAvatar ? (
            <img src={stuAvatar} alt={name} className="id-card-avatar" />
          ) : (
            <div className="id-card-avatar-placeholder">
              <User size={18} />
            </div>
          )}
          <div className={`id-card-status-dot ${isActive ? 'active' : 'inactive'}`} />
        </div>

        {/* Info */}
        <div className="id-card-info">
          <h2 className="id-card-name">{name}</h2>
          {primaryBatch && (
            <span className="id-card-batch-badge">{primaryBatch.name}</span>
          )}

          <div className="id-card-details">
            {mobile && (
              <div className="id-card-detail-row">
                <Phone size={8} strokeWidth={2.5} />
                <span>{mobile}</span>
              </div>
            )}
            {email && (
              <div className="id-card-detail-row">
                <Mail size={8} strokeWidth={2.5} />
                <span className="id-card-detail-email">{email}</span>
              </div>
            )}
            {(institute?.city || institute?.state) && (
              <div className="id-card-detail-row">
                <MapPin size={8} strokeWidth={2.5} />
                <span>{[institute.city, institute.state].filter(Boolean).join(', ')}</span>
              </div>
            )}
            <div className="id-card-detail-row">
              <Calendar size={8} strokeWidth={2.5} />
              <span>Joined {fmtDate(joinedAt)}</span>
            </div>
            {stats?.totalTests > 0 && (
              <div className="id-card-detail-row">
                <BookOpen size={8} strokeWidth={2.5} />
                <span>{stats.totalTests} Tests Completed</span>
              </div>
            )}
          </div>
        </div>

        {/* QR */}
        <div className="id-card-qr-section">
          <div className="id-card-qr-box">
            <MiniQR value={id} />
          </div>
          <p className="id-card-qr-label">Scan to Verify</p>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="id-card-footer">
        <div>
          <p className="id-card-footer-label">STUDENT ID</p>
          <p className="id-card-footer-value">{String(id).slice(0, 8).toUpperCase()}</p>
        </div>
        <div className="id-card-footer-divider" />
        <div>
          <p className="id-card-footer-label">VALID YEAR</p>
          <p className="id-card-footer-value">{joinYear}–{Number(joinYear) + 1}</p>
        </div>
        <div className="id-card-footer-divider" />
        <div>
          <p className="id-card-footer-label">STATUS</p>
          <p className={`id-card-footer-value ${isActive ? 'color-green' : 'color-red'}`}>
            {isActive ? 'ACTIVE' : 'INACTIVE'}
          </p>
        </div>
      </div>

      {/* holographic strip */}
      <div className="id-card-holo-strip" />
    </div>
  );
}

// ── Back of ID Card ────────────────────────────────────────────────────────────
function IdCardBack({ data }) {
  const { name, institute, batches, id } = data;
  return (
    <div className="id-card-back">
      <div className="id-card-back-header">
        <p className="id-card-back-title">STUDENT INFORMATION</p>
      </div>
      <div className="id-card-back-body">
        <div className="id-card-back-row">
          <span className="id-card-back-label">Full Name</span>
          <span className="id-card-back-val">{name}</span>
        </div>
        <div className="id-card-back-row">
          <span className="id-card-back-label">Student ID</span>
          <span className="id-card-back-val mono">{id?.slice(0, 8).toUpperCase()}</span>
        </div>
        {institute && (
          <>
            <div className="id-card-back-row">
              <span className="id-card-back-label">Institute</span>
              <span className="id-card-back-val">{institute.name}</span>
            </div>
            {institute.address && (
              <div className="id-card-back-row">
                <span className="id-card-back-label">Address</span>
                <span className="id-card-back-val">{[institute.address, institute.city, institute.state, institute.pincode].filter(Boolean).join(', ')}</span>
              </div>
            )}
            {(institute.phone || institute.mobile) && (
              <div className="id-card-back-row">
                <span className="id-card-back-label">Contact</span>
                <span className="id-card-back-val">{institute.phone || institute.mobile}</span>
              </div>
            )}
            {institute.email && (
              <div className="id-card-back-row">
                <span className="id-card-back-label">Email</span>
                <span className="id-card-back-val">{institute.email}</span>
              </div>
            )}
            {institute.website && (
              <div className="id-card-back-row">
                <span className="id-card-back-label">Website</span>
                <span className="id-card-back-val">{institute.website}</span>
              </div>
            )}
          </>
        )}
        {batches?.length > 0 && (
          <div className="id-card-back-row">
            <span className="id-card-back-label">Batch(es)</span>
            <span className="id-card-back-val">{batches.map(b => b.name).join(', ')}</span>
          </div>
        )}
      </div>
      <div className="id-card-back-footer">
        <p>If found, please return to the institute.</p>
        <p>This card is the property of {institute?.name || 'the institution'}.</p>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function StudentIdCard() {
  const { studentId } = useParams(); // undefined when student views own card
  const { user, token } = useAuthStore();
  const isInstituteView = !!studentId;

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [flipped, setFlipped] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    const endpoint = isInstituteView
      ? `/institute/students/${studentId}/id-card`
      : '/student/id-card';

    api.get(endpoint)
      .then(res => setData(res.data.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load ID card'))
      .finally(() => setLoading(false));
  }, [studentId]);

  const handlePrint = () => {
    if (!data) return;

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const UPLOADS_URL  = API_BASE_URL.replace('/api', '/uploads/');

    const resolveImg = (path) => {
      if (!path) return '';
      if (path.startsWith('http')) return path;
      return UPLOADS_URL + path;
    };

    const instLogoUrl = resolveImg(data.institute?.logo);
    const avatarSrc   = resolveImg(data.avatar);
    const joinYear    = data.joinedAt ? new Date(data.joinedAt).getFullYear() : '—';
    const joinedFmt   = data.joinedAt
      ? new Date(data.joinedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : '—';
    const primaryBatch = data.batches?.[0]?.name || '';
    const allBatches   = data.batches?.map(b => b.name).join(', ') || '—';
    const shortId      = String(data.id).slice(0, 8).toUpperCase();
    const instName     = data.institute?.name || 'Independent Student';

    // Build QR-style SVG from student ID hash
    const buildQR = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
      const size = 10; const cellSize = 5; const dim = size * cellSize;
      let rects = '';
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const bit = (hash >> ((r * size + c) % 30)) & 1;
          const isCorner = (r < 3 && c < 3) || (r < 3 && c >= size - 3) || (r >= size - 3 && c < 3);
          if (isCorner || bit) {
            rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#1e1b4b"/>`;
          }
        }
      }
      return `<svg width="${dim}" height="${dim}" viewBox="0 0 ${dim} ${dim}" xmlns="http://www.w3.org/2000/svg"><rect width="${dim}" height="${dim}" fill="white"/>${rects}</svg>`;
    };
    const qrSvg = buildQR(data.id || 'student');
    const qrDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(qrSvg);

    const backRows = [
      ['Full Name',  data.name || '—'],
      ['Student ID', shortId],
      ['Institute',  instName],
      data.institute?.address ? ['Address', [data.institute.address, data.institute.city, data.institute.state, data.institute.pincode].filter(Boolean).join(', ')] : null,
      (data.institute?.phone || data.institute?.mobile) ? ['Contact', data.institute.phone || data.institute.mobile] : null,
      data.institute?.email   ? ['Email',   data.institute.email]   : null,
      data.institute?.website ? ['Website', data.institute.website] : null,
      data.batches?.length > 0 ? ['Batch(es)', allBatches] : null,
    ].filter(Boolean);

    const backRowsHtml = backRows.map(([label, val]) => `
      <div class="back-row">
        <span class="back-label">${label}</span>
        <span class="back-val">${val}</span>
      </div>`).join('');

    const printWin = window.open('', '_blank', 'width=900,height=700');
    printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>ID Card – ${data.name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #1a1040;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: 'Inter', sans-serif;
      padding: 8mm 6mm;
      gap: 6mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    h2 { color: #c4b5fd; font-size: 4mm; font-weight: 700; letter-spacing: 0.3mm; }
    .cards-row {
      display: flex;
      gap: 6mm;
      flex-wrap: wrap;
      justify-content: center;
    }

    /* ── FRONT CARD ── */
    .card-front {
      width: 85.6mm;
      height: 54mm;
      border-radius: 3mm;
      overflow: hidden;
      background: linear-gradient(160deg, #0f0c29, #1a1040, #24243e);
      box-shadow: 0 4mm 12mm rgba(0,0,0,0.4);
      position: relative;
      display: flex;
      flex-direction: column;
    }
    .card-header {
      padding: 2mm 3mm 1.5mm;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      position: relative;
      overflow: hidden;
      flex-shrink: 0;
    }
    .card-header::before {
      content: '';
      position: absolute;
      top: -5mm; right: -5mm;
      width: 15mm; height: 15mm;
      border-radius: 50%;
      background: rgba(255,255,255,0.08);
    }
    .card-header::after {
      content: '';
      position: absolute;
      bottom: -4mm; left: -3mm;
      width: 11mm; height: 11mm;
      border-radius: 50%;
      background: rgba(255,255,255,0.05);
    }
    .card-header-top {
      display: flex;
      align-items: center;
      gap: 2mm;
      position: relative;
      z-index: 2;
    }
    .inst-logo {
      width: 7mm; height: 7mm;
      border-radius: 1.5mm;
      object-fit: cover;
      border: 0.4mm solid rgba(255,255,255,0.3);
      background: white;
      flex-shrink: 0;
    }
    .inst-logo-placeholder {
      width: 7mm; height: 7mm;
      border-radius: 1.5mm;
      background: rgba(255,255,255,0.15);
      border: 0.4mm solid rgba(255,255,255,0.3);
      display: flex; align-items: center; justify-content: center;
      color: white;
      font-size: 4mm;
      flex-shrink: 0;
    }
    .inst-name { font-weight: 800; font-size: 2.5mm; color: white; line-height: 1.2; }
    .inst-tagline { font-size: 1.8mm; color: rgba(255,255,255,0.65); font-weight: 400; margin-top: 0.5mm; }
    .shield-badge {
      margin-left: auto;
      width: 5mm; height: 5mm;
      background: rgba(255,255,255,0.15);
      border-radius: 1mm;
      display: flex; align-items: center; justify-content: center;
      color: rgba(255,255,255,0.8);
      font-size: 3mm;
      flex-shrink: 0;
    }
    .chip-label {
      font-size: 1.5mm;
      letter-spacing: 0.5mm;
      color: rgba(255,255,255,0.5);
      font-weight: 700;
      text-transform: uppercase;
      margin-top: 1mm;
      position: relative;
      z-index: 2;
    }
    .card-body {
      padding: 2mm 3mm;
      display: flex;
      gap: 2.5mm;
      align-items: flex-start;
      flex: 1;
    }
    .avatar-wrap { position: relative; flex-shrink: 0; }
    .avatar-img {
      width: 12mm; height: 15mm;
      border-radius: 1.5mm;
      object-fit: cover;
      border: 0.5mm solid rgba(139,92,246,0.5);
    }
    .avatar-placeholder {
      width: 12mm; height: 15mm;
      border-radius: 1.5mm;
      background: linear-gradient(135deg, #2d1b69, #4c1d95);
      display: flex; align-items: center; justify-content: center;
      border: 0.5mm solid rgba(139,92,246,0.5);
      font-size: 7mm;
      color: rgba(255,255,255,0.4);
    }
    .status-dot {
      position: absolute;
      bottom: -0.5mm; right: -0.5mm;
      width: 2mm; height: 2mm;
      border-radius: 50%;
      border: 0.4mm solid #1a1040;
    }
    .status-dot.active   { background: #10b981; }
    .status-dot.inactive { background: #ef4444; }
    .card-info { flex: 1; min-width: 0; }
    .student-name {
      font-size: 3mm;
      font-weight: 800;
      color: white;
      line-height: 1.2;
      margin-bottom: 1mm;
      font-family: 'Space Grotesk', sans-serif;
    }
    .batch-badge {
      display: inline-block;
      font-size: 1.6mm; font-weight: 700;
      letter-spacing: 0.3mm; text-transform: uppercase;
      padding: 0.5mm 1.2mm;
      border-radius: 0.8mm;
      background: rgba(139,92,246,0.25);
      color: #c4b5fd;
      border: 0.3mm solid rgba(139,92,246,0.4);
      margin-bottom: 1.2mm;
    }
    .detail-row {
      display: flex;
      align-items: center;
      gap: 1mm;
      color: rgba(255,255,255,0.6);
      font-size: 2mm;
      font-weight: 500;
      margin-bottom: 0.8mm;
    }
    .detail-icon { color: rgba(139,92,246,0.8); font-size: 2mm; }
    .qr-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.8mm;
      flex-shrink: 0;
    }
    .qr-box {
      padding: 1mm;
      background: white;
      border-radius: 1mm;
      box-shadow: 0 1mm 3mm rgba(0,0,0,0.3);
    }
    .qr-box img { display: block; width: 12mm; height: 12mm; }
    .qr-label {
      font-size: 1.4mm;
      color: rgba(255,255,255,0.35);
      font-weight: 600;
      text-align: center;
      white-space: nowrap;
    }
    .card-footer {
      margin: 0 2.5mm 2mm;
      background: rgba(255,255,255,0.06);
      border: 0.3mm solid rgba(255,255,255,0.1);
      border-radius: 1.5mm;
      padding: 1.2mm 2.5mm;
      display: flex;
      align-items: center;
      gap: 2mm;
      flex-shrink: 0;
    }
    .footer-cell { flex: 1; text-align: center; }
    .footer-divider { width: 0.3mm; height: 4mm; background: rgba(255,255,255,0.12); flex-shrink: 0; }
    .footer-label {
      font-size: 1.4mm; letter-spacing: 0.3mm; text-transform: uppercase;
      color: rgba(255,255,255,0.35); font-weight: 700; margin-bottom: 0.4mm;
    }
    .footer-value {
      font-size: 2mm; font-weight: 800; color: white;
      font-family: 'Space Grotesk', sans-serif;
    }
    .footer-value.green { color: #34d399; }
    .footer-value.red   { color: #f87171; }
    .holo-strip {
      height: 1mm;
      background: linear-gradient(90deg, #4f46e5, #7c3aed, #ec4899, #f59e0b, #10b981, #3b82f6, #4f46e5);
      flex-shrink: 0;
    }

    /* ── BACK CARD ── */
    .card-back {
      width: 85.6mm;
      height: 54mm;
      border-radius: 3mm;
      overflow: hidden;
      background: linear-gradient(160deg, #1e1b4b, #312e81);
      box-shadow: 0 4mm 12mm rgba(0,0,0,0.4);
      display: flex;
      flex-direction: column;
    }
    .back-header {
      padding: 2mm 3mm 1.5mm;
      background: linear-gradient(90deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3));
      border-bottom: 0.3mm solid rgba(255,255,255,0.08);
      flex-shrink: 0;
    }
    .back-title {
      font-size: 1.5mm; letter-spacing: 0.5mm; font-weight: 800;
      color: rgba(255,255,255,0.5); text-transform: uppercase;
    }
    .back-body { padding: 2mm 3mm; display: flex; flex-direction: column; gap: 1mm; flex: 1; overflow: hidden; }
    .back-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 2mm;
      padding-bottom: 1mm;
      border-bottom: 0.3mm solid rgba(255,255,255,0.06);
    }
    .back-row:last-child { border-bottom: none; }
    .back-label {
      font-size: 1.6mm; font-weight: 600;
      color: rgba(255,255,255,0.35);
      text-transform: uppercase; letter-spacing: 0.3mm;
      flex-shrink: 0; width: 14mm;
    }
    .back-val {
      font-size: 2mm; color: rgba(255,255,255,0.85);
      font-weight: 500; text-align: right; word-break: break-word;
    }
    .back-footer {
      padding: 1.2mm 3mm;
      background: rgba(0,0,0,0.15);
      border-top: 0.3mm solid rgba(255,255,255,0.06);
      flex-shrink: 0;
    }
    .back-footer p { font-size: 1.5mm; color: rgba(255,255,255,0.3); margin-bottom: 0.5mm; }

    /* ── PRINT — one card per page at exact 85.6×54mm ── */
    @media print {
      @page { size: 85.6mm 54mm; margin: 0; }
      body { background: white !important; padding: 0; min-height: unset; justify-content: flex-start; gap: 0; }
      h2 { display: none; }
      .cards-row { gap: 0; flex-direction: column; }
      .card-front { page-break-after: always; break-after: page; }
      .card-front, .card-back {
        width: 85.6mm; height: 54mm;
        border-radius: 3mm;
        box-shadow: none !important;
      }
    }
  </style>
</head>
<body>
  <h2>Student ID Card — ${data.name}</h2>
  <div class="cards-row">
    <!-- FRONT -->
    <div class="card-front">
      <div class="card-header">
        <div class="card-header-top">
          ${instLogoUrl
            ? `<img src="${instLogoUrl}" class="inst-logo" alt="logo" onerror="this.style.display='none'"/>`
            : `<div class="inst-logo-placeholder">🏫</div>`}
          <div>
            <div class="inst-name">${instName}</div>
            ${data.institute?.tagline ? `<div class="inst-tagline">${data.institute.tagline}</div>` : ''}
          </div>
          <div class="shield-badge">🛡</div>
        </div>
        <div class="chip-label">STUDENT IDENTITY CARD</div>
      </div>
      <div class="card-body">
        <div class="avatar-wrap">
          ${avatarSrc
            ? `<img src="${avatarSrc}" class="avatar-img" alt="${data.name}" onerror="this.outerHTML='<div class=\\'avatar-placeholder\\'>👤</div>'"/>`
            : `<div class="avatar-placeholder">👤</div>`}
          <div class="status-dot ${data.isActive ? 'active' : 'inactive'}"></div>
        </div>
        <div class="card-info">
          <div class="student-name">${data.name}</div>
          ${primaryBatch ? `<div class="batch-badge">${primaryBatch}</div>` : ''}
          <div>
            ${data.mobile ? `<div class="detail-row"><span class="detail-icon">📞</span><span>${data.mobile}</span></div>` : ''}
            ${data.email  ? `<div class="detail-row"><span class="detail-icon">✉</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:130px">${data.email}</span></div>` : ''}
            ${(data.institute?.city || data.institute?.state) ? `<div class="detail-row"><span class="detail-icon">📍</span><span>${[data.institute.city, data.institute.state].filter(Boolean).join(', ')}</span></div>` : ''}
            <div class="detail-row"><span class="detail-icon">📅</span><span>Joined ${joinedFmt}</span></div>
            ${data.stats?.totalTests > 0 ? `<div class="detail-row"><span class="detail-icon">📖</span><span>${data.stats.totalTests} Tests Completed</span></div>` : ''}
          </div>
        </div>
        <div class="qr-section">
          <div class="qr-box">
            <img src="${qrDataUrl}" width="50" height="50" alt="QR"/>
          </div>
          <div class="qr-label">Scan to Verify</div>
        </div>
      </div>
      <div class="card-footer">
        <div class="footer-cell">
          <div class="footer-label">STUDENT ID</div>
          <div class="footer-value">${shortId}</div>
        </div>
        <div class="footer-divider"></div>
        <div class="footer-cell">
          <div class="footer-label">VALID YEAR</div>
          <div class="footer-value">${joinYear}–${Number(joinYear) + 1}</div>
        </div>
        <div class="footer-divider"></div>
        <div class="footer-cell">
          <div class="footer-label">STATUS</div>
          <div class="footer-value ${data.isActive ? 'green' : 'red'}">${data.isActive ? 'ACTIVE' : 'INACTIVE'}</div>
        </div>
      </div>
      <div class="holo-strip"></div>
    </div>

    <!-- BACK -->
    <div class="card-back">
      <div class="back-header">
        <div class="back-title">STUDENT INFORMATION</div>
      </div>
      <div class="back-body">
        ${backRowsHtml}
      </div>
      <div class="back-footer">
        <p>If found, please return to the institute.</p>
        <p>This card is the property of ${instName}.</p>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 800);
    };
  </script>
</body>
</html>`);
    printWin.document.close();
  };

  if (loading) return (
    <div className="idcard-page">
      <div className="idcard-loading">
        <div className="idcard-spinner" />
        <p>Generating your ID Card…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="idcard-page">
      <div className="idcard-error">
        <XCircle size={48} className="idcard-error-icon" />
        <h2>Couldn't load ID Card</h2>
        <p>{error}</p>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Print stylesheet injected via style tag ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap');

        /* ── CARD STYLES — CR80 screen preview (370×233px) — Ocean Blue/Teal theme ── */
        .id-card-front, .id-card-back {
          width: 370px;
          height: 233px;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 20px 60px rgba(14,165,233,0.25), 0 4px 16px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.15);
          font-family: 'Inter', sans-serif;
          backface-visibility: hidden;
        }

        .id-card-front {
          background: linear-gradient(160deg, #0d1b2e 0%, #0f2744 50%, #0c3460 100%);
          display: flex;
          flex-direction: column;
        }

        /* Holographic shimmer */
        .id-card-holo {
          position: absolute;
          inset: 0;
          background: linear-gradient(125deg,
            transparent 20%,
            rgba(14,165,233,0.07) 30%,
            rgba(6,182,212,0.09) 45%,
            rgba(34,211,238,0.06) 55%,
            transparent 65%
          );
          pointer-events: none;
          z-index: 1;
        }

        .id-card-header {
          padding: 8px 12px 5px;
          background: linear-gradient(135deg, #0ea5e9, #0284c7, #0369a1);
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }
        .id-card-header::before {
          content: '';
          position: absolute;
          top: -20px; right: -20px;
          width: 60px; height: 60px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
        }
        .id-card-header::after {
          content: '';
          position: absolute;
          bottom: -15px; left: -10px;
          width: 45px; height: 45px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
        }

        .id-card-header-content {
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
          z-index: 2;
        }

        .id-card-inst-logo {
          width: 26px; height: 26px;
          border-radius: 6px;
          object-fit: cover;
          border: 1.5px solid rgba(255,255,255,0.3);
          background: white;
          flex-shrink: 0;
        }
        .id-card-inst-logo-placeholder {
          width: 26px; height: 26px;
          border-radius: 6px;
          background: rgba(255,255,255,0.15);
          border: 1.5px solid rgba(255,255,255,0.3);
          display: flex; align-items: center; justify-content: center;
          color: white;
          flex-shrink: 0;
        }
        .id-card-inst-name {
          font-weight: 800;
          font-size: 9px;
          color: white;
          line-height: 1.2;
          margin: 0;
        }
        .id-card-inst-tagline {
          font-size: 7px;
          color: rgba(255,255,255,0.65);
          margin: 1px 0 0;
          font-weight: 400;
        }
        .id-card-shield {
          margin-left: auto;
          width: 18px; height: 18px;
          background: rgba(255,255,255,0.15);
          border-radius: 5px;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.8);
          flex-shrink: 0;
        }
        .id-card-chip-label {
          font-size: 6px;
          letter-spacing: 2px;
          color: rgba(255,255,255,0.5);
          font-weight: 700;
          text-transform: uppercase;
          margin: 4px 0 0;
          position: relative;
          z-index: 2;
        }

        .id-card-body {
          padding: 7px 10px;
          display: flex;
          gap: 8px;
          align-items: flex-start;
          flex: 1;
        }

        .id-card-avatar-wrap {
          position: relative;
          flex-shrink: 0;
        }
        .id-card-avatar, .id-card-avatar-placeholder {
          width: 36px; height: 48px;
          border-radius: 5px;
          object-fit: cover;
          border: 1.5px solid rgba(14,165,233,0.6);
          box-shadow: 0 3px 10px rgba(14,165,233,0.3);
        }
        .id-card-avatar-placeholder {
          background: linear-gradient(135deg, #0c2d4f, #0f4473);
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.4);
        }
        .id-card-status-dot {
          position: absolute;
          bottom: -2px; right: -2px;
          width: 8px; height: 8px;
          border-radius: 50%;
          border: 1.5px solid #0f2744;
        }
        .id-card-status-dot.active  { background: #10b981; box-shadow: 0 0 4px #10b981; }
        .id-card-status-dot.inactive{ background: #ef4444; }

        .id-card-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .id-card-name {
          font-size: 9.5px;
          font-weight: 800;
          color: white;
          margin: 0 0 2px;
          line-height: 1.2;
          font-family: 'Space Grotesk', sans-serif;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .id-card-batch-badge {
          display: inline-block;
          font-size: 5.5px;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          padding: 1.5px 4px;
          border-radius: 3px;
          background: rgba(14,165,233,0.2);
          color: #7dd3fc;
          border: 1px solid rgba(14,165,233,0.35);
          margin-bottom: 4px;
        }

        .id-card-details {
          display: flex;
          flex-direction: column;
          gap: 1.5px;
        }
        .id-card-detail-row {
          display: flex;
          align-items: center;
          gap: 4px;
          color: rgba(255,255,255,0.6);
          font-size: 6.5px;
          font-weight: 500;
          line-height: 1.3;
        }
        .id-card-detail-row svg {
          flex-shrink: 0;
          color: rgba(14,165,233,0.9);
        }
        .id-card-detail-email {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 110px;
        }

        .id-card-qr-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          flex-shrink: 0;
          align-self: center;
        }
        .id-card-qr-box {
          padding: 3px;
          background: white;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          line-height: 0;
        }
        .id-card-qr-label {
          font-size: 5px;
          color: rgba(255,255,255,0.35);
          font-weight: 600;
          letter-spacing: 0.3px;
          text-align: center;
          white-space: nowrap;
        }

        .id-card-footer {
          margin: 0 10px 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(14,165,233,0.15);
          border-radius: 6px;
          padding: 5px 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .id-card-footer > div {
          flex: 1;
          text-align: center;
        }
        .id-card-footer-divider {
          width: 1px;
          height: 16px;
          background: rgba(14,165,233,0.2);
          flex: none !important;
        }
        .id-card-footer-label {
          font-size: 5px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          font-weight: 700;
          margin: 0 0 1px;
        }
        .id-card-footer-value {
          font-size: 7px;
          font-weight: 800;
          color: white;
          margin: 0;
          font-family: 'Space Grotesk', sans-serif;
        }
        .color-green { color: #34d399 !important; }
        .color-red   { color: #f87171 !important; }

        .id-card-holo-strip {
          height: 3px;
          background: linear-gradient(90deg, #4f46e5, #7c3aed, #ec4899, #f59e0b, #10b981, #3b82f6, #4f46e5);
          background-size: 200% 100%;
          animation: holoShift 3s linear infinite;
          flex-shrink: 0;
        }
        @keyframes holoShift {
          0%   { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        /* ── BACK ── */
        .id-card-back {
          background: linear-gradient(160deg, #0a1628, #0d2040, #0f2e5a);
          display: flex;
          flex-direction: column;
        }
        .id-card-back-header {
          padding: 8px 12px 6px;
          background: linear-gradient(90deg, rgba(14,165,233,0.25), rgba(6,182,212,0.2));
          border-bottom: 1px solid rgba(14,165,233,0.15);
          flex-shrink: 0;
        }
        .id-card-back-title {
          font-size: 6px;
          letter-spacing: 2px;
          font-weight: 800;
          color: rgba(125,211,252,0.7);
          margin: 0;
        }
        .id-card-back-body {
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          overflow: hidden;
        }
        .id-card-back-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          padding-bottom: 4px;
          border-bottom: 1px solid rgba(14,165,233,0.1);
        }
        .id-card-back-row:last-child { border-bottom: none; }
        .id-card-back-label {
          font-size: 6px;
          font-weight: 600;
          color: rgba(125,211,252,0.5);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          flex-shrink: 0;
          width: 50px;
        }
        .id-card-back-val {
          font-size: 7px;
          color: rgba(255,255,255,0.85);
          font-weight: 500;
          text-align: right;
          word-break: break-word;
        }
        .id-card-back-val.mono {
          font-family: monospace;
          letter-spacing: 1px;
        }
        .id-card-back-footer {
          padding: 5px 12px;
          background: rgba(14,165,233,0.06);
          border-top: 1px solid rgba(14,165,233,0.12);
          flex-shrink: 0;
        }
        .id-card-back-footer p {
          font-size: 5.5px;
          color: rgba(125,211,252,0.3);
          margin: 0 0 1px;
        }

        /* ── PAGE LAYOUT — light background ── */
        .idcard-page {
          min-height: 100vh;
          background: linear-gradient(145deg, #f0f4ff 0%, #e8f4fd 40%, #f0fff4 100%);
          padding: 32px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
        }
        .idcard-page::before {
          content: '';
          position: fixed;
          top: -80px; left: -80px;
          width: 320px; height: 320px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .idcard-page::after {
          content: '';
          position: fixed;
          bottom: -60px; right: -60px;
          width: 260px; height: 260px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%);
          pointer-events: none;
        }
        .idcard-page-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .idcard-page-title h1 {
          font-size: 22px;
          font-weight: 800;
          color: #1e293b;
          margin: 0;
          font-family: 'Space Grotesk', sans-serif;
        }
        .idcard-page-sub {
          color: #64748b;
          font-size: 13px;
          margin: 0 0 32px;
        }

        .idcard-card-area {
          perspective: 1200px;
          margin-bottom: 28px;
          display: flex;
          justify-content: center;
        }
        @media (max-width: 400px) {
          .idcard-card-area {
            transform: scale(0.85);
            transform-origin: top center;
            margin-bottom: 0px;
          }
        }
        @media (max-width: 350px) {
          .idcard-card-area {
            transform: scale(0.75);
            transform-origin: top center;
            margin-bottom: -15px;
          }
        }
        .idcard-flipper {
          width: 370px;
          height: 233px;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .idcard-flipper.flipped {
          transform: rotateY(180deg);
        }
        .idcard-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .idcard-face.back {
          transform: rotateY(180deg);
        }

        .idcard-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 24px;
        }
        .idcard-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 22px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
          font-family: 'Inter', sans-serif;
        }
        .idcard-btn:active { transform: scale(0.96); }
        .idcard-btn-primary {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: white;
          box-shadow: 0 8px 24px rgba(99,102,241,0.3);
        }
        .idcard-btn-primary:hover { box-shadow: 0 12px 32px rgba(99,102,241,0.4); }
        .idcard-btn-secondary {
          background: rgba(255,255,255,0.9);
          color: #475569;
          border: 1px solid rgba(0,0,0,0.1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .idcard-btn-secondary:hover { background: white; }

        .idcard-flip-hint {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .idcard-flip-hint svg { animation: spin 3s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .idcard-info-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 8px;
        }
        .idcard-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 20px;
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(0,0,0,0.08);
          color: #475569;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          backdrop-filter: blur(4px);
        }
        .idcard-badge.green { color: #059669; border-color: rgba(5,150,105,0.25); background: rgba(209,250,229,0.8); }
        .idcard-badge.red   { color: #dc2626; border-color: rgba(220,38,38,0.2);  background: rgba(254,226,226,0.8); }
        .idcard-badge.blue  { color: #2563eb; border-color: rgba(37,99,235,0.2);  background: rgba(219,234,254,0.8); }

        .idcard-loading, .idcard-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 60px 20px;
          color: #64748b;
          font-size: 14px;
          text-align: center;
        }
        .idcard-spinner {
          width: 44px; height: 44px;
          border: 3px solid #e2e8f0;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .idcard-error-icon { color: #ef4444; }
        .idcard-error h2 { font-size: 18px; color: #1e293b; margin: 0; }
        .idcard-error p  { color: #64748b; margin: 0; font-size: 13px; }

        /* ── PRINT STYLES ── */
        @media print {
          body * { visibility: hidden; }
          #id-card-printable, #id-card-printable * { visibility: visible; }
          #id-card-printable {
            position: fixed;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            box-shadow: none !important;
          }
          .idcard-page, .idcard-actions, .idcard-info-badges,
          .idcard-page-title, .idcard-page-sub, .idcard-flip-hint { display: none !important; }
        }
      `}</style>

      <div className="idcard-page">
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div className="idcard-page-title">
            <IdCard size={26} color="#818cf8" />
            <h1>Student ID Card</h1>
          </div>
          <p className="idcard-page-sub">
            {isInstituteView ? `Viewing card for ${data?.name}` : 'Your official digital identity card'}
          </p>
        </div>

        {/* Badges row */}
        {data && (
          <div className="idcard-info-badges" style={{ marginBottom: 28 }}>
            <div className={`idcard-badge ${data.isActive ? 'green' : 'red'}`}>
              {data.isActive
                ? <><CheckCircle size={12} /> Active</>
                : <><XCircle size={12} /> Inactive</>}
            </div>
            {data.institute && (
              <div className="idcard-badge blue">
                <Building2 size={12} /> {data.institute.name}
              </div>
            )}
            {data.batches?.length > 0 && (
              <div className="idcard-badge">
                <Layers size={12} /> {data.batches.length} Batch{data.batches.length > 1 ? 'es' : ''}
              </div>
            )}
            {data.stats?.totalTests > 0 && (
              <div className="idcard-badge">
                <BookOpen size={12} /> {data.stats.totalTests} Tests Done
              </div>
            )}
          </div>
        )}

        {/* Card flipper */}
        {data && (
          <div className="idcard-card-area" onClick={() => setFlipped(f => !f)}>
            <div className={`idcard-flipper ${flipped ? 'flipped' : ''}`}>
              <div className="idcard-face front">
                <IdCardFront data={data} />
              </div>
              <div className="idcard-face back">
                <IdCardBack data={data} />
              </div>
            </div>
          </div>
        )}

        <p className="idcard-flip-hint" style={{ marginBottom: 20 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M1 4v6h6M23 20v-6h-6" /><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
          </svg>
          Click the card to flip it
        </p>

        {/* Action buttons */}
        <div className="idcard-actions">
          <button className="idcard-btn idcard-btn-primary" onClick={handlePrint}>
            <Printer size={16} /> Print ID Card
          </button>
          <button className="idcard-btn idcard-btn-secondary" onClick={() => setFlipped(f => !f)}>
            <ArrowLeft size={16} /> {flipped ? 'View Front' : 'View Back'}
          </button>
          <button className="idcard-btn idcard-btn-secondary" onClick={() => window.history.back()}>
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </div>
    </>
  );
}
