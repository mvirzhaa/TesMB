import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom'; 
import { User, Calendar, Download, Mail, Phone, Loader2, Briefcase, AlertCircle } from 'lucide-react'; 

export default function AdminResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('results').select('*').order('updated_at', { ascending: false });
      if (error) throw error;
      setResults(data || []);
    } catch (err) {
      console.error("Error fetching:", err);
      // Jangan alert error agar tidak mengganggu, cukup log saja
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (results.length === 0) return alert("Belum ada data!");
    
    // Ambil keys dari data pertama yang valid (yang punya scores)
    const validData = results.find(r => r.scores && Object.keys(r.scores).length > 0);
    let allScoreKeys = validData ? Object.keys(validData.scores) : [];
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Tanggal,Nama,Email,NoHP," + allScoreKeys.join(",") + "\n";

    results.forEach(row => {
      const date = new Date(row.created_at).toLocaleDateString('id-ID');
      const scores = row.scores || {};
      const scoreValues = allScoreKeys.map(key => scores[key] || 0).join(",");
      const rowString = `${date},"${row.user_name}","${row.email||'-'}","${row.phone||'-'}",${scoreValues}`;
      csvContent += rowString + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Data_Lengkap_MinatBakat.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- FUNGSI AMAN UNTUK HITUNG DOMINAN ---
  const getDominant = (scores) => {
    // 1. Cek jika scores kosong/null
    if (!scores || Object.keys(scores).length === 0) return "Belum Ada Data";

    // 2. Filter hanya ambil data RIASEC (Abaikan Kepribadian untuk kolom ini)
    const riasecOnly = { 
      Realistic: scores.Realistic || 0, 
      Investigative: scores.Investigative || 0, 
      Artistic: scores.Artistic || 0, 
      Social: scores.Social || 0, 
      Enterprising: scores.Enterprising || 0, 
      Conventional: scores.Conventional || 0 
    };

    // 3. Pastikan tidak mereduce array kosong
    const keys = Object.keys(riasecOnly);
    if (keys.length === 0) return "-";

    // 4. Cari nilai tertinggi
    return keys.reduce((a, b) => riasecOnly[a] > riasecOnly[b] ? a : b);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
             <h1 className="text-3xl font-extrabold text-slate-800">Dashboard Admin</h1>
             <p className="text-slate-500 mt-1">Pantau hasil tes & kelola rekomendasi.</p>
          </div>
          
          <div className="flex gap-3">
            <Link to="/admin/recommendations" className="bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-5 py-3 rounded-xl font-bold shadow-sm flex items-center gap-2 transition-all">
               <Briefcase size={18}/> Kelola Prodi & Karir
            </Link>

            <button onClick={handleExportCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 flex items-center gap-2 transition-all">
              <Download size={18}/> Export CSV
            </button>
          </div>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><User size={24}/></div>
              <div><div className="text-2xl font-black text-slate-800">{results.length}</div><div className="text-xs text-slate-500 font-bold uppercase">Total Peserta</div></div>
           </div>
        </div>

        {/* Tabel Data */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-20 text-center text-slate-500 flex flex-col items-center">
               <Loader2 className="animate-spin mb-4" size={32}/> 
               <span className="font-medium">Sedang memuat data...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-20 text-center text-slate-400 flex flex-col items-center">
                <AlertCircle size={40} className="mb-4 opacity-50"/>
                <span>Belum ada data responden yang masuk.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Tanggal & Peserta</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Kontak</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Dominan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((r) => {
                    const dominant = getDominant(r.scores); // Pakai fungsi aman di atas
                    
                    return (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 text-base">{r.user_name}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-medium"><Calendar size={12}/> {new Date(r.updated_at).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-slate-600"><Mail size={14} className="text-slate-300"/> {r.email}</div>
                              <div className="flex items-center gap-2 text-sm text-slate-600"><Phone size={14} className="text-slate-300"/> {r.phone}</div>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                              Hal. {(r.last_page || 0) + 1}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           {dominant === "Belum Ada Data" ? (
                               <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg">-</span>
                           ) : (
                               <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100">{dominant}</span>
                           )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}