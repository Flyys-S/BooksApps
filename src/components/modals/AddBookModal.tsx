"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UploadCloud, File, BookPlus, Loader2, Image as ImageIcon } from "lucide-react";
import { useReaderStore } from "@/store/useReaderStore";
import ePub from "epubjs";
import JSZip from "jszip";

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddBookModal({ isOpen, onClose }: AddBookModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverBase64, setCoverBase64] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState("");
  const [bookType, setBookType] = useState<"book" | "manga" | "manhwa">("book");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addCustomBook } = useReaderStore();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

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

  const validateAndExtractFile = async (selectedFile: File) => {
    setError("");
    setCoverBase64(null);
    const name = selectedFile.name.toLowerCase();
    if (!name.endsWith(".epub") && !name.endsWith(".cbz") && !name.endsWith(".zip")) {
      setError("Hanya file .epub, .cbz, atau .zip yang diperbolehkan!");
      return;
    }
    if (selectedFile.size > 150 * 1024 * 1024) {
      setError("Ukuran file maksimal 150MB!");
      return;
    }
    
    setFile(selectedFile);
    setTitle(selectedFile.name.replace(/\.(epub|cbz|zip)$/i, "").replace(/[-_]/g, " "));
    setIsExtracting(true);

    try {
      if (name.endsWith(".epub")) {
        setBookType("book");
        const arrayBuffer = await selectedFile.arrayBuffer();
        const book = ePub(arrayBuffer);
        await book.ready;
        
        const metadata = await book.loaded.metadata;
        if (metadata.title) setTitle(metadata.title);
        if (metadata.creator) setAuthor(metadata.creator);

        const coverUrlPath = await book.loaded.cover;
        if (coverUrlPath) {
          const coverBlobUrl = await book.archive.createUrl(coverUrlPath, { base64: true });
          if (coverBlobUrl) {
            const base64 = await compressImageFromUrl(coverBlobUrl);
            if (base64) setCoverBase64(base64);
          }
        }
      } else {
        setBookType("manga");
        const zip = new JSZip();
        const contents = await zip.loadAsync(selectedFile);
        
        const imageFiles = Object.keys(contents.files).filter(
          filename => !contents.files[filename].dir && filename.match(/\.(jpg|jpeg|png|webp)$/i)
        ).sort();

        if (imageFiles.length > 0) {
          const coverBlob = await contents.files[imageFiles[0]].async("blob");
          const coverBlobUrl = URL.createObjectURL(coverBlob);
          const base64 = await compressImageFromUrl(coverBlobUrl);
          if (base64) setCoverBase64(base64);
        }
      }
    } catch (err) {
      console.error("Gagal mengekstrak metadata:", err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndExtractFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndExtractFile(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (!file || !title) {
      setError("File ePub dan Judul Buku wajib diisi.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const bookId = `custom-${Date.now()}`;
      
      // Pilih background cover berdasarkan huruf pertama judul (untuk gradasi kustom)
      const gradients = [
        "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=400&h=600&q=80",
        "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=400&h=600&q=80",
        "https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=400&h=600&q=80",
        "https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?auto=format&fit=crop&w=400&h=600&q=80"
      ];
      const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

      const newBook = {
        id: bookId,
        title: title,
        author: author || (bookType === "manga" ? "Manga Artist" : bookType === "manhwa" ? "Manhwa Artist" : "Penulis Tidak Diketahui"),
        coverUrl: coverBase64 || randomGradient,
        epubUrl: `custom://${bookId}`, 
        genreId: "custom",
        description: `Koleksi ${bookType} yang diunggah secara kustom dari perangkat Anda.`,
        publishYear: new Date().getFullYear(),
        type: bookType,
      };

      await addCustomBook(newBook, file);
      
      // Reset state and close
      setFile(null);
      setTitle("");
      setCoverBase64(null);
      onClose();
    } catch (err) {
      setError("Gagal menyimpan buku. Pastikan memori browser Anda mencukupi.");
    } finally {
      setIsSaving(false);
    }
  };

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
            className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BookPlus size={22} className="text-purple-400" />
                Tambah Buku Baru
              </h2>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-white transition-colors p-1 rounded-full hover:bg-zinc-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Dropzone */}
              {!file ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                    isDragging
                      ? "border-purple-500 bg-purple-500/10 scale-102"
                      : "border-zinc-700 bg-zinc-900/50 hover:border-purple-500/50 hover:bg-zinc-800/50"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".epub,.cbz,.zip"
                    className="hidden"
                  />
                  <motion.div
                    animate={{ y: isDragging ? -5 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <UploadCloud size={48} className={`mb-4 ${isDragging ? "text-purple-400" : "text-zinc-500"}`} />
                  </motion.div>
                  <p className="text-white font-bold text-lg mb-1 text-center">
                    Tarik & Lepas File .epub atau .cbz
                  </p>
                  <p className="text-zinc-400 text-sm text-center">
                    atau klik untuk mencari file di perangkat Anda
                  </p>
                </div>
              ) : (
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-4 flex flex-col items-center gap-4 mb-6 relative overflow-hidden">
                  {/* Tampilkan Preview Cover jika ada */}
                  {coverBase64 ? (
                    <div className="w-24 h-36 rounded-lg shadow-lg overflow-hidden border border-zinc-700 shrink-0">
                      <img src={coverBase64} alt="Book Cover" className="w-full h-full object-cover" />
                    </div>
                  ) : isExtracting ? (
                    <div className="w-24 h-36 rounded-lg bg-zinc-800 border border-zinc-700 flex flex-col items-center justify-center text-zinc-500 shrink-0">
                      <Loader2 size={24} className="animate-spin mb-2" />
                      <span className="text-[10px] uppercase font-bold tracking-widest">Ekstrak...</span>
                    </div>
                  ) : (
                    <div className="w-24 h-36 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 shrink-0">
                      <ImageIcon size={32} />
                    </div>
                  )}

                  <div className="flex-1 w-full text-center">
                    <p className="text-white font-medium truncate w-full px-4">{title || file.name}</p>
                    <p className="text-zinc-400 text-xs mt-1">
                      {isExtracting ? "Membaca metadata buku..." : `${(file.size / 1024 / 1024).toFixed(2)} MB`}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setFile(null);
                      setCoverBase64(null);
                      setTitle("");
                      setAuthor("");
                    }}
                    className="absolute top-2 right-2 text-zinc-400 hover:text-red-400 transition-colors p-2 bg-zinc-900/80 rounded-full backdrop-blur-sm"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {error && <p className="text-red-400 text-sm mt-3 font-medium bg-red-400/10 p-3 rounded-xl border border-red-400/20">{error}</p>}

              {/* Form Input */}
              {file && (
                <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Judul Buku</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Masukkan judul buku..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Penulis (Opsional)</label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Masukkan nama penulis..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-zinc-600"
                    />
                  </div>
                  {file.name.toLowerCase().match(/\.(cbz|zip)$/) && (
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Tipe Komik</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
                          <input 
                            type="radio" 
                            name="bookType" 
                            value="manga" 
                            checked={bookType === "manga"} 
                            onChange={() => setBookType("manga")}
                            className="accent-purple-500"
                          />
                          Manga
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
                          <input 
                            type="radio" 
                            name="bookType" 
                            value="manhwa" 
                            checked={bookType === "manhwa"} 
                            onChange={() => setBookType("manhwa")}
                            className="accent-purple-500"
                          />
                          Manhwa
                        </label>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSave}
                    disabled={isSaving || !title}
                    className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Menyimpan ke Pustaka...
                      </>
                    ) : (
                      "Tambahkan Buku"
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
