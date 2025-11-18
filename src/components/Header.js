// src/components/Header.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header = () => {
    const { user, signOut } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Fungsi untuk menutup menu dan menjalankan aksi (logout/navigasi)
    const handleNavClick = (action = null) => {
        setIsMenuOpen(false);
        if (action) action();
    };

    const authLink = user ? (
        <button
            onClick={() => handleNavClick(signOut)}
            className="nav-button mobile-nav-item"
        >
            Logout
        </button>
    ) : (
        <Link
            to="/login"
            className="nav-link mobile-nav-item"
            onClick={() => handleNavClick()}
        >
            Login Admin
        </Link>
    );

    const adminDashboardLink = user ? (
        <Link
            to="/admin"
            className="nav-link mobile-nav-item"
            onClick={() => handleNavClick()}
        >
            Dashboard Admin
        </Link>
    ) : null;

    const publicLink = (
        <Link
            to="/"
            className="nav-link mobile-nav-item"
            onClick={() => handleNavClick()}
        >
            Rekomendasi Produk
        </Link>
    );

    return (
        <header className="app-header">
            <div className="header-brand">
                <Link to="/" className="brand-link">
                    🛍️ Shopee Affiliate Center
                </Link>
            </div>

            <button
                className="menu-toggle"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
            >
                ☰
            </button>

            <nav
                id="mobile-menu"
                className={`header-nav ${isMenuOpen ? 'open' : ''}`}
            >
                {/* 💡 TOMBOL TUTUP DITAMBAHKAN DI SINI */}
                <button
                    onClick={() => setIsMenuOpen(false)}
                    className="close-menu-button"
                >
                    &times;
                </button>
                {/* AKHIR TOMBOL TUTUP */}

                {publicLink}
                {adminDashboardLink}
                {authLink}
            </nav>
        </header>
    );
};

export default Header;