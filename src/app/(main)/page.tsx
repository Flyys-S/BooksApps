"use client";

import { useEffect, useState } from "react";
import { mockBooks, mockUser } from "@/data/mockData";
import { useReaderStore } from "@/store/useReaderStore";
import { Play, Pause, BookOpen, Clock, Flame, Plus, Compass, Layers } from "lucide-react";
import { motion } from "framer-motion";
import AddBookModal from "@/components/modals/AddBookModal";

export default function HomePage() {
  const [greeting, setGreeting] = useState("Selamat Datang");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { currentBook, isPlaying, playBook, pauseBook, bookProgress, customBooks, userProfile } = useReaderStore();
  const [filter, setFilter] = useState<"all" | "book" | "manga" | "manhwa">("all");

  const allBooks = [...customBooks, ...mockBooks];
  const displayBooks = allBooks.filter(book => {
    const type = book.type || "book";
    return filter === "all" || type === filter;
  });

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 12) setGreeting("Selamat Pagi");
    else if (hours >= 12 && hours < 16) setGreeting("Selamat Siang");
    else if (hours >= 16 && hours < 19) setGreeting("Selamat Sore");
    else setGreeting("Selamat Malam");
  }, []);

  const handlePlayBook = (book: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentBook?.id === book.id && isPlaying) {
      pauseBook();
    } else {
      playBook(book);
    }
  };

  // Ambil buku yang paling terakhir dibaca/berprogres berdasarkan updatedAt
  const lastReadBook = allBooks.length > 0 
    ? [...allBooks]
        .filter((b) => bookProgress[b.id] !== undefined)
        .sort((a, b) => {
          const timeA = (bookProgress[a.id] as any).updatedAt || 0;
          const timeB = (bookProgress[b.id] as any).updatedAt || 0;
          return timeB - timeA;
        })[0] || allBooks[0]
    : null;

  const lastProgress = lastReadBook ? (bookProgress[lastReadBook.id] || { percent: 0 }) : { percent: 0 };

  return (
    <div className="min-h-full px-6 py-8 md:px-10 md:py-10 max-w-7xl mx-auto">
      {/* Dynamic Header Greeting */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <span>{greeting}</span>
            <span className="text-accent">{userProfile.fullName.split(" ")[0]}!</span>
          </h1>
          <p className="text-muted text-sm mt-1">Lanjutkan petualangan membacamu hari ini.</p>
        </div>

        {/* Mini Stats Banner & Add Button */}
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-accent to-accent-secondary hover:from-accent/90 hover:to-accent-secondary/90 text-white px-4 py-2 rounded-2xl shadow-lg transition-all active:scale-95 animate-pulse-subtle"
          >
            <Plus size={18} />
            <span className="text-sm font-bold">Tambah Buku</span>
          </button>
          <div className="flex items-center gap-2 bg-surface border border-border px-4 py-2 rounded-2xl shadow-lg hidden sm:flex">
            <Clock size={16} className="text-accent" />
            <span className="text-xs font-bold text-foreground">{userProfile.minutesRead} Menit</span>
          </div>
          <div className="flex items-center gap-2 bg-surface border border-border px-4 py-2 rounded-2xl shadow-lg hidden sm:flex">
            <Flame size={16} className="text-orange-500" />
            <span className="text-xs font-bold text-foreground">{userProfile.currentStreak} Hari Beruntun</span>
          </div>
        </div>
      </header>

      {/* Quick Grid (Like Spotify's 6 Shortcuts Grid) */}
      <section className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg md:text-xl font-bold text-foreground tracking-wide">Pustaka Utama</h2>
          
          {/* Pill Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {[
              { id: "all", label: "Semua" },
              { id: "book", label: "Buku", icon: <BookOpen size={14} /> },
              { id: "manga", label: "Manga", icon: <Compass size={14} /> },
              { id: "manhwa", label: "Manhwa", icon: <Layers size={14} /> }
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setFilter(pill.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 border ${
                  filter === pill.id
                    ? "bg-accent text-white border-accent shadow-lg shadow-accent/20"
                    : "bg-surface text-muted border-border hover:border-accent/50 hover:text-foreground"
                }`}
              >
                {pill.icon}
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {displayBooks.length === 0 ? (
          <div className="bg-surface/40 border border-dashed border-border rounded-3xl p-10 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center text-accent mb-4">
              <BookOpen size={32} />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Pustaka Anda Masih Kosong</h3>
            <p className="text-muted max-w-sm mb-6">Mulai tambahkan koleksi buku EPUB pertama Anda untuk merasakan pengalaman membaca yang premium.</p>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-accent hover:bg-accent/80 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-accent/20 transition-all flex items-center gap-2"
            >
              <Plus size={18} />
              Tambahkan Buku Sekarang
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayBooks.slice(0, 6).map((book) => {
              const isCurrent = currentBook?.id === book.id;
              return (
                <div
                  key={book.id}
                  onClick={() => playBook(book)}
                  className="flex items-center gap-4 bg-surface border border-border rounded-xl hover:bg-surface-hover transition-all duration-300 cursor-pointer overflow-hidden group shadow-md"
                >
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-20 h-20 object-cover flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=100&h=100&q=80";
                    }}
                  />
                  <div className="flex-1 min-w-0 pr-4 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <h3 className={`text-sm font-bold truncate ${isCurrent ? "text-accent" : "text-foreground"}`}>
                        {book.title}
                      </h3>
                      <p className="text-xs text-muted truncate mt-0.5">{book.author}</p>
                    </div>
                    {/* Floating Green Play Button on Hover */}
                    <button
                      onClick={(e) => handlePlayBook(book, e)}
                      className="w-10 h-10 bg-accent rounded-full text-white items-center justify-center shadow-lg transition-all duration-300 opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-105 flex flex-shrink-0 group-hover:bg-accent/80"
                    >
                      {isCurrent && isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" className="ml-0.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Continue Reading & Featured Split Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Continue Reading */}
        <section className="lg:col-span-2">
          <h2 className="text-lg md:text-xl font-bold text-foreground mb-4 tracking-wide">Terakhir Dibaca</h2>
          {lastReadBook ? (
            <div className="bg-gradient-to-br from-surface to-surface-hover border border-border p-6 rounded-3xl relative overflow-hidden group shadow-xl flex flex-col md:flex-row gap-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl group-hover:bg-accent/20 transition-all duration-500" />
              
              <img
                src={lastReadBook.coverUrl}
                alt={lastReadBook.title}
                className="w-32 h-44 rounded-2xl border border-border object-cover shadow-2xl flex-shrink-0 hover:scale-102 transition-transform duration-300 cursor-pointer self-center"
                onClick={() => playBook(lastReadBook)}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=150&h=200&q=80";
                }}
              />

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-extrabold tracking-wider bg-accent/20 text-accent border border-accent/40 px-3 py-1 rounded-full uppercase">
                    {lastProgress.percent > 0 ? `Lanjutkan: ${(lastProgress as any).chapterTitle || "Bab Awal"}` : "Mulai Membaca"}
                  </span>
                  <h3
                    onClick={() => playBook(lastReadBook)}
                    className="text-xl md:text-2xl font-black text-foreground hover:text-accent transition-colors duration-300 mt-3 cursor-pointer tracking-tight"
                  >
                    {lastReadBook.title}
                  </h3>
                  <p className="text-sm text-muted mt-1">oleh {lastReadBook.author}</p>
                  <p className="text-xs text-muted mt-3 line-clamp-3 leading-relaxed">
                    {lastReadBook.description}
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-bold text-muted">
                    <span>Progres Membaca</span>
                    <span className="text-accent">{lastProgress.percent}%</span>
                  </div>
                  <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-accent to-accent-secondary rounded-full transition-all duration-500" 
                      style={{ width: `${lastProgress.percent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface border border-border h-full min-h-[250px] rounded-3xl flex items-center justify-center p-6 text-center">
              <div>
                <p className="text-muted italic">Belum ada buku yang dibaca.</p>
              </div>
            </div>
          )}
        </section>

        {/* Quick Recommendation / Quote Box */}
        <section className="flex flex-col">
          <h2 className="text-lg md:text-xl font-bold text-foreground mb-4 tracking-wide">Rekomendasi Hari Ini</h2>
          <div className="flex-1 bg-gradient-to-tr from-accent/20 to-accent-secondary/10 border border-accent/30 p-6 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-accent-secondary/10 rounded-full blur-2xl" />
            
            <div className="space-y-4">
              <BookOpen className="w-10 h-10 text-accent animate-bounce" />
              <p className="text-base md:text-lg font-bold text-foreground italic leading-relaxed tracking-tight">
                "Buku adalah pesawat, kereta api, dan jalan. Mereka adalah tujuan, sekaligus perjalanan. Mereka adalah rumah."
              </p>
              <p className="text-xs font-semibold text-muted uppercase tracking-widest">— Anna Quindlen</p>
            </div>

            {allBooks.length > 0 && (
              <button
                onClick={() => playBook(allBooks[Math.floor(Math.random() * allBooks.length)])}
                className="mt-6 w-full py-3 bg-gradient-to-r from-accent to-accent-secondary hover:from-accent/80 hover:to-accent-secondary/80 active:scale-98 text-white text-xs font-extrabold tracking-widest rounded-full uppercase shadow-lg shadow-accent/30 transition-all duration-300"
              >
                Buka Buku Acak
              </button>
            )}
          </div>
        </section>
      </div>

      <AddBookModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
