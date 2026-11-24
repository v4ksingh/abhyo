import React, { useEffect, useState } from 'react';
import { Edit, Trash2, ShieldCheck, X, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';

export default function AdminCategories() {
  const [dbCategories, setDbCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catForm, setCatForm] = useState({ name: '', description: '', image: '', isActive: true, parentId: '' });
  const [uploadingImg, setUploadingImg] = useState('');
  const [editCatId, setEditCatId] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      setDbCategories(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const uploadCatImage = async (file) => {
    setUploadingImg('image');
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await api.post('/questions/upload-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setCatForm(f => ({ ...f, image: res.data.data.url }));
      toast.success('Image uploaded!');
    } catch { 
      toast.error('Upload failed'); 
    } finally { 
      setUploadingImg(''); 
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!catForm.name) return toast.error('Name is required');
    
    try {
      if (editCatId) {
        await api.put('/categories/' + editCatId, catForm);
        toast.success('Category updated successfully');
      } else {
        await api.post('/categories', catForm);
        toast.success('Category created successfully');
      }
      fetchCategories();
      setEditCatId(null); 
      setCatForm({ name: '', description: '', image: '', isActive: true, parentId: '' });
    } catch(err) { 
      toast.error(err.response?.data?.error || 'Error saving category'); 
    }
  };

  const handleDelete = async (cat) => {
    if (window.confirm(`Delete category "${cat.name}"? This action cannot be undone.`)) {
      try { 
        await api.delete('/categories/' + cat.id); 
        fetchCategories(); 
        toast.success('Category deleted'); 
      } catch(err) { 
        toast.error(err.response?.data?.error || 'Delete failed'); 
      }
    }
  };

  return (
    <div className="flex-1 min-w-0 p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Test Categories</h1>
          <p className="text-sm text-slate-500 font-medium">Manage top-level categories for exams, tests, and mock papers.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Side: Category List */}
        <div className="w-full lg:w-3/5 bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
             <h3 className="font-bold text-slate-800">Existing Categories <span className="text-xs text-slate-500 ml-2 font-medium">({dbCategories.length})</span></h3>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-2xl w-full" />)}
              </div>
            ) : dbCategories.length === 0 ? (
               <div className="text-center py-12 text-slate-400">No categories found. Create your first!</div>
            ) : (
              <div className="space-y-4">
                {dbCategories.map(c => (
                  <div key={c.id}>
                    <div className="group flex items-center justify-between p-4 border border-slate-200 rounded-2xl hover:border-indigo-200 hover:shadow-md transition-all duration-200 bg-white">
                      <div className="flex items-center gap-4">
                        {c.image ? (
                          <div className="w-12 h-12 rounded-xl border border-slate-100 overflow-hidden shrink-0 shadow-sm">
                             <img src={c.image.startsWith('http') ? c.image : `${api.defaults.baseURL.replace('/api', '')}${c.image}`} alt={c.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-indigo-100">
                             <ShieldCheck size={20} />
                          </div>
                        )}
                        
                        <div>
                          <p className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                             {c.name} 
                             {!c.isActive && <span className="text-[10px] uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded ml-2 align-middle border border-amber-200">Inactive</span>}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-[300px]">{c.description || 'Top level category'}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setEditCatId(c.id); setCatForm({ name: c.name, description: c.description || '', image: c.image || '', isActive: c.isActive, parentId: '' }); }} 
                          className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-indigo-600 transition-colors shadow-sm"
                        >
                           <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(c)} 
                          className="p-2 hover:bg-red-50 rounded-xl text-slate-500 hover:text-red-600 transition-colors shadow-sm"
                        >
                           <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Subcategories rendering */}
                    {c.subCategories?.length > 0 && (
                      <div className="ml-8 mt-2 space-y-2 border-l-2 border-indigo-100 pl-4">
                        {c.subCategories.map(sub => (
                          <div key={sub.id} className="group flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:border-indigo-100 hover:shadow-sm transition-all duration-200 bg-slate-50/50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-white text-indigo-400 rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-slate-200 text-xs font-bold">
                                 ↳
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                                   {sub.name} 
                                   {!sub.isActive && <span className="text-[10px] uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded ml-2 align-middle border border-amber-200">Inactive</span>}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 max-w-[250px]">{sub.description || 'Subcategory'}</p>
                              </div>
                            </div>
                            
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => { setEditCatId(sub.id); setCatForm({ name: sub.name, description: sub.description || '', image: sub.image || '', isActive: sub.isActive, parentId: sub.parentId }); }} 
                                className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-colors shadow-sm"
                              >
                                 <Edit size={14} />
                              </button>
                              <button 
                                onClick={() => handleDelete(sub)} 
                                className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors shadow-sm"
                              >
                                 <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-2/5 sticky top-24">
          <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
            <h4 className="text-lg font-black text-slate-900 mb-6">{editCatId ? 'Edit Category' : 'Create Category'}</h4>
            
            <div className="space-y-5">
              <div>
                <label className="label">Category Name *</label>
                <input 
                   type="text" 
                   value={catForm.name} 
                   onChange={e => setCatForm({ ...catForm, name: e.target.value })} 
                   className="input-field" 
                   placeholder="e.g. UPSC, SSC, Banking..." 
                   required
                />
              </div>

              <div>
                <label className="label text-indigo-700">Subcategory Of <span className="text-xs font-normal text-slate-400">(Optional)</span></label>
                <select 
                   value={catForm.parentId || ''} 
                   onChange={e => setCatForm({ ...catForm, parentId: e.target.value })} 
                   className="input-field border-indigo-200 bg-indigo-50/30"
                >
                   <option value="">-- None (Top Level Category) --</option>
                   {dbCategories.filter(c => c.id !== editCatId).map(c => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                   ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1.5 ml-1">Select a parent if this is a specialized stream (e.g., Parent: UPSC, Sub: Civil Services).</p>
              </div>
              
              <div>
                <label className="label">Description</label>
                <textarea 
                   value={catForm.description} 
                   onChange={e => setCatForm({ ...catForm, description: e.target.value })} 
                   className="input-field resize-none min-h-[80px]" 
                   placeholder="Optional description" 
                />
              </div>
              
              <div>
                <label className="label">Banner / Logo Image</label>
                <div className="flex items-center gap-4 mt-2">
                  {catForm.image ? (
                    <div className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      <img src={catForm.image.startsWith('http') ? catForm.image : `${api.defaults.baseURL.replace('/api', '')}${catForm.image}`} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setCatForm({ ...catForm, image: '' })} className="absolute top-1 right-1 w-5 h-5 bg-white/90 shadow text-red-500 rounded-full flex items-center justify-center border border-red-100 hover:bg-red-50">
                        <X size={12} strokeWidth={3} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400">
                      <ImageIcon size={20} />
                    </div>
                  )}
                  
                  <div className="flex-1 space-y-2">
                     <label className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer text-xs font-bold text-slate-700 transition-colors">
                        {uploadingImg === 'image' ? 'Uploading...' : 'Upload Image File'}
                        <input type="file" accept="image/*" className="hidden" onChange={e => { if(e.target.files[0]) uploadCatImage(e.target.files[0]); }} />
                     </label>
                     <input type="text" value={catForm.image || ''} onChange={e => setCatForm({ ...catForm, image: e.target.value })} placeholder="Or paste image URL..." className="input-field !py-2 !text-xs w-full" />
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                  <div className="relative flex items-center">
                    <input type="checkbox" checked={catForm.isActive} onChange={e => setCatForm({ ...catForm, isActive: e.target.checked })} className="peer sr-only" />
                    <div className="w-10 h-5 bg-slate-300 rounded-full peer-checked:bg-emerald-500 transition-colors"></div>
                    <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-all peer-checked:translate-x-5 shadow-sm"></div>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800">Active Stage</span>
                    <p className="text-[10px] text-slate-500 font-medium">Toggle visibility of this category across the platform.</p>
                  </div>
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                 <button type="submit" className="flex-1 flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 py-3 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5">
                    {editCatId ? '💾 Update Category' : '✨ Create Category'}
                 </button>
                 {editCatId && (
                   <button type="button" onClick={() => { setEditCatId(null); setCatForm({ name: '', description: '', image: '', isActive: true, parentId: '' }); }} className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 py-3 rounded-xl font-bold text-sm transition-colors">
                      Cancel
                   </button>
                 )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
