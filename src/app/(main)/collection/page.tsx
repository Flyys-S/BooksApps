"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { mockBooks } from "@/data/mockData";
import { useReaderStore } from "@/store/useReaderStore";
import { Heart, BookOpen } from "lucide-react";
import BookCard from "@/components/ui/BookCard";

function CollectionContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "liked" ? "liked" : "all";
  const initialType = (searchParams.get("type") as "book" | "manga" | "manhwa") || "all";
  
  const [activeTab, setActiveTab] = useState<"all" | "liked">(initialTab);
  const [filterType, setFilterType] = useState<"all" | "book" | "manga" | "manhwa">(initialType);
  const { likedBookIds, currentBook, isPlaying, playBook, pauseBook, customBooks } = useReaderStore();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "liked") setActiveTab("liked");
    else if (tab === "all") setActiveTab("all");

    const type = searchParams.get("type") as "book" | "manga" | "manhwa" | null;
    if (type) setFilterType(type);
    else setFilterType("all");
  }, [searchParams]);

  const handlePlayBook = (book: any, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (currentBook?.id === book.id && isPlaying) {
      pauseBook();
    } else {
      playBook(book);
    }
  };

  const rawBooks = [...customBooks, ...mockBooks];
  
  // Filter berdasarkan tipe
  const allBooks = rawBooks.filter((book) => {
    const type = book.type || "book";
    return filterType === "all" || type === filterType;
  });
  
  const likedBooks = allBooks.filter((book) => likedBookIds.includes(book.id));

  return (
    <div className="min-h-full px-6 py-8 md:px-10 md:py-10 max-w-7xl mx-auto">
      {/* Title Header */}
      <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-8">Perpustakaan Kamu</h1>

      {/* Tabs Menu buttons */}
      <div className="flex gap-4 border-b border-border pb-4 mb-8">
        <button
          onClick={() => setActiveTab("all")}
          className={`pb-2 text-sm font-bold transition-all duration-300 relative ${
            activeTab === "all" ? "text-accent" : "text-muted hover:text-foreground"
          }`}
        >
          Semua Koleksi
          {activeTab === "all" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("liked")}
          className={`pb-2 text-sm font-bold transition-all duration-300 relative flex items-center gap-2 ${
            activeTab === "liked" ? "text-accent" : "text-muted hover:text-foreground"
          }`}
        >
          <Heart size={14} fill={activeTab === "liked" ? "currentColor" : "none"} />
          Liked Books
          {activeTab === "liked" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
          )}
        </button>
      </div>

      {/* Library View */}
      {activeTab === "all" ? (
        <section>
          {allBooks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {allBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  isCurrent={currentBook?.id === book.id}
                  isPlaying={isPlaying}
                  onPlayBook={handlePlayBook}
                  onClick={() => playBook(book)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted border border-border/20 rounded-3xl bg-surface/50 flex flex-col items-center gap-4">
              <BookOpen size={48} className="text-muted animate-bounce" />
              <p>Belum ada buku di dalam koleksimu!</p>
            </div>
          )}
        </section>
      ) : (
        /* Liked Books Tab */
        <section>
          {likedBooks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {likedBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  isCurrent={currentBook?.id === book.id}
                  isPlaying={isPlaying}
                  onPlayBook={handlePlayBook}
                  onClick={() => playBook(book)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted border border-border/20 rounded-3xl bg-surface/50 flex flex-col items-center gap-4">
              <Heart size={48} className="text-rose-600 animate-pulse" />
              <div>
                <h3 className="text-foreground font-bold mb-1">Pustaka Favorit Masih Kosong</h3>
                <p className="text-sm">Klik ikon hati pada buku yang kamu suka untuk menyimpannya di sini!</p>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default function CollectionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-full px-6 py-8 md:px-10 md:py-10 max-w-7xl mx-auto flex items-center justify-center">
        <div className="text-muted font-medium text-sm animate-pulse">Memuat Perpustakaan...</div>
      </div>
    }>
      <CollectionContent />
    </Suspense>
  );
}
