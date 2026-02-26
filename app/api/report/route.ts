import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { sendTelegramMessage } from "@/lib/telegram";

export const runtime = 'edge';

export async function POST(request: NextRequest) {
    try {
        const { message, url, stack, userId, userEmail } = await request.json() as {
            message: string;
            url?: string;
            stack?: string;
            userId?: string;
            userEmail?: string;
        };

        const { env } = getRequestContext();

        const formattedMessage = [
            `<b>🚨 New Error Report</b>`,
            `<b>Message:</b> ${message}`,
            url ? `<b>URL:</b> ${url}` : null,
            userId ? `<b>User ID:</b> <code>${userId}</code>` : null,
            userEmail ? `<b>Email:</b> ${userEmail}` : null,
            stack ? `\n<b>Stack Trace:</b>\n<code>${stack.substring(0, 500)}...</code>` : null,
        ].filter(Boolean).join("\n");

        const result = await sendTelegramMessage(env, formattedMessage);

        if (!result.success) {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Report API Error:", error);
        return NextResponse.json({ success: false, error: "Internal Error" }, { status: 500 });
    }
}
