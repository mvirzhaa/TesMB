import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Save, Loader2, Edit3, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminRecommendations() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('riasec_content').select('*').order('category');
    if (error) alert("Error fetch: " + error.message);
    else setData(data);
    setLoading(false);
  };

  const handleChange = (index, field, value) => {
    const newData = [...data];
    newData[index][field] = value;
    setData(newData);
  };

  const handleSave = async (item) => {
    setSaving(true);
    const { error } = await supabase
      .from('riasec_content')
      .update({ 
        title: item.title, 
        description: item.description, 
        majors: item.majors, 
        jobs: item.jobs 
      })
      .eq('category', item.category);

    if (error) alert("Gagal simpan: " + error.message);
    else alert(`Data ${item.category} berhasil diupdate!`);
    setSaving(false);
  };

  if (loading) return <div className="p-10 text-center">Loading Data...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
           <Link to="/login" className="p-2 bg-white rounded-full shadow hover:bg-slate-100"><ArrowLeft size={20}/></Link>
           <div>
              <h1 className="text-3xl font-extrabold text-slate-800">Manajemen Rekomendasi</h1>
              <p className="text-slate-500">Edit Jurusan & Karir untuk setiap tipe RIASEC.</p>
           </div>
        </div>

        <div className="grid gap-8">
          {data.map((item, idx) => (
            <div key={item.category} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                 <h2 className="text-xl font-black text-indigo-900">{item.category}</h2>
                 <button 
                    onClick={() => handleSave(item)} 
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition disabled:opacity-50">
                    {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Simpan
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Judul Tampilan</label>
                    <input className="w-full p-2 border rounded-lg font-bold text-slate-700" value={item.title} onChange={(e)=>handleChange(idx, 'title', e.target.value)} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Deskripsi Singkat</label>
                    <textarea className="w-full p-2 border rounded-lg text-sm" rows={2} value={item.description} onChange={(e)=>handleChange(idx, 'description', e.target.value)} />
                 </div>
                 <div className="col-span-1 md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-pink-500 uppercase">Rekomendasi Program Studi (Pisahkan dengan koma)</label>
                    <textarea className="w-full p-3 border border-pink-200 bg-pink-50 rounded-lg text-sm font-medium" rows={2} value={item.majors} onChange={(e)=>handleChange(idx, 'majors', e.target.value)} />
                 </div>
                 <div className="col-span-1 md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-blue-500 uppercase">Rekomendasi Karir (Pisahkan dengan koma)</label>
                    <textarea className="w-full p-3 border border-blue-200 bg-blue-50 rounded-lg text-sm font-medium" rows={2} value={item.jobs} onChange={(e)=>handleChange(idx, 'jobs', e.target.value)} />
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}