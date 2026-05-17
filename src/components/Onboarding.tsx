"use client";

import { useState } from "react";
import { BookOpen, Palette, FolderSync, CheckCircle2, ArrowRight, ArrowLeft, Loader2, User, Camera, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useReaderStore } from "@/store/useReaderStore";
import { pickLocalFolder, scanFolderForBooks } from "@/utils/fileSystem";
import JSZip from "jszip";

const presetAvatars = [
  { name: "Petualang", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80" },
  { name: "Cendekiawan", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80" },
  { name: "Seniman", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80" },
  { name: "Siber", url: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&h=150&q=80" },
  { name: "Pemimpi", url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80" },
  { name: "Filsuf", url: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80" }
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const { 
    appTheme, 
    setAppTheme, 
    appAccentColor, 
    setAppAccentColor, 
    localFolderPath, 
    setLocalFolderPath, 
    syncLocalBooks, 
    setOnboardingCompleted,
    userProfile,
    updateUserProfile
  } = useReaderStore();

  // Local state for account setup
  const [fullName, setFullName] = useState(userProfile.fullName);
  const [usernameInput, setUsernameInput] = useState(userProfile.username);
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePickFolder = async () => {
    try {
      const handle = await pickLocalFolder();
      if (handle) {
        setLocalFolderPath(handle.name);
        setIsSyncing(true);
        setSyncStatus("Memindai folder pustaka...");
        
        try {
          const scannedItems = await scanFolderForBooks(handle);
          if (scannedItems.length === 0) {
            setSyncStatus("Tidak ada berkas buku/komik (.epub, .cbz) ditemukan.");
            setIsSyncing(false);
            return;
          }

          const booksToSave = [];
          const filesToSave = [];

          for (let i = 0; i < scannedItems.length; i++) {
            const item = scannedItems[i];
            setSyncStatus(`Mengekstrak metadata (${i + 1}/${scannedItems.length})...`);
            
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
              console.warn(err);
            }
          }

          setSyncStatus("Menyimpan pustaka secara aman...");
          await syncLocalBooks(booksToSave, filesToSave);
          setSyncStatus("Selesai! Pustaka berhasil dihubungkan.");
        } catch (err) {
          console.error(err);
          setSyncStatus("Terjadi kesalahan saat memindai folder.");
        } finally {
          setIsSyncing(false);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const extractCbzMetadata = async (file: File, type: "manga" | "manhwa"): Promise<any> => {
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
      description: `Koleksi ${type === "manga" ? "Manga" : "Manhwa"} offline.`,
      publishYear: new Date().getFullYear(),
      type: type
    };
  };

  const extractEpubMetadata = async (file: File): Promise<any> => {
    const id = file.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, '-').toLowerCase() + "-" + Date.now();
    return {
      id,
      title: file.name.replace(/\.[^/.]+$/, ""),
      author: "Penulis Lokal",
      coverUrl: "",
      epubUrl: "",
      genreId: "book",
      description: "Buku lokal yang diimpor melalui sinkronisasi folder.",
      publishYear: new Date().getFullYear(),
      type: "book"
    };
  };

  const saveProfileData = () => {
    updateUserProfile({
      fullName: fullName || "Rafly Rajwa",
      username: usernameInput.toLowerCase().replace(/\s+/g, "") || "raflyrajwa",
      avatarUrl: avatarUrl
    });
  };

  const nextStep = () => {
    if (step === 2) {
      saveProfileData();
    }
    setStep(prev => prev + 1);
  };
  const prevStep = () => setStep(prev => prev - 1);

  const handleFinish = () => {
    saveProfileData();
    setOnboardingCompleted(true);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0c0c0e] text-white flex flex-col items-center justify-center p-6 font-sans select-none overflow-hidden">
      {/* Dynamic Background Glow */}
      <div 
        className="absolute w-[500px] h-[500px] rounded-full blur-[160px] opacity-10 transition-all duration-1000 pointer-events-none"
        style={{ 
          background: `radial-gradient(circle, ${appAccentColor} 0%, transparent 70%)`,
          top: "10%",
          left: "25%"
        }}
      />
      <div 
        className="absolute w-[400px] h-[400px] rounded-full blur-[140px] opacity-10 transition-all duration-1000 pointer-events-none"
        style={{ 
          background: `radial-gradient(circle, ${appAccentColor} 0%, transparent 70%)`,
          bottom: "10%",
          right: "20%"
        }}
      />

      <div className="w-full max-w-xl bg-zinc-950/80 border border-zinc-900 rounded-[32px] p-8 md:p-12 shadow-2xl relative backdrop-blur-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-zinc-900">
          <motion.div 
            className="h-full transition-all duration-500"
            style={{ 
              backgroundColor: appAccentColor,
              width: `${(step / 4) * 100}%` 
            }}
          />
        </div>

        <div className="overflow-y-auto pr-1 flex-1 py-2">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center text-center py-6"
              >
                <div 
                  className="p-5 rounded-[24px] text-white mb-6 shadow-xl shadow-purple-500/10 animate-bounce"
                  style={{ 
                    background: `linear-gradient(135deg, ${appAccentColor}, ${appAccentColor}cc)` 
                  }}
                >
                  <BookOpen size={48} />
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-3">
                  Selamat Datang di <span style={{ color: appAccentColor }}>BookLify</span>
                </h1>
                <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-md mb-8">
                  Pustaka digital offline premium untuk membaca Buku (EPUB), Manga, dan Manhwa (CBZ) kesayangan Anda dengan performa super cepat.
                </p>
                
                <button
                  onClick={nextStep}
                  className="px-8 py-4 rounded-full font-bold text-sm tracking-wider uppercase flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-lg"
                  style={{ 
                    background: `linear-gradient(135deg, ${appAccentColor}, ${appAccentColor}ee)`,
                    boxShadow: `0 10px 25px -5px ${appAccentColor}60`
                  }}
                >
                  Mulai Setup <ArrowRight size={16} />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col h-full"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-zinc-900 text-zinc-400">
                    <User size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">Buat Profil Membaca</h2>
                    <p className="text-xs text-zinc-500">Personalisasikan identitas pustakamu.</p>
                  </div>
                </div>

                {/* Profile Picture Upload & Preview */}
                <div className="flex flex-col sm:flex-row items-center gap-6 mb-6 bg-zinc-900/30 border border-zinc-850 p-5 rounded-2xl">
                  <div className="relative w-24 h-24 rounded-full border-2 border-zinc-800 overflow-hidden group flex-shrink-0">
                    <img 
                      src={avatarUrl} 
                      alt="Avatar Preview" 
                      className="w-full h-full object-cover"
                    />
                    <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
                      <Camera size={20} className="text-white" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatarFileChange} 
                        className="hidden" 
                      />
                    </label>
                  </div>

                  <div className="flex-1 w-full text-center sm:text-left">
                    <h4 className="font-bold text-sm text-white mb-1">Foto Profil</h4>
                    <p className="text-xs text-zinc-500 mb-3">Klik kamera di foto untuk upload foto kustomu.</p>
                    
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 hover:bg-zinc-800 cursor-pointer transition-all">
                      <Upload size={14} />
                      <span>Upload Foto</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatarFileChange} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>

                {/* Avatar Presets */}
                <div className="mb-6">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-3">Pilihan Avatar Preset</label>
                  <div className="grid grid-cols-6 gap-3">
                    {presetAvatars.map((preset) => {
                      const isActive = avatarUrl === preset.url;
                      return (
                        <button
                          key={preset.url}
                          type="button"
                          onClick={() => setAvatarUrl(preset.url)}
                          className="relative aspect-square rounded-xl border overflow-hidden transition-all duration-300 hover:scale-105"
                          style={{
                            borderColor: isActive ? appAccentColor : "rgba(63, 63, 70, 0.4)",
                            boxShadow: isActive ? `0 0 12px ${appAccentColor}60` : "none"
                          }}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2">Nama Lengkap</label>
                    <input 
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Masukkan nama lengkap Anda"
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2">Username</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-zinc-500 text-sm">@</span>
                      <input 
                        type="text"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        placeholder="username"
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-700 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between border-t border-zinc-900 pt-6 mt-auto">
                  <button
                    onClick={prevStep}
                    className="px-5 py-2.5 rounded-full border border-zinc-850 hover:bg-zinc-900 text-xs font-bold tracking-widest uppercase transition-all flex items-center gap-2"
                  >
                    <ArrowLeft size={14} /> Kembali
                  </button>

                  <button
                    onClick={nextStep}
                    disabled={!fullName.trim() || !usernameInput.trim()}
                    className="px-6 py-2.5 rounded-full font-bold text-xs tracking-widest uppercase flex items-center gap-2 transition-all hover:scale-103 active:scale-97 text-white disabled:opacity-50"
                    style={{ backgroundColor: appAccentColor }}
                  >
                    Lanjut <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col h-full"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-zinc-900 text-zinc-400">
                    <Palette size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">Personalisasi Tampilan</h2>
                    <p className="text-xs text-zinc-500">Sesuaikan gaya visual kenyamanan Anda membaca.</p>
                  </div>
                </div>

                {/* Theme Picker */}
                <div className="mb-6">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-3">Tema Aplikasi</label>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Dark Mode */}
                    <button
                      onClick={() => setAppTheme("dark")}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        appTheme === "dark" 
                          ? "border-[var(--accent-primary)] bg-zinc-900/60" 
                          : "border-zinc-900 hover:border-zinc-800 bg-transparent"
                      }`}
                    >
                      <h4 className="font-bold text-sm text-white mb-1">🌌 Deep Dark</h4>
                      <p className="text-[11px] text-zinc-500">Kenyamanan membaca maksimal di malam hari.</p>
                    </button>

                    {/* Light Mode */}
                    <button
                      onClick={() => setAppTheme("light")}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        appTheme === "light" 
                          ? "border-[var(--accent-primary)] bg-zinc-900/60" 
                          : "border-zinc-900 hover:border-zinc-800 bg-transparent"
                      }`}
                    >
                      <h4 className="font-bold text-sm text-white mb-1">☀️ Light Mode</h4>
                      <p className="text-[11px] text-zinc-500">Tampilan putih bersih bernuansa lega.</p>
                    </button>
                  </div>
                </div>

                {/* Accent Color Picker */}
                <div className="mb-8">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-3">Warna Aksen</label>
                  <div className="flex gap-3.5">
                    {[
                      { color: "#9333ea", name: "Purple" },
                      { color: "#2563eb", name: "Blue" },
                      { color: "#16a34a", name: "Green" },
                      { color: "#e11d48", name: "Rose" },
                      { color: "#d97706", name: "Amber" },
                    ].map((accent) => {
                      const isActive = appAccentColor === accent.color;
                      return (
                        <button
                          key={accent.color}
                          onClick={() => setAppAccentColor(accent.color)}
                          className={`w-10 h-10 rounded-full transition-all relative flex items-center justify-center ${
                            isActive ? "scale-110" : "hover:scale-105"
                          }`}
                          style={{ 
                            backgroundColor: accent.color,
                            boxShadow: isActive ? `0 0 15px ${accent.color}cc` : "none" 
                          }}
                        >
                          {isActive && <CheckCircle2 size={16} className="text-white drop-shadow" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between border-t border-zinc-900 pt-6 mt-auto">
                  <button
                    onClick={prevStep}
                    className="px-5 py-2.5 rounded-full border border-zinc-850 hover:bg-zinc-900 text-xs font-bold tracking-widest uppercase transition-all flex items-center gap-2"
                  >
                    <ArrowLeft size={14} /> Kembali
                  </button>

                  <button
                    onClick={nextStep}
                    className="px-6 py-2.5 rounded-full font-bold text-xs tracking-widest uppercase flex items-center gap-2 transition-all hover:scale-103 active:scale-97 text-white"
                    style={{ backgroundColor: appAccentColor }}
                  >
                    Lanjut <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col h-full"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-zinc-900 text-zinc-400">
                    <FolderSync size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">Hubungkan Pustaka Lokal</h2>
                    <p className="text-xs text-zinc-500">Sambungkan folder buku, manga, atau manhwa Anda.</p>
                  </div>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-850 p-6 rounded-2xl mb-6 text-center">
                  {localFolderPath ? (
                    <div className="flex flex-col items-center">
                      <CheckCircle2 size={40} className="text-green-500 mb-3" />
                      <h4 className="font-bold text-sm text-white mb-1">Folder Berhasil Terhubung</h4>
                      <p className="text-xs text-zinc-400 font-mono bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-900 mt-2 truncate w-full max-w-xs">
                        📂 {localFolderPath}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <FolderSync size={40} className="text-zinc-500 mb-3 animate-pulse" />
                      <h4 className="font-bold text-sm text-white mb-1">Tidak Ada Folder Terhubung</h4>
                      <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed mt-2">
                        Silakan pilih folder khusus di PC Anda yang berisi berkas EPUB (buku) atau CBZ (manga/manhwa).
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 mb-6">
                  <button
                    onClick={handlePickFolder}
                    disabled={isSyncing}
                    className="w-full py-3.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/80 disabled:opacity-50 text-white rounded-xl text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-3"
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-[var(--accent-primary)]" />
                        Memindai & Mengimpor...
                      </>
                    ) : (
                      <>
                        📂 {localFolderPath ? "Ubah Folder" : "Pilih Folder Pustaka"}
                      </>
                    )}
                  </button>

                  {syncStatus && (
                    <p className="text-[11px] text-zinc-400 text-center font-semibold bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-900">
                      ℹ️ {syncStatus}
                    </p>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between border-t border-zinc-900 pt-6 mt-auto">
                  <button
                    onClick={prevStep}
                    disabled={isSyncing}
                    className="px-5 py-2.5 rounded-full border border-zinc-850 hover:bg-zinc-900 text-xs font-bold tracking-widest uppercase transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <ArrowLeft size={14} /> Kembali
                  </button>

                  <button
                    onClick={handleFinish}
                    disabled={isSyncing}
                    className="px-8 py-2.5 rounded-full font-bold text-xs tracking-widest uppercase flex items-center gap-2 transition-all hover:scale-103 active:scale-97 text-white disabled:opacity-50"
                    style={{ 
                      backgroundColor: appAccentColor,
                      boxShadow: `0 8px 20px -4px ${appAccentColor}50`
                    }}
                  >
                    Selesai & Masuk <CheckCircle2 size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
