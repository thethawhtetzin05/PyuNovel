import { z } from 'zod';

// Novel ဖန်တီးမည့်အခါ စစ်ဆေးမည့် Schema
export const CreateNovelSchema = z.object({
    title: z.string().min(1, "ခေါင်းစဉ် ရေးရန် လိုအပ်ပါသည်"),
    englishTitle: z.string().min(1, "English Title (URL အတွက်) လိုအပ်ပါသည်"),
    author: z.string().min(1, "စာရေးသူအမည် ရေးရန် လိုအပ်ပါသည်"),
    description: z.string().optional(),
    tags: z.string().optional(),
});

export type CreateNovelInput = z.infer<typeof CreateNovelSchema>;
