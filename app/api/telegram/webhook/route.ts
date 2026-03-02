import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { user, verification, novels } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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
    try {
        // Use the confirmed working helper for Cloudflare environment
        const { db, env } = getServerContext();
        const botToken = env.TELEGRAM_PUBLISHER_BOT_TOKEN;

        if (!botToken) {
            return NextResponse.json({ ok: true, info: "Token missing" });
        }

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
                        const kb = { inline_keyboard: myNovels.map(n => ([{ text: `📚 ${n.title}`, callback_data: `select_novel_${n.id}` }])) };
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
                }
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Fatal Webhook Error", error);
        return NextResponse.json({ ok: true }); // Always return 200 to Telegram to stop retries
    }
}
