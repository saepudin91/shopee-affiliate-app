import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import './ProductList.css';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchProducts = async () => {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Gagal memuat produk dari Supabase:", error);
            setError(`Gagal memuat produk. Error: ${error.message}`);
            setProducts([]);
        } else {
            setProducts(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchProducts();

        const channel = supabase
            .channel('products_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'products' },
                () => {
                    console.log('Perubahan Realtime Diterima! Memuat ulang produk.');
                    fetchProducts();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const filteredProducts = useMemo(() => {
        if (!searchTerm) {
            return products;
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return products.filter(product =>
            product.name.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }, [products, searchTerm]);


    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    // 💡 FUNGSI HELPER BARU: Mendeteksi apakah URL adalah video
    const isVideoUrl = (url) => {
        if (!url || typeof url !== 'string') return false;
        // Cek ekstensi umum (case insensitive) DAN mendukung query parameter (?t=...) di akhir URL
        return url.match(/\.(mp4|webm|mov|avi|mkv)(\?.*)?$/i);
    };


    if (loading) {
        return <div className="loading-state">Memuat rekomendasi produk dari database...</div>;
    }

    if (error) {
        return <div className="error-state">❌ {error}</div>;
    }

    if (products.length === 0 && !searchTerm) {
        return <div className="loading-state">Saat ini belum ada produk afiliasi yang ditampilkan oleh Admin.</div>;
    }

    if (filteredProducts.length === 0) {
        return (
            <div className="product-list-container">
                <h1>🛍️ Rekomendasi Afiliasi Shopee Terbaik!</h1>
                <div className="search-bar-container">
                    <input
                        type="text"
                        placeholder="Cari produk yang kamu inginkan (misalnya: kemeja, sepatu...)"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="search-input"
                    />
                </div>
                <div className="no-results-state">Produk "{searchTerm}" tidak ditemukan.</div>
            </div>
        );
    }

    // RENDER UTAMA DIMULAI DI SINI
    return (
        <div className="product-list-container">
            <h1>🛍️ Rekomendasi Afiliasi Shopee Terbaik!</h1>

            <div className="search-bar-container">
                <input
                    type="text"
                    placeholder="Cari produk yang kamu inginkan (misalnya: kemeja, sepatu dll...)"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="search-input"
                />
            </div>

            <div className="products-grid">
                {filteredProducts.map((product) => {
                    // 💡 BARIS PERBAIKAN UTAMA: Prioritaskan image_url (tunggal) sebagai media utama
                    // Fallback ke elemen pertama dari image_urls (plural)
                    let mainMedia = product.image_url;

                    // Jika image_url kosong, coba ambil dari image_urls[0]
                    if (!mainMedia && Array.isArray(product.image_urls) && product.image_urls.length > 0) {
                        mainMedia = product.image_urls[0];
                    }

                    const isMainVideo = isVideoUrl(mainMedia);

                    // Tentukan daftar thumbnails (sisanya dari image_urls)
                    // Jika menggunakan image_url tunggal, thumbnails biasanya kosong.
                    // Jika menggunakan image_urls, ambil dari index 1 dan seterusnya.
                    const thumbnails = (Array.isArray(product.image_urls) && product.image_urls[0] === mainMedia)
                        ? product.image_urls.slice(1)
                        : [];

                    return (
                        <div key={product.id} className="product-card">

                            {/* WRAPPER LINK GAMBAR/VIDEO */}
                            <a
                                href={product.affiliate_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="product-image-link"
                            >
                                {/* KOTAK MEDIA UTAMA (GAMBAR/VIDEO) */}
                                <div className="main-image-container">
                                    {isMainVideo ? (
                                        // 💡 RENDER VIDEO UTAMA
                                        <video
                                            src={mainMedia}
                                            className="product-media"
                                            controls
                                            autoPlay
                                            muted
                                            loop
                                            playsInline
                                            preload="metadata"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.style.display = 'none';
                                                e.target.parentElement.innerHTML = '<div class="media-error-text">Video Gagal Muat</div>';
                                            }}
                                        />
                                    ) : (
                                        // 💡 RENDER GAMBAR UTAMA
                                        <img
                                            src={mainMedia}
                                            alt={product.name}
                                            className="product-media"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "https://via.placeholder.com/300/CCCCCC/808080?text=Gambar+Gagal";
                                            }}
                                        />
                                    )}

                                    {/* 💡 BADGE VIDEO BARU */}
                                    {isMainVideo && (
                                        <span className="video-badge">🎬 VIDEO</span>
                                    )}

                                </div>

                                {/* GALERI MINI/THUMBNAIL */}
                                {thumbnails.length > 0 && (
                                    <div className="thumbnail-gallery">
                                        {thumbnails.map((url, index) => {
                                            const isThumbnailVideo = isVideoUrl(url);
                                            return (
                                                <div key={index} className="thumbnail-item">
                                                    {isThumbnailVideo ? (
                                                        <video
                                                            src={url}
                                                            controls={false}
                                                            muted
                                                            loop
                                                            className="thumbnail-media-item"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.style.display = 'none';
                                                                e.target.parentElement.innerHTML = '<div class="thumbnail-error-placeholder">V</div>';
                                                            }}
                                                        />
                                                    ) : (
                                                        <img
                                                            src={url}
                                                            alt={`Thumbnail ${index + 1}`}
                                                            className="thumbnail-media-item"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = "https://via.placeholder.com/50/CCCCCC/808080?text=x";
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </a>
                            {/* AKHIR WRAPPER LINK */}

                            <div className="product-content">
                                {/* JUDUL DIBUNGKUS LINK */}
                                <a
                                    href={product.affiliate_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="product-title-link"
                                >
                                    <h2>{product.name}</h2>
                                </a>

                                <p className="product-description">{product.description}</p>
                                <p className="product-price">
                                    Rp{Number(product.price).toLocaleString('id-ID')}
                                </p>

                                <a
                                    href={product.affiliate_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="buy-button"
                                >
                                    Beli di Shopee
                                </a>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ProductList;