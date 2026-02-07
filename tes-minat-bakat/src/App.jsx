import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom';
import emailjs from '@emailjs/browser'; // <--- 1. Import EmailJS
import {
  Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale, BarElement
} from 'chart.js';
import { Radar, Bar } from 'react-chartjs-2';
import { 
  Smile, Meh, Frown, CheckCircle, ArrowRight, RefreshCcw, 
  Loader2, User, Star, ChevronRight, Briefcase, 
  ThumbsUp, ThumbsDown, Lock, Mail, Phone, AlertTriangle, Layout, Activity, Sparkles, BrainCircuit, ArrowLeft, GraduationCap, Download, Send
} from 'lucide-react';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const ITEMS_PER_PAGE = 10;
const PART_1_LIMIT = 99; 

function App() {
  const [currentStep, setCurrentStep] = useState('intro');
  const [questions, setQuestions] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // State baru untuk status pengiriman email
  const [isEmailSending, setIsEmailSending] = useState(false); 

  const [resultTab, setResultTab] = useState('minat'); 
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [userAnswers, setUserAnswers] = useState({});
  const [resultId, setResultId] = useState(null);
  const [riasecContent, setRiasecContent] = useState({});

  useEffect(() => {
    const fetchContent = async () => {
      const { data } = await supabase.from('riasec_content').select('*');
      if (data) {
        const contentMap = {};
        data.forEach(item => contentMap[item.category] = item);
        setRiasecContent(contentMap);
      }
    };
    fetchContent();
  }, []);

  const calculateFinalScores = () => {
    const scores = {}; 
    ['Realistic','Investigative','Artistic','Social','Enterprising','Conventional'].forEach(k => scores[k] = 0);
    Object.values(userAnswers).forEach(ans => {
      if (ans.category) {
        if (scores[ans.category] === undefined) scores[ans.category] = 0;
        scores[ans.category] += ans.weight;
      }
    });
    return scores;
  };

  const saveProgress = async (nextPage) => {
    if (!resultId) return; 
    const finalScores = calculateFinalScores();
    const payload = { scores: finalScores, last_page: nextPage, raw_answers: userAnswers, updated_at: new Date() };
    await supabase.from('results').update(payload).eq('id', resultId);
  };

  const handleStart = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) return alert("Mohon lengkapi semua data diri.");
    setIsLoading(true);

    const { data: qData, error: qError } = await supabase.from('questions').select('*').order('id', { ascending: true });
    if (qError || !qData || qData.length === 0) {
        alert("Gagal memuat soal. Database kosong?");
        setIsLoading(false);
        return;
    }
    setQuestions(qData);
    const totalPages = Math.ceil(qData.length / ITEMS_PER_PAGE);

    const { data: lastResult } = await supabase.from('results').select('*').eq('email', formData.email).order('updated_at', { ascending: false }).limit(1).single();

    let resumeData = null;
    if (lastResult) {
        const isFinished = (lastResult.last_page || 0) >= (totalPages - 1);
        if (!isFinished) {
            if (window.confirm(`Hai ${lastResult.user_name}, kamu belum menyelesaikan tes sebelumnya. Lanjut?`)) {
                resumeData = lastResult;
            }
        }
    }

    if (resumeData) {
        setResultId(resumeData.id);
        setFormData({ name: resumeData.user_name, email: resumeData.email, phone: resumeData.phone || '' });
        setUserAnswers(resumeData.raw_answers || {});
        setCurrentPage(resumeData.last_page || 0);
        setCurrentStep('quiz');
    } else {
        const { data: newResult, error: insertError } = await supabase.from('results').insert([{ 
            user_name: formData.name, email: formData.email, phone: formData.phone, scores: {}, last_page: 0, raw_answers: {} 
          }]).select().single();

        if (insertError) alert("Gagal memulai sesi: " + insertError.message);
        else {
            setResultId(newResult.id);
            setCurrentStep('quiz');
        }
    }
    setIsLoading(false);
  };

  const handleAnswer = (idx, w, cat) => setUserAnswers(prev => ({ ...prev, [idx]: { weight: w, category: cat } }));
  
  const handleNextPage = async () => {
    setIsLoading(true);
    const totalPages = Math.ceil(questions.length / ITEMS_PER_PAGE);
    let nextPage = currentPage;
    if (currentPage < totalPages - 1) {
       nextPage = currentPage + 1;
       setCurrentPage(nextPage);
       window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
       setCurrentStep('result');
    }
    await saveProgress(nextPage); 
    setIsLoading(false);
  };

  // --- FUNGSI KIRIM EMAIL (BARU) ---
  const handleSendEmail = (dominantContent) => {
    setIsEmailSending(true);

    // Persiapkan data untuk template email
    // GANTI 'YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', 'YOUR_PUBLIC_KEY' DENGAN DATA DARI EMAILJS
    const serviceID = 'service_skxbuqa'; 
    const templateID = 'template_n8n5crj';
    const publicKey = 'oTNzWCAMg-4sUC5OW';

    const templateParams = {
        to_name: formData.name,
        to_email: formData.email, // Email tujuan (diambil dari form awal)
        dominant_type: dominantContent.title,
        description: dominantContent.description,
        majors: dominantContent.majors,
        jobs: dominantContent.jobs,
        my_website_link: window.location.origin // Link website Anda
    };

    emailjs.send(serviceID, templateID, templateParams, publicKey)
      .then((response) => {
         console.log('SUCCESS!', response.status, response.text);
         alert(`Hasil tes berhasil dikirim ke email: ${formData.email}`);
         setIsEmailSending(false);
      }, (err) => {
         console.log('FAILED...', err);
         alert('Gagal mengirim email. Pastikan konfigurasi EmailJS benar.');
         setIsEmailSending(false);
      });
  };

  // --- UI COMPONENTS ---
  const renderQuestionCard = (q, globalIndex, myAnswer) => {
     const scaleOptions = [
       {v:1, i:<Frown/>, l:'Sangat Tidak', c:'text-rose-500 bg-rose-50 border-rose-200 ring-rose-200'},
       {v:2, i:<Frown/>, l:'Tidak Suka', c:'text-orange-500 bg-orange-50 border-orange-200 ring-orange-200'},
       {v:3, i:<Meh/>, l:'Netral', c:'text-amber-500 bg-amber-50 border-amber-200 ring-amber-200'},
       {v:4, i:<Smile/>, l:'Suka', c:'text-emerald-500 bg-emerald-50 border-emerald-200 ring-emerald-200'},
       {v:5, i:<Smile/>, l:'Sangat Suka', c:'text-teal-600 bg-teal-50 border-teal-200 ring-teal-200'}
     ];

     switch(q.type) {
        case 'scale': 
          return (
            <div className="grid grid-cols-5 gap-2 mt-4">
               {scaleOptions.map(o => {
                 const active = myAnswer?.weight === o.v;
                 return (
                   <button key={o.v} onClick={() => handleAnswer(globalIndex, o.v, q.category_main)} 
                     className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${active ? `${o.c} border-2 shadow-md transform scale-105 ring-2` : 'border-slate-100 text-slate-300 hover:bg-slate-50 hover:text-slate-400'}`}>
                     <div className={active ? 'scale-110 transition-transform' : ''}>{React.cloneElement(o.i, {size: active ? 26 : 24, strokeWidth: 2})}</div>
                     <span className={`text-[9px] font-bold mt-2 uppercase tracking-wide hidden md:block ${active ? '' : 'text-slate-400'}`}>{o.l}</span>
                   </button>
                 )
               })}
            </div>
          );
        // ... (Case Star, Boolean, Choice tetap sama seperti sebelumnya, saya persingkat agar muat)
        case 'star': return (<div className="flex flex-col items-center justify-center py-6 bg-slate-50 rounded-xl border border-slate-100 mt-4"><div className="flex gap-3">{[1,2,3,4,5].map(v => (<button key={v} onClick={() => handleAnswer(globalIndex, v, q.category_main)} className={`p-1 transition-all duration-200 hover:scale-110 ${myAnswer?.weight >= v ? 'text-amber-400 drop-shadow-sm' : 'text-slate-200 hover:text-amber-200'}`}><Star size={38} fill={myAnswer?.weight >= v ? "currentColor" : "none"} strokeWidth={myAnswer?.weight >= v ? 0 : 1.5} /></button>))}</div><div className="mt-3 text-xs font-bold text-slate-400 uppercase tracking-widest">{myAnswer?.weight ? `Rating: ${myAnswer.weight}/5` : 'Berikan Rating'}</div></div>);
        case 'boolean': return (<div className="flex gap-4 mt-4"><button onClick={() => handleAnswer(globalIndex, 1, q.category_main)} className={`flex-1 py-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${myAnswer?.weight === 1 ? 'border-rose-500 bg-rose-50 text-rose-600 shadow-md ring-2 ring-rose-200' : 'border-slate-100 text-slate-400 hover:border-rose-200 hover:text-rose-400'}`}><ThumbsDown size={20}/> TIDAK</button><button onClick={() => handleAnswer(globalIndex, 5, q.category_main)} className={`flex-1 py-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${myAnswer?.weight === 5 ? 'border-teal-500 bg-teal-50 text-teal-600 shadow-md ring-2 ring-teal-200' : 'border-slate-100 text-slate-400 hover:border-teal-200 hover:text-teal-400'}`}><ThumbsUp size={20}/> YA</button></div>);
        case 'choice': return (<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">{[{ val: 2, cat: q.category_main, text: q.text_main, label: 'A', color: 'indigo' }, { val: 2, cat: q.category_pair, text: q.text_pair, label: 'B', color: 'pink' }].map((opt, i) => { const isActive = myAnswer?.weight === opt.val && myAnswer?.category === opt.cat; return (<button key={i} onClick={() => handleAnswer(globalIndex, opt.val, opt.cat)} className={`p-5 rounded-xl border-2 text-left transition-all relative overflow-hidden ${isActive ? `border-${opt.color}-500 bg-${opt.color}-50 shadow-md ring-2 ring-${opt.color}-200` : 'border-slate-100 hover:border-slate-300 bg-white'}`}><span className="text-xs font-black text-slate-400 mb-1 block tracking-widest uppercase">Pilihan {opt.label}</span><span className={`text-sm font-bold ${isActive ? `text-${opt.color}-900` : 'text-slate-600'}`}>{opt.text}</span>{isActive && <div className={`absolute top-4 right-4 text-${opt.color}-600`}><CheckCircle size={18} /></div>}</button>)})}</div>);
        default: return null;
     }
  };

  // --- HALAMAN 1 & 2 (INTRO & QUIZ) TETAP SAMA ---
  if (currentStep === 'intro') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans relative">
        <Link to="/login" className="absolute top-6 right-6 z-20 flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-full text-slate-500 hover:text-indigo-600 hover:bg-white hover:shadow-md transition-all text-sm font-bold group"><Lock size={16} className="group-hover:text-indigo-600"/><span>Admin</span></Link>
        <div className="max-w-5xl w-full bg-white rounded-[2rem] shadow-xl overflow-hidden flex flex-col md:flex-row border border-slate-100 relative z-10">
           <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
              <div className="mb-8"><div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider mb-4"><Sparkles size={14}/> Psikometri Online</div><h1 className="text-4xl font-extrabold text-slate-800 mb-2">Tes Minat & Bakat</h1><p className="text-slate-500">Temukan potensi karir dan kepribadianmu dalam 138 pertanyaan.</p></div>
              <form onSubmit={handleStart} className="space-y-4">
                 <div className="space-y-3">
                    <div className="relative group"><User className="absolute left-4 top-3.5 text-slate-400" size={18}/><input className="w-full pl-11 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700" placeholder="Nama Lengkap" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/></div>
                    <div className="relative group"><Mail className="absolute left-4 top-3.5 text-slate-400" size={18}/><input className="w-full pl-11 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700" placeholder="Email (Untuk Resume)" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})}/></div>
                    <div className="relative group"><Phone className="absolute left-4 top-3.5 text-slate-400" size={18}/><input className="w-full pl-11 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700" placeholder="Nomor WhatsApp" value={formData.phone} onChange={e=>setFormData({...formData, phone:e.target.value})}/></div>
                 </div>
                 <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex justify-center items-center gap-2 mt-2">{isLoading ? <Loader2 className="animate-spin"/> : <>Mulai Sekarang <ArrowRight size={18}/></>}</button>
              </form>
           </div>
           <div className="flex-1 bg-indigo-900 text-white p-8 md:p-12 flex flex-col justify-center relative overflow-hidden"><div className="relative z-10"><h3 className="text-xl font-bold mb-6 flex items-center gap-2"><AlertTriangle className="text-yellow-400"/> Ketentuan Tes</h3><ul className="space-y-4 text-sm text-indigo-100"><li className="flex gap-3"><div className="w-6 h-6 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-bold">1</div> <span>Terdiri dari <strong>138 Soal</strong> (Minat & Kepribadian).</span></li><li className="flex gap-3"><div className="w-6 h-6 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-bold">2</div> <span>Tidak ada jawaban benar/salah. Jujurlah.</span></li><li className="flex gap-3"><div className="w-6 h-6 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-bold">3</div> <span>Data tersimpan otomatis (Auto-save).</span></li><li className="flex gap-3"><div className="w-6 h-6 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-bold">4</div> <span>Gunakan email yang sama untuk melanjutkan tes.</span></li></ul></div><div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full mix-blend-overlay filter blur-[50px] opacity-50"></div><div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-600 rounded-full mix-blend-overlay filter blur-[50px] opacity-30"></div></div>
        </div>
      </div>
    );
  }

  if (currentStep === 'quiz' && questions.length > 0) {
    const totalPages = Math.ceil(questions.length / ITEMS_PER_PAGE);
    const progress = ((currentPage + 1) / totalPages) * 100;
    const startIdx = currentPage * ITEMS_PER_PAGE;
    const currentQuestions = questions.slice(startIdx, startIdx + ITEMS_PER_PAGE);
    const isPartTwo = startIdx >= PART_1_LIMIT;
    const isPageComplete = currentQuestions.every((_, i) => userAnswers[startIdx + i] !== undefined);

    return (
      <div className="min-h-screen bg-slate-50 font-sans pb-32">
         <div className="bg-white sticky top-0 z-30 shadow-sm border-b border-slate-200">
            <div className="max-w-3xl mx-auto px-4 py-4">
               <div className="flex justify-between items-center mb-2">
                  <span className={`text-[10px] font-black tracking-widest uppercase px-2 py-1 rounded ${isPartTwo ? 'bg-pink-50 text-pink-600' : 'bg-indigo-50 text-indigo-600'}`}>{isPartTwo ? 'Bagian 2: Kepribadian' : 'Bagian 1: Minat Karir'}</span>
                  <span className="text-xs font-bold text-slate-400">Progress: {Math.round(progress)}%</span>
               </div>
               <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div className="bg-indigo-600 h-full transition-all duration-500" style={{width: `${progress}%`}}></div></div>
            </div>
         </div>
         <div className="max-w-3xl mx-auto px-4 mt-8 space-y-6">{currentQuestions.map((q, idx) => (<div key={q.id} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-200 transition-colors"><div className="flex items-start gap-4"><span className="text-slate-300 text-lg font-black mt-0.5">#{startIdx + idx + 1}</span><h3 className="text-lg font-bold text-slate-800 leading-snug flex-1">{q.text_main}</h3></div><div className="pl-0 md:pl-10">{renderQuestionCard(q, startIdx + idx, userAnswers[startIdx + idx])}</div></div>))}</div>
         <div className="fixed bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 z-40"><div className="max-w-3xl mx-auto flex justify-between items-center"><div className="hidden md:block text-xs text-slate-400 italic font-medium">Jawaban tersimpan otomatis.</div><button onClick={handleNextPage} disabled={!isPageComplete || isLoading} className={`ml-auto px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-1 flex items-center gap-2 ${!isPageComplete ? 'bg-slate-300 shadow-none cursor-not-allowed opacity-70' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{isLoading ? <Loader2 className="animate-spin"/> : (currentPage === totalPages - 1 ? 'Kumpulkan Jawaban' : 'Selanjutnya')} {!isLoading && <ChevronRight size={18}/>}</button></div></div>
      </div>
    );
  }

  // --- HALAMAN 3: RESULT (Update: Ada Tombol Email) ---
  if (currentStep === 'result') {
     const scores = calculateFinalScores();
     const riasecScores = { Realistic: scores.Realistic||0, Investigative: scores.Investigative||0, Artistic: scores.Artistic||0, Social: scores.Social||0, Enterprising: scores.Enterprising||0, Conventional: scores.Conventional||0 };
     const dominant = Object.keys(riasecScores).reduce((a, b) => riasecScores[a] > riasecScores[b] ? a : b);
     const content = riasecContent[dominant] || { title: dominant, description: "Belum ada deskripsi.", majors: "-", jobs: "-" };
     const personalityScores = Object.keys(scores).filter(k => k.includes('Kepribadian_')).reduce((obj, key) => { obj[key.replace('Kepribadian_', '')] = scores[key]; return obj; }, {});
     
     // Chart Data
     const riasecChartData = { labels: Object.keys(riasecScores), datasets: [{ label: 'Skor', data: Object.values(riasecScores), backgroundColor: 'rgba(99, 102, 241, 0.2)', borderColor: '#6366f1', borderWidth: 2, pointBackgroundColor: '#fff' }] };
     const personalityChartData = { labels: Object.keys(personalityScores), datasets: [{ label: 'Skor', data: Object.values(personalityScores), backgroundColor: 'rgba(236, 72, 153, 0.6)', borderColor: '#db2777', borderWidth: 0, borderRadius: 4 }] };

     return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans">
           <div className="max-w-5xl mx-auto space-y-6">
              <div className="bg-white rounded-3xl p-8 text-center shadow-lg border border-slate-100">
                 <h1 className="text-3xl font-extrabold text-slate-800">Hasil Analisis Potensi</h1>
                 <p className="text-slate-500 mt-2">Peserta: <strong className="text-indigo-600">{formData.name}</strong></p>
              </div>

              <div className="flex justify-center gap-2 p-1.5 bg-white rounded-xl shadow-sm border border-slate-200 w-fit mx-auto no-print">
                 <button onClick={()=>setResultTab('minat')} className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${resultTab==='minat' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><Layout size={16}/> Minat Karir</button>
                 <button onClick={()=>setResultTab('kepribadian')} className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${resultTab==='kepribadian' ? 'bg-pink-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><Activity size={16}/> Kepribadian</button>
              </div>

              {resultTab === 'minat' && (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
                       <h3 className="font-bold text-slate-700 mb-6">Peta Minat (RIASEC)</h3>
                       <div className="w-full max-w-xs"><Radar data={riasecChartData} options={{scales:{r:{ticks:{display:false}}}}}/></div>
                    </div>
                    <div className="space-y-4">
                       <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                          <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Dominasi</span>
                          <div className="text-3xl font-black text-indigo-900 mt-1 mb-3">{content.title}</div>
                          <p className="text-slate-700 text-sm leading-relaxed">{content.description}</p>
                       </div>
                       <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                          <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><GraduationCap size={18} className="text-pink-500"/> Rekomendasi Program Studi</h4>
                          <div className="flex flex-wrap gap-2">{content.majors ? content.majors.split(',').map((m,i)=>(<span key={i} className="px-3 py-1 bg-pink-50 text-pink-700 border border-pink-100 rounded-lg text-xs font-bold">{m.trim()}</span>)) : '-'}</div>
                       </div>
                       <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                          <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Briefcase size={18} className="text-blue-500"/> Rekomendasi Karir</h4>
                          <div className="flex flex-wrap gap-2">{content.jobs ? content.jobs.split(',').map((j,i)=>(<span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-bold">{j.trim()}</span>)) : '-'}</div>
                       </div>
                    </div>
                 </div>
              )}

              {resultTab === 'kepribadian' && (
                 <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-fade-in-up">
                    <h3 className="font-bold text-slate-700 mb-6 text-center">Profil Kepribadian (Big Five)</h3>
                    {Object.keys(personalityScores).length > 0 ? (<div className="h-80"><Bar data={personalityChartData} options={{responsive:true, maintainAspectRatio:false, indexAxis:'y'}} /></div>) : (<div className="text-center py-10 text-slate-400">Data kepribadian tidak tersedia.</div>)}
                 </div>
              )}

              {/* --- TOMBOL AKSI: PDF, EMAIL, KELUAR --- */}
              <div className="text-center pt-8 pb-20 flex flex-col md:flex-row justify-center gap-4 no-print">
                 <button onClick={() => window.print()} className="px-6 py-3 bg-white border-2 border-indigo-100 text-indigo-700 rounded-xl font-bold hover:bg-indigo-50 transition shadow-sm flex items-center justify-center gap-2">
                    <Download size={18}/> Simpan PDF
                 </button>

                 <button onClick={() => handleSendEmail(content)} disabled={isEmailSending} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-70">
                    {isEmailSending ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>}
                    {isEmailSending ? 'Mengirim...' : 'Kirim ke Email'}
                 </button>

                 <button onClick={()=>window.location.reload()} className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition shadow-lg flex items-center justify-center gap-2">
                    <RefreshCcw size={18}/> Selesai
                 </button>
              </div>
           </div>
        </div>
     );
  }
  return null;
}

export default App;