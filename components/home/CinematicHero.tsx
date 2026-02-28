"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from '@/i18n/routing';
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
    const [dragOffset, setDragOffset] = useState(0);
    const touchStartX = useRef(0);
    const isDragging = useRef(false);

    const goTo = useCallback((index: number, skipFade = false) => {
        if (skipFade) {
            setCurrent(index);
            setDragOffset(0);
            return;
        }
        setFading(true);
        setTimeout(() => {
            setCurrent(index);
            setFading(false);
            setDragOffset(0);
        }, 300);
    }, []);

    useEffect(() => {
        if (novels.length <= 1) return;
        const timer = setInterval(() => {
            if (!isDragging.current) {
                goTo((current + 1) % novels.length);
            }
        }, 6000);
        return () => clearInterval(timer);
    }, [current, novels.length, goTo]);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        isDragging.current = true;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging.current) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - touchStartX.current;
        setDragOffset(diff);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!isDragging.current) return;
        isDragging.current = false;
        
        const finalDiff = touchStartX.current - e.changedTouches[0].clientX;
        const threshold = 70;

        if (finalDiff > threshold) {
            goTo((current + 1) % novels.length, true);
        } else if (finalDiff < -threshold) {
            goTo((current - 1 + novels.length) % novels.length, true);
        } else {
            setDragOffset(0);
        }
    };

    if (novels.length === 0) return null;

    const novel = novels[current];

    return (
        <div className="w-full">
            {/* DESKTOP: Cinematic style */}
            <div className="hidden md:block relative w-full h-[400px] rounded-2xl overflow-hidden bg-[var(--surface-2)] border border-[var(--border)] group">
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
                            sizes="70vw"
                            priority
                            style={{ filter: "blur(10px) brightness(0.6)" }}
                        />
                    )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--surface)] via-[var(--surface)]/90 to-transparent w-[60%]" />

                <div className="relative z-10 w-full h-full flex flex-row items-center p-10 gap-8">
                    <div
                        className="flex-1 min-w-0 flex flex-col justify-center transition-all duration-300"
                        style={{ opacity: fading ? 0 : 1, transform: fading ? "translateY(10px)" : "translateY(0)" }}
                    >
                        <Link href={`/novel/${novel.slug}`} className="block focus:outline-none">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm font-bold text-[var(--foreground)] flex items-center gap-1">
                                    <span className="text-[var(--accent)]">👍</span> 100%
                                </span>
                                {novel.status && (
                                    <span className="text-xs font-bold uppercase tracking-wide text-white bg-emerald-600 px-2 py-0.5 rounded-full">
                                        {novel.status}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-bold text-[var(--foreground)] leading-tight mb-2 line-clamp-2">
                                {novel.title}
                            </h1>
                            {novel.description && (
                                <p className="text-sm md:text-base text-[var(--text-muted)] max-w-xl leading-relaxed mb-6 line-clamp-3">
                                    {novel.description}
                                </p>
                            )}
                        </Link>
                    </div>

                    <div
                        className="shrink-0 w-[180px] transition-all duration-300"
                        style={{ opacity: fading ? 0 : 1, transform: fading ? "translateX(10px)" : "translateX(0)" }}
                    >
                        {novel.coverUrl && (
                            <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-[var(--border)] group-hover:scale-105 transition-transform duration-500">
                                <Image src={novel.coverUrl} alt={novel.title} fill className="object-cover" sizes="180px" priority />
                            </div>
                        )}
                    </div>
                </div>

                {novels.length > 1 && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
                        {novels.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => goTo(i)}
                                className="rounded-full transition-all duration-300"
                                style={{
                                    width: "6px", height: "6px",
                                    background: i === current ? "var(--action)" : "rgba(150,150,150,0.4)"
                                }}
                                aria-label={`Show featured novel ${i + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* MOBILE: Coverflow carousel */}
            <div
                className="md:hidden relative w-full touch-pan-y select-none overflow-hidden"
                style={{ height: "340px" }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div 
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ 
                        transform: `translateX(${dragOffset}px)`,
                        transition: isDragging.current ? "none" : "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)"
                    }}
                >
                    {novels.map((n, index) => {
                        let dist = index - current;
                        const total = novels.length;
                        if (dist < -Math.floor(total / 2)) dist += total;
                        if (dist > Math.floor(total / 2)) dist -= total;
                        if (Math.abs(dist) > 2) return null;

                        const isActive = dist === 0;
                        const isAdj = Math.abs(dist) === 1;
                        const CARD_W_PX = 210; 
                        const GAP_PX = 20;     

                        const translateX = dist === 0 ? 0 : dist > 0
                            ? (CARD_W_PX / 2 + GAP_PX + (CARD_W_PX * 0.75) / 2) / CARD_W_PX * 100
                            : -((CARD_W_PX / 2 + GAP_PX + (CARD_W_PX * 0.75) / 2) / CARD_W_PX * 100);

                        const scale = isActive ? 1 : isAdj ? 0.8 : 0.6;
                        const opacity = isActive ? 1 : isAdj ? 0.6 : 0.3;
                        const zIndex = isActive ? 20 : isAdj ? 10 : 3;
                        const blurPx = isActive ? 0 : isAdj ? 1 : 4;

                        return (
                            <div
                                key={n.slug}
                                className="absolute transition-all duration-500 ease-out will-change-transform"
                                style={{
                                    width: `${CARD_W_PX}px`,
                                    aspectRatio: "2/3",
                                    transform: `translateX(${translateX}%) scale(${scale})`,
                                    opacity,
                                    zIndex,
                                    filter: blurPx ? `blur(${blurPx}px)` : "none",
                                    borderRadius: "20px",
                                    overflow: "hidden",
                                    boxShadow: isActive
                                        ? "0 10px 40px rgba(0,0,0,0.4), 0 0 20px rgba(79, 70, 229, 0.3)"
                                        : "0 4px 15px rgba(0,0,0,0.3)",
                                    border: isActive
                                        ? "1px solid rgba(255,255,255,0.2)"
                                        : "1px solid rgba(255,255,255,0.05)",
                                    cursor: "pointer",
                                }}
                                onClick={() => { if (!isActive) goTo(index, true); }}
                            >
                                {isActive ? (
                                    <Link href={`/novel/${n.slug}`} className="relative w-full h-full block">
                                        {n.coverUrl ? (
                                            <Image src={n.coverUrl} alt={n.title} fill className="object-cover" sizes="220px" priority />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl" style={{ background: "var(--surface-2)" }}>📚</div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent pointer-events-none" />
                                        <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
                                            <h3 className="text-white font-extrabold text-base leading-tight line-clamp-2 myan">
                                                {n.title}
                                            </h3>
                                        </div>
                                    </Link>
                                ) : (
                                    <div className="relative w-full h-full">
                                        {n.coverUrl ? (
                                            <Image src={n.coverUrl} alt={n.title} fill className="object-cover" sizes="180px" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-3xl" style={{ background: "var(--surface-2)" }}>📚</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Dot indicators */}
                {novels.length > 1 && (
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-30">
                        {novels.map((_, i) => (
                            <div
                                key={i}
                                className="rounded-full transition-all duration-300"
                                onClick={() => goTo(i)}
                                style={{
                                    width: i === current ? "18px" : "6px",
                                    height: "6px",
                                    cursor: "pointer",
                                    background: i === current ? "rgba(0,220,210,0.9)" : "rgba(255,255,255,0.3)",
                                    boxShadow: i === current ? "0 0 8px rgba(0,220,210,0.6)" : "none",
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
