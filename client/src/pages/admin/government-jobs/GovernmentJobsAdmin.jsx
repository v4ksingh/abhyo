import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase, CheckCircle2, Clock, XCircle, AlertTriangle, Sparkles,
  Search, Filter, ExternalLink, RefreshCw, Eye, Edit3, Check, X,
  Trash2, Star, Calendar, Building, Award, ArrowUpDown, ChevronLeft,
  ChevronRight, ArrowRight, ShieldCheck, HelpCircle, Layers, FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../../lib/api';
import GovernmentJobReviewModal from './GovernmentJobReviewModal';

export default function GovernmentJobsAdmin() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, pending, all, published
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Job Listing State
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Selected Job for Modal
  const [selectedJob, setSelectedJob] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // Reject Dialog state
  const [rejectDialogJob, setRejectDialogJob] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // n8n info modal
  const [showN8nInfo, setShowN8nInfo] = useState(false);

  // Fetch Dashboard Stats
  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const res = await api.get('/government-jobs/admin/stats');
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Fetch Jobs with current filters
  const fetchJobs = useCallback(async () => {
    try {
      setLoadingJobs(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder,
      };

      if (search.trim()) params.search = search.trim();
      if (categoryFilter) params.category = categoryFilter;

      // Status override based on active tab
      if (activeTab === 'pending') {
        params.status = 'pending_review';
      } else if (activeTab === 'published') {
        params.status = 'published';
      } else if (statusFilter) {
        params.status = statusFilter;
      }

      const res = await api.get('/government-jobs/admin', { params });
      if (res.data?.success) {
        setJobs(res.data.data || []);
        if (res.data.pagination) {
          setPagination(p => ({
            ...p,
            total: res.data.pagination.total,
            pages: res.data.pagination.pages,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
      toast.error('Failed to load government jobs');
    } finally {
      setLoadingJobs(false);
    }
  }, [pagination.page, pagination.limit, sortBy, sortOrder, search, categoryFilter, statusFilter, activeTab]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Tab switch handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPagination(p => ({ ...p, page: 1 }));
    if (tab === 'pending') {
      setStatusFilter('pending_review');
    } else if (tab === 'published') {
      setStatusFilter('published');
    } else if (tab === 'all') {
      setStatusFilter('');
    }
  };

  // Quick Action: Approve
  const handleApprove = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Approve this job? It will be ready for publication.')) return;
    try {
      setActionLoading(true);
      const res = await api.patch(`/government-jobs/admin/${id}/approve`);
      if (res.data?.success) {
        toast.success('Job approved successfully!');
        fetchJobs();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve job');
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Action: Publish
  const handlePublish = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Publish this job to live Abhyo.com website?')) return;
    try {
      setActionLoading(true);
      const res = await api.patch(`/government-jobs/admin/${id}/publish`);
      if (res.data?.success) {
        toast.success('Job published live!');
        fetchJobs();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish job');
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Action: Unpublish
  const handleUnpublish = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Unpublish this job from live website?')) return;
    try {
      setActionLoading(true);
      const res = await api.patch(`/government-jobs/admin/${id}/unpublish`);
      if (res.data?.success) {
        toast.success('Job unpublished');
        fetchJobs();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unpublish');
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Action: Toggle Feature
  const handleToggleFeature = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.patch(`/government-jobs/admin/${id}/feature`);
      if (res.data?.success) {
        toast.success(res.data.isFeatured ? 'Marked as Featured!' : 'Unfeatured');
        fetchJobs();
      }
    } catch (err) {
      toast.error('Failed to toggle feature status');
    }
  };

  // Quick Action: Delete
  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this job permanently? This action cannot be undone.')) return;
    try {
      const res = await api.delete(`/government-jobs/admin/${id}`);
      if (res.data?.success) {
        toast.success('Job deleted successfully');
        fetchJobs();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete job');
    }
  };

  // Submit Rejection
  const submitReject = async () => {
    if (!rejectDialogJob) return;
    try {
      setActionLoading(true);
      const res = await api.patch(`/government-jobs/admin/${rejectDialogJob.id}/reject`, {
        rejectionReason: rejectionReason.trim()
      });
      if (res.data?.success) {
        toast.success('Job marked as rejected');
        setRejectDialogJob(null);
        setRejectionReason('');
        fetchJobs();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject job');
    } finally {
      setActionLoading(false);
    }
  };

  // Open review modal
  const openReviewModal = (job) => {
    setSelectedJob(job);
    setReviewModalOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> Published</span>;
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"><ShieldCheck className="w-3 h-3" /> Approved</span>;
      case 'pending_review':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse"><Clock className="w-3 h-3" /> Pending Review</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"><XCircle className="w-3 h-3" /> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Government Jobs Management</h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Sparkles className="w-3 h-3" /> AI Automation
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Manage, review AI-extracted government recruitments from n8n, approve and publish to Abhyo.com
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowN8nInfo(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-indigo-600" />
            n8n Webhook Details
          </button>
          <button
            onClick={() => { fetchStats(); fetchJobs(); }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm shadow-indigo-200"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Jobs</div>
          <div className="text-2xl font-extrabold text-gray-900 mt-1">{loadingStats ? '...' : stats?.total || 0}</div>
          <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
            <Layers className="w-3 h-3" /> All records
          </div>
        </div>

        <div
          onClick={() => handleTabChange('pending')}
          className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-b from-amber-50/30 to-white"
        >
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider flex items-center justify-between">
            <span>Pending Review</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{loadingStats ? '...' : stats?.pendingReview || 0}</div>
          <div className="text-[11px] text-amber-600/80 mt-1 font-medium">Needs Admin Approval</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider flex items-center justify-between">
            <span>Approved</span>
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">{loadingStats ? '...' : stats?.approved || 0}</div>
          <div className="text-[11px] text-blue-600/80 mt-1">Ready to publish</div>
        </div>

        <div
          onClick={() => handleTabChange('published')}
          className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-b from-emerald-50/30 to-white"
        >
          <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center justify-between">
            <span>Published</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{loadingStats ? '...' : stats?.published || 0}</div>
          <div className="text-[11px] text-emerald-600/80 mt-1 font-medium">Live on Abhyo.com</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs font-semibold text-rose-700 uppercase tracking-wider flex items-center justify-between">
            <span>Rejected</span>
            <XCircle className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">{loadingStats ? '...' : stats?.rejected || 0}</div>
          <div className="text-[11px] text-rose-600/80 mt-1">Discarded items</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-purple-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs font-semibold text-purple-700 uppercase tracking-wider flex items-center justify-between">
            <span>Added Today</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-extrabold text-purple-600 mt-1">{loadingStats ? '...' : stats?.addedToday || 0}</div>
          <div className="text-[11px] text-purple-600/80 mt-1">Imported by n8n</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
        <div className="flex space-x-1 sm:space-x-4">
          <button
            onClick={() => handleTabChange('overview')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            Overview & Quick Review
          </button>

          <button
            onClick={() => handleTabChange('pending')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-500" />
            Pending Review
            {stats?.pendingReview > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800">
                {stats.pendingReview}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('all')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'all'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            All Government Jobs
          </button>

          <button
            onClick={() => handleTabChange('published')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'published'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Published Live
            {stats?.published > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                {stats.published}
              </span>
            )}
          </button>
        </div>

        {/* Live Website Preview Link */}
        <a
          href="/government-jobs"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50/60 hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View Live Jobs Section
        </a>
      </div>

      {/* Tab: Overview Mode */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Action Pending Banner if pending items exist */}
          {stats?.pendingReview > 0 && (
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-2xl p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">
                    {stats.pendingReview} AI-Extracted Jobs Awaiting Your Review
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Newly imported recruitment data is withheld until verified. Click below to review and approve.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleTabChange('pending')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center gap-1.5 whitespace-nowrap"
              >
                Review Pending Jobs <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Grid of Widgets: Categories Distribution + Upcoming Deadlines */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-600" />
                  Recruitment Categories
                </h3>
                <span className="text-xs text-gray-400">Total: {stats?.categoryCounts?.length || 0}</span>
              </div>
              {stats?.categoryCounts && stats.categoryCounts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {stats.categoryCounts.map((cat, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setCategoryFilter(cat.category);
                        handleTabChange('all');
                      }}
                      className="p-3 bg-gray-50 hover:bg-indigo-50/50 rounded-xl border border-gray-100 cursor-pointer transition-colors"
                    >
                      <div className="text-xs font-semibold text-gray-700 truncate">{cat.category || 'General'}</div>
                      <div className="text-lg font-black text-indigo-600 mt-0.5">{cat.count} <span className="text-[10px] font-normal text-gray-400">jobs</span></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-gray-400">No category data recorded yet</div>
              )}
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-rose-500" />
                  Upcoming Application Deadlines (Next 14 Days)
                </h3>
                <span className="text-xs text-gray-400">{stats?.upcomingDeadlines?.length || 0} closing soon</span>
              </div>
              {stats?.upcomingDeadlines && stats.upcomingDeadlines.length > 0 ? (
                <div className="space-y-2">
                  {stats.upcomingDeadlines.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => openReviewModal(job)}
                      className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-gray-900 truncate">{job.title}</div>
                        <div className="text-[11px] text-gray-500 truncate">{job.organization} • {job.totalVacancies} Posts</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                          Last Date: {job.applicationLastDate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-gray-400">No imminent deadlines within 14 days</div>
              )}
            </div>
          </div>

          {/* Quick Review of Recent 5 Pending Jobs */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Recent Pending Review Jobs
              </h3>
              <button
                onClick={() => handleTabChange('pending')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                View all pending &rarr;
              </button>
            </div>

            {loadingJobs ? (
              <div className="py-12 text-center text-sm text-gray-400">Loading jobs...</div>
            ) : jobs.filter(j => j.status === 'pending_review').length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                🎉 No pending jobs! All imported jobs have been reviewed.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.filter(j => j.status === 'pending_review').slice(0, 4).map((job) => (
                  <div
                    key={job.id}
                    className="p-4 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/20 to-white hover:border-amber-300 transition-all shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          {job.category || 'Recruitment'}
                        </span>
                        {job.aiExtracted && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> AI
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{job.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{job.organization}</p>
                      <div className="flex items-center gap-4 text-[11px] text-gray-600 mt-2">
                        <span>Vacancies: <strong>{job.totalVacancies || 'N/A'}</strong></span>
                        <span>Last Date: <strong>{job.applicationLastDate || 'Not specified'}</strong></span>
                      </div>

                      {/* Warnings if any */}
                      {Array.isArray(job.dataWarnings) && job.dataWarnings.length > 0 && (
                        <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{job.dataWarnings[0]}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => openReviewModal(job)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Review Details
                      </button>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            setRejectDialogJob(job);
                            e.stopPropagation();
                          }}
                          className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                        >
                          Reject
                        </button>
                        <button
                          onClick={(e) => handleApprove(job.id, e)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs: Pending Review Mode / All Jobs Mode / Published Mode */}
      {activeTab !== 'overview' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search job title, organization, or source..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
              {/* Category filter */}
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-700"
              >
                <option value="">All Categories</option>
                {stats?.categoryCounts?.map((c, i) => (
                  <option key={i} value={c.category}>{c.category}</option>
                ))}
              </select>

              {/* Status filter if in All Jobs tab */}
              {activeTab === 'all' && (
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-700"
                >
                  <option value="">All Statuses</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="published">Published</option>
                  <option value="rejected">Rejected</option>
                </select>
              )}

              {/* Sort Order */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [b, o] = e.target.value.split('-');
                  setSortBy(b);
                  setSortOrder(o);
                }}
                className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-700"
              >
                <option value="createdAt-DESC">Newest Added</option>
                <option value="applicationLastDate-ASC">Deadline (Soonest)</option>
                <option value="totalVacancies-DESC">Vacancies (High to Low)</option>
                <option value="title-ASC">Title (A-Z)</option>
              </select>

              {(search || categoryFilter || (activeTab === 'all' && statusFilter)) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setCategoryFilter('');
                    setStatusFilter('');
                  }}
                  className="px-2.5 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Jobs Data Table / Cards */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            {loadingJobs ? (
              <div className="py-20 text-center text-sm text-gray-400">Loading government jobs...</div>
            ) : jobs.length === 0 ? (
              <div className="py-20 text-center">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="font-bold text-gray-800 text-sm">No government jobs found</h4>
                <p className="text-xs text-gray-400 mt-1">
                  {search ? 'Try adjusting your search criteria' : 'Jobs imported through n8n will appear here'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/75 border-b border-gray-200/80 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Recruitment Details</th>
                      <th className="px-3 py-3">Organization & Category</th>
                      <th className="px-3 py-3">Vacancies</th>
                      <th className="px-3 py-3">Last Date</th>
                      <th className="px-3 py-3">AI & Warnings</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {jobs.map((job) => {
                      const hasWarnings = (Array.isArray(job.dataWarnings) && job.dataWarnings.length > 0) ||
                                          (Array.isArray(job.validationWarnings) && job.validationWarnings.length > 0);

                      return (
                        <tr
                          key={job.id}
                          onClick={() => openReviewModal(job)}
                          className="hover:bg-indigo-50/30 cursor-pointer transition-colors"
                        >
                          {/* Title & Short Details */}
                          <td className="px-4 py-3 max-w-xs">
                            <div className="flex items-center gap-1.5">
                              {job.isFeatured && (
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
                              )}
                              <span className="font-bold text-gray-900 line-clamp-1 text-xs hover:text-indigo-600 transition-colors">
                                {job.title}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                              {job.shortName || job.tagline || job.organization}
                            </div>
                            {job.source && (
                              <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                <span>Source: {job.source}</span>
                                {job.sourceUrl && (
                                  <a
                                    href={job.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-indigo-500 hover:text-indigo-700"
                                  >
                                    <ExternalLink className="w-2.5 h-2.5 inline" />
                                  </a>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Organization & Category */}
                          <td className="px-3 py-3">
                            <div className="font-medium text-gray-800 line-clamp-1">{job.organization || '—'}</div>
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                              {job.category || 'General'}
                            </span>
                          </td>

                          {/* Vacancies */}
                          <td className="px-3 py-3 font-semibold text-gray-900">
                            {job.totalVacancies ? (
                              <span className="text-indigo-600 font-bold">{job.totalVacancies.toLocaleString('en-IN')}</span>
                            ) : (
                              <span className="text-gray-400 font-normal">Not stated</span>
                            )}
                          </td>

                          {/* Last Date */}
                          <td className="px-3 py-3 whitespace-nowrap">
                            {job.applicationLastDate ? (
                              <span className="text-xs font-medium text-gray-800">
                                {job.applicationLastDate}
                              </span>
                            ) : (
                              <span className="text-gray-400">Not specified</span>
                            )}
                          </td>

                          {/* AI & Warnings */}
                          <td className="px-3 py-3">
                            <div className="flex flex-col gap-1 items-start">
                              {job.aiExtracted && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  <Sparkles className="w-2.5 h-2.5" /> AI
                                </span>
                              )}
                              {hasWarnings ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Has Warnings
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-400">Clear</span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-3 py-3 whitespace-nowrap">
                            {getStatusBadge(job.status)}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => openReviewModal(job)}
                                title="Review / Edit Full Details"
                                className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {job.status === 'pending_review' && (
                                <>
                                  <button
                                    onClick={(e) => handleApprove(job.id, e)}
                                    title="Approve Job"
                                    className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      setRejectDialogJob(job);
                                      e.stopPropagation();
                                    }}
                                    title="Reject Job"
                                    className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              )}

                              {job.status === 'approved' && (
                                <button
                                  onClick={(e) => handlePublish(job.id, e)}
                                  title="Publish to Abhyo.com"
                                  className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
                                >
                                  Publish
                                </button>
                              )}

                              {job.status === 'published' && (
                                <>
                                  <button
                                    onClick={(e) => handleToggleFeature(job.id, e)}
                                    title={job.isFeatured ? 'Unfeature' : 'Feature Job'}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      job.isFeatured
                                        ? 'text-amber-500 bg-amber-50'
                                        : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
                                    }`}
                                  >
                                    <Star className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => handleUnpublish(job.id, e)}
                                    title="Unpublish"
                                    className="px-2 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200"
                                  >
                                    Unpublish
                                  </button>
                                </>
                              )}

                              <button
                                onClick={(e) => handleDelete(job.id, e)}
                                title="Delete Job"
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Showing {jobs.length} of {pagination.total} jobs (Page {pagination.page} of {pagination.pages})
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                    className="p-1.5 border border-gray-200 rounded-lg text-xs font-semibold disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold px-2 text-gray-700">{pagination.page}</span>
                  <button
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                    className="p-1.5 border border-gray-200 rounded-lg text-xs font-semibold disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review & Edit Modal */}
      {reviewModalOpen && selectedJob && (
        <GovernmentJobReviewModal
          job={selectedJob}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedJob(null);
          }}
          onRefresh={() => {
            fetchJobs();
            fetchStats();
          }}
        />
      )}

      {/* Reject Confirmation Dialog */}
      {rejectDialogJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Reject Recruitment Job</h3>
                <p className="text-xs text-gray-500">Provide an optional reason for review audit</p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 text-xs">
              <span className="font-bold text-gray-800">{rejectDialogJob.title}</span>
              <div className="text-gray-500 mt-0.5">{rejectDialogJob.organization}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Rejection Reason</label>
              <textarea
                rows={3}
                placeholder="e.g. Duplicate notification, invalid eligibility, or recruitment cancelled..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => { setRejectDialogJob(null); setRejectionReason(''); }}
                className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={submitReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* n8n Webhook Info Modal */}
      {showN8nInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">n8n Automation Webhook Guide</h3>
              </div>
              <button
                onClick={() => setShowN8nInfo(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-700">
              <p>
                Configure the HTTP Request node in your n8n workflow after the <strong>IF (validationStatus == &apos;passed&apos;)</strong> node:
              </p>

              <div className="bg-gray-900 text-gray-100 p-3.5 rounded-xl space-y-1 font-mono text-[11px]">
                <div><span className="text-emerald-400 font-bold">METHOD:</span> POST</div>
                <div><span className="text-emerald-400 font-bold">URL:</span> https://abhyo.com/api/government-jobs/webhook</div>
                <div><span className="text-emerald-400 font-bold">HEADERS:</span></div>
                <div className="pl-4 text-amber-300">Content-Type: application/json</div>
                <div className="pl-4 text-amber-300">x-api-key: [Your process.env.N8N_API_KEY]</div>
                <div><span className="text-emerald-400 font-bold">BODY (JSON):</span> {"{{ $json }}"}</div>
              </div>

              <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded-xl space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Security & Review Rules:
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-blue-800">
                  <li>Incoming jobs are <strong>NEVER published automatically</strong>.</li>
                  <li>Every job imports with <code className="bg-blue-100 px-1 rounded">status = &quot;pending_review&quot;</code> and <code className="bg-blue-100 px-1 rounded">reviewRequired = true</code>.</li>
                  <li>Duplicate <code className="bg-blue-100 px-1 rounded">sourceUrl</code> imports are rejected or safely managed to prevent overwriting approved/published records.</li>
                  <li>Timing-safe secret comparison is enforced on the <code className="bg-blue-100 px-1 rounded">x-api-key</code> header.</li>
                </ul>
              </div>
            </div>

            <div className="text-right pt-2 border-t border-gray-100">
              <button
                onClick={() => setShowN8nInfo(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
