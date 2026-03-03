// ⚠️ boolean ကို import list ကနေ ဖြုတ်လိုက်ပါပြီ
import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from "drizzle-orm";

// ==========================================
// 1. Authentication Tables (Better-Auth)
// ==========================================

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),

  // Custom Fields
  role: text('role', { enum: ['admin', 'writer', 'reader'] }).default('reader').notNull(),
  coins: integer('coins').default(0),
  telegramId: text('telegram_id'), // To store connected Telegram Chat ID
  telegramUsername: text('telegram_username'), // e.g. @username
  telegramName: text('telegram_name'), // e.g. John Doe
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

// ==========================================
// 2. Content Tables (Novels & Chapters)
// ==========================================

export const novels = sqliteTable('novels', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  // ✅ Correct: User ID matches perfectly now (text to text)
  ownerId: text('owner_id').references(() => user.id).notNull(),

  slug: text('slug').unique().notNull(),
  englishTitle: text('english_title').notNull(),
  title: text('title').notNull(),

  author: text('author').notNull(),
  description: text('description'),
  coverUrl: text('cover_url'),
  tags: text('tags').notNull(), // Note: You might need to JSON.stringify arrays before storing here

  status: text('status', { enum: ['ongoing', 'completed', 'hiatus'] }).default('ongoing'),

  views: integer('views').default(0).notNull(),
  chapterPrice: integer('price').default(0),

  // ✅ Fix: $defaultFn ensures current time on insert
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
}, (table) => ({
  ownerIdx: index('owner_idx').on(table.ownerId),
  slugIdx: index('slug_idx').on(table.slug),
  createdAtIdx: index('novels_created_at_idx').on(table.createdAt),
  updatedAtIdx: index('novels_updated_at_idx').on(table.updatedAt),
  viewsIdx: index('novels_views_idx').on(table.views),
}));

export const volumes = sqliteTable('volumes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  novelId: integer('novel_id').references(() => novels.id).notNull(),
  name: text('name').notNull(),
  sortIndex: real('sort_index').notNull(),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
}, (table) => ({
  novelSortIdx: index('volume_novel_sort_idx').on(table.novelId, table.sortIndex),
}));

export const chapters = sqliteTable('chapters', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  novelId: integer('novel_id').references(() => novels.id).notNull(),
  volumeId: integer('volume_id').references(() => volumes.id), // Added volumeId

  title: text('title').notNull(),
  content: text('content').notNull(),

  isPaid: integer('is_paid', { mode: 'boolean' }).default(false),

  sortIndex: real('sort_index').notNull(),

  // ✅ Fix: $defaultFn ensures current time on insert
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),

}, (table) => ({
  novelSortIdx: uniqueIndex('novel_sort_idx').on(table.novelId, table.sortIndex),
  volumeIdx: index('chapter_volume_idx').on(table.volumeId),
}));

// ==========================================
// 3. User Interactions (Collections, Progress & Reviews)
// ==========================================

export const reviews = sqliteTable('reviews', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').references(() => user.id).notNull(),
  novelId: integer('novel_id').references(() => novels.id).notNull(),

  rating: integer('rating').notNull(), // 1 to 5
  comment: text('comment'),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  userNovelUnique: uniqueIndex('review_user_novel_unique_idx').on(table.userId, table.novelId),
  novelIdx: index('review_novel_idx').on(table.novelId),
}));

// ==========================================
// 4. User Interactions (Collections & Progress)
// ==========================================

export const collections = sqliteTable('collections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').references(() => user.id).notNull(),
  novelId: integer('novel_id').references(() => novels.id).notNull(),

  // Track last read chapter for this novel
  lastReadChapterId: integer('last_read_chapter_id').references(() => chapters.id),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  // Ensure a user can only collect a novel once
  userNovelUnique: uniqueIndex('user_novel_unique_idx').on(table.userId, table.novelId),
  // Performance optimizations for D1
  userIdx: index('collection_user_idx').on(table.userId),
  novelIdx: index('collection_novel_idx').on(table.novelId),
}));

// ==========================================
// 5. Global Content (Announcements)
// ==========================================

export const announcements = sqliteTable('announcements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content'),
  icon: text('icon'), // e.g. emojis "📢", "🏆"
  isActive: integer('is_active', { mode: 'boolean' }).default(true),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
}, (table) => ({
  activeIdx: index('announcement_active_idx').on(table.isActive),
  createdAtIdx: index('announcement_created_at_idx').on(table.createdAt),
}));

// ==========================================
// 6. Telegram Integration
// ==========================================

export const telegramDrafts = sqliteTable('telegram_drafts', {
  id: text('id').primaryKey(),
  authorId: text('author_id').references(() => user.id).notNull(),
  chaptersJson: text('chapters_json').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});