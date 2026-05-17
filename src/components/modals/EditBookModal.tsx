"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Image as ImageIcon, Save, Loader2, Edit3 } from "lucide-react";
import { useReaderStore } from "@/store/useReaderStore";
import { Book } from "@/data/mockData";

interface EditBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book | null;
}

export default function EditBookModal({ isOpen, onClose, book }: EditBookModalProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverBase64, setCoverBase64] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updateCustomBook } = useReaderStore();

  useEffect(() => {
    if (book) {
      setTitle(book.title || "");
      setAuthor(book.author || "");
      setCoverBase64(book.coverUrl || null);
    }
  }, [book]);

  const compressImageFromUrl = (url: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 300;
        const scale = Math.min(maxWidth / img.width, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        } else {
          resolve("");
        }
      };
      img.onerror = () => resolve("");
      img.src = url;
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Hanya file gambar yang diperbolehkan!");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Ukuran gambar maksimal 5MB!");
        return;
      }
      
      const blobUrl = URL.createObjectURL(file);
      const base64 = await compressImageFromUrl(blobUrl);
      if (base64) {
        setCoverBase64(base64);
        setError("");
      }
    }
  };

  const handleSave = () => {
    if (!book || !title) {
      setError("Judul buku tidak boleh kosong.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      updateCustomBook(book.id, {
        title,
        author,
        coverUrl: coverBase64 || book.coverUrl,
      });
      
      onClose();
    } catch (err) {
      setError("Terjadi kesalahan saat menyimpan perubahan.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!book) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Edit3 size={22} className="text-accent" />
                Ubah Detail Buku
              </h2>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-white transition-colors p-1 rounded-full hover:bg-zinc-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {error && (
                <p className="text-red-400 text-sm mb-4 font-medium bg-red-400/10 p-3 rounded-xl border border-red-400/20">
                  {error}
                </p>
              )}

              {/* Cover Upload Area */}
              <div className="flex flex-col items-center mb-6">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-32 h-48 rounded-xl overflow-hidden shadow-lg border-2 border-zinc-700 hover:border-accent cursor-pointer group transition-all"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  {coverBase64 ? (
                    <img src={coverBase64} alt="Cover Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                      <ImageIcon size={32} className="text-zinc-500" />
                    </div>
                  )}

                  {/* Overlay for hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <Edit3 size={24} className="text-white" />
                    <span className="text-xs font-bold text-white tracking-widest uppercase">Ganti Sampul</span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 mt-3 text-center uppercase tracking-wider font-bold">
                  Klik sampul untuk mengganti gambar
                </p>
              </div>

              {/* Form Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Judul Buku
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Masukkan judul buku..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Penulis
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Masukkan nama penulis..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-zinc-600"
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={isSaving || !title}
                  className="w-full mt-2 bg-gradient-to-r from-[var(--accent-primary)] to-[#c084fc] hover:opacity-90 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
