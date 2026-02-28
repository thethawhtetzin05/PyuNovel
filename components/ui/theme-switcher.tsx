"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="w-10 h-10" />;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500 hover:scale-105 active:scale-95 group overflow-hidden"
      style={{
        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
        border: "1px solid var(--border)",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      }}
      aria-label="Toggle Theme"
      title="Toggle Theme"
    >
      {/* Dynamic background glow on hover */}
      <div className="absolute inset-0 rounded-full bg-[var(--accent)] opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" />

      {/* Sun Icon */}
      <div
        className={`absolute transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${isDark
            ? "translate-y-8 opacity-0 rotate-45 scale-75 blur-sm"
            : "translate-y-0 opacity-100 rotate-0 scale-100 text-[var(--accent)] drop-shadow-sm blur-0"
          }`}
      >
        <Sun size={20} strokeWidth={2.2} />
      </div>

      {/* Moon Icon */}
      <div
        className={`absolute transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${isDark
            ? "translate-y-0 opacity-100 rotate-0 scale-100 text-[var(--accent)] drop-shadow-[0_0_8px_rgba(253,224,71,0.4)] blur-0"
            : "-translate-y-8 opacity-0 -rotate-45 scale-75 blur-sm text-gray-400"
          }`}
      >
        <Moon size={18} strokeWidth={2.5} />
      </div>
    </button>
  );
}