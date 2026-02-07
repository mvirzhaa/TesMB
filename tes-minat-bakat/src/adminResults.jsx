import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom'; 
import emailjs from '@emailjs/browser';
import { User, Calendar, Download, Mail, Phone, Loader2, Briefcase, Send, Check } from 'lucide-react'; 

export default function AdminResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [riasecContent, setRiasecContent] = useState({});
  const [sendingId, setSendingId] = useState(null); // ID user yang sedang dikirim email

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // 1. Ambil data Hasil
    const { data: resData } = await supabase.from('results').select('*').order('updated_at', { ascending: false });
    // 2. Ambil data Konten RIASEC (untuk isi email)
    const { data: contentData } = await supabase.from('riasec_content').select('*');
    
    if (resData) setResults(resData);
    if (contentData) {
        const map = {};
        contentData.forEach(c => map[c.category] = c);
        setRiasecContent(map);
    }
    setLoading(false);
  };

  // --- LOGIC KIRIM EMAIL DARI ADMIN ---
  const handleResendEmail = async (user) => {
    if (!user.scores || Object.keys(user.scores).length === 0) return alert("User ini belum menyelesaikan tes.");
    
    setSendingId(user.id);

    // Hitung Dominan
    const riasecOnly = { 
        Realistic: user.scores.Realistic || 0, Investigative: user.scores.Investigative || 0, 
        Artistic: user.scores.Artistic || 0, Social: user.scores.Social || 0, 
        Enterprising: user.scores.Enterprising || 0, Conventional: user.scores.Conventional || 0 
    };
    const dominant = Object.keys(riasecOnly).reduce((a, b) => riasecOnly[a] > riasecOnly[b] ? a : b);
    const content = riasecContent[dominant];

    if (!content) {
        alert("Data konten rekomendasi belum tersedia.");
        setSendingId(null);
        return;
    }

    const serviceID = 'service_skxbuqa'; // GANTI DENGAN ID ASLI ANDA
    const templateID = 'template_n8n5crj'; // GANTI DENGAN ID ASLI ANDA
    const publicKey = 'oTNzWCAMg-4sUC5OW'; // GANTI DENGAN KEY ASLI ANDA

    const templateParams = {
        to_name: user.user_name,
        to_email: user.email,
        dominant_type: content.title,
        description: content.description,
        majors: content.majors,
        jobs: content.jobs,
        my_website_link: window.location.origin
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

  // ... (Sisa fungsi handleExportCSV sama seperti sebelumnya) ...
  const handleExportCSV = () => { /* ... kode export csv ... */ };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* ... Header & Stats sama ... */}
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* ... Loading check ... */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase">Peserta</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase">Status</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase">Dominan</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((r) => {
                    // Logic Hitung Dominan untuk tampilan tabel
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
                          <div className="text-xs text-slate-400 flex gap-2 mt-1">
                             <span className="flex items-center gap-1"><Mail size={10}/> {r.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4"><span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">Hal. {(r.last_page||0)+1}</span></td>
                        <td className="px-6 py-4"><span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-100">{dominant}</span></td>
                        <td className="px-6 py-4 text-right">
                           <button 
                              onClick={() => handleResendEmail(r)}
                              disabled={sendingId === r.id || dominant === "-"}
                              className="px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition flex items-center gap-2 ml-auto disabled:opacity-50">
                              {sendingId === r.id ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>}
                              Resend
                           </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
        </div>
      </div>
    </div>
  );
}