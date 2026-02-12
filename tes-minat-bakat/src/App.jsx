import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import LandingPage from './LandingPage';
import {
  Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ArcElement
} from 'chart.js';
import { Radar, Bar, Doughnut } from 'react-chartjs-2';
import { 
  Smile, Meh, Frown, CheckCircle, ArrowRight, RefreshCcw, 
  Loader2, User, Star, ChevronRight, Briefcase, 
  ThumbsUp, ThumbsDown, Lock, Mail, Phone, AlertTriangle, Layout, Activity, Sparkles, BrainCircuit, GraduationCap, Download, Send, EyeOff, ShieldAlert, XCircle, Info, BookOpen, Check, Zap, TrendingUp, KeyRound
} from 'lucide-react';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ArcElement);

const ITEMS_PER_PAGE = 10;

// --- CONFIG EMAILJS ---
const EMAILJS_SERVICE_ID = 'service_skxbuqa'; 
const EMAILJS_TEMPLATE_RESULT = 'template_n8n5crj'; 
const EMAILJS_TEMPLATE_TOKEN = 'template_hn17jvm'; // <--- GANTI DENGAN ID TEMPLATE TOKEN BARU ANDA
const EMAILJS_PUBLIC_KEY = 'oTNzWCAMg-4sUC5OW';

// --- DATA LOGIKA DISABILITAS ---
const DISABILITY_RULES = {
  'Normal': { restricted: [], reason: "" },
  'Buta Warna': { restricted: ['Elektro', 'Kimia', 'Kedokteran', 'Farmasi', 'Desain', 'Seni Rupa', 'Biologi', 'Arsitektur', 'Geologi', 'DKV', 'Teknik Fisika'], reason: "Program studi ini sangat bergantung pada identifikasi warna akurat." },
  'Tuna Daksa (Kaki)': { restricted: ['Olahraga', 'Sipil', 'Mesin', 'Pertambangan', 'Geologi', 'Kehutanan', 'Kelautan', 'Oseanografi'], reason: "Program studi ini mewajibkan mobilitas fisik tinggi di lapangan." },
  'Tuna Rungu': { restricted: ['Musik', 'Psikologi', 'Komunikasi', 'Hubungan Internasional', 'Broadcasting', 'Seni Suara'], reason: "Program studi ini sangat menitikberatkan pada kepekaan auditif." },
  'Tuna Netra (Low Vision)': { restricted: ['Desain', 'Arsitektur', 'Teknik', 'Kedokteran', 'DKV', 'Seni Rupa', 'Pilot', 'Astronomi'], reason: "Program studi ini membutuhkan ketajaman visual tinggi." }
};

// --- DATA DESKRIPSI VARK ---
const VARK_DESCRIPTIONS = {
  'Visual': 'Anda belajar paling baik dengan melihat. Grafik, diagram, peta, dan simbol adalah sahabat Anda.',
  'Aural': 'Anda belajar paling baik dengan mendengar. Diskusi, kuliah, dan berbicara dengan orang lain membantu Anda.',
  'Read/Write': 'Anda belajar paling baik dengan membaca dan menulis. Daftar, catatan, dan buku teks adalah cara favorit Anda.',
  'Kinesthetic': 'Anda belajar paling baik dengan melakukan (praktek). Pengalaman langsung dan simulasi lebih mudah Anda pahami.',
  'Multimodal': 'Anda memiliki gaya belajar gabungan. Anda fleksibel dan bisa beradaptasi dengan berbagai cara belajar.'
};

const GAP_ANALYSIS = {
  'Realistic': [
    { trait: 'Conscientiousness', threshold: 14, msg: "Pekerjaan teknis butuh ketelitian tinggi. Latih disiplin diri dan biasakan *double-check* pekerjaan agar tidak terjadi kecelakaan kerja atau error teknis." },
    { trait: 'Agreeableness', threshold: 12, msg: "Meski bekerja dengan mesin/alat, koordinasi tim di lapangan tetap butuh kesabaran. Belajarlah mendengar masukan rekan kerja tanpa defensif." }
  ],
  'Investigative': [
    { trait: 'Openness', threshold: 14, msg: "Sebagai periset, pikiran tertutup adalah musuh. Anda perlu lebih berani mencoba metode baru yang tidak konvensional, jangan hanya terpaku pada teori lama." },
    { trait: 'Extraversion', threshold: 10, msg: "Penelitian seringkali butuh kolaborasi. Jangan terlalu mengisolasi diri di lab; latih kemampuan komunikasi agar hasil riset Anda bisa dipahami orang awam." }
  ],
  'Artistic': [
    { trait: 'Conscientiousness', threshold: 13, msg: "Kreativitas Anda tinggi, tapi sering sulit *finishing*. Latih manajemen waktu dan buat deadline pribadi agar karya Anda tidak hanya jadi konsep, tapi selesai." },
    { trait: 'Neuroticism', threshold: 14, msg: "Pekerja seni cenderung sensitif (Moody). Pelajari teknik manajemen stres agar produktivitas Anda tidak tergantung pada suasana hati (mood)." }
  ],
  'Social': [
    { trait: 'Neuroticism', threshold: 14, msg: "Bekerja dengan orang lain sangat menguras emosi (Burnout). Anda perlu belajar menetapkan batasan (boundaries) agar tidak terlalu terbawa perasaan masalah orang lain." },
    { trait: 'Conscientiousness', threshold: 12, msg: "Niat membantu saja tidak cukup, butuh administrasi yang rapi (misal: data pasien/siswa). Tingkatkan kemampuan organisasi dokumen Anda." }
  ],
  'Enterprising': [
    { trait: 'Agreeableness', threshold: 12, msg: "Ambisi Anda kuat, tapi hati-hati terlihat arogan. Latih empati agar tim mengikuti Anda karena hormat, bukan karena takut." },
    { trait: 'Conscientiousness', threshold: 13, msg: "Anda jago menjual ide besar, tapi lemah di detail eksekusi. Pastikan Anda teliti pada data keuangan dan kontrak bisnis." }
  ],
  'Conventional': [
    { trait: 'Openness', threshold: 13, msg: "Dunia administrasi berubah ke arah digital/AI. Jangan takut mencoba software atau teknologi baru agar tidak tertinggal zaman." },
    { trait: 'Extraversion', threshold: 10, msg: "Meski di belakang meja, Anda tetap perlu melapor ke atasan. Latih *public speaking* agar laporan Anda terlihat meyakinkan." }
  ]
};

function App() {
  const [currentStep, setCurrentStep] = useState('landing');
  
  const [questions, setQuestions] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const emailSentRef = useRef(false);

  const [resultTab, setResultTab] = useState('minat'); 
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', disability: 'Normal' });
  const [userAnswers, setUserAnswers] = useState({});
  const [resultId, setResultId] = useState(null);
  const [riasecContent, setRiasecContent] = useState({});
  
  // --- STATE TOKEN BARU ---
  const [generatedToken, setGeneratedToken] = useState('');
  const [inputToken, setInputToken] = useState('');
  const [tokenSent, setTokenSent] = useState(false);
  const [isSendingToken, setIsSendingToken] = useState(false);

  // Rating State
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [currentPage, currentStep]);

  useEffect(() => {
    const fetchContent = async () => {
      const { data } = await supabase.from('riasec_content').select('*');
      if (data) {
        const map = {};
        data.forEach(item => map[item.category] = item);
        setRiasecContent(map);
      }
    };
    fetchContent();
  }, []);

  const calculateFinalScores = () => {
    const scores = {}; 
    ['Realistic','Investigative','Artistic','Social','Enterprising','Conventional'].forEach(k => scores[k] = 0);
    ['Visual', 'Aural', 'Read/Write', 'Kinesthetic'].forEach(k => scores[k] = 0);
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

  const processMajors = (majorsString, disabilityType) => {
      if (!majorsString) return { allowed: [], restricted: [], reason: "" };
      const rule = DISABILITY_RULES[disabilityType] || { restricted: [] };
      const restrictedKeywords = rule.restricted;
      const allMajors = majorsString.split(',').map(m => m.trim());
      const allowed = [];
      const restricted = [];
      allMajors.forEach(major => {
          const isRestricted = restrictedKeywords.some(keyword => major.toLowerCase().includes(keyword.toLowerCase()));
          if (isRestricted) restricted.push(major); else allowed.push(major);
      });
      return { allowed, restricted, reason: rule.reason };
  };

  useEffect(() => {
    if (currentStep === 'result' && !emailSentRef.current && Object.keys(riasecContent).length > 0) {
        const scores = calculateFinalScores();
        const riasecScores = { Realistic: scores.Realistic||0, Investigative: scores.Investigative||0, Artistic: scores.Artistic||0, Social: scores.Social||0, Enterprising: scores.Enterprising||0, Conventional: scores.Conventional||0 };
        const dominant = Object.keys(riasecScores).reduce((a, b) => riasecScores[a] > riasecScores[b] ? a : b);
        const content = riasecContent[dominant];
        const personalityScores = Object.keys(scores).filter(k => k.includes('Kepribadian_')).reduce((obj, key) => { obj[key.replace('Kepribadian_', '')] = scores[key]; return obj; }, {});
        const varkScores = { Visual: scores.Visual||0, Aural: scores.Aural||0, 'Read/Write': scores['Read/Write']||0, Kinesthetic: scores.Kinesthetic||0 };
        const maxVark = Math.max(...Object.values(varkScores));
        const topVarks = Object.keys(varkScores).filter(k => varkScores[k] === maxVark);
        const varkType = topVarks.length > 1 ? 'Multimodal' : topVarks[0];

        if (content) {
            sendEmailAuto(content, varkType, personalityScores, varkScores);
            emailSentRef.current = true;
            setEmailSent(true);
        }
    }
  }, [currentStep, riasecContent]);

  const sendEmailAuto = (content, varkType, personalityScores, varkScores) => {
    const { allowed, restricted, reason } = processMajors(content.majors, formData.disability);
    const majorsText = allowed.join(', ');
    const restrictedText = restricted.length > 0 ? `\n\n[CATATAN MEDIS]: Tidak disarankan: ${restricted.join(', ')}.\nALASAN: ${reason}` : '';
    const varkDesc = VARK_DESCRIPTIONS[varkType];
    const varkDetails = Object.entries(varkScores).map(([key, val]) => `• ${key}: ${val} poin`).join('\n');
    const varkEmailText = `Tipe Dominan: ${varkType}\n\n${varkDesc}\n\nRincian Skor:\n${varkDetails}`;
    const personalityEmailText = Object.entries(personalityScores).map(([trait, score]) => `• ${trait}: ${score}/20`).join('\n');

    const templateParams = {
        to_name: formData.name,
        to_email: formData.email,
        dominant_type: content.title,
        description: content.description,
        majors: majorsText + restrictedText, 
        jobs: content.jobs,
        disability_note: restrictedText ? restrictedText : '', 
        personality_result: personalityEmailText,
        vark_result: varkEmailText,
        my_website_link: window.location.origin,
    };

    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_RESULT, templateParams, EMAILJS_PUBLIC_KEY)
      .then(() => console.log('Email Sent'), (err) => console.error('Email Failed', err));
  };

  const submitRating = async () => {
    if (rating === 0) return alert("Silakan pilih bintang terlebih dahulu.");
    const { error } = await supabase.from('results').update({ accuracy_rating: rating, user_feedback: feedback }).eq('id', resultId);
    if (!error) { setRatingSubmitted(true); alert("Terima kasih atas masukan Anda!"); }
  };

  // --- LOGIC TOKEN: KIRIM TOKEN ---
  const handleSendToken = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return alert("Nama dan Email wajib diisi untuk menerima token.");
    
    setIsSendingToken(true);
    
    // 1. Generate Token (6 Angka)
    const newToken = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedToken(newToken);

    // 2. Kirim Email Token
    const templateParams = {
        to_name: formData.name,
        to_email: formData.email,
        token: newToken
    };

    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_TOKEN, templateParams, EMAILJS_PUBLIC_KEY);
        setTokenSent(true);
        alert(`Kode Token telah dikirim ke ${formData.email}. Silakan cek Inbox/Spam.`);
    } catch (error) {
        console.error("Gagal kirim token:", error);
        alert("Gagal mengirim token. Pastikan email benar atau koneksi stabil.");
    }
    
    setIsSendingToken(false);
  };

  // --- LOGIC TOKEN: VERIFIKASI ---
  const handleVerifyAndStart = async () => {
    if (inputToken !== generatedToken) {
        alert("Token Salah! Silakan cek email Anda lagi.");
        return;
    }
    // Jika benar, jalankan logika start yang asli
    await handleStartLogic();
  };

  const handleStartLogic = async () => {
    setIsLoading(true);

    const { data: qData, error: qError } = await supabase.from('questions').select('*').order('id', { ascending: true });
    if (qError || !qData) { alert("Gagal memuat soal."); setIsLoading(false); return; }
    
    setQuestions(qData);
    
    const { data: lastResult } = await supabase.from('results').select('*').eq('email', formData.email).order('updated_at', { ascending: false }).limit(1).single();
    let resumeData = null;
    if (lastResult) {
        const totalPages = Math.ceil(qData.length / ITEMS_PER_PAGE);
        if ((lastResult.last_page || 0) < (totalPages - 1)) {
            if (window.confirm(`Hai ${lastResult.user_name}, ingin lanjut tes sebelumnya?`)) resumeData = lastResult;
        }
    }

    if (resumeData) {
        setResultId(resumeData.id);
        setFormData({ name: resumeData.user_name, email: resumeData.email, phone: resumeData.phone || '', disability: resumeData.disability || 'Normal' }); 
        setUserAnswers(resumeData.raw_answers || {});
        setCurrentPage(resumeData.last_page || 0);
        setCurrentStep('quiz');
    } else {
        const { data: newResult } = await supabase.from('results').insert([{ 
            user_name: formData.name, email: formData.email, phone: formData.phone, disability: formData.disability, scores: {}, last_page: 0, raw_answers: {} 
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
    } else {
       setCurrentStep('result');
    }
    await saveProgress(nextPage); 
    setIsLoading(false);
  };

  const renderQuestionCard = (q, globalIndex, myAnswer) => {
     const scaleOptions = [{v:1, i:<Frown/>, l:'Sangat Tidak', c:'text-rose-500 bg-rose-50 border-rose-200'}, {v:2, i:<Frown/>, l:'Tidak Suka', c:'text-orange-500 bg-orange-50 border-orange-200'}, {v:3, i:<Meh/>, l:'Netral', c:'text-amber-500 bg-amber-50 border-amber-200'}, {v:4, i:<Smile/>, l:'Suka', c:'text-emerald-500 bg-emerald-50 border-emerald-200'}, {v:5, i:<Smile/>, l:'Sangat Suka', c:'text-teal-600 bg-teal-50 border-teal-200'}];
     switch(q.type) {
        case 'scale': return (<div className="grid grid-cols-5 gap-2 mt-4">{scaleOptions.map(o => (<button key={o.v} onClick={()=>handleAnswer(globalIndex,o.v,q.category_main)} className={`flex flex-col items-center justify-center p-3 rounded-xl border ${myAnswer?.weight===o.v?`${o.c} border-2 shadow-md scale-105`:'border-slate-100 text-slate-300'}`}>{React.cloneElement(o.i,{size:24})}</button>))}</div>);
        case 'star': return (<div className="flex justify-center gap-3 py-6 bg-slate-50 rounded-xl mt-4">{[1,2,3,4,5].map(v=>(<button key={v} onClick={()=>handleAnswer(globalIndex,v,q.category_main)}><Star size={38} fill={myAnswer?.weight>=v?"currentColor":"none"} className={myAnswer?.weight>=v?"text-amber-400":"text-slate-200"}/></button>))}</div>);
        case 'boolean': return (<div className="flex gap-4 mt-4"><button onClick={()=>handleAnswer(globalIndex,1,q.category_main)} className={`flex-1 py-4 border-2 rounded-xl flex justify-center gap-2 ${myAnswer?.weight===1?'border-rose-500 bg-rose-50 text-rose-600':'border-slate-100 text-slate-400'}`}><ThumbsDown/> TIDAK</button><button onClick={()=>handleAnswer(globalIndex,5,q.category_main)} className={`flex-1 py-4 border-2 rounded-xl flex justify-center gap-2 ${myAnswer?.weight===5?'border-teal-500 bg-teal-50 text-teal-600':'border-slate-100 text-slate-400'}`}><ThumbsUp/> YA</button></div>);
        case 'choice': return (<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">{[{val:2,cat:q.category_main,txt:q.text_main,col:'indigo'},{val:2,cat:q.category_pair,txt:q.text_pair,col:'pink'}].map((o,i)=>(<button key={i} onClick={()=>handleAnswer(globalIndex,o.val,o.cat)} className={`p-5 border-2 rounded-xl text-left ${myAnswer?.category===o.cat?`border-${o.col}-500 bg-${o.col}-50`:'border-slate-100'}`}><span className="text-xs font-bold text-slate-400 block mb-1">Pilihan {i===0?'A':'B'}</span><span className="font-bold text-slate-700">{o.txt}</span></button>))}</div>);
        case 'vark': 
            if (!q.options) return null;
            return (
                <div className="space-y-3 mt-4">
                    {q.options.map((opt, i) => {
                        const isActive = myAnswer?.category === opt.value;
                        return (
                            <button key={i} onClick={() => handleAnswer(globalIndex, 1, opt.value)} className={`w-full p-4 rounded-xl border-2 text-left transition-all relative flex items-center gap-3 ${isActive ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-200 shadow-sm' : 'border-slate-100 hover:bg-slate-50 hover:border-slate-200'}`}>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isActive ? 'border-purple-500 bg-purple-500 text-white' : 'border-slate-300 text-transparent'}`}><Check size={14} strokeWidth={4}/></div>
                                <span className={`text-sm font-medium ${isActive ? 'text-purple-900' : 'text-slate-600'}`}>{opt.text}</span>
                            </button>
                        )
                    })}
                </div>
            );
        default: return null;
     }
  };

  if (currentStep === 'landing') {
    return <LandingPage onStart={() => setCurrentStep('intro')} />;
  }

  if (currentStep === 'intro') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans relative">
        <button onClick={() => setCurrentStep('landing')} className="absolute top-6 left-6 text-slate-400 hover:text-indigo-600 z-20"><ArrowRight className="rotate-180" size={24}/></button>
        <div className="max-w-5xl w-full bg-white rounded-[2rem] shadow-xl overflow-hidden flex flex-col md:flex-row border border-slate-100 relative z-10">
           <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
              <div className="mb-8"><div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider mb-4"><Sparkles size={14}/> Verifikasi Peserta</div><h1 className="text-4xl font-extrabold text-slate-800 mb-2">Identitas & Token</h1><p className="text-slate-500">Kami perlu memverifikasi email Anda sebelum memulai tes.</p></div>
              
              <div className="space-y-4">
                 {/* FORM IDENTITAS */}
                 <input className="w-full pl-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Nama Lengkap" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} disabled={tokenSent} />
                 <input className="w-full pl-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Email Aktif" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})} disabled={tokenSent} />
                 <input className="w-full pl-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl" placeholder="No WhatsApp" value={formData.phone} onChange={e=>setFormData({...formData, phone:e.target.value})} disabled={tokenSent} />
                 <div className="relative group">
                    <div className="absolute left-4 top-3.5 text-slate-400"><EyeOff size={18}/></div>
                    <select className="w-full pl-11 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700 appearance-none cursor-pointer" value={formData.disability} onChange={e => setFormData({...formData, disability: e.target.value})} disabled={tokenSent}>
                        {Object.keys(DISABILITY_RULES).map(k => (<option key={k} value={k}>{k === 'Normal' ? 'Tidak Ada Disabilitas / Normal' : k}</option>))}
                    </select>
                 </div>

                 {/* LOGIKA TOMBOL TOKEN / VERIFIKASI */}
                 {!tokenSent ? (
                    <button onClick={handleSendToken} disabled={isSendingToken} className="w-full py-4 bg-slate-800 text-white font-bold rounded-xl shadow-lg flex justify-center items-center gap-2 hover:bg-slate-900 transition">
                       {isSendingToken ? <Loader2 className="animate-spin"/> : <>Kirim Kode Token <KeyRound size={18}/></>}
                    </button>
                 ) : (
                    <div className="animate-fade-in-up space-y-4 pt-4 border-t border-slate-100">
                        <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm flex items-center gap-2 border border-green-100">
                            <CheckCircle size={16}/> Token dikirim ke {formData.email}
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Masukkan Token</label>
                            <input 
                                className="w-full p-4 text-center text-2xl tracking-[0.5em] font-bold bg-white border-2 border-indigo-100 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-indigo-600" 
                                placeholder="000000" 
                                maxLength={6}
                                value={inputToken}
                                onChange={(e) => setInputToken(e.target.value)}
                            />
                        </div>
                        <button onClick={handleVerifyAndStart} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg flex justify-center items-center gap-2 hover:bg-indigo-700 transition">
                           {isLoading ? <Loader2 className="animate-spin"/> : <>Verifikasi & Mulai <ArrowRight size={18}/></>}
                        </button>
                        <button onClick={() => setTokenSent(false)} className="w-full text-xs text-slate-400 hover:text-indigo-600 font-bold underline">Salah email? Kirim ulang.</button>
                    </div>
                 )}
              </div>
           </div>
           <div className="flex-1 bg-indigo-900 text-white p-8 md:p-12 flex flex-col justify-center relative overflow-hidden"><h3 className="text-xl font-bold mb-6 flex items-center gap-2"><AlertTriangle className="text-yellow-400"/> Petunjuk</h3><ul className="space-y-4 text-sm text-indigo-100"><li>• Pastikan Email Aktif untuk Token.</li><li>• Jawab Jujur 138 Soal.</li><li>• Kondisi fisik berpengaruh pada rekomendasi jurusan.</li></ul><div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full mix-blend-overlay filter blur-[50px] opacity-50"></div></div>
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
    const currentType = currentQuestions[0]?.category_main === 'VARK' ? 'Gaya Belajar (VARK)' : (currentQuestions[0]?.category_main?.includes('Kepribadian') ? 'Kepribadian (Big Five)' : 'Minat Karir (RIASEC)');

    return (
      <div className="min-h-screen bg-slate-50 font-sans pb-32">
         <div className="bg-white sticky top-0 z-30 shadow-sm border-b border-slate-200 px-4 py-4"><div className="max-w-3xl mx-auto"><div className="flex justify-between mb-2"><span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded text-slate-500 uppercase">{currentType}</span><span className="text-xs font-bold text-indigo-600">{Math.round(progress)}%</span></div><div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div className="bg-indigo-600 h-full transition-all" style={{width:`${progress}%`}}></div></div></div></div>
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
     const varkScores = { Visual: scores.Visual||0, Aural: scores.Aural||0, 'Read/Write': scores['Read/Write']||0, Kinesthetic: scores.Kinesthetic||0 };
     const maxVark = Math.max(...Object.values(varkScores));
     const topVarks = Object.keys(varkScores).filter(k => varkScores[k] === maxVark);
     const varkType = topVarks.length > 1 ? 'Multimodal' : topVarks[0];
     const varkDesc = VARK_DESCRIPTIONS[varkType];
     const varkChartData = { labels: Object.keys(varkScores), datasets: [{ label: 'Skor', data: Object.values(varkScores), backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'], borderWidth: 0 }] };
     const { allowed, restricted, reason } = processMajors(content.majors, formData.disability);

     const myAdvice = GAP_ANALYSIS[dominant]?.filter(rule => {
        const score = scores['Kepribadian_' + rule.trait] || 0;
        return score < rule.threshold; 
     }) || [];

     return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans">
           <div className="max-w-5xl mx-auto space-y-6">
              <div className="bg-white rounded-3xl p-8 text-center shadow-lg border-t-8 border-indigo-600">
                 <h1 className="text-3xl font-extrabold text-slate-800">Hasil Analisis Potensi</h1>
                 <p className="text-slate-500 mt-2">Peserta: <strong className="text-indigo-600">{formData.name}</strong></p>
                 <div className="mt-2 text-xs font-bold px-3 py-1 bg-slate-100 rounded-full inline-block text-slate-500">Kondisi: {formData.disability}</div>
                 {emailSent && <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-200"><CheckCircle size={14}/> Laporan dikirim ke {formData.email}</div>}
              </div>
              <div className="flex flex-wrap justify-center gap-2 bg-white p-1.5 rounded-xl shadow-sm w-fit mx-auto no-print">
                 <button onClick={()=>setResultTab('minat')} className={`px-6 py-2 rounded-lg font-bold text-sm ${resultTab==='minat'?'bg-indigo-600 text-white':'text-slate-500'}`}>Minat Karir</button>
                 <button onClick={()=>setResultTab('kepribadian')} className={`px-6 py-2 rounded-lg font-bold text-sm ${resultTab==='kepribadian'?'bg-pink-600 text-white':'text-slate-500'}`}>Kepribadian</button>
                 <button onClick={()=>setResultTab('vark')} className={`px-6 py-2 rounded-lg font-bold text-sm ${resultTab==='vark'?'bg-purple-600 text-white':'text-slate-500'}`}>Gaya Belajar</button>
              </div>
              {resultTab === 'minat' && (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
                    <div className="bg-white p-8 rounded-3xl shadow-sm flex flex-col items-center"><h3 className="font-bold mb-6">Peta Minat</h3><div className="w-full max-w-xs"><Radar data={riasecChartData}/></div></div>
                    <div className="space-y-4">
                       <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100"><div className="flex items-center gap-2 mb-2"><Sparkles size={18} className="text-indigo-600"/><span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Tipe Dominan</span></div><div className="text-3xl font-black text-indigo-900 mt-1 mb-3">{content.title}</div><p className="text-sm text-slate-700 leading-relaxed mb-4">{content.description}</p><div className="text-xs font-bold text-indigo-600 bg-white p-3 rounded-xl border border-indigo-100">💡 Analisis Singkat: Anda memiliki kecenderungan kuat dalam bidang {content.title?.split(' ')[2]}. Lingkungan kerja yang {dominant === 'Realistic' ? 'praktis' : dominant === 'Social' ? 'mendukung' : 'terstruktur'} akan membuat Anda berkembang pesat.</div></div>
                       {myAdvice.length > 0 && (
                          <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                             <div className="flex items-center gap-2 mb-3"><Zap className="text-amber-500" size={20}/><h4 className="font-bold text-amber-800">Rekomendasi Pengembangan Diri</h4></div>
                             <p className="text-xs text-amber-700 mb-3">Berdasarkan profil kepribadian Anda, berikut adalah area yang perlu dilatih agar sukses di karir {dominant}:</p>
                             <ul className="space-y-3">{myAdvice.map((adv, i) => (<li key={i} className="flex gap-3 bg-white p-3 rounded-xl border border-amber-100"><TrendingUp className="text-amber-400 shrink-0" size={18}/><span className="text-sm text-slate-600 font-medium">{adv.msg}</span></li>))}</ul>
                          </div>
                       )}
                       <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"><h4 className="font-bold text-slate-800 mb-4 flex gap-2"><GraduationCap className="text-pink-500"/> Program Studi</h4><div className="mb-4"><div className="text-xs font-bold text-green-600 mb-2 flex items-center gap-1"><CheckCircle size={12}/> Sangat Direkomendasikan</div><div className="flex flex-wrap gap-2">{allowed.length > 0 ? allowed.map((m,i)=>(<span key={i} className="px-3 py-1 bg-green-50 text-green-700 border border-green-100 rounded-lg text-xs font-bold">{m}</span>)) : <span className="text-xs text-slate-400">Tidak ada data.</span>}</div></div>{restricted.length > 0 && (<div className="pt-4 border-t border-slate-100"><div className="text-xs font-bold text-red-500 mb-2 flex items-center gap-1"><XCircle size={12}/> Tidak Disarankan (Kondisi: {formData.disability})</div><div className="flex flex-wrap gap-2 mb-3">{restricted.map((m,i)=>(<span key={i} className="px-3 py-1 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg text-xs font-bold line-through opacity-70">{m}</span>))}</div><div className="p-3 bg-red-50 rounded-xl border border-red-100 text-xs text-red-700 leading-relaxed flex gap-2"><Info size={16} className="shrink-0 mt-0.5"/><span><strong>Kenapa jurusan di atas tidak dianjurkan?</strong><br/>{reason}</span></div></div>)}</div>
                       <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"><h4 className="font-bold text-slate-800 mb-3 flex gap-2"><Briefcase className="text-blue-500"/> Karir</h4><div className="flex flex-wrap gap-2">{content.jobs?.split(',').map((j,i)=><span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">{j.trim()}</span>)}</div></div>
                    </div>
                 </div>
              )}
              {resultTab === 'kepribadian' && (<div className="bg-white p-8 rounded-3xl shadow-sm"><h3 className="font-bold text-center mb-6">Kepribadian (Big Five)</h3><div className="h-80"><Bar data={personalityChartData} options={{indexAxis:'y'}}/></div></div>)}
              {resultTab === 'vark' && (<div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up"><div className="bg-white p-8 rounded-3xl shadow-sm flex flex-col items-center justify-center"><h3 className="font-bold text-slate-700 mb-6">Distribusi Gaya Belajar</h3><div className="w-64 h-64"><Doughnut data={varkChartData}/></div></div><div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200"><div className="flex items-center gap-2 mb-4"><BookOpen className="text-purple-600" size={24}/><h3 className="font-bold text-lg text-slate-800">Gaya Belajar Anda: <span className="text-purple-600">{varkType}</span></h3></div><p className="text-slate-600 leading-relaxed mb-6 border-l-4 border-purple-200 pl-4">{varkDesc}</p><div className="space-y-3"><h4 className="text-xs font-bold text-slate-400 uppercase">Rincian Skor:</h4>{Object.entries(varkScores).map(([k, v]) => (<div key={k} className="flex items-center justify-between text-sm"><span className="font-medium text-slate-600">{k}</span><span className="font-bold text-slate-800">{v}</span></div>))}</div></div></div>)}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mt-6 no-print"><div className="text-center"><h3 className="font-bold text-slate-800 mb-2">Seberapa akurat hasil ini?</h3><p className="text-sm text-slate-500 mb-4">Bantu kami meningkatkan kualitas sistem.</p>{!ratingSubmitted ? (<div className="space-y-4"><div className="flex justify-center gap-2">{[1, 2, 3, 4, 5].map((star) => (<button key={star} onClick={() => setRating(star)} className={`transition-all transform hover:scale-110 ${rating >= star ? 'text-amber-400' : 'text-slate-200'}`}><Star size={32} fill={rating >= star ? "currentColor" : "none"} strokeWidth={rating >= star ? 0 : 2}/></button>))}</div>{rating > 0 && (<div className="animate-fade-in-up"><textarea className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Masukan tambahan..." rows="2" value={feedback} onChange={(e) => setFeedback(e.target.value)}/><button onClick={submitRating} className="mt-2 px-6 py-2 bg-slate-800 text-white text-sm font-bold rounded-lg hover:bg-slate-900 transition w-full md:w-auto">Kirim</button></div>)}</div>) : (<div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 flex items-center justify-center gap-2 font-bold animate-pulse"><CheckCircle size={20}/> Masukan tersimpan.</div>)}</div></div>
              <div className="text-center pt-8 pb-20 flex justify-center gap-4 no-print"><button onClick={()=>window.print()} className="px-6 py-3 bg-white border-2 border-indigo-100 text-indigo-700 rounded-xl font-bold hover:bg-indigo-50 flex items-center gap-2"><Download size={18}/> Simpan PDF</button><button onClick={()=>window.location.reload()} className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 flex items-center gap-2"><RefreshCcw size={18}/> Selesai</button></div>
           </div>
        </div>
     );
  }
  return null;
}

export default App;