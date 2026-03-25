import { getRequestContext } from '@cloudflare/next-on-pages';
import { getNovelBySlug } from '@/lib/resources/novels/queries';
import { getChaptersByNovelId } from '@/lib/resources/chapters/queries';
import { getVolumesByNovelId } from '@/lib/resources/volumes/queries';
import { getCollectionCountByNovelId } from '@/lib/resources/collections/queries';
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound } from 'next/navigation';
import { redirect } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from "@/db/schema";
import NovelManagementClient from './novel-management-client';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function NovelManagementPage({
    params
}: {
    params: Promise<{ locale: string, slug: string }>
}) {
    const { locale, slug } = await params;
    const { env } = getRequestContext();
    const db = drizzle(env.DB, { schema });
    const auth = createAuth(env.DB);

    const [novelData, session] = await Promise.all([
        getNovelBySlug(db, slug),
        auth.api.getSession({ headers: await headers() })
    ]);

    if (!session) {
        return redirect({ href: '/sign-in', locale });
    }

    if (!novelData) {
        return notFound();
    }

    const novel = novelData; // Type is narrowed now

    // Check ownership
    if (novel.ownerId !== session.user.id) {
        return redirect({ href: '/writer', locale });
    }

    const [chapters, volumes, collectorCount] = await Promise.all([
        getChaptersByNovelId(db, novel.id),
        getVolumesByNovelId(db, novel.id),
        getCollectionCountByNovelId(db, novel.id)
    ]);

    const t = await getTranslations('Writer');
    const tManagement = await getTranslations('NovelManagement');

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <NovelManagementClient
                novel={novel}
                chapters={chapters}
                volumes={volumes}
                collectorCount={collectorCount}
                locale={locale}
                translations={{
                    title: t('title'),
                    overview: tManagement('overview'),
                    chapters: tManagement('chapters'),
                    settings: tManagement('settings'),
                    totalViews: tManagement('totalViews'),
                    collectors: tManagement('collectors'),
                    publishedChapters: tManagement('publishedChapters'),
                    novelStatus: tManagement('novelStatus'),
                    recentPerformance: tManagement('recentPerformance'),
                    viewPublic: tManagement('viewPublic'),
                    addChapter: tManagement('addChapter'),
                    editChapter: tManagement('editChapter'),
                    deleteChapter: tManagement('deleteChapter'),
                    saveChanges: tManagement('saveChanges'),
                    discardChanges: tManagement('discardChanges'),
                    novelTitle: tManagement('novelTitle'),
                    authorName: tManagement('authorName'),
                    synopsis: tManagement('synopsis'),
                    tags: tManagement('tags'),
                    dangerZone: tManagement('dangerZone'),
                    deleteNovel: tManagement('deleteNovel'),
                    successTitle: tManagement('successTitle'),
                    successUpdate: tManagement('successUpdate'),
                    statusOngoing: tManagement('statuses.ongoing'),
                    statusCompleted: tManagement('statuses.completed'),
                    statusHiatus: tManagement('statuses.hiatus'),
                    statusDropped: tManagement('statuses.dropped'),
                    deletePermanently: tManagement('deletePermanently'),
                    deleteConfirmTitle: tManagement('deleteConfirmTitle'),
                    deleteConfirmDesc: tManagement('deleteConfirmDesc'),
                    deleteConfirmPlaceholder: tManagement('deleteConfirmPlaceholder'),
                    invalidPassword: tManagement('invalidPassword'),
                    deletingSubmitting: tManagement('deletingSubmitting'),
                }}
            />
        </div>
    );
}
