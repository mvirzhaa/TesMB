import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom';
import emailjs from '@emailjs/browser';
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
  const [resultTab, setResultTab] = useState('minat'); 
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [userAnswers, setUserAnswers] = useState({});
  const [resultId, setResultId] = useState(null);
  const [riasecContent, setRiasecContent] = useState({});
  
  // State untuk status email otomatis
  const [emailSent, setEmailSent] = useState(false);
  const emailSentRef = useRef(false); // Ref untuk mencegah double send di StrictMode

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

  // --- LOGIC AUTO SEND EMAIL ---
  useEffect(() => {
    // Jalankan hanya jika masuk step Result, belum dikirim, dan data konten sudah ada
    if (currentStep === 'result' && !emailSentRef.current && Object.keys(riasecContent).length > 0) {
        
        const scores = calculateFinalScores();
        const riasecScores = { Realistic: scores.Realistic||0, Investigative: scores.Investigative||0, Artistic: scores.Artistic||0, Social: scores.Social||0, Enterprising: scores.Enterprising||0, Conventional: scores.Conventional||0 };
        const dominant = Object.keys(riasecScores).reduce((a, b) => riasecScores[a] > riasecScores[b] ? a : b);
        const content = riasecContent[dominant];

        if (content) {
            sendEmailAuto(content);
            emailSentRef.current = true;
            setEmailSent(true);
        }
    }
  }, [currentStep, riasecContent]); // Trigger saat step berubah atau konten dimuat

  const sendEmailAuto = (content) => {
    const serviceID = 'service_skxbuqa'; // GANTI DENGAN ID ASLI ANDA
    const templateID = 'template_n8n5crj'; // GANTI DENGAN ID ASLI ANDA
    const publicKey = 'oTNzWCAMg-4sUC5OW'; // GANTI DENGAN KEY ASLI ANDA

    const templateParams = {
        to_name: formData.name,
        to_email: formData.email,
        dominant_type: content.title,
        description: content.description,
        majors: content.majors,
        jobs: content.jobs,
        my_website_link: window.location.origin
    };

    emailjs.send(serviceID, templateID, templateParams, publicKey)
      .then(() => {
         console.log('Email Auto-Send Success');
      }, (err) => {
         console.error('Email Auto-Send Failed:', err);
      });
  };

  const handleStart = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) return alert("Mohon lengkapi semua data diri.");
    setIsLoading(true);

    const { data: qData, error: qError } = await supabase.from('questions').select('*').order('id', { ascending: true });
    if (qError || !qData || qData.length === 0) {
        alert("Gagal memuat soal."); setIsLoading(false); return;
    }
    setQuestions(qData);
    const totalPages = Math.ceil(qData.length / ITEMS_PER_PAGE);

    const { data: lastResult } = await supabase.from('results').select('*').eq('email', formData.email).order('updated_at', { ascending: false }).limit(1).single();

    let resumeData = null;
    if (lastResult) {
        const isFinished = (lastResult.last_page || 0) >= (totalPages - 1);
        if (!isFinished) {
            if (window.confirm(`Hai ${lastResult.user_name}, ingin lanjut tes sebelumnya?`)) resumeData = lastResult;
        }
    }

    if (resumeData) {
        setResultId(resumeData.id);
        setFormData({ name: resumeData.user_name, email: resumeData.email, phone: resumeData.phone || '' });
        setUserAnswers(resumeData.raw_answers || {});
        setCurrentPage(resumeData.last_page || 0);
        setCurrentStep('quiz');
    } else {
        const { data: newResult } = await supabase.from('results').insert([{ 
            user_name: formData.name, email: formData.email, phone: formData.phone, scores: {}, last_page: 0, raw_answers: {} 
          }]).select().single();
        setResultId(newResult.id);
        setCurrentStep('quiz');
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

  const renderQuestionCard = (q, globalIndex, myAnswer) => {
     // ... (Kode renderQuestionCard SAMA PERSIS dengan sebelumnya, tidak diubah)
     // Agar tidak kepanjangan, pastikan Anda copy bagian ini dari kode sebelumnya
     const scaleOptions = [{v:1, i:<Frown/>, l:'Sangat Tidak', c:'text-rose-500 bg-rose-50 border-rose-200'}, {v:2, i:<Frown/>, l:'Tidak Suka', c:'text-orange-500 bg-orange-50 border-orange-200'}, {v:3, i:<Meh/>, l:'Netral', c:'text-amber-500 bg-amber-50 border-amber-200'}, {v:4, i:<Smile/>, l:'Suka', c:'text-emerald-500 bg-emerald-50 border-emerald-200'}, {v:5, i:<Smile/>, l:'Sangat Suka', c:'text-teal-600 bg-teal-50 border-teal-200'}];
     switch(q.type) {
        case 'scale': return (<div className="grid grid-cols-5 gap-2 mt-4">{scaleOptions.map(o => (<button key={o.v} onClick={()=>handleAnswer(globalIndex,o.v,q.category_main)} className={`flex flex-col items-center justify-center p-3 rounded-xl border ${myAnswer?.weight===o.v?`${o.c} border-2 shadow-md scale-105`:'border-slate-100 text-slate-300'}`}>{React.cloneElement(o.i,{size:24})}</button>))}</div>);
        case 'star': return (<div className="flex justify-center gap-3 py-6 bg-slate-50 rounded-xl mt-4">{[1,2,3,4,5].map(v=>(<button key={v} onClick={()=>handleAnswer(globalIndex,v,q.category_main)}><Star size={38} fill={myAnswer?.weight>=v?"currentColor":"none"} className={myAnswer?.weight>=v?"text-amber-400":"text-slate-200"}/></button>))}</div>);
        case 'boolean': return (<div className="flex gap-4 mt-4"><button onClick={()=>handleAnswer(globalIndex,1,q.category_main)} className={`flex-1 py-4 border-2 rounded-xl flex justify-center gap-2 ${myAnswer?.weight===1?'border-rose-500 bg-rose-50 text-rose-600':'border-slate-100 text-slate-400'}`}><ThumbsDown/> TIDAK</button><button onClick={()=>handleAnswer(globalIndex,5,q.category_main)} className={`flex-1 py-4 border-2 rounded-xl flex justify-center gap-2 ${myAnswer?.weight===5?'border-teal-500 bg-teal-50 text-teal-600':'border-slate-100 text-slate-400'}`}><ThumbsUp/> YA</button></div>);
        case 'choice': return (<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">{[{val:2,cat:q.category_main,txt:q.text_main,col:'indigo'},{val:2,cat:q.category_pair,txt:q.text_pair,col:'pink'}].map((o,i)=>(<button key={i} onClick={()=>handleAnswer(globalIndex,o.val,o.cat)} className={`p-5 border-2 rounded-xl text-left ${myAnswer?.category===o.cat?`border-${o.col}-500 bg-${o.col}-50`:'border-slate-100'}`}><span className="text-xs font-bold text-slate-400 block mb-1">Pilihan {i===0?'A':'B'}</span><span className="font-bold text-slate-700">{o.txt}</span></button>))}</div>);
        default: return null;
     }
  };

  if (currentStep === 'intro') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans relative">
        <Link to="/login" className="absolute top-6 right-6 z-20 px-4 py-2 bg-white/50 backdrop-blur rounded-full text-slate-500 hover:text-indigo-600 border border-slate-200 text-sm font-bold flex gap-2"><Lock size={16}/> Admin</Link>
        <div className="max-w-5xl w-full bg-white rounded-[2rem] shadow-xl overflow-hidden flex flex-col md:flex-row border border-slate-100 relative z-10">
           <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
              <div className="mb-8"><div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider mb-4"><Sparkles size={14}/> Psikometri Online</div><h1 className="text-4xl font-extrabold text-slate-800 mb-2">Tes Minat & Bakat</h1><p className="text-slate-500">Temukan potensi terbaikmu.</p></div>
              <form onSubmit={handleStart} className="space-y-4">
                 <input className="w-full pl-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Nama Lengkap" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/>
                 <input className="w-full pl-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Email" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})}/>
                 <input className="w-full pl-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl" placeholder="No WhatsApp" value={formData.phone} onChange={e=>setFormData({...formData, phone:e.target.value})}/>
                 <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg flex justify-center items-center gap-2 mt-2">{isLoading ? <Loader2 className="animate-spin"/> : <>Mulai Tes <ArrowRight size={18}/></>}</button>
              </form>
           </div>
           <div className="flex-1 bg-indigo-900 text-white p-8 md:p-12 flex flex-col justify-center relative overflow-hidden"><h3 className="text-xl font-bold mb-6 flex items-center gap-2"><AlertTriangle className="text-yellow-400"/> Petunjuk</h3><ul className="space-y-4 text-sm text-indigo-100"><li>• 138 Soal.</li><li>• Jawab Jujur.</li><li>• Auto-save.</li></ul><div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full mix-blend-overlay filter blur-[50px] opacity-50"></div></div>
        </div>
      </div>
    );
  }

  if (currentStep === 'quiz' && questions.length > 0) {
    const totalPages = Math.ceil(questions.length / ITEMS_PER_PAGE);
    const progress = ((currentPage + 1) / totalPages) * 100;
    const startIdx = currentPage * ITEMS_PER_PAGE;
    const currentQuestions = questions.slice(startIdx, startIdx + ITEMS_PER_PAGE);
    const isPageComplete = currentQuestions.every((_, i) => userAnswers[startIdx + i] !== undefined);

    return (
      <div className="min-h-screen bg-slate-50 font-sans pb-32">
         <div className="bg-white sticky top-0 z-30 shadow-sm border-b border-slate-200 px-4 py-4"><div className="max-w-3xl mx-auto"><div className="flex justify-between mb-2"><span className="text-xs font-bold text-slate-400">Halaman {currentPage+1}/{totalPages}</span><span className="text-xs font-bold text-indigo-600">{Math.round(progress)}%</span></div><div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div className="bg-indigo-600 h-full transition-all" style={{width:`${progress}%`}}></div></div></div></div>
         <div className="max-w-3xl mx-auto px-4 mt-8 space-y-6">{currentQuestions.map((q, idx) => (<div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"><h3 className="font-bold text-slate-800 mb-4">{startIdx+idx+1}. {q.text_main}</h3>{renderQuestionCard(q, startIdx+idx, userAnswers[startIdx+idx])}</div>))}</div>
         <div className="fixed bottom-0 w-full bg-white/90 backdrop-blur border-t p-4 z-40"><div className="max-w-3xl mx-auto flex justify-end"><button onClick={handleNextPage} disabled={!isPageComplete||isLoading} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold disabled:bg-slate-300">{isLoading?<Loader2 className="animate-spin"/>:'Lanjut'}</button></div></div>
      </div>
    );
  }

  if (currentStep === 'result') {
     const scores = calculateFinalScores();
     const riasecScores = { Realistic: scores.Realistic||0, Investigative: scores.Investigative||0, Artistic: scores.Artistic||0, Social: scores.Social||0, Enterprising: scores.Enterprising||0, Conventional: scores.Conventional||0 };
     const dominant = Object.keys(riasecScores).reduce((a, b) => riasecScores[a] > riasecScores[b] ? a : b);
     const content = riasecContent[dominant] || { title: dominant, description: "Belum ada deskripsi.", majors: "-", jobs: "-" };
     const personalityScores = Object.keys(scores).filter(k => k.includes('Kepribadian_')).reduce((obj, key) => { obj[key.replace('Kepribadian_', '')] = scores[key]; return obj; }, {});
     const riasecChartData = { labels: Object.keys(riasecScores), datasets: [{ label: 'Skor', data: Object.values(riasecScores), backgroundColor: 'rgba(99, 102, 241, 0.2)', borderColor: '#6366f1', borderWidth: 2 }] };
     const personalityChartData = { labels: Object.keys(personalityScores), datasets: [{ label: 'Skor', data: Object.values(personalityScores), backgroundColor: 'rgba(236, 72, 153, 0.6)', borderColor: '#db2777', borderWidth: 0 }] };

     return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans">
           <div className="max-w-5xl mx-auto space-y-6">
              <div className="bg-white rounded-3xl p-8 text-center shadow-lg border-t-8 border-indigo-600">
                 <h1 className="text-3xl font-extrabold text-slate-800">Hasil Analisis</h1>
                 <p className="text-slate-500 mt-2">Peserta: <strong className="text-indigo-600">{formData.name}</strong></p>
                 {emailSent && <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-200"><CheckCircle size={14}/> Laporan telah dikirim ke {formData.email}</div>}
              </div>

              <div className="flex justify-center gap-2 bg-white p-1.5 rounded-xl shadow-sm w-fit mx-auto no-print">
                 <button onClick={()=>setResultTab('minat')} className={`px-6 py-2 rounded-lg font-bold text-sm ${resultTab==='minat'?'bg-indigo-600 text-white':'text-slate-500'}`}>Minat</button>
                 <button onClick={()=>setResultTab('kepribadian')} className={`px-6 py-2 rounded-lg font-bold text-sm ${resultTab==='kepribadian'?'bg-pink-600 text-white':'text-slate-500'}`}>Kepribadian</button>
              </div>

              {resultTab === 'minat' && (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-8 rounded-3xl shadow-sm flex flex-col items-center"><h3 className="font-bold mb-6">Peta Minat</h3><div className="w-full max-w-xs"><Radar data={riasecChartData}/></div></div>
                    <div className="space-y-4">
                       <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100"><span className="text-xs font-bold text-indigo-500 uppercase">Dominasi</span><div className="text-3xl font-black text-indigo-900 mt-1 mb-3">{content.title}</div><p className="text-sm text-slate-700">{content.description}</p></div>
                       <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"><h4 className="font-bold text-slate-800 mb-3 flex gap-2"><GraduationCap className="text-pink-500"/> Jurusan</h4><div className="flex flex-wrap gap-2">{content.majors?.split(',').map((m,i)=><span key={i} className="px-3 py-1 bg-pink-50 text-pink-700 rounded-lg text-xs font-bold border border-pink-100">{m.trim()}</span>)}</div></div>
                       <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"><h4 className="font-bold text-slate-800 mb-3 flex gap-2"><Briefcase className="text-blue-500"/> Karir</h4><div className="flex flex-wrap gap-2">{content.jobs?.split(',').map((j,i)=><span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">{j.trim()}</span>)}</div></div>
                    </div>
                 </div>
              )}

              {resultTab === 'kepribadian' && (
                 <div className="bg-white p-8 rounded-3xl shadow-sm"><h3 className="font-bold text-center mb-6">Kepribadian (Big Five)</h3><div className="h-80"><Bar data={personalityChartData} options={{indexAxis:'y'}}/></div></div>
              )}

              <div className="text-center pt-8 pb-20 flex justify-center gap-4 no-print">
                 <button onClick={()=>window.print()} className="px-6 py-3 bg-white border-2 border-indigo-100 text-indigo-700 rounded-xl font-bold hover:bg-indigo-50 flex items-center gap-2"><Download size={18}/> Simpan PDF</button>
                 <button onClick={()=>window.location.reload()} className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 flex items-center gap-2"><RefreshCcw size={18}/> Selesai</button>
              </div>
           </div>
        </div>
     );
  }
  return null;
}

export default App;