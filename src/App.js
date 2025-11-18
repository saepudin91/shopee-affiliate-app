// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Context untuk Manajemen Otentikasi
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import Komponen Header
import Header from './components/Header'; // <-- BARIS BARU: Import komponen Header

// Import Halaman Aplikasi
import ProductList from './pages/ProductList';      // Halaman Publik (Tampilan Produk)
import Login from './pages/Login';                  // Halaman Login Admin
import AdminDashboard from './pages/AdminDashboard';// Halaman Dashboard Admin

// -----------------------------------------------------------
// Komponen Pelindung (Guard) untuk rute Admin
// -----------------------------------------------------------
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Tampilkan loading saat memeriksa status otentikasi
  if (loading) return <div>Memuat sesi...</div>;

  // Jika user sudah login (Admin), tampilkan konten anak-anak
  // Jika belum, arahkan (Navigate) ke halaman Login
  return user ? children : <Navigate to="/login" />;
};

// -----------------------------------------------------------
// Komponen Utama Aplikasi (App)
// -----------------------------------------------------------
function App() {
  return (
    <Router>
      {/* AuthProvider membungkus semua rute untuk menyediakan data user */}
      <AuthProvider>

        {/* BARIS BARU: Header diletakkan di luar Routes agar selalu terlihat */}
        <Header />

        <Routes>
          {/* 1. Rute Publik: Dapat diakses siapa saja */}
          <Route path="/" element={<ProductList />} />

          {/* 2. Rute Login: Halaman untuk masuk Admin */}
          <Route path="/login" element={<Login />} />

          {/* 3. Rute Admin: Hanya dapat diakses jika sudah login (Dilindungi ProtectedRoute) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;