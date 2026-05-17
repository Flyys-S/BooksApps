import { Play, Pause, MoreVertical, Edit3, Trash2, Heart } from "lucide-react";
import { Book } from "@/data/mockData";
import { useState, useRef, useEffect } from "react";
import { useReaderStore } from "@/store/useReaderStore";

interface BookCardProps {
  book: Book;
  isCurrent: boolean;
  isPlaying: boolean;
  onPlayBook: (book: Book, e: React.MouseEvent) => void;
  onClick: () => void;
}

export default function BookCard({ book, isCurrent, isPlaying, onPlayBook, onClick }: BookCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { toggleLikeBook, likedBookIds, deleteCustomBook, customBooks, setEditingBookId } = useReaderStore();
  
  const isLiked = likedBookIds.includes(book.id);
  const isCustomBook = customBooks.some(b => b.id === book.id);

  // Handle click outside to close menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    setEditingBookId(book.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (confirm("Apakah Anda yakin ingin menghapus buku ini?")) {
      deleteCustomBook(book.id);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    toggleLikeBook(book.id);
  };

  return (
    <div
      onClick={onClick}
      className="bg-zinc-900/30 hover:bg-zinc-900 border border-zinc-800/40 p-4 rounded-3xl cursor-pointer transition-all duration-300 group flex flex-col justify-between shadow-md relative"
    >
      <div>
        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-4 shadow-lg border border-zinc-800">
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=150&h=200&q=80";
            }}
          />
          
          {/* Options Menu Button */}
          <button
            onClick={handleMenuClick}
            className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 z-10"
          >
            <MoreVertical size={16} />
          </button>

          {/* Context Menu */}
          {showMenu && (
            <div 
              ref={menuRef}
              className="absolute top-10 right-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="flex flex-col py-1">
                {isCustomBook && (
                  <button 
                    onClick={handleEdit}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    <Edit3 size={16} className="text-blue-400" />
                    Ubah Detail Buku
                  </button>
                )}
                
                <button 
                  onClick={handleLike}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  <Heart size={16} className={isLiked ? "text-rose-500 fill-rose-500" : "text-zinc-400"} />
                  {isLiked ? "Hapus dari Favorit" : "Tambah ke Favorit"}
                </button>
                
                {isCustomBook && (
                  <button 
                    onClick={handleDelete}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t border-zinc-800/50 mt-1 pt-2"
                  >
                    <Trash2 size={16} />
                    Hapus Buku
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Play Overlay */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <button
              onClick={(e) => onPlayBook(book, e)}
              className="w-12 h-12 bg-accent rounded-full text-white items-center justify-center shadow-2xl hover:scale-105 transition-transform flex pointer-events-auto"
            >
              {isCurrent && isPlaying ? (
                <Pause size={20} fill="white" />
              ) : (
                <Play size={20} fill="white" className="ml-0.5" />
              )}
            </button>
          </div>
        </div>
        <h3 className={`text-sm font-bold truncate pr-2 ${isCurrent ? "text-accent" : "text-white"}`}>
          {book.title}
        </h3>
        <p className="text-xs text-zinc-400 truncate mt-1">{book.author}</p>
      </div>
    </div>
  );
}
