import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/server-context";

export const runtime = 'edge';

export async function POST(request: NextRequest) {
    try {
        const { auth, env } = getServerContext();
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ success: false, error: "ဖိုင် မပါပါဘူး" }, { status: 400 });
        }

        // ဖိုင်နာမည် မထပ်အောင် ရှေ့က random နံပါတ်တစ်ခု ခံပေးလိုက်မယ်
        const fileName = `${crypto.randomUUID()}-${file.name}`;

        // File ကို ArrayBuffer ပြောင်းပြီး R2 ထဲ ထည့်မယ်
        const arrayBuffer = await file.arrayBuffer();

        await env.R2_BUCKET.put(fileName, arrayBuffer, {
            httpMetadata: {
                contentType: file.type,
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                url: `/api/file/${fileName}`,
                fileName: fileName
            }
        });

    } catch (error: any) {
        console.error("API upload error:", error);
        return NextResponse.json({
            success: false,
            error: error?.message || "Internal Server Error"
        }, { status: 500 });
    }
}
