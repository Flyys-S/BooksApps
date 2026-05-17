"use client";

import { useState, useEffect } from "react";
import { useReaderStore } from "@/store/useReaderStore";
import { X, Type, Settings, Moon, Sun, BookOpen, Heart, Bookmark, Trash2, Quote } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

// Dynamic import with SSR disabled to prevent Node.js execution error of window/document APIs in ePub.js
const EpubReader = dynamic(() => import("./EpubReader"), {
  ssr: false,
  loading: () => <LoadingView />
});

const ComicReader = dynamic(() => import("./ComicReader"), {
  ssr: false,
  loading: () => <LoadingView />
});

const LoadingView = () => (
  <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950/40 backdrop-blur-md animate-in fade-in duration-500">
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-20 h-20 flex items-center justify-center">
        {/* Outer glowing spinning ring */}
        <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 border-r-pink-500 rounded-full animate-spin shadow-[0_0_20px_rgba(168,85,247,0.4)]" />
        {/* Inner spinning ring in opposite direction */}
        <div className="absolute w-12 h-12 border-4 border-transparent border-b-purple-400 border-l-pink-400 rounded-full animate-spin [animation-direction:reverse] opacity-75" />
        {/* Center icon */}
        <BookOpen className="w-6 h-6 text-purple-400 animate-pulse" />
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-zinc-200 font-bold text-sm tracking-wide animate-pulse">Mempersiapkan Buku</p>
        <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">Menyusun Teks Editorial...</p>
      </div>
    </div>
  </div>
);

export default function FullscreenReader() {
  const {
    currentBook,
    isPlaying,
    theme,
    fontSize,
    fontFamily,
    lineHeight,
    margins,
    likedBookIds,
    bookmarks,
    quotes,
    currentCfi,
    progressPercent,
    currentChapterTitle,
    pauseBook,
    setTheme,
    setFontSize,
    setFontFamily,
    setLineHeight,
    setMargins,
    toggleLikeBook,
    addBookmark,
    removeBookmark,
    removeQuote,
    jumpToCfi,
    addReadingMinutes,
  } = useReaderStore();
  
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<"settings" | "bookmarks" | "quotes">("settings");

  useEffect(() => {
    if (!currentBook || !isPlaying) return;

    // Tambah 1 menit membaca setiap 60 detik
    const timer = setInterval(() => {
      addReadingMinutes(1);
    }, 60000);

    return () => clearInterval(timer);
  }, [currentBook, isPlaying, addReadingMinutes]);

  if (!currentBook || !isPlaying) return null;

  const bgColors = {
    light: "bg-white text-zinc-900",
    sepia: "bg-[#F4ECD8] text-[#433422]",
    dark: "bg-[#121212] text-zinc-100",
  };

  const isLiked = likedBookIds.includes(currentBook.id);
  const bookBookmarks = bookmarks[currentBook.id] || [];
  const bookQuotes = quotes[currentBook.id] || [];
  const isBookmarked = bookBookmarks.some((b) => b.cfi === currentCfi);

  const handleBookmarkToggle = () => {
    if (!currentCfi) return;
    if (isBookmarked) {
      removeBookmark(currentBook.id, currentCfi);
    } else {
      addBookmark(currentBook.id, currentCfi, progressPercent, currentChapterTitle);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        layoutId="reader-card"
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: "spring", damping: 25, stiffness: 120 }}
        className={`fixed inset-0 z-50 flex flex-col ${bgColors[theme]} overflow-hidden`}
      >
        {/* Header Bar */}
        <header className="h-16 border-b border-zinc-800/30 flex items-center justify-between px-6 bg-zinc-900/10 backdrop-blur-md relative z-40">
          {/* Back/Close Button */}
          <button
            onClick={pauseBook}
            className="p-2 hover:bg-zinc-800/20 rounded-full transition-all duration-300 active:scale-95"
            title="Keluar Layar Penuh"
          >
            <X size={20} />
          </button>

          {/* Book Meta */}
          <div className="text-center min-w-0 flex-1 px-4">
            <h2 className="text-sm font-bold truncate tracking-wide">{currentBook.title}</h2>
            <p className="text-xs opacity-75 truncate">oleh {currentBook.author}</p>
          </div>

          {/* Settings & Controls */}
          <div className="flex items-center gap-2 relative">
            <button
              onClick={() => toggleLikeBook(currentBook.id)}
              className={`p-2 hover:bg-zinc-800/20 rounded-full transition-all duration-300 active:scale-95 ${
                isLiked ? "text-rose-500" : "opacity-80"
              }`}
              title={isLiked ? "Batal Suka" : "Sukai Buku"}
            >
              <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
            </button>

            {/* Toggle Bookmark Ribbon Button */}
            <button
              onClick={handleBookmarkToggle}
              className={`p-2 hover:bg-zinc-800/20 rounded-full transition-all duration-300 active:scale-95 ${
                isBookmarked ? "text-amber-500" : "opacity-80"
              }`}
              title={isBookmarked ? "Hapus Penanda Buku" : "Tandai Halaman Ini"}
            >
              <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 hover:bg-zinc-800/20 rounded-full transition-all duration-300 active:scale-95 ${
                showSettings ? "bg-zinc-800/40 text-purple-500 scale-105" : "opacity-80"
              }`}
              title="Pengaturan Pembaca"
            >
              <Type size={20} />
            </button>
          </div>

          {/* Floating Settings Popover Panel with Style, Bookmarks, and Quotes tabs */}
          {showSettings && (
            <div className="absolute right-6 top-14 bg-zinc-900 border border-zinc-800 text-white rounded-2xl p-5 shadow-2xl flex flex-col gap-4 w-80 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
              
              {/* Tab Selector */}
              <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800/50">
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`flex-1 py-1.5 text-[10px] font-extrabold rounded-lg transition-all duration-300 flex items-center justify-center gap-1 ${
                    activeTab === "settings"
                      ? "bg-purple-600 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Settings size={12} /> Gaya
                </button>
                <button
                  onClick={() => setActiveTab("bookmarks")}
                  className={`flex-1 py-1.5 text-[10px] font-extrabold rounded-lg transition-all duration-300 flex items-center justify-center gap-1 ${
                    activeTab === "bookmarks"
                      ? "bg-purple-600 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Bookmark size={12} /> Penanda ({bookBookmarks.length})
                </button>
                <button
                  onClick={() => setActiveTab("quotes")}
                  className={`flex-1 py-1.5 text-[10px] font-extrabold rounded-lg transition-all duration-300 flex items-center justify-center gap-1 ${
                    activeTab === "quotes"
                      ? "bg-purple-600 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Quote size={12} /> Kutipan ({bookQuotes.length})
                </button>
              </div>

              {activeTab === "settings" && (
                <div className="flex flex-col gap-4 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                  {/* Theme Selector */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider">Tema Latar Belakang</span>
                    <div className="flex gap-2">
                      {(["light", "sepia", "dark"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTheme(t)}
                          className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-xl transition-all duration-300 capitalize border ${
                            theme === t
                              ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/30 scale-[1.02]"
                              : "bg-zinc-850 border-zinc-800 hover:bg-zinc-800 text-zinc-300"
                          }`}
                        >
                          {t === "light" ? "Terang" : t === "sepia" ? "Sepia" : "Gelap"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Size Adjuster */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider">Ukuran Huruf</span>
                      <span className="text-[11px] font-black text-purple-400">{fontSize}%</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFontSize(Math.max(60, fontSize - 10))}
                        className="flex-1 py-1.5 bg-zinc-850 border border-zinc-850 hover:bg-zinc-800 hover:border-zinc-700 font-black text-xs rounded-xl transition-all duration-300 active:scale-95"
                        title="Kecilkan Font"
                      >
                        A-
                      </button>
                      <button
                        onClick={() => setFontSize(Math.min(180, fontSize + 10))}
                        className="flex-1 py-1.5 bg-zinc-850 border border-zinc-850 hover:bg-zinc-800 hover:border-zinc-700 font-black text-xs rounded-xl transition-all duration-300 active:scale-95"
                        title="Besarkan Font"
                      >
                        A+
                      </button>
                    </div>
                  </div>

                  {/* Font Family Selector */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider">Gaya Huruf (Font)</span>
                    <div className="flex gap-2">
                      {(["sans", "serif", "mono"] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setFontFamily(f)}
                          className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-xl transition-all duration-300 border ${
                            fontFamily === f
                              ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/30 scale-[1.02]"
                              : "bg-zinc-850 border-zinc-800 hover:bg-zinc-800 text-zinc-300"
                          }`}
                          style={{
                            fontFamily: f === "sans" 
                              ? "sans-serif" 
                              : f === "serif" 
                                ? "Georgia, serif" 
                                : "monospace"
                          }}
                        >
                          {f === "sans" ? "Modern" : f === "serif" ? "Klasik" : "Kode"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Line Height Selector */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider">Jarak Baris (Spasi)</span>
                    <div className="flex gap-2">
                      {(["tight", "normal", "loose"] as const).map((h) => (
                        <button
                          key={h}
                          onClick={() => setLineHeight(h)}
                          className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-xl transition-all duration-300 border ${
                            lineHeight === h
                              ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/30 scale-[1.02]"
                              : "bg-zinc-850 border-zinc-800 hover:bg-zinc-800 text-zinc-300"
                          }`}
                        >
                          {h === "tight" ? "Rapat" : h === "normal" ? "Sedang" : "Renggang"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Margin Width Selector */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider">Lebar Membaca (Margin)</span>
                    <div className="flex gap-2">
                      {(["narrow", "normal", "wide"] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setMargins(m)}
                          className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-xl transition-all duration-300 border ${
                            margins === m
                              ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/30 scale-[1.02]"
                              : "bg-zinc-850 border-zinc-800 hover:bg-zinc-800 text-zinc-300"
                          }`}
                        >
                          {m === "narrow" ? "Fokus" : m === "normal" ? "Standar" : "Luas"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "bookmarks" && (
                <div className="flex flex-col gap-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-850 scrollbar-track-transparent pr-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Daftar Penanda</span>
                    {bookBookmarks.length > 0 && (
                      <span className="text-[9px] text-zinc-500 font-medium">Klik untuk melompat</span>
                    )}
                  </div>

                  {bookBookmarks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-zinc-500 gap-1.5">
                      <Bookmark size={24} className="opacity-40 text-purple-400" />
                      <p className="text-xs font-semibold text-zinc-300">Belum ada penanda</p>
                      <p className="text-[10px] opacity-75">Klik ikon pita penanda di pojok kanan atas untuk menandai halaman membaca saat ini.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {bookBookmarks.map((bookmark) => (
                        <div
                          key={bookmark.cfi}
                          onClick={() => jumpToCfi(bookmark.cfi)}
                          className="flex items-center justify-between p-2.5 bg-zinc-800/40 border border-zinc-800/80 hover:border-purple-500/40 hover:bg-zinc-800 rounded-xl cursor-pointer group transition-all duration-300 animate-in fade-in duration-200"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="text-xs font-bold text-zinc-200 truncate group-hover:text-purple-400 transition-colors duration-300">
                              {bookmark.chapterTitle}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-zinc-500 font-semibold uppercase">
                              <span className="text-purple-400">{bookmark.percent}% progres</span>
                              <span>•</span>
                              <span>{new Date(bookmark.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeBookmark(currentBook.id, bookmark.cfi);
                            }}
                            className="p-1.5 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-zinc-500 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
                            title="Hapus Penanda"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "quotes" && (
                <div className="flex flex-col gap-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-850 scrollbar-track-transparent pr-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Daftar Kutipan</span>
                    {bookQuotes.length > 0 && (
                      <span className="text-[9px] text-zinc-500 font-medium">Klik untuk melompat</span>
                    )}
                  </div>

                  {bookQuotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-zinc-500 gap-1.5">
                      <Quote size={24} className="opacity-40 text-amber-500" />
                      <p className="text-xs font-semibold text-zinc-300">Belum ada kutipan</p>
                      <p className="text-[10px] opacity-75">Seleksi teks di dalam buku, lalu klik kanan atau gunakan menu melayang untuk menyimpan kutipan.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {bookQuotes.map((quote) => (
                        <div
                          key={quote.cfi}
                          onClick={() => jumpToCfi(quote.cfi)}
                          className="flex flex-col gap-1.5 p-2.5 bg-zinc-800/40 border border-zinc-800/80 hover:border-amber-500/40 hover:bg-zinc-800 rounded-xl cursor-pointer group transition-all duration-300 relative animate-in fade-in duration-200"
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] text-amber-400 font-extrabold uppercase tracking-wider truncate max-w-[80%]">
                              {quote.chapterTitle}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeQuote(currentBook.id, quote.cfi);
                              }}
                              className="p-1 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-zinc-500 hover:text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 absolute right-2 top-2"
                              title="Hapus Kutipan"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                          
                          <p className="text-xs italic text-zinc-300 pr-2 pl-2 border-l-2 border-amber-500/60 line-clamp-3 leading-relaxed">
                            "{quote.text}"
                          </p>

                          <span className="text-[8px] text-zinc-500 font-bold self-end uppercase">
                            {new Date(quote.createdAt).toLocaleDateString("id-ID", { month: "short", day: "numeric" })} • {new Date(quote.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </header>

        {/* Document Viewport */}
        {currentBook.type === "manga" || currentBook.type === "manhwa" ? (
          <ComicReader />
        ) : (
          <EpubReader book={currentBook} />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
