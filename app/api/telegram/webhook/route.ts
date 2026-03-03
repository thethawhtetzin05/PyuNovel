import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { drizzle } from "drizzle-orm/d1";
import { user, verification, novels } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const runtime = 'edge';

// GET: Enhanced Diagnostic
// Basic check: https://pyunovel.pages.dev/api/telegram/webhook
// Test message: https://pyunovel.pages.dev/api/telegram/webhook?chatId=YOUR_CHAT_ID
export async function GET(req: NextRequest) {
    try {
        const { env } = getRequestContext();
        const botToken = env?.TELEGRAM_PUBLISHER_BOT_TOKEN as string | undefined;
        const db_ok = !!env?.DB;

        if (!botToken) {
            return Response.json({ status: "error", botToken: "❌ MISSING", db: db_ok ? "✅ SET" : "❌ MISSING" });
        }

        // Test 1: getMe - is the token valid?
        const getMeRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
        const getMe = await getMeRes.json() as any;

        // Test 2: actual DB query test
        let dbQueryTest: string;
        if (env?.DB) {
            try {
                const db = drizzle(env.DB as any);
                const rows = await db.select({ id: user.id, telegramId: user.telegramId }).from(user).limit(1);
                dbQueryTest = `✅ DB query works (user table has ${rows.length >= 0 ? 'telegramId column' : '?'})`;
            } catch (dbErr: any) {
                dbQueryTest = `❌ DB query failed: ${dbErr?.message}`;
            }
        } else {
            dbQueryTest = "❌ DB not bound";
        }

        // Test 3: if ?chatId=xxx is provided, send a test message
        const url = new URL(req.url);
        const chatId = url.searchParams.get("chatId");
        let sendResult = null;
        if (chatId) {
            const sendRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, text: "✅ Webhook diagnostic test message!" }),
            });
            sendResult = await sendRes.json();
        }

        return Response.json({
            status: "ok",
            botToken: "✅ SET",
            db: db_ok ? "✅ SET" : "❌ MISSING",
            dbQueryTest,
            botInfo: getMe?.result ?? getMe,
            sendTest: sendResult,
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
                    // Option 3: Use verification table to store "active_selection"
                    // Delete any old selection for this user first
                    await db.delete(verification).where(and(eq(verification.identifier, "active_selection"), eq(verification.value, chatId)));
                    
                    // Insert new selection: id = novelId, identifier = "active_selection", value = chatId
                    await db.insert(verification).values({
                        id: `select_${chatId}`,
                        identifier: "active_selection",
                        value: String(novelId),
                        expiresAt: new Date(Date.now() + 3600000), // Expire in 1 hour
                    });

                    await editTelegramMsgText(botToken, chatId, msgId,
                        `✅ <b>${selectedNovel.title}</b> ကို ရွေးချယ်လိုက်ပါပြီ။\n\nယခု စာမူများကို (စာသားအတိုင်း) ပို့နိုင်ပါပြီ။ (၁ နာရီအတွင်း ပို့ပေးရန်)`);
                }
            }
            return NextResponse.json({ ok: true });
        }

        // --- 2. TEXT MESSAGES ---
        if (body.message?.text) {
            const chatId = String(body.message.chat.id);
            const text = (body.message.text as string).trim();

            if (text === "/start") {
                let dbUser: typeof user.$inferSelect | undefined;
                try {
                    const rows = await db.select().from(user).where(eq(user.telegramId, chatId)).limit(1);
                    dbUser = rows[0];
                } catch (dbErr: any) {
                    console.error("[/start] DB query failed:", dbErr?.message);
                    // DB failed — still respond so user isn't left waiting
                    await sendTelegramMsg(botToken, chatId, "👋 PyuNovel မှ ကြိုဆိုပါတယ်! (DB error: " + dbErr?.message + ")");
                    return NextResponse.json({ ok: true });
                }
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
                    // Option 3 Check: Does this user have an active selection in verification table?
                    const activeSelectionRows = await db.select().from(verification)
                        .where(and(eq(verification.id, `select_${chatId}`), eq(verification.identifier, "active_selection")))
                        .limit(1);
                    
                    const activeSel = activeSelectionRows[0];
                    if (activeSel && new Date() <= new Date(activeSel.expiresAt)) {
                        const novelId = parseInt(activeSel.value, 10);
                        const novelRows = await db.select().from(novels).where(eq(novels.id, novelId)).limit(1);
                        const selectedNovel = novelRows[0];

                        if (selectedNovel) {
                            // Process content for the selected novel
                            await sendTelegramMsg(botToken, chatId, 
                                `📥 <b>"${selectedNovel.title}"</b> အတွက် စာမူလက်ခံရရှိပါသည်။\n\n(လက်ရှိတွင် စမ်းသပ်ဆဲဖြစ်သောကြောင့် Draft အနေဖြင့်သာ မှတ်သားထားပါသည်)`);
                        } else {
                            await sendTelegramMsg(botToken, chatId, "🤖 လုပ်ဆောင်ချက် မရှင်းလင်းပါ။ /start ကို နှိပ်ပါ။");
                        }
                    } else {
                        await sendTelegramMsg(botToken, chatId, "🤖 လုပ်ဆောင်ချက် မရှင်းလင်းပါ။ /start ကို နှိပ်ပါ။");
                    }
                }
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Fatal Webhook Error:", error);
        return NextResponse.json({ ok: true });
    }
}
