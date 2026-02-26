"use client";

import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Automatically report the error to Telegram
        const reportError = async () => {
            try {
                await fetch("/api/report", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: `Automated Crash Report: ${error.message}`,
                        url: window.location.href,
                        stack: error.stack,
                        userId: "Unknown (Crash)",
                    }),
                });
            } catch (err) {
                console.error("Failed to send automated error report:", err);
            }
        };

        reportError();
        console.error("Application Crash:", error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
            </div>
            <h1 className="text-3xl font-black text-[var(--foreground)] mb-3">Something went wrong!</h1>
            <p className="text-[var(--text-muted)] max-w-md mb-8">
                The application encountered an unexpected error. A report has been automatically sent to the developer.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={() => reset()}
                    className="h-12 px-8 bg-[var(--action)] hover:bg-[var(--action-hover)] text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-[var(--action)]/20"
                >
                    Try Again
                </button>
                <button
                    onClick={() => window.location.href = "/"}
                    className="h-12 px-8 bg-[var(--surface-2)] text-[var(--foreground)] border border-[var(--border)] font-bold rounded-xl hover:bg-[var(--surface)] transition-all active:scale-95"
                >
                    Go to Homepage
                </button>
            </div>
        </div>
    );
}
