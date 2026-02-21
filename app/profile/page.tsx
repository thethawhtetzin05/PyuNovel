import { getRequestContext } from '@cloudflare/next-on-pages';
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from 'next/navigation';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from "@/db/schema";
import { getNovelsByUserId } from '@/lib/resources/novels/queries';
import Link from 'next/link';

export const runtime = 'edge';

export default async function ProfilePage() {
    const { env } = getRequestContext();
    const db = drizzle(env.DB, { schema });
    const auth = createAuth(env.DB);

    // 1. Get Session
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session || !session.user) {
        redirect('/sign-in'); // ❗ လော့အင်မဝင်ထားရင် ပြန်ပို့မယ်
    }

    const user = session.user;

    // 2. Get User's Novels
    const userNovels = await getNovelsByUserId(db, user.id);

    // Date Formatting Helper
    const joinedDate = new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 min-h-screen">

            {/* 1. Header & Profile Card */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-100 mb-12 flex flex-col sm:flex-row items-center sm:items-start gap-8 relative overflow-hidden">
                {/* Background decorative blob */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-50 blur-3xl opacity-60 pointer-events-none"></div>

                {/* Avatar */}
                <div className="shrink-0 relative z-10">
                    {user.image ? (
                        <img
                            src={user.image}
                            alt={user.name}
                            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                    ) : (
                        <div className="w-32 h-32 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-4xl font-bold border-4 border-white shadow-lg">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* User Info */}
                <div className="flex-1 text-center sm:text-left z-10">
                    <h1 className="text-3xl font-black text-gray-900 mb-2 truncate">{user.name}</h1>
                    <p className="text-gray-500 font-medium mb-4">{user.email}</p>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                        <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-bold uppercase tracking-wider border border-indigo-100 shadow-sm">
                            Role: {user.role || 'Reader'}
                        </span>
                        <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-bold tracking-wider border border-emerald-100 shadow-sm">
                            🪙 {user.coins || 0} Coins
                        </span>
                        <span className="px-4 py-1.5 bg-gray-50 text-gray-600 rounded-full text-sm font-bold border border-gray-200 shadow-sm">
                            Joined {joinedDate}
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. My Novels Section (Only if Writer or Admin, or if they have novels) */}
            <div className="mb-12">
                <div className="flex justify-between items-end mb-8 border-b border-gray-100 pb-4">
                    <h2 className="text-2xl font-black text-gray-900">
                        My Novels <span className="text-gray-400 font-medium text-lg ml-2">({userNovels.length})</span>
                    </h2>
                    <Link
                        href="/novel/create"
                        className="hidden sm:flex items-center gap-2 text-sm font-bold bg-black text-white px-5 py-2.5 rounded-full hover:bg-gray-800 transition shadow active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Write Novel
                    </Link>
                </div>

                {userNovels.length === 0 ? (
                    <div className="bg-gray-50 rounded-2xl p-12 text-center border border-dashed border-gray-300">
                        <div className="text-5xl mb-4">✍️</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No novels yet</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">You haven't published any novels yet. Start your writing journey today!</p>
                        <Link
                            href="/novel/create"
                            className="inline-flex items-center gap-2 font-bold bg-indigo-600 text-white px-8 py-3 rounded-full hover:bg-indigo-700 transition shadow-lg active:scale-95"
                        >
                            Start Writing
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 gap-y-10">
                        {userNovels.map((novel) => (
                            <div key={novel.id} className="group flex flex-col">
                                <Link href={`/novel/${novel.slug}`} className="block relative aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-md mb-3 bg-gray-100 border border-gray-200">
                                    {novel.coverUrl ? (
                                        <img
                                            src={novel.coverUrl}
                                            alt={novel.title}
                                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-out"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center w-full h-full text-gray-400 bg-gray-50">
                                            <span className="text-3xl mb-1">📚</span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest">No Cover</span>
                                        </div>
                                    )}
                                    {/* Status Overlay */}
                                    <div className="absolute top-2 left-2 flex gap-1">
                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md ${novel.status === 'ongoing' ? 'bg-emerald-500/90' : 'bg-blue-600/90'}`}>
                                            {novel.status || 'Ongoing'}
                                        </span>
                                    </div>
                                </Link>

                                <h3 className="font-bold text-gray-900 leading-tight mb-1 line-clamp-2 min-h-[2.5rem] group-hover:text-indigo-600 transition-colors">
                                    <Link href={`/novel/${novel.slug}`}>
                                        {novel.title}
                                    </Link>
                                </h3>

                                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                                    <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {(novel.views || 0).toLocaleString()}
                                    </span>

                                    <Link
                                        href={`/novel/${novel.slug}/edit`}
                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-full transition-colors"
                                    >
                                        Edit
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}
