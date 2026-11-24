import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, Search, Calendar, Users, DollarSign, ExternalLink,
  ChevronRight, ArrowRight, ShieldCheck, Clock, Filter, Sparkles,
  Building, GraduationCap, AlertCircle, BookOpen, Layers
} from 'lucide-react';
import usePageMeta from '../../hooks/usePageMeta';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const QUICK_CATEGORIES = [
  'All', 'UPSC', 'SSC', 'Banking', 'Railway', 'Defence',
  'State PSC', 'Police', 'Teaching', 'Engineering'
];

export default function GovernmentJobsListPage() {
  usePageMeta({
    title: 'Latest Government Jobs 2026 – Sarkari Naukri, Notifications & Vacancies',
    description: 'Explore verified Indian Government job recruitments for SSC, UPSC, Banking, Railways, Defence, and State PSC. Real-time application dates, vacancy counts, and official application links on Abhyo.com.',
    canonical: '/government-jobs',
  });

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [deadlineFilter, setDeadlineFilter] = useState('all'); // all, closingSoon, highVacancies
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });

  // Fetch published jobs
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const params = new URLSearchParams({
      page: pagination.page,
      limit: pagination.limit,
    });

    if (search.trim()) params.append('search', search.trim());
    if (selectedCategory && selectedCategory !== 'All') params.append('category', selectedCategory);

    fetch(`${API_BASE}/government-jobs?${params.toString()}`)
      .then(r => r.json())
      .then(res => {
        if (isMounted && res.success) {
          setJobs(res.data || []);
          if (res.pagination) {
            setPagination(p => ({
              ...p,
              total: res.pagination.total,
              pages: res.pagination.pages,
            }));
          }
        }
      })
      .catch(err => console.error('Failed to load public government jobs:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [pagination.page, pagination.limit, search, selectedCategory]);

  // Client-side quick filter for deadlines / high vacancies
  const filteredJobs = useMemo(() => {
    let list = [...jobs];
    const now = new Date();

    if (deadlineFilter === 'closingSoon') {
      list = list.filter(j => {
        if (!j.applicationLastDate) return false;
        const d = new Date(j.applicationLastDate);
        if (isNaN(d.getTime())) return false;
        const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
      });
    } else if (deadlineFilter === 'highVacancies') {
      list = list.filter(j => (j.totalVacancies || 0) >= 100);
    }

    return list;
  }, [jobs, deadlineFilter]);

  // Urgency helper
  const getDeadlineBadge = (lastDateStr) => {
    if (!lastDateStr) return <span className="text-gray-400 text-xs">Closing: Ongoing / TBA</span>;

    const d = new Date(lastDateStr);
    if (isNaN(d.getTime())) {
      return <span className="text-gray-600 text-xs">Last Date: {lastDateStr}</span>;
    }

    const now = new Date();
    const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
          Application Closed
        </span>
      );
    } else if (diffDays <= 3) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 animate-pulse">
          <Clock className="w-3 h-3" /> Ends in {diffDays === 0 ? 'Today' : `${diffDays} days`}
        </span>
      );
    } else if (diffDays <= 7) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
          <Clock className="w-3 h-3" /> Closing in {diffDays} days
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
          <Calendar className="w-3 h-3" /> Last Date: {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent opacity-50" />
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20 mb-6 text-indigo-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Verified Indian Recruitment Notifications
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight max-w-4xl mx-auto">
            Government Jobs & Sarkari Recruitments <span className="text-indigo-300">2026</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-indigo-100/90 max-w-2xl mx-auto font-normal">
            Track official vacancies, application deadlines, eligibility criteria, and direct application links for Central and State government openings.
          </p>

          {/* Search Box */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative flex items-center bg-white rounded-2xl shadow-xl p-2 border border-white/20">
              <Search className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search recruitment, organization (e.g. SSC, UPSC, Railway, Bank)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none"
              />
              <button
                type="button"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 flex-shrink-0"
              >
                Find Jobs
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Category Pills & Quick Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-2 border-b border-gray-100">
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 scrollbar-none">
            {QUICK_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setPagination(p => ({ ...p, page: 1 }));
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Quick Filter toggle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setDeadlineFilter(deadlineFilter === 'closingSoon' ? 'all' : 'closingSoon')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                deadlineFilter === 'closingSoon'
                  ? 'bg-rose-50 text-rose-700 border border-rose-300'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-rose-500" />
              Closing in 7 Days
            </button>
            <button
              onClick={() => setDeadlineFilter(deadlineFilter === 'highVacancies' ? 'all' : 'highVacancies')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                deadlineFilter === 'highVacancies'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-300'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              100+ Vacancies
            </button>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Showing <strong className="text-gray-900">{filteredJobs.length}</strong> of{' '}
            <strong className="text-gray-900">{pagination.total}</strong> active opportunities
          </span>
          {selectedCategory !== 'All' && (
            <span className="font-semibold text-indigo-600">Category: {selectedCategory}</span>
          )}
        </div>

        {/* Jobs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-white rounded-2xl border border-gray-200/60 p-6 animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-6 bg-gray-200 rounded w-4/5" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-10 bg-gray-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No Government Jobs Found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
              We couldn&apos;t find any active jobs matching your criteria. Try changing categories or clearing search.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('All');
                setDeadlineFilter('all');
              }}
              className="mt-5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <Link
                key={job.id}
                to={`/government-jobs/${job.slug}`}
                className="group bg-white rounded-2xl border border-gray-200/80 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Top Header: Category & Deadline */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {job.category || 'Recruitment'}
                    </span>
                    {getDeadlineBadge(job.applicationLastDate)}
                  </div>

                  {/* Title & Organization */}
                  <h3 className="font-bold text-gray-900 text-base group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                    {job.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-1">
                    <Building className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{job.organization || 'Government Department'}</span>
                  </div>

                  {/* Vacancies & Salary badges */}
                  <div className="grid grid-cols-2 gap-2 mt-4 p-3 bg-gray-50/80 rounded-xl border border-gray-100 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Total Posts</span>
                      <span className="font-bold text-indigo-600">
                        {job.totalVacancies ? `${job.totalVacancies.toLocaleString('en-IN')} Vacancies` : 'Not specified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Salary / Pay</span>
                      <span className="font-semibold text-gray-800 line-clamp-1">
                        {job.salary || 'As per 7th CPC'}
                      </span>
                    </div>
                  </div>

                  {/* Eligibility Pill */}
                  {Array.isArray(job.qualification) && job.qualification.length > 0 && (
                    <div className="mt-3 flex items-start gap-1.5 text-xs text-gray-600">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-1 text-[11px]">
                        {job.qualification.join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Footer: Action */}
                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                    Mode: <strong className="text-gray-700">{job.applicationMode || 'Online'}</strong>
                  </span>
                  <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    View Details &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="pt-6 border-t border-gray-100 flex items-center justify-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-gray-600 px-3">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {/* Why Trust Abhyo Government Jobs Banner */}
        <div className="mt-16 bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 rounded-3xl p-8 border border-indigo-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">100% Verified Information</span>
            <h3 className="text-xl font-black text-gray-900">Official Exam Preparation & Mock Tests on Abhyo</h3>
            <p className="text-xs text-gray-600 max-w-xl">
              Every job listed on Abhyo is cross-checked with official recruitment gazettes and notifications. Prepare for these exams with our full-length mock tests and chapter-wise question banks.
            </p>
          </div>
          <Link
            to="/categories"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all whitespace-nowrap"
          >
            Explore Exam Test Series
          </Link>
        </div>
      </div>
    </div>
  );
}
