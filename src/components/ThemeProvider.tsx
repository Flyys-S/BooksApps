"use client";

import { useEffect } from "react";
import { useReaderStore } from "@/store/useReaderStore";

export default function ThemeProvider() {
  const { appTheme, appAccentColor } = useReaderStore();

  useEffect(() => {
    // Terapkan Tema (Dark/Light)
    if (appTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Terapkan Warna Aksen Utama
    if (appAccentColor) {
      document.documentElement.style.setProperty("--accent-primary", appAccentColor);
    }
  }, [appTheme, appAccentColor]);

  return null;
}
