import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import './Login.css'; // Styling Login

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth(); // Untuk redirect jika sudah login

  // Jika user sudah login, arahkan ke Admin
  if (user) {
    navigate('/admin', { replace: true });
    return null; // Jangan render apa-apa
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Gunakan signInWithPassword untuk login dengan email/password
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Jika berhasil, AuthContext akan otomatis mendeteksi user dan App.js akan me-redirect.
      setMessage('Login Berhasil! Mengalihkan ke Dashboard...');

    } catch (error) {
      // Supabase memberikan pesan error yang cukup informatif
      setMessage(`Gagal Login: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Masuk Admin Afiliasi 🔑</h1>
        <p className="login-subtitle">Masukkan email dan password admin.</p>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Memuat...' : 'Login'}
          </button>
        </form>

        {message && <p className={`status-message ${message.includes('Gagal') ? 'error' : 'success'}`}>{message}</p>}
      </div>
    </div>
  );
};

export default Login;