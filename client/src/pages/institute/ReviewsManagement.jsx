import React, { useState, useEffect, useCallback } from 'react';
import {
  Star, MessageCircle, Eye, EyeOff, Search,
  ThumbsUp, BookOpen, Send, X, RefreshCw,
  BarChart2, TrendingUp, Award, Filter, ChevronDown,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const getAvatarUrl = (p) => p ? (p.startsWith('http') ? p : `${API_BASE}/uploads/${p}`) : null;
const getThumbUrl  = (p) => p ? (p.startsWith('http') ? p : `${API_BASE}/uploads/${p}`) : null;

// ── Star display ──────────────────────────────────────────────────────────────
function Stars({ rating, size = 13 }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={size}
          className={s <= rating ? 'text-amber-400' : 'text-slate-200'}
          fill={s <= rating ? 'currentColor' : 'none'} />
      ))}
    </span>
  );
}

// ── Rating distribution bar ───────────────────────────────────────────────────
function RatingBar({ star, count, total, onClick, active }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 w-full group transition-opacity ${active ? '' : 'opacity-80 hover:opacity-100'}`}
    >
      <span className={`text-xs font-bold w-3 flex-shrink-0 ${active ? 'text-indigo-600' : 'text-slate-500'}`}>{star}</span>
      <Star size={11} className="text-amber-400 flex-shrink-0" fill="currentColor" />
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${active ? 'bg-indigo-500' : 'bg-amber-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] text-slate-400 w-6 text-right flex-shrink-0">{count}</span>
    </button>
  );
}

// ── Single review card ────────────────────────────────────────────────────────
function ReviewCard({ review, onReply, onToggleHide }) {
  const [showForm, setShowForm] = useState(false);
  const [replyText, setReplyText] = useState(review.reply || '');
  const [submitting, setSubmitting] = useState(false);

  const avatarUrl = getAvatarUrl(review.reviewer?.avatar);
  const thumbUrl  = getThumbUrl(review.course?.thumbnail);

  const submit = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await onReply(review.id, replyText.trim());
      setShowForm(false);
    } finally { setSubmitting(false); }
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm transition-all duration-200 overflow-hidden ${
      review.isHidden
        ? 'border-rose-100 bg-rose-50/30 opacity-60'
        : 'border-slate-100 hover:shadow-md hover:border-indigo-100'
    }`}>
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden border border-slate-100 bg-gradient-to-br from-indigo-50 to-violet-100">
            {avatarUrl
              ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-indigo-600">
                  {review.reviewer?.name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-slate-800 leading-tight">{review.reviewer?.name || 'Student'}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Stars rating={review.rating} />
                  <span className="text-[11px] text-slate-400">
                    {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {review.isHidden && (
                  <span className="text-[10px] bg-rose-50 text-rose-500 border border-rose-200 px-1.5 py-0.5 rounded-full font-bold">Hidden</span>
                )}
                <button
                  onClick={() => onToggleHide(review.id, !review.isHidden)}
                  title={review.isHidden ? 'Make visible' : 'Hide review'}
                  className={`p-1.5 rounded-lg transition-colors ${
                    review.isHidden
                      ? 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                      : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'
                  }`}
                >
                  {review.isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Course pill */}
        {review.course && (
          <div className="mt-3 flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
            {thumbUrl
              ? <img src={thumbUrl} alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
              : <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={12} className="text-indigo-500" />
                </div>
            }
            <p className="text-xs font-semibold text-slate-600 truncate">{review.course.title}</p>
          </div>
        )}

        {/* Review text */}
        {review.title && <p className="font-bold text-slate-800 mt-3 text-sm">{review.title}</p>}
        {review.body && <p className="text-sm text-slate-600 leading-relaxed mt-1 line-clamp-4">{review.body}</p>}

        {/* Helpful */}
        {review.helpfulCount > 0 && (
          <div className="flex items-center gap-1 mt-3 text-xs text-slate-400 font-medium">
            <ThumbsUp size={11} /> {review.helpfulCount} found helpful
          </div>
        )}
      </div>

      {/* Existing reply */}
      {review.reply && !showForm && (
        <div className="mx-5 mb-4 pl-4 border-l-2 border-indigo-300 bg-gradient-to-r from-indigo-50/60 to-transparent rounded-r-xl py-3 pr-3">
          <p className="text-[10px] font-black text-indigo-600 mb-1 uppercase tracking-wider flex items-center gap-1">
            ✦ Your Response
            {review.repliedBy?.name && <span className="font-normal normal-case tracking-normal">· {review.repliedBy.name}</span>}
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">{review.reply}</p>
          <button onClick={() => setShowForm(true)} className="text-xs font-bold text-indigo-500 hover:text-indigo-700 mt-2 transition-colors">
            Edit reply →
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-slate-100 px-5 py-3 bg-slate-50/50 flex items-center justify-between gap-3">
        {!showForm ? (
          <>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
              review.reply
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-amber-700 bg-amber-50 border-amber-200'
            }`}>
              {review.reply ? '✓ Replied' : '⏳ Needs reply'}
            </span>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-white border border-indigo-200 px-3 py-1.5 rounded-xl hover:bg-indigo-50 transition-colors shadow-sm"
            >
              <MessageCircle size={13} />
              {review.reply ? 'Edit Reply' : 'Reply'}
            </button>
          </>
        ) : (
          <div className="w-full space-y-2">
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Write a thoughtful public response to this review…"
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 min-h-[80px] bg-white transition-all"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowForm(false); setReplyText(review.reply || ''); }}
                className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={submitting || !replyText.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-40 shadow-sm transition-colors"
              >
                {submitting ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={11} />}
                Post Reply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const FILTERS = [
  { id: 'all',       label: 'All Reviews' },
  { id: 'unanswered', label: 'Needs Reply' },
  { id: 'visible',   label: 'Visible' },
  { id: 'hidden',    label: 'Hidden' },
];

const SORTS = [
  { id: 'recent',  label: 'Newest First' },
  { id: 'highest', label: 'Highest Rated' },
  { id: 'lowest',  label: 'Lowest Rated' },
  { id: 'helpful', label: 'Most Helpful' },
];

export default function ReviewsManagement() {
  const [reviews, setReviews]       = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [filter, setFilter]         = useState('all');
  const [sort, setSort]             = useState('recent');
  const [starFilter, setStarFilter] = useState(null); // 1-5 or null
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState({});
  const [showSortMenu, setShowSortMenu] = useState(false);

  // ── Fetch stats (full dataset, independent of filters) ─────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/institute/reviews/stats');
      setStats(res.data.data);
    } catch { setStats(null); }
    finally { setStatsLoading(false); }
  }, []);

  // ── Fetch paginated reviews ─────────────────────────────────────────────────
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = { filter, sort, page, limit: 12 };
      if (starFilter) params.rating = starFilter;
      const res = await api.get('/institute/reviews', { params });
      setReviews(res.data.data || []);
      setPagination(res.data.pagination || {});
    } catch {
      toast.error('Failed to load reviews');
    } finally { setLoading(false); }
  }, [filter, sort, starFilter, page]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { setPage(1); }, [filter, sort, starFilter]);
  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleReply = async (id, reply) => {
    try {
      await api.post(`/institute/reviews/${id}/reply`, { reply });
      toast.success('Reply posted!');
      setReviews(prev => prev.map(r => r.id === id ? { ...r, reply } : r));
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post reply');
      throw err;
    }
  };

  const handleToggleHide = async (id, hide) => {
    try {
      await api.patch(`/institute/reviews/${id}/moderate`, { isHidden: hide });
      toast.success(hide ? 'Review hidden' : 'Review visible again');
      setReviews(prev => prev.map(r => r.id === id ? { ...r, isHidden: hide } : r));
      fetchStats();
    } catch { toast.error('Action failed'); }
  };

  // ── Client-side search filter ────────────────────────────────────────────────
  const displayed = search.trim()
    ? reviews.filter(r =>
        r.reviewer?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.course?.title?.toLowerCase().includes(search.toLowerCase()) ||
        r.body?.toLowerCase().includes(search.toLowerCase()) ||
        r.title?.toLowerCase().includes(search.toLowerCase())
      )
    : reviews;

  const activeSortLabel = SORTS.find(s => s.id === sort)?.label || 'Newest First';

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow">
              <Star className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            Reviews & Ratings
          </h1>
          <p className="text-sm text-slate-500 mt-0.5 ml-11">Manage and respond to student feedback</p>
        </div>
        <button
          onClick={() => { fetchReviews(); fetchStats(); }}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── Stats + Rating Distribution ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* KPI cards */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: 'Avg. Rating', icon: Star,
              value: statsLoading ? '…' : stats?.avgRating ? `${stats.avgRating} ★` : '—',
              gradient: 'from-amber-400 to-orange-500', sub: 'out of 5.0',
            },
            {
              label: 'Total Reviews', icon: BarChart2,
              value: statsLoading ? '…' : stats?.total ?? 0,
              gradient: 'from-indigo-500 to-violet-600', sub: 'all time',
            },
            {
              label: 'Need Reply', icon: MessageCircle,
              value: statsLoading ? '…' : stats?.needsReply ?? 0,
              gradient: 'from-violet-500 to-purple-600', sub: 'awaiting response',
            },
            {
              label: 'Hidden', icon: EyeOff,
              value: statsLoading ? '…' : stats?.hidden ?? 0,
              gradient: 'from-rose-400 to-red-500', sub: 'not shown publicly',
            },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm relative overflow-hidden">
              <div className={`w-9 h-9 bg-gradient-to-br ${kpi.gradient} rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
                <kpi.icon size={16} className="text-white" fill="currentColor" />
              </div>
              <p className="text-xl font-extrabold text-slate-900 leading-tight">{kpi.value}</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{kpi.label}</p>
              {kpi.sub && <p className="text-[10px] text-slate-400 mt-px">{kpi.sub}</p>}
              <div className={`absolute -right-3 -top-3 w-16 h-16 rounded-full opacity-[0.08] bg-gradient-to-br ${kpi.gradient}`} />
            </div>
          ))}
        </div>

        {/* Rating distribution */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <TrendingUp size={14} className="text-indigo-400" />
            Rating Breakdown
            {starFilter && (
              <button onClick={() => setStarFilter(null)}
                className="ml-auto text-[10px] text-indigo-500 font-bold hover:text-indigo-700 flex items-center gap-0.5">
                <X size={11} /> Clear
              </button>
            )}
          </p>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(s => (
              <RatingBar
                key={s} star={s}
                count={stats?.distribution?.[s] ?? 0}
                total={stats?.total ?? 0}
                active={starFilter === s}
                onClick={() => setStarFilter(prev => prev === s ? null : s)}
              />
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-3 text-center">Click a bar to filter by that star rating</p>
        </div>
      </div>

      {/* ── Filters toolbar ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-sm flex-1 min-w-[200px]">
          <Search size={14} className="text-slate-400 flex-shrink-0" />
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search student, course, or content…"
            className="bg-transparent text-sm text-slate-700 focus:outline-none flex-1 placeholder-slate-400"
          />
          {search && <button onClick={() => setSearch('')}><X size={13} className="text-slate-400 hover:text-slate-600" /></button>}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm flex-wrap">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                filter === f.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}>
              {f.label}
              {f.id === 'unanswered' && stats?.needsReply > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  filter === f.id ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-700'
                }`}>{stats.needsReply}</span>
              )}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(p => !p)}
            className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:border-indigo-300 transition-colors shadow-sm"
          >
            <Filter size={13} className="text-slate-400" />
            {activeSortLabel}
            <ChevronDown size={13} className={`text-slate-400 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
          </button>
          {showSortMenu && (
            <div className="absolute right-0 top-12 z-20 bg-white border border-slate-200 rounded-xl shadow-xl py-1 min-w-[160px] animate-fade-in">
              {SORTS.map(s => (
                <button key={s.id}
                  onClick={() => { setSort(s.id); setShowSortMenu(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                    sort === s.id
                      ? 'text-indigo-600 bg-indigo-50 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active star filter badge */}
      {starFilter && (
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full">
            <Star size={11} fill="currentColor" /> Filtered: {starFilter} star
            <button onClick={() => setStarFilter(null)} className="ml-1 hover:text-amber-900">
              <X size={11} />
            </button>
          </span>
          <span className="text-xs text-slate-400">{pagination.total ?? 0} results</span>
        </div>
      )}

      {/* ── Review list ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse space-y-3">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                  <div className="h-2 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-8 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="w-16 h-16 mx-auto bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
            <Star size={28} className="text-amber-300" />
          </div>
          <p className="font-bold text-slate-600 mb-1">No Reviews Found</p>
          <p className="text-sm text-slate-400">
            {filter === 'unanswered' ? 'All reviews have been replied to! 🎉' :
             filter === 'hidden' ? 'No hidden reviews at the moment.' :
             starFilter ? `No ${starFilter}-star reviews yet.` :
             'No student reviews have been submitted yet.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {displayed.map(review => (
              <ReviewCard
                key={review.id}
                review={review}
                onReply={handleReply}
                onToggleHide={handleToggleHide}
              />
            ))}
          </div>

          {/* Pagination */}
          {(pagination.pages ?? 1) > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-slate-500">
                Page {page} of {pagination.pages} · {pagination.total} reviews
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl disabled:opacity-40 hover:bg-slate-50 transition-colors"
                >
                  ← Prev
                </button>
                <button
                  disabled={page >= (pagination.pages ?? 1)}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl disabled:opacity-40 hover:bg-slate-50 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
