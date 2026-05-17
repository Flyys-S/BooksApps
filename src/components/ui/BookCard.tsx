import { Play, Pause } from "lucide-react";
import { Book } from "@/data/mockData";

interface BookCardProps {
  book: Book;
  isCurrent: boolean;
  isPlaying: boolean;
  onPlayBook: (book: Book, e: React.MouseEvent) => void;
  onClick: () => void;
}

export default function BookCard({ book, isCurrent, isPlaying, onPlayBook, onClick }: BookCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-zinc-900/30 hover:bg-zinc-900 border border-zinc-800/40 p-4 rounded-3xl cursor-pointer transition-all duration-300 group flex flex-col justify-between shadow-md"
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
          {/* Play Overlay */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={(e) => onPlayBook(book, e)}
              className="w-12 h-12 bg-green-500 rounded-full text-black items-center justify-center shadow-2xl hover:scale-105 transition-transform flex"
            >
              {isCurrent && isPlaying ? (
                <Pause size={20} fill="black" />
              ) : (
                <Play size={20} fill="black" className="ml-0.5" />
              )}
            </button>
          </div>
        </div>
        <h3 className={`text-sm font-bold truncate pr-2 ${isCurrent ? "text-green-500" : "text-white"}`}>
          {book.title}
        </h3>
        <p className="text-xs text-zinc-400 truncate mt-1">{book.author}</p>
      </div>
    </div>
  );
}
