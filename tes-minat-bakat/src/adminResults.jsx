import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import emailjs from '@emailjs/browser';
import { 
  Search, Download, Trash2, Mail, RefreshCcw, 
  ChevronDown, ChevronUp, Loader2, Filter, Eye,
  CheckCircle, XCircle, BrainCircuit, BookOpen
} from 'lucide-react';
import * as XLSX from 'xlsx';

// --- DATA KONSTANTA (Sama dengan App.jsx untuk konsistensi Email) ---
const DISABILITY_RULES = {
  'Normal': { restricted: [], reason: "" },
  'Buta Warna': { restricted: ['Elektro', 'Kimia', 'Kedokteran', 'Farmasi', 'Desain', 'Seni Rupa', 'Biologi', 'Arsitektur', 'Geologi', 'DKV', 'Teknik Fisika'], reason: "Butuh identifikasi warna akurat." },
  'Tuna Daksa (Kaki)': { restricted: ['Olahraga', 'Sipil', 'Mesin', 'Pertambangan', 'Geologi', 'Kehutanan', 'Kelautan', 'Oseanografi'], reason: "Butuh mobilitas fisik lapangan." },
  'Tuna Rungu': { restricted: ['Musik', 'Psikologi', 'Komunikasi', 'Hubungan Internasional', 'Broadcasting', 'Seni Suara'], reason: "Butuh kepekaan auditif." },
  'Tuna Netra (Low Vision)': { restricted: ['Desain', 'Arsitektur', 'Teknik', 'Kedokteran', 'DKV', 'Seni Rupa', 'Pilot', 'Astronomi'], reason: "Butuh ketajaman visual." }
};

const VARK_DESCRIPTIONS = {
  'Visual': 'Belajar dengan melihat (Grafik, Diagram, Peta).',
  'Aural': 'Belajar dengan mendengar (Diskusi, Ceramah).',
  'Read/Write': 'Belajar dengan membaca & menulis (Buku, Catatan).',
  'Kinesthetic': 'Belajar dengan praktek (Simulasi, Pengalaman).',
  'Multimodal': 'Gaya belajar kombinasi/fleksibel.'
};

export default function AdminResults() {
  const [results, setResults] = useState([]);
  const [riasecContent, setRiasecContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [sendingEmailId, setSendingEmailId] = useState(null);

  // --- 1. FETCH DATA ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Ambil Hasil Tes
    const { data: resData, error } = await supabase
      .from('results')
      .select('*')
      .order('created_at', { ascending: false });

    // Ambil Konten RIASEC (untuk keperluan kirim email ulang)
    const { data: contentData } = await supabase
      .from('riasec_content')
      .select('*');

    if (contentData) {
      const map = {};
      contentData.forEach(item => map[item.category] = item);
      setRiasecContent(map);
    }

    if (!error) setResults(resData);
    setLoading(false);
  };

  // --- 2. LOGIC PENENTUAN HASIL (Helper) ---
  const getDominantVARK = (scores) => {
    if (!scores) return '-';
    const varkScores = { 
      Visual: scores.Visual||0, 
      Aural: scores.Aural||0, 
      'Read/Write': scores['Read/Write']||0, 
      Kinesthetic: scores.Kinesthetic||0 
    };
    const max = Math.max(...Object.values(varkScores));
    if (max === 0) return '-'; // Belum tes
    const topKeys = Object.keys(varkScores).filter(k => varkScores[k] === max);
    return topKeys.length > 1 ? 'Multimodal' : topKeys[0];
  };

  const getDominantRIASEC = (scores) => {
    if (!scores) return '-';
    const riasecOnly = { 
      Realistic: scores.Realistic||0, Investigative: scores.Investigative||0, 
      Artistic: scores.Artistic||0, Social: scores.Social||0, 
      Enterprising: scores.Enterprising||0, Conventional: scores.Conventional||0 
    };
    // Cek jika kosong
    if (Object.values(riasecOnly).every(v => v === 0)) return '-';
    return Object.keys(riasecOnly).reduce((a, b) => riasecOnly[a] > riasecOnly[b] ? a : b);
  };

  // --- 3. KIRIM ULANG EMAIL (VERSI LENGKAP) ---
  const handleResendEmail = async (user) => {
    if (!confirm(`Kirim ulang email hasil lengkap ke ${user.email}?`)) return;
    setSendingEmailId(user.id);

    try {
      const scores = user.scores || {};
      
      // A. Siapkan RIASEC
      const dominantR = getDominantRIASEC(scores);
      const content = riasecContent[dominantR];
      if (!content) throw new Error("Data konten RIASEC tidak ditemukan.");

      // B. Siapkan VARK
      const dominantV = getDominantVARK(scores);
      const varkScores = { Visual: scores.Visual||0, Aural: scores.Aural||0, 'Read/Write': scores['Read/Write']||0, Kinesthetic: scores.Kinesthetic||0 };
      const varkDesc = VARK_DESCRIPTIONS[dominantV] || "";
      const varkDetails = Object.entries(varkScores).map(([k,v]) => `• ${k}: ${v}`).join('\n');
      const varkEmailText = `Tipe: ${dominantV}\n${varkDesc}\n\nRincian:\n${varkDetails}`;

      // C. Siapkan Kepribadian
      const personalityScores = Object.keys(scores)
        .filter(k => k.includes('Kepribadian_'))
        .reduce((obj, key) => { obj[key.replace('Kepribadian_', '')] = scores[key]; return obj; }, {});
      const personalityEmailText = Object.entries(personalityScores).map(([k,v]) => `• ${k}: ${v}/20`).join('\n');

      // D. Siapkan Jurusan & Medis
      const majorsList = content.majors.split(',').map(m => m.trim());
      const rule = DISABILITY_RULES[user.disability] || { restricted: [] };
      const allowed = majorsList.filter(m => !rule.restricted.some(r => m.toLowerCase().includes(r.toLowerCase())));
      const restricted = majorsList.filter(m => rule.restricted.some(r => m.toLowerCase().includes(r.toLowerCase())));
      
      const restrictedText = restricted.length > 0 
        ? `\n\n[CATATAN MEDIS]: Tidak disarankan: ${restricted.join(', ')}.\nALASAN: ${rule.reason}` 
        : '';

      // E. Kirim via EmailJS
      const templateParams = {
        to_name: user.user_name,
        to_email: user.email,
        dominant_type: content.title,
        description: content.description,
        majors: allowed.join(', ') + restrictedText,
        jobs: content.jobs,
        disability_note: restrictedText ? restrictedText : '',
        personality_result: personalityEmailText,
        vark_result: varkEmailText,
        my_website_link: window.location.origin, // Atau URL Vercel asli
      };

      await emailjs.send('service_skxbuqa', 'template_n8n5crj', templateParams, 'oTNzWCAMg-4sUC5OW');
      alert("Email berhasil dikirim ulang!");

    } catch (err) {
      console.error(err);
      alert("Gagal mengirim email: " + err.message);
    } finally {
      setSendingEmailId(null);
    }
  };

  // --- 4. EXPORT EXCEL ---
  const handleExport = () => {
    const dataToExport = results.map(r => ({
      Tanggal: new Date(r.created_at).toLocaleDateString(),
      Nama: r.user_name,
      Email: r.email,
      NoHP: r.phone,
      Kondisi: r.disability,
      RIASEC_Dominan: getDominantRIASEC(r.scores),
      VARK_Dominan: getDominantVARK(r.scores),
      Rating_Akurasi: r.accuracy_rating || 0,
      Feedback: r.user_feedback || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hasil Tes");
    XLSX.writeFile(wb, "Data_Responden_Lengkap.xlsx");
  };

  const handleDelete = async (id) => {
    if(!confirm("Yakin hapus data ini?")) return;
    await supabase.from('results').delete().eq('id', id);
    fetchData();
  };

  // Filter Search
  const filteredData = results.filter(r => 
    r.user_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800">Manajemen Hasil Tes</h1>
            <p className="text-slate-500">Pantau hasil RIASEC, Kepribadian, dan Gaya Belajar peserta.</p>
          </div>
          <div className="flex gap-2">
             <button onClick={fetchData} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"><RefreshCcw size={20}/></button>
             <button onClick={handleExport} className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex items-center gap-2 shadow-lg shadow-green-200"><Download size={18}/> Export Excel</button>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex items-center gap-4">
           <Search className="text-slate-400"/>
           <input className="flex-1 outline-none text-slate-700 font-medium" placeholder="Cari nama atau email peserta..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
           {loading ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2"><Loader2 className="animate-spin"/> Memuat Data...</div>
           ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                         <th className="p-6 font-bold">Peserta</th>
                         <th className="p-6 font-bold">Kondisi</th>
                         <th className="p-6 font-bold">Minat (RIASEC)</th>
                         <th className="p-6 font-bold">Gaya Belajar (VARK)</th>
                         <th className="p-6 font-bold text-center">Aksi</th>
                      </tr>
                   </thead>
                   <tbody className="text-sm text-slate-600">
                      {filteredData.map((row) => (
                         <React.Fragment key={row.id}>
                            <tr className={`border-b border-slate-50 hover:bg-indigo-50/30 transition cursor-pointer ${expandedRow === row.id ? 'bg-indigo-50/50' : ''}`} onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}>
                               <td className="p-6">
                                  <div className="font-bold text-slate-800">{row.user_name}</div>
                                  <div className="text-xs text-slate-400">{row.email}</div>
                                  <div className="text-xs text-slate-400 mt-1">{new Date(row.created_at).toLocaleDateString()}</div>
                               </td>
                               <td className="p-6">
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${row.disability === 'Normal' ? 'bg-slate-100 text-slate-500' : 'bg-red-100 text-red-600'}`}>{row.disability}</span>
                               </td>
                               <td className="p-6 font-bold text-indigo-600">
                                  {getDominantRIASEC(row.scores)}
                               </td>
                               <td className="p-6 font-bold text-purple-600 flex items-center gap-2">
                                  <BookOpen size={16}/> {getDominantVARK(row.scores)}
                               </td>
                               <td className="p-6 text-center">
                                  <div className="flex justify-center gap-2" onClick={(e)=>e.stopPropagation()}>
                                     <button 
                                        onClick={()=>handleResendEmail(row)} 
                                        disabled={sendingEmailId === row.id}
                                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200 disabled:opacity-50" 
                                        title="Kirim Ulang Email Lengkap"
                                     >
                                        {sendingEmailId === row.id ? <Loader2 size={18} className="animate-spin"/> : <Mail size={18}/>}
                                     </button>
                                     <button onClick={()=>handleDelete(row.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200" title="Hapus Data"><Trash2 size={18}/></button>
                                     <button onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 md:hidden"><Eye size={18}/></button>
                                  </div>
                               </td>
                            </tr>
                            
                            {/* DETAIL EXPANDED ROW (Skor Rinci) */}
                            {expandedRow === row.id && (
                               <tr className="bg-indigo-50/30">
                                  <td colSpan="5" className="p-6">
                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                           <h4 className="font-bold text-slate-800 mb-3 text-xs uppercase tracking-widest border-b pb-2">Rincian VARK</h4>
                                           <ul className="space-y-1 text-xs">
                                              {['Visual','Aural','Read/Write','Kinesthetic'].map(k => (
                                                 <li key={k} className="flex justify-between"><span>{k}</span> <span className="font-bold">{row.scores?.[k] || 0}</span></li>
                                              ))}
                                           </ul>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                           <h4 className="font-bold text-slate-800 mb-3 text-xs uppercase tracking-widest border-b pb-2">Rincian Kepribadian</h4>
                                           <ul className="space-y-1 text-xs">
                                              {Object.keys(row.scores || {}).filter(k=>k.includes('Kepribadian')).map(k => (
                                                 <li key={k} className="flex justify-between"><span>{k.replace('Kepribadian_', '')}</span> <span className="font-bold">{row.scores[k]}</span></li>
                                              ))}
                                           </ul>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                           <h4 className="font-bold text-slate-800 mb-3 text-xs uppercase tracking-widest border-b pb-2">Feedback User</h4>
                                           <div className="flex items-center gap-1 text-amber-500 font-bold mb-1">
                                              <span className="text-xl">{row.accuracy_rating || 0}</span> <span className="text-xs text-slate-400">/ 5 Bintang</span>
                                           </div>
                                           <p className="text-xs text-slate-500 italic">"{row.user_feedback || 'Tidak ada pesan.'}"</p>
                                        </div>
                                     </div>
                                  </td>
                               </tr>
                            )}
                         </React.Fragment>
                      ))}
                   </tbody>
                </table>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}