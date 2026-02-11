import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BrainCircuit, Sparkles, ArrowRight, Briefcase, BookOpen, 
  Lock, CheckCircle, Star 
} from 'lucide-react';

const LandingPage = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      
      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 font-extrabold text-2xl text-indigo-600">
            <BrainCircuit size={32} />
            <span>PsikoTest<span className="text-slate-800">.id</span></span>
          </div>

          {/* Menu Desktop */}
          <div className="hidden md:flex items-center gap-8 font-medium text-sm text-slate-500">
            <a href="#fitur" className="hover:text-indigo-600 transition">Fitur</a>
            <a href="#metode" className="hover:text-indigo-600 transition">Metode</a>
            <Link to="/login" className="flex items-center gap-2 font-bold hover:text-indigo-600">
              <Lock size={16} /> Admin
            </Link>
          </div>

          {/* Tombol CTA Navbar */}
          <div>
            <button onClick={onStart} className="px-6 py-2.5 bg-indigo-600 text-white rounded-full font-bold text-sm hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
              Mulai Tes
            </button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="pt-32 pb-20 px-6 bg-gradient-to-b from-indigo-50/50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-indigo-100 rounded-full text-indigo-600 text-xs font-bold uppercase tracking-wider mb-8 shadow-sm">
            <Sparkles size={14} /> Platform Asesmen Karir & Potensi Diri
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight text-slate-900 tracking-tight">
            Kenali Potensi, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Rancang Masa Depan.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Temukan jurusan kuliah dan karir idealmu melalui asesmen psikologi komprehensif menggunakan metode ilmiah <strong>RIASEC</strong>, <strong>Big Five Personality</strong>, dan <strong>VARK</strong>.
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <button onClick={onStart} className="px-8 py-4 bg-indigo-600 text-white rounded-full font-bold text-lg hover:bg-indigo-700 transition shadow-xl shadow-indigo-200 flex items-center gap-2 w-full md:w-auto justify-center">
              Ambil Tes Sekarang <ArrowRight size={20} />
            </button>
            <a href="#fitur" className="px-8 py-4 bg-white text-slate-600 border border-slate-200 rounded-full font-bold text-lg hover:bg-slate-50 transition flex items-center gap-2 w-full md:w-auto justify-center">
              Pelajari Lebih Lanjut
            </a>
          </div>

          {/* Trust Badges */}
          <div className="mt-16 pt-8 border-t border-slate-100 flex flex-wrap justify-center gap-8 opacity-60 grayscale">
             <div className="flex items-center gap-2 font-bold text-slate-400"><CheckCircle size={16}/> RIASEC Holland Code</div>
             <div className="flex items-center gap-2 font-bold text-slate-400"><CheckCircle size={16}/> Big Five Personality</div>
             <div className="flex items-center gap-2 font-bold text-slate-400"><CheckCircle size={16}/> VARK Learning Style</div>
          </div>
        </div>
      </header>

      {/* --- FEATURES SECTION --- */}
      <section id="fitur" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Metode Analisis Lengkap</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Kami menggabungkan tiga standar psikometri internasional untuk hasil yang akurat.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="p-8 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-xl transition hover:-translate-y-1 group">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition">
                <Briefcase size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Minat Karir (RIASEC)</h3>
              <p className="text-slate-500 leading-relaxed text-sm">Mengetahui tipe kepribadian karir Anda (Realistic, Investigative, Artistic, dll) untuk rekomendasi jurusan yang tepat.</p>
            </div>
            
            {/* Card 2 */}
            <div className="p-8 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-xl transition hover:-translate-y-1 group">
              <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600 mb-6 group-hover:bg-pink-600 group-hover:text-white transition">
                <BrainCircuit size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Kepribadian (Big Five)</h3>
              <p className="text-slate-500 leading-relaxed text-sm">Analisis mendalam tentang stabilitas emosi, keterbukaan, dan sifat sosial Anda dalam lingkungan kerja.</p>
            </div>
            
            {/* Card 3 */}
            <div className="p-8 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-xl transition hover:-translate-y-1 group">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:bg-purple-600 group-hover:text-white transition">
                <BookOpen size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Gaya Belajar (VARK)</h3>
              <p className="text-slate-500 leading-relaxed text-sm">Temukan cara belajar paling efektif bagi otak Anda, apakah Visual, Auditory, Read/Write, atau Kinesthetic.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-50 py-10 border-t border-slate-200 text-center">
        <div className="flex items-center justify-center gap-2 font-bold text-indigo-900 mb-4">
            <BrainCircuit size={24} /> PsikoTest.id
        </div>
        <p className="text-slate-500 text-sm">© 2026 Universitas Ibn Khaldun Bogor.<br/>Sistem Informasi Manajemen Asesmen.</p>
      </footer>

    </div>
  );
};

export default LandingPage;