import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Users, Star, Shield, BookOpen, ArrowRight, Zap, Award } from 'lucide-react';
import api from '../lib/api';

import { getImageUrl } from '../lib/imageUrl';

const planColors = {
  enterprise: { bg: '#fef3c7', color: '#92400e', icon: '👑' },
  pro: { bg: '#ede9fe', color: '#5b21b6', icon: '⚡' },
  basic: { bg: '#dbeafe', color: '#1e40af', icon: '🔹' },
  free: { bg: '#f1f5f9', color: '#475569', icon: '🆓' },
};

const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli", "Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

export default function InstitutesListPage() {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get('/public/institutes', { params: { search, state: selectedState, city: selectedCity, page, limit: 12 } });
        setInstitutes(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
      } catch {
        setInstitutes([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [search, page, selectedState, selectedCity]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const featured = institutes.filter(i => i.isFeatured);
  const regular = institutes.filter(i => !i.isFeatured);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .ilp-list-wrap { font-family: 'Inter', -apple-system, sans-serif; min-height: 100vh; background: #f8fafc; color: #1e293b; }

        /* Hero Header */
        .ilp-list-hero { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e3a5f 100%); padding: 6rem 1.5rem 2.5rem; text-align: center; position: relative; overflow: hidden; }
        .ilp-list-hero::before { content: ''; position: absolute; inset: 0; background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); pointer-events: none; }
        .ilp-list-hero-badge { display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(245,158,11,0.2); border: 1px solid rgba(245,158,11,0.4); color: #fbbf24; font-size: 0.75rem; font-weight: 700; padding: 0.35rem 0.8rem; border-radius: 20px; margin-bottom: 1rem; letter-spacing: 0.04em; }
        .ilp-list-hero h1 { font-size: clamp(1.75rem, 4vw, 2.75rem); font-weight: 900; color: white; margin-bottom: 0.75rem; line-height: 1.15; }
        .ilp-list-hero p { color: rgba(255,255,255,0.7); font-size: 0.95rem; margin-bottom: 1.5rem; max-width: 520px; margin-left: auto; margin-right: auto; line-height: 1.5; }
        .ilp-list-search-form { display: flex; gap: 0; max-width: 540px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
        .ilp-list-search-input { flex: 1; border: none; padding: 0.875rem 1.15rem; font-size: 0.9rem; outline: none; color: #1e293b; background: transparent; }
        .ilp-list-search-btn { background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; border: none; padding: 0 1.25rem; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: opacity 0.2s; }
        .ilp-list-search-btn:hover { opacity: 0.9; }
        .ilp-list-stats-row { display: flex; justify-content: center; gap: 2rem; margin-top: 1.75rem; }
        .ilp-list-stats-row span { color: rgba(255,255,255,0.6); font-size: 0.75rem; display: flex; align-items: center; gap: 0.4rem; }
        .ilp-list-stats-row strong { color: white; font-weight: 700; }

        /* Content */
        .ilp-list-content { max-width: 1100px; margin: 0 auto; padding: 2rem 1.5rem; }

        /* Section Labels */
        .ilp-section-label { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; }
        .ilp-section-label h2 { font-size: 1.125rem; font-weight: 800; color: #1e293b; }
        .ilp-section-label-badge { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; font-size: 0.65rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 20px; letter-spacing: 0.08em; text-transform: uppercase; }

        /* Cards Grid */
        .ilp-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.25rem; margin-bottom: 2.5rem; }

        /* Institute Card */
        .ilp-inst-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; transition: all 0.25s; display: flex; flex-direction: column; }
        .ilp-inst-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(99,102,241,0.15); border-color: #c7d2fe; }
        .ilp-inst-card-banner { height: 110px; background: linear-gradient(135deg, #1e1b4b, #4f46e5); position: relative; overflow: hidden; }
        .ilp-inst-card-banner img { width: 100%; height: 100%; object-fit: cover; }
        .ilp-inst-card-featured-badge { position: absolute; top: 0.625rem; right: 0.625rem; display: flex; align-items: center; gap: 0.3rem; background: rgba(245,158,11,0.85); backdrop-filter: blur(4px); color: white; font-size: 0.65rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 20px; letter-spacing: 0.06em; }
        .ilp-inst-card-body { padding: 0 1.25rem 1.25rem; flex: 1; display: flex; flex-direction: column; }
        .ilp-inst-card-logo-wrap { margin-top: -26px; margin-bottom: 0.75rem; position: relative; z-index: 10; }
        .ilp-inst-card-logo { width: 52px; height: 52px; border-radius: 12px; background: white; border: 3px solid white; box-shadow: 0 2px 12px rgba(0,0,0,0.15); overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: 800; color: #6366f1; }
        .ilp-inst-card-logo img { width: 100%; height: 100%; object-fit: cover; }
        .ilp-inst-card-name { font-size: 1rem; font-weight: 800; color: #1e293b; margin-bottom: 0.25rem; }
        .ilp-inst-card-tagline { font-size: 0.8125rem; color: #64748b; line-height: 1.45; margin-bottom: 0.75rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .ilp-inst-card-meta { display: flex; flex-wrap: wrap; gap: 0.625rem; margin-bottom: 1rem; }
        .ilp-inst-card-meta-tag { display: flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; color: #64748b; background: #f8fafc; padding: 0.25rem 0.625rem; border-radius: 20px; }
        .ilp-inst-card-plan { font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 20px; letter-spacing: 0.04em; }
        .ilp-inst-card-footer { margin-top: auto; padding-top: 0.875rem; border-top: 1px solid #f1f5f9; }
        .ilp-inst-card-link { display: flex; align-items: center; justify-content: space-between; background: linear-gradient(135deg, #f8fafc, #f1f5ff); border: 1px solid #c7d2fe; border-radius: 10px; padding: 0.625rem 1rem; text-decoration: none; color: #4f46e5; font-weight: 700; font-size: 0.8125rem; transition: all 0.2s; }
        .ilp-inst-card-link:hover { background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; border-color: transparent; }

        /* Pagination */
        .ilp-pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 2rem; }
        .ilp-page-btn { padding: 0.625rem 1.25rem; border: 1px solid #e2e8f0; border-radius: 10px; background: white; cursor: pointer; font-size: 0.875rem; font-weight: 600; color: #64748b; transition: all 0.2s; }
        .ilp-page-btn:hover:not(:disabled) { border-color: #6366f1; color: #6366f1; }
        .ilp-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .ilp-page-info { font-size: 0.875rem; color: #64748b; }

        /* Loading */
        .ilp-cards-loading { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.25rem; }
        .ilp-skeleton { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
        .ilp-skeleton-banner { height: 110px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
        .ilp-skeleton-body { padding: 1.25rem; }
        .ilp-skeleton-line { height: 12px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 6px; margin-bottom: 0.75rem; }
        @keyframes shimmer { to { background-position: -200% 0; } }

        /* Empty */
        .ilp-empty-state { text-align: center; padding: 4rem 2rem; }
        .ilp-empty-icon { font-size: 3.5rem; margin-bottom: 1rem; }
        .ilp-empty-state h3 { font-size: 1.25rem; font-weight: 800; color: #1e293b; margin-bottom: 0.5rem; }
        .ilp-empty-state p { color: #64748b; font-size: 0.9rem; }

        /* Location Form */
        .ilp-location-form { position: relative; z-index: 10; max-width: 600px; margin: 0 auto; background: white; padding: 1.5rem; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); text-align: left; }
        .ilp-location-form label { display: block; font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 0.5rem; }
        .ilp-location-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
        .ilp-location-input { width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.75rem 1rem; font-size: 0.95rem; color: #1e293b; background: #f8fafc; outline: none; transition: border-color 0.2s; }
        .ilp-location-input:focus { border-color: #6366f1; background: white; }
        .ilp-location-btn { width: 100%; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; border: none; padding: 1rem; font-weight: 700; font-size: 1rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: opacity 0.2s; }
        .ilp-location-btn:hover { opacity: 0.9; }

        /* Responsive */
        @media (max-width: 480px) { 
          .ilp-list-stats-row { gap: 1rem; flex-wrap: wrap; justify-content: center; } 
          .ilp-location-inputs { grid-template-columns: 1fr; } 
        }
      `}</style>

      <div className="ilp-list-wrap">
        {/* Hero */}
        <div className="ilp-list-hero">
          <div className="ilp-list-hero-badge"><Award size={12} /> Verified Institutes</div>
          <h1>Find the Perfect <br />Coaching Institute</h1>
          <p>Browse top coaching centres with live mock tests, expert faculty, and proven results.</p>
          
          {!locationConfirmed ? (
            <form className="ilp-location-form" onSubmit={(e) => { e.preventDefault(); setLocationConfirmed(true); }}>
              <div className="ilp-location-inputs">
                <div>
                  <label>Select State</label>
                  <select 
                    className="ilp-location-input" 
                    value={selectedState} 
                    onChange={e => setSelectedState(e.target.value)}
                    required
                  >
                    <option value="">Choose State...</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label>Enter City</label>
                  <input
                    className="ilp-location-input"
                    placeholder="E.g. Mumbai, Delhi..."
                    value={selectedCity}
                    onChange={e => setSelectedCity(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="ilp-location-btn">
                <MapPin size={18} /> Find Institutes Near Me
              </button>
            </form>
          ) : (
            <>
              <form className="ilp-list-search-form" onSubmit={handleSearch}>
                <input
                  className="ilp-list-search-input"
                  placeholder="Search institutes by name or course..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                />
                <button type="submit" className="ilp-list-search-btn">
                  <Search size={15} /> Search
                </button>
              </form>
              <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                Showing results for <strong>{selectedCity}, {selectedState}</strong>.{' '}
                <button onClick={() => { setLocationConfirmed(false); setSearch(''); setSearchInput(''); }} style={{ background:'none', border:'none', color:'#fbbf24', cursor:'pointer', textDecoration:'underline', padding: 0 }}>Change Location</button>
              </div>
            </>
          )}

          <div className="ilp-list-stats-row">
            <span><Zap size={12} /> <strong>{total || institutes.length}+</strong> Institutes</span>
            <span><Users size={12} /> <strong>50,000+</strong> Students</span>
            <span><BookOpen size={12} /> <strong>1,000+</strong> Mock Tests</span>
          </div>
        </div>

        {/* Content */}
        <div className="ilp-list-content">
          {loading ? (
            <div className="ilp-cards-loading">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="ilp-skeleton">
                  <div className="ilp-skeleton-banner" />
                  <div className="ilp-skeleton-body">
                    <div className="ilp-skeleton-line" style={{ width: '60%' }} />
                    <div className="ilp-skeleton-line" style={{ width: '90%' }} />
                    <div className="ilp-skeleton-line" style={{ width: '75%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : institutes.length === 0 ? (
            <div className="ilp-empty-state">
              <div className="ilp-empty-icon">🔍</div>
              <h3>No institutes found</h3>
              <p>Try a different search or check back later.</p>
            </div>
          ) : (
            <>
              {/* Featured */}
              {featured.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <div className="ilp-section-label">
                    <h2>⭐ Featured Institutes</h2>
                    <span className="ilp-section-label-badge">Top Rated</span>
                  </div>
                  <div className="ilp-cards-grid">
                    {featured.map(inst => <InstituteCard key={inst.id} institute={inst} />)}
                  </div>
                </div>
              )}

              {/* All */}
              {regular.length > 0 && (
                <div>
                  <div className="ilp-section-label">
                    <h2>🏫 All Institutes</h2>
                  </div>
                  <div className="ilp-cards-grid">
                    {regular.map(inst => <InstituteCard key={inst.id} institute={inst} />)}
                  </div>
                </div>
              )}

              {/* Pagination */}
              {total > 12 && (
                <div className="ilp-pagination">
                  <button className="ilp-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
                  <span className="ilp-page-info">Page {page} of {Math.ceil(total / 12)}</span>
                  <button className="ilp-page-btn" onClick={() => setPage(p => p + 1)} disabled={page * 12 >= total}>Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function InstituteCard({ institute }) {
  const logoUrl = getImageUrl(institute.logo);
  const bannerUrl = getImageUrl(institute.bannerImage);
  const plan = planColors[institute.subscriptionPlan] || planColors.free;
  const safeJSON = (val, fb) => {
    if (!val) return fb;
    if (typeof val === 'string') { try { return JSON.parse(val); } catch { return fb; } }
    return val;
  };

  const courses = safeJSON(institute.courses, []);

  return (
    <div className="ilp-inst-card">
      <div className="ilp-inst-card-banner">
        {bannerUrl ? <img src={bannerUrl} alt="" /> : null}
        {institute.isFeatured && (
          <div className="ilp-inst-card-featured-badge"><Star size={9} /> Featured</div>
        )}
      </div>
      <div className="ilp-inst-card-body">
        <div className="ilp-inst-card-logo-wrap">
          <div className="ilp-inst-card-logo">
            {logoUrl ? <img src={logoUrl} alt={institute.name} /> : institute.name?.charAt(0)}
          </div>
        </div>
        <div className="ilp-inst-card-name">{institute.name}</div>
        {institute.tagline && (
          <div className="ilp-inst-card-tagline">{institute.tagline}</div>
        )}
        <div className="ilp-inst-card-meta">
          {(institute.city || institute.state) && (
            <span className="ilp-inst-card-meta-tag">
              <MapPin size={11} /> {[institute.city, institute.state].filter(Boolean).join(', ')}
            </span>
          )}
          {institute.totalStudents > 0 && (
            <span className="ilp-inst-card-meta-tag">
              <Users size={11} /> {institute.totalStudents.toLocaleString()}+ students
            </span>
          )}
          {institute.foundedYear && (
            <span className="ilp-inst-card-meta-tag">Est. {institute.foundedYear}</span>
          )}
          <span className="ilp-inst-card-plan" style={{ background: plan.bg, color: plan.color }}>
            {plan.icon} {institute.subscriptionPlan}
          </span>
        </div>
        {courses.length > 0 && (
          <div className="ilp-inst-card-meta" style={{ marginBottom: 0 }}>
            {courses.slice(0, 2).map((c, i) => (
              <span key={i} className="ilp-inst-card-meta-tag" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                <BookOpen size={10} /> {c.title || c.name}
              </span>
            ))}
            {courses.length > 2 && <span className="ilp-inst-card-meta-tag">+{courses.length - 2} more</span>}
          </div>
        )}
        <div className="ilp-inst-card-footer">
          <Link to={`/i/${institute.slug}`} className="ilp-inst-card-link">
            View Profile <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
