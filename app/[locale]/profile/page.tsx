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

    // 2. Get User's Novels
    const userNovels = await getNovelsByUserId(db, user.id);

    // Date Formatting Helper
    const joinedDate = new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });

    return (
        <ProfileClient
            user={user}
            userNovels={userNovels}
            joinedDate={joinedDate}
        />
    );
}
