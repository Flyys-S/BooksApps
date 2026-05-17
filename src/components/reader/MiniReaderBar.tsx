"use client";

import { useReaderStore } from "@/store/useReaderStore";
import { Play, Pause, X, Maximize2 } from "lucide-react";

export default function MiniReaderBar() {
  const { currentBook, isPlaying, progressPercent, currentChapterTitle, playBook, pauseBook, closeBook } = useReaderStore();

  if (!currentBook) return null;

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-md border-t border-border flex flex-col z-30 transition-all duration-300">
      {/* 2px Progress bar at the top */}
      <div className="w-full h-[2px] bg-border">
        <div
          className="h-full bg-gradient-to-r from-accent to-accent-secondary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex-1 flex items-center justify-between px-4 md:px-6">
        {/* Book Info */}
        <div
          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
          onClick={() => currentBook && playBook(currentBook)}
        >
          <img
            src={currentBook.coverUrl}
            alt={currentBook.title}
            className="w-10 h-10 rounded-md border border-border object-cover flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=100&h=100&q=80";
            }}
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-foreground truncate">{currentBook.title}</h4>
            <p className="text-xs text-muted truncate">
              {currentBook.author} • <span className="text-accent">{currentChapterTitle}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 md:gap-4 ml-4">
          <button
            onClick={() => (isPlaying ? pauseBook() : playBook(currentBook))}
            className="p-2 bg-foreground rounded-full text-background hover:scale-105 transition-transform duration-300 flex items-center justify-center"
          >
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          </button>
          
          <button
            onClick={() => playBook(currentBook)}
            className="p-2 text-muted hover:text-foreground hover:bg-surface-hover rounded-full transition-all duration-300"
            title="Buka Layar Penuh"
          >
            <Maximize2 size={16} />
          </button>

          <button
            onClick={closeBook}
            className="p-2 text-muted hover:text-foreground hover:bg-surface-hover rounded-full transition-all duration-300"
            title="Tutup Buku"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
