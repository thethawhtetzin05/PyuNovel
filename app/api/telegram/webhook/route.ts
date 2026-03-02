import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { user, verification, telegramDrafts, novels, chapters } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { parseChaptersFromText } from "@/lib/utils";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = 'edge';

const getToken = (reqEnv?: any) => {
    // Attempt to get token from Edge environment first, fallback to standard process.env
    try {
        if (reqEnv && reqEnv.TELEGRAM_BOT_TOKEN) return reqEnv.TELEGRAM_BOT_TOKEN;
        
        const env = getRequestContext().env;
        if (env && env.TELEGRAM_BOT_TOKEN) return env.TELEGRAM_BOT_TOKEN;
    } catch (e) {
        // Ignored
    }
    return process.env.TELEGRAM_BOT_TOKEN;
};

async function sendTelegramMsg(token: string, chatId: string, text: string, replyMarkup?: any) {
    if (!token) {
        console.error("[TELEGRAM] No bot token found to send message");
        return;
    }
    try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: "HTML",
                reply_markup: replyMarkup
            }),
        });
        const data = await res.json() as any;
        if (!data.ok) console.error("[TELEGRAM SEND ERROR]", data);
    } catch (e) { console.error("[TELEGRAM FETCH ERROR]", e) }
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

async function getTelegramFileText(token: string, fileId: string): Promise<string | null> {
    if (!token) return null;
    try {
        const res = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
        const data = await res.json() as any;
        if (!data.ok) return null;
        const filePath = data.result.file_path;
        const fileRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
        return await fileRes.text();
    } catch (e) {
        console.error(e);
        return null;
    }
}

export async function POST(req: NextRequest) {
    let botToken = "";
    try {
        const reqEnv = getRequestContext()?.env || {};
        
        botToken = reqEnv.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "";
        
        if (!botToken) {
            console.error("[TELEGRAM_WEBHOOK] ERROR: Bot token is empty.");
        }

        const db = getDb(reqEnv.DB);
        const body = await req.json() as any;

        // ==========================================
        // 1. CALLBACK QUERIES (Button Clicks)
        // ==========================================
        if (body.callback_query) {
            const callback = body.callback_query;
            const chatId = callback.message.chat.id.toString();
            const messageId = callback.message.message_id;
            const data = callback.data as string;

            // --- ACTION: LINK ACCOUNT ---
            if (data === "action_link_req") {
                await editTelegramMsgText(botToken, chatId, messageId,
                    "🔗 <b>အကောင့်ချိတ်ဆက်ရန်</b>\n\nPyuNovel ဝဘ်ဆိုက်၏ Settings > Telegram Integration မှ <b>Generate Connection Link</b> ကိုနှိပ်ပြီး ရရှိလာသော Code ကို ဤနေရာတွင် ရိုက်ထည့်ပေးပါ။\n\n<i>(ဥပမာ - ABCDEF သို့မဟုတ် /start ABCDEF)</i>"
                );
                return NextResponse.json({ ok: true });
            }

            // --- ACTION: PUBLISH CHAPTERS ---
            if (data === "action_publish_req") {
                const dbUser = await db.query.user.findFirst({ where: eq(user.telegramId, chatId) });

                if (!dbUser) {
                    await editTelegramMsgText(botToken, chatId, messageId, "⚠️ <b>အကောင့်ချိတ်ဆက်ထားခြင်း မရှိသေးပါ။</b>\nကျေးဇူးပြု၍ <b>အကောင့်ချိတ်မယ်</b> ကို အရင်ရွေးချယ်ပါ။", {
                        inline_keyboard: [[{ text: "🔗 အကောင့်ချိတ်မယ်", callback_data: "action_link_req" }]]
                    });
                    return NextResponse.json({ ok: true });
                }

                if (dbUser.role !== 'admin' && dbUser.role !== 'writer') {
                    await editTelegramMsgText(botToken, chatId, messageId, "⚠️ စာတင်ရန်အတွက် သင်သည် Writer သို့မဟုတ် Admin ဖြစ်ရန် လိုအပ်ပါသည်။");
                    return NextResponse.json({ ok: true });
                }

                const authorNovels = await db.query.novels.findMany({
                    where: eq(novels.ownerId, dbUser.id),
                    orderBy: [desc(novels.updatedAt)],
                    limit: 10
                });

                if (authorNovels.length === 0) {
                    await editTelegramMsgText(botToken, chatId, messageId, "❌ သင့်တွင် ဝတ္ထုတစ်အုပ်မှ မရှိသေးပါ။ ကျေးဇူးပြု၍ ဝဘ်ဆိုက်တွင် ဝတ္ထုအရင် ဖန်တီးပါ။");
                    return NextResponse.json({ ok: true });
                }

                const inlineKeyboard: any[][] = [];
                for (let i = 0; i < authorNovels.length; i += 2) {
                    const row = [];
                    row.push({ text: `📚 ${authorNovels[i].title}`, callback_data: `select_novel_${authorNovels[i].id}` });
                    if (authorNovels[i + 1]) {
                        row.push({ text: `📚 ${authorNovels[i + 1].title}`, callback_data: `select_novel_${authorNovels[i + 1].id}` });
                    }
                    inlineKeyboard.push(row);
                }

                await editTelegramMsgText(botToken, chatId, messageId, "📖 <b>စာတင်မည့် ဝတ္ထုကို ရွေးချယ်ပါ -</b>", { inline_keyboard: inlineKeyboard });
                return NextResponse.json({ ok: true });
            }

            // --- ACTION: SELECT NOVEL ---
            if (data.startsWith("select_novel_")) {
                const novelId = parseInt(data.replace("select_novel_", ""));
                const dbUser = await db.query.user.findFirst({ where: eq(user.telegramId, chatId) });
                if (!dbUser) return NextResponse.json({ ok: true });

                const novel = await db.query.novels.findFirst({
                    where: and(eq(novels.id, novelId), eq(novels.ownerId, dbUser.id))
                });

                if (!novel) {
                    await editTelegramMsgText(botToken, chatId, messageId, "❌ ဤဝတ္ထုကို သင်ပိုင်ဆိုင်ခြင်း မရှိပါ။");
                    return NextResponse.json({ ok: true });
                }

                // Delete old drafts for this user to start fresh
                const userDrafts = await db.query.telegramDrafts.findMany({ where: eq(telegramDrafts.authorId, dbUser.id) });
                for (const d of userDrafts) {
                    await db.delete(telegramDrafts).where(eq(telegramDrafts.id, d.id));
                }

                // Create a "WAITING_CONTENT" state draft
                const draftId = globalThis.crypto.randomUUID();
                const draftState = { state: "WAITING_CONTENT", novelId: novel.id, novelTitle: novel.title };
                await db.insert(telegramDrafts).values({
                    id: draftId,
                    authorId: dbUser.id,
                    chaptersJson: JSON.stringify(draftState),
                    createdAt: new Date(),
                });

                await editTelegramMsgText(botToken, chatId, messageId,
                    `✅ <b>"${novel.title}"</b> ဝတ္ထုကို ရွေးချယ်ပြီးပါပြီ။\n\n✍️ ယခု သင်တင်မည့် စာသား (သို့) <b>.txt</b> ဖိုင်ကို ဤနေရာသို့ တိုက်ရိုက် ပို့ပေးပါ။\n<i>(ခေါင်းစဉ်များကို "အပိုင်း (၁)" သို့မဟုတ် "အခန်း ၁" ဟု တပ်ပေးရန် မမေ့ပါနှင့်)</i>`
                );
                return NextResponse.json({ ok: true });
            }

            // --- ACTION: CONFIRM UPLOAD ---
            if (data.startsWith("confirm_draft_")) {
                const draftId = data.replace("confirm_draft_", "");
                const dbUser = await db.query.user.findFirst({ where: eq(user.telegramId, chatId) });
                if (!dbUser) return NextResponse.json({ ok: true });

                const draft = await db.query.telegramDrafts.findFirst({ where: eq(telegramDrafts.id, draftId) });
                if (!draft) {
                    await editTelegramMsgText(botToken, chatId, messageId, "❌ <b>လုပ်ဆောင်ချက် သက်တမ်းကုန်သွားပါပြီ။</b> ကျေးဇူးပြု၍ အစကနေ ပြန်လုပ်ပါ။");
                    return NextResponse.json({ ok: true });
                }

                const parsedState = JSON.parse(draft.chaptersJson);
                if (parsedState.state !== "WAITING_CONFIRM") return NextResponse.json({ ok: true });

                const novelId = parsedState.novelId;
                const parsedChapters = parsedState.chapters;

                const lastChapter = await db.query.chapters.findFirst({
                    where: eq(chapters.novelId, novelId),
                    orderBy: [desc(chapters.sortIndex)],
                });
                let currentStartIndex = lastChapter ? Math.floor(lastChapter.sortIndex) + 1 : 1;

                const chaptersToInsert = parsedChapters.map((ch: any, i: number) => ({
                    novelId: novelId,
                    title: ch.title,
                    content: ch.content,
                    sortIndex: currentStartIndex + i,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }));

                await db.insert(chapters).values(chaptersToInsert);
                await db.delete(telegramDrafts).where(eq(telegramDrafts.id, draftId));

                await editTelegramMsgText(botToken, chatId, messageId, `✅ <b>"${parsedState.novelTitle}" သို့ အခန်းပေါင်း (${chaptersToInsert.length}) ခန်း အောင်မြင်စွာ တင်ပြီးပါပြီ!</b> 🎉`);
                return NextResponse.json({ ok: true });
            }

            // --- ACTION: CANCEL UPLOAD ---
            if (data.startsWith("cancel_draft_")) {
                const draftId = data.replace("cancel_draft_", "");
                await db.delete(telegramDrafts).where(eq(telegramDrafts.id, draftId));
                await editTelegramMsgText(botToken, chatId, messageId, "❌ <b>စာတင်ခြင်းကို ပယ်ဖျက်လိုက်ပါသည်။</b>");
                return NextResponse.json({ ok: true });
            }

            return NextResponse.json({ ok: true });
        }


        // ==========================================
        // 2. TEXT MESSAGES & DOCUMENTS
        // ==========================================
        if (body.message) {
            const chatId = body.message.chat.id.toString();
            let textToProcess = "";

            // --- Extract Text from Message or Document ---
            if (body.message.text) {
                textToProcess = body.message.text.trim();
            } else if (body.message.document) {
                const doc = body.message.document;
                if (doc.mime_type === "text/plain") {
                    const extracted = await getTelegramFileText(botToken, doc.file_id);
                    if (extracted) textToProcess = extracted.trim();
                    else {
                        await sendTelegramMsg(botToken, chatId, "❌ ဖိုင်ဖတ်ရာတွင် အမှားအယွင်းဖြစ်ပွားခဲ့ပါသည်။");
                        return NextResponse.json({ ok: true });
                    }
                } else {
                    await sendTelegramMsg(botToken, chatId, "⚠️ လောလောဆယ် <b>.txt</b> ဖိုင် သို့မဟုတ် စာသား တိုက်ရိုက်ပို့ခြင်းကိုသာ လက်ခံပေးနိုင်ပါသေးသည်။ ကျေးဇူးပြု၍ .txt ပြောင်းပြီး ပြန်ပို့ပေးပါ။");
                    return NextResponse.json({ ok: true });
                }
            }

            if (!textToProcess) return NextResponse.json({ ok: true });

            // --- MENU TRIGGER (/start) ---
            if (textToProcess === "/start") {
                const inlineKeyboard = [
                    [{ text: "🔗 အကောင့်ချိတ်မယ်", callback_data: "action_link_req" }],
                    [{ text: "📝 စာတင်မယ်", callback_data: "action_publish_req" }]
                ];
                await sendTelegramMsg(botToken, chatId, "👋 <b>PyuNovel Bot မှ ကြိုဆိုပါတယ်!</b>\n\nအောက်ပါ လုပ်ဆောင်ချက်များမှ တစ်ခုကို ရွေးချယ်ပါ -", {
                    inline_keyboard: inlineKeyboard
                });
                return NextResponse.json({ ok: true });
            }

            // --- HANDLE CONNECTION CODE ---
            const potentialToken = textToProcess.startsWith("/start ") ? textToProcess.replace("/start ", "") : textToProcess;
            const verif = await db.query.verification.findFirst({
                where: (v, { eq, and }) => and(eq(v.id, potentialToken), eq(v.identifier, "telegram"))
            });

            if (verif) {
                if (new Date() > new Date(verif.expiresAt)) {
                    await db.delete(verification).where(eq(verification.id, potentialToken));
                    await sendTelegramMsg(botToken, chatId, "❌ <b>Code သက်တမ်းကုန်သွားပါပြီ။</b>\nဝဘ်ဆိုက်မှ Code အသစ်တစ်ခု ထပ်မံရယူပါ။");
                    return NextResponse.json({ ok: true });
                }

                const userId = verif.value;
                const from = body.message.from;
                const tgName = [from.first_name, from.last_name].filter(Boolean).join(" ");
                const tgUsername = from.username ? `@${from.username}` : null;

                await db.update(user).set({ telegramId: null, telegramUsername: null, telegramName: null }).where(eq(user.telegramId, chatId));
                await db.update(user).set({ telegramId: chatId, telegramUsername: tgUsername, telegramName: tgName }).where(eq(user.id, userId));
                await db.delete(verification).where(eq(verification.id, potentialToken));

                await sendTelegramMsg(botToken, chatId, `✅ <b>အကောင့် ချိတ်ဆက်ခြင်း အောင်မြင်ပါသည်!</b> 🚀\n\nConnected as: <b>${tgName}</b>\n\nယခု "စာတင်မယ်" ခလုတ်ကို နှိပ်၍ စတင် အသုံးပြုနိုင်ပါပြီ။`);
                return NextResponse.json({ ok: true });
            }

            // --- HANDLE CHAPTER CONTENT (WAITING_CONTENT STATE) ---
            const dbUser = await db.query.user.findFirst({ where: eq(user.telegramId, chatId) });
            if (dbUser) {
                const userDrafts = await db.query.telegramDrafts.findMany({ where: eq(telegramDrafts.authorId, dbUser.id) });
                const pendingDraft = userDrafts.find(d => d.chaptersJson.includes('"WAITING_CONTENT"'));

                if (pendingDraft) {
                    const parsedState = JSON.parse(pendingDraft.chaptersJson);
                    const parsedChapters = parseChaptersFromText(textToProcess);

                    if (parsedChapters.length === 0) {
                        await sendTelegramMsg(botToken, chatId, "❌ <b>အခန်းခေါင်းစဉ်များ ရှာမတွေ့ပါ။</b>\nကျေးဇူးပြု၍ ခေါင်းစဉ်များကို 'အပိုင်း (၁)' သို့မဟုတ် 'အခန်း ၁' ဟု ထည့်သွင်းပေးပါ။");
                        return NextResponse.json({ ok: true });
                    }

                    const updatedState = {
                        state: "WAITING_CONFIRM",
                        novelId: parsedState.novelId,
                        novelTitle: parsedState.novelTitle,
                        chapters: parsedChapters
                    };

                    await db.update(telegramDrafts)
                        .set({ chaptersJson: JSON.stringify(updatedState) })
                        .where(eq(telegramDrafts.id, pendingDraft.id));

                    let previewMsg = `📖 <b>စာမူစစ်ဆေးခြင်း (Preview)</b>\n\n✅ <b>ဝတ္ထု:</b> ${parsedState.novelTitle}\n✅ <b>အခန်းပေါင်း:</b> ${parsedChapters.length} ခန်း\n\n`;
                    parsedChapters.slice(0, 5).forEach((p: any, i: number) => {
                        const wordCount = p.content.trim().split(/\s+/).length;
                        previewMsg += `• ${p.title} <i>(${wordCount} words)</i>\n`;
                    });
                    if (parsedChapters.length > 5) previewMsg += `<i>... နောက်ထပ် ${parsedChapters.length - 5} ခန်း</i>\n`;
                    previewMsg += `\n<b>အတည်ပြုပြီး တင်မှာ သေချာပါသလား? 👇</b>`;

                    const inlineKeyboard = [
                        [{ text: "✅ အတည်ပြုပြီး တင်မည် (Upload)", callback_data: `confirm_draft_${pendingDraft.id}` }],
                        [{ text: "❌ မတင်တော့ပါ (Cancel)", callback_data: `cancel_draft_${pendingDraft.id}` }]
                    ];

                    await sendTelegramMsg(botToken, chatId, previewMsg, { inline_keyboard: inlineKeyboard });
                    return NextResponse.json({ ok: true });
                }
            }

            // --- UNKNOWN INPUT ---
            const inlineKeyboard = [
                [{ text: "🔗 အကောင့်ချိတ်မယ်", callback_data: "action_link_req" }],
                [{ text: "📝 စာတင်မယ်", callback_data: "action_publish_req" }]
            ];
            await sendTelegramMsg(botToken, chatId, "🤖 <b>လုပ်ဆောင်ချက် မရှင်းလင်းပါ။</b>\nကျေးဇူးပြု၍ အောက်ပါ Menu မှ ရွေးချယ်ပေးပါ -", { inline_keyboard: inlineKeyboard });
        }

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error("[TELEGRAM_WEBHOOK]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}