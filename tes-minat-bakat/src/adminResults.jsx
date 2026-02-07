import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom'; 
import emailjs from '@emailjs/browser';
import { User, Calendar, Download, Mail, Phone, Loader2, Briefcase, Send, Check, AlertCircle, EyeOff } from 'lucide-react'; 

export default function AdminResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [riasecContent, setRiasecContent] = useState({});
  const [sendingId, setSendingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: resData } = await supabase.from('results').select('*').order('updated_at', { ascending: false });
    const { data: contentData } = await supabase.from('riasec_content').select('*');
    if (resData) setResults(resData);
    if (contentData) {
        const map = {};
        contentData.forEach(c => map[c.category] = c);
        setRiasecContent(map);
    }
    setLoading(false);
  };

  const handleResendEmail = async (user) => {
    if (!user.scores || Object.keys(user.scores).length === 0) return alert("User ini belum menyelesaikan tes.");
    setSendingId(user.id);

    const riasecOnly = { 
        Realistic: user.scores.Realistic || 0, Investigative: user.scores.Investigative || 0, 
        Artistic: user.scores.Artistic || 0, Social: user.scores.Social || 0, 
        Enterprising: user.scores.Enterprising || 0, Conventional: user.scores.Conventional || 0 
    };
    const dominant = Object.keys(riasecOnly).reduce((a, b) => riasecOnly[a] > riasecOnly[b] ? a : b);
    const content = riasecContent[dominant];

    if (!content) { alert("Data konten belum tersedia."); setSendingId(null); return; }

    const serviceID = 'service_skxbuqa'; // GANTI ID ANDA
    const templateID = 'template_n8n5crj'; // GANTI ID ANDA
    const publicKey = 'oTNzWCAMg-4sUC5OW'; // GANTI KEY ANDA

    const templateParams = {
        to_name: user.user_name,
        to_email: user.email,
        dominant_type: content.title,
        description: content.description,
        majors: content.majors,
        jobs: content.jobs,
        my_website_link: window.location.origin,
        // Tambahkan catatan disabilitas di email
        disability_note: user.disability && user.disability !== 'Normal' ? `Catatan: Peserta memiliki kondisi ${user.disability}. Rekomendasi jurusan mungkin perlu penyesuaian.` : ''
    };

    try {
        await emailjs.send(serviceID, templateID, templateParams, publicKey);
        alert(`Email berhasil dikirim ulang ke ${user.email}`);
    } catch (error) {
        console.error("Gagal kirim:", error);
        alert("Gagal mengirim email.");
    } finally {
        setSendingId(null);
    }
  };

  // FUNGSI CSV EXPORT (Update ada kolom Disabilitas)
  const handleExportCSV = () => {
    if (results.length === 0) return alert("Belum ada data!");
    const validData = results.find(r => r.scores && Object.keys(r.scores).length > 0);
    let allScoreKeys = validData ? Object.keys(validData.scores) : [];
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Tanggal,Nama,Email,NoHP,Disabilitas," + allScoreKeys.join(",") + "\n";

    results.forEach(row => {
      const date = new Date(row.created_at).toLocaleDateString('id-ID');
      const scoreValues = allScoreKeys.map(key => (row.scores||{})[key] || 0).join(",");
      csvContent += `${date},"${row.user_name}","${row.email||'-'}","${row.phone||'-'}","${row.disability||'Normal'}",${scoreValues}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Data_Lengkap_MinatBakat.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div><h1 className="text-3xl font-extrabold text-slate-800">Dashboard Admin</h1><p className="text-slate-500 mt-1">Pantau hasil tes & kelola rekomendasi.</p></div>
          <div className="flex gap-3">
            <Link to="/admin/recommendations" className="bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-5 py-3 rounded-xl font-bold shadow-sm flex items-center gap-2 transition-all"><Briefcase size={18}/> Kelola Prodi</Link>
            <button onClick={handleExportCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 flex items-center gap-2 transition-all"><Download size={18}/> Export CSV</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[300px]">
          {loading ? (
            <div className="p-20 text-center text-slate-500 flex flex-col items-center justify-center h-full"><Loader2 className="animate-spin mb-4" size={32}/> <span className="font-medium">Sedang memuat data...</span></div>
          ) : results.length === 0 ? (
            <div className="p-20 text-center text-slate-400 flex flex-col items-center justify-center h-full"><AlertCircle size={40} className="mb-4 opacity-50"/><span>Belum ada data responden.</span></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase">Peserta</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase">Kondisi</th> {/* Kolom Baru */}
                    <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase">Dominan</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((r) => {
                    const scores = r.scores || {};
                    let dominant = "-";
                    if (Object.keys(scores).length > 0) {
                        const riasecOnly = { R: scores.Realistic||0, I: scores.Investigative||0, A: scores.Artistic||0, S: scores.Social||0, E: scores.Enterprising||0, C: scores.Conventional||0 };
                        dominant = Object.keys(riasecOnly).reduce((a, b) => riasecOnly[a] > riasecOnly[b] ? a : b);
                    }

                    return (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{r.user_name}</div>
                          <div className="text-xs text-slate-400 flex gap-2 mt-1"><span className="flex items-center gap-1"><Mail size={10}/> {r.email}</span></div>
                        </td>
                        <td className="px-6 py-4">
                           {/* Tampilan Disabilitas */}
                           <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${!r.disability || r.disability === 'Normal' ? 'bg-slate-100 text-slate-500' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                              {(!r.disability || r.disability === 'Normal') ? 'Normal' : <><EyeOff size={10}/> {r.disability}</>}
                           </div>
                        </td>
                        <td className="px-6 py-4"><span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-100">{dominant}</span></td>
                        <td className="px-6 py-4 text-right">
                           <button onClick={() => handleResendEmail(r)} disabled={sendingId === r.id || dominant === "-"} className="px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition flex items-center gap-2 ml-auto disabled:opacity-50">
                              {sendingId === r.id ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>} Resend
                           </button>
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