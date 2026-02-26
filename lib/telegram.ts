/**
 * Utility to send messages to a Telegram bot.
 * Sensitive tokens are fetched from environment variables.
 */
export async function sendTelegramMessage(env: any, text: string) {
    const token = env.TELEGRAM_BOT_TOKEN;
    const chatId = env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        console.error("Telegram credentials missing in environment variables.");
        return { success: false, error: "Missing config" };
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: "HTML",
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
