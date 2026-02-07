import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Save, Edit2, X, Briefcase, GraduationCap, Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminRecommendations() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: riasec, error } = await supabase.from('riasec_content').select('*').order('category');
    if (!error) setData(riasec);
    setLoading(false);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditForm(item);
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from('riasec_content')
      .update({
        title: editForm.title,
        description: editForm.description,
        majors: editForm.majors,
        jobs: editForm.jobs
      })
      .eq('id', editingId);

    if (!error) {
      alert("Data berhasil diperbarui!");
      setEditingId(null);
      fetchData();
    } else {
      alert("Gagal menyimpan: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
           <Link to="/admin/dashboard" className="p-2 bg-white rounded-full text-slate-500 hover:text-indigo-600 shadow-sm border border-slate-200 transition">
              <ArrowLeft size={20}/>
           </Link>
           <div>
              <h1 className="text-3xl font-extrabold text-slate-800">Manajemen Konten</h1>
              <p className="text-slate-500">Edit deskripsi hasil, rekomendasi prodi, dan karir.</p>
           </div>
        </div>

        {loading ? (
           <div className="text-center py-20 text-slate-400 flex flex-col items-center gap-3">
              <Loader2 className="animate-spin" size={30}/> Memuat Data...
           </div>
        ) : (
           <div className="grid gap-8">
              {data.map((item) => (
                 <div key={item.id} className={`bg-white rounded-3xl p-8 shadow-sm border transition-all ${editingId === item.id ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-200 hover:border-indigo-200'}`}>
                    
                    {/* MODE EDIT */}
                    {editingId === item.id ? (
                       <div className="space-y-4">
                          <div className="flex justify-between items-center mb-4">
                             <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-500">{item.category}</span>
                             <div className="flex gap-2">
                                <button onClick={() => setEditingId(null)} className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold text-sm">Batal</button>
                                <button onClick={handleSave} className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-lg flex items-center gap-2"><Save size={16}/> Simpan</button>
                             </div>
                          </div>

                          <div>
                             <label className="text-xs font-bold text-slate-400 uppercase">Judul (Persona)</label>
                             <input className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-800 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none" 
                                value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} />
                          </div>

                          <div>
                             <label className="text-xs font-bold text-slate-400 uppercase">Deskripsi Psikologis</label>
                             <textarea rows={4} className="w-full p-3 border border-slate-200 rounded-xl text-slate-600 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none" 
                                value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="text-xs font-bold text-pink-500 uppercase flex items-center gap-1"><GraduationCap size={14}/> Rekomendasi Prodi (Pisahkan Koma)</label>
                                <textarea rows={3} className="w-full p-3 border border-pink-100 bg-pink-50/30 rounded-xl text-slate-600 mt-1 focus:ring-2 focus:ring-pink-500 outline-none" 
                                   value={editForm.majors} onChange={e => setEditForm({...editForm, majors: e.target.value})} />
                             </div>
                             <div>
                                <label className="text-xs font-bold text-blue-500 uppercase flex items-center gap-1"><Briefcase size={14}/> Rekomendasi Karir (Pisahkan Koma)</label>
                                <textarea rows={3} className="w-full p-3 border border-blue-100 bg-blue-50/30 rounded-xl text-slate-600 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" 
                                   value={editForm.jobs} onChange={e => setEditForm({...editForm, jobs: e.target.value})} />
                             </div>
                          </div>
                       </div>
                    ) : (
                       // MODE TAMPIL (VIEW)
                       <div>
                          <div className="flex justify-between items-start mb-6">
                             <div>
                                <div className="flex items-center gap-3 mb-2">
                                   <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-500">{item.category}</span>
                                   <h2 className="text-2xl font-black text-slate-800">{item.title}</h2>
                                </div>
                                <p className="text-slate-600 leading-relaxed max-w-3xl">{item.description}</p>
                             </div>
                             <button onClick={() => handleEdit(item)} className="p-3 bg-white border border-slate-200 rounded-xl text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition shadow-sm">
                                <Edit2 size={20}/>
                             </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="bg-pink-50 p-4 rounded-2xl border border-pink-100">
                                <h4 className="text-xs font-bold text-pink-600 uppercase mb-2 flex items-center gap-2"><GraduationCap size={16}/> Program Studi</h4>
                                <div className="flex flex-wrap gap-2">
                                   {item.majors.split(',').map((m, i) => (
                                      <span key={i} className="px-2 py-1 bg-white rounded-md text-xs font-medium text-pink-700 shadow-sm border border-pink-100">{m.trim()}</span>
                                   ))}
                                </div>
                             </div>
                             <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                <h4 className="text-xs font-bold text-blue-600 uppercase mb-2 flex items-center gap-2"><Briefcase size={16}/> Karir</h4>
                                <div className="flex flex-wrap gap-2">
                                   {item.jobs.split(',').map((j, i) => (
                                      <span key={i} className="px-2 py-1 bg-white rounded-md text-xs font-medium text-blue-700 shadow-sm border border-blue-100">{j.trim()}</span>
                                   ))}
                                </div>
                             </div>
                          </div>
                       </div>
                    )}
                 </div>
              ))}
           </div>
        )}
      </div>
    </div>
  );
}