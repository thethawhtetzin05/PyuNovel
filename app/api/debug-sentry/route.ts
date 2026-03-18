import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    // This will trigger a Sentry error if configured correctly
    throw new Error("Sentry Debug Error from Edge Runtime!");
}
