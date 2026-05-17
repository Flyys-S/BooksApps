"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/navigation/Sidebar";
import BottomNav from "@/components/navigation/BottomNav";
import MiniReaderBar from "@/components/reader/MiniReaderBar";
import FullscreenReader from "@/components/reader/FullscreenReader";
import Onboarding from "@/components/Onboarding";
import { useReaderStore } from "@/store/useReaderStore";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOnboardingCompleted } = useReaderStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-row min-h-screen bg-background text-foreground transition-colors duration-500 overflow-hidden">
      {mounted && !isOnboardingCompleted && <Onboarding />}
      {/* Persistent Sidebar for Desktop */}
      <Sidebar />

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto pb-32 md:pb-24">
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Persistent Audio/Book Player Mini Bar */}
      <MiniReaderBar />

      {/* Fullscreen Overlay Immersive Reader */}
      <FullscreenReader />

      {/* Bottom Nav for Mobile Screen */}
      <BottomNav />
    </div>
  );
}
