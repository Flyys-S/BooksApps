import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Book } from "@/data/mockData";
import { saveBookFile, deleteBookFile } from "@/utils/db";

export interface BookmarkItem {
  cfi: string;
  percent: number;
  chapterTitle: string;
  label: string;
  createdAt: string;
}

export interface QuoteItem {
  cfi: string;
  text: string;
  chapterTitle: string;
  createdAt: string;
}

export interface ReaderState {
  currentBook: Book | null;
  currentCfi: string | null;
  currentChapterTitle: string;
  isPlaying: boolean; // Controls fullscreen overlay visibility
  progressPercent: number;
  theme: "dark" | "sepia" | "light"; // This is for Reader inside EpubReader
  fontSize: number; // Percent value (e.g. 100 for 16px)
  fontFamily: "sans" | "serif" | "mono";
  lineHeight: "tight" | "normal" | "loose";
  margins: "narrow" | "normal" | "wide";
  likedBookIds: string[];
  bookProgress: Record<string, { cfi: string; percent: number; chapterTitle: string }>;
  bookmarks: Record<string, BookmarkItem[]>;
  quotes: Record<string, QuoteItem[]>;
  customBooks: Book[];
  
  // Local Folder Sync States
  localFolderPath: string | null;
  isSyncing: boolean;

  // Global App Appearance States
  appTheme: "dark" | "light";
  appAccentColor: string;
  isOnboardingCompleted: boolean;
  editingBookId: string | null;
  userProfile: {
    username: string;
    fullName: string;
    avatarUrl: string;
    minutesRead: number;
    booksCompleted: number;
    currentStreak: number;
  };

  // Actions
  setAppTheme: (theme: "dark" | "light") => void;
  setAppAccentColor: (color: string) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  updateUserProfile: (profile: Partial<{ fullName: string; username: string; avatarUrl: string; minutesRead: number; currentStreak: number; }>) => void;
  addReadingMinutes: (minutes: number) => void;
  setLocalFolderPath: (path: string | null) => void;
  setSyncing: (syncing: boolean) => void;
  setEditingBookId: (id: string | null) => void;
  syncLocalBooks: (books: Book[]) => Promise<void>;
  
  addCustomBook: (book: Book, fileBlob: Blob) => Promise<void>;
  deleteCustomBook: (bookId: string) => Promise<void>;
  updateCustomBook: (bookId: string, updatedFields: Partial<Book>) => void;
  playBook: (book: Book) => void;
  pauseBook: () => void;
  closeBook: () => void;
  updateProgress: (cfi: string, percent: number, chapterTitle: string) => void;
  setTheme: (theme: "dark" | "sepia" | "light") => void;
  setFontSize: (size: number) => void;
  setFontFamily: (font: "sans" | "serif" | "mono") => void;
  setLineHeight: (height: "tight" | "normal" | "loose") => void;
  setMargins: (margin: "narrow" | "normal" | "wide") => void;
  toggleLikeBook: (bookId: string) => void;
  addBookmark: (bookId: string, cfi: string, percent: number, chapterTitle: string, label?: string) => void;
  removeBookmark: (bookId: string, cfi: string) => void;
  addQuote: (bookId: string, cfi: string, text: string, chapterTitle: string) => void;
  removeQuote: (bookId: string, cfi: string) => void;
  jumpToCfi: (cfi: string) => void;
}

export const useReaderStore = create(
  persist<ReaderState>(
    (set) => ({
      currentBook: null,
      currentCfi: null,
      currentChapterTitle: "Bab Awal",
      isPlaying: false,
      progressPercent: 0,
      theme: "dark",
      fontSize: 100,
      fontFamily: "sans",
      lineHeight: "normal",
      margins: "normal",
      likedBookIds: [],
      bookProgress: {},
      bookmarks: {},
      quotes: {},
      customBooks: [],
      localFolderPath: null,
      isSyncing: false,
      appTheme: "dark",
      appAccentColor: "#9333ea", // Default purple
      isOnboardingCompleted: false,
      editingBookId: null,
      userProfile: {
        username: "raflyrajwa",
        fullName: "Rafly Rajwa",
        avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80",
        minutesRead: 450,
        booksCompleted: 12,
        currentStreak: 5
      },

      setAppTheme: (theme) => {
        set({ appTheme: theme });
        if (typeof document !== "undefined") {
          if (theme === "dark") document.documentElement.classList.add("dark");
          else document.documentElement.classList.remove("dark");
        }
      },
      
      setAppAccentColor: (color) => {
        set({ appAccentColor: color });
        if (typeof document !== "undefined") {
          document.documentElement.style.setProperty("--accent-primary", color);
        }
      },

      setOnboardingCompleted: (completed) => set({ isOnboardingCompleted: completed }),

      updateUserProfile: (profile) => set((state) => ({
        userProfile: { ...state.userProfile, ...profile }
      })),

      addReadingMinutes: (minutes) => set((state) => ({
        userProfile: { ...state.userProfile, minutesRead: state.userProfile.minutesRead + minutes }
      })),

      setLocalFolderPath: (path) => set({ localFolderPath: path }),
      setSyncing: (syncing) => set({ isSyncing: syncing }),
      setEditingBookId: (id) => set({ editingBookId: id }),

      syncLocalBooks: async (books) => {
        try {
          set((state) => {
            // Menggabungkan dan menimpa array customBooks berdasarkan ID unik
            // Hapus buku-buku lama yang diawali dengan "local-" untuk me-refresh perpustakaan lokal
            const filteredCustomBooks = state.customBooks.filter(b => !b.id.startsWith("local-"));
            const newCustomBooks = [...filteredCustomBooks, ...books];
            
            return { customBooks: newCustomBooks };
          });
        } catch (error) {
          console.error("Gagal melakukan sinkronisasi buku lokal:", error);
          throw error;
        }
      },

      addCustomBook: async (book, fileBlob) => {
        try {
          await saveBookFile(book.id, fileBlob);
          set((state) => {
            // Hindari duplikasi
            const exists = state.customBooks.some((b) => b.id === book.id);
            if (exists) return state;
            return { customBooks: [book, ...state.customBooks] };
          });
        } catch (error) {
          console.error("Gagal menyimpan buku ke IndexedDB:", error);
          throw error;
        }
      },

      deleteCustomBook: async (bookId) => {
        try {
          await deleteBookFile(bookId);
          set((state) => ({
            customBooks: state.customBooks.filter((b) => b.id !== bookId),
          }));
        } catch (error) {
          console.error("Gagal menghapus buku dari IndexedDB:", error);
          throw error;
        }
      },

      updateCustomBook: (bookId, updatedFields) =>
        set((state) => {
          const updatedCustomBooks = state.customBooks.map((book) => {
            if (book.id === bookId) {
              return { ...book, ...updatedFields };
            }
            return book;
          });

          // Jika buku yang sedang dibaca di-edit, perbarui juga currentBook
          const updatedCurrentBook =
            state.currentBook?.id === bookId
              ? { ...state.currentBook, ...updatedFields }
              : state.currentBook;

          return {
            customBooks: updatedCustomBooks,
            currentBook: updatedCurrentBook,
          };
        }),

      playBook: (book) =>
        set((state) => {
          // Ambil progres tersimpan untuk buku ini jika ada
          const savedProgress = state.bookProgress[book.id] || {
            cfi: null,
            percent: 0,
            chapterTitle: "Bab Awal",
          };
          
          // Perbarui timestamp ketika buku dibuka
          const updatedProgress = {
            ...savedProgress,
            updatedAt: Date.now()
          };

          return {
            currentBook: book,
            isPlaying: true,
            currentCfi: savedProgress.cfi,
            progressPercent: savedProgress.percent,
            currentChapterTitle: savedProgress.chapterTitle,
            bookProgress: {
              ...state.bookProgress,
              [book.id]: updatedProgress
            }
          };
        }),
      
      pauseBook: () =>
        set({
          isPlaying: false,
        }),
      
      closeBook: () =>
        set({
          currentBook: null,
          isPlaying: false,
          currentCfi: null,
          currentChapterTitle: "Bab Awal",
          progressPercent: 0,
        }),

      updateProgress: (cfi, percent, chapterTitle) =>
        set((state) => {
          if (!state.currentBook) return {};
          
          // Simpan progres ke global state dan ke map bookProgress dengan timestamp terbaru
          const updatedBookProgress = {
            ...state.bookProgress,
            [state.currentBook.id]: { cfi, percent, chapterTitle, updatedAt: Date.now() },
          };

          return {
            currentCfi: cfi,
            progressPercent: percent,
            currentChapterTitle: chapterTitle,
            bookProgress: updatedBookProgress,
          };
        }),

      setTheme: (theme) =>
        set({
          theme,
        }),

      setFontSize: (size) =>
        set({
          fontSize: size,
        }),

      setFontFamily: (fontFamily) =>
        set({
          fontFamily,
        }),

      setLineHeight: (lineHeight) =>
        set({
          lineHeight,
        }),

      setMargins: (margins) =>
        set({
          margins,
        }),

      toggleLikeBook: (bookId) =>
        set((state) => {
          const isLiked = state.likedBookIds.includes(bookId);
          const newLiked = isLiked
            ? state.likedBookIds.filter((id) => id !== bookId)
            : [...state.likedBookIds, bookId];
          return { likedBookIds: newLiked };
        }),

      addBookmark: (bookId, cfi, percent, chapterTitle, label) =>
        set((state) => {
          const bookBookmarks = state.bookmarks[bookId] || [];
          // Hindari duplikasi cfi yang sama
          if (bookBookmarks.some((b) => b.cfi === cfi)) return {};

          const timeString = new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          });
          
          const newBookmark: BookmarkItem = {
            cfi,
            percent,
            chapterTitle,
            label: label || `${chapterTitle} (${percent}%) - ${timeString}`,
            createdAt: new Date().toISOString(),
          };

          return {
            bookmarks: {
              ...state.bookmarks,
              [bookId]: [newBookmark, ...bookBookmarks],
            },
          };
        }),

      removeBookmark: (bookId, cfi) =>
        set((state) => {
          const bookBookmarks = state.bookmarks[bookId] || [];
          const updatedBookmarks = bookBookmarks.filter((b) => b.cfi !== cfi);
          return {
            bookmarks: {
              ...state.bookmarks,
              [bookId]: updatedBookmarks,
            },
          };
        }),

      addQuote: (bookId, cfi, text, chapterTitle) =>
        set((state) => {
          const bookQuotes = state.quotes[bookId] || [];
          // Hindari duplikasi teks/cfi kutipan
          if (bookQuotes.some((q) => q.cfi === cfi || q.text === text)) return {};

          const newQuote: QuoteItem = {
            cfi,
            text,
            chapterTitle,
            createdAt: new Date().toISOString(),
          };

          return {
            quotes: {
              ...state.quotes,
              [bookId]: [newQuote, ...bookQuotes],
            },
          };
        }),

      removeQuote: (bookId, cfi) =>
        set((state) => {
          const bookQuotes = state.quotes[bookId] || [];
          const updatedQuotes = bookQuotes.filter((q) => q.cfi !== cfi);
          return {
            quotes: {
              ...state.quotes,
              [bookId]: updatedQuotes,
            },
          };
        }),

      jumpToCfi: (cfi) =>
        set((state) => {
          if (!state.currentBook) return {};
          
          // Dapatkan chapter dan persentase untuk cfi ini jika ada di data progres
          const bookProg = state.bookProgress[state.currentBook.id] || { percent: 0, chapterTitle: "Bab Utama" };
          
          return {
            currentCfi: cfi,
            progressPercent: bookProg.percent,
            currentChapterTitle: bookProg.chapterTitle,
          };
        }),
    }),
    {
      name: "bookify-reader-storage",
    }
  )
);
