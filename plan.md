Berikut adalah rencana lengkap, mendetail, dan terstruktur untuk proyek **Bookify** menggunakan format **EPUB asli**. Kamu bisa langsung menyalin seluruh teks di bawah ini dan memasukkannya ke dalam file `README.md` atau `PLAN.md` di repositori proyekmu.

---

# 📁 Bookify Project Plan & Architecture (EPUB Version)

Dokumen ini berisi cetak biru (blueprint) pengembangan aplikasi membaca buku "Bookify" menggunakan **Next.js**, **React**, dan **Framer Motion**. Konsep antarmuka dan pengalaman pengguna diadopsi dari **Spotify** dengan menggunakan file **EPUB** asli sebagai sumber bacaan.

---

## 🗺️ Alur Kerja Sistem Global (System Flow)

Aplikasi ini menggunakan pendekatan *Persistent Layout*. Navigasi, musik/buku latar belakang, dan status pembaca (*Reader State*) bersifat global sehingga tidak akan terputus saat pengguna berpindah halaman.

```
[ Unauthenticated User ] ──> /login atau /signup ──> (Autentikasi Sukses)
                                                             │
                                                             ▼
                                                    [ Authenticated User ]
                                                             │
    ┌───────────────────────────────┬────────────────────────┴────────────────────────┐
    ▼                               ▼                                                 ▼
📁 / (Home)                 📁 /search (Jelajah)                              📁 /collection (Library)
 ├─ Greeting dinamis         ├─ Kolom pencarian live                           ├─ Daftar Playlist Buku
 ├─ Quick Shortcuts          └─ Grid Kategori/Genre                            └─ Buku yang disukai (Liked)
 └─ Continue Reading             │                                                    │
    │                            ▼                                                    │
    │                       📁 /search/[genreId]                                      │
    │                            │                                                    │
    └────────────────────────────┴─────────────────────┬──────────────────────────────┘
                                                       │
                                               (Klik Kartu Buku)
                                                       │
                                                       ▼
                                            [ Aktifkan Mini Reader ]
                                         (Sticky di bagian bawah layar)
                                                       │
                                              (Klik Mini Reader Bar)
                                                       │
                                                       ▼
                                         [ Immersive Fullscreen Reader ]
                                         ├─ Integrasi ePub.js Rendering
                                         ├─ Table of Contents (Bab)
                                         └─ Reader Settings (Font/Tema)

```

---

## 🛠️ Tech Stack & Library Utama

* **Framework:** Next.js 15+ (App Router)
* **Styling:** Tailwind CSS (All-black aesthetic, Dark mode primary)
* **State Management:** Zustand (Ringan, global, cocok untuk sinkronisasi Player)
* **Animasi:** Framer Motion (Shared layout transitions & micro-interactions)
* **EPUB Parser & Renderer:** `epubjs` & `react-reader` (atau custom wrapper iframe `epub.js`)

---

## 🗂️ Struktur Folder Next.js (App Router)

Menggunakan *Route Groups* `(auth)` dan `(main)` untuk memisahkan halaman yang membutuhkan navigasi global dan yang tidak.

```text
src/
├── app/
│   ├── (auth)/                    # Group Halaman Autentikasi (Tanpa Sidebar/Reader)
│   │   ├── login/
│   │   │   └── page.tsx           # Halaman Masuk
│   │   └── signup/
│   │       └── page.tsx           # Halaman Daftar
│   │
│   ├── (main)/                    # Group Aplikasi Utama (Dengan Sidebar & Reader)
│   │   ├── layout.tsx             # Persistent Layout (Sidebar, Bottom Nav, Mini Reader)
│   │   ├── page.tsx               # Home Page (/)
│   │   ├── search/
│   │   │   ├── page.tsx           # Search Page (/search)
│   │   │   └── [genreId]/
│   │   │       └── page.tsx       # Detail Genre (/search/fiksi)
│   │   ├── collection/
│   │   │   └── page.tsx           # Library Page (/collection)
│   │   └── user/
│   │       └── [username]/
│   │           └── page.tsx       # Profile Page & Statistik (/user/raflyrajwa)
│   └── public/
│       ├── books/                 # Tempat menyimpan file .epub lokal
│       └── covers/                # Tempat menyimpan gambar sampul (.jpg/.png)

```

---

## 🧩 Global State Schema (Zustand Store)

Untuk meniru pemutar musik Spotify, kita membutuhkan satu *store* global (`useReaderStore`) untuk mengontrol buku yang sedang aktif.

```typescript
interface ReaderState {
  currentBook: Book | null;         // Buku yang sedang dibuka
  currentCfi: string | null;        // Koordinat halaman internal EPUB (EpubJS CFI)
  currentChapterTitle: string;      // Judul bab saat ini untuk Mini Reader
  isPlaying: boolean;               // Apakah mode fullscreen sedang terbuka
  progressPercent: number;          // Progres membaca (0 - 100)
  theme: 'dark' | 'sepia' | 'light';// Tema pembaca
  fontSize: number;                 // Ukuran font (dalam persentase, misal: 100 untuk 16px)
  
  // Actions
  playBook: (book: Book) => void;
  pauseBook: () => void;
  updateProgress: (cfi: string, percent: number, chapterTitle: string) => void;
  setTheme: (theme: 'dark' | 'sepia' | 'light') => void;
  setFontSize: (size: number) => void;
}

```

---

## 📃 Detail Fungsi Per Halaman (Page & Feature Specification)

### 1. Autentikasi (`/login` & `/signup`)

* **Alur Tampilan:** Desain minimalis serba hitam. Tombol submisi berbentuk bulat penuh (*rounded-full*).
* **Fungsi & Animasi:**
* Transisi halaman antara Login dan Sign Up menggunakan komponen `<motion.div>` dengan efek *fade & slide* horizontal agar terasa mulus.
* Validasi input lokal (Username, Email, Password). Jika sukses, simpan sesi ke *mock state* dan arahkan ke `/`.



### 2. Beranda (`/`)

* **Fungsi Greeting:** Logika sederhana di Next.js untuk mendeteksi waktu lokal client (Pagi: 05.00-11.59, Siang: 12.00-15.59, Sore: 16.00-18.59, Malam: 19.00-04.59) dan mengubah teks sapaan secara dinamis.
* **Quick Shortcuts Grid:** 6 kotak statis yang menampilkan buku yang paling sering dibuka. Saat di-*hover*, tombol *Play* mini akan muncul dengan animasi *scale-up* cepat.
* **Continue Reading Section:** Menampilkan satu kartu besar berisi buku yang memiliki `lastReadAt` paling baru. Menampilkan *progress bar* visual di bawahnya.

### 3. Pencarian & Eksplorasi (`/search` & `/search/[genreId]`)

* **Live Search Filter:** Komponen input pencarian yang mengamati perubahan teks. Menggunakan fungsi `.filter()` pada data array `mockBooks` untuk mencocokkan judul buku atau nama penulis secara *real-time* tanpa *page reload*.
* **Genre Color Grid:** Menampilkan daftar kategori menggunakan CSS Grid. Setiap kartu kategori memiliki properti gradien warna unik dari data lokal (contoh: `bg-gradient-to-br from-purple-600 to-pink-500`) seperti kartu genre Spotify.

### 4. Koleksi Pribadi (`/collection`)

* **Reading List Management:** Fungsi untuk menampilkan daftar "playlist" buku yang dibuat pengguna. Pengguna dapat menambah atau menghapus ID buku dari array `bookIds` di dalam playlist tersebut.
* **Liked Books Tab:** Menyaring data buku global berdasarkan ID buku yang ditandai *Liked* oleh pengguna.

### 5. Profil Pengguna (`/user/[username]`)

* **Statistik Membaca:** Menampilkan kalkulasi data akumulatif dari `mockUser.stats`, seperti total menit membaca dan buku yang diselesaikan.
* **Dynamic Avatar:** Menampilkan foto profil melingkar dengan micro-interaction: jika di-*hover*, akan muncul opsi untuk mengubah foto profil (efek transisi opacity overlay).

---

## 🎛️ Modul Pembaca Inti (The EPUB Immersive Reader)

Bagian ini tidak memicu rute URL baru, melainkan sebuah *Overlay Component* yang dirender secara kondisional di dalam `(main)/layout.tsx`.

### A. Mini Reader Bar (State: Terbuka Minim)

* **Fungsi:** Menempel di atas Bottom Navigation pada perangkat *mobile* atau di bagian bawah layar desktop. Menampilkan gambar sampul kecil, judul buku, judul bab saat ini, tombol tutup (tanda silang), dan *progress bar* setebal 2px di bagian paling atas bar.
* **Animasi:** Menggunakan properti `layoutId="reader-container"` dari Framer Motion. Ketika bar ini diklik, ia akan memicu fungsi `isPlaying: true` pada Zustand store.

### B. Fullscreen Immersive Reader (State: Terbuka Penuh)

* **Mekanisme Transisi (The Magic):** Berkat `layoutId="reader-container"` yang sama dengan Mini Reader, Framer Motion akan secara otomatis menghitung perubahan posisi dan ukuran komponen, lalu memperbesarnya secara halus (*shared layout transition*) dari bar kecil menjadi layar penuh.
* **Integrasi ePub.js:**
* Komponen mendengarkan `currentBook.coverUrl` untuk mengambil file `.epub` dari folder `public/books/`.
* Menggunakan library pembaca untuk merender konten HTML internal EPUB ke dalam wadah kontainer kita.
* Fungsi navigasi tombol "Kanan" dan "Kiri" akan memicu fungsi `rendition.next()` dan `rendition.prev()` bawaan dari ePub.js.
* Setiap kali halaman berpindah, *event listener* `relocated` dari ePub.js akan dipanggil untuk mengambil koordinat halaman baru (`cfi`) dan menyimpannya ke Zustand store agar progres membaca tidak hilang ketika pembaca ditutup.


* **Reader Settings Popover:** Sebuah menu kecil yang muncul dari bawah (*bottom sheet*) dengan efek *spring damping* untuk mengubah ukuran font (mengubah properti CSS `font-size` pada kontainer ePub.js) dan tema warna (Light/Sepia/Dark).

---

## 🚀 Rencana Langkah Implementasi

1. [ ] **Tahap 1:** Inisialisasi proyek Next.js dengan Tailwind CSS dan TypeScript.
2. [ ] **Tahap 2:** Setup folder data lokal (`src/data/mockData.ts`) untuk menyimpan data User, Book, Genre, dan Progress. Siapkan file `.epub` contoh di folder `public/books/`.
3. [ ] **Tahap 3:** Buat komponen Layout global `(main)/layout.tsx` beserta Sidebar dan Bottom Nav.
4. [ ] **Tahap 4:** Implementasi Halaman Home, Search, dan Collection dengan data lokal statis.
5. [ ] **Tahap 5:** Buat Zustand Store untuk mengelola status pemutar buku global.
6. [ ] **Tahap 6:** Bangun komponen Mini Reader Bar dan hubungkan dengan Framer Motion untuk transisi ke Fullscreen Reader.
7. [ ] **Tahap 7:** Integrasikan `epubjs` atau `react-reader` di dalam Fullscreen Reader agar file EPUB bisa dibaca secara interaktif.
8. [ ] **Tahap 8:** Sempurnakan detail mikro-animasi (Hover efek pada kartu buku, animasi popover pengaturan, dll).