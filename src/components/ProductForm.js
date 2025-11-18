import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import './ProductForm.css';

// Variabel MAX_MEDIA dan MAX_VIDEOS DIHAPUS TOTAL dari sini
// untuk mengatasi error ESLint 'is assigned a value but never used'

const ProductForm = ({ productToEdit, onClose }) => {
    const isEditMode = !!productToEdit;

    // Definisikan initialFormState di luar agar tidak dibuat ulang pada setiap render,
    // atau jika didefinisikan di dalam, pastikan ia diabaikan dari dependency array
    // jika nilainya tidak pernah berubah. Namun, untuk amannya, kita akan masukkan
    // semua dependency yang diminta ESLint.
    const initialFormState = {
        name: '',
        description: '',
        price: '',
        affiliate_link: '',
    };

    const [formData, setFormData] = useState(initialFormState);
    const [selectedFile, setSelectedFile] = useState(null);
    const [existingMediaUrl, setExistingMediaUrl] = useState(null);
    const [fileInputKey, setFileInputKey] = useState(Date.now());
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Helper: Mendeteksi apakah URL adalah video
    const isVideoUrl = (url) => {
        if (!url || typeof url !== 'string') return false;
        return url.match(/\.(mp4|mov|webm)(\?.*)?$/i);
    };

    // Helper: Mendeteksi apakah File object adalah video
    const isVideoFile = (file) => file && file.type.startsWith('video/');

    // PERBAIKAN FINAL: Kita tambahkan initialFormState ke dependency array
    // MENGHINDARI build error Netlify/ESLint: 'initialFormState' is missing
    useEffect(() => {
        if (isEditMode) {
            setFormData({
                name: productToEdit.name || '',
                description: productToEdit.description || '',
                price: productToEdit.price || '',
                affiliate_link: productToEdit.affiliate_link || '',
            });

            setExistingMediaUrl(productToEdit.image_url || null);
            setSelectedFile(null);
        } else {
            // Kita harus membuat salinan baru dari initialFormState jika menggunakannya dalam set state
            setFormData({ ...initialFormState });
            setExistingMediaUrl(null);
            setSelectedFile(null);
        }
        setFileInputKey(Date.now());
    }, [productToEdit, isEditMode, initialFormState]); // <--- initialFormState DITAMBAHKAN di sini


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // ... (sisa fungsi lainnya tetap sama)

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSelectedFile(file);
        setExistingMediaUrl(null);
        setFileInputKey(Date.now());
        setMessage('');
    };

    const uploadMedia = async () => {
        if (!selectedFile) {
            return existingMediaUrl;
        }

        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `product_images/${fileName}`;

        try {
            const { error } = await supabase.storage
                .from('product_images')
                .upload(filePath, selectedFile, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (error) {
                if (error.message.includes('duplicate key')) {
                    throw new Error("Media sudah ada di bucket. Coba unggah ulang atau ganti nama file.");
                }
                throw new Error(`Gagal upload media: ${error.message}`);
            }

            const { data: publicUrlData } = supabase.storage
                .from('product_images')
                .getPublicUrl(filePath);

            return publicUrlData.publicUrl;

        } catch (err) {
            throw err;
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            let finalMediaUrl = existingMediaUrl;

            if (selectedFile) {
                finalMediaUrl = await uploadMedia();
            }

            if (!finalMediaUrl) {
                throw new Error("Produk harus memiliki media (gambar atau video) utama.");
            }

            const productData = {
                ...formData,
                price: parseFloat(formData.price),
                image_url: finalMediaUrl,
            };

            let error = null;

            if (isEditMode) {
                const result = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', productToEdit.id)
                    .select();
                error = result.error;
            } else {
                const result = await supabase
                    .from('products')
                    .insert([productData])
                    .select();
                error = result.error;
            }

            if (error) throw error;

            setMessage(`${isEditMode ? 'Update' : 'Penambahan'} produk berhasil!`);
            setTimeout(() => { onClose(); }, 1000);

        } catch (err) {
            console.error("Supabase Error:", err.message);
            setMessage(`Gagal: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMedia = () => {
        setExistingMediaUrl(null);
        setSelectedFile(null);
        setFileInputKey(Date.now());
    };

    const mediaToPreview = selectedFile || existingMediaUrl;

    const renderMediaPreview = (media) => {
        if (!media) return null;

        const url = (media instanceof File) ? URL.createObjectURL(media) : media;
        const isVideo = (media instanceof File) ? isVideoFile(media) : isVideoUrl(media);

        return (
            <div className="image-preview-item media-single-preview">
                {isVideo ? (
                    <video src={url} controls muted autoPlay loop className="media-preview-video" />
                ) : (
                    <img src={url} alt="Preview Produk" className="media-preview-image" />
                )}

                <span className="media-type-tag">
                    {isVideo ? 'VIDEO' : 'GAMBAR'}
                </span>

                <button
                    type="button"
                    className="remove-image-btn"
                    onClick={handleRemoveMedia}
                    disabled={loading}
                >
                    &times;
                </button>
            </div>
        );
    };


    return (
        <div className="product-form">
            <h2>{isEditMode ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>

            <form onSubmit={handleSubmit}>

                <div className="input-group">
                    <label htmlFor="name">Nama Produk:</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required disabled={loading} />
                </div>

                <div className="input-group">
                    <label htmlFor="description">Deskripsi:</label>
                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} required disabled={loading} />
                </div>

                <div className="input-group">
                    <label htmlFor="price">Harga (Contoh: 150000):</label>
                    <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} required disabled={loading} />
                </div>


                {/* INPUT SINGLE MEDIA UTAMA */}
                <div className="input-group multi-image-upload">
                    <label>
                        Media Utama Produk (Maksimum 1 file)
                    </label>

                    <div className="image-selection-area">

                        {/* PRATINJAU MEDIA */}
                        {renderMediaPreview(mediaToPreview)}

                        {/* KARTU UPLOAD KUSTOM */}
                        {!mediaToPreview && (
                            <>
                                <input
                                    key={fileInputKey}
                                    type="file"
                                    name="media_file"
                                    id="media_file"
                                    accept="image/*, video/mp4, video/mov, video/webm"
                                    onChange={handleFileChange}
                                    required={!isEditMode}
                                    disabled={loading}
                                    style={{ display: 'none' }}
                                />
                                <label
                                    htmlFor="media_file"
                                    className="upload-card"
                                    data-disabled={loading || !!mediaToPreview}
                                >
                                    <span className="upload-icon">+</span>
                                    {isEditMode ? 'Ganti Media' : 'Pilih Media'}
                                    <small className="video-limit-note">
                                        (Hanya 1 file diizinkan)
                                    </small>
                                </label>
                            </>
                        )}
                    </div>
                </div>

                <div className="input-group">
                    <label htmlFor="affiliate_link">Link Afiliasi Shopee (URL):</label>
                    <input type="url" name="affiliate_link" id="affiliate_link" value={formData.affiliate_link} onChange={handleChange} required disabled={loading} />
                </div>

                <button type="submit" disabled={loading} className="submit-button">
                    {loading ? 'Memproses...' : (isEditMode ? 'Simpan Perubahan' : 'Tambahkan Produk')}
                </button>
            </form>

            {message && <p className={`form-message ${message.includes('Gagal') ? 'error' : 'success'}`}>{message}</p>}
        </div>
    );
};

export default ProductForm;