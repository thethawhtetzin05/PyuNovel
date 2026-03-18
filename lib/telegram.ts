/**
 * General utility to send messages via Telegram Bot API.
 */
export async function sendTelegramMessage(
    token: string,
    chatId: string,
    text: string,
    options: { parse_mode?: "HTML" | "MarkdownV2"; reply_markup?: any } = { parse_mode: "HTML" }
) {
    if (!token || !chatId) {
        console.error("Telegram credentials missing.");
        return { success: false, error: "Missing config" };
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                ...options,
            }),
        });

        const result = await response.json() as any;
        if (!result.ok) {
            console.error("Telegram API Error:", result);
            return { success: false, error: result.description };
        }
        return { success: true };
    } catch (error: any) {
        console.error("Failed to send Telegram message:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Specifically notify a writer via the Publisher Bot.
 */
export async function notifyWriter(
    db: any,
    env: any,
    writerId: string,
    message: string
) {
    const token = env.TELEGRAM_PUBLISHER_BOT_TOKEN;
    if (!token) return { success: false, error: "Missing bot token" };

    // Find writer's telegramId
    const writerRows = await db.query.user.findFirst({
        where: (user: any, { eq }: any) => eq(user.id, writerId),
        columns: { telegramId: true }
    });

    if (writerRows?.telegramId) {
        return await sendTelegramMessage(token, writerRows.telegramId, message);
    }

    return { success: false, error: "Writer has no telegramId linked" };
}
