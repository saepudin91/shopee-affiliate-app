import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import ProductForm from '../components/ProductForm';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State untuk form: mode (tambah/edit) dan data produk yang diedit
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Helper: Mendeteksi apakah URL adalah video (untuk tampilan dashboard)
    const isVideoUrl = (url) => {
        if (!url || typeof url !== 'string') return false;
        return url.match(/\.(mp4|mov|webm)(\?.*)?$/i);
    };

    // Fungsi untuk mengambil data produk dari Supabase
    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data);
        } catch (err) {
            console.error("Error fetching products:", err.message);
            setError("Gagal memuat data produk.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();

        // Setup Realtime Listener
        const channel = supabase
            .channel('product_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'products' },
                () => {
                    fetchProducts(); 
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Handler untuk tombol Edit
    const handleEdit = (product) => {
        setEditingProduct(product);
        setIsFormOpen(true);
    };

    // Handler untuk tombol Delete
    const handleDelete = async (id) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;
            alert('Produk berhasil dihapus!');
        } catch (err) {
            console.error("Error deleting product:", err.message);
            alert('Gagal menghapus produk: ' + err.message);
        }
    };

    // Handler untuk menutup form
    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingProduct(null);
        fetchProducts(); 
    };

    // 💡 Helper Lama Dihapus: getProductImageUrl dan getAdditionalImageCount tidak diperlukan lagi.


    return (
        <div className="admin-dashboard-container">
            <h1>Dashboard Admin 🛠️</h1>
            <p>Selamat datang, Admin! (User ID: {user?.id})</p>

            {/* Tombol Buka Form Penambahan */}
            <button
                onClick={() => { setIsFormOpen(true); setEditingProduct(null); }}
                className="add-product-button"
            >
                + Tambah Produk Baru
            </button>

            {/* Modal/Form Produk */}
            {isFormOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <ProductForm
                            productToEdit={editingProduct}
                            onClose={handleCloseForm}
                        />
                        <button onClick={handleCloseForm} className="close-form-button">
                            &times; Tutup
                        </button>
                    </div>
                </div>
            )}

            {/* Daftar Produk */}
            <div className="admin-product-list">
                <h2>Daftar Produk ({products.length})</h2>
                {loading && <p>Memuat daftar produk...</p>}
                {error && <p className="error-message">{error}</p>}

                {!loading && products.length === 0 && (
                    <p>Belum ada produk afiliasi yang ditambahkan.</p>
                )}

                {products.map((product) => {
                    // 💡 FOKUS PADA image_url SAJA
                    const mediaUrl = product.image_url;
                    const isVideo = isVideoUrl(mediaUrl);

                    return (
                        <div key={product.id} className="admin-product-card">
                            
                            {/* Tampilan Media Utama (Gambar/Video) */}
                            <div className="admin-product-image-gallery">
                                {mediaUrl ? (
                                    isVideo ? (
                                        // Tampilkan video jika itu video
                                        <video
                                            src={mediaUrl}
                                            controls={false}
                                            autoPlay
                                            muted
                                            loop
                                            className="admin-product-image" // Menggunakan className yang sama
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.style.display = 'none';
                                                e.target.parentElement.innerHTML = '<span class="media-error-text">VIDEO ERROR</span>';
                                            }}
                                        />
                                    ) : (
                                        // Tampilkan gambar jika itu gambar
                                        <img
                                            src={mediaUrl}
                                            alt={`${product.name} (Primary)`}
                                            className="admin-product-image"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "https://via.placeholder.com/100/CCCCCC/808080?text=No+Img";
                                            }}
                                        />
                                    )
                                ) : (
                                    // Fallback jika tidak ada URL sama sekali
                                    <img 
                                        src="https://via.placeholder.com/100/CCCCCC/808080?text=No+Img" 
                                        alt="No Media" 
                                        className="admin-product-image"
                                    />
                                )}
                                
                                {isVideo && (
                                    <span className="image-count-indicator video-indicator">🎬</span>
                                )}

                            </div>
                            {/* AKHIR Tampilan Media */}

                            <div className="card-info">
                                <h3>{product.name}</h3>
                                <p>{product.description.substring(0, 100)}...</p>
                                <p><strong>Harga:</strong> Rp{Number(product.price).toLocaleString('id-ID')}</p>
                                <p><strong>Link:</strong> <a href={product.affiliate_link} target="_blank" rel="noopener noreferrer">Lihat Link</a></p>
                            </div>
                            <div className="card-actions">
                                <button onClick={() => handleEdit(product)} className="edit-button">Edit</button>
                                <button onClick={() => handleDelete(product.id)} className="delete-button">Hapus</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AdminDashboard;