"use client";

import { useEffect, useState, useRef } from "react";
import JSZip from "jszip";
import { useReaderStore } from "@/store/useReaderStore";
import { getBookFile } from "@/utils/db";
import { getFileBlobFromLibrary } from "@/utils/fileSystem";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";

export default function ComicReader() {
  const { currentBook, currentCfi, updateProgress } = useReaderStore();
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const hasRestoredScroll = useRef(false);

  // Chapter State
  const [currentChapterIndex, setCurrentChapterIndex] = useState(() => {
    if (currentCfi && currentCfi.startsWith("comic-")) {
      const parts = currentCfi.split("-"); // format: comic-{index}-{scrollTop}
      if (parts.length >= 2) {
        return parseInt(parts[1], 10) || 0;
      }
    }
    return 0;
  });

  // Track progress when chapter changes
  useEffect(() => {
    if (!currentBook?.isSeries || !currentBook.chapters) return;
    const chapterTitle = currentBook.chapters[currentChapterIndex].title;
    // Keep initial 0 scroll if we just changed chapter, actual scroll tracking happens in onScroll
    updateProgress(`comic-${currentChapterIndex}-0`, 0, chapterTitle);
    hasRestoredScroll.current = false;
  }, [currentChapterIndex]);

  // Debounced scroll handler for saving position
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const handleScroll = () => {
    if (!currentBook?.isSeries || !currentBook.chapters) return;
    
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    
    scrollTimeout.current = setTimeout(() => {
      const container = document.getElementById('comic-scroll-container');
      if (container) {
        const scrollTop = Math.round(container.scrollTop);
        const percent = Math.round((scrollTop / (container.scrollHeight - container.clientHeight)) * 100);
        const cfi = `comic-${currentChapterIndex}-${scrollTop}`;
        updateProgress(cfi, percent || 0, currentBook.chapters![currentChapterIndex].title);
      }
    }, 500); // debounce 500ms
  };

  useEffect(() => {
    const loadCbz = async () => {
      if (!currentBook) return;
      
      try {
        setLoading(true);
        setError("");
        setImages([]);

        let fileBlob: Blob | null = null;

        if (currentBook.isSeries && currentBook.chapters && currentBook.chapters.length > 0) {
          // It's a series, load the specific chapter based on currentChapterIndex
          const chapterPath = currentBook.chapters[currentChapterIndex].relativePath;
          fileBlob = await getFileBlobFromLibrary(chapterPath);
          if (!fileBlob) throw new Error("Gagal membaca file bab dari folder lokal.");
        } else if (!currentBook.epubUrl.startsWith("http") && !currentBook.epubUrl.startsWith("/") && !currentBook.epubUrl.startsWith("custom://")) {
          // Single local file
          fileBlob = await getFileBlobFromLibrary(currentBook.epubUrl);
        } else {
          // IndexedDB fallback (custom:// or standard)
          fileBlob = await getBookFile(currentBook.id);
        }
        
        if (!fileBlob) throw new Error("File komik tidak ditemukan.");

        const zip = new JSZip();
        const contents = await zip.loadAsync(fileBlob);
        
        const imageFiles = Object.keys(contents.files).filter(
          name => !contents.files[name].dir && name.match(/\.(jpg|jpeg|png|webp)$/i)
        ).sort();

        const loadedImages = await Promise.all(
          imageFiles.map(async (filename) => {
            const blob = await contents.files[filename].async("blob");
            return URL.createObjectURL(blob);
          })
        );

        setImages(loadedImages);

        // Restore scroll position if this is the first load of the saved chapter
        setTimeout(() => {
          if (!hasRestoredScroll.current && currentCfi && currentCfi.startsWith(`comic-${currentChapterIndex}-`)) {
            const parts = currentCfi.split("-");
            if (parts.length >= 3) {
              const savedScrollTop = parseInt(parts[2], 10);
              if (savedScrollTop > 0) {
                document.getElementById('comic-scroll-container')?.scrollTo({ top: savedScrollTop, behavior: 'instant' });
              }
            }
          }
          hasRestoredScroll.current = true;
        }, 300); // Beri waktu gambar me-render layout-nya
      } catch (err: any) {
        console.error("Failed to load CBZ:", err);
        setError(err.message || "Gagal mengekstrak komik.");
      } finally {
        setLoading(false);
      }
    };

    loadCbz();

    return () => {
      images.forEach(URL.revokeObjectURL);
    };
  }, [currentBook?.id, currentChapterIndex]); // Reload if chapter changes

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950/40 backdrop-blur-md">
        <div className="animate-spin w-12 h-12 border-4 border-t-accent border-r-accent-secondary border-transparent rounded-full" />
        <p className="mt-4 font-bold text-foreground animate-pulse">Mengekstrak Komik...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950/40 backdrop-blur-md p-6 text-center">
        <div className="w-16 h-16 flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-2xl font-bold mb-4">
          ⚠️
        </div>
        <p className="font-bold text-white mb-2">Terjadi Kendala</p>
        <p className="text-zinc-400 text-sm">{error}</p>
      </div>
    );
  }

  const hasNextChapter = currentBook?.isSeries && currentBook.chapters && currentChapterIndex < currentBook.chapters.length - 1;
  const hasPrevChapter = currentBook?.isSeries && currentBook.chapters && currentChapterIndex > 0;

  // Tampilan Vertical Scroll (Webtoon / Manhwa)
  return (
    <div 
      className="flex-1 overflow-y-auto overflow-x-hidden bg-black flex flex-col items-center relative" 
      id="comic-scroll-container"
      onScroll={handleScroll}
    >
      {/* Sidebar Chapters */}
      <div 
        className={`fixed inset-y-0 left-0 w-72 bg-zinc-950 border-r border-zinc-800 z-[60] transform transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <h3 className="text-white font-bold">Daftar Bab</h3>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {currentBook?.chapters?.map((chapter, idx) => (
            <button
              key={chapter.id}
              onClick={() => {
                setCurrentChapterIndex(idx);
                setIsSidebarOpen(false);
                document.getElementById('comic-scroll-container')?.scrollTo(0, 0);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl mb-1 text-sm font-medium transition-all ${
                idx === currentChapterIndex 
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-[inset_0_0_10px_rgba(168,85,247,0.1)]' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 text-center ${idx === currentChapterIndex ? 'text-purple-500' : 'text-zinc-600'}`}>
                  {idx + 1}
                </span>
                <span className="truncate">{chapter.title}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Backdrop for sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Top Chapter Indicator */}
      {currentBook?.isSeries && currentBook.chapters && (
        <div className="sticky top-0 left-0 right-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent pt-4 pb-8 px-4 z-40 pointer-events-none flex justify-between items-start">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="pointer-events-auto p-2.5 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 text-white rounded-xl shadow-2xl hover:bg-zinc-800 hover:text-purple-400 transition-all hover:scale-105"
            title="Daftar Bab"
          >
            <Menu size={20} />
          </button>
          
          <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-2xl tracking-wide">
            {currentBook.chapters[currentChapterIndex].title}
          </div>
          
          <div className="w-[42px]" /> {/* Spacer agar text center seimbang dengan tombol Menu */}
        </div>
      )}

      <div className="w-full max-w-3xl flex flex-col items-center bg-black min-h-screen">
        {images.map((src, index) => (
          <img 
            key={index} 
            src={src} 
            alt={`Page ${index + 1}`} 
            className="w-full h-auto object-contain pointer-events-none select-none block m-0 p-0"
            loading="lazy"
          />
        ))}
      </div>
      
      {/* Chapter Navigation End of File */}
      <div className="w-full py-12 flex flex-col items-center bg-zinc-950 border-t border-zinc-900 mt-8">
        <p className="text-zinc-500 font-bold text-sm mb-6 uppercase tracking-widest">Akhir Bab</p>
        
        {currentBook?.isSeries && (
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentChapterIndex(prev => prev - 1)}
              disabled={!hasPrevChapter}
              className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-800 rounded-xl text-white font-bold flex items-center gap-2 transition-all"
            >
              <ChevronLeft size={18} />
              Bab Sebelumnya
            </button>
            <button
              onClick={() => {
                setCurrentChapterIndex(prev => prev + 1);
                document.getElementById('comic-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={!hasNextChapter}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-purple-900/20"
            >
              Bab Selanjutnya
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
