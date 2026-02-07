import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom'; // <--- Import Link
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Users, TrendingUp, Award, Calendar, AlertCircle, RefreshCw, Briefcase, FileText } from 'lucide-react'; // <--- Import Icon

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    topInterest: '-',
    recentUsers: []
  });
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from('results')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const total = data.length;
        const interestCounts = {
          Realistic: 0, Investigative: 0, Artistic: 0, 
          Social: 0, Enterprising: 0, Conventional: 0
        };

        data.forEach(user => {
          if (user.scores && Object.keys(user.scores).length > 0) {
             const riasecOnly = { 
                Realistic: user.scores.Realistic || 0, 
                Investigative: user.scores.Investigative || 0, 
                Artistic: user.scores.Artistic || 0, 
                Social: user.scores.Social || 0, 
                Enterprising: user.scores.Enterprising || 0, 
                Conventional: user.scores.Conventional || 0 
             };
             const topCategory = Object.keys(riasecOnly).reduce((a, b) => riasecOnly[a] > riasecOnly[b] ? a : b);
             if (interestCounts[topCategory] !== undefined) interestCounts[topCategory]++;
          }
        });

        let topInterest = '-';
        const totalInterests = Object.values(interestCounts).reduce((a, b) => a + b, 0);
        if (totalInterests > 0) {
            topInterest = Object.keys(interestCounts).reduce((a, b) => interestCounts[a] > interestCounts[b] ? a : b);
        }

        setStats({
          totalUsers: total,
          topInterest: topInterest,
          recentUsers: data.slice(0, 5) 
        });

        setChartData({
          labels: Object.keys(interestCounts),
          datasets: [{
              label: 'Jumlah Peserta',
              data: Object.values(interestCounts),
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
              borderRadius: 5
            }],
        });
      }
    } catch (err) {
      console.error("Dashboard Error:", err);
      setErrorMsg(err.message || "Gagal memuat data dashboard.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex flex-col items-center justify-center h-screen text-slate-500 bg-slate-50"><RefreshCw className="animate-spin mb-2" size={32}/><p className="font-semibold">Memuat Statistik...</p></div>;

  if (errorMsg) return (
    <div className="p-10 text-center flex flex-col items-center justify-center h-screen text-red-500 bg-slate-50">
        <AlertCircle size={48} className="mb-4"/>
        <h3 className="text-lg font-bold">Gagal Memuat Dashboard</h3>
        <p className="text-sm mb-6 max-w-md bg-red-50 p-4 rounded-lg border border-red-200">{errorMsg}</p>
        <button onClick={fetchData} className="px-6 py-2 bg-white border border-red-200 text-red-600 rounded-lg font-bold hover:bg-red-50 transition shadow-sm">Coba Lagi</button>
    </div>
  );

  return (
    <div className="p-6 md:p-10 bg-slate-50/50 min-h-screen font-sans">
      
      {/* --- HEADER (TOMBOL KELOLA PRODI DITAMBAHKAN DISINI) --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
             <h1 className="text-3xl font-extrabold text-slate-800 mb-1">Dashboard Overview</h1>
             <p className="text-slate-500">Ringkasan performa tes minat bakat.</p>
          </div>
          
          <div className="flex gap-3">
             {/* TOMBOL MENU ADMIN */}
             <Link to="/admin/recommendations" className="bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-5 py-3 rounded-xl font-bold shadow-sm flex items-center gap-2 transition-all">
                <Briefcase size={18}/> Kelola Prodi
             </Link>
             
             {/* Tombol ke Tabel Hasil */}
             <Link to="/admin/hasil" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all">
                <FileText size={18}/> Lihat Detail Peserta
             </Link>
          </div>
      </div>

      {/* --- KARTU STATISTIK --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><Users size={24}/></div>
          <div><p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Total Peserta</p><h3 className="text-2xl font-extrabold text-slate-800">{stats.totalUsers}</h3></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl"><Award size={24}/></div>
          <div><p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Minat Terbanyak</p><h3 className="text-2xl font-extrabold text-slate-800">{stats.topInterest}</h3></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl"><TrendingUp size={24}/></div>
          <div><p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Status Sistem</p><h3 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Online</h3></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><div className="w-1 h-6 bg-blue-500 rounded-full"></div> Distribusi Minat</h3>
          {chartData && <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } } }} />}
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 h-fit">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><div className="w-1 h-6 bg-purple-500 rounded-full"></div> Peserta Terbaru</h3>
          <div className="space-y-4">
            {stats.recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition border border-transparent hover:border-slate-100">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold shadow-inner shrink-0">{(u.user_name || '?').charAt(0).toUpperCase()}</div>
                <div className="overflow-hidden"><p className="text-sm font-bold text-slate-700 truncate">{u.user_name || 'Tanpa Nama'}</p><p className="text-xs text-slate-400 flex items-center gap-1"><Calendar size={10}/> {new Date(u.created_at).toLocaleDateString()}</p></div>
              </div>
            ))}
            {stats.recentUsers.length === 0 && <div className="text-center py-8 text-slate-400 text-sm italic">Belum ada data peserta.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}