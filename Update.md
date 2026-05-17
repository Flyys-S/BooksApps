# 🔄 Bookify Project Updates & Changelog

Dokumen ini mencatat setiap perubahan penting, pembaruan arsitektur, revisi kode, atau perubahan desain yang terjadi selama siklus hidup pengembangan aplikasi **Bookify**.

---

## 📅 Riwayat Pembaruan (Update History)

### [v0.2.3] - 2026-05-17
#### 💬 Kindle-Style Text Selection, Custom Context-Menu, & Persistent Highlighter
*   **Kindle-Style Selection Toolbar (Menu Melayang):**
    *   Mendeteksi seleksi teks di dalam dokumen pembaca (`selected` event ePub.js) dan menampilkan menu melayang mini (*floating selection menu*) persis di atas teks yang dipilih.
    *   Tersedia opsi **📍 Terakhir Baca** untuk menandai persis kalimat atau kata tersebut sebagai baris terakhir dibaca. Ini juga langsung menyalakan highlight warna ungu (*violet*) transparan di teks tersebut.
    *   Tersedia opsi **💬 Simpan Kutipan** untuk menyimpan teks yang diseleksi ke tab Kutipan dengan highlight warna oranye hangat (*amber*).
*   **Custom Context-Menu Klik Kanan:**
    *   Mengatur event listener `contextmenu` di dalam iframe dokumen ePub.js.
    *   Menghilangkan klik kanan bawaan browser (default override) apabila user menyeleksi teks, lalu menggantinya dengan menu taktis premium Bookify untuk kenyamanan pembaca.
*   **Daftar Kutipan Interaktif (Tab Kutipan):**
    *   Menambahkan tab ketiga **Kutipan** di popover setelan pembaca di FullscreenReader.tsx.
    *   Menampilkan seluruh kutipan yang disimpan lengkap dengan nama bab, kutipan kutipan bergaya editorial (*blockquotes style*), dan penanda waktu penyimpanan yang elegan.
    *   Mendukung lompatan instan (*teleportation*) ke lokasi kutipan di buku saat di-klik, serta tombol penghapusan kutipan di masing-masing baris.
*   **Non-Blocking Toast System:**
    *   Mengganti `alert()` browser yang memblokir layar dengan komponen Toast kustom modern di bagian bawah pembaca layar penuh yang muncul dengan micro-animation lalu menghilang dalam 3 detik.
*   **Dual-Ring Glowing Spinner & Fade Animations:**
    *   Mengganti loading spinner `Loader2` sederhana dengan dual-ring spinning neon ring (lingkaran gradasi ungu-merah muda yang berputar berlawanan arah dengan bayangan pendaran neon) di layar penuh pembaca dan saat buku diurai.
    *   Dilengkapi dengan ikon buku yang berdenyut (*pulsing BookOpen*) di tengah lingkaran dan teks dengan efek *fade-pulse* transisi lembut.
*   **Premium Scroll-Reveal Paragraph Transitions (IntersectionObserver):**
    *   Mengintegrasikan `IntersectionObserver` tingkat induk (*parent window*) yang melacak posisi setiap paragraf (`p`), judul (`h1`-`h6`), kutipan (`blockquote`), daftar (`li`), dan gambar (`img`) di dalam *iframe* buku secara langsung.
    *   Menyuntikkan stylesheet transisi dinamis dengan kurva bezier premium (`cubic-bezier(0.16, 1, 0.3, 1)`).
    *   Setiap kali pembaca men-scroll ke bawah, paragraf baru akan **memudar dari transparansi 15% menuju 100%** sekaligus **meluncur ke atas sejauh 24px** secara super lembut, memberikan kesan membaca situs editorial premium yang megah dan tidak monoton!
*   **Customizable Typography & Reading Layouts Control Panel:**
    *   Menambahkan kontrol **Gaya Huruf (Font Family)** dengan tiga tipe visual: *Modern* (Sans-serif bersih untuk kejelasan tinggi), *Klasik* (Serif Georgia indah dengan ornamen editorial untuk kenyamanan membaca novel/fiksi), dan *Kode* (Monospace JetBrains Mono untuk buku pemrograman/teknis).
    *   Menambahkan kontrol **Jarak Baris (Spasi / Line Height)** dengan tiga opsi: *Rapat* (1.4 untuk kepadatan informasi), *Sedang* (1.8 standar kenyamanan), dan *Renggang* (2.2 untuk pembaca dengan gangguan disleksia atau kelelahan mata).
    *   Menambahkan kontrol **Lebar Membaca (Margins)** dengan tiga opsi: *Fokus* (Kolom sempit 540px untuk melatih kecepatan fokus), *Standar* (720px rata tengah seimbang), dan *Luas* (Kolom lebar 900px untuk memanfaatkan layar penuh).

### [v0.2.2] - 2026-05-17
#### 🔖 Sistem Penanda Buku (Bookmarks) Interaktif & Dashboard Sinkron
*   **Sistem Penanda Buku (Manual Bookmarks):**
    *   Menambahkan tombol pita pembatas buku (*bookmark ribbon*) di pojok kanan atas layar penuh pembaca.
    *   Mendukung penanda ganda per buku, lengkap dengan informasi Bab, waktu penyimpanan, serta persentase progres membaca secara presisi.
    *   Menyediakan tab "Penanda" khusus di panel popover setelan pembaca untuk melihat daftar penanda, melompat ke lokasi penanda instan (*jump to CFI*), serta menghapus penanda.
*   **Lanjutan Membaca Dinamis (Dashboard Sync):**
    *   Menghubungkan panel "Terakhir Dibaca" di Beranda langsung ke Zustand store.
    *   Aplikasi kini mendeteksi buku mana yang terakhir kali mengalami progres membaca secara nyata, lalu merender judul buku, deskripsi, bab aktif, serta persentase progres membaca secara real-time.
    *   Mengubah badge secara cerdas menjadi "Mulai Membaca" jika buku baru di-klik, atau "Lanjutkan: Bab X (Y%)" jika buku tersebut sudah memiliki progres membaca tersimpan.

### [v0.2.1] - 2026-05-17
#### 🎨 Refactoring Komponen UI Atomik & Integrasi Buku Nyata (Atomic Habits)
*   **Mode Continuous Scroll Premium:**
    *   Mengubah mekanisme e-reader dari geser halaman (*paginated paging*) menjadi gulir berkelanjutan (*continuous scrolled flow*) agar pengalaman membaca jauh lebih mengalir dan natural.
    *   Memperluas viewport pembaca hingga `max-w-5xl` (hampir satu layar penuh) dengan latar belakang transparan yang menyatu dengan tema.
    *   Menerapkan penataan teks bergaya editorial Medium/Kindle di dalam iframe (font modern, `line-height: 1.8`, lebar teks ideal `max-width: 720px` terpusat di tengah layar).
*   **Pemindahan & Integrasi Buku Nyata:**
    *   Mendeteksi file buku nyata `Atomic_Habits_Tiny_Changes_Remarkable_Results_by_James_Clear.epub` di root repositori dan memindahkannya ke dalam folder `public/books/`.
    *   Menambahkan genre kategori baru `selfhelp` (Pengembangan Diri) ke dalam list genre lokal.
    *   Mendaftarkan buku **Atomic Habits** oleh **James Clear** ke dalam `mockBooks` di `src/data/mockData.ts` sehingga dapat dimainkan langsung dari dashboard Bookify secara instan.
*   **Pembuatan Reusable Components:** 
    *   Membuat `src/components/ui/BookCard.tsx` untuk menampilkan kartu buku yang konsisten dengan desain Spotify.
    *   Membuat `src/components/ui/GenreCard.tsx` untuk menampilkan grid kategori bergradien.
    *   Membuat `src/components/ui/StatCard.tsx` untuk modularisasi informasi statistik di halaman profil.
*   **Pembersihan Kode Halaman (Clean Code):**
    *   Me-refactor `src/app/(main)/search/page.tsx`, `src/app/(main)/search/[genreId]/page.tsx`, `src/app/(main)/collection/page.tsx`, dan `src/app/(main)/user/[username]/page.tsx` agar menggunakan komponen UI berulang tersebut, mengurangi duplikasi kode, dan membuat file menjadi sangat rapi ("tersusun rapih").

### [v0.2.0] - 2026-05-17
#### 🏗️ Pembuatan Struktur Folder, Zustand Store, Navigasi Global, Halaman Dashboard, & ePub.js Core Module
*   **Inisialisasi Proyek:**
    *   Berhasil menginisialisasi Next.js 16 (App Router, Tailwind CSS 4, TypeScript, ESLint) di root repositori.
    *   Menginstal dependensi utama: `zustand`, `framer-motion`, `lucide-react`, `epubjs`.
*   **Arsitektur Folder & Routing:**
    *   Menerapkan Route Groups: `(main)` untuk aplikasi utama (dengan sidebar/bottom nav/pembaca) dan `(auth)` untuk proses masuk/daftar.
    *   Membuat persistent layout di `src/app/(main)/layout.tsx` untuk menjaga kelangsungan mini reader pemutar buku.
*   **Zustand Global Store:**
    *   Membuat store global `src/store/useReaderStore.ts` dengan middleware `persist` (localStorage) untuk menyimpan lokasi membaca (`cfi`), pilihan tema warna pembaca (`dark`, `sepia`, `light`), dan ukuran font.
*   **Persistent Navigation & Layout Components:**
    *   Membuat `Sidebar.tsx` (desktop) dengan visual logo Bookify dinamis dan navigasi shortcut.
    *   Membuat `BottomNav.tsx` (mobile) dengan ergonomi navigasi melayang setebal 64px.
*   **Halaman Dashboard:**
    *   Membuat halaman `Home` (`/`) dengan ucapan sapaan waktu lokal dinamis, shortcut grid hover play, dan section continue reading progres bar.
    *   Membuat halaman `Search` (`/search`) dengan filter live search client-side dan grid genre gradien.
    *   Membuat halaman `GenreDetailPage` (`/search/[genreId]`) dinamis untuk menampilkan daftar buku per genre.
    *   Membuat halaman `Library` (`/collection`) dengan tabs filter buku favorit (Liked Books).
    *   Membuat halaman `Profile` (`/user/[username]`) dengan diagram visual pencapaian total menit membaca dan streak harian.
    *   Membuat halaman `Login` (`/login`) dan `Signup` (`/signup`) dengan animasi transisi geser horizontal Framer Motion.
*   **Modul Pembaca ePub.js:**
    *   Membuat `MiniReaderBar.tsx` (bar mini melayang) dengan visual progres bar setebal 2px dan kontrol play/pause/close.
    *   Membuat `EpubReader.tsx` (raw reader engine) menggunakan `epubjs` untuk parsing file EPUB, navigasi kibor panah kiri/kanan, dan tracking lokasi koordinat CFI lewat event `relocated`.
    *   Membuat `FullscreenReader.tsx` (overlay layar penuh) menggunakan dynamic import `ssr: false` agar terhindar dari *window is not defined error* saat build Next.js.
*   **Styling:**
    *   Mengubah `globals.css` dengan Spotify-inspired dark background (`#121212`) dan scrollbar kustom yang elegan.

### [v0.1.0] - 2026-05-17
#### 🏗️ Inisialisasi Fondasi Proyek & Perencanaan
*   **Ditambahkan:**
    *   Cetak biru pengerjaan detail `plan.md` di repositori.
    *   File rencana implementasi profesional `implementation.md`.
    *   File pelacak status pengerjaan komprehensif `Progress.md` (Fase 1 - 8).
    *   File log pembaruan proyek `Update.md` (dokumen ini).
*   **Direvisi:**
    *   Menyusun ulang tata letak dokumen rencana implementasi agar berfokus pada visualisasi UI terlebih dahulu, kemudian diagram alur menyeluruh, disusul rincian fungsi, baru kemudian fase instalasi teknis.
*   **Status Proyek:** Persiapan inisialisasi Next.js (Fase 1).

---

## 📌 Catatan Perubahan Penting (Significant Decision Logs)

*   **Penyelesaian Masalah SSR epub.js:** Menggunakan dynamic import dengan parameter `{ ssr: false }` pada pembaca utama agar `epubjs` yang memerlukan manipulasi DOM tidak terpanggil saat rendering sisi server (SSR) di Next.js App Router.
