import { getRequestContext } from '@cloudflare/next-on-pages';
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from '@/i18n/routing';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from "@/db/schema";
import TelegramConnectForm from "@/components/telegram/TelegramConnectForm";
import { getTranslations } from "next-intl/server";

export const runtime = 'edge';

export default async function IntegrationPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Integration' });
    const { env } = getRequestContext();
    const db = drizzle(env.DB, { schema });
    const auth = createAuth(env.DB);

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
        redirect({ href: '/sign-in', locale });
        return null; // Return null so the component stops rendering
    }

    const userId = session.user.id;

    // Fetch fresh user data to see if telegram is linked
    const user = await db.query.user.findFirst({
        where: (u, { eq }) => eq(u.id, userId)
    });

    if (!user) {
        redirect({ href: '/sign-in', locale });
        return null;
    }

    // 🔥 Sanitize telegramId
    const safeTelegramId = user.telegramId && typeof user.telegramId === 'string' && user.telegramId.trim() !== "" && user.telegramId.trim() !== "null" && user.telegramId.trim() !== "undefined" && user.telegramId.trim() !== "telegram_id"
        ? user.telegramId
        : null;

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 min-h-screen">
            <h1 className="text-3xl font-black text-[var(--foreground)] mb-2 mt-4">{t('title')}</h1>
            <p className="text-[var(--text-muted)] mb-8">
                {t('desc')}
            </p>

            <div className="bg-[var(--surface)] p-6 sm:p-8 rounded-3xl border border-[var(--border)] shadow-xl">
                <TelegramConnectForm
                    isLinked={Boolean(safeTelegramId)}
                    tgName={user.telegramName}
                    tgUsername={user.telegramUsername}
                />
            </div>
        </div>
    );
}
