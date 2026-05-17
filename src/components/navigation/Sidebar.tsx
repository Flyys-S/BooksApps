import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Library, Heart, User, BookOpen, Settings, Compass, Layers } from "lucide-react";
import { useReaderStore } from "@/store/useReaderStore";
import { mockUser } from "@/data/mockData";
import SettingsModal from "@/components/modals/SettingsModal";

export default function Sidebar() {
  const pathname = usePathname();
  const { currentBook, appAccentColor, userProfile } = useReaderStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/search", label: "Search", icon: Search },
    { href: "/collection", label: "Library", icon: Library },
  ];

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 bg-background border-r border-border p-6 flex-shrink-0 h-screen sticky top-0 transition-colors duration-500">
        {/* Brand Logo */}
        <div className="flex flex-col items-center gap-3 mb-8 w-full cursor-pointer">
          <div 
            className="p-3.5 rounded-2xl text-white shadow-lg animate-pulse"
            style={{ 
              background: `linear-gradient(135deg, ${appAccentColor || 'var(--accent-primary)'}, ${appAccentColor || 'var(--accent-primary)'}cc)` 
            }}
          >
            <BookOpen size={30} />
          </div>
          <span 
            className="font-black text-lg tracking-widest uppercase transition-colors duration-300"
            style={{ color: appAccentColor || 'var(--accent-primary)' }}
          >
            BOOKLIFY
          </span>
        </div>

        {/* Main Nav Links */}
        <nav className="space-y-2 flex-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  isActive
                    ? "bg-surface text-foreground font-semibold shadow-sm"
                    : "text-muted hover:bg-surface-hover/50 hover:text-foreground"
                }`}
              >
                <Icon
                  size={20}
                  className={`transition-transform duration-300 group-hover:scale-110 ${
                    isActive ? "text-accent" : "text-muted group-hover:text-foreground"
                  }`}
                />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="h-px bg-border my-6" />

          {/* Shortcuts / Quick Lists */}
          <Link
            href="/collection?tab=liked"
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
              pathname === "/collection" && pathname.includes("tab=liked")
                ? "bg-surface text-foreground font-semibold shadow-sm"
                : "text-muted hover:bg-surface-hover/50 hover:text-foreground"
            }`}
          >
            <div className="p-1 bg-gradient-to-tr from-rose-500 to-red-600 rounded text-white transition-transform duration-300 group-hover:scale-110">
              <Heart size={14} fill="currentColor" />
            </div>
            <span>Liked Books</span>
          </Link>

          <Link
            href="/collection?tab=all&type=manga"
            className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group text-muted hover:bg-surface-hover/50 hover:text-foreground"
          >
            <div className="p-1 bg-surface-hover border border-border rounded text-muted transition-transform duration-300 group-hover:scale-110 group-hover:text-accent">
              <Compass size={14} />
            </div>
            <span>Manga</span>
          </Link>
          
          <Link
            href="/collection?tab=all&type=manhwa"
            className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group text-muted hover:bg-surface-hover/50 hover:text-foreground"
          >
            <div className="p-1 bg-surface-hover border border-border rounded text-muted transition-transform duration-300 group-hover:scale-110 group-hover:text-accent">
              <Layers size={14} />
            </div>
            <span>Manhwa</span>
          </Link>
        </nav>

        {/* Settings Button */}
        <div className="mb-4">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group text-muted hover:bg-accent/10 hover:text-accent"
          >
            <Settings size={20} className="transition-transform duration-500 group-hover:rotate-180" />
            <span className="font-semibold">Pengaturan</span>
          </button>
        </div>

        {/* User Footer Profile */}
        <div className="border-t border-border pt-6">
          <Link
            href={`/user/${userProfile.username}`}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-hover/80 transition-all duration-300 group"
          >
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.fullName}
              className="w-10 h-10 rounded-full border border-border object-cover transition-colors duration-300"
              style={{ borderColor: appAccentColor || 'var(--border)' }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{userProfile.fullName}</p>
              <p className="text-xs text-muted truncate">@{userProfile.username}</p>
            </div>
          </Link>
        </div>
      </aside>

      {/* Render Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
