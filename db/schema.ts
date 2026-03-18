import { sqliteTable, text, integer, real, index, uniqueIndex, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { sql, relations } from "drizzle-orm";

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
  telegramId: text('telegram_id'),
  telegramUsername: text('telegram_username'),
  telegramName: text('telegram_name'),

  // EXP & Leveling System
  exp: integer('exp').default(0).notNull(),
  level: integer('level').default(0).notNull(),
  lastCheckIn: integer('last_check_in', { mode: 'timestamp' }), // nullable — no default
  checkInStreak: integer('check_in_streak').default(0).notNull(),
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
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),

}, (table) => ({
  novelSortIdx: uniqueIndex('novel_sort_idx').on(table.novelId, table.sortIndex),
  volumeIdx: index('chapter_volume_idx').on(table.volumeId),
  updatedAtIdx: index('chapter_updated_at_idx').on(table.updatedAt),
}));

// ==========================================
// 9. System / Internal Tables
// ==========================================

export const rateLimits = sqliteTable('rate_limits', {
  id: text('id').primaryKey(), // Combination of endpoint and identifier (IP/UserID)
  hits: integer('hits').default(0).notNull(),
  resetAt: integer('reset_at', { mode: 'timestamp' }).notNull(),
});

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

// ==========================================
// 7. Coin Economy & Monetization
// ==========================================

export const coinTransactions = sqliteTable('coin_transactions', {
  id: text('id').primaryKey(), // using uuid or similar
  userId: text('user_id').references(() => user.id).notNull(),
  amount: integer('amount').notNull(),
  type: text('type', { enum: ['earn', 'spend', 'topup', 'refund'] }).notNull(),
  status: text('status', { enum: ['pending', 'success', 'failed'] }).default('success').notNull(),
  reference: text('reference'), // e.g. chapter_id, gift_id, or gateway_txn_id
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  userIdx: index('coin_transaction_user_idx').on(table.userId),
}));

export const chapterUnlocks = sqliteTable('chapter_unlocks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').references(() => user.id).notNull(),
  chapterId: integer('chapter_id').references(() => chapters.id).notNull(),
  coinsSpent: integer('coins_spent').notNull(),
  giftedByUserId: text('gifted_by_user_id'), // if gifted by someone else
  unlockedAt: integer('unlocked_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  userChapterUnique: uniqueIndex('unlock_user_chapter_unique_idx').on(table.userId, table.chapterId),
  userIdx: index('unlock_user_idx').on(table.userId),
  chapterIdx: index('unlock_chapter_idx').on(table.chapterId),
}));

export const gifts = sqliteTable('gifts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  senderId: text('sender_id').references(() => user.id).notNull(),
  writerId: text('writer_id').references(() => user.id).notNull(),
  novelId: integer('novel_id').references(() => novels.id).notNull(),
  giftType: text('gift_type').notNull(), // 'rose', 'chocolate', 'diamond', 'crown'
  coinsSpent: integer('coins_spent').notNull(),
  message: text('message'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  writerIdx: index('gift_writer_idx').on(table.writerId),
  novelIdx: index('gift_novel_idx').on(table.novelId),
}));

export const novelPasses = sqliteTable('novel_passes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').references(() => user.id).notNull(),
  novelId: integer('novel_id').references(() => novels.id).notNull(),
  coinsSpent: integer('coins_spent').notNull(),
  purchasedAt: integer('purchased_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  userNovelPassUnique: uniqueIndex('pass_user_novel_unique_idx').on(table.userId, table.novelId),
}));

// ==========================================
// 8. Chapter Comments (Paragraph-level)
// ==========================================

export const chapterComments = sqliteTable('chapter_comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').references(() => user.id).notNull(),
  chapterId: integer('chapter_id').references(() => chapters.id).notNull(),

  // paragraphIndex is null for chapter-wide comments, or 0+ for specific paragraphs
  paragraphIndex: integer('paragraph_index'),

  parentCommentId: integer('parent_comment_id').references((): AnySQLiteColumn => chapterComments.id), // For replies

  content: text('content').notNull(),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  chapterIdx: index('chapter_comment_chapter_idx').on(table.chapterId),
  paragraphIdx: index('chapter_comment_paragraph_idx').on(table.chapterId, table.paragraphIndex),
  userIdx: index('chapter_comment_user_idx').on(table.userId),
  parentIdx: index('chapter_comment_parent_idx').on(table.parentCommentId),
}));

export const chapterCommentVotes = sqliteTable('chapter_comment_votes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  commentId: integer('comment_id').references(() => chapterComments.id).notNull(),
  userId: text('user_id').references(() => user.id).notNull(),
  vote: integer('vote').notNull(), // 1 for upvote, -1 for downvote
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  uniqueVote: uniqueIndex('unique_comment_vote_idx').on(table.commentId, table.userId),
}));

export const userRelations = relations(user, ({ many }) => ({
  chapterComments: many(chapterComments),
  commentVotes: many(chapterCommentVotes),
}));

export const chapterCommentsRelations = relations(chapterComments, ({ one, many }) => ({
  user: one(user, {
    fields: [chapterComments.userId],
    references: [user.id],
  }),
  chapter: one(chapters, {
    fields: [chapterComments.chapterId],
    references: [chapters.id],
  }),
  parent: one(chapterComments, {
    fields: [chapterComments.parentCommentId],
    references: [chapterComments.id],
    relationName: 'replies',
  }),
  replies: many(chapterComments, {
    relationName: 'replies',
  }),
  votes: many(chapterCommentVotes),
}));

export const chapterCommentVotesRelations = relations(chapterCommentVotes, ({ one }) => ({
  comment: one(chapterComments, {
    fields: [chapterCommentVotes.commentId],
    references: [chapterComments.id],
  }),
  user: one(user, {
    fields: [chapterCommentVotes.userId],
    references: [user.id],
  }),
}));


