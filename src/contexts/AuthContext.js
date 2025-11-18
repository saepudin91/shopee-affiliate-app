import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// 1. Buat Context
const AuthContext = createContext();

// 2. Buat Hook Kustom untuk Konsumsi Context
export const useAuth = () => {
    return useContext(AuthContext);
};

// 3. Komponen Provider Utama
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fungsi untuk Logout
    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error("Error signing out:", error.message);
        // User akan otomatis diset null oleh listener
    };

    useEffect(() => {
        // 1. Ambil sesi saat ini
        const fetchSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error("Error fetching session:", error.message);
            }

            setUser(session?.user ?? null);
            setLoading(false);
        };

        fetchSession();

        // 2. Setup Listener untuk perubahan status Auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                // Event ini dipicu saat login, logout, atau token refresh
                setUser(session?.user ?? null);
                setLoading(false);
            }
        );

        // Cleanup function untuk menghapus listener
        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    // Nilai yang akan disediakan oleh Context
    const value = {
        user,
        loading,
        signOut,
        // Tambahkan signIn jika Anda ingin menggunakannya di luar komponen Login
    };

    // Tampilkan loading screen jika sesi belum dimuat
    if (loading) {
        return (
            <div style={{ padding: '50px', textAlign: 'center', fontSize: '1.5em' }}>
                Memeriksa sesi otentikasi...
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};