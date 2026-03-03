import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { drizzle } from "drizzle-orm/d1";
import { user, verification, novels, chapters, telegramDrafts } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
// import mammoth from "mammoth"; // mammoth uses 'eval' or similar which is blocked in Edge

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Simple .docx parser for Edge (Experimental/Partial)
// Since mammoth is blocked, we can't easily parse .docx in Edge.
// For now, we'll suggest using .txt or direct messages, or use a workaround.
async function parseDocx(arrayBuffer: ArrayBuffer): Promise<string> {
    // This is a placeholder since we can't use mammoth in Edge.
    // In a real production app, you might offload this to a separate microservice 
    // or use a more edge-compatible library if available.
    throw new Error("Edge runtime does not support .docx parsing yet. Please use .txt or direct messages.");
}

// Simple parser to split text into multiple chapters based on title patterns
function parseBulkText(text: string) {
    const lines = text.split(/\r?\n/);
    const result: { title: string; content: string }[] = [];
    let currentChapter: { title: string; content: string } | null = null;

    // Simple pattern for chapter titles like "Chapter 1", "အပိုင်း (၁)", etc.
    const titleRegex = /^(Chapter|အပိုင်း|Episode|Vol|Volume)\s*[\d\(\).:-]+/i;

    for (let line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (titleRegex.test(trimmed) || (trimmed.length < 50 && (trimmed.includes("Chapter") || trimmed.includes("အပိုင်း")))) {
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
                    .where(eq(user.telegramId, chatId))
                    .run();
                await editTelegramMsgText(botToken, chatId, msgId,
                    "🔓 <b>အကောင့်ဖြုတ်လိုက်ပါပြီ။</b>");
            }
            else if (data === "action_publish_req") {
                const rows = await db.select().from(user).where(eq(user.telegramId, chatId)).limit(1);
                const dbUser = rows[0];
                if (!dbUser || (dbUser.role !== 'admin' && dbUser.role !== 'writer')) {
                    await editTelegramMsgText(botToken, chatId, msgId, "⚠️ စာရေးသူ အကောင့် မဟုတ်ပါ။");
                } else {
                    // Clean up any old selection or draft when starting a new publish request
                    await db.delete(verification).where(eq(verification.id, `select_${chatId}`)).run();
                    
                    const myNovels = await db.select().from(novels).where(eq(novels.ownerId, dbUser.id)).limit(15);
                    if (myNovels.length === 0) {
                        await editTelegramMsgText(botToken, chatId, msgId, "❌ ဝတ္ထု မရှိပါ။");
                    } else {
                        const kb = { inline_keyboard: myNovels.map(n => [{ text: `📚 ${n.title}`, callback_data: `select_novel_${n.id}` }]) };
                        await editTelegramMsgText(botToken, chatId, msgId, "📖 <b>ဝတ္ထုရွေးပါ -</b>", kb);
                    }
                }
            }
            else if (data.startsWith("select_novel_")) {
                // Rate limit/Anti-spam: change text to show processing
                try {
                    await editTelegramMsgText(botToken, chatId, msgId, "⌛ ဝတ္ထုကို ရွေးချယ်နေပါသည်...");
                } catch (e) {}

                const novelId = parseInt(data.replace("select_novel_", ""), 10);
                const rows = await db.select().from(novels).where(eq(novels.id, novelId)).limit(1);
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
                    await editTelegramMsgText(botToken, chatId, msgId, "❌ ဝတ္ထု ရှာမတွေ့ပါ။ /start ကို ပြန်နှိပ်ပါ။");
                }
            }
            else if (data.startsWith("publish_draft_")) {
                const draftId = data.replace("publish_draft_", "");
                
                // Anti-spam: Inform user processing started
                try {
                    await editTelegramMsgText(botToken, chatId, msgId, "⌛ စာမူများကို တင်ပေးနေပါသည်၊ ခေတ္တစောင့်ပါ...");
                } catch (e) {}

                const draftRows = await db.select().from(telegramDrafts).where(eq(telegramDrafts.id, draftId)).limit(1);
                const draft = draftRows[0];
                if (!draft) {
                    await editTelegramMsgText(botToken, chatId, msgId, "❌ ဒီစာမူကို ရှာမတွေ့တော့ပါ။ (ဒါမှမဟုတ် တင်ပြီးသားဖြစ်နိုင်ပါတယ်)");
                    return NextResponse.json({ ok: true });
                }

                const activeSelectionRows = await db.select().from(verification)
                    .where(and(eq(verification.id, `select_${chatId}`), eq(verification.identifier, "active_selection")))
                    .limit(1);
                
                const activeSel = activeSelectionRows[0];
                if (!activeSel) {
                    await sendTelegramMsg(botToken, chatId, "❌ ဝတ္ထုရွေးချယ်မှု သက်တမ်းကုန်သွားပါပြီ။ ကျေးဇူးပြု၍ ပြန်ရွေးပါ။");
                    return NextResponse.json({ ok: true });
                }

                const novelId = parseInt(activeSel.value, 10);
                const parsedChapters = JSON.parse(draft.chaptersJson) as { title: string; content: string }[];

                // Calculate next sortIndex
                const lastChapter = await db.select({ sortIndex: chapters.sortIndex })
                    .from(chapters)
                    .where(eq(chapters.novelId, novelId))
                    .orderBy(desc(chapters.sortIndex))
                    .limit(1);
                
                let nextSortIndex = (lastChapter[0]?.sortIndex ?? 0) + 1;

                // Batch insert in chunks of 10 (ဆယ်ပိုင်းတစ်ဖြတ်)
                const chunkSize = 10;
                for (let i = 0; i < parsedChapters.length; i += chunkSize) {
                    const chunk = parsedChapters.slice(i, i + chunkSize);
                    const valuesToInsert = chunk.map((ch, index) => ({
                        novelId: novelId,
                        title: ch.title,
                        content: ch.content,
                        sortIndex: nextSortIndex++,
                        isPaid: false,
                        createdAt: new Date(),
                    }));
                    
                    await db.insert(chapters).values(valuesToInsert).run();
                }

                await db.delete(telegramDrafts).where(eq(telegramDrafts.id, draftId)).run();
                await editTelegramMsgText(botToken, chatId, msgId, 
                    `✅ <b>အခန်း (${parsedChapters.length}) ခန်း</b> ကို အောင်မြင်စွာ တင်လိုက်ပါပြီ။`);
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
            const chatId = String(message.chat.id);
            const text = message.text?.trim() as string | undefined;
            const doc = message.document;

            if (text === "/start") {
                let dbUser: typeof user.$inferSelect | undefined;
                try {
                    const rows = await db.select().from(user).where(eq(user.telegramId, chatId)).limit(1);
                    dbUser = rows[0];
                } catch (dbErr: any) {
                    console.error("[/start] DB query failed:", dbErr?.message);
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
                return NextResponse.json({ ok: true });
            }

            // Handle Content (Text or Document)
            const activeSelectionRows = await db.select().from(verification)
                .where(and(eq(verification.id, `select_${chatId}`), eq(verification.identifier, "active_selection")))
                .limit(1);
            
            const activeSel = activeSelectionRows[0];
            const isContent = activeSel && new Date() <= new Date(activeSel.expiresAt);

            if (isContent) {
                let contentText = "";
                if (text) contentText = text;
                else if (doc) {
                    const isDocx = doc.mime_type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || doc.file_name?.endsWith(".docx");
                    const isTxt = doc.mime_type === "text/plain" || doc.file_name?.endsWith(".txt");

                    if (isDocx || isTxt) {
                        const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${doc.file_id}`);
                        const fileData = await fileRes.json() as any;
                        if (fileData.ok) {
                            const fileContentRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`);
                            const arrayBuffer = await fileContentRes.arrayBuffer();
                            
                            if (isDocx) {
                                await sendTelegramMsg(botToken, chatId, "⚠️ Cloudflare Edge Runtime တွင် .docx ဖိုင်များကို လက်ရှိတွင် တိုက်ရိုက်ဖတ်၍မရသေးပါ။ ကျေးဇူးပြု၍ .txt ဖိုင် သို့မဟုတ် စာသားအတိုင်း ပို့ပေးပါရန်။");
                                return NextResponse.json({ ok: true });
                            } else {
                                contentText = new TextDecoder().decode(arrayBuffer);
                            }
                        }
                    } else {
                        await sendTelegramMsg(botToken, chatId, "❌ လက်ရှိတွင် .txt နှင့် .docx ဖိုင်များကိုသာ လက်ခံနိုင်ပါသေးသည်။");
                        return NextResponse.json({ ok: true });
                    }
                }

                if (contentText) {
                    const parsed = parseBulkText(contentText);
                    const draftId = `draft_${chatId}_${Date.now()}`;
                    
                    // Get real authorId from DB based on telegramId
                    const userRows = await db.select({ id: user.id }).from(user).where(eq(user.telegramId, chatId)).limit(1);
                    const authorId = userRows[0]?.id;

                    if (!authorId) {
                        await sendTelegramMsg(botToken, chatId, "❌ အကောင့်ချိတ်ဆက်မှု ပြဿနာရှိနေပါသည်။ /start ကို ပြန်နှိပ်ပါ။");
                        return NextResponse.json({ ok: true });
                    }

                    try {
                        await db.insert(telegramDrafts).values({
                            id: draftId,
                            authorId: authorId, 
                            chaptersJson: JSON.stringify(parsed),
                            createdAt: new Date(),
                        }).run();
                    } catch (dbErr: any) {
                        console.error("[CONTENT] DB insert draft failed:", dbErr?.message);
                        await sendTelegramMsg(botToken, chatId, `❌ စာမူကို ယာယီသိမ်းဆည်းရာတွင် အမှားအယွင်းရှိနေပါသည်။\n\nError: ${dbErr?.message}`);
                        return NextResponse.json({ ok: true });
                    }

                    const kb = {
                        inline_keyboard: [
                            [{ text: "✅ အတည်ပြုတင်မယ်", callback_data: `publish_draft_${draftId}` }],
                            [{ text: "🗑 ဖျက်မယ်", callback_data: `discard_draft_${draftId}` }]
                        ]
                    };

                    const preview = parsed.map(c => `• ${c.title}`).join("\n").substring(0, 500);
                    await sendTelegramMsg(botToken, chatId, 
                        `📝 <b>စာမူလက်ခံရရှိပါသည်</b>\n\nစစ်ဆေးတွေ့ရှိသော အခန်းများ -\n${preview}${parsed.length > 5 ? "\n..." : ""}\n\nစုစုပေါင်း: <b>${parsed.length} ခန်း</b>`, 
                        kb);
                    return NextResponse.json({ ok: true });
                }
            } else {
                // Not in active selection mode - handle as "misdirected" or "help"
                if (text && !text.startsWith("/")) {
                    const kb = {
                        inline_keyboard: [
                            [{ text: "📖 ဝတ္ထုရွေးပြီး စာတင်မယ်", callback_data: "action_publish_req" }]
                        ]
                    };
                    await sendTelegramMsg(botToken, chatId, "🤖 <b>ဝတ္ထုကို အရင်ရွေးချယ်ပေးပါခင်ဗျာ။</b>\n\nစာမူမတင်မီ ဘယ်ဝတ္ထုအတွက်လဲဆိုတာ သိဖို့လိုအပ်လို့ပါ။", kb);
                    return NextResponse.json({ ok: true });
                }
            }

            // Linking token flow (fallback)
            if (text) {
                const verifRows = await db.select().from(verification)
                    .where(and(eq(verification.id, text), eq(verification.identifier, "telegram")))
                    .limit(1);
                const verif = verifRows[0];
                if (verif) {
                    if (new Date() > new Date(verif.expiresAt)) {
                        await sendTelegramMsg(botToken, chatId, "❌ Code သက်တမ်းကုန်သွားပါပြီ။");
                    } else {
                        const fromName = message.from?.first_name || "User";
                        await db.update(user)
                            .set({ telegramId: chatId, telegramName: fromName })
                            .where(eq(user.id, verif.value))
                            .run();
                        await db.delete(verification).where(eq(verification.id, text)).run();
                        await sendTelegramMsg(botToken, chatId, "✅ အကောင့်ချိတ်ဆက်မှု အောင်မြင်ပါပြီ! /start ကို ပြန်နှိပ်ပါ။");
                    }
                } else {
                    await sendTelegramMsg(botToken, chatId, "🤖 လုပ်ဆောင်ချက် မရှင်းလင်းပါ။ /start ကို နှိပ်ပါ။");
                }
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Fatal Webhook Error:", error);
        return NextResponse.json({ ok: true });
    }
}
