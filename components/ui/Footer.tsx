"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
    const pathname = usePathname();
    if (pathname?.includes('/admin')) return null;

    return (
        <footer className="border-t py-8 mt-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <div className="max-w-screen-xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="text-sm font-semibold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--foreground)" }}>
                    <span className="gradient-text">Pyu</span>Novel
                </span>
                <div className="flex items-center gap-6 text-sm" style={{ color: "var(--text-muted)" }}>
                    <a href="/about" className="hover:text-[var(--foreground)] transition">About</a>
                    <a href="/privacy" className="hover:text-[var(--foreground)] transition">Privacy</a>
                    <a href="/novel/create" className="hover:text-[var(--foreground)] transition">Write</a>
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    © {new Date().getFullYear()} PyuNovel
                </p>
            </div>
        </footer>
    );
}
