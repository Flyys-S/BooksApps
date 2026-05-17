# 📈 Bookify Project Progress Dashboard

Dokumen ini melacak secara detail seluruh kemajuan (progress) pengerjaan aplikasi **Bookify** dari Fase 1 hingga Fase 8. Setiap perubahan status akan diperbarui secara transparan dan teratur.

---

## 📊 Status Ringkasan Proyek

| Fase Pengerjaan | Target Pekerjaan | Status | Tanggal Mulai | Tanggal Selesai |
| :--- | :--- | :--- | :--- | :--- |
| **Fase 1** | Inisialisasi Proyek & Konfigurasi Dasar | ✅ Selesai | 2026-05-17 | 2026-05-17 |
| **Fase 2** | Skema Mock Data & Persiapan Aset EPUB | ✅ Selesai | 2026-05-17 | 2026-05-17 |
| **Fase 3** | Struktur Navigasi Global (Layout) | ✅ Selesai | 2026-05-17 | 2026-05-17 |
| **Fase 4** | Integrasi Zustand Global Store | ✅ Selesai | 2026-05-17 | 2026-05-17 |
| **Fase 5** | Implementasi Halaman Dashboard Utama | 🛠️ Sedang Dikerjakan | 2026-05-17 | - |
| **Fase 6** | Mini Reader Bar & Shared Layout | 🛠️ Sedang Dikerjakan | 2026-05-17 | - |
| **Fase 7** | Immersive Fullscreen & ePub.js | 🛠️ Sedang Dikerjakan | 2026-05-17 | - |
| **Fase 8** | Poles Detail Visual & Mikro-Animasi | ⏳ Antrean | - | - |

> **Keterangan Status:**
> * ⏳ **Antrean:** Pekerjaan belum dimulai.
> * 🛠️ **Sedang Dikerjakan:** Pekerjaan sedang diimplementasikan secara aktif.
> * ✅ **Selesai:** Pekerjaan selesai dilakukan dan telah melalui proses pengujian.

---

## 📝 Catatan Kemajuan Detil (Detailed Progress Logs)

### 📂 Tahap Saat Ini: Pembangunan Dashboard Utama & Modul Pembaca Buku (Fase 5, 6, 7)
*   **Status:** 🛠️ Sedang Dikerjakan
*   **Aktivitas Terbaru:** 
    *   Inisialisasi Next.js 16 (App Router, Tailwind CSS 4, TypeScript, ESLint, folder `src/`).
    *   Instalasi paket-paket utama: `zustand`, `framer-motion`, `lucide-react`, `epubjs`.
    *   Pembuatan berkas mock database statis di `src/data/mockData.ts`.
    *   Pembuatan modul *Zustand Global Store* dengan middleware `persist` (localStorage) di `src/store/useReaderStore.ts`.
    *   Membangun struktur navigasi global yang persisten: `Sidebar` desktop dan `BottomNav` mobile.
    *   Membuat persistent layout pembungkus halaman utama `src/app/(main)/layout.tsx`.
    *   Mengimplementasikan seluruh halaman utama: `Home Page (/)`, `Search Page (/search)`, `Genre Detail (/search/[genreId])`, `Library Page (/collection)`, `Profile Page (/user/[username])`.
    *   Mengimplementasikan halaman autentikasi: `Login Page (/login)` dan `Signup Page (/signup)`.
    *   Membangun fondasi pembaca buku: `MiniReaderBar` (bar melayang), `FullscreenReader` (pembaca layar penuh dynamic import `ssr: false`), dan `EpubReader` (modul rendering berkas EPUB via `epubjs`).
    *   Mengubah `globals.css` dengan tema Spotify gelap (`#121212`) dan scrollbar kustom yang elegan.
    *   **[UPDATE] Refactoring Komponen UI Atomik:** Memisahkan elemen UI berulang menjadi komponen tersendiri di `src/components/ui/` (`BookCard`, `GenreCard`, `StatCard`) agar folder UI tersusun rapih dan *maintainable*.
*   **Target Berikutnya:** Menyiapkan aset file `.epub` contoh di folder `public/books/` dan verifikasi kompilasi build untuk memastikan ePub.js tidak mengalami *runtime error* client-side.

---

## 🛠️ Daftar Tugas Mendetail (Detailed Checklist)

### [x] Fase 1: Inisialisasi Proyek & Konfigurasi Dasar
*   `[x]` Jalankan inisialisasi `create-next-app` di direktori root `./`
*   `[x]` Instalasi dependensi: `zustand`, `framer-motion`, `lucide-react`, `epubjs`
*   `[x]` Konfigurasi `src/app/globals.css` dengan variabel tema gelap Bookify
*   `[x]` Bersihkan komponen default Next.js (`page.tsx`, layout dll)

### [x] Fase 2: Skema Mock Data & Persiapan Aset EPUB
*   `[x]` Buat berkas database lokal `src/data/mockData.ts`
*   `[x]` Siapkan contoh file `.epub` di `public/books/` (Sukses memindahkan "Atomic Habits" ke folder ini)
*   `[ ]` Siapkan gambar sampul di `public/covers/`

### [x] Fase 3: Struktur Navigasi Global & Persistent Layout
*   `[x]` Buat folder group rute `(main)`
*   `[x]` Bangun sidebar navigasi desktop di `src/components/navigation/Sidebar.tsx`
*   `[x]` Bangun navigasi bawah mobile di `src/components/navigation/BottomNav.tsx`
*   `[x]` Implementasi persistent `layout.tsx` di `(main)`

### [x] Fase 4: Integrasi Zustand Global Store
*   `[x]` Buat berkas store `src/store/useReaderStore.ts`
*   `[x]` Aktifkan middleware persist (localStorage) pada store

### [/] Fase 5: Implementasi Halaman Dashboard Utama
*   `[x]` Buat halaman `/` (Home) dengan greeting dinamis dan section continue reading
*   `[x]` Buat halaman `/search` dengan live filter search dan genre grid
*   `[x]` Buat halaman `/collection` dengan penyaringan buku favorit (Liked)
*   `[x]` Buat halaman profile `/user/[username]` dengan membaca statistik pengguna
*   `[ ]` Buat halaman `/login` dan `/signup` fungsionalitas visual

### [/] Fase 6: Mini Reader Bar & Shared Layout Transition
*   `[x]` Buat komponen `src/components/reader/MiniReaderBar.tsx`
*   `[ ]` Integrasikan Framer Motion `layoutId` untuk transisi imersif secara sempurna

### [/] Fase 7: Immersive Fullscreen Reader & Integrasi ePub.js
*   `[x]` Buat komponen dynamic wrapper `src/components/reader/FullscreenReader.tsx` dengan SSR mati (`ssr: false`)
*   `[x]` Buat komponen mesin perender `src/components/reader/EpubReader.tsx` berbasis `epubjs`
*   `[x]` Terapkan Continuous Scroll Flow (mengubah halaman geser menjadi scroll berkelanjutan yang terpusat di tengah)
*   `[x]` Hubungkan kontrol navigasi (kibor panah, tombol virtual) ke handler ePub.js
*   `[x]` Terapkan listener event `relocated` untuk menyimpan lokasi CFI terbaru ke per-book state

### [/] Fase 8: Polish & Micro-Interactions
*   `[x]` Buat popover panel pengaturan tema dan ukuran font lengkap (Kustomisasi Tema, Font-Size, Font-Family, Line-Height, dan Margins)
*   `[x]` Implementasi Sistem Penanda Buku (Bookmarks) manual & interaktif
*   `[x]` Sinkronisasi Dashboard Dinamis (Lanjutkan Membaca membaca persentase asli dari store)
*   `[x]` Implementasi Kindle-style Text Selection (Tandai Terakhir Baca & Simpan Kutipan dari menu melayang)
*   `[x]` Custom Right-Click Context Menu inside Epub iframe & Dynamic Highlighter
*   `[x]` Tab "Kutipan" khusus di panel kontrol dengan remote delete & instant jump
*   `[x]` Animasi Dual-Ring Neon Loading Spinner premium dengan efek fade-pulse
*   `[x]` Premium Scroll-Reveal Paragraph Transitions (Efek memudar & meluncur ke atas saat di-scroll)
*   `[ ]` Implementasi efek transisi rute dengan `<AnimatePresence>` secara penuh
