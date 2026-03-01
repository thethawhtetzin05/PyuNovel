import { getRequestContext } from '@cloudflare/next-on-pages';
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from '@/i18n/routing';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from "@/db/schema";
import { getNovelsByUserId } from '@/lib/resources/novels/queries';
import ProfileClient from './profile-client';

export const runtime = 'edge';

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
    const { env } = getRequestContext();
    const db = drizzle(env.DB, { schema });
    const auth = createAuth(env.DB);

    // 1. Get Session
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
        redirect({ href: '/sign-in', locale: (await params).locale });
        return null;
    }

    const userId = session.user.id;

    // Fetch fresh user data to ensure role is up to date
    const user = await db.query.user.findFirst({
        where: (user, { eq }) => eq(user.id, userId)
    });

    if (!user) {
        redirect({ href: '/sign-in', locale: (await params).locale });
        return null;
    }

    // 🔥 D1 DB ထဲကနေ ဆွဲထုတ်လာတဲ့ အချိန်မှာ telegramId က null မဟုတ်ဘဲ စာသား အဖြစ် ဝင်နေခဲ့ရင် သန့်ရှင်းပေးမယ်
    const safeTelegramId = user.telegramId && typeof user.telegramId === 'string' && user.telegramId.trim() !== "" && user.telegramId.trim() !== "null" && user.telegramId.trim() !== "undefined"
        ? user.telegramId
        : null;

    const safeUser = {
        ...user,
        telegramId: safeTelegramId
    };

    // 2. Get User's Novels
    const userNovels = await getNovelsByUserId(db, user.id);

    // Date Formatting Helper
    const joinedDate = new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });

    return (
        <ProfileClient
            user={safeUser}
            userNovels={userNovels}
            joinedDate={joinedDate}
        />
    );
}
