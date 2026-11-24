import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Briefcase, Building, Calendar, Users, DollarSign, Clock,
  ExternalLink, FileText, CheckCircle2, ChevronRight, ArrowLeft,
  Share2, ShieldCheck, Download, AlertCircle, Award, Layers
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import usePageMeta from '../../hooks/usePageMeta';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function GovernmentJobDetailPage() {
  const { slug } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/government-jobs/${slug}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Government job not found');
        }
        return data.data;
      })
      .then((jobData) => {
        if (isMounted) {
          setJob(jobData);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [slug]);

  // Dynamic SEO meta
  usePageMeta({
    title: job ? `${job.title} – Notification, Vacancies & Apply Online` : 'Government Job Notification | Abhyo',
    description: job?.description?.slice(0, 160) || (job ? `${job.title} by ${job.organization}. Total Vacancies: ${job.totalVacancies || 'TBA'}. Check eligibility, dates and apply online.` : ''),
    canonical: `/government-jobs/${slug}`,
  });

  // Inject Structured Data (JobPosting) for Google Rich Results
  useEffect(() => {
    if (!job) return;

    const scriptId = 'job-posting-structured-data';
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: job.title,
      description: job.description || job.tagline || job.title,
      identifier: {
        '@type': 'PropertyValue',
        name: job.organization || 'Government of India',
        value: `JOB-${job.id}`,
      },
      datePosted: job.publishedAt || job.createdAt,
      validThrough: job.applicationLastDate ? new Date(job.applicationLastDate).toISOString() : undefined,
      employmentType: 'FULL_TIME',
      hiringOrganization: {
        '@type': 'Organization',
        name: job.organization || 'Government of India',
        sameAs: job.officialWebsite || undefined,
      },
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'IN',
        },
      },
      baseSalary: job.salary ? {
        '@type': 'MonetaryAmount',
        currency: 'INR',
        value: {
          '@type': 'QuantitativeValue',
          value: job.salary,
        },
      } : undefined,
    };

    script.textContent = JSON.stringify(structuredData);

    return () => {
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [job]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job?.title,
        text: `Check out ${job?.title} on Abhyo`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Job link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-gray-600">Loading recruitment details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-[70vh] bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-gray-200 text-center shadow-lg space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Job Not Found or Under Review</h2>
          <p className="text-xs text-gray-500">
            {error || 'This government recruitment is either not published or does not exist.'}
          </p>
          <Link
            to="/government-jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Government Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link to="/" className="hover:text-indigo-600">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/government-jobs" className="hover:text-indigo-600">Government Jobs</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900 font-semibold truncate max-w-xs">{job.shortName || job.title}</span>
        </div>

        {/* Hero Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {job.category || 'Recruitment'}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" /> Officially Verified
                </span>
                {job.applicationMode && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    Mode: {job.applicationMode}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-snug">
                {job.title}
              </h1>

              <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                <Building className="w-4 h-4 text-gray-400" />
                <span>{job.organization}</span>
              </div>
            </div>

            {/* Share action */}
            <div className="flex-shrink-0">
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-gray-100">
            <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Vacancies</div>
              <div className="text-lg font-black text-indigo-600 mt-0.5">
                {job.totalVacancies ? `${job.totalVacancies.toLocaleString('en-IN')} Posts` : 'TBA'}
              </div>
            </div>

            <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Salary Range</div>
              <div className="text-sm font-bold text-gray-800 mt-1 line-clamp-1">
                {job.salary || 'As per norms'}
              </div>
            </div>

            <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Start Date</div>
              <div className="text-sm font-semibold text-gray-800 mt-1">
                {job.applicationStartDate || 'Open'}
              </div>
            </div>

            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
              <div className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">Last Date to Apply</div>
              <div className="text-sm font-bold text-rose-700 mt-1">
                {job.applicationLastDate || 'Check Notification'}
              </div>
            </div>
          </div>

          {/* Action CTAs: Direct Apply & Official Notification */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
            {job.applyLink && (
              <a
                href={job.applyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                Apply Online (Official Link) <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {job.officialNotificationUrl && (
              <a
                href={job.officialNotificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" /> Download Notification PDF
              </a>
            )}

            {job.officialWebsite && (
              <a
                href={job.officialWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
              >
                Official Website <ExternalLink className="w-3 h-3 text-gray-500" />
              </a>
            )}
          </div>
        </div>

        {/* Content Section with Tabs */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
          {/* Tab buttons */}
          <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-none px-4 pt-2">
            {[
              { id: 'overview', label: 'Overview & Vacancy' },
              { id: 'eligibility', label: 'Eligibility & Age Limit' },
              { id: 'fee', label: 'Application Fee & Dates' },
              { id: 'selection', label: 'Selection Process & Pattern' },
              { id: 'howtoapply', label: 'How to Apply' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Tab: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6 text-sm text-gray-700">
                {job.description && (
                  <div>
                    <h3 className="font-bold text-gray-900 text-base mb-2">About This Recruitment</h3>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                      {job.description}
                    </p>
                  </div>
                )}

                {/* Vacancy Table */}
                <div>
                  <h3 className="font-bold text-gray-900 text-base mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" /> Vacancy Breakdown
                  </h3>

                  {Array.isArray(job.vacancyDetails) && job.vacancyDetails.length > 0 ? (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-2.5">Post / Position</th>
                            <th className="px-4 py-2.5 text-right">Vacancies</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {job.vacancyDetails.map((v, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-4 py-2.5 font-medium text-gray-800">{v.postName || v.category || `Post ${i + 1}`}</td>
                              <td className="px-4 py-2.5 text-right font-bold text-indigo-600">{v.vacancies || v.count || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600">
                      Total announced vacancies: <strong className="text-indigo-600">{job.totalVacancies || 'Refer to official notification'}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Eligibility & Age */}
            {activeTab === 'eligibility' && (
              <div className="space-y-6 text-sm text-gray-700">
                {/* Educational Qualifications */}
                <div>
                  <h3 className="font-bold text-gray-900 text-base mb-3">Educational Qualification</h3>
                  {Array.isArray(job.qualification) && job.qualification.length > 0 ? (
                    <ul className="space-y-2">
                      {job.qualification.map((q, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500">Please check the official notification for degree/stream requirements.</p>
                  )}

                  {job.eligibilityDetails && (
                    <div className="mt-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs leading-relaxed text-gray-700 whitespace-pre-line">
                      {job.eligibilityDetails}
                    </div>
                  )}
                </div>

                {/* Age Limit */}
                <div>
                  <h3 className="font-bold text-gray-900 text-base mb-3">Age Limit</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-xs text-gray-500">Minimum Age</div>
                      <div className="text-lg font-bold text-gray-900 mt-1">
                        {job.ageLimit?.minimum ? `${job.ageLimit.minimum} Years` : 'As per rules'}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-xs text-gray-500">Maximum Age</div>
                      <div className="text-lg font-bold text-gray-900 mt-1">
                        {job.ageLimit?.maximum ? `${job.ageLimit.maximum} Years` : 'As per rules'}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-xs text-gray-500">Calculation Reference Date</div>
                      <div className="text-sm font-semibold text-gray-900 mt-1">
                        {job.ageLimit?.calculationDate || 'Official Notification Date'}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2">
                    * Age relaxation is applicable for SC/ST/OBC/PWD/Ex-servicemen candidates as per Government of India guidelines.
                  </p>
                </div>
              </div>
            )}

            {/* Tab: Fee & Dates */}
            {activeTab === 'fee' && (
              <div className="space-y-6 text-sm text-gray-700">
                {/* Application Fee */}
                <div>
                  <h3 className="font-bold text-gray-900 text-base mb-3">Application Fee</h3>
                  {Array.isArray(job.applicationFee) && job.applicationFee.length > 0 ? (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-2.5">Category</th>
                            <th className="px-4 py-2.5 text-right">Fee (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {job.applicationFee.map((f, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-4 py-2.5 font-medium text-gray-800">{f.category || `Category ${i + 1}`}</td>
                              <td className="px-4 py-2.5 text-right font-bold text-gray-900">{f.fee || f.amount || 'Exempted'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Check official notification for specific application fee details.</p>
                  )}
                </div>

                {/* Important Dates */}
                <div>
                  <h3 className="font-bold text-gray-900 text-base mb-3">Important Dates Timeline</h3>
                  {Array.isArray(job.importantDates) && job.importantDates.length > 0 ? (
                    <div className="space-y-2">
                      {job.importantDates.map((d, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                          <span className="font-medium text-gray-800">{d.event || d.title || 'Event'}</span>
                          <span className="font-bold text-indigo-600">{d.date || 'TBA'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                        <span>Application Start:</span>
                        <strong className="text-gray-900">{job.applicationStartDate || 'Open'}</strong>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                        <span>Application Last Date:</span>
                        <strong className="text-rose-600">{job.applicationLastDate || 'TBA'}</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Selection & Pattern */}
            {activeTab === 'selection' && (
              <div className="space-y-6 text-sm text-gray-700">
                <div>
                  <h3 className="font-bold text-gray-900 text-base mb-3">Selection Process</h3>
                  {Array.isArray(job.selectionProcess) && job.selectionProcess.length > 0 ? (
                    <div className="space-y-2">
                      {job.selectionProcess.map((step, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                            {i + 1}
                          </span>
                          <span className="font-medium text-gray-800">{step}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Selection includes Written Exam followed by Document Verification / Interview as outlined in the official notification.</p>
                  )}
                </div>

                {Array.isArray(job.examPattern) && job.examPattern.length > 0 && (
                  <div>
                    <h3 className="font-bold text-gray-900 text-base mb-3">Exam Pattern</h3>
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-2.5">Subject / Section</th>
                            <th className="px-4 py-2.5">Questions</th>
                            <th className="px-4 py-2.5 text-right">Marks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {job.examPattern.map((p, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-4 py-2.5 font-medium text-gray-800">{p.subject || p.section || `Subject ${i + 1}`}</td>
                              <td className="px-4 py-2.5 text-gray-600">{p.questions || '—'}</td>
                              <td className="px-4 py-2.5 text-right font-bold text-gray-900">{p.marks || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: How to Apply */}
            {activeTab === 'howtoapply' && (
              <div className="space-y-6 text-sm text-gray-700">
                <div>
                  <h3 className="font-bold text-gray-900 text-base mb-3">Steps to Apply Online</h3>
                  {Array.isArray(job.howToApply) && job.howToApply.length > 0 ? (
                    <ol className="space-y-2 list-decimal pl-5 text-xs text-gray-700">
                      {job.howToApply.map((step, i) => (
                        <li key={i} className="py-1">{step}</li>
                      ))}
                    </ol>
                  ) : (
                    <div className="space-y-2 text-xs text-gray-700">
                      <p>1. Visit the official recruitment portal using the link provided above.</p>
                      <p>2. Complete the initial registration with your basic contact information.</p>
                      <p>3. Fill in the detailed online application form with educational and personal details.</p>
                      <p>4. Upload required documents (Photograph, Signature, Category Certificate).</p>
                      <p>5. Pay the online application fee and submit the final form.</p>
                      <p>6. Print a copy of the completed application form for future reference.</p>
                    </div>
                  )}
                </div>

                {Array.isArray(job.requiredDocuments) && job.requiredDocuments.length > 0 && (
                  <div>
                    <h3 className="font-bold text-gray-900 text-base mb-3">Required Documents</h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {job.requiredDocuments.map((doc, i) => (
                        <li key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                          <span>{doc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mock Test CTA Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl font-bold">Preparing for {job.organization || 'Government'} Exams?</h3>
            <p className="text-xs text-indigo-200 max-w-xl">
              Access latest previous year questions, timed mock tests, and subject-wise practice tests designed strictly according to the official syllabus.
            </p>
          </div>
          <Link
            to="/categories"
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-lg transition-all whitespace-nowrap"
          >
            Start Practicing Mock Tests
          </Link>
        </div>
      </div>
    </div>
  );
}
