import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Check, Clock, CheckCircle2, Wallet, Users, LayoutGrid, Tag, Layers } from 'lucide-react';
import Coupons from './Coupons';

const PREDEFINED_FEATURES = {
  student: [
    "Attempt Mock Tests & Exam Series",
    "Detailed Test Results & Analytics",
    "Global & Batch Leaderboard",
    "Video Courses Learning Platform",
    "Join Live Classes",
    "Track Personal Attendance",
    "Generate Digital ID Card",
    "Platform Announcements & Notifications"
  ],
  institute: [
    "Manage Students & Batches",
    "Create & Manage Custom Tests",
    "Accounts & Fee Management",
    "Course Content Management",
    "Conduct & Schedule Live Classes",
    "Complete HR Module (Payroll, Leaves)",
    "Staff Directory & Teacher Ratings",
    "Student Attendance Tracking",
    "Student Reviews Management",
    "White-labeled Public Profile"
  ]
};

export default function AdminPlans() {
  const [activeTab, setActiveTab] = useState('plans');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'student',
    price: 0,
    interval: 'monthly',
    features: [''],
    isActive: true,
    maxStudents: 50,
    maxBatches: 3,
    highlight: false,
    trialEnabled: false,
    trialDays: 7,
    modules: { courses: true, erp: true, liveClasses: true, certificate: true, reviews: true, attendance: true },
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/plans');
      setPlans(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  const getFeatures = (plan) => {
    if (Array.isArray(plan.features)) return plan.features;
    if (typeof plan.features === 'string') {
      try { return JSON.parse(plan.features); } catch { return []; }
    }
    return [];
  };

  const getModules = (plan) => {
    const defaultModules = { courses: true, erp: true, liveClasses: true, certificate: true, reviews: true, attendance: true };
    if (!plan.modules) return defaultModules;
    if (typeof plan.modules === 'string') {
      try { return { ...defaultModules, ...JSON.parse(plan.modules) }; } catch { return defaultModules; }
    }
    return { ...defaultModules, ...plan.modules };
  };

  const handleOpenModal = (plan = null) => {
    if (plan) {
      const parsedFeatures = getFeatures(plan);
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        type: plan.type,
        price: plan.price,
        interval: plan.interval,
        features: parsedFeatures.length ? parsedFeatures : [''],
        isActive: plan.isActive,
        maxStudents: plan.maxStudents || 50,
        maxBatches: plan.maxBatches || 3,
        highlight: plan.highlight || false,
        trialEnabled: plan.trialEnabled || false,
        trialDays: plan.trialDays || 7,
        modules: getModules(plan),
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        type: 'student',
        price: 0,
        interval: 'monthly',
        features: [''],
        isActive: true,
        maxStudents: 50,
        maxBatches: 3,
        highlight: false,
        trialEnabled: false,
        trialDays: 7,
        modules: { courses: true, erp: true, liveClasses: true, certificate: true, reviews: true, attendance: true },
      });
    }
    setShowModal(true);
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const removeFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures.length ? newFeatures : [''] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        features: formData.features.filter(f => f.trim() !== ''),
      };

      if (editingPlan) {
        await api.put(`/plans/${editingPlan.id}`, payload);
        toast.success('Plan updated');
      } else {
        await api.post('/plans', payload);
        toast.success('Plan created');
      }
      setShowModal(false);
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this plan?')) return;
    try {
      await api.delete(`/plans/${id}`);
      toast.success('Deleted');
      fetchPlans();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-4 animate-fade-in font-sans pb-10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setActiveTab('plans')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'plans' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
            <Layers size={14} /> Subscription Tiers
          </button>
          <button onClick={() => setActiveTab('coupons')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'coupons' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
            <Tag size={14} /> Promo Codes
          </button>
        </div>
        {activeTab === 'plans' && (
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2" onClick={() => handleOpenModal()}>
            <Plus size={14} /> Add Tier
          </button>
        )}
      </div>

      {activeTab === 'coupons' ? (
        <Coupons />
      ) : (
        <>
          {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className={`bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col group relative ${!plan.isActive ? 'opacity-70 grayscale-[0.5]' : ''}`}>
              <div className="p-5 flex-1">
                <div className="flex items-center justify-between mb-3">
                   <div className="flex gap-1.5">
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${plan.type === 'student' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                        {plan.type}
                      </span>
                      {plan.highlight && (
                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-amber-500 text-white shadow-sm">Popular</span>
                      )}
                   </div>
                   {!plan.isActive && <span className="text-[9px] font-bold text-slate-400 italic">Inactive</span>}
                </div>

                <h3 className="text-sm font-black text-slate-900 leading-none mb-1.5">{plan.name}</h3>
                <div className="flex flex-wrap items-end gap-x-2 gap-y-1 mb-4">
                   <div className="flex items-end gap-0.5">
                     <span className="text-lg font-black text-slate-900 leading-none">₹{plan.price}</span>
                     <span className="text-[10px] font-bold text-slate-400 lowercase mb-0.5">/{plan.interval}</span>
                   </div>
                   {plan.trialEnabled && (
                     <span className="text-[8px] font-black uppercase text-violet-600 bg-violet-50 px-2 py-0.5 rounded border border-violet-100 flex items-center gap-1 mb-0.5">
                       <Clock size={10} strokeWidth={3} /> {plan.trialDays} Day Free
                     </span>
                   )}
                </div>

                {plan.type === 'institute' && (
                  <div className="flex gap-3 mb-4">
                     <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        <Users size={12} className="text-slate-400" /> {plan.maxStudents}
                     </div>
                     <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        <LayoutGrid size={12} className="text-slate-400" /> {plan.maxBatches}
                     </div>
                  </div>
                )}

                <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1 scrollbar-hide py-1 border-t border-slate-50 pt-3">
                  {getFeatures(plan).map((feature, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                       <CheckCircle2 size={11} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                       <span className="text-[10px] font-medium text-slate-600 leading-normal line-clamp-1">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex gap-2">
                 <button onClick={() => handleOpenModal(plan)} className="flex-1 bg-white border border-slate-200 text-[10px] font-black text-slate-600 py-1.5 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all flex items-center justify-center gap-1.5">
                    <Edit2 size={12} /> Edit
                 </button>
                 <button onClick={() => handleDelete(plan.id)} className="w-9 h-8 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 rounded-lg flex items-center justify-center transition-all">
                    <Trash2 size={14} />
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal - Also compact */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">{editingPlan ? 'Edit Configuration' : 'Global Tier Engine'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
               <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Plan Alias</label>
                    <input type="text" className="w-full text-slate-900 bg-slate-50 border-0 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 focus:bg-white transition-all" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Category</label>
                    <select className="w-full text-slate-900 bg-slate-50 border-0 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 focus:bg-white transition-all" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                       <option value="student">Student</option>
                       <option value="institute">Institute</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Value (INR)</label>
                    <input type="number" className="w-full text-slate-900 bg-slate-50 border-0 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 focus:bg-white transition-all" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Window</label>
                    <select className="w-full text-slate-900 bg-slate-50 border-0 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 focus:bg-white transition-all" value={formData.interval} onChange={(e) => setFormData({ ...formData, interval: e.target.value })}>
                       <option value="monthly">Monthly</option>
                       <option value="yearly">Yearly</option>
                       <option value="lifetime">Lifetime</option>
                    </select>
                  </div>
               </div>

               {formData.type === 'institute' && (
                 <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                    <div>
                       <label className="text-[9px] font-black text-indigo-400 uppercase mb-1 block tracking-wider">Cap: Students</label>
                       <input type="number" className="w-full text-slate-900 bg-white border-0 rounded-xl px-3 py-1.5 text-xs font-bold" value={formData.maxStudents} onChange={(e) => setFormData({ ...formData, maxStudents: Number(e.target.value) })} />
                    </div>
                    <div>
                       <label className="text-[9px] font-black text-indigo-400 uppercase mb-1 block tracking-wider">Cap: Batches</label>
                       <input type="number" className="w-full text-slate-900 bg-white border-0 rounded-xl px-3 py-1.5 text-xs font-bold" value={formData.maxBatches} onChange={(e) => setFormData({ ...formData, maxBatches: Number(e.target.value) })} />
                    </div>
                 </div>
               )}

               {formData.type === 'institute' && (
                 <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Module Access (Institute Plan)</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { key: 'courses', label: 'Courses' },
                        { key: 'erp', label: 'HR & ERP' },
                        { key: 'liveClasses', label: 'Live Classes' },
                        { key: 'certificate', label: 'Certificates' },
                        { key: 'reviews', label: 'Reviews' },
                        { key: 'attendance', label: 'Attendance' },
                      ].map(mod => (
                        <label key={mod.key} className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-xl border border-slate-200">
                          <input type="checkbox" className="w-3 h-3 text-indigo-600 rounded" checked={formData.modules[mod.key] !== false} onChange={(e) => setFormData({ ...formData, modules: { ...formData.modules, [mod.key]: e.target.checked } })} />
                          <span className="text-[10px] font-bold text-slate-600">{mod.label}</span>
                        </label>
                      ))}
                    </div>
                 </div>
               )}

               <div className="mb-6">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Available Features</label>
                  <div className="flex flex-wrap gap-1.5 mb-4 max-h-[80px] overflow-y-auto pr-1 scrollbar-hide">
                    {(PREDEFINED_FEATURES[formData.type] || []).map(feat => {
                      const isSelected = formData.features.includes(feat);
                      return (
                        <button key={feat} type="button" onClick={() => isSelected ? setFormData({ ...formData, features: formData.features.filter(f => f !== feat) }) : setFormData({ ...formData, features: [...formData.features.filter(f => f.trim() !== ''), feat] })}
                          className={`px-3 py-1 text-[8px] font-black rounded-lg border uppercase tracking-wider transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-600'}`}>
                          {feat}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="space-y-1.5">
                    {formData.features.map((feature, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input type="text" className="flex-1 text-slate-900 bg-slate-50 border-0 rounded-lg px-3 py-1.5 text-[10px] font-bold" value={feature} onChange={(e) => handleFeatureChange(idx, e.target.value)} />
                        <button type="button" onClick={() => removeFeature(idx)} className="text-slate-300 hover:text-red-500">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={addFeature} className="text-[9px] font-black text-indigo-600 uppercase flex items-center gap-1 mt-2">
                       <Plus size={12} /> Custom Feature
                    </button>
                  </div>
               </div>
               
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer flex-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <input type="checkbox" className="w-3.5 h-3.5 text-indigo-600" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Status</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer flex-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <input type="checkbox" className="w-3.5 h-3.5 text-amber-600" checked={formData.highlight} onChange={(e) => setFormData({ ...formData, highlight: e.target.checked })} />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Highlight Tier</span>
                    </label>
                  </div>
                  
                  <div className="flex flex-col gap-2 bg-violet-50/50 p-2.5 rounded-xl border border-violet-100">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-3.5 h-3.5 text-violet-600 rounded" checked={formData.trialEnabled} onChange={(e) => setFormData({ ...formData, trialEnabled: e.target.checked })} />
                      <span className="text-[9px] font-black text-violet-600 uppercase tracking-widest">Free Trial Mode</span>
                    </label>
                    <div className={`transition-opacity duration-300 ${formData.trialEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                      <label className="text-[8px] font-black text-violet-400 uppercase tracking-widest mb-1 block">Trial Period (Days)</label>
                      <input type="number" className="w-full text-slate-900 bg-white border border-violet-100 rounded-lg px-2 py-1 text-xs font-bold" value={formData.trialDays} onChange={(e) => setFormData({ ...formData, trialDays: Number(e.target.value) })} />
                    </div>
                  </div>
                </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-2">
               <button onClick={() => setShowModal(false)} className="flex-1 text-[10px] font-black text-slate-400 uppercase tracking-widest py-3">Drop Changes</button>
               <button onClick={handleSubmit} className="flex-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-2xl shadow-xl shadow-indigo-500/20">{editingPlan ? 'Overwrite' : 'Deploy Plan'}</button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
