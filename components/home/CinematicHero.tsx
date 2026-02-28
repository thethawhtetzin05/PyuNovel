"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

type SpotlightNovel = {
    slug: string;
    title: string;
    author: string;
    description?: string | null;
    coverUrl: string | null;
    views?: number | null;
    status?: string | null;
};

type Props = {
    novels: SpotlightNovel[];
};

export default function CinematicHero({ novels }: Props) {
    const [current, setCurrent] = useState(0);
    const [fading, setFading] = useState(false);

    const goTo = useCallback((index: number) => {
        setFading(true);
        setTimeout(() => {
            setCurrent(index);
            setFading(false);
        }, 300); // Faster Wuxiaworld-style transitions
    }, []);

    useEffect(() => {
        if (novels.length <= 1) return;
        const timer = setInterval(() => {
            goTo((current + 1) % novels.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [current, novels.length, goTo]);

    if (novels.length === 0) return null;

    const novel = novels[current];

    return (
        <div className="relative w-full h-[320px] md:h-[400px] rounded-2xl overflow-hidden bg-[var(--surface-2)] border border-[var(--border)] group">
            {/* Background Cover slightly blurred */}
            <div
                className="absolute inset-0 transition-opacity duration-300 ease-in-out"
                style={{ opacity: fading ? 0 : 0.4 }}
            >
                {novel.coverUrl && (
                    <Image
                        src={novel.coverUrl}
                        alt="Hero background"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 70vw"
                        priority
                        style={{ filter: "blur(10px) brightness(0.6)" }}
                    />
                )}
            </div>

            {/* Gradient Mask to make text readable */}
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--surface)] via-[var(--surface)]/90 to-transparent w-[85%] md:w-[60%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] to-transparent h-full md:hidden opacity-90" />

            {/* Content Area */}
            <div className="relative z-10 w-full h-full flex flex-row items-center p-5 md:p-10 gap-4 md:gap-8">
                {/* Text Content (Left) */}
                <div
                    className="flex-1 min-w-0 flex flex-col justify-center transition-all duration-300 transform"
                    style={{
                        opacity: fading ? 0 : 1,
                        transform: fading ? "translateY(10px)" : "translateY(0)"
                    }}
                >
                    <Link href={`/novel/${novel.slug}`} className="block focus:outline-none">
                        <div className="flex items-center gap-2 mb-2 md:mb-3">
                            <span className="text-xs md:text-sm font-bold text-[var(--foreground)] flex items-center gap-1">
                                <span className="text-[var(--accent)]">👍</span> 100%
                            </span>
                            {novel.status && (
                                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide text-[var(--accent-foreground)] bg-emerald-600 px-2 py-0.5 rounded-full shadow-sm">
                                    {novel.status}
                                </span>
                            )}
                        </div>

                        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--foreground)] leading-tight mb-2 drop-shadow-md line-clamp-2">
                            {novel.title}
                        </h1>

                        {novel.description && (
                            <p className="text-xs sm:text-sm md:text-base text-[var(--text-muted)] max-w-xl leading-relaxed mb-4 md:mb-6 line-clamp-2 md:line-clamp-3">
                                {novel.description}
                            </p>
                        )}
                    </Link>
                </div>

                {/* Right Side Art (Always visible) */}
                <div
                    className="shrink-0 transition-all duration-300 transform w-[100px] xs:w-[120px] md:w-[180px]"
                    style={{
                        opacity: fading ? 0 : 1,
                        transform: fading ? "translateX(10px)" : "translateX(0)"
                    }}
                >
                    {novel.coverUrl && (
                        <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-[var(--border)] group-hover:scale-105 transition-transform duration-500">
                            <Image
                                src={novel.coverUrl}
                                alt={novel.title}
                                fill
                                className="object-cover"
                                sizes="180px"
                                priority
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Pagination Dots (WuxiaWorld style: blue or grey dots) */}
            {novels.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
                    {novels.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => goTo(i)}
                            className="rounded-full transition-all duration-300"
                            style={{
                                width: "6px",
                                height: "6px",
                                background: i === current ? "var(--action)" : "rgba(255,255,255,0.3)"
                            }}
                            aria-label={`Show featured novel ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
