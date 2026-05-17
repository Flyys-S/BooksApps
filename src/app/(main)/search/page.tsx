"use client";

import { useState } from "react";
import { mockBooks, mockGenres } from "@/data/mockData";
import { useReaderStore } from "@/store/useReaderStore";
import { Search } from "lucide-react";
import BookCard from "@/components/ui/BookCard";
import GenreCard from "@/components/ui/GenreCard";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { currentBook, isPlaying, playBook, pauseBook, customBooks } = useReaderStore();

  const handlePlayBook = (book: any, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (currentBook?.id === book.id && isPlaying) {
      pauseBook();
    } else {
      playBook(book);
    }
  };

  const allBooks = [...customBooks, ...mockBooks];

  const filteredBooks = allBooks.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-full px-6 py-8 md:px-10 md:py-10 max-w-7xl mx-auto">
      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-6">Jelajah</h1>

      {/* Persistent Live Search Input bar */}
      <div className="relative max-w-lg mb-10 group">
        <Search className="absolute left-4 top-3.5 text-muted group-focus-within:text-accent transition-colors duration-300 w-5 h-5" />
        <input
          type="text"
          placeholder="Apa yang ingin kamu baca hari ini?"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-surface border border-border focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent text-sm rounded-full text-foreground placeholder-muted transition-all duration-300 shadow-lg"
        />
      </div>

      {/* Results View */}
      {searchQuery ? (
        <section className="mb-10">
          <h2 className="text-lg font-bold text-foreground mb-4 tracking-wide">Hasil Pencarian</h2>
          {filteredBooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredBooks.map((book) => (
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
            <div className="text-center py-16 text-muted border border-border/30 rounded-3xl bg-surface/50">
              Buku yang kamu cari tidak ditemukan. Coba judul lain!
            </div>
          )}
        </section>
      ) : (
        /* Genre Category Card Grid */
        <section>
          <h2 className="text-lg md:text-xl font-bold text-foreground mb-6 tracking-wide">Semua Kategori</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {mockGenres.map((genre) => (
              <GenreCard key={genre.id} genre={genre} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
