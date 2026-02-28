'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { getServerContext } from '@/lib/server-context';
import { CreateNovelSchema } from '@/lib/schemas/novel';
import { createNovel } from '@/lib/resources/novels/mutations';
import { sql } from 'drizzle-orm';

// Manual Migration for Setup Page
export async function runMigration() {
  const { db } = getServerContext();
  
  try {
    // 0. Cleanup (Drop all known tables)
    // Using individual statements to avoid batching errors in setup
    await db.run(sql`DROP TABLE IF EXISTS reviews;`);
    await db.run(sql`DROP TABLE IF EXISTS collections;`);
    await db.run(sql`DROP TABLE IF EXISTS chapters;`);
    await db.run(sql`DROP TABLE IF EXISTS volumes;`);
    await db.run(sql`DROP TABLE IF EXISTS novels;`);
    await db.run(sql`DROP TABLE IF EXISTS session;`);
    await db.run(sql`DROP TABLE IF EXISTS account;`);
    await db.run(sql`DROP TABLE IF EXISTS verification;`);
    await db.run(sql`DROP TABLE IF EXISTS user;`);

    // 1. Create Tables
    // User
    await db.run(sql`CREATE TABLE IF NOT EXISTS user (
        id text PRIMARY KEY NOT NULL,
        name text NOT NULL,
        email text NOT NULL,
        email_verified integer NOT NULL,
        image text,
        created_at integer NOT NULL,
        updated_at integer NOT NULL,
        role text DEFAULT 'reader' NOT NULL,
        coins integer DEFAULT 0
    );`);
    await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS user_email_unique ON user (email);`);

    // Session
    await db.run(sql`CREATE TABLE IF NOT EXISTS session (
        id text PRIMARY KEY NOT NULL,
        expires_at integer NOT NULL,
        token text NOT NULL,
        created_at integer NOT NULL,
        updated_at integer NOT NULL,
        ip_address text,
        user_agent text,
        user_id text NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user(id)
    );`);
    await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS session_token_unique ON session (token);`);

    // Account
    await db.run(sql`CREATE TABLE IF NOT EXISTS account (
        id text PRIMARY KEY NOT NULL,
        account_id text NOT NULL,
        provider_id text NOT NULL,
        user_id text NOT NULL,
        access_token text,
        refresh_token text,
        id_token text,
        access_token_expires_at integer,
        refresh_token_expires_at integer,
        scope text,
        password text,
        created_at integer NOT NULL,
        updated_at integer NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user(id)
    );`);

    // Verification
    await db.run(sql`CREATE TABLE IF NOT EXISTS verification (
        id text PRIMARY KEY NOT NULL,
        identifier text NOT NULL,
        value text NOT NULL,
        expires_at integer NOT NULL,
        created_at integer,
        updated_at integer
    );`);

    // Novels
    await db.run(sql`CREATE TABLE IF NOT EXISTS novels (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        owner_id text NOT NULL,
        slug text NOT NULL,
        english_title text NOT NULL,
        title text NOT NULL,
        author text NOT NULL,
        description text,
        cover_url text,
        tags text NOT NULL,
        status text DEFAULT 'ongoing',
        views integer DEFAULT 0,
        price integer DEFAULT 0,
        created_at integer,
        updated_at integer,
        deleted_at integer,
        FOREIGN KEY (owner_id) REFERENCES user(id)
    );`);
    await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS novels_slug_unique ON novels (slug);`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS owner_idx ON novels (owner_id);`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS slug_idx ON novels (slug);`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS novels_created_at_idx ON novels (created_at);`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS novels_updated_at_idx ON novels (updated_at);`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS novels_views_idx ON novels (views);`);

    // Volumes
    await db.run(sql`CREATE TABLE IF NOT EXISTS volumes (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        novel_id integer NOT NULL,
        name text NOT NULL,
        sort_index real NOT NULL,
        created_at integer,
        updated_at integer,
        deleted_at integer,
        FOREIGN KEY (novel_id) REFERENCES novels(id)
    );`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS volume_novel_sort_idx ON volumes (novel_id, sort_index);`);

    // Chapters
    await db.run(sql`CREATE TABLE IF NOT EXISTS chapters (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        novel_id integer NOT NULL,
        volume_id integer,
        title text NOT NULL,
        content text NOT NULL,
        is_paid integer DEFAULT false,
        sort_index real NOT NULL,
        created_at integer,
        deleted_at integer,
        FOREIGN KEY (novel_id) REFERENCES novels(id),
        FOREIGN KEY (volume_id) REFERENCES volumes(id)
    );`);
    await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS novel_sort_idx ON chapters (novel_id, sort_index);`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS chapter_volume_idx ON chapters (volume_id);`);

    // Collections
    await db.run(sql`CREATE TABLE IF NOT EXISTS collections (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        user_id text NOT NULL,
        novel_id integer NOT NULL,
        last_read_chapter_id integer,
        created_at integer,
        updated_at integer,
        FOREIGN KEY (user_id) REFERENCES user(id),
        FOREIGN KEY (novel_id) REFERENCES novels(id),
        FOREIGN KEY (last_read_chapter_id) REFERENCES chapters(id)
    );`);
    await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS user_novel_unique_idx ON collections (user_id, novel_id);`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS collection_user_idx ON collections (user_id);`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS collection_novel_idx ON collections (novel_id);`);

    // Reviews
    await db.run(sql`CREATE TABLE IF NOT EXISTS reviews (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        user_id text NOT NULL,
        novel_id integer NOT NULL,
        rating integer NOT NULL,
        comment text,
        created_at integer,
        updated_at integer,
        FOREIGN KEY (user_id) REFERENCES user(id),
        FOREIGN KEY (novel_id) REFERENCES novels(id)
    );`);
    await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS review_user_novel_unique_idx ON reviews (user_id, novel_id);`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS review_novel_idx ON reviews (novel_id);`);

    return { success: true };
  } catch (error: any) {
    console.error("Setup Error:", error);
    return { success: false, error: error.message || String(error) };
  }
}

export async function addNovelAction(formData: FormData) {
  const { db, auth } = getServerContext();

  // ၁။ User Session စစ်ဆေးခြင်း
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    throw new Error("Unauthorized: Please login first");
  }

  // ၂။ Form Data များကို ဘေးကင်းလုံခြုံစွာ ရယူခြင်း
  const rawInput = {
    title: formData.get('title')?.toString() || '',
    englishTitle: formData.get('englishTitle')?.toString() || '',
    author: formData.get('author')?.toString() || '',
    description: formData.get('description')?.toString() || '',
    tags: formData.get('tags')?.toString() || '',
  };

  // ၃။ Zod Validation စစ်ဆေးခြင်း
  const validation = CreateNovelSchema.safeParse(rawInput);

  if (!validation.success) {
    console.error("Validation Error:", validation.error.flatten());
    throw new Error(
      "Invalid Input Data: " +
      Object.values(validation.error.flatten().fieldErrors).flat().join(", ")
    );
  }

  const data = validation.data;

  // ၄။ Tag များကို သန့်ရှင်းရေးလုပ်ခြင်း
  const processedTags = data.tags
    ? data.tags.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .map(tag => {
        const lower = tag.toLowerCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join(', ')
    : '';

  // ၅။ Database ထဲ ထည့်ခြင်း
  try {
    await createNovel(db, session.user.id, {
      title: data.title,
      author: data.author,
      description: data.description || '',
      tags: processedTags,
      englishTitle: data.englishTitle,
      imageUrl: null,
      status: "ongoing",
    });

    revalidatePath('/');

  } catch (error) {
    console.error("Database Error:", String(error));
    throw new Error("Failed to create novel. Please try again.", { cause: error });
  }

  // ၆။ အောင်မြင်ရင် Homepage သို့ ပြန်ပို့မည်
  redirect('/');
}