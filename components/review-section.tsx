"use client";

import { useState } from 'react';
import { Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
    userReview: any | null;
    isLoggedIn: boolean;
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
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    novelId,
                    novelSlug,
                    rating,
                    comment
                })
            });

            const data = await res.json() as { success: boolean; error?: string };
            if (!res.ok || !data.success) {
                alert(data.error || "Failed to submit review");
            } else {
                router.refresh(); // Refresh page to show new review
            }
        } catch (error) {
            alert("Error submitting review. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const calculateAverageRating = () => {
        if (reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return (sum / reviews.length).toFixed(1);
    };

    return (
        <div className="w-full mt-12 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900">Reviews & Ratings</h2>
                <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-gray-900 text-lg">{calculateAverageRating()}</span>
                    <span className="text-gray-500 text-sm">({reviews.length})</span>
                </div>
            </div>

            <div className="p-6">
                {/* Write a review section */}
                {!userReview ? (
                    <div className="mb-10 bg-gray-50 p-5 rounded-xl border border-gray-100">
                        <h3 className="font-semibold text-gray-800 mb-4">Write a Review</h3>
                        {isLoggedIn ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
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
                                            <Star
                                                className={`w-8 h-8 ${(hoveredStar !== null ? star <= hoveredStar : star <= rating)
                                                    ? 'fill-yellow-400 text-yellow-400'
                                                    : 'text-gray-300'
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="What do you think about this novel?"
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none h-24 text-gray-700"
                                ></textarea>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 text-sm"
                                    >
                                        {isSubmitting ? "Submitting..." : "Post Review"}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-gray-500 mb-3">Please sign in to leave a review</p>
                                <button
                                    onClick={() => router.push('/sign-in')}
                                    className="bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 font-medium px-5 py-2 rounded-lg transition-colors text-sm shadow-sm"
                                >
                                    Sign In
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="mb-10 bg-indigo-50/50 p-5 rounded-xl border border-indigo-100">
                        <h3 className="font-medium text-indigo-900 mb-2">Your Review</h3>
                        <div className="flex items-center gap-1 mb-3">
                            {[1, 2, 3, 4, 5].map(star => (
                                <Star key={star} className={`w-4 h-4 ${star <= userReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                            ))}
                        </div>
                        {userReview.comment && (
                            <p className="text-gray-700 text-sm whitespace-pre-wrap">{userReview.comment}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-3 flex items-center justify-between">
                            Thanks for sharing your thoughts!
                        </p>
                    </div>
                )}

                {/* Reviews List */}
                <div className="space-y-6">
                    <h3 className="font-semibold text-gray-900 pb-2 border-b border-gray-100">Recent Reviews</h3>

                    {reviews.length === 0 ? (
                        <p className="text-center text-gray-400 py-8">No reviews yet. Be the first to review!</p>
                    ) : (
                        reviews.map((review) => (
                            <div key={review.id} className="flex gap-4">
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                                    {review.user.image ? (
                                        <img src={review.user.image} alt={review.user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-indigo-600 font-bold text-sm">
                                            {review.user.name.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 bg-gray-50 rounded-xl rounded-tl-none p-4 border border-gray-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-medium text-gray-900 text-sm">{review.user.name}</h4>
                                            <div className="flex items-center gap-1 mt-1">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded-full border border-gray-100 shadow-sm">
                                            {new Date(review.createdAt).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>

                                    {review.comment && (
                                        <p className="text-gray-600 text-sm mt-3 leading-relaxed break-words whitespace-pre-wrap">
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
