'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, X, ThumbsUp, ThumbsDown, CornerDownRight, BookOpen, List as ListIcon } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { Link } from '@/i18n/routing';

interface ParagraphReaderProps {
    content: string;
    chapterId: string;
    allChapters: any[];
    novelSlug: string;
    novelTitle: string;
}

interface Vote {
    userId: string;
    vote: number;
}

interface Comment {
    id: number;
    content: string;
    userId: string;
    paragraphIndex: number | null;
    parentCommentId?: number | null;
    createdAt: string;
    user: {
        id: string;
        name: string;
        image: string | null;
    };
    votes: Vote[];
    replies?: Comment[];
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// The bubble HTML injected at the end of each paragraph's innerHTML
function getBubbleHtml(count: number, index: number): string {
    const id = `para-bubble-${index}`;
    if (count > 0) {
        return `<span id="${id}" data-bubble="${index}" style="display:inline-flex;align-items:center;justify-content:center;margin-left:4px;padding:0 5px;height:16px;min-width:20px;border-radius:9999px;font-size:10px;font-family:sans-serif;font-weight:500;background:#E5E5E5;color:#909090;cursor:pointer;vertical-align:baseline;position:relative;top:-1px;white-space:nowrap;">${count > 99 ? '99+' : count}</span>`;
    }
    // Empty bubble shown on hover via CSS class
    return `<span id="${id}" data-bubble="${index}" class="para-bubble-empty" style="display:inline-flex;align-items:center;justify-content:center;margin-left:4px;padding:0 5px;height:16px;min-width:20px;border-radius:9999px;font-size:10px;font-family:sans-serif;font-weight:500;background:transparent;color:transparent;cursor:pointer;vertical-align:baseline;position:relative;top:-1px;white-space:nowrap;transition:all 0.15s;">💬</span>`;
}

export default function ParagraphReader({ content, chapterId, allChapters, novelSlug, novelTitle }: ParagraphReaderProps) {
    const [paragraphTexts, setParagraphTexts] = useState<string[]>([]);
    const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});
    const [selectedParagraph, setSelectedParagraph] = useState<number | null>(null);
    const [showSidebar, setShowSidebar] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState<Comment | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showTOCSidebar, setShowTOCSidebar] = useState(false);
    const { data: session } = useSession();

    // Parse paragraphs from HTML content, client-side only
    useEffect(() => {
        const parse = async () => {
            // Dynamic DOMPurify import - avoids SSR/Edge runtime error
            const DOMPurify = (await import('isomorphic-dompurify')).default;
            const clean = DOMPurify.sanitize(content);

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = clean;
            const pEls = Array.from(tempDiv.querySelectorAll('p'));

            if (pEls.length > 0) {
                // Extract innerHTML (without the outer <p> tags) and trim
                setParagraphTexts(pEls.map(p => p.innerHTML.trim()).filter(Boolean));
            } else {
                setParagraphTexts([clean.trim()]);
            }
        };
        parse();
    }, [content]);

    // Fetch comment counts
    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const res = await fetch(`/api/novel/chapter-comment?chapterId=${chapterId}&mode=counts`);
                const json = await res.json() as ApiResponse<{ paragraphIndex: number; count: number }[]>;
                if (json.success && json.data) {
                    const counts: Record<number, number> = {};
                    json.data.forEach(item => {
                        if (item.paragraphIndex !== null) counts[item.paragraphIndex] = item.count;
                    });
                    setCommentCounts(counts);
                }
            } catch (e) {
                console.error('Failed to fetch counts', e);
            }
        };
        fetchCounts();

        // Listen for "Open All Comments" trigger from page navigation
        const handleOpenAll = () => {
            setSelectedParagraph(-1); // Use -1 to represent 'All/Chapter level'
            setShowSidebar(true);
        };
        const handleOpenTOC = () => {
            setShowTOCSidebar(true);
            setShowSidebar(false); // Close comments if open
        };
        window.addEventListener('open-chapter-comments', handleOpenAll);
        window.addEventListener('open-toc-sidebar', handleOpenTOC);
        return () => {
            window.removeEventListener('open-chapter-comments', handleOpenAll);
            window.removeEventListener('open-toc-sidebar', handleOpenTOC);
        };
    }, [chapterId]);

    // Fetch comments for selected paragraph (or all if index is -1)
    const fetchComments = useCallback(async (paraIndex: number) => {
        try {
            const res = await fetch(`/api/novel/chapter-comment?chapterId=${chapterId}`);
            const json = await res.json() as ApiResponse<Comment[]>;
            if (json.success && json.data) {
                if (paraIndex === -1) {
                    setComments(json.data); // Show all
                } else {
                    setComments(json.data.filter(c => c.paragraphIndex === paraIndex));
                }
            }
        } catch (e) {
            console.error('Failed to fetch comments', e);
        }
    }, [chapterId]);

    useEffect(() => {
        if (selectedParagraph !== null && showSidebar) {
            fetchComments(selectedParagraph);
        }
    }, [selectedParagraph, showSidebar, fetchComments]);

    const openSidebar = useCallback((index: number) => {
        setSelectedParagraph(index);
        setShowSidebar(true);
    }, []);

    // Click handler: listen for clicks on the whole container and detect bubble clicks
    const handleContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        // Find closest element with data-bubble
        const bubble = target.closest('[data-bubble]') as HTMLElement | null;
        if (bubble) {
            const idx = parseInt(bubble.dataset.bubble ?? '-1', 10);
            if (idx >= 0) openSidebar(idx);
            return;
        }
        // Otherwise, check if click was inside a paragraph container
        const paraDiv = target.closest('[data-para]') as HTMLElement | null;
        if (paraDiv) {
            const idx = parseInt(paraDiv.dataset.para ?? '-1', 10);
            if (idx >= 0) openSidebar(idx);
        }
    }, [openSidebar]);

    const handlePostComment = async () => {
        await submitCommentLogic(
            newComment,
            selectedParagraph,
            chapterId,
            replyTo?.id || null,
            session,
            setIsSubmitting,
            setNewComment,
            setReplyTo,
            setComments,
            setCommentCounts,
            fetchComments
        );
    };

    const handleVote = async (commentId: number, vote: number) => {
        if (!session) { alert('Please login to vote'); return; }
        try {
            const res = await fetch('/api/novel/chapter-comment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commentId, vote }),
            });
            const json = await res.json() as ApiResponse<any>;
            if (json.success) {
                setComments(prev => {
                    const update = (list: Comment[]): Comment[] => list.map(c => {
                        if (c.id === commentId) {
                            return { ...c, votes: [...c.votes.filter(v => v.userId !== session.user.id), { userId: session.user.id, vote }] };
                        }
                        return c.replies ? { ...c, replies: update(c.replies) } : c;
                    });
                    return update(prev);
                });
            }
        } catch (e) {
            console.error('Vote failed', e);
        }
    };

    const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
        const upvotes = comment.votes.filter(v => v.vote === 1).length;
        const downvotes = comment.votes.filter(v => v.vote === -1).length;
        const userVote = comment.votes.find(v => v.userId === session?.user?.id)?.vote;

        return (
            <div className={isReply ? 'ml-6 border-l-2 border-gray-100 dark:border-gray-800 pl-4 mt-3' : 'bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800'}>
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {comment.user.image
                            ? <img src={comment.user.image} alt={comment.user.name} className="w-full h-full object-cover" />
                            : <span className="text-xs font-bold text-indigo-600 uppercase">{comment.user.name.charAt(0)}</span>
                        }
                    </div>
                    <div className="flex-grow min-w-0 flex items-center justify-between gap-2">
                        <span className="text-sm font-bold truncate">{comment.user.name}</span>
                        <span className="text-[10px] opacity-40">{new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>

                <p className="text-sm leading-relaxed mb-3 text-gray-700 dark:text-gray-300">{comment.content}</p>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                        <button onClick={() => handleVote(comment.id, 1)} className={`p-1.5 rounded-lg transition-colors ${userVote === 1 ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40' : 'hover:bg-gray-200 dark:hover:bg-gray-700 opacity-60'}`}>
                            <ThumbsUp size={14} />
                        </button>
                        <span className="text-xs font-medium">{upvotes - downvotes}</span>
                        <button onClick={() => handleVote(comment.id, -1)} className={`p-1.5 rounded-lg transition-colors ${userVote === -1 ? 'text-red-600 bg-red-50 dark:bg-red-900/40' : 'hover:bg-gray-200 dark:hover:bg-gray-700 opacity-60'}`}>
                            <ThumbsDown size={14} />
                        </button>
                    </div>
                    {!isReply && (
                        <button onClick={() => { setReplyTo(comment); document.querySelector('textarea')?.focus(); }} className="flex items-center gap-1 text-xs font-medium opacity-60 hover:opacity-100 transition-opacity">
                            <CornerDownRight size={14} />
                            Reply{comment.replies && comment.replies.length > 0 ? ` (${comment.replies.length})` : ''}
                        </button>
                    )}
                </div>

                {comment.replies?.map(reply => <CommentItem key={reply.id} comment={reply} isReply />)}
            </div>
        );
    };

    return (
        <div className="relative">
            {/* ===== MAIN READER ===== */}
            {/* Event delegation: one click handler on the whole reader area */}
            <div onClick={handleContainerClick} className="chapter-content">
                {paragraphTexts.map((text, index) => {
                    // Inject bubble HTML directly at the end of text — guaranteed inline
                    const count = commentCounts[index] ?? 0;
                    const htmlWithBubble = text + getBubbleHtml(count, index);

                    return (
                        <div
                            key={index}
                            data-para={index}
                            className="mb-4 cursor-pointer group"
                            dangerouslySetInnerHTML={{ __html: htmlWithBubble }}
                        />
                    );
                })}
            </div>

            {/* ===== OVERLAYS ===== */}
            {(showSidebar || showTOCSidebar) && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100]"
                    onClick={() => {
                        setShowSidebar(false);
                        setShowTOCSidebar(false);
                        setReplyTo(null);
                    }}
                />
            )}

            {/* ===== TOC SIDEBAR ===== */}
            <div className={`
                fixed top-0 left-0 h-full w-full max-w-xs md:max-w-md bg-white dark:bg-gray-900 shadow-2xl z-[110] transform transition-transform duration-300 ease-in-out font-sans
                ${showTOCSidebar ? 'translate-x-0' : '-translate-x-full'}
                flex flex-col
            `}>
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <BookOpen size={20} className="text-indigo-600 flex-shrink-0" />
                        <Link
                            href={`/novel/${novelSlug}`}
                            className="text-base font-bold text-gray-900 dark:text-gray-100 truncate hover:text-indigo-600 transition-colors"
                        >
                            {novelTitle}
                        </Link>
                    </div>
                    <button onClick={() => setShowTOCSidebar(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex-shrink-0">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto">
                    <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                        {allChapters.map((ch) => {
                            const isCurrent = ch.id.toString() === chapterId;
                            return (
                                <Link
                                    key={ch.id}
                                    href={`/novel/${novelSlug}/${ch.sortIndex}`}
                                    className={`
                                        flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors
                                        ${isCurrent ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-l-4 border-indigo-600' : 'border-l-4 border-transparent'}
                                    `}
                                    onClick={() => setShowTOCSidebar(false)}
                                >
                                    <span className={`text-lg font-medium truncate ${isCurrent ? 'text-indigo-700 dark:text-indigo-400 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {ch.title}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ===== COMMENT SIDEBAR ===== */}
            <div className={`
                fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-[110] transform transition-transform duration-300 ease-in-out font-sans
                ${showSidebar ? 'translate-x-0' : 'translate-x-full'}
                flex flex-col
            `}>
                {/* Header */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900">
                    <div>
                        <h3 className="text-base font-bold">Comments</h3>
                        <p className="text-xs opacity-40">
                            {selectedParagraph === -1 ? 'Chapter Discussion' : `Paragraph ${selectedParagraph !== null ? selectedParagraph + 1 : ''}`}
                        </p>
                    </div>
                    <button onClick={() => { setShowSidebar(false); setReplyTo(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Comment List */}
                <div className="flex-grow overflow-y-auto p-5 space-y-4">
                    {comments.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                            <MessageSquare size={56} strokeWidth={1.5} className="mb-3" />
                            <p className="font-medium">No comments yet</p>
                            <p className="text-sm mt-1">Be the first to comment!</p>
                        </div>
                    ) : (
                        comments.map(c => <CommentItem key={c.id} comment={c} />)
                    )}
                </div>

                {/* Input Area */}
                <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                    {replyTo && (
                        <div className="mb-3 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-between">
                            <div className="text-xs">
                                <span className="opacity-50 block text-[10px] mb-0.5">Replying to</span>
                                <span className="font-bold text-indigo-600">{replyTo.user.name}</span>
                            </div>
                            <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-full">
                                <X size={13} />
                            </button>
                        </div>
                    )}
                    <div className="relative">
                        <textarea
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            placeholder={session ? 'Write a comment...' : 'Login to comment'}
                            disabled={!session || isSubmitting}
                            className="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none min-h-[90px] border-0"
                            rows={3}
                        />
                        <button
                            onClick={handlePostComment}
                            disabled={!session || isSubmitting || !newComment.trim()}
                            className="absolute bottom-3 right-3 bg-indigo-600 text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/20 hover:-translate-y-0.5 hover:shadow-indigo-600/40 active:translate-y-0 active:scale-95 transition-all disabled:opacity-40 disabled:translate-y-0 disabled:shadow-none"
                        >
                            {isSubmitting ? '...' : 'Post'}
                            <Send size={12} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Fixed handlePostComment to allow general comments (paragraphIndex: null)
async function submitCommentLogic(
    newComment: string,
    selectedParagraph: number | null,
    chapterId: string,
    replyToId: number | null,
    session: any,
    setIsSubmitting: (b: boolean) => void,
    setNewComment: (s: string) => void,
    setReplyTo: (c: any) => void,
    setComments: any,
    setCommentCounts: any,
    fetchComments: any
) {
    if (!newComment.trim() || selectedParagraph === null) return;
    if (!session) { alert('Please login to comment'); return; }

    setIsSubmitting(true);
    try {
        const res = await fetch('/api/novel/chapter-comment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chapterId: parseInt(chapterId),
                paragraphIndex: selectedParagraph === -1 ? null : selectedParagraph,
                content: newComment,
                parentCommentId: replyToId,
            }),
        });
        const json = await res.json() as ApiResponse<Comment>;
        if (json.success && json.data) {
            setNewComment('');
            setReplyTo(null);

            // Re-fetch to see the latest list
            await fetchComments(selectedParagraph);

            // Only update counts if it's a paragraph-level comment
            if (selectedParagraph !== -1 && !json.data.parentCommentId) {
                setCommentCounts((prev: any) => ({ ...prev, [selectedParagraph]: (prev[selectedParagraph] || 0) + 1 }));
            }
        } else {
            alert(json.error || 'Failed to post comment');
        }
    } catch {
        alert('An error occurred');
    } finally {
        setIsSubmitting(false);
    }
}
