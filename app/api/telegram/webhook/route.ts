import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";
import { user, verification, novels, chapters, telegramDrafts } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// ... parseDocx and parseBulkText functions stay the same ...
async function parseDocx(arrayBuffer: ArrayBuffer): Promise<string> {
    throw new Error("Edge runtime does not support .docx parsing yet. Please use .txt or direct messages.");
}

function parseBulkText(text: string) {
    const lines = text.split(/\r?\n/);
    const result: { title: string; content: string }[] = [];
    let currentChapter: { title: string; content: string } | null = null;

    const titleRegex = /^([*-=\s\[\(])*(Chapter|အပိုင်း|Episode|Vol|Volume|အခန်း)[\s\(\).:-]*[0-9၀-၉]+([\s\]\)-=*])*$/i;
    const flexibleTitleWithDigitsRegex = /^([*-=\s\[\(])*(Chapter|အပိုင်း|Episode|Vol|Volume|အခန်း)[\s\(\).:-]*[0-9၀-၉]+/i;
    const startWithDigitRegex = /^[0-9၀-၉]+[\)။၊।\.\s-]/;

    for (let line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const isTitle = titleRegex.test(trimmed) || 
                        flexibleTitleWithDigitsRegex.test(trimmed) ||
                        startWithDigitRegex.test(trimmed);

        if (isTitle) {
            if (currentChapter) result.push(currentChapter);
            currentChapter = { title: trimmed, content: "" };
        } else {
            if (!currentChapter) {
                currentChapter = { title: "Untitled Chapter", content: "" };
            }
            currentChapter.content += line + "\n";
        }
    }
    if (currentChapter) result.push(currentChapter);
    return result;
}

export async function GET(req: NextRequest) {
    try {
        const { db, env } = getServerContext({ withAuth: false });
        const botToken = env?.TELEGRAM_PUBLISHER_BOT_TOKEN as string | undefined;

        if (!botToken) {
            return Response.json({ status: "error", botToken: "❌ MISSING" });
        }

        const getMeRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
        const getMe = await getMeRes.json() as any;

        let dbQueryTest: string;
        try {
            const rows = await db.select({ id: user.id }).from(user).limit(1).all();
            dbQueryTest = `✅ DB query works. Found ${rows.length} users.`;
        } catch (dbErr: any) {
            dbQueryTest = `❌ DB query failed: ${dbErr?.message}`;
        }

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
    let botToken: string | undefined;
    try {
        const { db, env } = getServerContext({ withAuth: false });
        botToken = env?.TELEGRAM_PUBLISHER_BOT_TOKEN as string | undefined;

        if (!botToken) {
            console.error("[WEBHOOK] Missing TELEGRAM_PUBLISHER_BOT_TOKEN.");
            return NextResponse.json({ ok: true });
        }

        const body = await req.json() as any;
        if (!body) return NextResponse.json({ ok: true });

        // --- 1. CALLBACK QUERIES ---
        if (body.callback_query) {
            const cb = body.callback_query;
            const chatId = String(cb.message.chat.id); // Force string
            const msgId = cb.message.message_id as number;
            const data = cb.data as string;

            if (data === "action_link_req") {
                await db.delete(verification).where(eq(verification.id, `select_${chatId}`)).run();
                await db.insert(verification).values({
                    id: `state_${chatId}`,
                    identifier: "awaiting_verification_code",
                    value: "pending",
                    expiresAt: new Date(Date.now() + 15 * 60000),
                }).run();

                const kb = {
                    inline_keyboard: [[{ text: "❌ မလုပ်တော့ပါ (Cancel)", callback_data: "action_cancel_state" }]]
                };

                await editTelegramMsgText(botToken, chatId, msgId,
                    "🔗 <b>အကောင့်ချိတ်ဆက်ရန်</b>\n\nဝဘ်ဆိုက်မှရရှိသော Code ကို ရိုက်ထည့်ပေးပါ။ (၁၅ မိနစ်အတွင်း)", kb);
            }
            else if (data === "action_cancel_state") {
                await db.delete(verification).where(eq(verification.id, `state_${chatId}`)).run();
                await editTelegramMsgText(botToken, chatId, msgId, "❌ လုပ်ဆောင်ချက်ကို ပယ်ဖျက်လိုက်ပါပြီ။");
            }
            else if (data === "action_unlink_req") {
                await db.update(user)
                    .set({ telegramId: null, telegramName: null })
                    .where(eq(user.telegramId, chatId))
                    .run();
                await editTelegramMsgText(botToken, chatId, msgId, "🔓 <b>အကောင့်ဖြုတ်လိုက်ပါပြီ။</b>");
            }
            else if (data === "action_publish_req") {
                await db.delete(verification).where(eq(verification.id, `state_${chatId}`)).run();
                const rows = await db.select().from(user).where(eq(user.telegramId, chatId)).limit(1).all();
                const dbUser = rows[0];
                if (!dbUser || (dbUser.role !== 'admin' && dbUser.role !== 'writer')) {
                    await editTelegramMsgText(botToken, chatId, msgId, "⚠️ စာရေးသူ အကောင့် မဟုတ်ပါ။");
                } else {
                    await db.delete(verification).where(eq(verification.id, `select_${chatId}`)).run();
                    const myNovels = await db.select().from(novels).where(eq(novels.ownerId, dbUser.id)).limit(15).all();
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
                const rows = await db.select().from(novels).where(eq(novels.id, novelId)).limit(1).all();
                const selectedNovel = rows[0];
                if (selectedNovel) {
                    const selectionId = `select_${chatId}`;
                    await db.delete(verification).where(eq(verification.id, selectionId)).run();
                    await db.insert(verification).values({
                        id: selectionId,
                        identifier: "active_selection",
                        value: String(novelId),
                        expiresAt: new Date(Date.now() + 3600000), 
                    }).run();
                    await editTelegramMsgText(botToken, chatId, msgId,
                        `✅ <b>${selectedNovel.title}</b> ကို ရွေးချယ်လိုက်ပါပြီ။\n\nယခု စာသား သို့မဟုတ် စာဖိုင် (Bulk) ကို ပို့နိုင်ပါပြီ။`);
                } else {
                    await editTelegramMsgText(botToken, chatId, msgId, "❌ ဝတ္ထု ရှာမတွေ့ပါ။");
                }
            }
            else if (data.startsWith("publish_draft_")) {
                const draftId = data.replace("publish_draft_", "");
                const draftRows = await db.select().from(telegramDrafts).where(eq(telegramDrafts.id, draftId)).limit(1).all();
                const draft = draftRows[0];
                if (!draft) {
                    await editTelegramMsgText(botToken, chatId, msgId, "❌ ဒီစာမူကို ရှာမတွေ့တော့ပါ။");
                    return NextResponse.json({ ok: true });
                }

                const activeSelectionRows = await db.select().from(verification)
                    .where(and(eq(verification.id, `select_${chatId}`), eq(verification.identifier, "active_selection")))
                    .limit(1).all();
                
                const activeSel = activeSelectionRows[0];
                if (!activeSel) {
                    await sendTelegramMsg(botToken, chatId, "❌ ဝတ္ထုရွေးချယ်မှု သက်တမ်းကုန်သွားပါပြီ။");
                    return NextResponse.json({ ok: true });
                }

                const novelId = parseInt(activeSel.value, 10);
                const parsedChapters = JSON.parse(draft.chaptersJson) as { title: string; content: string }[];

                const lastChapter = await db.select({ sortIndex: chapters.sortIndex })
                    .from(chapters)
                    .where(eq(chapters.novelId, novelId))
                    .orderBy(desc(chapters.sortIndex))
                    .limit(1).all();
                
                let nextSortIndex = (lastChapter[0]?.sortIndex ?? 0) + 1;

                const chunkSize = 10;
                for (let i = 0; i < parsedChapters.length; i += chunkSize) {
                    const chunk = parsedChapters.slice(i, i + chunkSize);
                    await db.insert(chapters).values(chunk.map(ch => ({
                        novelId,
                        title: ch.title,
                        content: ch.content,
                        sortIndex: nextSortIndex++,
                        isPaid: false,
                        createdAt: new Date(),
                    }))).run();
                }

                await db.delete(telegramDrafts).where(eq(telegramDrafts.id, draftId)).run();
                await editTelegramMsgText(botToken, chatId, msgId, `✅ <b>အခန်း (${parsedChapters.length}) ခန်း</b> ကို အောင်မြင်စွာ တင်လိုက်ပါပြီ။`);
            }
            else if (data.startsWith("discard_draft_")) {
                const draftId = data.replace("discard_draft_", "");
                await db.delete(telegramDrafts).where(eq(telegramDrafts.id, draftId)).run();
                await editTelegramMsgText(botToken, chatId, msgId, "🗑 စာမူကို ဖျက်လိုက်ပါပြီ။");
            }
            return NextResponse.json({ ok: true });
        }

        // --- 2. TEXT & DOCUMENT MESSAGES ---
        const message = body.message;
        if (message) {
            const chatId = String(message.chat.id); // Force string
            const text = message.text?.trim() as string | undefined;
            const doc = message.document;

            if (text === "/start") {
                await db.delete(verification).where(eq(verification.id, `state_${chatId}`)).run();
                await db.delete(verification).where(eq(verification.id, `select_${chatId}`)).run();

                const rows = await db.select().from(user).where(eq(user.telegramId, chatId)).limit(1).all();
                const dbUser = rows[0];
                
                const kb = {
                    inline_keyboard: dbUser
                        ? [[{ text: "📝 စာတင်မယ်", callback_data: "action_publish_req" }], [{ text: "🔓 အကောင့်ဖြုတ်မယ်", callback_data: "action_unlink_req" }]]
                        : [[{ text: "🔗 အကောင့်ချိတ်မယ်", callback_data: "action_link_req" }]],
                };
                const msg = dbUser ? `✅ မင်္ဂလာပါ <b>${dbUser.name}</b>!` : "👋 PyuNovel မှ ကြိုဆိုပါတယ်!";
                await sendTelegramMsg(botToken, chatId, msg, kb);
                return NextResponse.json({ ok: true });
            }

            const stateRows = await db.select().from(verification)
                .where(and(eq(verification.id, `state_${chatId}`), eq(verification.identifier, "awaiting_verification_code")))
                .limit(1).all();
            const currentState = stateRows[0];
            const isAwaitingCode = currentState && new Date() <= new Date(currentState.expiresAt);

            if (isAwaitingCode && text) {
                const verifRows = await db.select().from(verification)
                    .where(and(eq(verification.id, text), eq(verification.identifier, "telegram")))
                    .limit(1).all();
                const verif = verifRows[0];

                if (verif) {
                    if (new Date() > new Date(verif.expiresAt)) {
                        await sendTelegramMsg(botToken, chatId, "❌ Code သက်တမ်းကုန်သွားပါပြီ။");
                    } else {
                        await db.update(user)
                            .set({ telegramId: chatId, telegramName: message.from?.first_name || "User" })
                            .where(eq(user.id, verif.value))
                            .run();
                        await db.delete(verification).where(eq(verification.id, text)).run();
                        await db.delete(verification).where(eq(verification.id, `state_${chatId}`)).run();
                        await sendTelegramMsg(botToken, chatId, "✅ အကောင့်ချိတ်ဆက်မှု အောင်မြင်ပါပြီ! /start ကို ပြန်နှိပ်ပါ။");
                    }
                } else {
                    await sendTelegramMsg(botToken, chatId, "❌ ကုဒ် မမှန်ကန်ပါ။");
                }
                return NextResponse.json({ ok: true });
            }

            const activeSelRows = await db.select().from(verification)
                .where(and(eq(verification.id, `select_${chatId}`), eq(verification.identifier, "active_selection")))
                .limit(1).all();
            const activeSel = activeSelRows[0];
            if (activeSel && new Date() <= new Date(activeSel.expiresAt)) {
                let contentText = "";
                if (text) contentText = text;
                else if (doc) {
                    if (doc.file_name?.endsWith(".txt")) {
                        const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${doc.file_id}`);
                        const fileData = await fileRes.json() as any;
                        if (fileData.ok) {
                            const fileContentRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`);
                            contentText = new TextDecoder().decode(await fileContentRes.arrayBuffer());
                        }
                    } else {
                        await sendTelegramMsg(botToken, chatId, "❌ .txt ဖိုင်များကိုသာ လက်ခံနိုင်ပါသေးသည်။");
                        return NextResponse.json({ ok: true });
                    }
                }

                if (contentText) {
                    const parsed = parseBulkText(contentText);
                    const userRows = await db.select({ id: user.id }).from(user).where(eq(user.telegramId, chatId)).limit(1).all();
                    const authorId = userRows[0]?.id;
                    if (!authorId) return NextResponse.json({ ok: true });

                    const draftId = `draft_${chatId}_${Date.now()}`;
                    await db.insert(telegramDrafts).values({ id: draftId, authorId, chaptersJson: JSON.stringify(parsed), createdAt: new Date() }).run();
                    const kb = { inline_keyboard: [[{ text: "✅ အတည်ပြုတင်မယ်", callback_data: `publish_draft_${draftId}` }], [{ text: "🗑 ဖျက်မယ်", callback_data: `discard_draft_${draftId}` }]] };
                    await sendTelegramMsg(botToken, chatId, `📝 <b>စာမူလက်ခံရရှိပါသည်</b>\n\nစုစုပေါင်း: <b>${parsed.length} ခန်း</b>`, kb);
                }
            }
        }
    } catch (error) {
        console.error("Webhook Error:", error);
    }
    return NextResponse.json({ ok: true });
}

