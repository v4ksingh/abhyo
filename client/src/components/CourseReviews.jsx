import React, { useState, useEffect, useCallback } from 'react';
import {
  Star, ThumbsUp, MessageCircle, Flag, ChevronDown,
  Edit3, Trash2, Send, CheckCircle, AlertCircle, X,
  SortDesc, Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../lib/api';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const getAvatarUrl = (path) => path
  ? (path.startsWith('http') ? path : `${API_BASE}/uploads/${path}`)
  : null;

// ── Star display (read-only) ──────────────────────────────────────────────────
function StarDisplay({ rating, size = 14, className = '' }) {
  return (
    <span className={`flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          size={size}
          className={s <= rating ? 'text-amber-400' : 'text-slate-300'}
          fill={s <= rating ? 'currentColor' : 'none'}
        />
      ))}
    </span>
  );
}

// ── Interactive Star Input ────────────────────────────────────────────────────
function StarInput({ value, onChange, size = 24 }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  return (
    <span className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-125"
        >
          <Star
            size={size}
            className={s <= display ? 'text-amber-400' : 'text-slate-300'}
            fill={s <= display ? 'currentColor' : 'none'}
          />
        </button>
      ))}
    </span>
  );
}

// ── Rating Bar (distribution) ─────────────────────────────────────────────────
function RatingBar({ label, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-2 text-right text-xs font-bold text-slate-500 flex-shrink-0">{label}</span>
      <Star size={11} className="text-amber-400 flex-shrink-0" fill="currentColor" />
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-500 w-8 text-right flex-shrink-0">{count}</span>
    </div>
  );
}

// ── Single Review Card ────────────────────────────────────────────────────────
function ReviewCard({ review, currentUserId, onHelpful, onDelete, onReply, canReply }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const avatarUrl = getAvatarUrl(review.reviewer?.avatar);
  const hasVoted = review.helpfulVoters?.includes(currentUserId);
  const isOwner = review.userId === currentUserId;
  const bodyTooLong = (review.body?.length || 0) > 220;

  const submitReply = async () => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      await onReply(review.id, replyText.trim());
      setReplyText('');
      setShowReplyForm(false);
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Reviewer header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex-shrink-0 bg-gradient-to-br from-indigo-100 to-violet-100 overflow-hidden border border-indigo-100">
          {avatarUrl
            ? <img src={avatarUrl} alt={review.reviewer?.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center font-bold text-indigo-600 text-sm">
                {review.reviewer?.name?.charAt(0)?.toUpperCase()}
              </div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800 text-sm">{review.reviewer?.name || 'Student'}</span>
            {isOwner && (
              <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded font-bold">
                You
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <StarDisplay rating={review.rating} size={12} />
            <span className="text-xs text-slate-400">
              {new Date(review.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
        {/* Owner actions */}
        {isOwner && (
          <button
            onClick={() => onDelete(review.id)}
            className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete review"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Title */}
      {review.title && (
        <p className="font-bold text-slate-800 mb-1.5">{review.title}</p>
      )}

      {/* Body */}
      {review.body && (
        <div>
          <p className={`text-sm text-slate-600 leading-relaxed ${!expanded && bodyTooLong ? 'line-clamp-3' : ''}`}>
            {review.body}
          </p>
          {bodyTooLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-indigo-600 text-xs font-bold mt-1 hover:underline"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      )}

      {/* Instructor Reply */}
      {review.reply && (
        <div className="mt-4 ml-4 pl-4 border-l-2 border-indigo-300 bg-indigo-50/50 rounded-r-xl py-3 pr-3">
          <p className="text-[10px] font-black text-indigo-600 mb-1 uppercase tracking-wider">
            Instructor Response
            {review.repliedBy && ` · ${review.repliedBy.name}`}
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">{review.reply}</p>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
        <button
          onClick={() => onHelpful(review.id)}
          className={`flex items-center gap-1.5 text-xs font-bold transition-all px-2.5 py-1.5 rounded-lg ${
            hasVoted
              ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
              : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
          }`}
        >
          <ThumbsUp size={13} fill={hasVoted ? 'currentColor' : 'none'} />
          Helpful {review.helpfulCount > 0 && `(${review.helpfulCount})`}
        </button>

        {canReply && !review.reply && (
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-violet-600 hover:bg-violet-50 px-2.5 py-1.5 rounded-lg transition-all"
          >
            <MessageCircle size={13} />
            Reply
          </button>
        )}
      </div>

      {/* Reply form */}
      {showReplyForm && (
        <div className="mt-3 ml-4 border-l-2 border-indigo-200 pl-4">
          <textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Write a public response to this review…"
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all min-h-[80px] bg-slate-50"
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setShowReplyForm(false)}
              className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={submitReply}
              disabled={submittingReply || !replyText.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-40 shadow-sm"
            >
              {submittingReply ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={11} />}
              Post Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Submit / Edit Review Form ─────────────────────────────────────────────────
function ReviewForm({ courseId, existingReview, onSuccess, onCancel }) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [body, setBody] = useState(existingReview?.body || '');
  const [submitting, setSubmitting] = useState(false);

  const ratingLabels = { 0: '', 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent!' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) return toast.error('Please select a star rating');
    setSubmitting(true);
    try {
      const res = await api.post(`/reviews/course/${courseId}`, { rating, title, body });
      toast.success(res.data.message);
      onSuccess(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-indigo-200/60 shadow-lg p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-black text-slate-800 text-lg">
          {existingReview ? 'Edit Your Review' : 'Write a Review'}
        </h3>
        {onCancel && (
          <button type="button" onClick={onCancel} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Star picker */}
      <div className="mb-5">
        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
          Overall Rating <span className="text-rose-500">*</span>
        </label>
        <div className="flex items-center gap-3">
          <StarInput value={rating} onChange={setRating} size={28} />
          {rating > 0 && (
            <span className="text-sm font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
              {ratingLabels[rating]}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="mb-4">
        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
          Review Title <span className="text-slate-300">(optional)</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Summarize your review in a headline…"
          maxLength={120}
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
        />
      </div>

      {/* Body */}
      <div className="mb-5">
        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
          Your Experience <span className="text-slate-300">(optional)</span>
        </label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="What did you like or dislike about this course? What did you learn?"
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all min-h-[110px]"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !rating}
        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:translate-y-0 text-sm"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Submitting…
          </span>
        ) : existingReview ? 'Update Review' : 'Submit Review'}
      </button>
    </form>
  );
}

// ── Main CourseReviews Component ──────────────────────────────────────────────
export default function CourseReviews({ courseId, currentUser, canReply = false, compact = false }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [myReview, setMyReview] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [sort, setSort] = useState('recent');
  const [filterRating, setFilterRating] = useState('');
  const [page, setPage] = useState(1);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort, page, limit: 6 });
      if (filterRating) params.append('rating', filterRating);
      const res = await api.get(`/reviews/course/${courseId}?${params}`);
      setReviews(res.data.data);
      setStats(res.data.stats);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [courseId, sort, filterRating, page]);

  const fetchMyReview = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await api.get(`/reviews/course/${courseId}/my`);
      setMyReview(res.data.data);
    } catch {}
  }, [courseId, currentUser]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);
  useEffect(() => { fetchMyReview(); }, [fetchMyReview]);

  const handleHelpful = async (id) => {
    if (!currentUser) return toast.error('Please log in to vote');
    try {
      const res = await api.post(`/reviews/${id}/helpful`);
      setReviews(prev => prev.map(r =>
        r.id === id
          ? { ...r, helpfulCount: res.data.helpfulCount, helpfulVoters: res.data.marked
              ? [...(r.helpfulVoters || []), currentUser.id]
              : (r.helpfulVoters || []).filter(v => v !== currentUser.id) }
          : r
      ));
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      toast.success('Review deleted');
      setMyReview(null);
      fetchReviews();
    } catch { toast.error('Failed'); }
  };

  const handleReply = async (id, reply) => {
    try {
      await api.post(`/reviews/${id}/reply`, { reply });
      toast.success('Reply posted!');
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
      throw err;
    }
  };

  const handleFormSuccess = (review) => {
    setMyReview(review);
    setShowForm(false);
    fetchReviews();
  };

  const avg = stats?.avgRating || 0;
  const total = stats?.totalCount || 0;

  return (
    <div className={compact ? '' : 'space-y-6'}>
      {/* ─── Hero Stats Bar ─────────────────────────────────────────────── */}
      {!compact && stats && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-800 mb-5">Student Reviews</h2>
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            {/* Big number */}
            <div className="flex flex-col items-center px-6 flex-shrink-0">
              <span className="text-6xl font-black text-slate-900 leading-none">{avg.toFixed(1)}</span>
              <StarDisplay rating={Math.round(avg)} size={18} className="mt-2" />
              <span className="text-sm font-semibold text-slate-500 mt-1">
                {total} review{total !== 1 ? 's' : ''}
              </span>
            </div>
            {/* Distribution bars */}
            <div className="flex-1 w-full space-y-2">
              {[5, 4, 3, 2, 1].map(s => (
                <RatingBar key={s} label={s} count={stats.distribution[s] || 0} total={total} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Write / Edit Review CTA ─────────────────────────────────────── */}
      {currentUser && !compact && (
        <div>
          {myReview && !showForm ? (
            <div className="bg-indigo-50/50 border border-indigo-200/60 rounded-2xl p-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black text-indigo-600 uppercase tracking-wider mb-1">Your Review</p>
                <StarDisplay rating={myReview.rating} size={14} />
                {myReview.title && <p className="font-bold text-slate-800 text-sm mt-1">{myReview.title}</p>}
                {myReview.body && <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">{myReview.body}</p>}
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-white border border-indigo-200 px-3 py-2 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                <Edit3 size={12} /> Edit
              </button>
            </div>
          ) : showForm ? (
            <ReviewForm
              courseId={courseId}
              existingReview={myReview}
              onSuccess={handleFormSuccess}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl text-sm font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2"
            >
              <Star size={16} /> Rate & Review this Course
            </button>
          )}
        </div>
      )}

      {/* ─── Filters & Sort ──────────────────────────────────────────────── */}
      {!compact && total > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm shadow-sm">
            <SortDesc size={14} className="text-slate-400" />
            <select
              value={sort}
              onChange={e => { setSort(e.target.value); setPage(1); }}
              className="bg-transparent text-sm text-slate-600 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="recent">Most Recent</option>
              <option value="helpful">Most Helpful</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm shadow-sm">
            <Filter size={14} className="text-slate-400" />
            <select
              value={filterRating}
              onChange={e => { setFilterRating(e.target.value); setPage(1); }}
              className="bg-transparent text-sm text-slate-600 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="">All Stars</option>
              {[5, 4, 3, 2, 1].map(s => (
                <option key={s} value={s}>{s} Star{s > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          {(filterRating || sort !== 'recent') && (
            <button
              onClick={() => { setSort('recent'); setFilterRating(''); setPage(1); }}
              className="text-xs font-bold text-slate-400 hover:text-rose-500 flex items-center gap-1 px-2 py-1"
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>
      )}

      {/* ─── Reviews List ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-1/4" />
                  <div className="h-2 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-100 rounded" />
                <div className="h-3 bg-slate-100 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="w-16 h-16 mx-auto bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
            <Star size={28} className="text-amber-300" />
          </div>
          <p className="font-bold text-slate-600 mb-1">No Reviews Yet</p>
          <p className="text-sm text-slate-400">
            {currentUser ? 'Be the first to review this course!' : 'Enroll to leave a review.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={currentUser?.id}
              onHelpful={handleHelpful}
              onDelete={handleDelete}
              onReply={handleReply}
              canReply={canReply}
            />
          ))}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                ← Prev
              </button>
              <span className="flex items-center px-4 text-sm font-semibold text-slate-500">
                {page} / {pagination.pages}
              </span>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
