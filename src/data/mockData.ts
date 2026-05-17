export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  epubUrl: string; // Bisa digunakan untuk file URL Blob apapun (epub/cbz)
  genreId: string;
  description: string;
  publishYear: number;
  type?: "book" | "manga" | "manhwa";
}

export interface Genre {
  id: string;
  name: string;
  gradient: string; // Tailwind gradient class
}

export interface UserStats {
  username: string;
  fullName: string;
  avatarUrl: string;
  minutesRead: number;
  booksCompleted: number;
  currentStreak: number;
}

export const mockGenres: Genre[] = [
  { id: "fiksi", name: "Fiksi Populer", gradient: "from-purple-600 to-pink-500" },
  { id: "misteri", name: "Misteri & Detektif", gradient: "from-blue-600 to-indigo-900" },
  { id: "scifi", name: "Fiksi Ilmiah", gradient: "from-cyan-500 to-blue-700" },
  { id: "klasik", name: "Karya Klasik", gradient: "from-emerald-500 to-teal-800" },
  { id: "romansa", name: "Romansa", gradient: "from-rose-500 to-red-700" },
  { id: "biografi", name: "Biografi & Memoar", gradient: "from-amber-500 to-orange-700" },
  { id: "selfhelp", name: "Pengembangan Diri", gradient: "from-yellow-500 to-amber-700" },
];

export const mockBooks: Book[] = [];

export const mockUser: UserStats = {
  username: "raflyrajwa",
  fullName: "Rafly Rajwa",
  avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80",
  minutesRead: 450,
  booksCompleted: 12,
  currentStreak: 5
};
