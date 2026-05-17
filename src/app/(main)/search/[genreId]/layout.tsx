export function generateStaticParams() {
  return [
    { genreId: "all" },
    { genreId: "book" },
    { genreId: "manga" },
    { genreId: "manhwa" }
  ];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
