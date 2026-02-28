import { getRequestContext } from '@cloudflare/next-on-pages';
import { createAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from '@/i18n/routing';
import { getTranslations } from "next-intl/server";
import NovelForm from './novel-form'; // Client Component ကို ခေါ်သုံးမယ်

export const runtime = 'edge';

export default async function CreateNovelPage({ params }: { params: Promise<{ locale: string }> }) {
  const { env } = getRequestContext();
  const auth = createAuth(env.DB);
  const t = await getTranslations('NovelForm');
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect({ href: '/sign-in', locale: (await params).locale });
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-[var(--foreground)]">{t('createTitle')}</h1>
        <p className="text-[var(--text-muted)] mt-2">{t('createDesc')}</p>
      </div>

      {/* Form ကို သပ်သပ်ခွဲထုတ်လိုက်တဲ့အတွက် ကုဒ်က ရှင်းသွားပါပြီ */}
      <NovelForm
        submitLabel="Create Novel"
      />

    </div>
  );
}