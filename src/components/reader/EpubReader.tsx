"use client";

import { useEffect, useRef, useState } from "react";
import { Book } from "@/data/mockData";
import { useReaderStore } from "@/store/useReaderStore";
import { ChevronLeft, ChevronRight, Loader2, BookOpen } from "lucide-react";
import { getBookFile } from "@/utils/db";
import { getFileBlobFromLibrary } from "@/utils/fileSystem";

interface EpubReaderProps {
  book: Book;
}

export default function EpubReader({ book }: EpubReaderProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const epubBookRef = useRef<EpubBook | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    currentCfi, 
    fontSize, 
    fontFamily,
    lineHeight,
    margins,
    theme, 
    currentChapterTitle, 
    updateProgress, 
    addQuote 
  } = useReaderStore();

  // Selection Menu State
  const [selectionMenu, setSelectionMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    text: string;
    cfi: string;
  }>({ visible: false, x: 0, y: 0, text: "", cfi: "" });

  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Clear selection menu when clicking in the parent window
  useEffect(() => {
    const handleParentClick = () => {
      setSelectionMenu((prev) => ({ ...prev, visible: false }));
    };
    window.addEventListener("click", handleParentClick);
    return () => window.removeEventListener("click", handleParentClick);
  }, []);

  useEffect(() => {
    if (!viewerRef.current) return;

    let isActive = true;

    const initBook = async () => {
      setLoading(true);
      setError(null);

      let bookUrlOrData: string | ArrayBuffer = book.epubUrl;

      if (book.epubUrl.startsWith("custom://")) {
        try {
          const blob = await getBookFile(book.id);
          if (blob) {
            bookUrlOrData = await blob.arrayBuffer();
          } else {
            throw new Error("File buku tidak ditemukan.");
          }
        } catch (err) {
          if (isActive) {
            setError("Gagal memuat buku kustom dari penyimpanan lokal.");
            setLoading(false);
          }
          return;
        }
      } else if (!book.epubUrl.startsWith("http") && !book.epubUrl.startsWith("/")) {
        // Ini adalah file dari local directory (contoh: 'books/novel.epub')
        try {
          const blob = await getFileBlobFromLibrary(book.epubUrl);
          if (blob) {
            bookUrlOrData = await blob.arrayBuffer();
          } else {
            throw new Error("File buku fisik tidak ditemukan di direktori.");
          }
        } catch (err) {
          if (isActive) {
            setError("Gagal membaca file dari folder perangkat Anda. Pastikan folder masih terhubung.");
            setLoading(false);
          }
          return;
        }
      }

      if (!isActive) return;

      // Initialize IntersectionObserver in parent window for premium scrolling animations
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
            } else {
              // Keep visible if scrolled past the top (scrolled up) to prevent flickering,
              // but remove visible if it goes below the screen bottom
              if (entry.boundingClientRect.top > 0) {
                entry.target.classList.remove("visible");
              }
            }
          });
        },
        {
          root: null, // Parent viewport
          rootMargin: "0px 0px -40px 0px", // Trigger when element is 40px away from bottom
          threshold: 0.02,
        }
      );
      observerRef.current = observer;
      
      // Initialize ePub
      const epubBook = ePub(bookUrlOrData as string); // Type cast required by epubjs but it accepts ArrayBuffer at runtime
      epubBookRef.current = epubBook;

    // Render book in scrolled continuous mode
    const rendition = epubBook.renderTo(viewerRef.current as Element, {
      width: "100%",
      height: "100%",
      flow: "scrolled",
      manager: "continuous",
      allowScriptedContent: true,
    });
    renditionRef.current = rendition;

    // Handle book load failure
    epubBook.ready.catch((err) => {
      console.error("Error loading epub:", err);
      setError("Gagal memuat berkas EPUB. Pastikan berkas buku ada dan tidak rusak.");
      setLoading(false);
    });

    // Display book (either from last CFI or beginning)
    rendition.display(currentCfi || undefined).then(() => {
      // Jeda visual sengaja ditambahkan agar animasi pemuatan dual-ring premium Bookify terlihat dengan transisi halus
      setTimeout(() => {
        setLoading(false);
      }, 1200);
      
      // Wait for locations to load to compute percent progress
      epubBook.locations.generate(1024).then(() => {
        // Location computation ready
      }).catch(() => {});
    }).catch((err) => {
      console.warn("Display with CFI failed, retrying from beginning...", err);
      rendition.display().then(() => {
        setTimeout(() => {
          setLoading(false);
        }, 1200);
      }).catch((retryErr) => {
        console.error("Failed to render book from beginning:", retryErr);
        setError("Gagal me-render konten halaman buku.");
        setLoading(false);
      });
    });

    // Listen to location relocation
    rendition.on("relocated", (location: any) => {
      const cfi = location.start.cfi;
      const chapter = location.start.label || "Bab Utama";
      let percent = 0;
      
      const locs = epubBook.locations as any;
      if (locs && typeof locs.percentageFromCfi === "function") {
        const total = typeof locs.length === "function" ? locs.length() : (locs.length || 0);
        if (total > 0) {
          percent = Math.round(locs.percentageFromCfi(cfi) * 100);
        }
      }
      
      updateProgress(cfi, percent, chapter);

      // Re-apply saved quotes highlights for current chapter safely
      const savedQuotes = useReaderStore.getState().quotes[book.id] || [];
      savedQuotes.forEach((q) => {
        try {
          rendition.annotations.highlight(
            q.cfi,
            {},
            (e: any) => {},
            "quote-highlight",
            { fill: "rgba(245, 158, 11, 0.25)" }
          );
        } catch (err) {
          // Silent catch if section is not fully loaded
        }
      });
    });

    // Custom selection and contextmenu hooks inside iframe
    rendition.hooks.content.register((contents: any) => {
      const doc = contents.document;
      const win = contents.window;

      // Handle Selection via mouseup
      doc.addEventListener("mouseup", () => {
        const selection = win.getSelection();
        const text = selection.toString().trim();
        
        if (text && viewerRef.current) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          // Find which iframe contains this selected document
          const iframes = viewerRef.current.querySelectorAll("iframe");
          let activeIframe: HTMLIFrameElement | null = null;
          iframes.forEach((iframe) => {
            if (iframe.contentDocument === doc) {
              activeIframe = iframe;
            }
          });

          if (activeIframe) {
            const iframeRect = (activeIframe as HTMLIFrameElement).getBoundingClientRect();
            const x = rect.left + iframeRect.left + rect.width / 2;
            const y = rect.top + iframeRect.top - 12;

            let selectedCfi = "";
            if (typeof contents.cfiFromRange === "function") {
              try {
                selectedCfi = contents.cfiFromRange(range);
              } catch (err) {
                selectedCfi = rendition.location?.start?.cfi || "";
              }
            } else {
              selectedCfi = rendition.location?.start?.cfi || "";
            }

            setSelectionMenu({
              visible: true,
              x,
              y,
              text,
              cfi: selectedCfi,
            });
          }
        }
      });

      // Handle Context Menu Override
      doc.addEventListener("contextmenu", (e: MouseEvent) => {
        const selection = win.getSelection();
        const text = selection.toString().trim();
        
        if (text && viewerRef.current) {
          e.preventDefault(); // Matikan menu klik kanan bawaan browser

          const iframes = viewerRef.current.querySelectorAll("iframe");
          let activeIframe: HTMLIFrameElement | null = null;
          iframes.forEach((iframe) => {
            if (iframe.contentDocument === doc) {
              activeIframe = iframe;
            }
          });

          if (activeIframe) {
            const iframeRect = (activeIframe as HTMLIFrameElement).getBoundingClientRect();
            const x = e.clientX + iframeRect.left;
            const y = e.clientY + iframeRect.top - 10;

            const range = selection.getRangeAt(0);
            let selectedCfi = "";
            if (typeof contents.cfiFromRange === "function") {
              try {
                selectedCfi = contents.cfiFromRange(range);
              } catch (err) {
                selectedCfi = rendition.location?.start?.cfi || "";
              }
            } else {
              selectedCfi = rendition.location?.start?.cfi || "";
            }

            setSelectionMenu({
              visible: true,
              x,
              y,
              text,
              cfi: selectedCfi,
            });
          }
        }
      });

      // Clear menu when starting to click elsewhere in the document
      doc.addEventListener("mousedown", () => {
        setSelectionMenu((prev) => ({ ...prev, visible: false }));
      });

      // 1. Suntikkan CSS transisi scroll premium ke dokumen iframe ePub
      const style = doc.createElement("style");
      style.textContent = `
        p, blockquote, h1, h2, h3, h4, h5, h6, img, li {
          opacity: 0.2;
          transform: translateY(20px);
          transition: opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }
        p.visible, blockquote.visible, h1.visible, h2.visible, h3.visible, h4.visible, h5.visible, h6.visible, img.visible, li.visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `;
      doc.head.appendChild(style);

      // 2. Hubungkan IntersectionObserver dan Native Scroll Listener sebagai cadangan andal
      const handleIframeScroll = () => {
        const elements = doc.querySelectorAll("p, blockquote, h1, h2, h3, h4, h5, h6, img, li");
        const viewportHeight = win.innerHeight;
        elements.forEach((el: any) => {
          const rect = el.getBoundingClientRect();
          if (rect.top < viewportHeight - 40) {
            el.classList.add("visible");
          } else if (rect.top > 0) {
            el.classList.remove("visible");
          }
        });
      };

      win.addEventListener("scroll", handleIframeScroll);
      doc.addEventListener("scroll", handleIframeScroll);

      setTimeout(() => {
        const elements = doc.querySelectorAll("p, blockquote, h1, h2, h3, h4, h5, h6, img, li");
        elements.forEach((el: any) => {
          observerRef.current?.observe(el);
        });
        handleIframeScroll(); // Jalankan sekali di awal
      }, 200);
    }); // Tutup rendition.hooks.content.register

    }; // Tutup fungsi initBook

    initBook();

    // Clean up on unmount
    return () => {
      isActive = false;
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (renditionRef.current) {
        renditionRef.current.destroy();
      }
      if (epubBookRef.current) {
        epubBookRef.current.destroy();
      }
    };
  }, [book.id]);

  // Apply Styles (Font Size & Themes)
  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;

    // Font size
    rendition.themes.fontSize(`${fontSize}%`);

    // Themes
    const bgColors = {
      light: "#FFFFFF",
      sepia: "#F4ECD8",
      dark: "#121212",
    };
    const textColors = {
      light: "#121212",
      sepia: "#433422",
      dark: "#E4E4E7",
    };

    // Custom Font Families mapping
    const fontFamilies = {
      sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important",
      serif: "'Lora', 'Georgia', 'Merriweather', serif !important",
      mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace !important",
    };

    // Custom Line Heights mapping
    const lineHeights = {
      tight: "1.4 !important",
      normal: "1.8 !important",
      loose: "2.2 !important",
    };

    // Custom Max Width / Margins mapping
    const maxWidths = {
      narrow: "540px !important",
      normal: "720px !important",
      wide: "900px !important",
    };

    rendition.themes.register("theme-styles", {
      body: {
        background: `${bgColors[theme]} !important`,
        color: `${textColors[theme]} !important`,
        "font-family": fontFamilies[fontFamily],
        "line-height": lineHeights[lineHeight],
        "max-width": maxWidths[margins],
        "margin": "0 auto !important",
        "padding": "3rem 1.5rem !important",
        "overflow-y": "auto !important",
      },
      p: {
        "margin-bottom": "1.6em !important",
        "font-size": "1.125rem !important",
        "letter-spacing": "-0.003em !important",
      },
      h1: {
        "font-size": "2rem !important",
        "margin-top": "2em !important",
        "margin-bottom": "1em !important",
        "font-weight": "800 !important",
        "line-height": "1.25 !important",
      },
      h2: {
        "font-size": "1.5rem !important",
        "margin-top": "1.8em !important",
        "margin-bottom": "0.8em !important",
        "font-weight": "700 !important",
      },
      html: {
        "scroll-behavior": "smooth !important",
        "overflow-y": "auto !important",
      }
    });
    rendition.themes.select("theme-styles");
  }, [fontSize, fontFamily, lineHeight, margins, theme, loading]);

  // Listen for manual CFI jumps (e.g. clicking a bookmark/quote)
  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition || !currentCfi) return;

    const currentLocation = rendition.location?.start?.cfi;
    if (currentLocation !== currentCfi) {
      rendition.display(currentCfi);
    }
  }, [currentCfi]);

  const handlePrev = () => {
    if (renditionRef.current) {
      renditionRef.current.prev();
    }
  };

  const handleNext = () => {
    if (renditionRef.current) {
      renditionRef.current.next();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div 
      style={{ height: "calc(100vh - 4rem)" }}
      className="relative w-full flex flex-col items-center justify-between p-4 md:p-6 bg-inherit"
    >
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 z-40 backdrop-blur-md animate-in fade-in duration-500">
          <div className="flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
            <div className="relative w-20 h-20 flex items-center justify-center">
              {/* Outer glowing spinning ring */}
              <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 border-r-pink-500 rounded-full animate-spin shadow-[0_0_20px_rgba(168,85,247,0.4)]" />
              {/* Inner spinning ring in opposite direction */}
              <div className="absolute w-12 h-12 border-4 border-transparent border-b-purple-400 border-l-pink-400 rounded-full animate-spin [animation-direction:reverse] opacity-75" />
              {/* Center icon */}
              <BookOpen className="w-6 h-6 text-purple-400 animate-pulse" />
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <p className="text-zinc-200 font-bold text-sm tracking-wide animate-pulse">Mengurai Berkas Buku</p>
              <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">Menyelaraskan Halaman...</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-35 backdrop-blur-md">
          <div className="flex flex-col items-center gap-4 max-w-md p-6 bg-zinc-900 border border-zinc-800 rounded-2xl text-center shadow-2xl">
            <div className="w-16 h-16 flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-2xl font-bold animate-pulse">
              ⚠️
            </div>
            <h3 className="text-lg font-bold text-white">Terjadi Kendala</h3>
            <p className="text-zinc-400 text-sm">{error}</p>
            <button
              onClick={() => useReaderStore.getState().closeBook()}
              className="mt-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl text-sm transition-all duration-300"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      )}

      {/* Reader Viewport - Full Width, Centered Content inside iframe */}
      <div className="w-full flex-1 max-w-5xl rounded-2xl overflow-hidden shadow-2xl relative bg-transparent">
        <div ref={viewerRef} className="w-full h-full overflow-y-auto" id="epub-viewer" />
      </div>

      {/* Kindle-style Floating Text Selection/Right-Click Tooltip Menu */}
      {selectionMenu.visible && (
        <div
          className="fixed z-50 flex items-center gap-1 bg-zinc-950 border border-zinc-800 text-white rounded-xl py-1 px-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          style={{
            left: `${selectionMenu.x}px`,
            top: `${selectionMenu.y}px`,
            transform: "translate(-50%, -100%)",
          }}
          onClick={(e) => e.stopPropagation()} // Keeps menu open on internal clicks
        >
          {/* Action 1: Tandai Terakhir Baca */}
          <button
            onClick={() => {
              if (selectionMenu.cfi) {
                const locs = epubBookRef.current?.locations as any;
                let percent = 0;
                if (locs && typeof locs.percentageFromCfi === "function") {
                  percent = Math.round(locs.percentageFromCfi(selectionMenu.cfi) * 100);
                }
                updateProgress(selectionMenu.cfi, percent, currentChapterTitle);
                
                // Highlight text inside rendition for confirmation
                if (renditionRef.current) {
                  try {
                    renditionRef.current.annotations.remove(selectionMenu.cfi, "highlight");
                    renditionRef.current.annotations.highlight(
                      selectionMenu.cfi,
                      {},
                      (e: any) => {},
                      "last-read-highlight",
                      { fill: "rgba(168, 85, 247, 0.25)" } // Warm violet
                    );
                  } catch (err) {}
                }

                showToast(`Posisi terakhir membaca ditandai di bab: ${currentChapterTitle}`, "info");
                setSelectionMenu((prev) => ({ ...prev, visible: false }));
              }
            }}
            className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold hover:bg-zinc-800 hover:text-purple-400 py-1.5 px-2.5 rounded-lg transition-all duration-300"
          >
            📍 Terakhir Baca
          </button>

          <div className="w-[1px] h-4 bg-zinc-800/80" />

          {/* Action 2: Simpan Kutipan */}
          <button
            onClick={() => {
              if (selectionMenu.cfi) {
                addQuote(
                  book.id,
                  selectionMenu.cfi,
                  selectionMenu.text,
                  currentChapterTitle
                );
                
                // Highlight text in warm amber
                if (renditionRef.current) {
                  try {
                    renditionRef.current.annotations.highlight(
                      selectionMenu.cfi,
                      {},
                      (e: any) => {},
                      "quote-highlight",
                      { fill: "rgba(245, 158, 11, 0.25)" } // Amber
                    );
                  } catch (err) {}
                }

                showToast(`Kutipan berhasil disimpan!`, "success");
                setSelectionMenu((prev) => ({ ...prev, visible: false }));
              }
            }}
            className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold hover:bg-zinc-800 hover:text-amber-400 py-1.5 px-2.5 rounded-lg transition-all duration-300"
          >
            💬 Simpan Kutipan
          </button>
        </div>
      )}

      {/* Custom Non-blocking Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold animate-in slide-in-from-bottom-3 fade-in duration-300 text-white">
          <span className="text-sm">{toast.type === "success" ? "✅" : "📍"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-center gap-6 mt-4 shrink-0 z-20">
        <button
          onClick={handlePrev}
          className="p-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:text-white rounded-full text-zinc-400 transition-all duration-300 active:scale-95 shadow-lg"
          title="Bab Sebelumnya"
        >
          <ChevronLeft size={24} />
        </button>
        
        <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
          Scroll Kebawah Untuk Membaca • (← / →) Untuk Pindah Bab
        </span>

        <button
          onClick={handleNext}
          className="p-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:text-white rounded-full text-zinc-400 transition-all duration-300 active:scale-95 shadow-lg"
          title="Bab Selanjutnya"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}
