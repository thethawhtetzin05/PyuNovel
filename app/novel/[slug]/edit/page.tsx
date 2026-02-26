import { getRequestContext } from '@cloudflare/next-on-pages';
import { getNovelBySlug } from '@/lib/resources/novels/queries';
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from 'next/navigation';
import NovelForm from '../../create/novel-form'; // Reused Form
import { drizzle } from 'drizzle-orm/d1';
import * as schema from "@/db/schema";

export const runtime = 'edge';

export default async function EditNovelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { env } = getRequestContext();
  const { slug } = await params;

  const db = drizzle(env.DB, { schema });

  // ၁။ Novel ရှာမယ်
  const novel = await getNovelBySlug(db, slug);
  if (!novel) notFound();

  // ၂။ Auth & Permission Check
  const auth = createAuth(env.DB);
  const session = await auth.api.getSession({ headers: await headers() });

  // Login မဝင်ထားရင် သို့မဟုတ် ပိုင်ရှင်မဟုတ်ရင် မောင်းထုတ်မယ်
  if (!session || session.user.id !== novel.ownerId) {
    redirect('/sign-in');
  }

  // ၃။ Form Data အတွက် ပြင်ဆင်ခြင်း
  // (Database column name နဲ့ Form props ကိုက်ညီအောင် ညှိပါတယ်)
  const initialData = {
    id: novel.id.toString(),
    title: novel.title,
    englishTitle: novel.slug, // slug ကို englishTitle အနေနဲ့ သုံးမယ်
    description: novel.description,
    coverUrl: novel.coverUrl,
    tags: novel.tags || ""
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900">Edit Your Novel ✏️</h1>
        <p className="text-gray-500 mt-2">Update details, cover image, and more.</p>
      </div>

      {/* Reusable Form ကို Update Action နဲ့ တွဲသုံးလိုက်ပါပြီ */}
      <NovelForm
        initialData={initialData}
        submitLabel="Save Changes"
      />
    </div>
  );
}