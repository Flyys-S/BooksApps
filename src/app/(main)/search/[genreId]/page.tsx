"use client";

import { use } from "react";
import { mockBooks, mockGenres } from "@/data/mockData";
import { useReaderStore } from "@/store/useReaderStore";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import BookCard from "@/components/ui/BookCard";

interface GenrePageProps {
  params: Promise<{
    genreId: string;
  }>;
}

export default function GenreDetailPage({ params }: GenrePageProps) {
  // Await params using React.use() which is the modern standard for Next.js 15
  const { genreId } = use(params);
  
  const { currentBook, isPlaying, playBook, pauseBook } = useReaderStore();

  const genre = mockGenres.find((g) => g.id === genreId);
  const genreBooks = mockBooks.filter((b) => b.genreId === genreId);

  const handlePlayBook = (book: any, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (currentBook?.id === book.id && isPlaying) {
      pauseBook();
    } else {
      playBook(book);
    }
  };

  if (!genre) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-8">
        <p className="text-zinc-500 mb-4">Genre tidak ditemukan!</p>
        <Link href="/search" className="text-purple-500 hover:underline">
          Kembali ke Pencarian
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Header Banner with Genre Gradient background */}
      <header className={`py-16 md:py-24 px-6 md:px-10 bg-gradient-to-b ${genre.gradient} relative overflow-hidden flex flex-col justify-end min-h-[220px]`}>
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
        
        <div className="max-w-7xl mx-auto w-full relative z-10">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 font-semibold text-sm transition-all duration-300 hover:-translate-x-1"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Jelajah</span>
          </Link>
          
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none drop-shadow-md">
            {genre.name}
          </h1>
          <p className="text-white/80 text-sm mt-3 font-medium">
            Menampilkan {genreBooks.length} Buku Koleksi
          </p>
        </div>
      </header>

      {/* Book Grid */}
      <div className="px-6 py-10 md:px-10 max-w-7xl mx-auto">
        {genreBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {genreBooks.map((book) => (
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
          <div className="text-center py-20 text-zinc-500 border border-zinc-800/20 rounded-3xl bg-zinc-900/10">
            Koleksi buku untuk genre ini masih kosong. Silakan kunjungi genre yang lain!
          </div>
        )}
      </div>
    </div>
  );
}
