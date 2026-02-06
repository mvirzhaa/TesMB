// src/Admin.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import Papa from 'papaparse'; // Library Import CSV
import { 
  Trash2, Plus, Save, Edit, Search, X, 
  Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 
} from 'lucide-react';

function Admin() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [isImporting, setIsImporting] = useState(false); // State untuk loading import

  // Ref untuk input file (hidden)
  const fileInputRef = useRef(null);

  // Form State
  const initialFormState = {
    type: 'scale',
    text_main: '',
    text_pair: '',
    category_main: 'Realistic',
    category_pair: 'Realistic'
  };
  const [formData, setFormData] = useState(initialFormState);

  const categories = ['Realistic', 'Investigative', 'Artistic', 'Social', 'Enterprising', 'Conventional'];

  // --- 1. FETCH DATA ---
  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    let { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) console.error("Error:", error);
    else setQuestions(data);
    setLoading(false);
  };

  // --- 2. FITUR IMPORT CSV (BARU!) ---
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);

    Papa.parse(file, {
      header: true, // Baris pertama dianggap nama kolom
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        
        // Validasi kolom minimal
        if (!rows[0].text_main || !rows[0].category_main) {
          alert("Format CSV salah! Pastikan ada kolom: type, text_main, category_main");
          setIsImporting(false);
          return;
        }

        // Mapping data agar sesuai format database Supabase
        const formattedData = rows.map(row => ({
          type: row.type?.toLowerCase() || 'scale', // Default scale kalau kosong
          text_main: row.text_main,
          text_pair: row.text_pair || null,
          category_main: row.category_main,
          category_pair: row.category_pair || null
        }));

        // Kirim ke Supabase
        const { error } = await supabase.from('questions').insert(formattedData);

        if (error) {
          alert("Gagal Import: " + error.message);
        } else {
          alert(`Berhasil mengimport ${formattedData.length} soal!`);
          fetchQuestions();
        }
        setIsImporting(false);
        if(fileInputRef.current) fileInputRef.current.value = ""; // Reset input
      },
      error: (error) => {
        alert("Error parsing CSV: " + error.message);
        setIsImporting(false);
      }
    });
  };

  // --- 3. CRUD MANUAL (SAMA SEPERTI SEBELUMNYA) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.text_main) return alert("Pertanyaan wajib diisi!");

    try {
      if (editingId) {
        const { error } = await supabase
          .from('questions')
          .update({
            type: formData.type,
            text_main: formData.text_main,
            text_pair: formData.type === 'choice' ? formData.text_pair : null,
            category_main: formData.category_main,
            category_pair: formData.type === 'choice' ? formData.category_pair : null
          })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('questions').insert([formData]);
        if (error) throw error;
      }
      fetchQuestions();
      resetForm();
    } catch (error) {
      alert('Gagal menyimpan: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Hapus soal ini?")) return;
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (!error) fetchQuestions();
  };

  const handleEdit = (q) => {
    setEditingId(q.id);
    setFormData(q);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData(initialFormState);
  };

  // Filter Search
  const filteredQuestions = questions.filter(q => 
    q.text_main.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.category_main.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 font-sans text-slate-800">
      
      {/* HEADER CANTIK */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Bank Soal
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Kelola semua pertanyaan kuis di sini.</p>
        </div>

        <div className="flex gap-3">
          {/* Tombol Import CSV Hidden */}
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          
          <button 
            onClick={() => fileInputRef.current.click()}
            disabled={isImporting}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-green-200 transition-all hover:-translate-y-1 active:scale-95"
          >
            {isImporting ? <Loader2 className="animate-spin" size={18}/> : <FileSpreadsheet size={18}/>}
            {isImporting ? 'Mengimport...' : 'Import CSV'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        
        {/* --- KARTU FORM (Glassmorphism) --- */}
        <div className="xl:col-span-1 bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-lg font-bold flex items-center gap-2 ${editingId ? 'text-amber-500' : 'text-blue-600'}`}>
              {editingId ? <><Edit size={20}/> Edit Mode</> : <><Plus size={20}/> Tambah Manual</>}
            </h2>
            {editingId && (
              <button onClick={resetForm} className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full text-slate-500 font-bold transition">
                Batal
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Tipe Selector */}
            <div className="p-1 bg-slate-100 rounded-xl flex">
              <button type="button" onClick={() => setFormData({...formData, type: 'scale'})}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.type === 'scale' ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                Wajah (Scale)
              </button>
              <button type="button" onClick={() => setFormData({...formData, type: 'choice'})}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.type === 'choice' ? 'bg-white shadow text-purple-600' : 'text-slate-400 hover:text-slate-600'}`}>
                Pilihan (A vs B)
              </button>
            </div>

            {/* Input Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-400 uppercase">
                    {formData.type === 'scale' ? 'Pertanyaan' : 'Pernyataan Kiri (A)'}
                 </label>
                 <textarea 
                    value={formData.text_main} 
                    onChange={e => setFormData({...formData, text_main: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-xl p-3 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
                    rows="3" placeholder="Tulis disini..."
                 />
                 <select value={formData.category_main} onChange={e => setFormData({...formData, category_main: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
              </div>

              {formData.type === 'choice' && (
                <div className="space-y-2 pt-4 border-t border-dashed border-slate-200">
                   <label className="text-xs font-bold text-slate-400 uppercase">Pernyataan Kanan (B)</label>
                   <textarea 
                      value={formData.text_pair} 
                      onChange={e => setFormData({...formData, text_pair: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-xl p-3 text-slate-700 font-medium focus:ring-2 focus:ring-purple-500 outline-none resize-none transition-all"
                      rows="3" placeholder="Tulis disini..."
                   />
                   <select value={formData.category_pair} onChange={e => setFormData({...formData, category_pair: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer">
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
              )}
            </div>

            <button type="submit" 
              className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-transform hover:-translate-y-1 flex justify-center items-center gap-2
              ${editingId ? 'bg-amber-500 shadow-amber-200' : 'bg-blue-600 shadow-blue-200'}`}>
              <Save size={18}/> {editingId ? 'Simpan Perubahan' : 'Simpan Data'}
            </button>
          </form>
        </div>

        {/* --- LIST DATA (Modern Table) --- */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Search Bar */}
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex items-center">
            <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
               <Search size={20}/>
            </div>
            <input 
               type="text" 
               placeholder="Cari soal..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="flex-1 bg-transparent border-none focus:ring-0 p-3 text-slate-700 font-medium placeholder-slate-400"
            />
            {searchTerm && <button onClick={() => setSearchTerm('')}><X className="text-slate-400 mr-3"/></button>}
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/80 backdrop-blur border-b border-slate-100 text-xs uppercase text-slate-400 font-extrabold tracking-wider">
                     <tr>
                        <th className="px-6 py-5">Tipe</th>
                        <th className="px-6 py-5 w-1/2">Konten Soal</th>
                        <th className="px-6 py-5">Kategori</th>
                        <th className="px-6 py-5 text-right">Aksi</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {loading ? (
                        <tr><td colSpan="4" className="p-10 text-center text-slate-400"><Loader2 className="animate-spin inline mr-2"/> Memuat data...</td></tr>
                     ) : filteredQuestions.length === 0 ? (
                        <tr><td colSpan="4" className="p-10 text-center text-slate-400">Data tidak ditemukan.</td></tr>
                     ) : (
                        filteredQuestions.map(q => (
                           <tr key={q.id} className="hover:bg-blue-50/30 transition-colors group">
                              <td className="px-6 py-4">
                                 <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${q.type === 'scale' ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-purple-100 text-purple-600 border-purple-200'}`}>
                                    {q.type}
                                 </span>
                              </td>
                              <td className="px-6 py-4">
                                 <p className="font-semibold text-slate-700 text-sm leading-relaxed">{q.text_main}</p>
                                 {q.type === 'choice' && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                                       <span className="font-bold text-purple-400 bg-purple-50 px-1 rounded">VS</span> {q.text_pair}
                                    </div>
                                 )}
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex flex-col gap-1 items-start">
                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-600">{q.category_main}</span>
                                    {q.type === 'choice' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-400">{q.category_pair}</span>}
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(q)} className="p-2 rounded-lg bg-amber-50 text-amber-500 hover:bg-amber-100"><Edit size={16}/></button>
                                    <button onClick={() => handleDelete(q.id)} className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"><Trash2 size={16}/></button>
                                 </div>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;