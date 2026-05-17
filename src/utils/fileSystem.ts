import { saveData, getData, saveBookFile } from "./db";

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

    // Membuka dialog pemilih folder
    // @ts-ignore
    const dirHandle = await window.showDirectoryPicker({
      id: "bookify-folder",
      mode: "read",
    });

    // Simpan handle ke IndexedDB agar bisa diakses lagi tanpa memilih ulang dari awal
    await saveData(DIR_HANDLE_KEY, dirHandle);

    return dirHandle;
  } catch (error: any) {
    // Pengguna membatalkan pemilihan atau terjadi error
    if (error.name !== "AbortError") {
      console.error("Error picking folder:", error);
      throw error;
    }
    return null;
  }
};

/**
 * Mendapatkan handle folder yang tersimpan dari IndexedDB
 */
export const getStoredFolderHandle = async (): Promise<FileSystemDirectoryHandle | null> => {
  try {
    const handle = await getData(DIR_HANDLE_KEY);
    return handle;
  } catch (error) {
    console.error("Error getting stored folder handle:", error);
    return null;
  }
};

/**
 * Memverifikasi izin akses ke folder. Jika izin hilang (misalnya setelah refresh),
 * aplikasi akan meminta izin ulang kepada pengguna tanpa membuka dialog folder baru.
 */
export const verifyPermission = async (fileHandle: FileSystemDirectoryHandle | FileSystemFileHandle, readWrite: boolean = false): Promise<boolean> => {
  const options = {
    mode: readWrite ? "readwrite" : "read",
  };

  try {
    // Memeriksa status izin saat ini
    // @ts-ignore
    if ((await fileHandle.queryPermission(options)) === "granted") {
      return true;
    }

    // Jika belum diizinkan, minta izin
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

export interface ScannedFile {
  file: File;
  type: "book" | "manga" | "manhwa";
}

/**
 * Memindai semua file .epub dan .cbz secara rekursif di dalam folder dan subfolder.
 * Menentukan tipe berdasarkan nama subfolder.
 */
export const scanFolderForBooks = async (dirHandle: FileSystemDirectoryHandle, currentPath: string = ""): Promise<ScannedFile[]> => {
  let scannedFiles: ScannedFile[] = [];

  try {
    // @ts-ignore
    for await (const entry of dirHandle.values()) {
      if (entry.kind === "file") {
        const name = entry.name.toLowerCase();
        if (name.endsWith(".epub") || name.endsWith(".cbz") || name.endsWith(".zip")) {
          const file = await entry.getFile();
          
          let fileType: "book" | "manga" | "manhwa" = "book";
          if (name.endsWith(".cbz") || name.endsWith(".zip")) {
            fileType = "manga"; // Default untuk cbz
          }

          // Cek path folder untuk override
          const pathLower = currentPath.toLowerCase();
          if (pathLower.includes("manhwa")) {
            fileType = "manhwa";
          } else if (pathLower.includes("manga")) {
            fileType = "manga";
          } else if (pathLower.includes("books")) {
            fileType = "book";
          }

          scannedFiles.push({ file, type: fileType });
        }
      } else if (entry.kind === "directory") {
        // Rekursif ke dalam subfolder
        const subPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
        // @ts-ignore
        const subHandle = await dirHandle.getDirectoryHandle(entry.name);
        const subFiles = await scanFolderForBooks(subHandle, subPath);
        scannedFiles = [...scannedFiles, ...subFiles];
      }
    }
  } catch (error) {
    console.error(`Error scanning folder ${currentPath}:`, error);
  }

  return scannedFiles;
};

/**
 * Memutuskan koneksi folder lokal dari aplikasi
 */
export const disconnectLocalFolder = async (): Promise<void> => {
  await saveData(DIR_HANDLE_KEY, null);
};
