import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { user, verification, telegramDrafts, novels, chapters } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { parseChaptersFromText } from "@/lib/utils";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = 'edge';

const getToken = (reqEnv?: any) => {
    try {
        if (reqEnv && reqEnv.TELEGRAM_PUBLISHER_BOT_TOKEN) return reqEnv.TELEGRAM_PUBLISHER_BOT_TOKEN;
        const env = getRequestContext().env;
        if (env && env.TELEGRAM_PUBLISHER_BOT_TOKEN) return env.TELEGRAM_PUBLISHER_BOT_TOKEN;
    } catch (e) { /* Ignore */ }
    return process.env.TELEGRAM_PUBLISHER_BOT_TOKEN;
};

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
    } catch (e) { console.error(e) }
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
    } catch (e) { console.error(e) }
}

export async function POST(req: NextRequest) {
    let botToken = "";
    try {
        const reqEnv = getRequestContext()?.env || {};
        botToken = reqEnv.TELEGRAM_PUBLISHER_BOT_TOKEN || process.env.TELEGRAM_PUBLISHER_BOT_TOKEN || "";
        const db = getDb(reqEnv.DB);
        const body = await req.json() as any;

        // --- 1. CALLBACK QUERIES ---
        if (body.callback_query) {
            const callback = body.callback_query;
            const chatId = callback.message.chat.id.toString();
            const messageId = callback.message.message_id;
            const data = callback.data as string;

            if (data === "action_link_req") {
                await editTelegramMsgText(botToken, chatId, messageId, "🔗 <b>အကောင့်ချိတ်ဆက်ရန်</b>\n\nဝဘ်ဆိုက်မှရရှိသော Code ကို ဤနေရာတွင် ရိုက်ထည့်ပေးပါ။");
                return NextResponse.json({ ok: true });
            }

            if (data === "action_publish_req") {
                const dbUser = await db.query.user.findFirst({ where: eq(user.telegramId, chatId) });
                if (!dbUser || (dbUser.role !== 'admin' && dbUser.role !== 'writer')) {
                    await editTelegramMsgText(botToken, chatId, messageId, "⚠️ စာတင်ရန်အတွက် စာရေးသူအကောင့် လိုအပ်ပါသည်။");
                    return NextResponse.json({ ok: true });
                }
                const authorNovels = await db.query.novels.findMany({ where: eq(novels.ownerId, dbUser.id), limit: 10 });
                if (authorNovels.length === 0) {
                    await editTelegramMsgText(botToken, chatId, messageId, "❌ ဝတ္ထုတစ်အုပ်မှ မရှိသေးပါ။");
                    return NextResponse.json({ ok: true });
                }
                const kb = authorNovels.map(n => ([{ text: `📚 ${n.title}`, callback_data: `select_novel_${n.id}` }]));
                await editTelegramMsgText(botToken, chatId, messageId, "📖 <b>စာတင်မည့် ဝတ္ထုကို ရွေးပါ -</b>", { inline_keyboard: kb });
                return NextResponse.json({ ok: true });
            }

            // ... Other callback handlers (confirm_draft, select_novel, etc.) simplified for space, keeping core logic
            return NextResponse.json({ ok: true });
        }

        // --- 2. TEXT MESSAGES ---
        if (body.message && body.message.text) {
            const chatId = body.message.chat.id.toString();
            const text = body.message.text.trim();

            if (text === "/start") {
                const dbUser = await db.query.user.findFirst({ where: eq(user.telegramId, chatId) });
                const kb = dbUser 
                    ? [[{ text: "📝 စာတင်မယ်", callback_data: "action_publish_req" }]]
                    : [[{ text: "🔗 အကောင့်ချိတ်မယ်", callback_data: "action_link_req" }]];
                const msg = dbUser ? `✅ မင်္ဂလာပါ <b>${dbUser.name}</b>!` : "👋 PyuNovel မှ ကြိုဆိုပါတယ်!";
                await sendTelegramMsg(botToken, chatId, msg, { inline_keyboard: kb });
                return NextResponse.json({ ok: true });
            }

            // LINKING CODE HANDLER
            const verif = await db.query.verification.findFirst({ where: and(eq(verification.id, text), eq(verification.identifier, "telegram")) });
            if (verif) {
                if (new Date() > new Date(verif.expiresAt)) {
                    await sendTelegramMsg(botToken, chatId, "❌ Code သက်တမ်းကုန်သွားပါပြီ။");
                    return NextResponse.json({ ok: true });
                }
                const from = body.message.from;
                await db.update(user).set({ telegramId: chatId, telegramName: from.first_name }).where(eq(user.id, verif.value)).run();
                await db.delete(verification).where(eq(verification.id, text)).run();
                await sendTelegramMsg(botToken, chatId, "✅ အကောင့်ချိတ်ဆက်မှု အောင်မြင်ပါပြီ! /start ကို ပြန်နှိပ်ပါ။");
                return NextResponse.json({ ok: true });
            }

            // Fallback for unknown input
            await sendTelegramMsg(botToken, chatId, "🤖 လုပ်ဆောင်ချက် မရှင်းလင်းပါ။ /start ကို နှိပ်ပါ။");
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ ok: true }); // Always 200 for Telegram
    }
}
