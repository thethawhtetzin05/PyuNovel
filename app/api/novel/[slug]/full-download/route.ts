import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { chapters, novels } from "@/db/schema";
import { eq, asc, and, or } from "drizzle-orm";
import { headers } from "next/headers";

export const runtime = 'edge';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { db, auth, env } = getServerContext();
        const { slug } = await params;
        const head = await headers();

        // ၁။ Authentication စစ်ဆေးမယ် (Logged in user သာ ဒေါင်းလုဒ်ဆွဲနိုင်မယ်)
        const session = await auth.api.getSession({ headers: head });
        if (!session?.user) {
            return NextResponse.json({ success: false, error: "Unauthorized. Please login first." }, { status: 401 });
        }

        const userAccount = session.user;

        // ၂။ Secret Key သစ်ဆေးမယ် (X-App-SecretHeader ပါမှ ခွင့်ပြုမယ်)
        // Note: Production မှာ wrangler.toml သို့မဟုတ် Cloudflare Dashboard မှာ ADMIN_SECRET_KEY ထည့်ထားရမယ်
        const appSecret = head.get("X-App-Secret");
        const expectedSecret = env.ADMIN_SECRET_KEY || "PYU_NOVEL_DEFAULT_SECRET"; // Default fallback

        if (appSecret !== expectedSecret) {
            console.warn(`[SECURITY] Invalid App Secret from User: ${userAccount.id}`);
            return NextResponse.json({ success: false, error: "Access Denied. Invalid App Secret." }, { status: 403 });
        }

        // ၃။ Novel ရှိမရှိ အရင်ရှာမယ်
        const novel = await db.query.novels.findFirst({
            where: eq(novels.slug, slug),
            columns: { id: true, title: true, ownerId: true }
        });

        if (!novel) {
            return NextResponse.json({ success: false, error: "Novel not found" }, { status: 404 });
        }

        // ၄။ အခန်းများ ဆွဲထုတ်မယ် (Paid Content Security ပါထည့်မယ်)
        // Admin နဲ့ Writer (Owner) ဖြစ်ရင် အကုန်ရမယ်။ Reader ဆိုရင် Paid: false ပဲရမယ်။
        const isAuthorOrAdmin = userAccount.role === 'admin' || userAccount.id === novel.ownerId;

        const whereClause = isAuthorOrAdmin
            ? eq(chapters.novelId, novel.id)
            : and(eq(chapters.novelId, novel.id), eq(chapters.isPaid, false));

        const rawChapters = await db.query.chapters.findMany({
            where: whereClause,
            orderBy: [asc(chapters.sortIndex)],
            columns: {
                id: true,
                title: true,
                content: true,
                sortIndex: true,
                isPaid: true
            }
        });

        // ၅။ Content Obfuscation (စာမူခိုးရခက်အောင် Base64 encode လုပ်ပြီး ပို့မယ်)
        // APK ဘက်ကနေ ပြန်ဖြည်ပြီး (decode) ဖတ်ရမှာဖြစ်ပါတယ်
        const encodedChapters = rawChapters.map(ch => ({
            ...ch,
            content: Buffer.from(ch.content).toString('base64'),
            obfuscated: true
        }));

        // ၆။ လုံခြုံရေးအတွက် Log မှတ်ထားမယ်
        console.log(`[DOWNLOAD] User ${userAccount.id} (${userAccount.role}) downloaded novel: ${novel.title}`);

        return NextResponse.json({
            success: true,
            novel: { id: novel.id, title: novel.title },
            chapters: encodedChapters,
            downloadedBy: userAccount.id,
            timestamp: Date.now()
        });

    } catch (error) {
        console.error("Full download error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
