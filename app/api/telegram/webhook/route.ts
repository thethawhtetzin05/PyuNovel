import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { user, verification, telegramDrafts, novels, chapters } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { parseChaptersFromText } from "@/lib/utils";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = 'edge';

// Basic helper to send direct message to telegram (we don't import the lib one to keep it simple here)
async function sendTelegramMsg(chatId: string, text: string, replyMarkup?: any) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
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

async function editTelegramMsgText(chatId: string, messageId: number, text: string, replyMarkup?: any) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
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
    try {
        const db = getDb(getRequestContext().env.DB);
        const body = await req.json() as any;

        // --- 1. HANDLE CALLBACK QUERIES (Button Taps) ---
        if (body.callback_query) {
            const callback = body.callback_query;
            const chatId = callback.message.chat.id.toString();
            const messageId = callback.message.message_id;
            const data = callback.data as string; // format: "upload_novelId_draftId" OR "cancel_draftId"

            if (data.startsWith("cancel_")) {
                const draftId = data.split("_")[1];
                await db.delete(telegramDrafts).where(eq(telegramDrafts.id, draftId));
                await editTelegramMsgText(chatId, messageId, "❌ <i>Upload cancelled. Draft discarded.</i>");
                return NextResponse.json({ ok: true });
            }

            if (data.startsWith("upload_")) {
                const parts = data.split("_");
                const novelId = parseInt(parts[1]);
                const draftId = parts[2];

                // Ensure user exists
                const dbUser = await db.query.user.findFirst({ where: eq(user.telegramId, chatId) });
                if (!dbUser) return NextResponse.json({ ok: true });

                // Ensure they own the novel
                const novel = await db.query.novels.findFirst({
                    where: and(eq(novels.id, novelId), eq(novels.ownerId, dbUser.id))
                });

                if (!novel) {
                    await editTelegramMsgText(chatId, messageId, "❌ <i>Error: You do not have permission to publish to this novel.</i>");
                    return NextResponse.json({ ok: true });
                }

                // Load Draft
                const draft = await db.query.telegramDrafts.findFirst({ where: eq(telegramDrafts.id, draftId) });
                if (!draft) {
                    await editTelegramMsgText(chatId, messageId, "❌ <i>Error: Draft expired or already published. Please send the chapters again.</i>");
                    return NextResponse.json({ ok: true });
                }

                const parsedChapters = JSON.parse(draft.chaptersJson);

                // Find Max Index
                const lastChapter = await db.query.chapters.findFirst({
                    where: eq(chapters.novelId, novelId),
                    orderBy: [desc(chapters.sortIndex)],
                });
                let currentStartIndex = lastChapter ? Math.floor(lastChapter.sortIndex) + 1 : 1;

                // Insert Chapters
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

                await editTelegramMsgText(chatId, messageId, `✅ <b>Successfully published ${chaptersToInsert.length} chapters to "${novel.title}"!</b> 🎉`);

                // Ideally Revalidate Next.js cache here

                return NextResponse.json({ ok: true });
            }
            return NextResponse.json({ ok: true });
        }


        // --- 2. HANDLE TEXT MESSAGES ---
        if (body.message && body.message.text) {
            const chatId = body.message.chat.id.toString();
            const text = body.message.text.trim();

            // PHASE 1: Secure Linking Command `/start LINK-XXX`
            if (text.startsWith("/start")) {
                const parts = text.split(" ");

                if (parts.length === 1) {
                    await sendTelegramMsg(chatId, "👋 <b>Hello!</b>\n\nTo link your PyuNovel account, please use the linking command from your dashboard.\nExample: <code>/start ABCDEF</code>");
                    return NextResponse.json({ ok: true });
                }

                const token = parts[1];

                // Lookup token
                const verif = await db.query.verification.findFirst({
                    where: (v, { eq, and }) => and(
                        eq(v.id, token),
                        eq(v.identifier, "telegram")
                    )
                });

                if (!verif) {
                    await sendTelegramMsg(chatId, "❌ <b>Invalid or expired connection token.</b>\nPlease go to your PyuNovel account and generate a new one.");
                    return NextResponse.json({ ok: true });
                }

                if (new Date() > new Date(verif.expiresAt)) {
                    await db.delete(verification).where(eq(verification.id, token));
                    await sendTelegramMsg(chatId, "❌ <b>Token expired.</b>\nConnection tokens expire in 5 minutes. Please generate a new one.");
                    return NextResponse.json({ ok: true });
                }

                const userId = verif.value; // Recall we stored userId in the `value` column
                const from = body.message.from;
                const tgName = [from.first_name, from.last_name].filter(Boolean).join(" ");
                const tgUsername = from.username ? `@${from.username}` : null;

                // Unlink any other user who might have this Telegram ID (edge case)
                await db.update(user).set({
                    telegramId: null,
                    telegramUsername: null,
                    telegramName: null
                }).where(eq(user.telegramId, chatId));

                // Link new user
                await db.update(user).set({
                    telegramId: chatId,
                    telegramUsername: tgUsername,
                    telegramName: tgName
                }).where(eq(user.id, userId));
                await db.delete(verification).where(eq(verification.id, token));

                await sendTelegramMsg(chatId, `✅ <b>Account successfully connected!</b> 🚀\n\nConnected as: <b>${tgName}</b> ${tgUsername ? `(${tgUsername})` : ""}\n\nYou can now post chapters by simply sending your story text here directly.`);
                return NextResponse.json({ ok: true });
            }

            // PHASE 2: Chapter Draft Submission
            // We only respond to normal text if it's not a command.
            if (!text.startsWith("/")) {
                const dbUser = await db.query.user.findFirst({ where: eq(user.telegramId, chatId) });

                if (!dbUser) {
                    await sendTelegramMsg(chatId, "⚠️ <b>Your account is not connected.</b>\nPlease go to PyuNovel Dashboard > Settings to connect your Telegram account first.");
                    return NextResponse.json({ ok: true });
                }

                // Check roles if you only want writers... Handled implicitly by whether they own novels, but let's check
                if (dbUser.role !== 'admin' && dbUser.role !== 'writer') {
                    await sendTelegramMsg(chatId, "⚠️ You must be a Writer or Admin to publish chapters.");
                    return NextResponse.json({ ok: true });
                }

                const parsed = parseChaptersFromText(text);

                if (parsed.length === 0) {
                    await sendTelegramMsg(chatId, "❌ No chapters detected.\nMake sure your headings start with 'အပိုင်း (၁)' or 'အခန်း ၁'.");
                    return NextResponse.json({ ok: true });
                }

                // Get author's novels
                const authorNovels = await db.query.novels.findMany({
                    where: eq(novels.ownerId, dbUser.id),
                    orderBy: [desc(novels.updatedAt)],
                    limit: 10 // Max 10 buttons so it doesn't crowd UI
                });

                if (authorNovels.length === 0) {
                    await sendTelegramMsg(chatId, "❌ You don't have any novels yet! Please create one on the website first.");
                    return NextResponse.json({ ok: true });
                }

                // Save draft
                const draftId = globalThis.crypto.randomUUID();
                await db.insert(telegramDrafts).values({
                    id: draftId,
                    authorId: dbUser.id,
                    chaptersJson: JSON.stringify(parsed),
                    createdAt: new Date(),
                });

                // Construct preview text
                let previewMsg = `📖 <b>Preview: ${parsed.length} Chapter(s) Detected!</b>\n\n`;
                parsed.slice(0, 5).forEach((p: any, i: number) => {
                    const wordCount = p.content.trim().split(/\s+/).length;
                    previewMsg += `${i + 1}. ${p.title} <i>(${wordCount} words)</i>\n`;
                });
                if (parsed.length > 5) previewMsg += `... and ${parsed.length - 5} more.\n`;
                previewMsg += `\n<b>Which novel do you want to publish these to? 👇</b>`;

                // Construct Inline Keyboard
                const inlineKeyboard: any[][] = [];
                // Group buttons in pairs
                for (let i = 0; i < authorNovels.length; i += 2) {
                    const row = [];
                    row.push({ text: authorNovels[i].title, callback_data: `upload_${authorNovels[i].id}_${draftId}` });
                    if (authorNovels[i + 1]) {
                        row.push({ text: authorNovels[i + 1].title, callback_data: `upload_${authorNovels[i + 1].id}_${draftId}` });
                    }
                    inlineKeyboard.push(row);
                }
                // Add cancel button
                inlineKeyboard.push([{ text: "❌ Cancel", callback_data: `cancel_${draftId}` }]);

                await sendTelegramMsg(chatId, previewMsg, { inline_keyboard: inlineKeyboard });
                return NextResponse.json({ ok: true });
            }

            // Unknown Commands
            await sendTelegramMsg(chatId, "🤖 Unrecognized command.");
        }

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error("[TELEGRAM_WEBHOOK]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
