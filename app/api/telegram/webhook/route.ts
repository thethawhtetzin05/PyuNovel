import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { drizzle } from "drizzle-orm/d1";
import { user, verification, novels } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const runtime = 'edge';

// GET: Diagnostic endpoint
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
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: "HTML",
            ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
        }),
    });
    if (!res.ok) {
        const err = await res.text();
        console.error("[SEND_MSG] Telegram API error:", err);
    }
}

async function editTelegramMsgText(token: string, chatId: string, messageId: number, text: string, replyMarkup?: any) {
    if (!token) return;
    const res = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            text,
            parse_mode: "HTML",
            ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
        }),
    });
    if (!res.ok) {
        const err = await res.text();
        console.error("[EDIT_MSG] Telegram API error:", err);
    }
}

export async function POST(req: NextRequest) {
    try {
        const { env } = getRequestContext();
        const botToken = env?.TELEGRAM_PUBLISHER_BOT_TOKEN as string | undefined;

        if (!botToken || !env?.DB) {
            console.error("[WEBHOOK] Missing botToken or DB binding.");
            return NextResponse.json({ ok: true });
        }

        // Use simple drizzle without schema (no relational API needed)
        const db = drizzle(env.DB as any);
        const body = await req.json() as any;
        if (!body) return NextResponse.json({ ok: true });

        // --- 1. CALLBACK QUERIES ---
        if (body.callback_query) {
            const cb = body.callback_query;
            const chatId = String(cb.message.chat.id);
            const msgId = cb.message.message_id as number;
            const data = cb.data as string;

            if (data === "action_link_req") {
                await editTelegramMsgText(botToken, chatId, msgId,
                    "🔗 <b>အကောင့်ချိတ်ဆက်ရန်</b>\n\nဝဘ်ဆိုက်မှရရှိသော Code ကို ရိုက်ထည့်ပေးပါ။");
            }
            else if (data === "action_unlink_req") {
                await db.update(user)
                    .set({ telegramId: null, telegramName: null })
                    .where(eq(user.telegramId, chatId));
                await editTelegramMsgText(botToken, chatId, msgId,
                    "🔓 <b>အကောင့်ဖြုတ်လိုက်ပါပြီ။</b>");
            }
            else if (data === "action_publish_req") {
                const rows = await db.select().from(user).where(eq(user.telegramId, chatId)).limit(1);
                const dbUser = rows[0];
                if (!dbUser || (dbUser.role !== 'admin' && dbUser.role !== 'writer')) {
                    await editTelegramMsgText(botToken, chatId, msgId, "⚠️ စာရေးသူ အကောင့် မဟုတ်ပါ။");
                } else {
                    const myNovels = await db.select().from(novels).where(eq(novels.ownerId, dbUser.id)).limit(10);
                    if (myNovels.length === 0) {
                        await editTelegramMsgText(botToken, chatId, msgId, "❌ ဝတ္ထု မရှိပါ။");
                    } else {
                        const kb = { inline_keyboard: myNovels.map(n => [{ text: `📚 ${n.title}`, callback_data: `select_novel_${n.id}` }]) };
                        await editTelegramMsgText(botToken, chatId, msgId, "📖 <b>ဝတ္ထုရွေးပါ -</b>", kb);
                    }
                }
            }
            else if (data.startsWith("select_novel_")) {
                const novelId = parseInt(data.replace("select_novel_", ""), 10);
                const rows = await db.select().from(novels).where(eq(novels.id, novelId)).limit(1);
                const selectedNovel = rows[0];
                if (selectedNovel) {
                    await editTelegramMsgText(botToken, chatId, msgId,
                        `✅ <b>${selectedNovel.title}</b> ကို ရွေးချယ်လိုက်ပါပြီ။\n\nယခု စာများကို ပို့နိုင်ပါပြီ။`);
                }
            }
            return NextResponse.json({ ok: true });
        }

        // --- 2. TEXT MESSAGES ---
        if (body.message?.text) {
            const chatId = String(body.message.chat.id);
            const text = (body.message.text as string).trim();

            if (text === "/start") {
                const rows = await db.select().from(user).where(eq(user.telegramId, chatId)).limit(1);
                const dbUser = rows[0];
                const kb = {
                    inline_keyboard: dbUser
                        ? [
                            [{ text: "📝 စာတင်မယ်", callback_data: "action_publish_req" }],
                            [{ text: "🔓 အကောင့်ဖြုတ်မယ်", callback_data: "action_unlink_req" }],
                        ]
                        : [[{ text: "🔗 အကောင့်ချိတ်မယ်", callback_data: "action_link_req" }]],
                };
                const msg = dbUser
                    ? `✅ မင်္ဂလာပါ <b>${dbUser.name}</b>!`
                    : "👋 PyuNovel မှ ကြိုဆိုပါတယ်!";
                await sendTelegramMsg(botToken, chatId, msg, kb);
            } else {
                // Token linking flow
                const verifRows = await db.select().from(verification)
                    .where(and(eq(verification.id, text), eq(verification.identifier, "telegram")))
                    .limit(1);
                const verif = verifRows[0];

                if (verif) {
                    if (new Date() > new Date(verif.expiresAt)) {
                        await sendTelegramMsg(botToken, chatId, "❌ Code သက်တမ်းကုန်သွားပါပြီ။");
                    } else {
                        const fromName = body.message.from?.first_name || "User";
                        await db.update(user)
                            .set({ telegramId: chatId, telegramName: fromName })
                            .where(eq(user.id, verif.value));
                        await db.delete(verification).where(eq(verification.id, text));
                        await sendTelegramMsg(botToken, chatId,
                            "✅ အကောင့်ချိတ်ဆက်မှု အောင်မြင်ပါပြီ! /start ကို ပြန်နှိပ်ပါ။");
                    }
                } else {
                    await sendTelegramMsg(botToken, chatId,
                        "🤖 လုပ်ဆောင်ချက် မရှင်းလင်းပါ။ /start ကို နှိပ်ပါ။");
                }
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Fatal Webhook Error:", error);
        return NextResponse.json({ ok: true });
    }
}
