// src/AdminLayout.jsx
import React, { useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { LayoutDashboard, FileQuestion, LogOut, User } from 'lucide-react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Cek apakah user sudah login? Kalau belum, tendang ke Login
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      }
    };
    checkSession();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/admin/soal', label: 'Manajemen Soal', icon: <FileQuestion size={20} /> },
    { path: '/admin/hasil', label: 'Hasil Tes', icon: <User size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-blue-500">Quipper</span>Clone
          </h2>
          <p className="text-xs text-slate-400 mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* --- CONTENT AREA (DINAMIS) --- */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
            {/* <Outlet /> adalah tempat konten (anak) akan muncul */}
            <Outlet /> 
        </div>
      </main>
    </div>
  );
}