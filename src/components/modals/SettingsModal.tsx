import { useState, useEffect } from "react";
import { X, Settings2, FolderSync, Palette, Info, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useReaderStore } from "@/store/useReaderStore";
import { pickLocalFolder, getStoredFolderHandle, scanFolderForBooks, disconnectLocalFolder, verifyPermission, ScannedFile } from "@/utils/fileSystem";
import ePub from "epubjs";
import JSZip from "jszip";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"storage" | "appearance" | "about">("storage");
  const { localFolderPath, setLocalFolderPath, isSyncing, setSyncing, syncLocalBooks } = useReaderStore();
  const [permissionError, setPermissionError] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{message: string; progress: number} | null>(null);

  // Jika folder terhubung, periksa izin saat modal dibuka
  useEffect(() => {
    if (isOpen && localFolderPath) {
      checkFolderPermission();
    }
  }, [isOpen, localFolderPath]);

  const checkFolderPermission = async () => {
    const handle = await getStoredFolderHandle();
    if (handle) {
      const hasPermission = await verifyPermission(handle, false);
      setPermissionError(!hasPermission);
    }
  };

  const handlePickFolder = async () => {
    try {
      const handle = await pickLocalFolder();
      if (handle) {
        setLocalFolderPath(handle.name);
        setPermissionError(false);
        await performSync(handle);
      }
    } catch (error: any) {
      console.error(error);
    }
  };

  const performSync = async (handle: FileSystemDirectoryHandle) => {
    setSyncing(true);
    setSyncStatus({ message: "Memindai folder...", progress: 0 });
    
    try {
      const scannedItems = await scanFolderForBooks(handle);
      
      if (scannedItems.length === 0) {
        setSyncStatus({ message: "Tidak ada file buku/komik ditemukan.", progress: 100 });
        setTimeout(() => setSyncStatus(null), 3000);
        setSyncing(false);
        return;
      }

      const booksToSave = [];
      const filesToSave = [];

      for (let i = 0; i < scannedItems.length; i++) {
        const item = scannedItems[i];
        setSyncStatus({ message: `Mengekstrak metadata (${i + 1}/${scannedItems.length})...`, progress: Math.round((i / scannedItems.length) * 100) });
        
        try {
          if (item.type === "book") {
            const bookData = await extractEpubMetadata(item.file);
            bookData.type = "book";
            booksToSave.push(bookData);
            filesToSave.push({ id: bookData.id, file: item.file });
          } else {
            const bookData = await extractCbzMetadata(item.file, item.type);
            booksToSave.push(bookData);
            filesToSave.push({ id: bookData.id, file: item.file });
          }
        } catch (err) {
          console.warn(`Gagal memproses file ${item.file.name}:`, err);
        }
      }

      setSyncStatus({ message: "Menyimpan ke IndexedDB...", progress: 95 });
      await syncLocalBooks(booksToSave, filesToSave);
      
      setSyncStatus({ message: "Sinkronisasi berhasil!", progress: 100 });
      setTimeout(() => setSyncStatus(null), 3000);

    } catch (error) {
      console.error("Gagal sinkronisasi:", error);
      setSyncStatus({ message: "Terjadi kesalahan saat sinkronisasi.", progress: 100 });
      setTimeout(() => setSyncStatus(null), 3000);
    } finally {
      setSyncing(false);
    }
  };

  const extractCbzMetadata = async (file: File, type: "manga" | "manhwa"): Promise<any> => {
    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      
      const imageFiles = Object.keys(contents.files).filter(
        name => !contents.files[name].dir && name.match(/\.(jpg|jpeg|png|webp)$/i)
      ).sort();

      let coverUrl = "";
      if (imageFiles.length > 0) {
        const coverBlob = await contents.files[imageFiles[0]].async("blob");
        coverUrl = URL.createObjectURL(coverBlob);
      }

      const id = file.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, '-').toLowerCase() + "-" + Date.now();
      
      return {
        id,
        title: file.name.replace(/\.[^/.]+$/, ""),
        author: type === "manga" ? "Manga" : "Manhwa",
        coverUrl,
        epubUrl: "", 
        genreId: type,
        description: `Koleksi ${type === "manga" ? "Manga" : "Manhwa"} yang disinkronisasi dari folder lokal.`,
        publishYear: new Date().getFullYear(),
        type: type
      };
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const extractEpubMetadata = async (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const book = ePub(arrayBuffer);
          const metadata = await book.loaded.metadata;
          const coverUrlPath = await book.loaded.cover;
          
          let compressedCover = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=400&h=600&q=80";
          if (coverUrlPath) {
            const coverBlob = await book.archive.createUrl(coverUrlPath, { base64: true });
            compressedCover = await compressCover(coverBlob);
          }

          const safeTitle = metadata.title || file.name.replace(".epub", "");
          // Prefix 'custom_' memastikan sinkronisasi yang konsisten dan menghindari konflik
          const bookId = `custom_sync_${safeTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

          resolve({
            id: bookId,
            title: metadata.title || file.name,
            author: metadata.creator || "Penulis Tidak Diketahui",
            coverUrl: compressedCover,
            epubUrl: `custom://${bookId}`,
            genreId: "fiksi",
            description: metadata.description || "Buku ini diimpor melalui sinkronisasi folder PC lokal Anda.",
            publishYear: new Date().getFullYear(),
          });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const compressCover = (coverUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 300;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(coverUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => reject(new Error("Gagal memuat gambar sampul"));
      img.src = coverUrl;
    });
  };

  const handleDisconnect = async () => {
    await disconnectLocalFolder();
    setLocalFolderPath(null);
  };

  const handleManualSync = async () => {
    const handle = await getStoredFolderHandle();
    if (handle) {
      const hasPerm = await verifyPermission(handle, false);
      if (hasPerm) {
        setPermissionError(false);
        await performSync(handle);
      } else {
        setPermissionError(true);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl flex overflow-hidden h-[600px]"
        >
          {/* Sidebar Settings */}
          <div className="w-64 bg-zinc-900/50 border-r border-zinc-800/50 p-6 flex flex-col">
            <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3 tracking-tight">
              <Settings2 className="text-purple-500" />
              Settings
            </h2>
            <nav className="flex flex-col gap-2">
              <button
                onClick={() => setActiveTab("storage")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  activeTab === "storage" ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                }`}
              >
                <FolderSync size={20} /> Penyimpanan
              </button>
              <button
                onClick={() => setActiveTab("appearance")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  activeTab === "appearance" ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                }`}
              >
                <Palette size={20} /> Tampilan
              </button>
              <button
                onClick={() => setActiveTab("about")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  activeTab === "about" ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                }`}
              >
                <Info size={20} /> Tentang
              </button>
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-8 relative overflow-y-auto">
            {/* Tombol Tutup */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-full transition-all"
            >
              <X size={24} />
            </button>

            {/* TAB: STORAGE */}
            {activeTab === "storage" && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="h-full">
                <h3 className="text-xl font-bold text-white mb-2">Penyimpanan & Sinkronisasi</h3>
                <p className="text-zinc-400 text-sm mb-8">
                  Pilih folder di PC Anda untuk secara otomatis mensinkronisasi semua file buku (.epub) ke dalam Bookify tanpa perlu mengunggahnya satu per satu.
                </p>

                {/* Status Box */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 mb-6">
                  {localFolderPath ? (
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 size={20} className="text-green-500" />
                          <h4 className="font-bold text-white">Folder Terhubung</h4>
                        </div>
                        <p className="text-zinc-400 text-sm font-mono bg-zinc-950 px-3 py-1 rounded-lg mt-2 inline-block border border-zinc-800/50">
                          📁 {localFolderPath}
                        </p>
                        
                        {permissionError && (
                          <div className="mt-4 flex items-start gap-2 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 text-sm">
                            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                            <p>Akses ke folder telah kedaluwarsa (biasanya setelah browser ditutup). Silakan sinkronkan ulang untuk memberikan izin akses kembali.</p>
                          </div>
                        )}

                        {syncStatus && (
                          <div className="mt-4">
                            <div className="flex justify-between text-xs font-bold text-purple-400 mb-2">
                              <span>{syncStatus.message}</span>
                              <span>{syncStatus.progress}%</span>
                            </div>
                            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                              <div className="bg-purple-500 h-full transition-all duration-300" style={{ width: `${syncStatus.progress}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={handleManualSync}
                          disabled={isSyncing}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                        >
                          <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
                          {isSyncing ? "Menyelaraskan..." : "Sinkronkan"}
                        </button>
                        <button
                          onClick={handleDisconnect}
                          disabled={isSyncing}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 text-zinc-300 text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                        >
                          Putuskan
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <FolderSync size={48} className="text-zinc-600 mb-4" />
                      <h4 className="text-lg font-bold text-white mb-2">Belum Ada Folder Terhubung</h4>
                      <p className="text-zinc-400 text-sm max-w-md mb-6">
                        Hubungkan direktori lokal PC Anda dan jadikan Bookify sebagai perpustakaan pribadi yang otomatis mendeteksi file EPUB baru.
                      </p>
                      <button
                        onClick={handlePickFolder}
                        className="bg-white text-black hover:bg-zinc-200 px-6 py-3 rounded-xl font-bold shadow-xl transition-all active:scale-95"
                      >
                        Pilih Folder PC
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-5">
                  <h4 className="text-purple-400 font-bold mb-2 text-sm">Bagaimana cara kerjanya?</h4>
                  <ul className="text-zinc-400 text-xs space-y-2 list-disc list-inside">
                    <li>Bookify menggunakan <strong className="text-zinc-300">File System Access API</strong> canggih yang diizinkan browser.</li>
                    <li>Kami hanya membaca file berakhiran <code>.epub</code> di dalam folder yang Anda izinkan.</li>
                    <li>Semua proses terjadi secara lokal (Offline). Tidak ada satupun file yang diunggah ke internet.</li>
                    <li>Kecepatan ekstraksi bergantung pada ukuran file dan spesifikasi perangkat Anda.</li>
                  </ul>
                </div>
              </motion.div>
            )}

            {/* TAB: APPEARANCE */}
            {activeTab === "appearance" && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="h-full">
                <h3 className="text-xl font-bold text-white mb-2">Tampilan Visual</h3>
                <p className="text-zinc-400 text-sm mb-8">
                  Sesuaikan antarmuka Bookify dengan gaya yang paling menenangkan untuk mata Anda.
                </p>

                {/* Theme Selector */}
                <h4 className="font-bold text-white mb-4">Tema Dasar</h4>
                <div className="grid grid-cols-2 gap-4 mb-10">
                  {/* Mode Gelap */}
                  <button
                    onClick={() => useReaderStore.getState().setAppTheme("dark")}
                    className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 text-left p-0 ${
                      useReaderStore.getState().appTheme === "dark" 
                      ? "border-[var(--accent-primary)] shadow-lg shadow-[var(--accent-primary)]/20 scale-[1.02]" 
                      : "border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="h-24 w-full bg-zinc-950 p-4 border-b border-zinc-900">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-16 h-3 bg-zinc-800 rounded-full"></div>
                        <div className="w-6 h-6 bg-[var(--accent-primary)]/20 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-[var(--accent-primary)] rounded-full"></div>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-zinc-800 rounded-full mb-2"></div>
                      <div className="w-2/3 h-2 bg-zinc-800 rounded-full"></div>
                    </div>
                    <div className="p-4 bg-zinc-900">
                      <h5 className="font-bold text-white mb-1 flex items-center gap-2">
                        🌙 Obsidian Dark
                      </h5>
                      <p className="text-xs text-zinc-400">Tampilan malam pekat yang mewah.</p>
                    </div>
                    {useReaderStore.getState().appTheme === "dark" && (
                      <div className="absolute top-3 right-3 bg-[var(--accent-primary)] text-white rounded-full p-1 shadow-md">
                        <CheckCircle2 size={14} />
                      </div>
                    )}
                  </button>

                  {/* Mode Terang */}
                  <button
                    onClick={() => useReaderStore.getState().setAppTheme("light")}
                    className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 text-left p-0 ${
                      useReaderStore.getState().appTheme === "light" 
                      ? "border-[var(--accent-primary)] shadow-lg shadow-[var(--accent-primary)]/20 scale-[1.02]" 
                      : "border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="h-24 w-full bg-zinc-50 p-4 border-b border-zinc-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-16 h-3 bg-zinc-300 rounded-full"></div>
                        <div className="w-6 h-6 bg-[var(--accent-primary)]/20 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-[var(--accent-primary)] rounded-full"></div>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-zinc-300 rounded-full mb-2"></div>
                      <div className="w-2/3 h-2 bg-zinc-300 rounded-full"></div>
                    </div>
                    <div className="p-4 bg-zinc-900">
                      <h5 className="font-bold text-white mb-1 flex items-center gap-2">
                        ☀️ Minimalist Light
                      </h5>
                      <p className="text-xs text-zinc-400">Tampilan putih bersih yang lega.</p>
                    </div>
                    {useReaderStore.getState().appTheme === "light" && (
                      <div className="absolute top-3 right-3 bg-[var(--accent-primary)] text-white rounded-full p-1 shadow-md">
                        <CheckCircle2 size={14} />
                      </div>
                    )}
                  </button>
                </div>

                {/* Accent Color Selector */}
                <h4 className="font-bold text-white mb-4">Warna Aksen</h4>
                <div className="flex flex-wrap gap-4">
                  {[
                    { id: "purple", color: "#9333ea", name: "Royal Purple" },
                    { id: "blue", color: "#2563eb", name: "Ocean Blue" },
                    { id: "green", color: "#16a34a", name: "Emerald Green" },
                    { id: "rose", color: "#e11d48", name: "Sunset Rose" },
                    { id: "amber", color: "#d97706", name: "Golden Amber" },
                  ].map((accent) => {
                    const isActive = useReaderStore.getState().appAccentColor === accent.color;
                    return (
                      <button
                        key={accent.id}
                        onClick={() => useReaderStore.getState().setAppAccentColor(accent.color)}
                        className={`group relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${
                          isActive ? "scale-110 shadow-lg" : "hover:scale-105"
                        }`}
                        style={{ 
                          backgroundColor: accent.color,
                          boxShadow: isActive ? `0 10px 25px -5px ${accent.color}80` : "none" 
                        }}
                        title={accent.name}
                      >
                        {isActive && <CheckCircle2 size={24} className="text-white drop-shadow-md" />}
                        <div className="absolute -bottom-6 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-zinc-400 whitespace-nowrap bg-black/80 px-2 py-1 rounded">
                          {accent.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* TAB: ABOUT */}
            {activeTab === "about" && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="h-full flex flex-col items-center justify-center p-4">
                <div 
                  className="w-20 h-20 rounded-3xl mb-4 shadow-2xl flex items-center justify-center text-white font-black text-3xl font-serif italic animate-pulse"
                  style={{ 
                    background: `linear-gradient(135deg, ${useReaderStore.getState().appAccentColor || 'var(--accent-primary)'}, ${useReaderStore.getState().appAccentColor || 'var(--accent-primary)'}cc)` 
                  }}
                >
                  B
                </div>
                <h3 className="text-2xl font-black text-white mb-1">BookLify</h3>
                <p className="text-zinc-500 text-xs mb-6">Versi 1.0.0 (Premium Desktop Build)</p>

                <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl w-full max-w-md text-center shadow-lg backdrop-blur-sm">
                  <p className="text-sm text-zinc-300 leading-relaxed mb-6">
                    Aplikasi e-reader offline premium untuk buku (EPUB), manga, dan manhwa (CBZ). Dirancang khusus dengan tipografi premium, performa tinggi, dan sinkronisasi pustaka otomatis.
                  </p>

                  <div className="border-t border-zinc-800 pt-6">
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-3">Creator / Developer</p>
                    <h4 className="text-lg font-black text-white mb-1">Rafly Rajwa Syahputra</h4>
                    <p className="text-xs text-zinc-400 mb-6">Crafting beautiful reading experiences.</p>

                    <div className="flex flex-wrap justify-center gap-3">
                      <a 
                        href="https://www.instagram.com/fly_rjwa/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 border border-zinc-700/50 hover:border-[var(--accent-primary)] group"
                      >
                        <span className="text-zinc-400 group-hover:text-[var(--accent-primary)] transition-colors">Instagram</span>
                      </a>
                      <a 
                        href="https://x.com/Flyyy_Rjwaa" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 border border-zinc-700/50 hover:border-[var(--accent-primary)] group"
                      >
                        <span className="text-zinc-400 group-hover:text-[var(--accent-primary)] transition-colors">X (Twitter)</span>
                      </a>
                      <a 
                        href="https://github.com/Flyys-S" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 border border-zinc-700/50 hover:border-[var(--accent-primary)] group"
                      >
                        <span className="text-zinc-400 group-hover:text-[var(--accent-primary)] transition-colors">GitHub</span>
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
