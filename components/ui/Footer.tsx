"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
    const pathname = usePathname();
    if (pathname?.includes('/admin') || pathname?.includes('/create') || pathname?.includes('/edit')) return null;

    return (
        <footer className="border-t py-8 mt-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <div className="max-w-screen-xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="text-xl font-black tracking-tighter" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                    <span className="text-primary">Pyu</span>
                    <span className="text-foreground">Novel</span>
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
