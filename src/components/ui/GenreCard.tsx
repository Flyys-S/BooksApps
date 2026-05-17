import Link from "next/link";
import { Genre } from "@/data/mockData";

interface GenreCardProps {
  genre: Genre;
}

export default function GenreCard({ genre }: GenreCardProps) {
  return (
    <Link
      href={`/search/${genre.id}`}
      className={`aspect-square p-5 rounded-2xl bg-gradient-to-br ${genre.gradient} shadow-lg relative overflow-hidden transition-all duration-300 hover:scale-103 cursor-pointer group`}
    >
      {/* Visual Circle Overlay */}
      <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/10 rounded-full group-hover:scale-110 transition-transform duration-500 blur-sm" />
      <h3 className="font-extrabold text-base md:text-lg text-white leading-tight break-words tracking-tight">
        {genre.name}
      </h3>
    </Link>
  );
}
