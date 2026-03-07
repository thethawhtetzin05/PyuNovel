"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Review {
    id: number;
    rating: number;
    comment: string | null;
    createdAt: Date;
    user: {
        id: string;
        name: string;
        image: string | null;
    };
}

interface ReviewSectionProps {
    novelId: number;
    novelSlug: string;
    reviews: Review[];
    userReview: Record<string, unknown> | null;
    isLoggedIn: boolean;
}

function RatingBar({ rating, count, total }: { rating: number; count: number; total: number }) {
    const percentage = total === 0 ? 0 : Math.round((count / total) * 100);

    const gradients: Record<number, string> = {
        5: 'from-emerald-400 to-teal-500',
        4: 'from-sky-400 to-blue-500',
        3: 'from-violet-400 to-purple-500',
        2: 'from-amber-400 to-orange-500',
        1: 'from-rose-400 to-red-500',
    };

    return (
        <div className="flex items-center gap-3 group">
            {/* Rating label */}
            <span className="text-sm font-bold text-[var(--text-muted)] w-4 shrink-0 text-right tabular-nums">
                {rating}
            </span>

            {/* Progress bar track */}
            <div className="flex-1 h-2.5 bg-[var(--surface-2)] rounded-full overflow-hidden border border-[var(--border)]">
                <div
                    className={`h-full rounded-full bg-gradient-to-r ${gradients[rating]} transition-all duration-700 ease-out`}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {/* Percentage */}
            <span className="text-sm font-bold text-[var(--text-muted)] w-10 shrink-0 tabular-nums">
                {percentage}%
            </span>
        </div>
    );
}

export default function ReviewSection({ novelId, novelSlug, reviews, userReview, isLoggedIn }: ReviewSectionProps) {
    const router = useRouter();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hoveredStar, setHoveredStar] = useState<number | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoggedIn) {
            router.push('/sign-in');
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch('/api/novel/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ novelId, novelSlug, rating, comment })
            });

            const data = await res.json() as { success: boolean; error?: string };
            if (!res.ok || !data.success) {
                alert(data.error || "Failed to submit review");
            } else {
                router.refresh();
            }
        } catch {
            alert("Error submitting review. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalReviews = reviews.length;
    const averageRating = totalReviews === 0
        ? 0
        : reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews;

    const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => { ratingCounts[r.rating] = (ratingCounts[r.rating] || 0) + 1; });

    return (
        <div className="w-full mt-12 bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">

            {/* ── Header ── */}
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                <h2 className="text-xl font-black text-[var(--foreground)]">Reviews & Ratings</h2>
                <span className="text-sm text-[var(--text-muted)] font-medium">{totalReviews} reviews</span>
            </div>

            <div className="p-6 space-y-8">

                {/* ── Rating Breakdown ── */}
                {totalReviews > 0 && (
                    <div className="flex flex-col sm:flex-row gap-6 p-5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                        {/* Average Score */}
                        <div className="flex flex-col items-center justify-center shrink-0 sm:pr-6 sm:border-r border-[var(--border)]">
                            <span className="text-6xl font-black text-[var(--foreground)] leading-none tabular-nums">
                                {averageRating.toFixed(1)}
                            </span>
                            <span className="text-sm text-[var(--text-muted)] font-medium mt-2">out of 5</span>
                        </div>

                        {/* Progress Bars */}
                        <div className="flex-1 space-y-2.5">
                            {[5, 4, 3, 2, 1].map(r => (
                                <RatingBar
                                    key={r}
                                    rating={r}
                                    count={ratingCounts[r] ?? 0}
                                    total={totalReviews}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Write / Your Review ── */}
                {!userReview ? (
                    <div className="bg-[var(--surface-2)] p-5 rounded-xl border border-[var(--border)]">
                        <h3 className="font-bold text-[var(--foreground)] mb-4">Write a Review</h3>
                        {isLoggedIn ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Star picker */}
                                <div className="flex items-center gap-1 mb-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoveredStar(star)}
                                            onMouseLeave={() => setHoveredStar(null)}
                                            className="focus:outline-none transition-transform hover:scale-110"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                className={`w-8 h-8 transition-colors ${(hoveredStar !== null ? star <= hoveredStar : star <= rating)
                                                    ? 'fill-amber-400 text-amber-400'
                                                    : 'fill-none text-[var(--border)]'
                                                    }`}
                                                stroke="currentColor"
                                                strokeWidth={1.5}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                            </svg>
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="What do you think about this novel?"
                                    className="w-full p-3 border border-[var(--border)] bg-[var(--surface)] rounded-xl focus:ring-2 focus:ring-[var(--action)]/40 focus:border-[var(--action)] outline-none transition-all resize-none h-24 text-[var(--foreground)] placeholder:text-[var(--text-muted)]"
                                />

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-[var(--action)] hover:bg-[var(--action-hover)] text-white font-bold px-6 py-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-[var(--action)]/20 disabled:opacity-50 text-sm"
                                    >
                                        {isSubmitting ? "Submitting..." : "Post Review"}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-[var(--text-muted)] mb-3 text-sm">Please sign in to leave a review</p>
                                <button
                                    onClick={() => router.push('/sign-in')}
                                    className="bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--action)] hover:text-[var(--action)] font-bold px-5 py-2 rounded-xl transition-all text-sm"
                                >
                                    Sign In
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-[var(--action)]/5 p-5 rounded-xl border border-[var(--action)]/20">
                        <h3 className="font-bold text-[var(--foreground)] mb-3">Your Review</h3>
                        <div className="flex items-center gap-1 mb-3">
                            {[1, 2, 3, 4, 5].map(star => (
                                <svg
                                    key={star}
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    className={`w-4 h-4 ${star <= userReview.rating ? 'fill-amber-400 text-amber-400' : 'fill-none text-[var(--border)]'}`}
                                    stroke="currentColor"
                                    strokeWidth={1.5}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                </svg>
                            ))}
                        </div>
                        {userReview.comment && (
                            <p className="text-[var(--foreground)] text-sm whitespace-pre-wrap">{userReview.comment}</p>
                        )}
                        <p className="text-xs text-[var(--text-muted)] mt-3">Thanks for sharing your thoughts!</p>
                    </div>
                )}

                {/* ── Reviews List ── */}
                <div className="space-y-4">
                    <h3 className="font-bold text-[var(--foreground)] pb-3 border-b border-[var(--border)]">Recent Reviews</h3>

                    {reviews.length === 0 ? (
                        <p className="text-center text-[var(--text-muted)] py-8 text-sm">No reviews yet. Be the first to review!</p>
                    ) : (
                        reviews.map((review) => (
                            <div key={review.id} className="flex gap-4">
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-[var(--action)]/10 border border-[var(--action)]/20 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                                    {review.user.image ? (
                                        <Image src={review.user.image} alt={review.user.name} fill className="object-cover" sizes="40px" />
                                    ) : (
                                        <span className="text-[var(--action)] font-black text-sm">
                                            {review.user.name.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 bg-[var(--surface-2)] rounded-2xl rounded-tl-none p-4 border border-[var(--border)]">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-[var(--foreground)] text-sm">{review.user.name}</h4>
                                            <div className="flex items-center gap-0.5 mt-1">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <svg
                                                        key={star}
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 24 24"
                                                        className={`w-3 h-3 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'fill-none text-[var(--border)]'}`}
                                                        stroke="currentColor"
                                                        strokeWidth={1.5}
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                                    </svg>
                                                ))}
                                            </div>
                                        </div>
                                        <span className="text-[11px] text-[var(--text-muted)] bg-[var(--surface)] px-2 py-1 rounded-full border border-[var(--border)]">
                                            {new Date(review.createdAt).toLocaleDateString(undefined, {
                                                year: 'numeric', month: 'short', day: 'numeric'
                                            })}
                                        </span>
                                    </div>

                                    {review.comment && (
                                        <p className="text-[var(--text-muted)] text-sm mt-3 leading-relaxed break-words whitespace-pre-wrap">
                                            {review.comment}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
