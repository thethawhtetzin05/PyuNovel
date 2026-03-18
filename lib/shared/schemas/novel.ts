import { z } from "zod";

export const CreateNovelSchema = z.object({
    title: z.string().min(1, "ဝတ္ထုခေါင်းစဉ် ရေးရန် လိုအပ်ပါသည်"),
    englishTitle: z.string().min(1, "English Title (URL အတွက်) လိုအပ်ပါသည်"),
    author: z.string().min(1, "စာရေးသူအမည် ရေးရန် လိုအပ်ပါသည်"),
    description: z.string().optional(),
    tags: z.string().optional(),
    coverUrl: z.string().optional(),
});

export const UpdateNovelSchema = z.object({
    novelId: z.coerce.number(),
    title: z.string().min(1, "ဝတ္ထုခေါင်းစဉ် ရေးရန် လိုအပ်ပါသည်"),
    englishTitle: z.string().min(1, "English Title (URL အတွက်) လိုအပ်ပါသည်"),
    description: z.string().optional(),
    tags: z.string().optional(),
    coverUrl: z.string().optional(),
    oldImageUrl: z.string().optional(), // For cleanup
});

export type CreateNovelInput = z.infer<typeof CreateNovelSchema>;
export type UpdateNovelInput = z.infer<typeof UpdateNovelSchema>;
