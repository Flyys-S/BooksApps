"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Library, User } from "lucide-react";
import { useReaderStore } from "@/store/useReaderStore";

export default function BottomNav() {
  const pathname = usePathname();
  const { userProfile } = useReaderStore();

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/search", label: "Search", icon: Search },
    { href: "/collection", label: "Library", icon: Library },
    { href: `/user/${userProfile.username}`, label: "Profile", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border flex items-center justify-around px-4 z-40 transition-colors duration-500">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${
              isActive ? "text-accent scale-105" : "text-muted hover:text-foreground"
            }`}
          >
            <Icon size={20} className={isActive ? "stroke-[2.5]" : "stroke-2"} />
            <span className="text-[10px] font-medium tracking-wide">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
