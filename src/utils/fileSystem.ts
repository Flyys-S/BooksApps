import { saveData, getData } from "./db";
import { Book, ChapterItem } from "@/data/mockData";

// Menyimpan nama konstanta untuk handle di IndexedDB
const DIR_HANDLE_KEY = "bookify-local-dir-handle";

/**
 * Meminta pengguna untuk memilih folder di komputer mereka
 * menggunakan File System Access API.
 */
export const pickLocalFolder = async (): Promise<FileSystemDirectoryHandle | null> => {
  try {
    if (!("showDirectoryPicker" in window)) {
      throw new Error("Browser Anda tidak mendukung File System Access API. Silakan gunakan Chrome atau Edge versi terbaru.");
    }

    // Membuka dialog pemilih folder dengan mode readwrite
    // @ts-ignore
    const dirHandle = await window.showDirectoryPicker({
      id: "bookify-folder",
      mode: "readwrite",
    });

    // Simpan handle ke IndexedDB agar bisa diakses lagi tanpa memilih ulang dari awal
    await saveData(DIR_HANDLE_KEY, dirHandle);

    return dirHandle;
  } catch (error: any) {
    if (error.name !== "AbortError") {
      console.error("Error picking folder:", error);
      throw error;
    }
    return null;
  }
};

export const getStoredFolderHandle = async (): Promise<FileSystemDirectoryHandle | null> => {
  try {
    const handle = await getData(DIR_HANDLE_KEY);
    return handle;
  } catch (error) {
    console.error("Error getting stored folder handle:", error);
    return null;
  }
};

export const verifyPermission = async (fileHandle: FileSystemDirectoryHandle | FileSystemFileHandle, readWrite: boolean = false): Promise<boolean> => {
  const options = {
    mode: readWrite ? "readwrite" : "read",
  };

  try {
    // @ts-ignore
    if ((await fileHandle.queryPermission(options)) === "granted") {
      return true;
    }

    // @ts-ignore
    if ((await fileHandle.requestPermission(options)) === "granted") {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error verifying permission:", error);
    return false;
  }
};

/**
 * Setup sub-folder library
 */
export const setupLibraryFolders = async (dirHandle: FileSystemDirectoryHandle): Promise<void> => {
  try {
    const hasPermission = await verifyPermission(dirHandle, true);
    if (!hasPermission) throw new Error("Izin tulis tidak diberikan oleh pengguna.");

    await dirHandle.getDirectoryHandle("books", { create: true });
    await dirHandle.getDirectoryHandle("manga", { create: true });
    await dirHandle.getDirectoryHandle("manhwa", { create: true });
    
    console.log("Sub-folder library (books, manga, manhwa) berhasil dikonfigurasi.");
  } catch (error) {
    console.error("Gagal membuat subfolder library:", error);
    throw error;
  }
};

/**
 * Helper to natural sort chapter files
 */
const naturalSort = (a: string, b: string) => {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
};

/**
 * Konversi file blob menjadi string Base64 untuk metadata cover
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Memindai sub-folder khusus secara terstruktur dan mengembalikan Book[]
 */
export const scanLibraryBooks = async (dirHandle: FileSystemDirectoryHandle): Promise<Book[]> => {
  const books: Book[] = [];

  try {
    const hasPerm = await verifyPermission(dirHandle, false);
    if (!hasPerm) return [];

    // --- 1. Pindai folder "books" (EPUB) ---
    try {
      const booksDir = await dirHandle.getDirectoryHandle("books");
      // @ts-ignore
      for await (const entry of booksDir.values()) {
        if (entry.kind === "file" && entry.name.toLowerCase().endsWith(".epub")) {
          const id = `local-book-${entry.name}`;
          books.push({
            id,
            title: entry.name.replace(".epub", ""),
            author: "Local Library",
            coverUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=150&h=200&q=80",
            epubUrl: `books/${entry.name}`, // Menyimpan relative path
            genreId: "fiksi",
            description: "Buku lokal dari folder Anda.",
            publishYear: new Date().getFullYear(),
            type: "book",
            isSeries: false,
          });
        }
      }
    } catch (e) {
      console.warn("Folder 'books' tidak ditemukan atau gagal dipindai.");
    }

    // --- 2. Fungsi pindai Manga / Manhwa ---
    const scanSeriesFolder = async (type: "manga" | "manhwa") => {
      try {
        const typeDir = await dirHandle.getDirectoryHandle(type);
        // @ts-ignore
        for await (const seriesEntry of typeDir.values()) {
          if (seriesEntry.kind === "directory") {
            const seriesName = seriesEntry.name;
            const chapters: ChapterItem[] = [];

            // @ts-ignore
            const seriesHandle = await typeDir.getDirectoryHandle(seriesName);
            
            let coverUrl = "https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&w=150&h=200&q=80";
            let seriesTitle = seriesName;
            let author = "Local Library";
            let description = "";

            // 1. Ekstrak Cover Image
            try {
              let coverHandle;
              try { coverHandle = await seriesHandle.getFileHandle("cover.webp"); } catch (e) {}
              if (!coverHandle) try { coverHandle = await seriesHandle.getFileHandle("cover.jpg"); } catch (e) {}
              if (!coverHandle) try { coverHandle = await seriesHandle.getFileHandle("cover.png"); } catch (e) {}
              
              if (coverHandle) {
                const coverBlob = await coverHandle.getFile();
                coverUrl = await blobToBase64(coverBlob);
              }
            } catch (e) {
              // Abaikan jika tidak ada cover
            }

            // 2. Ekstrak index.json
            try {
              const indexHandle = await seriesHandle.getFileHandle("index.json");
              if (indexHandle) {
                const indexBlob = await indexHandle.getFile();
                const indexText = await indexBlob.text();
                const indexData = JSON.parse(indexText);
                
                if (indexData.title) seriesTitle = indexData.title;
                if (indexData.author) author = indexData.author;
                if (indexData.description) description = indexData.description;
              }
            } catch (e) {
              // Abaikan jika tidak ada index.json
            }

            // 3. Pindai Chapters (File CBZ/ZIP)
            // @ts-ignore
            for await (const chapterEntry of seriesHandle.values()) {
              const name = chapterEntry.name.toLowerCase();
              if (chapterEntry.kind === "file" && (name.endsWith(".cbz") || name.endsWith(".zip"))) {
                chapters.push({
                  id: `local-${type}-${seriesName}-${chapterEntry.name}`,
                  title: chapterEntry.name.replace(/\.(cbz|zip)$/i, ""),
                  fileName: chapterEntry.name,
                  relativePath: `${type}/${seriesName}/${chapterEntry.name}`
                });
              }
            }

            // Natural Sort Chapters
            chapters.sort((a, b) => naturalSort(a.fileName, b.fileName));

            if (chapters.length > 0) {
              books.push({
                id: `local-${type}-${seriesName}`,
                title: seriesTitle,
                author: author,
                coverUrl: coverUrl,
                epubUrl: chapters[0].relativePath, // Fallback url ke chapter pertama
                genreId: "fiksi",
                description: description || `${chapters.length} chapter tersedia.`,
                publishYear: new Date().getFullYear(),
                type: type,
                isSeries: true,
                chapters: chapters
              });
            }
          }
        }
      } catch (e) {
        console.warn(`Folder '${type}' tidak ditemukan atau gagal dipindai.`);
      }
    };

    await scanSeriesFolder("manga");
    await scanSeriesFolder("manhwa");

  } catch (error) {
    console.error("Gagal melakukan scanning library:", error);
  }

  return books;
};

/**
 * Menyimpan file secara langsung ke sub-folder library
 */
export const saveFileToLibrary = async (
  rootHandle: FileSystemDirectoryHandle,
  fileName: string,
  fileBlob: Blob,
  type: "book" | "manga" | "manhwa",
  seriesName?: string
): Promise<string> => {
  const hasPermission = await verifyPermission(rootHandle, true);
  if (!hasPermission) throw new Error("Membutuhkan izin menulis ke folder.");

  let targetFolderHandle = await rootHandle.getDirectoryHandle(
    type === "book" ? "books" : type,
    { create: true }
  );

  if ((type === "manga" || type === "manhwa") && seriesName) {
    targetFolderHandle = await targetFolderHandle.getDirectoryHandle(seriesName, { create: true });
  }

  const fileHandle = await targetFolderHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(fileBlob);
  await writable.close();

  return seriesName 
    ? `${type}/${seriesName}/${fileName}`
    : `${type === "book" ? "books" : type}/${fileName}`;
};

/**
 * Membaca Blob file dari library lokal berdasarkan relativePath
 */
export const getFileBlobFromLibrary = async (relativePath: string): Promise<Blob | null> => {
  try {
    const rootHandle = await getStoredFolderHandle();
    if (!rootHandle) return null;
    
    const parts = relativePath.split('/');
    let currentHandle: FileSystemDirectoryHandle | FileSystemFileHandle = rootHandle;
    
    for (let i = 0; i < parts.length; i++) {
      if (i === parts.length - 1) {
        currentHandle = await (currentHandle as FileSystemDirectoryHandle).getFileHandle(parts[i]);
      } else {
        currentHandle = await (currentHandle as FileSystemDirectoryHandle).getDirectoryHandle(parts[i]);
      }
    }
    
    return await (currentHandle as FileSystemFileHandle).getFile();
  } catch (err) {
    console.error("Failed to read file from library:", err);
    return null;
  }
};

export const disconnectLocalFolder = async (): Promise<void> => {
  await saveData(DIR_HANDLE_KEY, null);
};
