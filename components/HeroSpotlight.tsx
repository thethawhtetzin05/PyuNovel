"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

type SpotlightNovel = {
    slug: string;
    title: string;
    author: string;
    description: string | null;
    coverUrl: string | null;
    views: number | null;
    status: string | null;
};

type Props = {
    novels: SpotlightNovel[];
    totalNovels?: number;
};

const LABELS = [
    { text: "Bestseller", icon: "🏆", color: "#d97706" },
    { text: "Most Read", icon: "📖", color: "#4f46e5" },
    { text: "Most Popular", icon: "🔥", color: "#dc2626" },
] as const;

export default function HeroSpotlight({ novels, totalNovels }: Props) {
    const [current, setCurrent] = useState(0);
    const [fading, setFading] = useState(false);

    const goTo = useCallback((index: number) => {
        setFading(true);
        setTimeout(() => {
            setCurrent(index);
            setFading(false);
        }, 350);
    }, []);

    useEffect(() => {
        if (novels.length <= 1) return;
        const timer = setInterval(() => {
            goTo((current + 1) % novels.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [current, novels.length, goTo]);

    if (novels.length === 0) return null;

    const novel = novels[current];
    const label = LABELS[current % LABELS.length];

    return (
        <div
            className="relative overflow-hidden rounded-2xl"
            style={{ minHeight: "280px" }}
        >
            {/* Blurred background */}
            <div
                className="absolute inset-0 scale-110 transition-opacity duration-700"
                style={{ opacity: fading ? 0 : 1 }}
            >
                {novel.coverUrl ? (
                    <Image
                        src={novel.coverUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="100vw"
                        priority
                        style={{ filter: "blur(24px)" }}
                    />
                ) : (
                    <div
                        className="w-full h-full"
                        style={{ background: "var(--gradient-primary)" }}
                    />
                )}
                {/* Dark overlay */}
                <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.55)" }} />
            </div>

            {/* Content */}
            <div
                className="relative flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8 transition-opacity duration-350"
                style={{ opacity: fading ? 0 : 1 }}
            >
                {/* Cover image */}
                {novel.coverUrl && (
                    <div
                        className="shrink-0 rounded-xl overflow-hidden shadow-2xl"
                        style={{ width: "120px", height: "180px", position: "relative" }}
                    >
                        <Image
                            src={novel.coverUrl}
                            alt={novel.title}
                            fill
                            className="object-cover"
                            sizes="120px"
                            priority
                        />
                    </div>
                )}

                {/* Text block */}
                <div className="flex-1 min-w-0 text-white">
                    {/* Label */}
                    <span
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3"
                        style={{ background: label.color, color: "white" }}
                    >
                        {label.icon} {label.text}
                    </span>

                    <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-1 line-clamp-2" style={{ color: "white" }}>
                        {novel.title}
                    </h2>

                    <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.65)" }}>
                        by {novel.author}
                    </p>

                    {novel.description && (
                        <p className="text-sm leading-relaxed line-clamp-2 mb-5" style={{ color: "rgba(255,255,255,0.7)" }}>
                            {novel.description}
                        </p>
                    )}

                    {/* Divider line */}
                    {!novel.description && <div className="mb-5" />}

                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            href={`/novel/${novel.slug}`}
                            className="btn-primary px-5 py-2 text-sm font-semibold"
                        >
                            Start Reading →
                        </Link>
                        {novel.views != null && (
                            <span className="flex items-center gap-1.5 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                {novel.views.toLocaleString()}
                            </span>
                        )}
                        {novel.status && (
                            <span
                                className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white"
                                style={{ background: novel.status === "ongoing" ? "#10b981" : "#6366f1" }}
                            >
                                {novel.status}
                            </span>
                        )}
                    </div>
                </div>

                {/* Stats — total novels */}
                {totalNovels != null && totalNovels > 0 && (
                    <div
                        className="shrink-0 hidden sm:flex flex-col items-center justify-center rounded-2xl px-6 py-5 text-center gap-1"
                        style={{
                            background: "rgba(255,255,255,0.08)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            minWidth: "100px",
                        }}
                    >
                        <p className="text-3xl font-extrabold text-white">{totalNovels}+</p>
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>Novels</p>
                    </div>
                )}
            </div>

            {/* Dot nav */}
            {novels.length > 1 && (
                <div className="absolute bottom-4 right-5 flex items-center gap-1.5">
                    {novels.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => goTo(i)}
                            className="rounded-full transition-all duration-300"
                            style={{
                                width: i === current ? "20px" : "6px",
                                height: "6px",
                                background: i === current ? "white" : "rgba(255,255,255,0.35)",
                            }}
                            aria-label={`Show novel ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
