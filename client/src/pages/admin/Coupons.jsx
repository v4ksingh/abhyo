import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Tag } from 'lucide-react';

const formatForInput = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  // Returns 'YYYY-MM-DDTHH:mm'
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 0,
    isActive: true,
    maxUses: '',
    validFrom: '',
    validUntil: '',
    applicablePlans: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [couponsRes, plansRes] = await Promise.all([
        api.get('/plans/coupons'),
        api.get('/plans')
      ]);
      setCoupons(couponsRes.data.data);
      setPlans(plansRes.data.data);
    } catch (err) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (coupon = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        isActive: coupon.isActive,
        maxUses: coupon.maxUses || '',
        validFrom: formatForInput(coupon.validFrom),
        validUntil: formatForInput(coupon.validUntil),
        applicablePlans: Array.isArray(coupon.applicablePlans) ? coupon.applicablePlans : (typeof coupon.applicablePlans === 'string' ? JSON.parse(coupon.applicablePlans || '[]') : []),
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        discountType: 'percentage',
        discountValue: 0,
        isActive: true,
        maxUses: '',
        validFrom: '',
        validUntil: '',
        applicablePlans: [],
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        maxUses: formData.maxUses ? Number(formData.maxUses) : null,
        validFrom: formData.validFrom ? new Date(formData.validFrom) : null,
        validUntil: formData.validUntil ? new Date(formData.validUntil) : null,
      };

      if (editingCoupon) {
        await api.put(`/plans/coupons/${editingCoupon.id}`, payload);
        toast.success('Coupon updated');
      } else {
        await api.post('/plans/coupons', payload);
        toast.success('Coupon created');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save coupon');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/plans/coupons/${id}`);
      toast.success('Coupon deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete coupon');
    }
  };

  return (
    <div className="space-y-4 animate-fade-in font-sans">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-900 tracking-tight">Active Promo Codes</h2>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2" onClick={() => handleOpenModal()}>
          <Plus size={14} /> Add Coupon
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Code</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Discount</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Usage</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Validity</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-6 text-sm text-slate-400">No coupons found.</td></tr>
              ) : coupons.map(c => (
                <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <span className="bg-indigo-50 text-indigo-700 text-xs font-black uppercase px-2.5 py-1 rounded-lg border border-indigo-100">
                      {c.code}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-slate-700">
                      {c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold text-slate-500">
                      {c.usedCount} / {c.maxUses || '∞'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.isActive ? (
                       <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Active</span>
                    ) : (
                       <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">Disabled</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col text-[10px] font-medium text-slate-500">
                      <span>{c.validFrom ? formatDate(c.validFrom) : 'Anytime'}</span>
                      <span>to {c.validUntil ? formatDate(c.validUntil) : 'Forever'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 flex items-center justify-end gap-2">
                     <button onClick={() => handleOpenModal(c)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 flex items-center justify-center transition-all">
                        <Edit2 size={12} />
                     </button>
                     <button onClick={() => handleDelete(c.id)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-all">
                        <Trash2 size={12} />
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                <Tag size={16} className="text-indigo-500" /> {editingCoupon ? 'Edit Promo Code' : 'New Promo Code'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Coupon Code</label>
                <input type="text" className="w-full text-slate-900 bg-slate-50 border-0 rounded-xl px-4 py-2.5 text-sm font-bold uppercase focus:ring-2 focus:ring-indigo-500/20" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="e.g. FESTIVE50" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Discount Type</label>
                  <select className="w-full text-slate-900 bg-slate-50 border-0 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20" value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})}>
                     <option value="percentage">Percentage (%)</option>
                     <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Discount Value</label>
                  <input type="number" className="w-full text-slate-900 bg-slate-50 border-0 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20" value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: Number(e.target.value)})} />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Max Uses (Leave empty for ∞)</label>
                <input type="number" className="w-full text-slate-900 bg-slate-50 border-0 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20" value={formData.maxUses} onChange={e => setFormData({...formData, maxUses: e.target.value})} placeholder="e.g. 100" />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Applicable Plans (Leave empty for ALL)</label>
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-2 max-h-32 overflow-y-auto space-y-1">
                  {plans.map(plan => {
                    const currentPlans = Array.isArray(formData.applicablePlans) ? formData.applicablePlans : [];
                    const isSelected = currentPlans.includes(plan.id);
                    return (
                      <label key={plan.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-white transition-colors">
                        <input type="checkbox" className="w-3.5 h-3.5 text-indigo-600 rounded" checked={isSelected} onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({...formData, applicablePlans: [...currentPlans, plan.id]});
                          } else {
                            setFormData({...formData, applicablePlans: currentPlans.filter(id => id !== plan.id)});
                          }
                        }} />
                        <span className="text-xs font-bold text-slate-700">{plan.name} <span className="text-[9px] text-slate-400 uppercase">({plan.type})</span></span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Valid From (Optional)</label>
                  <input type="datetime-local" className="w-full text-slate-900 bg-slate-50 border-0 rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20" value={formData.validFrom} onChange={e => setFormData({...formData, validFrom: e.target.value})} />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Valid Until (Optional)</label>
                  <input type="datetime-local" className="w-full text-slate-900 bg-slate-50 border-0 rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20" value={formData.validUntil} onChange={e => setFormData({...formData, validUntil: e.target.value})} />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2">
                <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Active & Usable</span>
              </label>

            </div>
            
            <div className="p-5 bg-slate-50 flex gap-2 border-t border-slate-100">
               <button onClick={() => setShowModal(false)} className="flex-1 text-[10px] font-black text-slate-400 uppercase tracking-widest py-3 hover:text-slate-600 transition-colors">Cancel</button>
               <button onClick={handleSubmit} className="flex-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all">{editingCoupon ? 'Save Changes' : 'Create Promo Code'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
