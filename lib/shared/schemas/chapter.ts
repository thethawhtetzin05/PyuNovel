import { z } from "zod";

export const ChapterSchema = z.object({
    chapterId: z.string().optional(), // Used for edits
    title: z.string().min(1, "ခေါင်းစဉ် မပါမဖြစ် ပါရပါမယ်"),
    content: z.string().min(1, "စာသား တိုလွန်းပါတယ်"),
    sortIndex: z.coerce.number(),
    isPaid: z.boolean().default(false),
    novelSlug: z.string().optional(),
    novelId: z.coerce.number(),
    volumeId: z.coerce.number().nullable().optional(),
    status: z.enum(['draft', 'scheduled', 'published']).default('published'),
    publishedAt: z.coerce.date().nullable().optional(),
    updatedAt: z.coerce.date().optional(), // Added for LWW conflict resolution
});

export type ChapterInput = z.infer<typeof ChapterSchema>;
