import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Award,
  Medal,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Sparkles,
  ArrowLeft,
  CheckCircle,
  Eye,
  Sliders,
  DollarSign
} from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

const DEFAULT_REWARDS = {
  prizePoolBadge: '₹10 Lakh+ Prize Pool',
  heading: 'Rewards for Top Performers',
  subtitle: 'Top rankers receive cash awards, medals and national recognition. Every participant earns a verified certificate.',
  airOnePrize: '₹25,000 + Gold Medal',
  prizes: [
    { pos: '2nd Place', prize: '₹15,000', extra: 'Silver Medal + Certificate', color: '#94a3b8', border: 'border-slate-700', featured: false },
    { pos: '1st Place', prize: '₹25,000', extra: 'Gold Trophy + Medal + Certificate', color: '#fbbf24', border: 'border-amber-500/60', featured: true },
    { pos: '3rd Place', prize: '₹10,000', extra: 'Bronze Medal + Certificate', color: '#b45309', border: 'border-amber-900/50', featured: false },
  ],
  participantRewardTitle: 'Every Participant Gets a Certificate',
  participantRewardSubtitle: 'QR-code verified, downloadable from your dashboard. Accepted by schools across India.',
  registrationFee: 150,
};

export default function OlympiadRewardsManager() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(DEFAULT_REWARDS);

  useEffect(() => {
    api.get('/olympiad/admin/rewards')
      .then(res => {
        if (res.data?.data) {
          setForm({
            ...DEFAULT_REWARDS,
            ...res.data.data,
            prizes: res.data.data.prizes?.length ? res.data.data.prizes : DEFAULT_REWARDS.prizes
          });
        }
      })
      .catch(err => {
        console.error('Failed to load rewards config', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePrizeChange = (index, field, value) => {
    const next = [...form.prizes];
    next[index] = { ...next[index], [field]: value };
    setForm({ ...form, prizes: next });
  };

  const handleAddPrize = () => {
    setForm({
      ...form,
      prizes: [
        ...form.prizes,
        {
          pos: `${form.prizes.length + 1}th Place`,
          prize: '₹5,000',
          extra: 'Special Merit Certificate + Medal',
          color: '#6366f1',
          border: 'border-slate-700',
          featured: false
        }
      ]
    });
  };

  const handleRemovePrize = (index) => {
    if (form.prizes.length <= 1) {
      toast.error('At least one prize tier is required');
      return;
    }
    const next = form.prizes.filter((_, i) => i !== index);
    setForm({ ...form, prizes: next });
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await api.post('/olympiad/admin/rewards', form);
      toast.success('Olympiad prizes and rewards updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all rewards and pricing to default values?')) {
      setForm(DEFAULT_REWARDS);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => navigate('/admin/olympiad')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Olympiad Dashboard
            </button>
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="p-2.5 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl text-white shadow-md shadow-amber-500/20">
              <Trophy className="w-6 h-6" />
            </span>
            Olympiad Prizes & Rewards Manager
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage the prize pool, rank cash awards, medals, and participation incentives shown on the Olympiad landing page.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Configuration Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Section Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sliders className="w-4 h-4 text-indigo-600" />
              Section Heading & Prize Pool
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Top Badge Text
              </label>
              <input
                type="text"
                value={form.prizePoolBadge}
                onChange={e => setForm({ ...form, prizePoolBadge: e.target.value })}
                placeholder="e.g. ₹10 Lakh+ Prize Pool"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
              />
              <p className="text-[11px] text-slate-400 mt-1">Highlighted badge shown above the section title.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Section Title
                </label>
                <input
                  type="text"
                  value={form.heading}
                  onChange={e => setForm({ ...form, heading: e.target.value })}
                  placeholder="e.g. Rewards for Top Performers"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hero AIR #1 Floating Badge
                </label>
                <input
                  type="text"
                  value={form.airOnePrize || ''}
                  onChange={e => setForm({ ...form, airOnePrize: e.target.value })}
                  placeholder="e.g. ₹25,000 + Gold Medal"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Default Registration Fee (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    value={form.registrationFee || 150}
                    onChange={e => setForm({ ...form, registrationFee: Number(e.target.value) })}
                    placeholder="150"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Section Subtitle / Description
              </label>
              <textarea
                rows={2}
                value={form.subtitle}
                onChange={e => setForm({ ...form, subtitle: e.target.value })}
                placeholder="Top rankers receive cash awards, medals and national recognition..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Prize Tiers / Cards */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Medal className="w-4 h-4 text-amber-500" />
                Rank Prize Tiers ({form.prizes.length})
              </h2>
              <button
                type="button"
                onClick={handleAddPrize}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Prize Tier
              </button>
            </div>

            <div className="space-y-4">
              {form.prizes.map((p, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 relative hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                      Tier #{idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={p.featured || false}
                          onChange={e => handlePrizeChange(idx, 'featured', e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                        />
                        Featured Card
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemovePrize(idx)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                        title="Delete this prize tier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Rank Title
                      </label>
                      <input
                        type="text"
                        value={p.pos}
                        onChange={e => handlePrizeChange(idx, 'pos', e.target.value)}
                        placeholder="e.g. 1st Place"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-500 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Prize Amount
                      </label>
                      <input
                        type="text"
                        value={p.prize}
                        onChange={e => handlePrizeChange(idx, 'prize', e.target.value)}
                        placeholder="e.g. ₹25,000"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-500 font-black"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Extra Rewards & Trophy Description
                      </label>
                      <input
                        type="text"
                        value={p.extra}
                        onChange={e => handlePrizeChange(idx, 'extra', e.target.value)}
                        placeholder="e.g. Gold Trophy + Medal + Certificate"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Accent Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={p.color || '#fbbf24'}
                          onChange={e => handlePrizeChange(idx, 'color', e.target.value)}
                          className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
                        />
                        <input
                          type="text"
                          value={p.color || '#fbbf24'}
                          onChange={e => handlePrizeChange(idx, 'color', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Participation Certificate Row Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Award className="w-4 h-4 text-emerald-600" />
              Participation Certificate Banner
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Banner Title
              </label>
              <input
                type="text"
                value={form.participantRewardTitle}
                onChange={e => setForm({ ...form, participantRewardTitle: e.target.value })}
                placeholder="Every Participant Gets a Certificate"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Banner Subtitle
              </label>
              <input
                type="text"
                value={form.participantRewardSubtitle}
                onChange={e => setForm({ ...form, participantRewardSubtitle: e.target.value })}
                placeholder="QR-code verified, downloadable from your dashboard. Accepted by schools across India."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Right: Live Interactive Preview */}
        <div className="lg:col-span-5">
          <div className="sticky top-20 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                Live Website Preview
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Matches /olympiad view
              </span>
            </div>

            {/* Dark Section Container */}
            <div
              className="rounded-3xl p-6 sm:p-7 text-white shadow-2xl border border-slate-800 overflow-hidden relative"
              style={{ background: 'linear-gradient(180deg, #0a0618 0%, #0d0a28 60%, #070514 100%)' }}
            >
              {/* Header inside dark box */}
              <div className="text-center mb-7">
                <p className="text-amber-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                  {form.prizePoolBadge || '₹10 Lakh+ Prize Pool'}
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {form.heading || 'Rewards for Top Performers'}
                </h3>
                <p className="text-slate-400 text-xs mt-1.5 max-w-sm mx-auto line-clamp-2">
                  {form.subtitle}
                </p>
                {form.airOnePrize && (
                  <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    AIR #1 Hero Badge: {form.airOnePrize}
                  </div>
                )}
              </div>

              {/* Prize Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                {form.prizes.map((p, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl border p-4 text-center transition-all ${
                      p.featured
                        ? 'bg-slate-900 border-amber-500/60 shadow-lg shadow-amber-500/10 sm:-translate-y-1.5'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <p className="text-[10px] font-semibold text-slate-400 mb-0.5">{p.pos}</p>
                    <p className="text-xl font-black mb-1 truncate" style={{ color: p.color || '#fbbf24' }}>
                      {p.prize}
                    </p>
                    <p className="text-[10px] text-slate-400 leading-tight">{p.extra}</p>
                  </div>
                ))}
              </div>

              {/* Every Participant Row inside Preview */}
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-900/20 p-3.5 flex flex-col gap-2 text-center sm:text-left sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold text-white leading-snug">
                    {form.participantRewardTitle}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                    {form.participantRewardSubtitle}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-lg bg-white text-slate-900 text-[10px] font-bold shrink-0 self-center">
                  Register Now
                </span>
              </div>
            </div>

            {/* Quick Action Footer in Preview Column */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Ready to publish?</p>
                <p className="text-[11px] text-slate-400">Updates will reflect live immediately on the website.</p>
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
