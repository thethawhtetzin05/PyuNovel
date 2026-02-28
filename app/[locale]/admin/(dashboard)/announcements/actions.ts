import { getRequestContext } from '@cloudflare/next-on-pages';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { announcements } from '@/db/schema';
import { revalidatePath } from 'next/cache';

export async function createAnnouncement(formData: FormData) {
    'use server';

    const title = formData.get('title')?.toString();
    const content = formData.get('content')?.toString() || null;
    const icon = formData.get('icon')?.toString() || null;
    const isActive = formData.get('isActive') === 'on';

    if (!title) {
        return { error: 'Title is required' };
    }

    const { env } = getRequestContext();
    const db = drizzle(env.DB);

    try {
        await db.insert(announcements).values({
            title,
            content,
            icon,
            isActive,
        });

        revalidatePath('/');
        revalidatePath('/admin/announcements');
        return { success: true };
    } catch (error) {
        console.error('Error creating announcement:', error);
        return { error: 'Failed to create announcement' };
    }
}

export async function deleteAnnouncement(id: number) {
    'use server';

    const { env } = getRequestContext();
    const db = drizzle(env.DB);

    try {
        // Soft delete to keep history
        await db.update(announcements)
            .set({ deletedAt: new Date() })
            .where(eq(announcements.id, id));

        revalidatePath('/');
        revalidatePath('/admin/announcements');
        return { success: true };
    } catch (error) {
        console.error('Error deleting announcement:', error);
        return { error: 'Failed to delete announcement' };
    }
}
