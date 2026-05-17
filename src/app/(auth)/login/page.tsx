"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Key, Mail, Loader2 } from "lucide-react";
import { useReaderStore } from "@/store/useReaderStore";

export default function LoginPage() {
  const router = useRouter();
  const { appAccentColor } = useReaderStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate auth check
    setTimeout(() => {
      setLoading(false);
      router.push("/");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-6 text-white font-sans">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Glow Element */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />

        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div 
            className="p-4 rounded-2xl text-white mb-3 shadow-lg"
            style={{ 
              background: `linear-gradient(135deg, ${appAccentColor || 'var(--accent-primary)'}, ${appAccentColor || 'var(--accent-primary)'}cc)` 
            }}
          >
            <BookOpen size={36} />
          </div>
          <h1 
            className="text-2xl font-black tracking-widest uppercase transition-colors duration-300"
            style={{ color: appAccentColor || 'var(--accent-primary)' }}
          >
            BOOKLIFY
          </h1>
          <p className="text-zinc-500 text-xs mt-1">Masuk untuk melanjutkan membaca.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
            <input
              type="email"
              placeholder="Alamat Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl text-sm focus:outline-none focus:border-purple-500 text-white placeholder-zinc-500 transition-colors duration-300"
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <Key className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
            <input
              type="password"
              placeholder="Kata Sandi"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl text-sm focus:outline-none focus:border-purple-500 text-white placeholder-zinc-500 transition-colors duration-300"
            />
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 active:scale-98 disabled:opacity-50 text-white text-xs font-bold tracking-widest rounded-full uppercase shadow-lg shadow-purple-900/20 transition-all duration-300 flex items-center justify-center"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "MASUK"}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center mt-6">
          <p className="text-zinc-500 text-xs">
            Belum punya akun?{" "}
            <Link href="/signup" className="text-purple-400 hover:underline hover:text-purple-300 font-semibold transition-colors duration-300">
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
