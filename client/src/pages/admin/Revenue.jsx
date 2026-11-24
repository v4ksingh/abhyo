import React, { useEffect, useState } from 'react';
import { 
  DollarSign, TrendingUp, CreditCard, ArrowUpRight, 
  Search, Filter, Download, ArrowDownRight, 
  Calendar, Briefcase, Activity, Target, ChevronRight,
  User, Hash, Info, CheckCircle2, AlertCircle, Clock,
  ShieldCheck, Zap
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, 
  Legend 
} from 'recharts';
import api from '../../lib/api';
import ExportButtons from '../../components/shared/ExportButtons';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminRevenue() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedTx, setSelectedTx] = useState(null); 

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rev, trans] = await Promise.all([
        api.get('/admin/revenue', { params: { period } }),
        api.get('/admin/transactions', { params: { limit: 1000, status: 'all' } })
      ]);
      setData(rev.data.data);
      setTransactions(trans.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  // Filter ONLY platform earnings (where instituteId is null or specific types for platform)
  const platformTransactions = transactions.filter(t => !t.instituteId || t.type === 'institute_subscription');

  const filteredTransactions = platformTransactions.filter(t => {
    const matchesSearch = t.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         t.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.razorpayPaymentId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  );

  // Recalculate overview based on platform earnings only
  const platformTotal = platformTransactions
    .filter(t => t.status === 'captured' || t.status === 'success')
    .reduce((acc, curr) => acc + curr.amount, 0);
  
  const platformCount = platformTransactions
    .filter(t => t.status === 'captured' || t.status === 'success').length;

  const byTypeData = (data?.byType || [])
    .filter(t => t.type === 'institute_subscription' || t.type === 'test_purchase') // Limit to platform streams
    .map(t => ({
      name: (t.type || '').replace('_', ' ').toUpperCase(),
      value: parseFloat(t.total),
      count: t.count
    }));

  const dailyData = (data?.daily || []).map(d => ({
    date: (d.date || '').split('-').slice(1).join('/'),
    Revenue: parseFloat(d.total),
    Orders: d.count,
  }));

  return (
    <div className="space-y-5 animate-fade-in pb-12 font-sans relative">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Platform Earnings <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full border border-indigo-100 uppercase tracking-widest">Master</span>
          </h1>
          <p className="text-slate-400 text-xs font-semibold">Excluding institute-specific sales.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {['7d', '30d', '90d', '1y'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all uppercase tracking-widest ${
                  period === p ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}>
                {p}
              </button>
            ))}
          </div>
          <ExportButtons 
            data={platformTransactions} 
            filename="platform_earnings" 
            title="Platform Earnings Statement" 
            headers={['ID', 'Date', 'User', 'Type', 'Amount', 'Status']}
          />
        </div>
      </div>

      {/* Platform Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 border-l-4 border-l-indigo-600">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Zap size={18} />
            </div>
            <div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Direct Revenue</p>
               <h2 className="text-lg font-black text-slate-800 tracking-tight">₹{platformTotal.toLocaleString()}</h2>
            </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 border-l-4 border-l-emerald-600">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <ShieldCheck size={18} />
             </div>
            <div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">SaaS Growth</p>
               <h2 className="text-lg font-black text-slate-800 tracking-tight">+24% <span className="text-[10px] text-slate-400 font-bold">YoY</span></h2>
            </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Target size={18} />
            </div>
            <div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Active Subs</p>
               <h2 className="text-lg font-black text-slate-800 tracking-tight">{platformCount}</h2>
            </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
              <Activity size={18} />
            </div>
            <div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Efficiency</p>
               <h2 className="text-lg font-black text-slate-800 tracking-tight">96.8%</h2>
            </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-5">
        {/* Trend */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
           <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6">Earnings Velocity</h3>
           <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" hide />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9}} width={30} />
                    <Tooltip />
                    <Area type="monotone" dataKey="Revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#pGrad)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Streams */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">Platform Streams</h3>
          <div className="flex-1 h-[140px] mb-4">
            <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                  <Pie data={byTypeData} innerRadius={35} outerRadius={50} paddingAngle={2} dataKey="value">
                    {byTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
               </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1">
             {byTypeData.map((t, i) => (
               <div key={i} className="flex justify-between text-[10px] items-center">
                  <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                      <span className="font-bold text-slate-500 uppercase">{t.name}</span>
                  </div>
                  <span className="font-black text-slate-800">₹{(t.value/1000).toFixed(1)}k</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Platform Ledger */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Platform Ledger</h3>
           <div className="flex gap-2 items-center">
              <Search className="text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="ID or Name..."
                className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-[10px] font-bold focus:outline-none focus:border-indigo-500 w-32 md:w-48"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[8px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100">
                <th className="px-6 py-3">Transaction</th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Value</th>
                <th className="px-6 py-3 text-right">Settlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTransactions.slice(0, 30).map((t) => (
                <tr key={t.id} onClick={() => setSelectedTx(t)} className="group hover:bg-indigo-50/30 cursor-pointer transition-colors">
                  <td className="px-6 py-3">
                    <div className="text-[11px] font-black text-slate-800 uppercase tracking-tighter">{(t.type || 'TX').replace('_',' ')}</div>
                    <div className="text-[8px] font-bold text-slate-400 mt-0.5">{new Date(t.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="text-[11px] font-black text-slate-700 truncate max-w-[150px]">{t.user?.name}</div>
                    <div className="text-[9px] font-medium text-slate-400 truncate max-w-[150px]">{t.user?.email}</div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="text-[11px] font-black text-slate-900">₹{t.amount.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[8px] font-black uppercase
                      ${(t.status === 'captured' || t.status === 'success') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {t.status === 'captured' || t.status === 'success' ? 'Settled' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden relative p-8">
              <button onClick={() => setSelectedTx(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors">✕</button>
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                   <ShieldCheck size={24} />
                </div>
                <h2 className="text-2xl font-black text-slate-900">₹{selectedTx.amount.toLocaleString()}</h2>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Platform Receipt</p>
              </div>
              <div className="space-y-4 text-[10px] mb-8">
                 <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-400 font-bold uppercase">Source</span> <span className="font-black text-slate-800 uppercase italic">{(selectedTx.type || '').replace('_',' ')}</span></div>
                 <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-400 font-bold uppercase">Payer</span> <span className="font-black text-slate-800">{selectedTx.user?.name}</span></div>
                 <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-400 font-bold uppercase">Ref ID</span> <span className="font-black text-slate-800 break-all ml-4 text-right">{selectedTx.razorpayPaymentId || selectedTx.id}</span></div>
                 <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-400 font-bold uppercase">Channel</span> <span className="font-black text-slate-100 bg-slate-900 px-2 py-0.5 rounded uppercase">{selectedTx.paymentMode}</span></div>
              </div>
              <button onClick={() => window.print()} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-500/20">
                 Finalize Receipt
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
