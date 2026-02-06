// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'

// Import Halaman
import App from './App.jsx'         
import Login from './login.jsx'     
import AdminLayout from './adminLayout.jsx'
import Admin from './admin.jsx'     
import AdminResults from './adminResults.jsx'
import AdminDashboard from './adminDashboard.jsx'
import AdminRecommendations from './adminRecommendations.jsx'
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Halaman Publik (Kuis) */}
        <Route path="/" element={<App />} />
        
        {/* Halaman Login */}
        <Route path="/login" element={<Login />} />

        {/* HALAMAN ADMIN (PROTECTED) */}
        <Route path="/admin" element={<AdminLayout />}>
          
          {/* Default redirect ke dashboard */}
          <Route index element={<Navigate to="dashboard" replace />} />
          
          {/* Dashboard Statistik (Tampilan Baru) */}
          <Route path="dashboard" element={<AdminDashboard />} />
          
          {/* CRUD Soal */}
          <Route path="soal" element={<Admin />} />

          {/* Hasil Tes */}
          <Route path="hasil" element={<AdminResults />} />

          <Route path="/admin/recommendations" element={<AdminRecommendations />} />
          
        </Route>

      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)