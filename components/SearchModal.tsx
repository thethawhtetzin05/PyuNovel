"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { novels } from "@/db/schema";
import { useRouter } from "next/navigation";

type Novel = typeof novels.$inferSelect;

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: Props) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Novel[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
            setQuery("");
            setResults([]);
        }

        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose]);

    useEffect(() => {
        const fetchResults = async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data = await response.json() as { success: boolean; results: Novel[] };
                if (data.success) {
                    setResults(data.results);
                }
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const debounce = setTimeout(fetchResults, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 md:p-12 lg:p-24 bg-black/40 backdrop-blur-xl animate-fade-in">
            <div
                className="absolute inset-0 z-0"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
                {/* Search Input */}
                <div className="flex items-center gap-4 px-6 py-5 border-b border-[var(--border)] bg-[var(--surface-2)]">
                    <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for novels or authors..."
                        className="flex-1 bg-transparent text-lg md:text-xl text-[var(--foreground)] placeholder-[var(--text-muted)] focus:outline-none font-medium"
                    />
                    {isLoading && (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-[var(--action)] border-t-transparent" />
                    )}
                    <button
                        onClick={onClose}
                        className="px-2 py-1 rounded-lg bg-[var(--surface-3)] text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest hover:text-[var(--foreground)] transition-colors"
                    >
                        Esc
                    </button>
                </div>

                {/* Results Area */}
                <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden">
                    {query.trim() === "" ? (
                        <div className="p-12 text-center">
                            <div className="text-4xl mb-4">✨</div>
                            <p className="text-[var(--text-muted)] font-medium">Type something to start searching...</p>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="p-3 grid grid-cols-1 gap-1">
                            {results.map((novel) => (
                                <Link
                                    key={novel.slug}
                                    href={`/novel/${novel.slug}`}
                                    onClick={onClose}
                                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-[var(--surface-2)] transition-colors border border-transparent hover:border-[var(--border)] group"
                                >
                                    <div className="relative w-12 h-16 rounded-lg overflow-hidden shrink-0 bg-[var(--surface-3)]">
                                        {novel.coverUrl ? (
                                            <Image
                                                src={novel.coverUrl}
                                                alt={novel.title}
                                                fill
                                                className="object-cover"
                                                sizes="48px"
                                            />
                                        ) : "📚"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-[var(--foreground)] truncate group-hover:text-[var(--action)] transition-colors">
                                            {novel.title}
                                        </h4>
                                        <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate italic">By {novel.author}</p>
                                    </div>
                                    <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        View Details
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : !isLoading ? (
                        <div className="p-12 text-center text-[var(--text-muted)]">
                            <p className="text-3xl mb-4">🔍</p>
                            <p className="font-medium">No results found for &ldquo;{query}&rdquo;</p>
                        </div>
                    ) : null}
                </div>

                {/* Footer Tips */}
                <div className="px-6 py-3 bg-[var(--surface-2)] border-t border-[var(--border)] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                            <span className="px-1.5 py-0.5 rounded bg-[var(--surface-3)] border border-[var(--border)] leading-none text-[8px]">Enter</span> Select
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                            <span className="px-1.5 py-0.5 rounded bg-[var(--surface-3)] border border-[var(--border)] leading-none text-[8px]">↑↓</span> Navigate
                        </span>
                    </div>
                    <span className="text-[10px] font-bold text-[var(--action)] truncate">PYU NOVEL SEARCH</span>
                </div>
            </div>
        </div>
    );
}
