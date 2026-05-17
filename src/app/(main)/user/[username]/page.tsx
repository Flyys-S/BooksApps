"use client";

import { use } from "react";
import { mockUser } from "@/data/mockData";
import { Clock, Flame, CheckCircle, Camera, Sparkles, BookOpen } from "lucide-react";
import { useReaderStore } from "@/store/useReaderStore";
import Link from "next/link";
import StatCard from "@/components/ui/StatCard";

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { username } = use(params);
  const { userProfile, likedBookIds, customBooks, bookProgress, appAccentColor } = useReaderStore();

  const isCurrentUser = username === "me" || username === userProfile?.username;

  if (!isCurrentUser || !userProfile) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-8 text-zinc-500">
        <p className="mb-4">Profil pengguna tidak ditemukan!</p>
        <Link href="/" className="text-purple-500 hover:underline" style={{ color: appAccentColor }}>
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const completedCount = Object.values(bookProgress || {}).filter(p => p.percent >= 95).length;
  const booksCompleted = (userProfile.booksCompleted || 0) + completedCount;

  return (
    <div className="min-h-full px-6 py-8 md:px-10 md:py-10 max-w-5xl mx-auto">
      {/* Profile Header Banner */}
      <header className="flex flex-col md:flex-row items-center gap-8 bg-gradient-to-br from-zinc-900/40 via-zinc-900 to-zinc-950 border border-zinc-800 p-8 md:p-10 rounded-3xl mb-10 shadow-2xl relative overflow-hidden group">
        <div 
          className="absolute top-0 right-0 w-44 h-44 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-all duration-500" 
          style={{ backgroundColor: appAccentColor }}
        />
        
        {/* Interactive Avatar */}
        <div 
          className="relative w-32 h-32 md:w-36 md:h-36 rounded-full border-4 shadow-2xl overflow-hidden cursor-pointer group/avatar flex-shrink-0"
          style={{ borderColor: appAccentColor || 'var(--border)' }}
        >
          <img
            src={userProfile.avatarUrl}
            alt={userProfile.fullName}
            className="w-full h-full object-cover group-hover/avatar:scale-105 transition-transform duration-500"
          />
          {/* Change Avatar Overlay on Hover */}
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300">
            <Camera className="text-white w-8 h-8" />
          </div>
        </div>
 
        {/* User Info */}
        <div className="text-center md:text-left flex-1 min-w-0">
          <span 
            className="text-[10px] font-extrabold tracking-widest border px-3 py-1 rounded-full uppercase"
            style={{ 
              borderColor: `${appAccentColor}40`,
              color: appAccentColor,
              backgroundColor: `${appAccentColor}15`
            }}
          >
            PEMBACA PREMIUM
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-white mt-4 tracking-tight leading-none truncate">
            {userProfile.fullName}
          </h1>
          <p className="text-sm text-zinc-400 mt-2 font-medium">@{userProfile.username}</p>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-6">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 rounded-full text-xs font-bold text-zinc-400 border border-zinc-800">
              <Sparkles size={12} style={{ color: appAccentColor }} />
              <span>Level 12</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 rounded-full text-xs font-bold text-zinc-400 border border-zinc-800">
              <span>Bergabung 2026</span>
            </div>
          </div>
        </div>
      </header>
 
      {/* Reading Statistics Cards */}
      <section className="mb-10">
        <h2 className="text-lg md:text-xl font-bold text-white mb-6 tracking-wide">Statistik Aktivitas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard
            icon={<Clock size={24} />}
            value={userProfile.minutesRead}
            label="Total Menit Membaca"
            iconBgColor="bg-purple-500/10"
            iconTextColor="text-purple-500"
          />
          <StatCard
            icon={<CheckCircle size={24} />}
            value={booksCompleted}
            label="Buku Selesai Dibaca"
            iconBgColor="bg-emerald-500/10"
            iconTextColor="text-emerald-500"
          />
          <StatCard
            icon={<Flame size={24} />}
            value={`${userProfile.currentStreak} Hari`}
            label="Streak Membaca Harian"
            iconBgColor="bg-orange-500/10"
            iconTextColor="text-orange-500"
          />
        </div>
      </section>

      {/* Stats Summary List */}
      <section className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Book stats detail */}
        <div className="bg-zinc-900/40 border border-zinc-800/40 p-6 rounded-3xl">
          <h3 className="font-bold text-white mb-4 tracking-wide flex items-center gap-2">
            <BookOpen size={16} className="text-purple-500" />
            <span>Riwayat Ringkasan</span>
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm border-b border-zinc-800/50 pb-2">
              <span className="text-zinc-400">Total Buku Disukai (Liked)</span>
              <span className="font-bold text-white">{likedBookIds?.length || 0} Buku</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-zinc-800/50 pb-2">
              <span className="text-zinc-400">Target Membaca Bulanan</span>
              <span className="font-bold text-white">4 / 5 Buku</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400">Kecepatan Membaca Rata-rata</span>
              <span className="font-bold text-white">250 Kata/Menit</span>
            </div>
          </div>
        </div>

        {/* Motivational Banner */}
        <div className="bg-gradient-to-tr from-purple-600/20 to-pink-500/5 border border-purple-800/20 p-6 rounded-3xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Terus Pertahankan Semangatmu!</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Kamu telah membaca lebih banyak daripada 85% pembaca lain di Bookify bulan ini. Selesaikan 1 buku lagi untuk mendapatkan lencana pencapaian "Cendekiawan"!
            </p>
          </div>
          <button className="mt-4 py-2 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-xs font-bold w-fit transition-all duration-300">
            Lihat Lencana Prestasi
          </button>
        </div>
      </section>
    </div>
  );
}
