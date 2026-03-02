import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { user, verification, telegramDrafts, novels, chapters } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { parseChaptersFromText } from "@/lib/utils";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = 'edge';

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
    } catch (e) { console.error("[TELEGRAM_SEND_ERROR]", e); }
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
    } catch (e) { console.error("[TELEGRAM_EDIT_ERROR]", e); }
}

export async function POST(req: NextRequest) {
    try {
        const { env } = getRequestContext();
        const botToken = env.TELEGRAM_PUBLISHER_BOT_TOKEN;
        
        if (!botToken) {
            console.error("Missing TELEGRAM_PUBLISHER_BOT_TOKEN");
            return NextResponse.json({ ok: true });
        }

        const db = getDb(env.DB);
        const body = await req.json() as any;

        // 1. CALLBACK QUERIES
        if (body.callback_query) {
            const callback = body.callback_query;
            const chatId = callback.message.chat.id.toString();
            const messageId = callback.message.message_id;
            const data = callback.data as string;

            if (data === "action_link_req") {
                await editTelegramMsgText(botToken, chatId, messageId, "🔗 <b>အကောင့်ချိတ်ဆက်ရန်</b>\n\nဝဘ်ဆိုက်မှရရှိသော Code ကို ဤနေရာတွင် ရိုက်ထည့်ပေးပါ။");
            } 
            else if (data === "action_unlink_req") {
                await db.update(user).set({ telegramId: null, telegramName: null, telegramUsername: null }).where(eq(user.telegramId, chatId)).run();
                await editTelegramMsgText(botToken, chatId, messageId, "🔓 <b>အကောင့်ဖြုတ်လိုက်ပါပြီ။</b>\n\nပြန်လည်ချိတ်ဆက်လိုပါက /start ကို နှိပ်ပါ။");
            }
            else if (data === "action_publish_req") {
                const dbUser = await db.query.user.findFirst({ where: eq(user.telegramId, chatId) });
                if (!dbUser || (dbUser.role !== 'admin' && dbUser.role !== 'writer')) {
                    await editTelegramMsgText(botToken, chatId, messageId, "⚠️ ဆရာ့အကောင့်က <b>Writer (စာရေးသူ)</b> အဆင့် မဟုတ်သေးပါ။ ဝဘ်ဆိုက်မှာ ဝတ္ထုတစ်ပုဒ် အရင်ဖန်တီးပေးပါ။");
                } else {
                    const authorNovels = await db.query.novels.findMany({ where: eq(novels.ownerId, dbUser.id), limit: 10 });
                    if (authorNovels.length === 0) {
                        await editTelegramMsgText(botToken, chatId, messageId, "❌ ဝတ္ထုတစ်အုပ်မှ မရှိသေးပါ။");
                    } else {
                        const kb = { inline_keyboard: authorNovels.map(n => ([{ text: `📚 ${n.title}`, callback_data: `select_novel_${n.id}` }])) };
                        await editTelegramMsgText(botToken, chatId, messageId, "📖 <b>စာတင်မည့် ဝတ္ထုကို ရွေးပါ -</b>", kb);
                    }
                }
            }
            else if (data.startsWith("select_novel_")) {
                const novelId = parseInt(data.replace("select_novel_", ""));
                const novel = await db.query.novels.findFirst({ where: eq(novels.id, novelId) });
                if (novel) {
                    const draftId = globalThis.crypto.randomUUID();
                    await db.insert(telegramDrafts).values({ id: draftId, authorId: novel.ownerId, chaptersJson: JSON.stringify({ state: "WAITING", novelId: novel.id, novelTitle: novel.title }), createdAt: new Date() }).run();
                    await editTelegramMsgText(botToken, chatId, messageId, `✅ <b>"${novel.title}"</b> ကို ရွေးပြီးပါပြီ။\n\n✍️ တင်မည့်စာသား (သို့) .txt ဖိုင်ကို ပို့ပေးပါ။`);
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
                const msg = dbUser ? `✅ ဆရာ့ရဲ့ ကလောင်နာမည် <b>${dbUser.name}</b> နဲ့ ချိတ်ဆက်ထားပြီး ဖြစ်ပါတယ်။` : "👋 PyuNovel Bot မှ ကြိုဆိုပါတယ်!";
                await sendTelegramMsg(botToken, chatId, msg, kb);
            } else {
                const verif = await db.query.verification.findFirst({ where: and(eq(verification.id, text), eq(verification.identifier, "telegram")) });
                if (verif) {
                    await db.update(user).set({ telegramId: chatId, telegramName: body.message.from.first_name }).where(eq(user.id, verif.value)).run();
                    await db.delete(verification).where(eq(verification.id, text)).run();
                    await sendTelegramMsg(botToken, chatId, "✅ အကောင့်ချိတ်ဆက်မှု အောင်မြင်ပါပြီ! /start ကို ပြန်နှိပ်ပါ။");
                }
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("[WEBHOOK_CRASH]", error);
        return NextResponse.json({ ok: true });
    }
}
