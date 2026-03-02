import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { user, verification, novels } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const runtime = 'edge';

// GET: Diagnostic endpoint - check if webhook is reachable and env vars are set
// Visit: https://pyunovel.pages.dev/api/telegram/webhook
export async function GET() {
    try {
        const { env } = getRequestContext();
        return Response.json({
            status: "ok",
            botToken: env?.TELEGRAM_PUBLISHER_BOT_TOKEN ? "✅ SET" : "❌ MISSING",
            db: env?.DB ? "✅ SET" : "❌ MISSING",
            timestamp: new Date().toISOString(),
        });
    } catch (e: any) {
        return Response.json({ status: "error", message: e?.message }, { status: 500 });
    }
}

async function sendTelegramMsg(token: string, chatId: string, text: string, replyMarkup?: any) {
    if (!token) return;
    try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: "HTML",
                reply_markup: replyMarkup
            }),
        });
    } catch (e) { console.error("Send Error", e); }
}

async function editTelegramMsgText(token: string, chatId: string, messageId: number, text: string, replyMarkup?: any) {
    if (!token) return;
    try {
        await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
                text: text,
                parse_mode: "HTML",
                reply_markup: replyMarkup
            }),
        });
    } catch (e) { console.error("Edit Error", e); }
}

export async function POST(req: NextRequest) {
    // Always return 200 to Telegram — even on catastrophic failure — to stop retries
    try {
        const { env } = getRequestContext();
        const botToken = env?.TELEGRAM_PUBLISHER_BOT_TOKEN;

        if (!botToken) {
            console.error("[WEBHOOK] TELEGRAM_PUBLISHER_BOT_TOKEN is not set in Cloudflare environment.");
            return NextResponse.json({ ok: true, info: "Token missing" });
        }

        if (!env?.DB) {
            console.error("[WEBHOOK] D1 DB binding is not set in Cloudflare environment.");
            return NextResponse.json({ ok: true, info: "DB missing" });
        }

        const db = drizzle(env.DB, { schema });
        const body = await req.json() as any;
        if (!body) return NextResponse.json({ ok: true });

        // 1. CALLBACK QUERIES
        if (body.callback_query) {
            const cb = body.callback_query;
            const chatId = cb.message.chat.id.toString();
            const msgId = cb.message.message_id;
            const data = cb.data;

            if (data === "action_link_req") {
                await editTelegramMsgText(botToken, chatId, msgId, "🔗 <b>အကောင့်ချိတ်ဆက်ရန်</b>\n\nဝဘ်ဆိုက်မှရရှိသော Code ကို ရိုက်ထည့်ပေးပါ။");
            }
            else if (data === "action_unlink_req") {
                await db.update(user).set({ telegramId: null, telegramName: null }).where(eq(user.telegramId, chatId)).run();
                await editTelegramMsgText(botToken, chatId, msgId, "🔓 <b>အကောင့်ဖြုတ်လိုက်ပါပြီ။</b>");
            }
            else if (data === "action_publish_req") {
                const dbUser = await db.query.user.findFirst({ where: eq(user.telegramId, chatId) });
                if (!dbUser || (dbUser.role !== 'admin' && dbUser.role !== 'writer')) {
                    await editTelegramMsgText(botToken, chatId, msgId, "⚠️ စာရေးသူ အကောင့် မဟုတ်ပါ။");
                } else {
                    const myNovels = await db.query.novels.findMany({ where: eq(novels.ownerId, dbUser.id), limit: 10 });
                    if (myNovels.length === 0) {
                        await editTelegramMsgText(botToken, chatId, msgId, "❌ ဝတ္ထု မရှိပါ။");
                    } else {
                        const kb = { inline_keyboard: myNovels.map((n: typeof myNovels[0]) => ([{ text: `📚 ${n.title}`, callback_data: `select_novel_${n.id}` }])) };
                        await editTelegramMsgText(botToken, chatId, msgId, "📖 <b>ဝတ္ထုရွေးပါ -</b>", kb);
                    }
                }
            }
            else if (data.startsWith("select_novel_")) {
                const novelId = parseInt(data.replace("select_novel_", ""));
                const selectedNovel = await db.query.novels.findFirst({ where: eq(novels.id, novelId) });
                if (selectedNovel) {
                    await editTelegramMsgText(botToken, chatId, msgId, `✅ <b>${selectedNovel.title}</b> ကို ရွေးချယ်လိုက်ပါပြီ။\n\nယခု စာများကို ပို့နိုင်ပါပြီ။`);
                }
            }
            return NextResponse.json({ ok: true });
        }

        // 2. TEXT MESSAGES
        if (body.message && body.message.text) {
            const chatId = body.message.chat.id.toString();
            const text = body.message.text.trim();

            if (text === "/start") {
                const dbUser = await db.query.user.findFirst({ where: eq(user.telegramId, chatId) });
                const kb = {
                    inline_keyboard: dbUser
                        ? [[{ text: "📝 စာတင်မယ်", callback_data: "action_publish_req" }], [{ text: "🔓 အကောင့်ဖြုတ်မယ်", callback_data: "action_unlink_req" }]]
                        : [[{ text: "🔗 အကောင့်ချိတ်မယ်", callback_data: "action_link_req" }]]
                };
                const msg = dbUser ? `✅ မင်္ဂလာပါ <b>${dbUser.name}</b>!` : "👋 PyuNovel မှ ကြိုဆိုပါတယ်!";
                await sendTelegramMsg(botToken, chatId, msg, kb);
            } else {
                const verif = await db.query.verification.findFirst({ where: and(eq(verification.id, text), eq(verification.identifier, "telegram")) });
                if (verif) {
                    const fromName = body.message.from?.first_name || "User";
                    await db.update(user).set({ telegramId: chatId, telegramName: fromName }).where(eq(user.id, verif.value)).run();
                    await db.delete(verification).where(eq(verification.id, text)).run();
                    await sendTelegramMsg(botToken, chatId, "✅ အကောင့်ချိတ်ဆက်မှု အောင်မြင်ပါပြီ! /start ကို ပြန်နှိပ်ပါ။");
                } else {
                    await sendTelegramMsg(botToken, chatId, "🤖 လုပ်ဆောင်ချက် မရှင်းလင်းပါ။ /start ကို နှိပ်ပါ။");
                }
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Fatal Webhook Error:", error);
        return NextResponse.json({ ok: true }); // Always 200 to stop Telegram retries
    }
}
