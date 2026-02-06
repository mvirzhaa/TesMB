// src/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
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
import { Bar, Doughnut } from 'react-chartjs-2';
import { Users, TrendingUp, Award, Calendar } from 'lucide-react';

// Registrasi Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    topInterest: '-',
    recentUsers: []
  });
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Ambil semua data hasil
    const { data, error } = await supabase
      .from('results')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      // 1. Hitung Total User
      const total = data.length;

      // 2. Hitung Distribusi Minat (RIASEC)
      const interestCounts = {
        Realistic: 0, Investigative: 0, Artistic: 0, 
        Social: 0, Enterprising: 0, Conventional: 0
      };

      data.forEach(user => {
        // Cari nilai tertinggi di object scores user
        const scores = user.scores; 
        const topCategory = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
        if (interestCounts[topCategory] !== undefined) {
          interestCounts[topCategory]++;
        }
      });

      // 3. Cari Minat Paling Populer
      const topInterest = Object.keys(interestCounts).reduce((a, b) => 
        interestCounts[a] > interestCounts[b] ? a : b
      );

      setStats({
        totalUsers: total,
        topInterest: total > 0 ? topInterest : '-',
        recentUsers: data.slice(0, 5) // Ambil 5 user terbaru
      });

      // 4. Siapkan Data Chart
      setChartData({
        labels: Object.keys(interestCounts),
        datasets: [
          {
            label: 'Jumlah Peserta',
            data: Object.values(interestCounts),
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)',
              'rgba(255, 159, 64, 0.7)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
            ],
            borderWidth: 1,
          },
        ],
      });
    }
    setLoading(false);
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Memuat Statistik...</div>;

  return (
    <div className="p-6 md:p-10 bg-slate-50/50 min-h-full font-sans">
      <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Dashboard Overview</h1>
      <p className="text-slate-500 mb-8">Ringkasan performa tes minat bakat.</p>

      {/* --- KARTU STATISTIK --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><Users size={24}/></div>
          <div>
            <p className="text-sm text-slate-500 font-bold uppercase">Total Peserta</p>
            <h3 className="text-2xl font-extrabold text-slate-800">{stats.totalUsers}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl"><Award size={24}/></div>
          <div>
            <p className="text-sm text-slate-500 font-bold uppercase">Minat Terbanyak</p>
            <h3 className="text-2xl font-extrabold text-slate-800">{stats.topInterest}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl"><TrendingUp size={24}/></div>
          <div>
            <p className="text-sm text-slate-500 font-bold uppercase">Status Sistem</p>
            <h3 className="text-2xl font-extrabold text-slate-800">Aktif</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- GRAFIK --- */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-lg border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Distribusi Minat Peserta</h3>
          {chartData && <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />}
        </div>

        {/* --- 5 PESERTA TERBARU --- */}
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Aktivitas Terbaru</h3>
          <div className="space-y-4">
            {stats.recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                   {u.user_name.charAt(0).toUpperCase()}
                </div>
                <div>
                   <p className="text-sm font-bold text-slate-700">{u.user_name}</p>
                   <p className="text-xs text-slate-400 flex items-center gap-1">
                     <Calendar size={10}/> {new Date(u.created_at).toLocaleDateString()}
                   </p>
                </div>
              </div>
            ))}
            {stats.recentUsers.length === 0 && <p className="text-slate-400 text-sm">Belum ada data.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}