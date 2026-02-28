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
    const touchStartX = useRef(0);
    const isDragging = useRef(false);

    const goTo = useCallback((index: number) => {
        setFading(true);
        setTimeout(() => {
            setCurrent(index);
            setFading(false);
        }, 300);
    }, []);

    useEffect(() => {
        if (novels.length <= 1) return;
        const timer = setInterval(() => {
            goTo((current + 1) % novels.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [current, novels.length, goTo]);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        isDragging.current = true;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!isDragging.current) return;
        isDragging.current = false;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (diff > 50) goTo((current + 1) % novels.length);
        else if (diff < -50) goTo((current - 1 + novels.length) % novels.length);
    };

    if (novels.length === 0) return null;

    const novel = novels[current];

    return (
        <div className="w-full">

            {/* ─── DESKTOP: Cinematic style ──────────────────────────── */}
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

            {/* ─── MOBILE: Coverflow carousel ────────────────────────── */}
            <div
                className="md:hidden relative w-full"
                style={{ height: "320px" }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <div className="absolute inset-0 flex items-center justify-center">
                    {novels.map((n, index) => {
                        let dist = index - current;
                        const total = novels.length;

                        // Normalise for circular wrap
                        if (dist < -Math.floor(total / 2)) dist += total;
                        if (dist > Math.floor(total / 2)) dist -= total;

                        // Only render -2 … +2 slots to keep DOM lean
                        if (Math.abs(dist) > 2) return null;

                        const isActive = dist === 0;
                        const isAdj = Math.abs(dist) === 1;

                        const CARD_W_PX = 200; // approximate rendered width at scale=1
                        const GAP_PX = 24;     // desired gap between card edges

                        // translateX is relative to the element's own width (scale applied).
                        // At scale=1 card is CARD_W_PX. Adjacent cards are scale 0.75 → 150px.
                        // Offset to clear center card: (CARD_W_PX/2 + GAP_PX + 150px/2) = 100+24+75 = 199px
                        // In % of own element width (200px): 199/200 ≈ 99.5%
                        const translateX = dist === 0 ? 0 : dist > 0
                            ? (CARD_W_PX / 2 + GAP_PX + (CARD_W_PX * 0.75) / 2) / CARD_W_PX * 100
                            : -((CARD_W_PX / 2 + GAP_PX + (CARD_W_PX * 0.75) / 2) / CARD_W_PX * 100);

                        const scale = isActive ? 1 : isAdj ? 0.75 : 0.58;
                        const opacity = isActive ? 1 : isAdj ? 0.55 : 0.25;
                        const zIndex = isActive ? 20 : isAdj ? 10 : 3;
                        const blurPx = isActive ? 0 : isAdj ? 1.5 : 3;

                        return (
                            <div
                                key={n.slug}
                                className="absolute transition-all duration-350 ease-in-out"
                                style={{
                                    width: `${CARD_W_PX}px`,
                                    aspectRatio: "2/3",
                                    transform: `translateX(${translateX}%) scale(${scale})`,
                                    opacity,
                                    zIndex,
                                    filter: blurPx ? `blur(${blurPx}px)` : "none",
                                    borderRadius: "16px",
                                    overflow: "hidden",
                                    boxShadow: isActive
                                        ? "0 0 32px rgba(0,210,210,0.55), 0 0 64px rgba(0,180,180,0.25), 0 8px 40px rgba(0,0,0,0.5)"
                                        : "0 4px 20px rgba(0,0,0,0.4)",
                                    border: isActive
                                        ? "2px solid rgba(0,220,220,0.7)"
                                        : "1px solid rgba(255,255,255,0.08)",
                                    // Pointer: non-active cards are "pass-through" click → goTo
                                    cursor: "pointer",
                                }}
                                onClick={() => { if (!isActive) goTo(index); }}
                            >
                                {/* Active card: real Link. Side cards: just decorative (click = goTo) */}
                                {isActive ? (
                                    <Link href={`/novel/${n.slug}`} className="relative w-full h-full block">
                                        {n.coverUrl ? (
                                            <Image src={n.coverUrl} alt={n.title} fill className="object-cover" sizes="220px" priority />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl" style={{ background: "var(--surface-2)" }}>📚</div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
                                        <div className="absolute bottom-0 left-0 right-0 p-3.5 pointer-events-none">
                                            {n.status && (
                                                <span className="inline-block mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white bg-emerald-600 px-1.5 py-0.5 rounded">
                                                    {n.status}
                                                </span>
                                            )}
                                            <h3 className="text-white font-extrabold text-base leading-snug line-clamp-2 drop-shadow-lg myan">
                                                {n.title}
                                            </h3>
                                            {n.author && (
                                                <p className="text-white/70 text-xs mt-1 truncate myan">{n.author}</p>
                                            )}
                                        </div>
                                    </Link>
                                ) : (
                                    <div className="relative w-full h-full">
                                        {n.coverUrl ? (
                                            <Image src={n.coverUrl} alt={n.title} fill className="object-cover" sizes="160px" />
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
