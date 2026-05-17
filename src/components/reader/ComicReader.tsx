"use client";

import { useEffect, useState, useRef } from "react";
import JSZip from "jszip";
import { useReaderStore } from "@/store/useReaderStore";
import { getBookFile } from "@/utils/db";

export default function ComicReader() {
  const { currentBook } = useReaderStore();
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCbz = async () => {
      if (!currentBook) return;
      
      try {
        setLoading(true);
        const fileBlob = await getBookFile(currentBook.id);
        if (!fileBlob) throw new Error("File komik tidak ditemukan di IndexedDB");

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
      } catch (error) {
        console.error("Failed to load CBZ:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCbz();

    return () => {
      images.forEach(URL.revokeObjectURL);
    };
  }, [currentBook?.id]); // Only re-run if book ID changes

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950/40 backdrop-blur-md">
        <div className="animate-spin w-12 h-12 border-4 border-t-accent border-r-accent-secondary border-transparent rounded-full" />
        <p className="mt-4 font-bold text-foreground animate-pulse">Mengekstrak Komik...</p>
      </div>
    );
  }

  // Tampilan Vertical Scroll (Webtoon / Manhwa)
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden bg-black flex flex-col items-center" id="comic-scroll-container">
      <div className="w-full max-w-3xl flex flex-col items-center bg-black">
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
      <div className="py-20 text-center text-muted font-bold text-sm">
        Akhir Bab
      </div>
    </div>
  );
}
