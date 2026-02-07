import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate, Link } from 'react-router-dom'; // Tambah Link
import { Lock, Mail, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'; // Tambah icon

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setErrorMsg('Email atau password salah.');
      setLoading(false);
    } else {
      navigate('/admin/dashboard'); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative">
      
      {/* --- TOMBOL KEMBALI (NEW) --- */}
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-all">
         <ArrowLeft size={20}/> Kembali ke Tes
      </Link>

      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
           <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock size={32}/>
           </div>
           <h1 className="text-2xl font-extrabold text-slate-800">Admin Portal</h1>
           <p className="text-slate-400 text-sm mt-1">Masuk untuk mengelola data.</p>
        </div>

        {errorMsg && (
           <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2 border border-red-100">
              <AlertCircle size={16}/> {errorMsg}
           </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email</label>
            <div className="relative">
               <Mail className="absolute left-4 top-3.5 text-slate-400" size={18}/>
               <input 
                 type="email" 
                 required
                 className="w-full pl-11 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700" 
                 placeholder="admin@kampus.ac.id"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
               />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Password</label>
            <div className="relative">
               <Lock className="absolute left-4 top-3.5 text-slate-400" size={18}/>
               <input 
                 type="password" 
                 required
                 className="w-full pl-11 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700" 
                 placeholder="••••••••"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
               />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin"/> : 'Masuk Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}