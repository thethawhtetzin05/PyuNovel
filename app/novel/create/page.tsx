import { getRequestContext } from '@cloudflare/next-on-pages';
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from 'next/navigation';
import NovelForm from './novel-form'; // Client Component ကို ခေါ်သုံးမယ်

export const runtime = 'edge';

export default async function CreateNovelPage() {
  const { env } = getRequestContext();
  const auth = createAuth(env.DB);
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect('/sign-in');
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-[var(--foreground)]">Start a New Journey ✍️</h1>
        <p className="text-[var(--text-muted)] mt-2">Create a new novel and share your imagination.</p>
      </div>

      {/* Form ကို သပ်သပ်ခွဲထုတ်လိုက်တဲ့အတွက် ကုဒ်က ရှင်းသွားပါပြီ */}
      <NovelForm
        submitLabel="Create Novel"
      />

    </div>
  );
}